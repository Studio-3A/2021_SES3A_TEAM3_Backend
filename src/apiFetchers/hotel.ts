import { getContent } from "./utility";

const hotelLocationsSearchUrl = "https://hotels4.p.rapidapi.com/locations/search";
const hotelDetailsSearchUrl = "https://hotels4.p.rapidapi.com/properties/list";

export const getLocations = async (params: string) => {
    return await getContent<HotelLocationDataResponse>(`${hotelLocationsSearchUrl}?${params}`, "failed to find any suitable locations.", true);
};

export const getHotelLocations = (location: HotelLocationInput) => {
    return getLocations(
        `query=${location.query}&locale=${location.locale}`
        );
};

export const getHotelDetails = async (params: string) => {
    return await getContent<HotelDetailsDataResponse>(`${hotelDetailsSearchUrl}?${params}`, "failed to find any hotels for this location.", true);
};

export const getHotelsByLocation = (details: HotelDetailsInput) => {
    return getHotelDetails(
        `destinationId=${details.destinationId}&pageNumber=${details.pageNumber}&checkIn=${details.checkIn}&checkOut=${details.checkOut}&pageSize=${details.pageSize}&adults1=${details.adults1}&currency=${details.currency}&locale=${details.locale}&sortOrder=${details.sortOrder}`
        );
};

export interface HotelLocationInput {
    query: String,
    locale: String
};

export interface HotelDetailsInput {
    destinationId: String,
    pageNumber: String,
    checkIn: String,
    checkOut: String,
    pageSize: String,
    adults1: String,
    currency: String,
    locale: String,
    sortOrder: String
};

export interface HotelDetailsDataResponse {
    result: String,
    data: {
        body: {
            header: String,
            query: {
                destination: {
                    id: String,
                    value: String,
                    resolvedLocation: String
                }
            }
        },
        searchResults: {
            totalCount: Number,
            results: HotelDetailsObject[];
        },
        pagination: {
            currentPage: Number,
            pageGroup: String,
            nextPageStartIndex: Number,
            nextPageNumber: Number,
            nextPageGroup: String
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

export interface AccomodationThemeItems {
    label: String,
    value: String
};

export interface AccessibilityItems {
    label: String,
    value: String
};

export interface FacilitiesItem {
    label: String,
    value: String
};

export interface AccomodationTypeItem {
    label: String,
    value: String
};

export interface HotelDetailsObject {
    id: Number,
    name: String,
    starRating: Number,
    urls: {},
    address: {
        streetAddress: String,
        extendedAddress: String,
        locality: String,
        postalCode: String,
        region: String,
        countryName: String,
        countryCode: String,
        obfuscate: boolean,
    },
    guestReviews: {
        unformattedRatting: Number,
        rating: String,
        total: Number,
        scale: Number
    },
    landmarks: LandmarkObject[],
    ratePlan: {
        price: {
            current: String,
            exactCurrent: Number
        },
        features: {
            paymentPreference: boolean,
            noCCRequired: boolean
        }
    },
    neighbourhood: String,
    deals: {},
    messaging: {},
    badging: {},
    coordinate: {
        lat: Number,
        lon: Number
    },
    providerType: String,
    supplierHotelId: Number,
    vrBadge: String,
    isAlternative: boolean,
    optimizedThumbUrls: {
        srpDesktop: String
    }
};

export interface LandmarkObject {
    label: String,
    distance: String
}

export interface HotelLocationDataResponse {
    term: String,
    moresuggestions: number,
    autoSuggestInstance: String,
    trackingID: String,
    misspellingfallback: boolean,
    suggestions: HotelLocationData[];
};

export interface HotelSuggestionObject {
    geoId: String,
    destinationId: String,
    landmarkCityDestinationId: String,
    type: String,
    redirectPage: String,
    latitude: number,
    longitude: number,
    caption: String,
    name: String,
}

export interface HotelLocationData {
    group: String,
    entities: HotelSuggestionObject[];
}