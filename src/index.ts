// TODO:
//   - Work out some better rules for CORS security rather than a blanket allow all
//   - Relocate the authentication code into another file and the correct folder setup.

import express from "express";
const app = express();

import cors from "cors";
import { PORT, HOST, PROTOCOL } from "./config/constants";
import FirebaseAdmin from "./authentication";

// Disable annoying browser security
app.use(cors());

// Use JSON Parsing Middleware
app.use(express.json());

// Define a route handler for the default home page
app.get( "/", ( req, res ) => {
    res.send( "Hello world!" );
} );

app.post("/auth/checkToken", async ( req, res ) => {
    const { token }: { token: string } = req.body;
    let statusCode: number, isAuth: boolean = false, error: any, uid;

    if (!token) {
        statusCode = 401;
    } else {
        try {
            const decodedToken = await FirebaseAdmin.auth().verifyIdToken(token);
            statusCode = 200, isAuth = true, uid = decodedToken.uid;
        } catch (err) {
            statusCode = 500, error = err;
        }
    }

    res.status(statusCode).json({ authenticated: isAuth, error: error, uID: uid });
} );

// Start the Express server
app.listen( PORT, () => {
    console.log( `Server started at ${ PROTOCOL }://${ HOST }:${ PORT }` );
} );