import express, { Request, Response } from 'express';
import { getPlacesByLocation, getRefinedPlaces, NearbyPlacesInput, Place, PlaceType, RefinedPlaces } from '../../apiFetchers/place';
import {
  handleError, isErrorResponse, StatusCode, StatusCodeError,
  Coordinate, coordinatesAreValid, distanceBetweenTwoCoordinates, getMidpointBetweenTwoCoordinates
} from 'travelogue-utility';

export const tripRouter = express.Router({
  strict: true,
});

interface TripGenerationInputs {
  numberOfPeople?: number; // optional bc we dont use them right now
  budget?: number;
  startDate: number;
  endDate: number;
  startLocation: Coordinate;
  endLocation: Coordinate;

}

interface Trip {
  trip: Activity[];
}

tripRouter.post('/new', async (req: Request<unknown, unknown, TripGenerationInputs, unknown>, res: Response) => {
  try {
    const input = req.body;
    CheckInputIsValid(input);

    const { startLocation, endLocation, startDate, endDate } = input;
    const radius = distanceBetweenTwoCoordinates(startLocation, endLocation) * 0.4;
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

interface Activity {
  name: string,
  price?: number,
  location: string,
  description?: string,
  time: number,
  duration: number;
  people?: string,
  rating?: number,
  types: PlaceType[];
}

const generateTrip = (places: RefinedPlaces, start: number, end: number) => {
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
  while (time <= end - maxDuration) {
    let currentPlaceDidChange = false;
    if (currentPlace) prevPlace = { ...currentPlace };
    const duration = Math.ceil(Math.random() * (maxDuration - minDuration) + minDuration);
    time += duration;
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
      activities.push({
        types: currentPlace.types,
        name: currentPlace.name,
        rating: currentPlace.rating,
        price: currentPlace.price_level,
        location: currentPlace.vicinity,
        duration,
        time
      });

      if (currentPlace && prevPlace) {
        const travelDist = distanceBetweenTwoCoordinates(currentPlace.geometry.location, prevPlace.geometry.location);
        // assume the time taken to travel just the total distance travelled at 50km/hr
        time += Math.ceil(travelDist / 50);
      }
    }

    maxDuration = end - time > 180 ? 180 : end - time;
  }

  return activities;
}
