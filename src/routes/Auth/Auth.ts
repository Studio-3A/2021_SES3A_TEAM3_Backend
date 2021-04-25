import express from "express";
import { Request, Response } from "../../common/expresstypes";
import { StatusCode } from "travelogue-utility"

export const authRouter = express.Router({
    strict: true
});

authRouter.post("/checkToken", async (req: Request, res: Response) => {
    // Should NOT be null (or undefined) for a valid session
    return req.session ? res.sendStatus(StatusCode.OK) : res.sendStatus(StatusCode.Unauthorized);
});
