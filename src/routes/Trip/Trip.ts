import express, { Request, Response } from 'express';
import { v4 } from "uuid";
import { getPlacesByLocation, getRefinedPlaces, NearbyPlacesInput, Place, RefinedPlaces } from '../../apiFetchers/place';
import {
  handleError, isErrorResponse, StatusCode, StatusCodeError,
  coordinatesAreValid, distanceBetweenTwoCoordinates, getMidpointBetweenTwoCoordinates,
  Activity, TripGenerationInputs, Trip, Coordinate, DirectionsResponse
} from 'travelogue-utility';
import { getDirections } from '../../apiFetchers/directions';

// timezone stuff
import getTimezone from "tz-lookup";
import momentTz from 'moment-timezone';

//Redis Server
import redis from 'redis';

let redis_client: redis.RedisClient | undefined; //redis.createClient(6379)

export const tripRouter = express.Router({
  strict: true,
});

tripRouter.post('/new', async (req: Request<unknown, unknown, TripGenerationInputs, unknown>, res: Response) => {
  try {
    const input = req.body;
    checkInputIsValid(input);
    const { startLocation, endLocation } = input;

    // Initial example key
    const key = `(${startLocation.lat},${startLocation.lng}), (${endLocation.lat},${endLocation.lng})`;

    // At the moment just a direct check
    // TODO: Allow for "similar trips" to be retrievable via cache
    if (redis_client) {
      redis_client.get(key, async (err, result) => {
        if (err == null && result != null) {
          return res.send(result);
        } else {
          const trip = await constructTrip(input);
          // Save trip into redis cache
          redis_client?.set(key, JSON.stringify(trip))
          return res.send(trip);
        }
      })
    } else {
      const trip = await constructTrip(input);
      res.send(trip);
    }

  } catch (e) {
    res.send(handleError(e));
  }
});

const constructTrip = async (input: TripGenerationInputs): Promise<Trip> => {
  const { startLocation, endLocation, startDate, endDate, tripName } = input;

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
    } else if (iteration = 1) {
      // if we're on the first iteration and it fails, it means something went a bit strange
      // probably a missing API key
      throw new StatusCodeError(places.status, places.errorMessage ? places.errorMessage : "");
    }
  }

  await getPlaces(true);
  await getPlaces(false);

  const actual: RefinedPlaces = getRefinedPlaces(allPlaces);

  const initialTimeZone = getTimezone(startLocation.lat, startLocation.lng);
  const [activities, waypoints] = generateTrip(actual, startDate, endDate, initialTimeZone);

  let directions: DirectionsResponse[] = [];

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
      origin, destination, travelModes: ["driving"],
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

  return { trip: activities, tripId: v4(), directions, tripName };
}

const checkInputIsValid = (input: TripGenerationInputs): void => {
  const { startLocation, endLocation, startDate, endDate } = input;
  if (!coordinatesAreValid(startLocation) || !coordinatesAreValid(endLocation)) {
    throw new StatusCodeError(StatusCode.BadRequest, "Start location and end location must be defined");
  } else if (startDate == null || endDate == null) {
    throw new StatusCodeError(StatusCode.BadRequest, "Start time and end time must be defined");
  }
}

