import keys from './keys.json';

const getWeatherForecast = async (params: string) => {
  const url: string = 'https://api.weatherbit.io/v2.0/forecast/daily';
  const forecastData: JSON = await fetch(`${url}?${params}`).then((resp) =>
    resp.json()
  );
  return forecastData;
};

//Example: getWeatherForecastByLocation("New York", "US", 7);
const getWeatherForecastByLocation = (
  city: string,
  country: string,
  days: number
) => {
  return getWeatherForecast(
    `key=${keys.weatherbit}&city=${city}&country=${country}&days=${days}`
  );
};

//Example: getWeatherForecastByLongLat(-78.543, 38.123)
const getWeatherForecastByLongLat = (longitude: number, latitude: number) => {
  return getWeatherForecast(
    `key=${keys.weatherbit}&lat=${latitude}&lon=${longitude}`
  );
};

export default {
  getWeatherForecastByLocation,
  getWeatherForecastByLongLat,
};
