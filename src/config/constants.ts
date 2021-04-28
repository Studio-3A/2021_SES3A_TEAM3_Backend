export const PORT = process.env.PORT || 4000;
export const HOST = process.env.HOST || "localhost";
export const PROTOCOL = process.env.PROTOCOL || "http";

export const DATABASE = {
    HOST: process.env.DATABASE_HOST || "database",
    NAME: process.env.DATABASE_NAME || "test",
    USERNAME: process.env.DATABASE_USERNAME || "root",
    PASSWORD: process.env.DATABASE_PASSWORD || "password",
};

export const DATABASE_CONNECTION_STRING = "mysql://"+process.env.DATABASE_USERNAME+":"+
process.env.DATABASE_PASSWORD+"@"+process.env.DATABASE_HOST+"3306/travelogue";