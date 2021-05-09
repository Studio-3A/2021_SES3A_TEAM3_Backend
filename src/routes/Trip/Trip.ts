import express, { Request, Response } from 'express';
import { v4 } from "uuid";
import { getPlacesByLocation, getRefinedPlaces, NearbyPlacesInput, Place, RefinedPlaces } from '../../apiFetchers/place';
import {
  handleError, isErrorResponse, StatusCode, StatusCodeError,
  coordinatesAreValid, distanceBetweenTwoCoordinates, getMidpointBetweenTwoCoordinates,
  Activity, TripGenerationInputs, Trip, Coordinate, DirectionsResponse
} from 'travelogue-utility';
import { getDirections } from '../../apiFetchers/directions';
import { redis_client } from '../..';

export const tripRouter = express.Router({
  strict: true,
});

tripRouter.post('/new', async (req: Request<unknown, unknown, TripGenerationInputs, unknown>, res: Response) => {
  try {
    const input = req.body;
    CheckInputIsValid(input);

    // Initial example key 
    // TODO: Negatives will cause problems, will need to write conditional
    const key = req.body.startLocation.lat * req.body.startLocation.lng + 
                req.body.endLocation.lat * req.body.endLocation.lng

    // At the moment just a direct check
    // TODO: Allow for "similar trips" to be retrievable via cache
    redis_client.get(key, async (err: object, result: object) => {
      if (err == null && result != null) {
        return res.send(result);
      } else {
        const { startLocation, endLocation, startDate, endDate } = input;
        let radius = distanceBetweenTwoCoordinates(startLocation, endLocation) * 0.75;
    
        // TODO: If radius is more than 25000m, split the journey up instead of using a centre
        radius = radius > 25000 ? 25000 : radius;
        // not sure if 15000m should be the min radius heh
        radius = radius < 15000 ? 15000 : radius;
    
        const centre = getMidpointBetweenTwoCoordinates(startLocation, endLocation);
        const placesInput: NearbyPlacesInput = { ...centre, radius, queryByPrice: false };
        let allPlaces: Place[] = [];
    
        const getPlaces = async (queryByPrice: boolean, pagetoken?: string, iteration = 1) => {
          if (iteration > 4) return;
          let places = await getPlacesByLocation({ ...placesInput, queryByPrice, pagetoken });
          if (!isErrorResponse(places)) {
            allPlaces = allPlaces.concat(places.results);
            if (places.next_page_token) {
              await getPlaces(queryByPrice, places.next_page_token, iteration + 1);
            }
          }
        }
    
        await getPlaces(true);
        await getPlaces(false);
    
        const actual = getRefinedPlaces(allPlaces);
        const [activities, waypoints] = generateTrip(actual, startDate, endDate);
        let directions: DirectionsResponse[] | undefined = [];
    
        // if there are more than 25 waypoints (including start and dest)
        // send separate requests
    
        // start the first request from our actual start
        let origin: Coordinate | string = startLocation;
    
        // if there are more than 23 waypoints (excluding start and dest)
        // we'll have to deal with them 23 at a time - or just use their length if we're not over the max
        let spliceLen = waypoints.length > 23 ? 23 : waypoints.length;
    
        // end the first request from the last possible waypoint if we're over the max
        // or just use the actual end location
        let destination: Coordinate | string = waypoints.length > 23 ? waypoints[spliceLen] : endLocation;
    
        while (waypoints.length > 0) {
          const response = await getDirections({
            origin, destination, travelModes: ["driving", "walking"],
            waypoints: waypoints.splice(0, spliceLen)
          });
          // if anything happens to go wrong, just don't do anything I guess
          if (isErrorResponse(response)) { break; }
    
          directions.push(response)
          // make the new start location the old end location
          origin = destination;
          if (waypoints.length < 23) {
            // if there are less than 23 waypoints, use whatever we have left
            // and make sure the end location is actual end location
            spliceLen = waypoints.length;
            destination = endLocation;
          } else {
            destination = waypoints[spliceLen];
          }
        }

        const trip: Trip = { trip: activities, tripId: v4(), directions };

        // Save trip into redis cache
        redis_client.set(key, JSON.stringify(trip))

        return res.send(trip);

      }
    })
  } catch (e) {
    res.send(handleError(e));
  }
});

const CheckInputIsValid = (input: TripGenerationInputs) => {
  const { startLocation, endLocation, startDate, endDate } = input;
  if (!coordinatesAreValid(startLocation) || !coordinatesAreValid(endLocation)) {
    throw new StatusCodeError(StatusCode.BadRequest, "Start location and end location must be defined");
  } else if (startDate == null || endDate == null) {
    throw new StatusCodeError(StatusCode.BadRequest, "Start time and end time must be defined");
  }
}

