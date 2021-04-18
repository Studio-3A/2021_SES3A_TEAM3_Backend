import { HandleErrorResponse as HandleError, StatusCode, StatusCodeError } from '../common/expresstypes';
import { Coordinate, coordinatesAreValid } from '../common/objects';
import keys from '../config/keys.json';
import { getContent } from "./utility";

const weatherbitUrl: string = `https://api.weatherbit.io/v2.0/forecast/daily?key=${keys.weatherbit}`;

const getWeatherForecast = async (params: string) => {
  return await getContent<WeatherDataResponse>(`${weatherbitUrl}&${params}`, "Getting the weather failed.");
};

//Example: getWeatherForecastByLocation("New York", "US", 7);
export const getWeatherForecastByLocation = (location: WeatherLocationInput) => {
  try {
    checkWeatherLocationInputIsValid(location);
    return getWeatherForecast(`city=${location.city}&country=${location.country}&days=${location.days}`);
  } catch (e) {
    return HandleError(e);
  }
};

//Example: getWeatherForecastByLongLat(-78.543, 38.123)
export const getWeatherForecastByLongLat = (longLat: Coordinate) => {
  try {
    checkCoordinateInputIsValid(longLat);
    return getWeatherForecast(`lat=${longLat.lat}&lon=${longLat.lng}`);
  } catch (e) {
    return HandleError(e);
  }
};

const checkWeatherLocationInputIsValid = (input: WeatherLocationInput) => {
  if (input.city == null || input.country == null || input.days == null) {
    throw new StatusCodeError(StatusCode.BadRequest, "City, country and days must be defined");
  }
}

const checkCoordinateInputIsValid = (input: Coordinate) => {
  if (!coordinatesAreValid(input)) {
    throw new StatusCodeError(StatusCode.BadRequest, "Latitude and longitude must be defined for coordinates");
  }
}

export interface WeatherLocationInput {
  city?: string,
  country?: string,
  days?: number
}

// from https://www.weatherbit.io/api/weather-forecast-16-day
export interface WeatherDataResponse {
  lon: string,
  lat: string,
  timezone: string,
  city_name: string,
  country_code: string,
  state_code: string,
  data: WeatherData[];
}

export interface WeatherData {
  valid_date: string;
  ts: number;
  datetime: string;
  wind_gust_spd: number,
  wind_spd: number,
  wind_dir: number,
  wind_cdir: string,
  wind_cdir_full: string,
  temp: number,
  max_temp: number,
  min_temp: number,
  high_temp: number,
  low_temp: number,
  app_max_temp: number,
  app_min_temp: number,
  pop: number,
  precip: number,
  snow: number,
  snow_depth: number,
  slp: number,
  pres: number,
  dewpt: number,
  rh: number,
  weather: {
    icon: string,
    code: string,
    description: string
  },
  pod: string,
  clouds_low: number,
  clouds_mid: number,
  clouds_hi: number,
  clouds: number,
  vis: number,
  max_dhi: number,
  uv: number,
  moon_phase: number,
  moon_phase_lunation: number,
  moonrise_ts: number,
  moonset_ts: number,
  sunrise_ts: number,
  sunset_ts: number
}
