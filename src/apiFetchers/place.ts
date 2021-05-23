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
    lodging: Place[];
}

export const getRefinedPlaces = (places: Place[]): RefinedPlaces => {
    const organisedPlaces: RefinedPlaces = { food: [], nonFood: [], lodging: [] };
    const usedPlaceIds = new Set<string>();
    places.forEach(place => {
        const types = place.types;
        // if there are no types OR if a business status is defined and it isn't operational, return
        if (types == null || types.length === 0 || (place.business_status && place.business_status !== "OPERATIONAL")) {
            return;
        }
        const notAPlaceToAvoid = !types.find(t => PLACES_TO_NOT_GO.has(t));
        if (notAPlaceToAvoid && !usedPlaceIds.has(place.place_id)) {
            for (const type of types) {
                if (PLACES_TO_GO.has(type)) {
                    // if its a place we want to go to, make sure if the place a food place by rechecking types
                    // TODO: simplify the check to make it not O(n*m)
                    if (isPlaceToStay(types)) {
                        organisedPlaces.lodging.push(place);
                        usedPlaceIds.add(place.place_id);
                    } else if (types.find(t => FOOD_PLACES_TO_GO.has(t))) {
                        organisedPlaces.food.push(place);
                        usedPlaceIds.add(place.place_id);
                    } else {
                        organisedPlaces.nonFood.push(place);
                        usedPlaceIds.add(place.place_id);
                    }
                    break;

                }
            }
        }
    });

    return organisedPlaces;
}

const isPlaceToStay = (types: PlaceType[]): boolean => {
    return types.length === 3 &&
        types.find(t => t === "lodging") != null &&
        types.find(t => t === "point_of_interest") != null &&
        types.find(t => t === "establishment") != null;
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
    plus_code?: {
        compound_code?: string;
        global_code?: string;
    },
    reference: string;
    types: PlaceType[];
    vicinity: string;
    price_level?: Price;
    rating?: number;
}

export type BusinessStatus = "OPERATIONAL" | "CLOSED_TEMPORARILY" | "CLOSED_PERMANENTLY";

export const FOOD_PLACES_TO_GO: Set<PlaceType> = new Set<PlaceType>(['restaurant', 'bakery', 'cafe', 'meal_takeaway']);

export const PLACES_TO_GO: Set<PlaceType> = new Set<PlaceType>(['amusement_park', 'aquarium', 'art_gallery', 'movie_theater', 'restaurant', 'museum', 'park', 'tourist_attraction', 'zoo',
    'bakery', 'spa', 'cafe', 'library', 'night_club', 'campground', 'bowling_alley', 'city_hall', 'landmark', 'natural_feature', 'lodging', 'point_of_interest', 'establishment']);

export const PLACES_TO_NOT_GO: Set<PlaceType> = new Set<PlaceType>(['school', 'primary_school', 'secondary_school', 'hardware_store', 'post_box', 'post_office',
    'veterinary_care', 'supermarket', 'car_repair', 'hospital', 'funeral_home', 'real_estate_agency', 'train_station', 'transit_station', 'taxi_stand',
    'travel_agency', 'store', 'car_dealer', 'car_rental', 'convenience_store', 'gas_station', 'finance', 'home_goods_store', 'furniture_store', 'storage']);

export interface Photo {
    height: number;
    html_attribution: [];
    photo_reference: string;
    width: number;
}
