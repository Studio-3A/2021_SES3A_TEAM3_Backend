import express from "express";
import cors from "cors";
import logger from "morgan";
import path from "path";
import { PORT, HOST, PROTOCOL } from "./config/constants";
import { authRouter, userRouter } from "./routes";
import neo4j from "neo4j-driver";

const app = express();

// View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));

// Disable annoying browser security
app.use(cors({ origin: `http://${HOST}:3000` }));

// Use JSON Parsing Middleware
app.use(express.json());

var driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('testUsername', 'testPassword'));
var session = driver.session();

// Define a route handler for the default home page (note: probably dont need this)
app.get("/", (req, res) => res.send("Hello world!"));

//import api routes below
app.use("/auth", authRouter);
app.use("/users", userRouter);

// Start the Express server
app.listen(PORT, () => {
    console.log(`Server started at ${PROTOCOL}://${HOST}:${PORT}`);
});
