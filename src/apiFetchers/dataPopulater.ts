import express, { Request, Response } from 'express';
import { getPlacesByLocation, getRefinedPlaces, NearbyPlacesInput, Place, PlaceType, RefinedPlaces } from '../../apiFetchers/place';
import { distanceBetweenTwoCoordinates, getMidpointBetweenTwoCoordinates } from '../../apiFetchers/utility';
import { BadRequest, HandleErrorResponse, isErrorResponse, StatusCode, StatusCodeError } from '../../common/expresstypes';
import { Coordinate, coordinatesAreValid } from '../../common/objects';
import apolloServer from '../Apollo';
import { getDirections } from './directions';

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

// For initial purposes assume only Sydney -> Melbourne is expected
// PsuedoCode Example based on trip generator algo
const populateTripData = () => {
    const radius = distanceBetweenTwoCoordinates(Coordinate, Coordinate) * 0.4;
    const centre = getMidpointBetweenTwoCoordinates(Coordinate, Coordinate);
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
    
    var i
    for (i = 0; i < actual.length; i++) {
        const update = async updatePlaces(root, actual) {
            return models.Place.update({
                actual.mapping(update)
            })
        }
    }

    const getDirections = async (queryByPrice: boolean, pagetoken?: string, iteration = 1) => {
        if (iteration > 4) return;
        let places = await getDirections({ ...placesInput, queryByPrice, pagetoken });
        if (!isErrorResponse(places)) {
        allPlaces = allPlaces.concat(places.results);
        if (places.next_page_token) {
            await getDirection(queryByPrice, places.next_page_token, iteration + 1);
        }
        }
    }

    await getDirections(true);
    await getDirections(false);

    const actual = getDirections(directions);
    
    var i
    for (i = 0; i < actual.length; i++) {
        const update = async updateDirections(root, actual) {
            return models.Directions.update({
                actual.mapping(update)
            })
        }
    }

    const getFlights = async (queryByPrice: boolean, pagetoken?: string, iteration = 1) => {
        if (iteration > 4) return;
        let places = await getFlights({ ...placesInput, queryByPrice, pagetoken });
        if (!isErrorResponse(places)) {
        allPlaces = allPlaces.concat(places.results);
        if (places.next_page_token) {
            await getFlight(queryByPrice, places.next_page_token, iteration + 1);
        }
        }
    }

    await getFlights(true);
    await getFlights(false);
    const actual = getFlights(directions);
    
    var i
    for (i = 0; i < actual.length; i++) {
        const update = async updateFlights(root, actual) {
            return models.Flight.update({
                actual.mapping(update)
            })
        }
    }

    const getHotels = async (queryByPrice: boolean, pagetoken?: string, iteration = 1) => {
        if (iteration > 4) return;
        let places = await getHotels({ ...placesInput, queryByPrice, pagetoken });
        if (!isErrorResponse(places)) {
        allPlaces = allPlaces.concat(places.results);
        if (places.next_page_token) {
            await getHotel(queryByPrice, places.next_page_token, iteration + 1);
        }
        }
    }

    await getHotels(true);
    await getHotels(false);
    const actual = getHotels(directions);
    
    var i
    for (i = 0; i < actual.length; i++) {
        const update = async updateHotels(root, actual) {
            return models.updateHotel.update({
                actual.mapping(update)
            })
        }
    }

}


