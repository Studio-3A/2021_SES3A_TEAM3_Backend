import { Request, Response } from "express";
import { BasicUser } from "../../common/objects";
import { Params, StatusCode } from "../../common/expresstypes";
import { CrudController } from "../CrudController";

import User from "../../common/schema/user";
import { MONGO } from "../../config/constants";
import Mongoose, { connect } from 'mongoose';
import { database } from "firebase-admin";


const userTestData: BasicUser = { uId: "s133a1", email: "thechosenone@hogwarts.com.uk", firstName: "Harry", lastName: "Potter" };

// TODO: Handle Specific Errors returned from Mongoose such as an unaccessible database
export class UserController extends CrudController {
    static database = connect(`mongodb://${MONGO.USERNAME}:${MONGO.PASSWORD}@${MONGO.HOST}`);
    public async create(req: Request<Params>, res: Response) {
        // TODO: Check if all required fields were supplied and data was valid this could be done in mongoose using Schema using the validate member for a given paramater or validator functions 
        // TODO: Check for possible duplicate accounts before creation
        try {
            const connection = await database;

            const userData = req.body;
            const user = new User(userData);
            const savedUser = await user.save();

            res.status(StatusCode.Created).json(savedUser);
        } catch (err) {
            res.status(StatusCode.InternalServerError).json(err);
        }
    }

    public async read(req: Request<Params>, res: Response) {
        // TODO: Make sure that router catches "GET /users/:objectId" and sets the req.params.objectId correctly. 
        // TODO: Use User.find({}) to allow user specified filters
        try {
            const connection = await database;

            const id = req.params.objectID;
            if (id !== undefined) {
                const user = await User.findById(id);
                if (user !== null) {
                    res.status(StatusCode.OK).json(user);
                } else {
                    res.status(StatusCode.NotFound).send();
                }
            } else {
                const users = await User.find();
                res.status(StatusCode.OK).json(users);
            }

        } catch (err) {
            res.status(StatusCode.InternalServerError).json(err);
        }
    }

    public async update(req: Request<Params>, res: Response) {
        // TODO: check if all required fields were supplied - dont allow modding of secure fields
        // TODO: Check for possible duplicate accounts before update
        try {
            const connection = await database;

            const id = req.params.objectId;
            const userData = req.body;

            if (id !== undefined) {
                const user = await User.findByIdAndUpdate(id, userData);
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
            const connection = await database;

            const id = req.params.objectId;
            if (id !== undefined) {
                await User.findByIdAndDelete(id);
                res.status(StatusCode.NoContent).send();
            } else {
                // CAREFUL: This will delete all users don't run it... 
                const users = await User.deleteMany();
                res.status(StatusCode.NoContent).send();
            }

        } catch (err) {
            res.status(StatusCode.InternalServerError).json(err);
        }
    }
}
