import express from "express";
import { StatusCode, Request, Response } from "../../common/expresstypes";

export const authRouter = express.Router({
    strict: true
});

authRouter.post("/checkToken", async (req: Request, res: Response) => {
    // Should NOT be null (or undefined) for a valid session
    return req.session ? res.sendStatus(StatusCode.OK) : res.sendStatus(StatusCode.Unauthorized);
});
