import * as core from "express-serve-static-core";
import { auth } from "firebase-admin";
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

export interface BasicResponse {
    status: StatusCode;
    message?: string;
}

export interface ErrorResponse extends BasicResponse {
    errorMessage?: string;
    error?: any; // yeah idk what type this is going to be... ¯\_(ツ)_/¯
}

export function isErrorResponse(resp: any): resp is ErrorResponse {
    const r = resp as Partial<ErrorResponse>
    return r.status != null && !statusCodeIsSuccessful(r.status);
}

export function HandleErrorResponse(e: any) {
    if (e instanceof StatusCodeError) {
        return StatusCodeErrorResponse(e);
    } else if (typeof e === 'string' || e instanceof String) {
        return StringErrorResponse(e);
    } else if (e instanceof Error) {
        return GeneralErrorResponse(e);
    } else {
        // if we can't figure out what what we are dealing with then
        // probably cannot recover...therefore, rethrow
        // Note to Self: Rethink my life choices and choose better libraries to use.
        // ^ person from the internet
        throw e;
    }
}

export function StatusCodeErrorResponse(err: StatusCodeError): ErrorResponse {
    return { status: err.code, errorMessage: err.message };
}

export function GeneralErrorResponse(error: Error, status = StatusCode.InternalServerError): ErrorResponse {
    return { status, errorMessage: error.message, error };
}

export function StringErrorResponse(errorMessage: string | String, status = StatusCode.InternalServerError): ErrorResponse {
    return { status, errorMessage: errorMessage + "" };
}

export function ErrorResponse(status: StatusCode, errorMessage?: string, error?: any): ErrorResponse {
    return { status, errorMessage, error };
}

export function BadRequest(errorMessage: string, error?: any) {
    return ErrorResponse(StatusCode.BadRequest, errorMessage, error);
}

export function Unauthorized(errorMessage: string, error?: any) {
    return ErrorResponse(StatusCode.Unauthorized, errorMessage, error);
}

export function NotFound(errorMessage: string, error?: any) {
    return ErrorResponse(StatusCode.NotFound, errorMessage, error);
}

export function InternalServerError(errorMessage: string, error?: any) {
    return ErrorResponse(StatusCode.InternalServerError, errorMessage, error);
}

export function Forbidden(errorMessage: string, error?: any) {
    return ErrorResponse(StatusCode.Forbidden, errorMessage, error);
}

export class StatusCodeError extends Error {
    code: StatusCode;
    constructor(code: StatusCode, message: string) {
        super(message);
        this.code = code;
    }
}

// Syntax of type A & type B more or less just merges them
// Add any request properties here so that we don't have to use any
export type Request = core.Request & { session?: auth.DecodedIdToken | null };
export type Response = core.Response;