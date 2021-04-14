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
    NotImplemented = 501,
}

// Syntax of type A & type B more or less just merges them
// Add any request properties here so that we don't have to use any
export type Request = core.Request & { session?: auth.DecodedIdToken };
export type Response = core.Response;