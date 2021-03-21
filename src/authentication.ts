// Remember to get the serviceAccountKey.json file from Teams as it should not be commited to GitHub

import FirebaseAdmin, { ServiceAccount } from "firebase-admin";
import serviceAccount from "./config/serviceAccountKey.json";

FirebaseAdmin.initializeApp({
    credential: FirebaseAdmin.credential.cert(<ServiceAccount> serviceAccount)
});

export default FirebaseAdmin;