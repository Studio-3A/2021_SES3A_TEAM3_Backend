export const PORT = process.env.PORT || 4000;
export const HOST = process.env.HOST || "localhost";
export const PROTOCOL = process.env.PROTOCOL || "http";

export const MONGO = {
    HOST: process.env.MONGO_HOST || "localhost",
    USERNAME: process.env.MONGO_USERNAME || "user_name",
    PASSWORD: process.env.MONGO_PASSWORD || "password",
};