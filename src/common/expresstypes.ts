
import * as core from "express-serve-static-core"

export interface Query extends core.Query { }

export interface Params extends core.ParamsDictionary { }

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