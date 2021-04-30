import { RAPIDAPI_KEY } from "../config/constants";
import { HeadersInit } from "node-fetch";

export enum HeadersType {
    Hotels,
    Flights,
}

export function createHeaders(type: HeadersType): HeadersInit {
    // if we need to make custom headers for anything, we can just do it here :)
    switch (type) {
        case HeadersType.Hotels:
            return {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': "hotels4.p.rapidapi.com"
            };
        case HeadersType.Flights:
            return {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': "skyscanner-skyscanner-flight-search-v1.p.rapidapi.com",
            }
        default:
            throw Error(`Unhandled header type ${type}`);
    }
}

export type GoogleResponseStatus = "OK" | "ZERO_RESULTS" | "OVER_QUERY_LIMIT" | "REQUEST_DENIED" | "INVALID_REQUEST" | "UNKNOWN_ERROR";
