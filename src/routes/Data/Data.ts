import express, { Request, Response } from 'express';
import { getWeatherForecastByLocation, getWeatherForecastByLongLat, WeatherLocationInput } from '../../apiFetchers/weather';
import { getHotelLocations, getHotelsByLocation, HotelLocationInput, HotelDetailsInput } from '../../apiFetchers/hotel';
import { getFlights, FlightRequest } from '../../apiFetchers/flight'
import { getPlacesByLocation, NearbyPlacesInput } from '../../apiFetchers/place';
import { DirectionsRequest, getDirections } from "../../apiFetchers/directions";
import { Coordinate } from '../../common/objects';

export const dataRouter = express.Router({
  strict: true,
});

dataRouter.get('/weather/location', async (req: Request<unknown, unknown, unknown, WeatherLocationInput>, res: Response) => {
  const locationInput: WeatherLocationInput = req.query;
  const forecastData = await getWeatherForecastByLocation(locationInput);
  res.send(forecastData);
});

dataRouter.get('/weather/coordinates', async (req: Request<unknown, unknown, unknown, Coordinate>, res: Response) => {
  const longLatInput: Coordinate = req.query;
  const forecastData = await getWeatherForecastByLongLat(longLatInput);
  res.send(forecastData);
});

dataRouter.get('/hotel/location', async (req: Request<unknown, unknown, unknown, HotelLocationInput>, res: Response) => {
  const locationInput: HotelLocationInput = req.query;
  // res.send(locationInput);
  const hotelData = await getHotelLocations(locationInput);
  res.send(hotelData);
});

dataRouter.get('/hotel/details', async (req: Request<unknown, unknown, unknown, HotelDetailsInput>, res: Response) => {
  const hotelInput: HotelDetailsInput = req.query;
  const hotelData = await getHotelsByLocation(hotelInput);
  res.send(hotelData);
});

dataRouter.get('/place/nearby', async (req: Request<unknown, unknown, unknown, NearbyPlacesInput>, res: Response) => {
  const nearbyInput: NearbyPlacesInput = req.query;
  const placesData = await getPlacesByLocation(nearbyInput);
  res.send(placesData);
});

dataRouter.post("/directions", async (req: Request<unknown, unknown, DirectionsRequest, unknown>, res: Response) => {
  const input = req.body;
  const directions = await getDirections(input);
  res.send(directions);
});

dataRouter.get('/flight', async (req: Request<unknown, unknown, unknown, FlightRequest>, res: Response) => {
  const flightRequest: FlightRequest = req.query;
  const flightDetails = await getFlights(flightRequest);
  res.send(flightDetails);
})
