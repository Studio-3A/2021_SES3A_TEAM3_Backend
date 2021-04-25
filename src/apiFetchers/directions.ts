import {
    badRequest, handleError, isErrorResponse, StatusCode, StatusCodeError, getContent,
    Coordinate, coordinatesAreValid
} from "travelogue-utility";
import { GoogleResponseStatus } from "./utility";
import keys from '../config/keys.json';

const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?key=${keys.directions}`;

const DEFAULT_UNIT: DistanceUnit = "metric";

export const getDirections = async (req: DirectionsRequest) => {
    try {
        DirectionsRequestIsValid(req);
        const params: string[] = [];
        let tempParams: string[] = [];

        params.push(`origin=${encodeURIComponent(req.origin.lat + "," + req.origin.lng)}`
            + `&destination=${encodeURIComponent(req.destination.lat + "," + req.destination.lng)}`);
        params.push(`units=${req.unit || DEFAULT_UNIT}`);

        if (req.arrivalTime != null) {
            params.push(`arrival_time=${req.arrivalTime}`);
        } else if (req.departureTime != null) {
            params.push(`departure_time=${req.departureTime}`);
        }

        if (req.routingPreferences != null) {
            tempParams = [];
            const { fewerTransfers, lessWalking } = req.routingPreferences;
            if (fewerTransfers) tempParams.push("fewer_transfers");
            if (lessWalking) tempParams.push("less_walking");
            if (tempParams.length > 0) params.push(`transit_routing_preferences=${encodeURIComponent(tempParams.join("|"))}`);
        }

        if (req.avoid != null) {
            tempParams = [];
            const { tolls, highways, ferries, indoor } = req.avoid;
            if (tolls) tempParams.push("tolls");
            if (highways) tempParams.push("highways");
            if (ferries) tempParams.push("ferries");
            if (indoor) tempParams.push("indoor");
            if (tempParams.length > 0) params.push(`transit_routing_preferences=${encodeURIComponent(tempParams.join("|"))}`);
        }

        if (req.transitModes != null && req.transitModes.length > 0) params.push(`transit_mode=${req.transitModes.join("|")}`);
        if (req.travelModes != null && req.travelModes.length > 0) params.push(`&mode=${req.travelModes.join("|")}`);
        const url = `${directionsUrl + "&" + params.join("&")}`;
        const errorMessage = "Getting directions failed.";
        const resp = await getContent<DirectionsResponse>({ url, errorMessage });
        if (!isErrorResponse(resp) && resp.status !== "OK" && resp.status !== "ZERO_RESULTS") return badRequest(resp.status, resp);
        return resp;
    } catch (e) {
        return handleError(e);
    }
};

const DirectionsRequestIsValid = (req: DirectionsRequest) => {
    if (req.arrivalTime != null && req.departureTime != null) {
        throw new StatusCodeError(StatusCode.BadRequest, "Arrival time and departure time cannot be used simultaneously");
    }
    if (!coordinatesAreValid(req.origin) || !coordinatesAreValid(req.destination)) {
        throw new StatusCodeError(StatusCode.BadRequest, "Origin and destination coordinates must have valid latitude and longitude values");
    }
}

export interface DirectionsRequest {
    origin: Coordinate;
    destination: Coordinate;
    travelModes: TravelMode[];
    transitModes?: TransitMode[];
    routingPreferences?: TransitRoutingPreferences;
    // waypoints?: Waypoint;
    avoid?: FeatureAvoid;
    arrivalTime?: number;
    departureTime?: number;
    unit?: DistanceUnit;
}

type DistanceUnit = "metric" | "imperial"

type TravelMode = "driving" | "walking" | "bicycling" | "transit";

type TransitMode = "bus" | "subway" | "train" | "tram" | "rail"; // using rail combines tram, train and subway

export interface TransitRoutingPreferences {
    lessWalking?: boolean;
    fewerTransfers?: boolean;
}

export interface Waypoint {
    coordinates?: Coordinate;
    addressString?: string;
    placeID?: string;
}

export interface FeatureAvoid {
    tolls?: boolean;
    highways?: boolean;
    ferries?: boolean;
    indoor?: boolean;
}

export type DirectionsResponseStatus = "NOT_FOUND" | "MAX_WAYPOINTS_EXCEEDED" | "MAX_ROUTE_LENGTH_EXCEEDED" | "OVER_DAILY_LIMIT" | GoogleResponseStatus;

export interface DirectionsResponse {
    status: DirectionsResponseStatus;
    error_message?: object; // idk what the type of this is lol
    geocoded_waypoints?: GeocodedWaypoint[];
    routes?: Route[];
    available_travel_modes?: (TransitMode | TravelMode)[];
    fare?: Fare;
}

export interface GeocodedWaypoint {
    geocoder_status?: string;
    place_id?: string;
    types?: string[];
}

export interface RouteComponents {
    start_location?: Coordinate;
    end_location?: Coordinate;
    start_address?: string;
    end_address?: string;
    duration?: ValueAndText;
}

export interface Route extends RouteComponents {
    summary?: string;
    legs?: RouteLeg[];
    warnings?: any[];
    copyrights?: string;
    overview_polyline?: Polyline;
    waypoint_order?: number[];
    // bounds: ??; idk what the heck this is meant to be
}

export interface RouteLeg extends RouteComponents {
    steps?: RouteStep[];
    distance?: ValueAndText;
    duration?: ValueAndText;
    duration_in_traffic?: ValueAndText;
    arrival_time?: Time;
    departure_time?: Time;
}

export interface ValueAndText {
    value: number;
    text: string;
}

export interface Fare extends ValueAndText {
    currency: string;
}

export interface Time {
    value: Date;
    text: string;
    time_zome: string;
}

export interface RouteStep extends BasicStep {
    steps?: BasicStep[];
}

export interface BasicStep extends RouteComponents {
    travel_mode?: TravelMode | TransitMode;
    polyline?: Polyline;
    distance?: ValueAndText;
    html_instructions?: string;
    transit_details?: TransitDetail;
}

export interface TransitDetail {
    arrival_stop?: TransitLocation;
    departure_stop?: TransitLocation;
    arrival_time: Time;
    departure_time: Time;
    headway?: number;
    num_strops?: number;
    trip_short_name?: string;
    line?: TransitLine;
}

export interface TransitLocation {
    name?: string;
    location?: Coordinate;
}

export interface TransitLine {
    name?: string;
    short_name?: string;
    color?: string;
    agencies?: TransitAgency[];
    url?: string;
    icon?: string;
    text_color?: string;
    vehicle?: TransitVehicle;
}

type VehicleType = "RAIL" | "METRO_RAIL" | "SUBWAY" | "TRAM" | "MONORAIL" | "HEAVYRAIL" | "COMMUTER_TRAIN" | "HIGH_SPEED_TRAIN" |
    "LONG_DISTANCE_TRAIN" | "BUS" | "INTERCITY_BUS" | "TROLLEYBUS" | "SHARE_TAXI" | "FERRY" | "CABLE_CAR" | "GONDOLA_LIFT" | "FUNICULAR" | "OTHER";

export interface TransitVehicle {
    name?: string;
    icon?: string;
    type?: VehicleType;
    local_icon?: string;
}

export interface TransitAgency {
    name?: string;
    phone?: string;
    url?: string;
}

export interface Polyline {
    points: string;
}
