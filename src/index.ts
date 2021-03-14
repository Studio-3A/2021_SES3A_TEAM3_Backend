import express from "express";
const app = express();
import { PORT } from "./config/constants";

// define a route handler for the default home page
app.get( "/", ( req, res ) => {
    res.send( "Hello world!" );
} );

// start the Express server
app.listen( PORT, () => {
    console.log( `server started at http://localhost:${ PORT }` );
} );