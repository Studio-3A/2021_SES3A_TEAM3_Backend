// Remember to get the serviceAccountKey.json file from Teams as it should not be commited to GitHub

import FirebaseAdmin, { ServiceAccount } from "firebase-admin";
import serviceAccount from "./config/serviceAccountKey.json";
import { Request, Response } from "./common/expresstypes";

// Use as middleware to set the user where based on the header
export async function parseAuthSession(req: Request, res: Response, next: Function) {
    // TODO: Pass the ID/Token as a header on requests instead of in the body as JSON 
    const token: string | undefined = req?.header("Firebase-Token");

    if (token) {
        try {
            const decodedToken = await FirebaseAdmin.auth().verifyIdToken(token);
            req.session = decodedToken;
        } catch (err) {
            req.session = undefined;
        }
    } else {
        req.session = undefined;
    }
    next();
};

FirebaseAdmin.initializeApp({
    credential: FirebaseAdmin.credential.cert(<ServiceAccount> serviceAccount)
});

export default FirebaseAdmin;