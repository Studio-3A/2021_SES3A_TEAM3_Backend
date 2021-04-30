import * as de from "dotenv";
de.config();
// ^ sets it up so the env can actually be read

// Server config constants
export const PORT = process.env.PORT || 4000;
export const HOST = process.env.HOST || "localhost";
export const PROTOCOL = process.env.PROTOCOL || "http";

// API keys
export const TRIPGO_KEY = process.env.TRIPGO_KEY || "OI_USE_A_KEY";
export const WEATHERBIT_KEY = process.env.WEATHERBIT_KEY || "OI_USE_A_KEY";
export const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "OI_USE_A_KEY";
export const GOOGLE_DIRECTIONS_KEY = process.env.GOOGLE_DIRECTIONS_KEY || "OI_USE_A_KEY";
export const GOOGLE_PLACES_KEY = process.env.GOOGLE_PLACES_KEY || "OI_USE_A_KEY";

// Database stuff
export const DATABASE = {
    HOST: process.env.DATABASE_HOST || "database",
    NAME: process.env.DATABASE_NAME || "test",
    USERNAME: process.env.DATABASE_USERNAME || "root",
    PASSWORD: process.env.DATABASE_PASSWORD || "password",
};

export const DATABASE_CONNECTION_STRING = process.env.DATABASE_CONNECTION_STRING || "OI_USE_A_DB_STRING";