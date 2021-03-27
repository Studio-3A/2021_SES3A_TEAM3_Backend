import keys from './keys.json';
import { WeatherDataResponse, WeatherLongLatInput, WeatherLocationInput } from "./weatherbitTypes";
import { getContent } from "./utility";

const weatherbitUrl: string = 'https://api.weatherbit.io/v2.0/forecast/daily';

const getWeatherForecast = async (params: string) => {
  return await getContent<WeatherDataResponse>(`${weatherbitUrl}?${params}`, "Getting the weather failed.");
};

//Example: getWeatherForecastByLocation("New York", "US", 7);
export const getWeatherForecastByLocation = (location: WeatherLocationInput) => {
  return getWeatherForecast(
    `key=${keys.weatherbit}&city=${location.city}&country=${location.country}&days=${location.days}`
  );
};

//Example: getWeatherForecastByLongLat(-78.543, 38.123)
export const getWeatherForecastByLongLat = (longLat: WeatherLongLatInput) => {
  return getWeatherForecast(
    `key=${keys.weatherbit}&lat=${longLat.latitude}&lon=${longLat.longitude}`
  );
};
