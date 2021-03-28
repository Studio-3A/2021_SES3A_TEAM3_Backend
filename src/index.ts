import express from "express";
import cors from "cors";
import { PORT, HOST, PROTOCOL } from "./config/constants";
import { authRouter, tripRouter, userRouter } from "./routes";

const app = express();
// Disable annoying browser security
app.use(cors({ origin: `http://${HOST}:3000` }));

// Use JSON Parsing Middleware
app.use(express.json());

// Define a route handler for the default home page (note: probably dont need this)
app.get("/", (req, res) => res.send("Hello world!"));

//import api routes below
app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/trip", tripRouter);

// Start the Express server
app.listen(PORT, () => {
    console.log(`Server started at ${PROTOCOL}://${HOST}:${PORT}`);
});
