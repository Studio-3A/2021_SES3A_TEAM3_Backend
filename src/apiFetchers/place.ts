import { Coordinate, badRequest, isErrorResponse, getContent, PlaceType, PlacesToGo } from "travelogue-utility";
import { GOOGLE_PLACES_KEY } from "../config/constants";
import { GoogleResponseStatus } from "./utility";

const nearbyPlacesSearchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=${GOOGLE_PLACES_KEY}`;

const getPlaces = async (params: string) => {
    const resp = await getContent<PlacesDataResponse>({ url: `${nearbyPlacesSearchUrl}&${params}`, errorMessage: "Failed to find any nearby places." });
    // google may return valid responses but the responses themselves may have actual non-ok responses
    if (!isErrorResponse(resp) && resp.status !== "OK" && resp.status !== "ZERO_RESULTS") return badRequest(resp.status, resp);
    return resp;
};

export const getPlacesByLocation = (details: NearbyPlacesInput) => {
    const params: string[] = [];
    // if there's a page token, it means we want the rest of the results of a previous response
    if (details.pagetoken != null) params.push(`pagetoken=${details.pagetoken}`);
    else {
        params.push(`location=${encodeURIComponent(details.lat + "," + details.lng)}`);
        params.push(`radius=${details.radius || 1000}`);
        if (details.queryByPrice) {
            params.push(`minprice=${details.minPrice || 0}`);
            params.push(`maxprice=${details.maxPrice || 4}`);
        }
        if (details.type != null) params.push(`type=${details.type}`);
    }
    return getPlaces(params.join("&"));
};

export interface RefinedPlaces {
    food: Place[];
    nonFood: Place[];
}

export const getRefinedPlaces = (places: Place[]) => {
    const organisedPlaces: RefinedPlaces = { food: [], nonFood: [] };
    places.forEach(place => {
        const types = place.types;
        // if there are no types OR if a business status is defined and it isn't operational, return
        if (types == null || types.length === 0 || (place.business_status && place.business_status !== "OPERATIONAL")) return;
        for (const type of types) {
            const weWantToGoToThisPlace = PLACES_TO_GO.find(t => t === type);
            if (weWantToGoToThisPlace) {
                // if its a place we want to go to, make sure if the place a food place by rechecking types
                // TODO: simplify the check to make it not O(n*m)
                if (types.find(t => FOOD_PLACES_TO_GO.find(food => food === t))) organisedPlaces.food.push(place);
                else organisedPlaces.nonFood.push(place);
                break;
            }
        }
    });

    return organisedPlaces;
}

export interface NearbyPlacesInput extends Coordinate {
    radius?: number, //distance in metres
    type?: PlacesToGo,
    pagetoken?: string;
    queryByPrice: boolean;
    minPrice?: Price;
    maxPrice?: Price;
};

type Price = 0 | 1 | 2 | 3 | 4;

export interface PlacesDataResponse {
    results: Place[];
    status: GoogleResponseStatus;
    next_page_token?: string;
}

export interface Place {
    business_status?: BusinessStatus;
    geometry: {
        location: Coordinate;
    },
    icon: string;
    name: string;
    opening_hours: {
        open_now: boolean;
    },
    photos: Photo[];
    place_id: string;
    reference: string;
    types: PlaceType[];
    vicinity: string;
    price_level?: Price;
    rating?: number;
}

export type BusinessStatus = "OPERATIONAL" | "CLOSED_TEMPORARILY" | "CLOSED_PERMANENTLY";

export const FOOD_PLACES_TO_GO: PlaceType[] = ['restaurant', 'bakery', 'cafe', 'meal_takeaway'];

export const PLACES_TO_GO: PlaceType[] = ['amusement_park', 'aquarium', 'art_gallery', 'movie_theater', 'restaurant', 'museum', 'park', 'tourist_attraction', 'zoo',
    'bakery', 'spa', 'cafe', 'library', 'night_club', 'campground', 'bowling_alley', 'city_hall', 'landmark', 'natural_feature', 'lodging'];

export interface Photo {
    height: number;
    html_attribution: [];
    photo_reference: string;
    width: number;
}
