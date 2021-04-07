// Remember to get the serviceAccountKey.json file from Teams as it should not be commited to GitHub

import FirebaseAdmin, { ServiceAccount } from "firebase-admin";
import serviceAccount from "./config/serviceAccountKey.json";

// Use as middleware to set the user where based on the header
export async function parseAuthSession(req: any, res: any, next: any) {
    // TODO: Pass the ID/Token as a header on requests instead of in the body as JSON 
    const token: string = req?.body?.token;

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