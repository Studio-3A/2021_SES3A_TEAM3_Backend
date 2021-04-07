import { Request, Response } from "express";
import { Params, StatusCode } from "../../common/expresstypes";
import { CrudController } from "../CrudController";

import Prisma, { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();

const userTestData: Prisma.User = { id: "s133a1" };

// TODO: Handle Specific Errors returned from Prisma such as an unaccessible database
export class UserController extends CrudController {
    public async create(req: Request<Params>, res: Response) {
        // TODO: Check if all required fields were supplied and data was valid this could be done in mongoose using Schema using the validate member for a given paramater or validator functions 
        // TODO: Check for possible duplicate accounts before creation
        try {
            const userData = req.body;
            const user = await prisma.user.create({ data: userData });
            res.status(StatusCode.Created).json(user);
        } catch (err) {
            res.status(StatusCode.InternalServerError).json(err);
        }
    }

    public async read(req: Request<Params>, res: Response) {
        // TODO: Make sure that router catches "GET /users/:objectId" and sets the req.params.objectId correctly. 
        // TODO: Use User.find({}) to allow user specified filters
        try {

            const id = req.params.objectId;
            if (id !== undefined) {
                const user = await prisma.user.findFirst({ where: {id: id} });
                if (user !== null) {
                    res.status(StatusCode.OK).json(user);
                } else {
                    res.status(StatusCode.NotFound).send();
                }
            } else {
                const users = await prisma.user.findMany();
                res.status(StatusCode.OK).json(users);
            }

        } catch (err) {
            res.status(StatusCode.InternalServerError).json(err);
            console.error(err)
        }
    }

    public async update(req: Request<Params>, res: Response) {
        // TODO: check if all required fields were supplied - dont allow modding of secure fields
        // TODO: Check for possible duplicate accounts before update
        try {
            const id = req.params.objectId;
            const userData = req.body;

            if (id !== undefined) {
                const user = await prisma.user.update({ where: {id: id}, data: userData });
                if (user !== null) {
                    res.status(StatusCode.OK).json(user);
                } else {
                    res.status(StatusCode.NotFound).send();
                }
            } else {
                res.status(StatusCode.NotFound).send();
            }

        } catch (err) {
            res.status(StatusCode.InternalServerError).json(err);
        }
    }

    public async delete(req: Request<Params>, res: Response) {
        // not sure if we need this one at all :/ - maybe just add a deleted attribute and set that to true
        // res.status(StatusCode.MethodNotAllowed).send();
        // throw new Error("Method not implemented.");

        // TODO: Make sure that router catches "DELETE /users/:objectId" and sets the req.params.objectId correctly.
        try {
            const id = req.params.objectId;
            if (id !== undefined) {
                const user = await prisma.user.delete({ where: {id: id}});
                res.status(StatusCode.NoContent).send(user);
            } else {
                // CAREFUL: This will delete all users don't run it... 
                const users = await prisma.user.deleteMany({ where: {id: id}});
                res.status(StatusCode.NoContent).send();
            }

        } catch (err) {
            res.status(StatusCode.InternalServerError).json(err);
        }
    }
}
