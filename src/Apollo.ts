import { ApolloServer, gql } from "apollo-server-express";
import Prisma, { PrismaClient } from '@prisma/client'
import FirebaseAdmin from 'firebase-admin';
import { Request, Response } from "./common/expresstypes";

import { typeDefs, resolvers } from "./graphql/index";

const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req, res }: { req: Request, res: Response }) => ({
        prisma: new PrismaClient(),
        // a: console.log(req.session),
        session: req.session,
    })
});

export default apolloServer;