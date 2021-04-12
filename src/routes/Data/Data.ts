import express, { Request, Response } from 'express';
import { getWeatherForecastByLocation, getWeatherForecastByLongLat, WeatherLocationInput, WeatherLongLatInput } from '../../apiFetchers/weather';
import { getHotelLocations, getHotelsByLocation, HotelLocationInput, HotelDetailsInput, getHotelDetails } from '../../apiFetchers/hotel';
import { getFlights, FlightRequest } from '../../apiFetchers/flight'
import { getPlacesByLocation, NearbyPlacesInput } from '../../apiFetchers/place';
import { getAtoBTrip, RoutingInput, RoutingRequest } from '../../apiFetchers/transport';
import { ErrorResponse, StatusCode } from '../../common/expresstypes';

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

dataRouter.post("/transport/atob", async (req: Request<unknown, unknown, RoutingInput, unknown>, res: Response) => {
  // TODO - JUSTIN - probably check date formats and only allow UTC
  const input = req.body;
  const departAfter = new Date(input.departAfter).getTime();
  const arriveBefore = new Date(input.arriveBefore).getTime()
  if (isNaN(departAfter) || isNaN(arriveBefore)) {
    const err: ErrorResponse = { status: StatusCode.BadRequest, errorMessage: "Invalid date values" }
    res.send(err)
  } else {
    const data: RoutingRequest = {
      to: input.to,
      from: input.from,
      departAfter,
      arriveBefore,
      // modes should be retrieved on app load and refreshed every so often instead of being hardcoded...
      modes: [
        "pt_pub",
        "wa_wal"
        // "pt_sch", "cy_bic", "ps_tax", "me_car", "me_mot",
      ],
      conc: false,
      bestOnly: false,
      allModes: true
    }
    const aToBTrip = await getAtoBTrip(data);
    res.send(aToBTrip);
  }
});

dataRouter.get('/flight', async(req: Request<unknown, unknown, unknown, FlightRequest>, res: Response) => {
  const flightRequest = req.query;
  const flightDetails= await getFlights(flightRequest);
  res.send(flightDetails);
})