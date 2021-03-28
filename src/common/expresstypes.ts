import * as core from "express-serve-static-core";

export type Query = core.Query;

export type Params = core.ParamsDictionary;

// please just use the enum for status codes
export enum StatusCode {
    OK = 200,
    Created = 201,
    NoContent = 204,
    BadRequest = 400,
    Unauthorized = 401,
    Forbidden = 403,
    NotFound = 404,
    MethodNotAllowed = 405,
    Conflict = 409,
    ImATeapot = 418,
    TooManyRequests = 429,
    InternalServerError = 500,
    NotImplemented = 501
}

export const statusCodeIsSuccessful = (code: number) => {
    switch (code) {
        case StatusCode.OK:
        case StatusCode.Created:
        case StatusCode.NoContent:
            return true;
        default:
            return false;
    }
}

export interface ErrorResponse {
    status: StatusCode;
    errorMessage?: string;
    error?: any; // yeah idk what type this is going to be... ¯\_(ツ)_/¯
}

export function responseIsErrorResponse(resp: any): resp is ErrorResponse {
    const r = resp as Partial<ErrorResponse>
    return r.status != null && !statusCodeIsSuccessful(r.status);
}
