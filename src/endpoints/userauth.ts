import FirebaseAdmin from "../authentication";

module.exports = (app: any) => {
    app.post("/auth/checkToken", async ( req: any, res: any ) => {
        const { token }: { token: string } = req.body;
        let statusCode: number, isAuth: boolean = false, error: any, uid;
    
        if (!token) {
            statusCode = 401;
        } else {
            try {
                const decodedToken = await FirebaseAdmin.auth().verifyIdToken(token);
                statusCode = 200, isAuth = true, uid = decodedToken.uid;
            } catch (err) {
                statusCode = 500, error = err;
            }
        }
    
        res.status(statusCode).json({ authenticated: isAuth, error: error, uID: uid });
    } );
}