import express from "express";
import { PORT, HOST, PROTOCOL } from "./config/constants";

// Middleware
import cors from "cors";
import cookieParser from "cookie-parser";
import apolloServer from "./Apollo";
import { parseAuthSession } from "./authentication";

// Application Logic
import { authRouter, dataRouter, tripRouter, userRouter } from "./routes";


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
    .then(({ app: Express, apolloServer: ApolloServer }) => {
        // Server Started Sucessfully
    })
    .catch(err => {
        console.error(err);
    })