import { getContent } from "./utility";
import keys from '../config/keys.json';
import { Coordinate } from "../common/objects";

const nearbyPlacesSearchUrl = "https://maps.googleapis.com/maps/api/place/nearbysearch/output?";

export const getPlaces = async (params: string) => {
    return await getContent<PlacesDataResponse>(`${nearbyPlacesSearchUrl}?${params}`, "failed to find any nearby places.");
};

export const getPlacesByLocation = (details: NearbyPlacesInput) => {
    return getPlaces(
        `key=${keys.placesbit}&location=${details.location.lat},${details.location.lng}&radius=${details.radius}`
    );
};

export interface NearbyPlacesInput {
    location: Coordinate;
    radius: string
};

export interface PlacesDataResponse {
    results: [
        {
            geometry: {
                location: Coordinate
            },
            icon: string
            name: string
            opening_hours: {
                open_now: true
            },
            photos: [
                {
                    height: number
                    html_attribution: [],
                    photo_reference: string
                    width: number
                }
            ],
            place_id: string
            reference: string
            types: string[]
            vicinity: string
        }
    ]
    status: string
}