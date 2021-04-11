import { Color, Coordinate } from "../common/objects";
import { createHeaders, getContent, HeadersType, postContent } from "./utility";

const tripgoUrl = (urlPart: string, jsonEndpoint = true) => `https://api.tripgo.com/v1/${urlPart}${jsonEndpoint ? ".json" : ""}`;

export const getAtoBTrip = async (req: RoutingRequest) => {
    // tripgo wants all this in the query string lmao
    let qs = `?v=11&from=(${req.from.lat + "," + req.from.lng})&to=(${req.to.lat + "," + req.to.lng})`;
    qs += `&conc=${req.conc}&bestOnly=${req.bestOnly}$allModes=${req.allModes}`;
    qs += `&departAfter=${req.departAfter}&arriveBefore=${req.arriveBefore}`;

    if (req.modes.length > 0) qs += `&modes=${req.modes.join(",")}`;
    else {
        // TODO - JUSTIN - ADD DEFAULT MODES IF NONE SPECIFIED
    }
    if (req.neverAllowModes && req.neverAllowModes.length > 0) qs += `&neverAllowModes=${req.neverAllowModes.join(",")}`;

    const headers = createHeaders(HeadersType.Transport);
    return await getContent<RoutingResponse>(`${tripgoUrl("routing")}${qs}`, "Getting transport regions failed.", headers);
};

export const getRegions = async (hashCode?: number) => {
    const reqBody: RegionsRequest = { v: 2, hashCode };
    const str = JSON.stringify(reqBody);
    const headers = createHeaders(HeadersType.Transport);
    return postContent<RegionsResponse>(`${tripgoUrl("regions")}`, "Getting transport regions failed.", headers, str);
};

export const getTransportServiceProviders = async (region: string) => {
    const reqBody: TSPsRequest = { region, full: false, onlyRealTime: false };
    const str = JSON.stringify(reqBody);
    const headers = createHeaders(HeadersType.Transport);
    return postContent<TSPsResponse>(`${tripgoUrl("info/operator")}`, "Getting TSPs failed.", headers, str);
};


export interface RoutingInput {
    from: Coordinate;
    to: Coordinate;
    departAfter: string;
    arriveBefore: string;
}

export interface RoutingRequest {
    from: Coordinate;
    to: Coordinate;
    departAfter: number;
    arriveBefore: number;
    modes: string[];
    allModes: boolean;
    neverAllowModes?: string[];
    conc: boolean; // short for concession
    bestOnly: boolean;
}

export interface RoutingResponse {
    alerts: RealTimeAlert[];
    groups: TripGroup[];
    segmentTemplates: SegmentTemplate[];
    regiond: string[];
    error: string;
    errorCode: number;
    usererror: boolean;
}

export interface RealTimeAlert {
    title: string;
    hashCode: number;
    severity: string;
    text?: string;
    type?: string;
    externalId?: string;
    url?: string;
    remoteIcon?: string;
    location?: Location;
    action?: {
        text: string;
        type: string;
        excludedStopCodes?: string[];
    }
}

export interface TripGroup {
    frequency: number;
    trips: TripGoTrip[];
    sources: Source[];
}

export interface TripGoTrip {
    id: string;
    depart: number;
    arrive: number;
    availability: string;
    mainSegmentHashCode: number;
    hassleCost: number;
    moneyCost: number;
    moneyCostUSD: number;
    currency: string;
    currencySymbol: string;
    weightedScore: number;
    segments: SegmentReference[];
    temporaryURL?: string;
    saveURL?: string;
    shareURL?: string;
}

export interface Location {
    lat: number;
    lng: number;
    timezone: string;
    address?: string;
    region: string;
}

export interface SegmentTemplate {
    hashCode: string;
    modeInfo: {
        identifier: string;
        alt: string;
        description?: string;
        localIcon: string;
        remoteIcon?: string;
        remoteDarkIcon?: string;
        remoteIconIsBranding?: boolean;
        remoteIconIsTemplate?: boolean;
        color?: Color;
    },
    modeIdentifier?: string;
    availability: string;
    action: string;
    notes?: string;
    terms?: string;
    visibility: string;
    type: string;
    sources: SimpleSource[],
    localCost?: {
        minCost?: number;
        maxCost?: number;
        cost: number;
        accuracy: string;
        currency: string;
        costComponents: CostComponent[];
    },
    mapTiles: {
        name: string;
        urlTemplates: string[];
        sources: SimpleSource[];
    },
    from: Location;
    to: Location;
    travelDirection: number;
    operator: string;
    operatorID: string;
    stopCode?: string;
    endStopCode?: string;
    isContinuation?: boolean;
    shapes: ServiceShape[];
    smsNumber?: string;
    smsMessage?: string;
    durationWithoutTraffic?: number;
    metres?: number;
    metresSafe?: number;
    metresUnsafe?: number;
    metresDismount?: number;
    streets?: Street[];
    "turn-by-turn"?: string;
    location?: Location;
    isParking?: boolean;
    hasCarParks?: boolean;
}

