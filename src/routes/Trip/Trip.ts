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

redis.createClient(process.env.REDIS_URL)
console.log("Client Attached to Redis at " + process.env.REDIS_URL)

let redis_client: redis.RedisClient | undefined; 

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

const RADIUS_MAX = 25000;

interface SegmentStore {
  startLocation: Coordinate;
  endLocation: Coordinate;
  timePerPart: number;
  places: RefinedPlaces | undefined;
}

const constructTrip = async (input: TripGenerationInputs): Promise<Trip> => {
  const { startLocation, endLocation, startDate, endDate, tripName } = input;

  const distance = distanceBetweenTwoCoordinates(startLocation, endLocation);
  const midPoint = getMidpointBetweenTwoCoordinates(startLocation, endLocation);

  // gets the number of splits, rounded to the nearest even number
  const numSegments = Math.round((distance / RADIUS_MAX) * 0.5) * 2;
  const placesPerPart: SegmentStore[] = [];

  if (numSegments < 4) {
    const timePerPart = roundMsUpToNearest10Minutes(endDate - startDate);
    placesPerPart.push({ startLocation, endLocation, timePerPart, places: undefined });
  } else if (numSegments < 8) {
    const timePerPart = roundMsUpToNearest10Minutes((endDate - startDate) * 0.5);
    placesPerPart.push({ startLocation, endLocation: midPoint, timePerPart, places: undefined });
    placesPerPart.push({ startLocation: midPoint, endLocation, timePerPart, places: undefined });
  } else { //} if (numSegments < 16) {
    const point1 = getMidpointBetweenTwoCoordinates(startLocation, midPoint);
    const point2 = getMidpointBetweenTwoCoordinates(midPoint, endLocation);
    const timePerPart = roundMsUpToNearest10Minutes((endDate - startDate) * 0.25);
    placesPerPart.push({ startLocation, endLocation: point1, timePerPart, places: undefined });
    placesPerPart.push({ startLocation: point1, endLocation: midPoint, timePerPart, places: undefined });
    placesPerPart.push({ startLocation: midPoint, endLocation: point2, timePerPart, places: undefined });
    placesPerPart.push({ startLocation: point2, endLocation, timePerPart, places: undefined });
  }

  const getPlacesForPoint = async (
    placesSoFar: Place[], point: Coordinate, pagetoken?: string, iteration = 1
  ): Promise<Place[]> => {
    if (iteration > 4 || iteration > 1 && pagetoken == null) {
      return placesSoFar;
    }
    let places = await getPlacesByLocation({ ...point, radius: RADIUS_MAX, queryByPrice: false, pagetoken });
    if (!isErrorResponse(places)) {
      placesSoFar = placesSoFar.concat(places.results);
      if (places.next_page_token) {
        const tempPlaces = await getPlacesForPoint(placesSoFar, point, places.next_page_token, iteration + 1);
        placesSoFar = [...placesSoFar, ...tempPlaces];
      }
    } else if (iteration === 1) {
      // if we're on the first iteration and it fails, it means something went a bit strange
      // probably a missing/invalid API key
      throw new StatusCodeError(places.status, places.errorMessage ? places.errorMessage : "");
    }

    return placesSoFar;
  }

  for (let i = 0; i < placesPerPart.length; ++i) {
    const { startLocation: partStartLocation, endLocation: partEndLocation } = placesPerPart[i];
    const partMidPoint = getMidpointBetweenTwoCoordinates(partStartLocation, partEndLocation);
    const places = await getPlacesForPoint([], partMidPoint);
    const refinedPlaces: RefinedPlaces = getRefinedPlaces([...places]);
    placesPerPart[i].places = { ...refinedPlaces };
  }


  const initialTimeZone = getTimezone(startLocation.lat, startLocation.lng);
  const [activities, waypoints] = generateTrip(placesPerPart, startDate, endDate, initialTimeZone);

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
  } else if (startDate >= endDate) {
    throw new StatusCodeError(StatusCode.BadRequest, "Start time cannot be after end time");
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
const MS_IN_AN_HOUR = 60 * 60 * 1000;
/** The min duration of an activity in ms */
const MIN_ACTIVITY_DURATION = 0.5 * MS_IN_AN_HOUR;
/** The max duration of an activity in ms */
const MAX_ACTIVITY_DURATION = 3 * MS_IN_AN_HOUR;

const generateTrip = (placesPerPart: SegmentStore[], start: number, end: number, initialTimeZone: string): [Activity[], string[]] => {
  // round off start/end times
  const startMoment = momentTz(start).tz(initialTimeZone);
  const endMoment = momentTz(start).tz(initialTimeZone);

  start = roundMsUpToNearest10Minutes(start - (startMoment.hours() - 7) * MS_IN_AN_HOUR);
  end = roundMsUpToNearest10Minutes(end + (22 - endMoment.hours()) * MS_IN_AN_HOUR);

  let runningTime = start;
  let activities: Activity[] = [];
  const placeIds = new Set<string>();
  const placeNames = new Set<string>();

  let timeRemainder = 0;

  for (let i = 0; i < placesPerPart.length; i++) {
    const { startLocation, endLocation, places, timePerPart } = placesPerPart[i];
    if (places == null) {
      continue;
    }
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

    const nonLodgingPlaces = [...places.nonFood, ...places.food];
    let firstPlaceStart: Place | undefined;
    let sIndex = 0;
    let minDistFromStart = Infinity;
    let firstPlaceEnd: Place | undefined;
    let eIndex = 0;
    let minDistFromEnd = Infinity;

    for (let i = 0; i < nonLodgingPlaces.length; ++i) {
      const distFromStart = distanceBetweenTwoCoordinates(startLocation, nonLodgingPlaces[i].geometry.location);
      if (distFromStart < minDistFromStart) {
        minDistFromStart = distFromStart;
        sIndex = i;
      }
      const distFromEnd = distanceBetweenTwoCoordinates(endLocation, nonLodgingPlaces[i].geometry.location);
      if (distFromEnd < minDistFromEnd) {
        minDistFromEnd = distFromEnd;
        eIndex = i;
      }
    }

    firstPlaceStart = nonLodgingPlaces[sIndex];
    firstPlaceEnd = nonLodgingPlaces[eIndex];

    /** The time since the last food place was chosen in ms */
    let timeSinceFoodStart = 0;
    let timeSinceFoodEnd = 0;
    // just keeps track of the last 
    let currentPlaceStart: Place | undefined;
    let currentPlaceEnd: Place | undefined;

    let timezone = initialTimeZone;
    let { food: foodPlaces, nonFood: nonFoodPlaces, lodging: lodgingPlaces } = places;
    let timeFromStartMarker = 0;
    let timeFromEndMarker = timePerPart + timeRemainder;
    let goingStartToEnd = false;
    const startActivities: Activity[] = [];
    const endActivities: Activity[] = [];
    while (timeFromEndMarker - timeFromStartMarker > MAX_ACTIVITY_DURATION && (foodPlaces.length > 0 || nonFoodPlaces.length > 0)) {
      goingStartToEnd = !goingStartToEnd;
      const foodPlacesLeft = foodPlaces.length > 0;
      const nonFoodPlacesLeft = nonFoodPlaces.length > 0;
      const lodgePlacesLeft = lodgingPlaces.length > 0;

      let currentPlace: Place | undefined;
      let prevPlace: Place | undefined;
      let timeSinceFood = goingStartToEnd ? timeSinceFoodStart : timeSinceFoodEnd;

      let duration = roundMsUpToNearest10Minutes(
        Math.random() * (MAX_ACTIVITY_DURATION - MIN_ACTIVITY_DURATION) + MIN_ACTIVITY_DURATION
      );

      if (goingStartToEnd && firstPlaceStart) {
        currentPlace = firstPlaceStart;
        firstPlaceStart = undefined;
      } else if (!goingStartToEnd && firstPlaceEnd) {
        currentPlace = firstPlaceEnd;
        firstPlaceEnd = undefined
      }

      if (currentPlace == null) {
        if (goingStartToEnd && currentPlaceStart) {
          prevPlace = { ...currentPlaceStart };
          currentPlaceStart = undefined;
        } else if (!goingStartToEnd && currentPlaceEnd) {
          prevPlace = { ...currentPlaceEnd };
          currentPlaceEnd = undefined;
        }

        if (prevPlace) {
          timezone = getTimezone(prevPlace.geometry.location.lat, prevPlace.geometry.location.lng);
        }

        // if it's after 8pm or before 7am, lets find a place to crash
        const moment = momentTz(
          runningTime + (goingStartToEnd ? timeFromStartMarker : timeFromEndMarker)
        ).tz(timezone);
        const hoursPast24 = moment.hours();
        if ((hoursPast24 > 20 || hoursPast24 < 7) && lodgePlacesLeft) {
          const result = findClosestPlace(lodgingPlaces, prevPlace, leastDistanceMap);
          lodgingPlaces = [...result.updatedPlaces];
          if (result.place) {
            currentPlace = { ...result.place };
            const extraHours = hoursPast24 < 12 ? 2 : 24 - hoursPast24;
            duration = (7 + extraHours) * MS_IN_AN_HOUR;
            timeSinceFood = duration;
          }
        } else {
          // if it's been a while since a meal, or if there are no nonfood places left, just choose another food place
          if ((timeSinceFood > 3 * MS_IN_AN_HOUR || !nonFoodPlacesLeft) && foodPlacesLeft) {
            const result = findClosestPlace(foodPlaces, prevPlace, leastDistanceMap);
            foodPlaces = [...result.updatedPlaces];
            if (result.place != null) {
              currentPlace = { ...result.place };
              timeSinceFood = 0;
            }
          } else if (nonFoodPlacesLeft) {
            const result = findClosestPlace(nonFoodPlaces, prevPlace, leastDistanceMap);
            nonFoodPlaces = [...result.updatedPlaces];
            if (result.place != null) {
              currentPlace = { ...result.place };
              timeSinceFood += duration;
            }
          }
        }
      }

      if (currentPlace) {
        // only add the place if we haven't visited it already
        if (!placeIds.has(currentPlace.place_id) && !placeNames.has(currentPlace.name)) {
          const { types, name, rating, price_level, vicinity, place_id, plus_code } = currentPlace;
          placeIds.add(place_id);
          placeNames.add(name);

          let timeTravelling = 0;
          if (currentPlace && prevPlace) {
            const travelDist = tryGetDistance(currentPlace, prevPlace, leastDistanceMap)
              || distanceBetweenTwoCoordinates(currentPlace.geometry.location, prevPlace.geometry.location);
            // assume the time taken to travel just the total distance travelled at 50km/hr
            timeTravelling = roundMsUpToNearest10Minutes((travelDist / 50000) * MS_IN_AN_HOUR);
          }

          const time =
            runningTime + (goingStartToEnd ? timeFromStartMarker : timeFromEndMarker - (duration + timeTravelling));
          // plus_code.compound_code looks like 
          const generalLocation = plus_code?.compound_code ?
            plus_code.compound_code.substring(plus_code.compound_code.indexOf(" ") + 1) : "";
          const activity: Activity = {
            types,
            name,
            duration,
            time,
            place_id,
            rating,
            price: price_level,
            location: vicinity,
            generalLocation
          };

          if (goingStartToEnd) {
            startActivities.push(activity);
            currentPlaceStart = { ...currentPlace };
            timeFromStartMarker += (duration + timeTravelling);
            timeSinceFoodStart = timeSinceFood;
          } else {
            endActivities.push(activity);
            currentPlaceEnd = { ...currentPlace };
            timeFromEndMarker -= (duration + timeTravelling);
            timeSinceFoodEnd = timeSinceFood;
          }
        }
      }
    }

    timeRemainder = timeFromEndMarker - timeFromStartMarker > 0 ? timeFromEndMarker - timeFromStartMarker : 0;
    runningTime += timeFromStartMarker;
    activities = [...activities, ...startActivities, ...endActivities.reverse()];
  }

  return [activities, Array.from(placeIds)];
}

const tenMinutesInMs = 10 * 60 * 1000;
const roundMsUpToNearest10Minutes = (num: number): number => Math.ceil(num / tenMinutesInMs) * tenMinutesInMs;
