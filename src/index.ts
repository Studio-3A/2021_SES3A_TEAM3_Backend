import express from "express";
import supertest from "supertest";
import { PORT, HOST, PROTOCOL, REDIS } from "./config/constants";

// Middleware
import cors from "cors";
import cookieParser, { CookieParseOptions } from "cookie-parser";
import apolloServer from "./Apollo";
import { parseAuthSession } from "./authentication";

// Application Logic
import { authRouter, dataRouter, tripRouter, userRouter } from "./routes";

//Redis Server
import redis from 'redis';
export const redis_client = redis.createClient(Number.parseInt(REDIS.PORT), REDIS.HOST, {})


async function startServer() {
    const app = express();

    // Disable annoying browser security
    app.use(cors({ origin: `http://${HOST}:3000` }));
    app.use(cookieParser());
    app.use(parseAuthSession);

    await apolloServer.start();
    apolloServer.applyMiddleware({ app });

    // Use JSON Parsing Middleware
    app.use(express.json());

    // Define a route handler for the default home page (note: probably dont need this)
    app.get("/", (req, res) => res.send("Hello world!"));

    //import api routes below
    app.use("/auth", authRouter);
    app.use("/users", userRouter);
    app.use("/data", dataRouter);
    app.use("/trip", tripRouter);

    // Start the Express server
    await new Promise((resolve: any) => app.listen(PORT, resolve));
    console.log(`Server started at ${PROTOCOL}://${HOST}:${PORT}`);
    return { app, apolloServer };
}

startServer()
    .then(({ app }) => {
        // Server Started Sucessfully
        const TestServer = supertest(app);
        TestServer.post("/trip/new").send({
            "startLocation": {
               "lat": -33.8298241,
               "lng": 151.238232
           },
           "endLocation": {
               "lat": -33.7685877,
               "lng": 150.8775655
           },
           "startDate": 1618642046,
           "endDate": 1618778846
        }).then(resp => {
            console.log(resp.statusCode, resp.body)
        }).catch(err => {
            console.error(err)
        });
    })
    .catch(err => {
        console.error(err);
    })