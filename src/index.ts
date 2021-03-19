import express from "express";
const app = express();
import { PORT, HOST, PROTOCOL } from "./config/constants";

// Define a route handler for the default home page
app.get( "/", ( req, res ) => {
    res.send( "Hello world!" );
} );

// Start the Express server
app.listen( PORT, () => {
    console.log( `Server started at ${ PROTOCOL }://${ HOST }:${ PORT }` );
} );