export interface Street {
    encodedWaypoints: string;
    safe?: boolean;
    dismount?: boolean;
    name?: string;
    cyclingNetwork?: string;
    metres?: number;
    instruction?: string;
}

export interface ServiceShape {
    operator: string;
    operatorID?: string;
    serviceTripID: string;
    serviceName?: string;
    serviceNumber?: string;
    serviceDirection?: string;
    serviceColor?: Color;
    serviceTextColor?: Color;
    bicycleAccessible?: boolean;
    wheelchairAccessible?: boolean;
    encodedWaypoints: string;
    travelled: boolean;
    stops: Stop[];
}

export interface Stop {
    lat: number;
    lng: number;
    code: string;
    name?: string;
    shortName?: string;
    bearing?: number;
    arrival?: number;
    departure?: number;
    relativeArrival?: number;
    relativeDeparture?: number;
    wheelchairAccessible?: boolean;
    boardingRules?: string;
    pickUpOnly?: boolean;
    dropOffOnly?: boolean;
}

export interface CostComponent {
    type: string;
    cost: number;
    name?: string;
}

export interface SegmentReference {
    id: string;
    segmentTemplateHashCode: number;
    startTime: number;
    endTime: number;
    serviceTripID?: string;
    realTime?: boolean;
    booking?: object; // this is a stupid object >: |
    bookingHashCode?: string;
    timetableStartTime?: number;
    timetableEndTime?: number;
    stops?: number;
    startPlatform?: string;
    endPlatform?: string;
    timetableStartPlatform?: string;
    timetableEndPlatform?: string;
    serviceNumber?: string;
    serviceName?: string;
    serviceDirection?: string;
    serviceColor?: Color;
    frequency?: number;
    ticketWebsiteURL?: string;
    bicycleAccessible?: boolean;
    wheelchairAccessible?: boolean;
    isCancelled?: boolean;
    // realTimeVehicle
    // realtimeVehicleAlternatives
    // realTimeStops 
    alertHashCodes?: number[];
    externaldata?: object;
    ticket?: {
        name: string;
        fareID?: string;
        cost?: number;
        exchange?: number;
    },
    sharedvehicle?: object; // need to update this
    vehicleUUID?: string;
}

export interface SimpleSource {
    provider: string;
    providerURL?: string;
    disclaimer?: string;
}

export interface Source {
    provider: CompanyInfo;
    disclaimer: string;
}

export interface CompanyInfo {
    name: string;
    phone: string;
    website: string;
    remoteIcon: string;
    remoteDarkIcon: string;
    color: Color;
    appInfo: {
        name: string;
        appURLiOS: string;
        appURLAndroid: string;
    }
}

export interface TSPsRequest {
    region: string;
    modes?: string[];
    operatorIDs?: string[];
    operatorNames?: string[];
    onlyRealTime: boolean;
    full: boolean;
}

export type TSPsResponse = TSP[];

export interface TSP {
    id: string;
    name: string;
    modes: TSPMode[];
}

export interface TSPMode {
    mode: string;
    numberOfServices: number;
    realTime: {
        alerts: boolean;
        positions: boolean;
        updates: boolean;
    }
}

export interface RegionsRequest {
    v: number;
    hashCode?: number;
}

export interface RegionsResponse {
    hashcode: number;
    regions: Region[];
    modes: Record<string, ModeIndentifier>;
}

export interface Region {
    name: string;
    cities: City[];
    polygon: string;
    modes: string[];
    urls: string[];
}

export interface City {
    lat: number;
    lng: number;
    title: string;
    timezone: string;
}

export interface ModeIndentifier {
    title: string;
    subtitle: string;
    URL: string;
    color: Color;
    icon: string;
    isTemplate: boolean;
    implies: string;
}
