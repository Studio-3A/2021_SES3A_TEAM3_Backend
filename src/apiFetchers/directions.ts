import {
    badRequest, handleError, isErrorResponse, StatusCode, StatusCodeError, getContent,
    Coordinate, coordinatesAreValid, isCoordinate, TravelMode, TransitMode, DirectionsResponse
} from "travelogue-utility";
import { GOOGLE_DIRECTIONS_KEY } from "../config/constants";

const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?key=${GOOGLE_DIRECTIONS_KEY}`;

const DEFAULT_UNIT: DistanceUnit = "metric";

export const getDirections = async (req: DirectionsRequest) => {
    try {
        DirectionsRequestIsValid(req);
        const params: string[] = [];
        let tempParams: string[] = [];
        if (isCoordinate(req.origin)) {
            params.push(`origin=${encodeURIComponent(req.origin.lat + "," + req.origin.lng)}`);
        } else {
            params.push(`origin=place_id:${req.origin}`);
        }
        if (isCoordinate(req.destination)) {
            params.push(`destination=${encodeURIComponent(req.destination.lat + "," + req.destination.lng)}`);
        } else {
            params.push(`destination=place_id:${req.origin}`);
        }

        params.push(`units=${req.unit || DEFAULT_UNIT}`);

        if (req.arrivalTime != null) {
            params.push(`arrival_time=${req.arrivalTime}`);
        } else if (req.departureTime != null) {
            params.push(`departure_time=${req.departureTime}`);
        }

        if (req.waypoints && req.waypoints.length > 0) {
            params.push(`waypoints=place_id:${encodeURIComponent(req.waypoints.join("|place_id:"))}`)
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
    if (isCoordinate(req.origin) && (!coordinatesAreValid(req.origin)) ||
        isCoordinate(req.destination) && !coordinatesAreValid(req.destination)) {
        throw new StatusCodeError(StatusCode.BadRequest, "Origin and destination coordinates must have valid latitude and longitude values");
    }
    if (req.waypoints && req.waypoints.length > 0) {
        if (req.waypoints.length > 23) {
            // google throws an error with > 25 waypoints, so might as well catch it here
            // best to split up the response instead
            throw new StatusCodeError(StatusCode.BadRequest, "Cannot have more than 25 waypoints (including origin and destination");
        } else if (req.travelModes.includes("transit")) {
            // google doesn't allow waypoints wen using transit
            throw new StatusCodeError(StatusCode.BadRequest, "Cannot use waypoints with transit travel mode");
        }
    }
}

export interface DirectionsRequest {
    origin: Coordinate | string;
    destination: Coordinate | string;
    travelModes: TravelMode[];
    transitModes?: TransitMode[];
    routingPreferences?: TransitRoutingPreferences;
    waypoints?: string[];
    avoid?: FeatureAvoid;
    arrivalTime?: number;
    departureTime?: number;
    unit?: DistanceUnit;
}

type DistanceUnit = "metric" | "imperial"


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
