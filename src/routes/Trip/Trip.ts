import express, { Request, Response } from 'express';
import { getPlacesByLocation, getRefinedPlaces, NearbyPlacesInput, Place, RefinedPlaces } from '../../apiFetchers/place';
import {
  handleError, isErrorResponse, StatusCode, StatusCodeError,
  coordinatesAreValid, distanceBetweenTwoCoordinates, getMidpointBetweenTwoCoordinates,
  Activity, TripGenerationInputs, Trip
} from 'travelogue-utility';

export const tripRouter = express.Router({
  strict: true,
});

tripRouter.post('/new', async (req: Request<unknown, unknown, TripGenerationInputs, unknown>, res: Response) => {
  try {
    const input = req.body;
    CheckInputIsValid(input);

    const { startLocation, endLocation, startDate, endDate } = input;
    let radius = distanceBetweenTwoCoordinates(startLocation, endLocation) * 0.75;

    // TODO: If radius is more than 5000m, split the journey up instead of using a centre
    radius = radius > 25000 ? 25000 : radius;
    // not sure if 2000m should be the min radius heh
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
    const trip: Trip = { trip: generateTrip(actual, startDate, endDate) };

    res.send(trip);
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

const generateTrip = (places: RefinedPlaces, start: number, end: number) => {
  const addedPlaces = new Set<string>();
  const minDuration = 30;
  let maxDuration = end - start > 180 ? 180 : end - start;
  const activities: Activity[] = [];
  let time = start;
  let timeSinceFood = 0;
  let currentPlace: Place | undefined;
  let prevPlace: Place | undefined;
  let nonFoodIndex = 0;
  let foodIndex = 0;
  const numFoodPlaces = places.food.length;
  const numNonFoodPlaces = places.nonFood.length;
  while (time <= end - maxDuration && (foodIndex < numFoodPlaces || nonFoodIndex < numNonFoodPlaces)) {
    let currentPlaceDidChange = false;
    if (currentPlace) prevPlace = { ...currentPlace };

    const randomDuration = Math.ceil(Math.random() * (maxDuration - minDuration) + minDuration);
    const duration = roundUpToNearest10(randomDuration);

    if (duration < 0) break;

    const nonFoodPlacesLeft = nonFoodIndex < numNonFoodPlaces;

    // if it's been a while since a meal, or if there are no nonfood places left, just choose another food place
    if ((timeSinceFood > 180 || !nonFoodPlacesLeft) && foodIndex < numFoodPlaces) {
      currentPlaceDidChange = true;
      currentPlace = places.food[foodIndex];
      ++foodIndex;
      timeSinceFood = 0;
    } else if (nonFoodPlacesLeft) {
      currentPlaceDidChange = true;
      currentPlace = places.nonFood[nonFoodIndex];
      ++nonFoodIndex;
      timeSinceFood += duration;
    }

    if (currentPlaceDidChange && currentPlace) {
      // only add the place if we haven't visited it already
      if (!addedPlaces.has(currentPlace.name)) {
        activities.push({
          types: currentPlace.types,
          name: currentPlace.name,
          rating: currentPlace.rating,
          price: currentPlace.price_level,
          location: currentPlace.vicinity,
          duration,
          time,
          place_id: currentPlace.place_id
        });
        addedPlaces.add(currentPlace.name)

        time += duration;

        if (currentPlace && prevPlace) {
          const travelDist = distanceBetweenTwoCoordinates(currentPlace.geometry.location, prevPlace.geometry.location);
          // assume the time taken to travel just the total distance travelled at 50km/hr
          time += roundUpToNearest10(Math.ceil(travelDist / 50));
        }
      }
    }

    maxDuration = end - time > 180 ? 180 : end - time;
  }

  return activities;
}

const roundUpToNearest10 = (num: number) => Math.ceil(num * 0.1) * 10;
