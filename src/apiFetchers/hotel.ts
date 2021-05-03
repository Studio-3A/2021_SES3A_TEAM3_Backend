import { getContent } from "travelogue-utility";
import { createHeaders, HeadersType } from "./utility";

const hotelLocationsSearchUrl = "https://hotels4.p.rapidapi.com/locations/search";
const hotelDetailsSearchUrl = "https://hotels4.p.rapidapi.com/properties/list";

export const getLocations = async (params: string) => {
    const url = `${hotelLocationsSearchUrl}?${params}`;
    const errorMessage = "Failed to find any suitable locations.";
    const headers = createHeaders(HeadersType.Hotels);
    return await getContent<HotelLocationDataResponse>({ url, errorMessage, headers });
};

export const getHotelLocations = (location: HotelLocationInput) => {
    return getLocations(`query=${location.query}&locale=${location.locale}`);
};

export const getHotelDetails = async (params: string) => {
    const url = `${hotelLocationsSearchUrl}?${params}`;
    const errorMessage = "Failed to find any hotels for this location.";
    const headers = createHeaders(HeadersType.Hotels);
    return await getContent<HotelDetailsDataResponse>({ url, errorMessage, headers });
};

export const getHotelsByLocation = (details: HotelDetailsInput) => {
    return getHotelDetails(
        `destinationId=${details.destinationId}&pagenumber=${details.pagenumber}&checkIn=${details.checkIn}`
        + `&checkOut=${details.checkOut}&pageSize=${details.pageSize}&adults1=${details.adults1}`
        + `&currency=${details.currency}&locale=${details.locale}&sortOrder=${details.sortOrder}`
    );
};

export interface HotelLocationInput {
    query: string,
    locale: string
};

export interface HotelDetailsInput {
    destinationId: string,
    pagenumber: string,
    checkIn: string,
    checkOut: string,
    pageSize: string,
    adults1: string,
    currency: string,
    locale: string,
    sortOrder: string
};

export interface HotelDetailsDataResponse {
    result: string,
    data: {
        body: {
            header: string,
            query: {
                destination: {
                    id: string,
                    value: string,
                    resolvedLocation: string
                }
            }
        },
        searchResults: {
            totalCount: number,
            results: HotelDetailsObject[];
        },
        pagination: {
            currentPage: number,
            pageGroup: string,
            nextPageStartIndex: number,
            nextPagenumber: number,
            nextPageGroup: string
        },
        accomodationType: {
            applied: boolean,
            items: AccomodationTypeItem[]
        },
        facilities: {
            applied: boolean,
            items: FacilitiesItem[]
        },
        accessibility: {
            applied: boolean,
            items: AccessibilityItems[]
        },
        themesAndTypes: {
            applied: boolean,
            items: AccomodationThemeItems[]
        }
    }
};

interface LabelValue {
    label: string,
    value: string
};

export interface AccomodationThemeItems extends LabelValue { };

export interface AccessibilityItems extends LabelValue { };

export interface FacilitiesItem extends LabelValue { };

export interface AccomodationTypeItem extends LabelValue { };

export interface HotelDetailsObject {
    id: number,
    name: string,
    starRating: number,
    urls: {},
    address: {
        streetAddress: string,
        extendedAddress: string,
        locality: string,
        postalCode: string,
        region: string,
        countryName: string,
        countryCode: string,
        obfuscate: boolean,
    },
    guestReviews: {
        unformattedRatting: number,
        rating: string,
        total: number,
        scale: number
    },
    landmarks: LandmarkObject[],
    ratePlan: {
        price: {
            current: string,
            exactCurrent: number
        },
        features: {
            paymentPreference: boolean,
            noCCRequired: boolean
        }
    },
    neighbourhood: string,
    deals: {},
    messaging: {},
    badging: {},
    coordinate: {
        lat: number,
        lon: number
    },
    providerType: string,
    supplierHotelId: number,
    vrBadge: string,
    isAlternative: boolean,
    optimizedThumbUrls: {
        srpDesktop: string
    }
};

export interface LandmarkObject {
    label: string,
    distance: string
}

export interface HotelLocationDataResponse {
    term: string,
    moresuggestions: number,
    autoSuggestInstance: string,
    trackingID: string,
    misspellingfallback: boolean,
    suggestions: HotelLocationData[];
};

export interface HotelSuggestionObject {
    geoId: string,
    destinationId: string,
    landmarkCityDestinationId: string,
    type: string,
    redirectPage: string,
    latitude: number,
    longitude: number,
    caption: string,
    name: string,
}

export interface HotelLocationData {
    group: string,
    entities: HotelSuggestionObject[];
}
