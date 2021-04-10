import fetch from "node-fetch";
import { ErrorResponse, StatusCode, statusCodeIsSuccessful } from "../common/expresstypes"
import keys from "../config/keys.json"


export async function getContent<T>(url: string, errorMessage?: string, isRapidApi?: boolean) {
    let error: any;
    let status = StatusCode.BadRequest;
    try {

        if (isRapidApi) {
            // add headers object for rapid API auth
            var headers = {
                'x-rapidapi-key': keys.rapidapi,
                'x-rapidapi-host': "hotels4.p.rapidapi.com"
                };
            
                // try fetch the data
            const response = await fetch(url, {headers: headers});

            // cast the json into the proper type if successful
            if (statusCodeIsSuccessful(response.status)) return await response.json() as T;
            // if it fails, we'll take note of the status code
            status = response.status;
        } else {
            // try fetch the data
            const response = await fetch(url);

            // cast the json into the proper type if successful
            if (statusCodeIsSuccessful(response.status)) return await response.json() as T;
            // if it fails, we'll take note of the status code
            status = response.status;
        }
    } catch (e) {
        // if we got an error, let's track that too
        console.error(e);
        error = e;
    }

    // we'll be here if either the status code wasn't 2**, or if some exception was thrown :/
    if (errorMessage == null) errorMessage = `Request to ${url} failed.`
    const errResponse: ErrorResponse = { error, status, errorMessage };
    return errResponse;
}