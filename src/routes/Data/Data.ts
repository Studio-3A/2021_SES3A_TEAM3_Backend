import express, { Request, Response } from 'express';
import { getWeatherForecastByLocation, getWeatherForecastByLongLat, WeatherDataResponse, WeatherLocationInput, WeatherLongLatInput } from '../../apiFetchers/weather';
import { getHotelLocations, getHotelsByLocation, HotelLocationInput, HotelDetailsInput, getHotelDetails } from '../../apiFetchers/hotel';
import { getPlaces, getPlacesByLocation, NearbyPlacesInput } from '../../apiFetchers/place';

export const dataRouter = express.Router({
  strict: true,
});

dataRouter.get('/weather/location', async (req: Request<unknown, unknown, unknown, WeatherLocationInput>, res: Response) => {
  const locationInput: WeatherLocationInput = req.query;
  const forecastData = await getWeatherForecastByLocation(locationInput);
  res.send(forecastData);
});

dataRouter.get('/weather/coordinates', async (req: Request<unknown, unknown, unknown, WeatherLongLatInput>, res: Response) => {
  const longLatInput: WeatherLongLatInput = req.query;
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
