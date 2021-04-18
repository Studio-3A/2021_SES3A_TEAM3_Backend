import { getContent, GoogleResponseStatus } from "./utility";
import keys from '../config/keys.json';
import { Coordinate } from "../common/objects";
import { BadRequest, isErrorResponse } from "../common/expresstypes";

const nearbyPlacesSearchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=${keys.placesbit}`;

const getPlaces = async (params: string) => {
    const resp = await getContent<PlacesDataResponse>(`${nearbyPlacesSearchUrl}&${params}`, "Failed to find any nearby places.");
    // google may return valid responses but the responses themselves may have actual non-ok responses
    if (!isErrorResponse(resp) && resp.status !== "OK" && resp.status !== "ZERO_RESULTS") return BadRequest(resp.status, resp);
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
        if (types == null || types.length === 0) return;
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

type BusinessStatus = "OPERATIONAL" | "CLOSED_TEMPORARILY" | "CLOSED_PERMANENTLY";

type PlaceType = QueryPlaceType | AdditionalResultPlaceType;

type QueryPlaceType = 'accounting' | 'airport' | 'atm' | 'bank' | 'bar' | 'beauty_salon' | 'bicycle_store' | 'book_store'
    | 'bus_station' | 'car_dealer' | 'car_rental' | 'car_repair' | 'car_wash' | 'casino' | 'cemetery' | 'church' | 'clothing_store' | 'convenience_store'
    | 'courthouse' | 'dentist' | 'department_store' | 'doctor' | 'drugstore' | 'electrician' | 'electronics_store' | 'embassy' | 'fire_station' | 'florist' | 'funeral_home' | 'furniture_store'
    | 'gas_station' | 'gym' | 'hair_care' | 'hardware_store' | 'hindu_temple' | 'home_goods_store' | 'hospital' | 'insurance_agency' | 'jewelry_store' | 'laundry' | 'lawyer'
    | 'light_rail_station' | 'liquor_store' | 'local_government_office' | 'locksmith' | 'meal_delivery' | 'mosque' | 'movie_rental' | 'moving_company'
    | 'painter' | 'parking' | 'pet_store' | 'pharmacy' | 'physiotherapist' | 'plumber' | 'police' | 'post_office' | 'primary_school' | 'real_estate_agency' | 'lodging'
    | 'roofing_contractor' | 'rv_park' | 'school' | 'secondary_school' | 'shoe_store' | 'shopping_mall' | 'stadium' | 'storage' | 'store' | 'subway_station' | 'supermarket'
    | 'synagogue' | 'taxi_stand' | 'train_station' | 'transit_station' | 'travel_agency' | 'university' | 'veterinary_care' | PlacesToGo;

type PlacesToGo = 'restaurant' | 'bakery' | 'cafe' | 'meal_takeaway' | NonFoodPlacesToGo;

const FOOD_PLACES_TO_GO: PlaceType[] = ['restaurant', 'bakery', 'cafe', 'meal_takeaway'];

type NonFoodPlacesToGo = 'amusement_park' | 'aquarium' | 'art_gallery' | 'movie_theater' | 'museum' | 'park' | 'tourist_attraction' | 'zoo' | 'spa' | 'library' | 'night_club' | 'campground' | 'bowling_alley'
    | 'city_hall';

const PLACES_TO_GO: PlaceType[] = ['amusement_park', 'aquarium', 'art_gallery', 'movie_theater', 'restaurant', 'museum', 'park', 'tourist_attraction', 'zoo',
    'bakery', 'spa', 'cafe', 'library', 'night_club', 'campground', 'bowling_alley', 'city_hall', 'landmark', 'natural_feature', 'lodging'];

type AdditionalResultPlaceType = 'administrative_area_level_1' | 'administrative_area_level_2' | 'administrative_area_level_3' | 'administrative_area_level_4' | 'administrative_area_level_5'
    | 'archipelago' | 'colloquial_area' | 'continent' | 'country' | 'establishment' | 'finance' | 'floor' | 'food' | 'general_contractor' | 'geocode' | 'health' | 'intersection' | 'landmark'
    | 'locality' | 'natural_feature' | 'neighborhood' | 'place_of_worship' | 'plus_code' | 'point_of_interest' | 'political' | 'post_box' | 'postal_code' | 'postal_code_prefix' | 'postal_code_suffix'
    | 'postal_town' | 'premise' | 'room' | 'route' | 'street_address' | 'street_number' | 'sublocality' | 'sublocality_level_1' | 'sublocality_level_2' | 'sublocality_level_3' | 'sublocality_level_4'
    | 'sublocality_level_5' | 'subpremise' | 'town_square';

export interface Photo {
    height: number;
    html_attribution: [];
    photo_reference: string;
    width: number;
}
