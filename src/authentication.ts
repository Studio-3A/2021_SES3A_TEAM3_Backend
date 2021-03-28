// Remember to get the serviceAccountKey.json file from Teams as it should not be commited to GitHub

import FirebaseAdmin, { ServiceAccount } from "firebase-admin";
import keys from "./config/keys.json";

FirebaseAdmin.initializeApp({
    credential: FirebaseAdmin.credential.cert(<ServiceAccount>keys.serviceAccountKey)
});

export default FirebaseAdmin;