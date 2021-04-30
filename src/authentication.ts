import FirebaseAdmin, { ServiceAccount } from "firebase-admin";
import { Request, Response } from "./common/expresstypes";
import serviceAccountKey from "./config/serviceAccountKey.json";

const cookieOptions = {
    maxAge: 60 * 60 * 1000, /* 1 hour */
    httpOnly: true,
    path: "/",
    sameSite: false,
};

// Use as middleware to set the user where based on the header
export async function parseAuthSession(req: Request, res: Response, next: Function) {
    const headerToken = req.header("Firebase-Token");
    const cookieToken = req.cookies.FirebaseToken;

    // Note if the token retreival fails on the frontend we might get they might get the string literal "undefined" instead of no header
    const token: string | undefined = (headerToken && headerToken !== "undefined") ? headerToken : cookieToken;

    if (token) {
        try {
            const decodedToken = await FirebaseAdmin.auth().verifyIdToken(token);
            if (!cookieToken) {
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
    credential: FirebaseAdmin.credential.cert(<ServiceAccount>serviceAccountKey),
});

export default FirebaseAdmin;