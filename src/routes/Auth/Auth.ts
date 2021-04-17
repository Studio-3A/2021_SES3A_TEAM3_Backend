import express from "express";
import { StatusCode, Request, Response } from "../../common/expresstypes";

export const authRouter = express.Router({
    strict: true
});

authRouter.post("/checkToken", async (req: Request, res: Response) => {
    if (req.session) { // Should NOT be null (or undefined) for a valid session
        return res.sendStatus(StatusCode.OK);
    } else {
        return res.sendStatus(StatusCode.Unauthorized);
    }
    // const { token }: { token: string } = req.body;
    // let statusCode = StatusCode.Unauthorized, isAuth = false, error: any, uid;

    // if (token) {
    //     try {
    //         const decodedToken = await FirebaseAdmin.auth().verifyIdToken(token);
    //         statusCode = StatusCode.OK, isAuth = true, uid = decodedToken.uid;
    //     } catch (err) {
    //         statusCode = StatusCode.InternalServerError, error = err;
    //     }
    // }

    // res.status(statusCode).json({ authenticated: isAuth, error: error, uID: uid });
});
