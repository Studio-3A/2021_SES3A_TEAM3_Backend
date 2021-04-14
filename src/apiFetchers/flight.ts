import { responseIsErrorResponse } from "../common/expresstypes";
import { createHeaders, getContent, HeadersType } from "./utility";

//STILL TO DO: SUBSCRIBE RAPIDAPI KEY TO SKYSCANNER API (whoever currently owns the key)
const skyscannerUrl = 'https://skyscanner-skyscanner-flight-search-v1.p.rapidapi.com/apiservices/';
export const getFlights = async (req: FlightRequest) => {
    req.inboundPartialDate = req.inboundPartialDate || ""; // if there's no inbound date, we use an empty string for a one way trip
    req.locale = req.locale || "en-US";

    let placeRequestObject = {
        "placeName": "",
        "country": req.country,
        "currency": req.currency,
        "locale": req.locale
    }

    placeRequestObject.placeName = req.originPlace;
    const originPlaces = await getPlaces(placeRequestObject);
    placeRequestObject.placeName = req.destinationPlace;
    const destinationPlaces = await getPlaces(placeRequestObject);
    if (responseIsErrorResponse(originPlaces) || responseIsErrorResponse(destinationPlaces)) {
        return;
    }

    // if (!("Places" in originPlaces && "Places" in destinationPlaces)) return;
    req.originPlace = originPlaces.Places[0].PlaceId;
    req.destinationPlace = destinationPlaces.Places[0].PlaceId;

    let qs = `browsequotes/v1.0/${req.country}/${req.currency}/${req.locale}/${req.originPlace}/${req.destinationPlace}/${req.outboundPartialDate}`;
    qs += `?inboundpartialdate=${req.inboundPartialDate}`;
    const headers = createHeaders(HeadersType.Flights);
    return getContent<FlightDetailsResponse>(`${skyscannerUrl}${qs}`, `We weren't able to find any flights for ${req.originPlace} to ${req.destinationPlace}`, headers)
}

export const getPlaces = async (req: PlaceRequest) => {
    const qs = `autosuggest/v1.0/${req.country}/${req.currency}/${req.locale}/?query=${req.placeName}`;
    const headers = createHeaders(HeadersType.Flights);
    return getContent<PlaceDetailsResponse>(`${skyscannerUrl}${qs}`, `Unable to find any places for query: ${req.placeName}`, headers);
}

export interface FlightRequest {
    country: string, //Abbreviation of country name - i.e. AU, US, UK.
    currency: string, //i.e. USD, AUD, GBP
    locale?: string, //ISO Locale Code to get results in - i.e. en-GB, en-US.
    originPlace: string,
    destinationPlace: string,
    outboundPartialDate: string, //yyyy-mm-dd or yyyy-mm or anytime
    inboundPartialDate?: string //yyyy-mm-dd or yyyy-mm or anytime
}

export interface PlaceRequest {
    placeName: string, //Full name of the city or place
    country: string, //Abbreviation of country name - i.e. AU, US, UK
    currency: string, //i.e. USD, AUD, GBP
    locale: string //ISO Locale Code to get results in - i.e. en-GB, en-US.
}

export interface FlightDetailsResponse {
    Quotes: Quote[],
    Carriers: Carrier[],
    Places: Place[],
    Currencies: Currency[]
}

export interface Quote {
    QuoteId: number,
    MinPrice: number,
    Direct: boolean,
    OutboundLeg: {
        CarrierIds: number[],
        OriginId: number,
        DestinationId: number,
        DepartureDate: string
    },
    QuoteDateTime: string
}

export interface Carrier {
    CarrierId: number,
    Name: string
}

export interface Currency {
    Code: string,
    Symbol: string,
    ThousandsSeparator: string,
    DecimalSeparator: string,
    SymbolOnLeft: boolean,
    SpaceBetweenAmountAndSymbol: false,
    RoundingCoefficient: number,
    DecimalDigits: number
}

export interface PlaceDetailsResponse {
    Places: Place[]
}

export interface Place {
    Name?: string,
    Type?: string,
    IataCode?: string,
    SkyscannerCode?: string,
    CityName?: string,
    PlaceId: string,
    PlaceName?: string,
    CountryId?: string,
    RegionId?: string,
    CityId: string,
    CountryName: string,
}