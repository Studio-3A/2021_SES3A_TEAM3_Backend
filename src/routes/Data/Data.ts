import express, { Request, Response } from 'express';
import location from '../../apiFetchers/location';

export const dataRouter = express.Router({
  strict: true,
});

//remove this comment later: before you get mad about the "any", I spent ages trying to get it working with a more explicit type...
dataRouter.get('/weather/location', async (req: Request, res: Response) => {
  const { city, country, days }: any = req.query;
  const forecastData: JSON = await location.getWeatherForecastByLocation(
    city,
    country,
    days
  );
  res.send(forecastData);
});

dataRouter.get('/weather/coordinates', async (req: Request, res: Response) => {
  const { long, lat }: any = req.query;
  const forecastData: JSON = await location.getWeatherForecastByLongLat(
    long,
    lat
  );
  res.send(forecastData);
});
