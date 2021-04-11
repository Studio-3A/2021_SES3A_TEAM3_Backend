import { getContent } from "./utility";
import keys from '../config/keys.json';

const nearbyPlacesSearchUrl = "https://maps.googleapis.com/maps/api/place/nearbysearch/output?";

export const getPlaces = async (params: string) => {
    return await getContent<PlacesDataResponse>(`${nearbyPlacesSearchUrl}?${params}`, "failed to find any nearby places.", true);
};

export const getPlacesByLocation = (details: NearbyPlacesInput) => {
    return getPlaces(
        `key=${keys.placesbit}&location=${details.location.lat},${details.location.lng}&radius=${details.radius}`
        );
};

export interface NearbyPlacesInput {
    location: NearbyPlacesLatLng
    radius: String
};

export interface NearbyPlacesLatLng {
    lat: String
    lng: String
}

export interface PlacesDataResponse {
    results: [
        { 
            geometry: {
                location: {
                    lat: Number
                    lng: Number
                }
            },
            icon: String
            name: String
            opening_hours: {
                open_now: true
            },
            photos: [
                {
                    height: Number
                    html_attribution: [],
                    photo_reference: String
                    width: Number
                }
            ],
            place_id: String
            reference: String
            types: String[]
            vicinity: String
        }
    ]
    status: String
}