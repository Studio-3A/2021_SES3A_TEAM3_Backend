import fetch, { HeadersInit, BodyInit } from "node-fetch";
import { ErrorResponse, StatusCode, statusCodeIsSuccessful } from "../common/expresstypes"
import { Coordinate } from "../common/objects";
import keys from "../config/keys.json"

export enum HeadersType {
    Hotels,
    Flights,
}

export function createHeaders(type: HeadersType): HeadersInit {
    // if we need to make custom headers for anything, we can just do it here :)
    switch (type) {
        case HeadersType.Hotels:
            return {
                'x-rapidapi-key': keys.rapidapi,
                'x-rapidapi-host': "hotels4.p.rapidapi.com"
            };
        case HeadersType.Flights:
            return {
                'x-rapidapi-key': keys.rapidapi,
                'x-rapidapi-host': "skyscanner-skyscanner-flight-search-v1.p.rapidapi.com",
            }
        default:
            throw Error(`Unhandled header type ${type}`);
    }
}

type RequestMethod = "GET" | "POST";

export async function getContent<T>(url: string, errorMessage?: string, headers?: HeadersInit) {
    return makeRequest<T>("GET", url, errorMessage, headers);
}

export async function postContent<T>(url: string, errorMessage?: string, headers?: HeadersInit, body?: BodyInit) {
    return makeRequest<T>("POST", url, errorMessage, headers, body);
}

async function makeRequest<T>(method: RequestMethod, url: string, errorMessage?: string, headers?: HeadersInit, body?: BodyInit,) {
    let error: any;
    let status = StatusCode.BadRequest;
    try {
        // try fetch the data
        const response = await fetch(url, { method, headers, body });

        // cast the json into the proper type if successful
        if (statusCodeIsSuccessful(response.status)) return await response.json() as T;
        else {
            try {
                error = await response.json() as any;
            } catch (e) {

            }
        }
        // if it fails, we'll take note of the status code
        status = response.status;

    } catch (e) {
        // if we got an error, let's track that too
        console.error(e);
        error = e;
    }

    // we'll be here if either the status code wasn't 2**, or if some exception was thrown :/
    if (errorMessage == null) errorMessage = `Request to ${url} failed.`
    return ErrorResponse(status, errorMessage, error);
}

export const distanceBetweenTwoCoordinates = (x: Coordinate, y: Coordinate) => {  // generally used geo measurement function
    const R = 6378.137; // Radius of earth in KM
    const rads = Math.PI / 180;
    const dLat = (y.lat - x.lat) * rads * 0.5;
    const dLon = (y.lng - x.lng) * rads * 0.5;
    const dLatSin = Math.sin(dLat);
    const dLonSin = Math.sin(dLon);
    const a = dLatSin * dLatSin + Math.cos(x.lat * rads) * Math.cos(y.lat * rads) * dLonSin * dLonSin;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d * 1000; // meters
}

export const getMidpointBetweenTwoCoordinates = (x: Coordinate, y: Coordinate): Coordinate => {  // generally used geo measurement function
    return { lat: (x.lat + y.lat) * 0.5, lng: (x.lng + y.lng) * 0.5 }
}

export type GoogleResponseStatus = "OK" | "ZERO_RESULTS" | "OVER_QUERY_LIMIT" | "REQUEST_DENIED" | "INVALID_REQUEST" | "UNKNOWN_ERROR";
