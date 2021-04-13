// Remember to get the serviceAccountKey.json file from Teams as it should not be commited to GitHub

import FirebaseAdmin, { ServiceAccount } from "firebase-admin";
import serviceAccount from "./config/serviceAccountKey.json";
import { Request, Response } from "./common/expresstypes";

const cookieOptions = {
    maxAge: 60 * 60 * 1000, /* 1 hour */
    httpOnly: true,
    path: "/",
    sameSite: false,
};

// Use as middleware to set the user where based on the header
export async function parseAuthSession(req: Request, res: Response, next: Function) {
    // TODO: Pass the ID/Token as a header on requests instead of in the body as JSON 
    const token: string | undefined = req?.header("Firebase-Token") || req.cookies.FirebaseToken;

    if (token) {
        try {
            const decodedToken = await FirebaseAdmin.auth().verifyIdToken(token);
            if (!req.cookies.FirebaseToken) {
                res.cookie("FirebaseToken", token, cookieOptions);
            }
            req.session = decodedToken;
        } catch (err) {
            res.cookie("FirebaseToken", undefined, { ...cookieOptions, maxAge: 0 });
            req.session = null;
        }
    } else {
        res.cookie("FirebaseToken", undefined, { ...cookieOptions, maxAge: 0 });
        req.session = null;
    }
    next();
};

FirebaseAdmin.initializeApp({
    credential: FirebaseAdmin.credential.cert(<ServiceAccount> serviceAccount)
});

export default FirebaseAdmin;