const findClosestPlace = (
  places: Place[], currentPlace: Place | undefined, map: Map<string, number>
): { place: Place | undefined, updatedPlaces: Place[] } => {
  let minDistance = Infinity;

  // if the provided current place was undefined, just choose the first one
  if (currentPlace == null && places.length > 0) {
    places.splice(0, 1);
    return { place: places[0], updatedPlaces: places };
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

  // if there's only 1 place left and it's the current location (almost impossible), remove it :)
  if (places.length === 1 && places[0].place_id === currentPlace?.place_id) {
    // TODO: fix the bug that leads to this condition
    places = [];
  }

  return { place: newPlace, updatedPlaces: [...places] };
}

const tryGetDistance = (place1: Place, place2: Place, map: Map<string, number>): number | undefined => {
  return map.get([place1.place_id, place2.place_id].sort().join("-"));
}

/**The number of milliseconds in an hour */
const msInAnHour = 60 * 60 * 1000;

const generateTrip = (places: RefinedPlaces, start: number, end: number, initialTimeZone: string): [Activity[], string[]] => {
  // do some heavy calcs so we know the distance between each location
  const leastDistanceMap = new Map<string, number>();
  const allplaces = [...places.nonFood, ...places.food, ...places.lodging];

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

  const placeIds = new Set<string>();
  /** The min duration of an activity in ms */
  const minDuration = 0.5 * msInAnHour;
  /** The max duration of an activity in ms */
  const maxDuration = 3 * msInAnHour;
  const activities: Activity[] = [];
  let time = start;
  /** The time since the last food place was chosen in ms */
  let timeSinceFood = 0;

  let currentPlace: Place | undefined;
  let prevPlace: Place | undefined;
  let timezone = initialTimeZone;
  let { food: foodPlaces, nonFood: nonFoodPlaces, lodging: lodgingPlaces } = places;

  while (end - time >= minDuration && (foodPlaces.length > 0 || nonFoodPlaces.length > 0)) {
    const foodPlacesLeft = foodPlaces.length > 0;
    const nonFoodPlacesLeft = nonFoodPlaces.length > 0;
    const lodgePlacesLeft = lodgingPlaces.length > 0;

    if (currentPlace) {
      prevPlace = { ...currentPlace };
      timezone = getTimezone(currentPlace.geometry.location.lat, currentPlace.geometry.location.lng);
      currentPlace = undefined;
    }

    const randomDuration = Math.ceil(Math.random() * (maxDuration - minDuration) + minDuration);
    let duration = roundMsUpToNearest10Minutes(randomDuration);
    if (duration < 0) {
      break;
    }

    // if it's after 8pm or before 7am, lets find a place to crash
    const moment = momentTz(time).tz(timezone);
    const hoursPast24 = moment.hours();
    if ((hoursPast24 > 20 || hoursPast24 < 7) && lodgePlacesLeft) {
      const result = findClosestPlace(lodgingPlaces, currentPlace, leastDistanceMap);
      lodgingPlaces = [...result.updatedPlaces];
      if (result.place) {
        currentPlace = { ...result.place };
        const extraHours = hoursPast24 < 12 ? 2 : 24 - hoursPast24;
        duration = (7 + extraHours) * msInAnHour;
        timeSinceFood = duration;
      }
    } else {
      // if it's been a while since a meal, or if there are no nonfood places left, just choose another food place
      if ((timeSinceFood > 3 * msInAnHour || !nonFoodPlacesLeft) && foodPlacesLeft) {
        const result = findClosestPlace(foodPlaces, currentPlace, leastDistanceMap);
        foodPlaces = [...result.updatedPlaces];
        if (result.place != null) {
          currentPlace = { ...result.place };
          timeSinceFood = 0;
        }
      } else if (nonFoodPlacesLeft) {
        const result = findClosestPlace(nonFoodPlaces, currentPlace, leastDistanceMap);
        nonFoodPlaces = [...result.updatedPlaces];
        if (result.place != null) {
          currentPlace = { ...result.place };
          timeSinceFood += duration;
        }
      }
    }

    if (currentPlace) {
      // only add the place if we haven't visited it already
      if (!placeIds.has(currentPlace.place_id)) {
        const { types, name, rating, price_level, vicinity, place_id } = currentPlace;
        activities.push({
          types, name, duration, time, place_id,
          rating: rating,
          price: price_level,
          location: vicinity,
        });

        placeIds.add(place_id);
        time += duration;

        if (currentPlace && prevPlace) {
          const travelDist = tryGetDistance(currentPlace, prevPlace, leastDistanceMap)
            || distanceBetweenTwoCoordinates(currentPlace.geometry.location, prevPlace.geometry.location);
          // assume the time taken to travel just the total distance travelled at 50km/hr
          const timeTravelling = roundMsUpToNearest10Minutes((travelDist / 50000) * msInAnHour);
          time += timeTravelling;
        }
      }
    }
  }

  return [activities, Array.from(placeIds)];
}

const tenMinutesInMs = 10 * 60 * 1000;
const roundMsUpToNearest10Minutes = (num: number): number => Math.ceil(num / tenMinutesInMs) * tenMinutesInMs;