const findClosestPlace = (places: Place[], currentPlace: Place | undefined, map: Map<string, number>): { success: boolean, place: Place | undefined, updatedPlaces: Place[] } => {
  let minDistance = Infinity;

  // if the provided current place was undefined, just choose the first one
  if (currentPlace == null && places.length > 0) {
    places.splice(0, 1);
    return { success: true, place: places[0], updatedPlaces: places };
  }

  // try find the place closest to the current place
  let minIndex = -1;
  for (let i = 0; (i < places.length) && currentPlace; i++) {
    if (places[i].place_id !== currentPlace.place_id) {
      const distance = tryGetDistance(currentPlace, places[i], map);
      if (distance && (distance <= minDistance)) {
        minDistance = distance;
        minIndex = i
      }
    }
  }

  const success = minIndex !== -1;
  let newPlace: Place | undefined;
  if (success) {
    newPlace = places[minIndex];
    places.splice(minIndex, 1);
  }

  return { success, place: newPlace, updatedPlaces: [...places] };
}

const tryGetDistance = (place1: Place, place2: Place, map: Map<string, number>): number | undefined => {
  return map.get([place1.place_id, place2.place_id].sort().join("-"));
}

const generateTrip = (places: RefinedPlaces, start: number, end: number): [Activity[], string[]] => {
  // do some heavy calcs so we know the distance between each location
  const leastDistanceMap = new Map<string, number>();
  const allplaces = [...places.nonFood, ...places.food];
  for (const place1 of allplaces) {
    for (const place2 of allplaces) {
      let result = tryGetDistance(place1, place2, leastDistanceMap);
      if (place1.place_id !== place2.place_id && !result) {
        // if we have no result for the distance between the two places, we'll add an entry
        result = distanceBetweenTwoCoordinates(place1.geometry.location, place2.geometry.location);
        leastDistanceMap.set([place1.place_id, place2.place_id].sort().join("-"), result);
      }
    }
  }

  const addedPlaces = new Set<string>();
  const placeIds: string[] = [];
  const minDuration = 30;
  let maxDuration = end - start > 180 ? 180 : end - start;
  const activities: Activity[] = [];
  let time = start;
  let timeSinceFood = 0;
  let currentPlace: Place | undefined;
  let prevPlace: Place | undefined;

  let { food: foodPlaces, nonFood: nonFoodPlaces } = places;
  while (time <= end - maxDuration && (foodPlaces.length > 0 || nonFoodPlaces.length > 0)) {
    const foodPlacesLeft = foodPlaces.length > 0;
    const nonFoodPlacesLeft = nonFoodPlaces.length > 0;

    let currentPlaceDidChange = false;
    if (currentPlace) {
      prevPlace = { ...currentPlace };
    }

    const randomDuration = Math.ceil(Math.random() * (maxDuration - minDuration) + minDuration);
    const duration = roundUpToNearest10(randomDuration);
    if (duration < 0) {
      break;
    }

    // if it's been a while since a meal, or if there are no nonfood places left, just choose another food place
    if ((timeSinceFood > 180 || !nonFoodPlacesLeft) && foodPlacesLeft) {
      const result = findClosestPlace(foodPlaces, currentPlace, leastDistanceMap);
      if (result.success && result.place != null) {
        currentPlaceDidChange = true;
        foodPlaces = [...result.updatedPlaces];
        currentPlace = { ...result.place };
        timeSinceFood = 0;
      } else if (foodPlaces.length === 1 && foodPlaces[0].place_id === currentPlace?.place_id) {
        // TODO: fix the bug that leads to this condition
        foodPlaces = [];
      }
    } else if (nonFoodPlacesLeft) {
      const result = findClosestPlace(nonFoodPlaces, currentPlace, leastDistanceMap);
      if (result.success && result.place != null) {
        currentPlaceDidChange = true;
        nonFoodPlaces = [...result.updatedPlaces];
        currentPlace = { ...result.place };
        timeSinceFood += duration;
      } else if (nonFoodPlaces.length === 1 && nonFoodPlaces[0].place_id === currentPlace?.place_id) {
        // TODO: fix the bug that leads to this condition
        nonFoodPlaces = [];
      }
    }

    if (currentPlaceDidChange && currentPlace) {
      // only add the place if we haven't visited it already
      if (!addedPlaces.has(currentPlace.name)) {
        const { types, name, rating, price_level, vicinity, place_id } = currentPlace;
        activities.push({
          types, name, duration, time, place_id,
          rating: rating,
          price: price_level,
          location: vicinity,
        });

        addedPlaces.add(name)
        placeIds.push(place_id);
        time += duration;

        if (currentPlace && prevPlace) {
          const travelDist = tryGetDistance(currentPlace, prevPlace, leastDistanceMap)
            || distanceBetweenTwoCoordinates(currentPlace.geometry.location, prevPlace.geometry.location);
          // assume the time taken to travel just the total distance travelled at 50km/hr
          time += roundUpToNearest10(Math.ceil(travelDist / 50));
        }
      }
    }

    maxDuration = end - time > 180 ? 180 : end - time;
  }

  return [activities, placeIds];
}

const roundUpToNearest10 = (num: number) => Math.ceil(num * 0.1) * 10;
