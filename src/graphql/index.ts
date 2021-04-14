import { gql } from "apollo-server-express";
import { PrismaClient } from '@prisma/client'
import FirebaseAdmin from 'firebase-admin';

import * as User from "./User";

export interface ApolloContext {
    prisma: PrismaClient,
    session: FirebaseAdmin.auth.DecodedIdToken,
}

export const typeDefs = [
    gql`
        # Generic Response for data mutations
        interface MutationResponse {
            code: String!
            success: Boolean!
            message: String!
        }
    `,
    User.typeDefinitions,
];

export const resolvers = {
  Query: {
    myID: (parent: any, args: any, context: ApolloContext, info: any) => context?.session.uid,
    ...User.queries,
  },
  Mutation: {
    ...User.mutations,
  }
};