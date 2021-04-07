import { ApolloServer, gql } from "apollo-server-express";
import Prisma, { PrismaClient } from '@prisma/client'
import FirebaseAdmin from 'firebase-admin';

interface ApolloContext {
    prisma: PrismaClient,
    session: FirebaseAdmin.auth.DecodedIdToken,
}

const typeDefs = gql`
    # Generic Response for data mutations
    interface MutationResponse {
        code: String!
        success: Boolean!
        message: String!
    }

    # Queries
    type Query {
        myID: String
        users: [User]
        user(id: String!): User
    }

    # Mutations
    type Mutation {
        addUser(user: UserInput!): UserMutation
        updateUser(id: String!, user: UserInput!): UserMutation
        deleteUser(id: String!): UserMutation
    }

    # User Stuff
    type User {
        id: String!
    }

    input UserInput {
        id: String!
    }

    type UserMutation implements MutationResponse {
        code: String!
        success: Boolean!
        message: String!
        user: User
    }
`;


const resolvers = {
  Query: {
    myID: (parent: any, args: any, context: ApolloContext, info: any) => context?.session.uid,
    users: (parent: any, args: any, context: ApolloContext, info: any) => context.prisma.user.findMany(),
    user: (parent: any, args: any, context: ApolloContext, info: any) => context.prisma.user.findFirst({ where: { id: args.id }}),
  },
  Mutation: {
    async addUser(parent: any, args: { user: Prisma.User }, context: ApolloContext, info: any) {
        try {
            return {
                code: "201",
                success: true,
                message: "Created",
                user: await context.prisma.user.create({ data: args.user })
            };
        } catch (err) {
            return {
                code: "500",
                success: false,
                message: err.toString(),
                user: undefined
            };
        }
    },
    async updateUser(parent: any, args: { id: string, user: Prisma.User }, context: ApolloContext, info: any) {
        try {
            return {
                code: "200",
                success: true,
                message: "Updated",
                user: await context.prisma.user.update({ where: {id: args.id }, data: args.user })
            };
        } catch (err) {
            return {
                code: "500",
                success: false,
                message: err.toString(),
                user: undefined
            };
        }
    },
    async deleteUser(parent: any, args: { id: string }, context: ApolloContext, info: any) {
        try {
            return {
                code: "200",
                success: true,
                message: "Updated",
                user: await context.prisma.user.delete({ where: {id: args.id} })
            };
        } catch (err) {
            return {
                code: "500",
                success: false,
                message: err.toString(),
                user: undefined
            };
        }
    },
  }
};

const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req: session }: { req: { session: FirebaseAdmin.auth.DecodedIdToken }, }) => ({
        prisma: new PrismaClient(),
        session: session,
    })
});

export default apolloServer;