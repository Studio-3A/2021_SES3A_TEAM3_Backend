import * as core from "express-serve-static-core";
import { auth } from "firebase-admin";

// Syntax of type A & type B more or less just merges them
// Add any request properties here so that we don't have to use any
export type Request = core.Request & { session?: auth.DecodedIdToken | null };
export type Response = core.Response;
export type Query = core.Query;
export type Params = core.ParamsDictionary;