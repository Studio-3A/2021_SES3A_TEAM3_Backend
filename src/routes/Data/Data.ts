import express, { Request, Response } from 'express';
import { getWeatherForecastByLocation, getWeatherForecastByLongLat, WeatherDataResponse, WeatherLocationInput, WeatherLongLatInput } from '../../apiFetchers/weather';

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
