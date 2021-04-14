import { gql } from "apollo-server-express";
import Prisma from "@prisma/client";
import { ApolloContext } from "./index";

export const typeDefinitions = gql`
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

export const queries = {
    users: (parent: any, args: any, context: ApolloContext, info: any) => context.prisma.user.findMany(),
    user: (parent: any, args: any, context: ApolloContext, info: any) => context.prisma.user.findFirst({ where: { id: args.id }}),
};


export const mutations = {
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
};