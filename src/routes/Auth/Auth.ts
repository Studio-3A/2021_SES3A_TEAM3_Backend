import express, { Request, Response } from "express";
import FirebaseAdmin from "../../authentication";
import { StatusCode } from "../../common/expresstypes";

export const authRouter = express.Router({
    strict: true
});

authRouter.post("/checkToken", async (req: Request<unknown, unknown, string, unknown>, res: Response) => {
    const token: string = req.body;
    let statusCode = StatusCode.Unauthorized, isAuth = false, error: any, uid;

    if (token) {
        try {
            const decodedToken = await FirebaseAdmin.auth().verifyIdToken(token);
            statusCode = StatusCode.OK, isAuth = true, uid = decodedToken.uid;
        } catch (err) {
            statusCode = StatusCode.InternalServerError, error = err;
        }
    }

    res.status(statusCode).json({ authenticated: isAuth, error: error, uID: uid });
});
