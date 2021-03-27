import { Request, Response } from "express";
import { BasicUser } from "../../common/objects";
import { Params, StatusCode } from "../../common/expresstypes";
import { CrudController } from "../CrudController";

const user: BasicUser = { uId: "s133a1", email: "thechosenone@hogwarts.com.uk", firstName: "Harry", lastName: "Potter" };

export class UserController extends CrudController {
    public create(req: Request<Params>, res: Response): void {
        // check if all required fields were supplied
        // create the user in mongo, then return
        res.status(StatusCode.Created).json(user);
    }

    public read(req: Request<Params>, res: Response): void {
        // should support getting a single user or more
        // find user based on id / certain filter params
        res.status(StatusCode.OK).json(user);
    }

    public update(req: Request<Params>, res: Response): void {
        // check if all required fields were supplied - dont allow modding of secure fields
        // modify the user in mongo, then return
        res.status(StatusCode.NoContent).send();
    }

    public delete(req: Request<Params>, res: Response): void {
        // not sure if we need this one at all :/ - maybe just add a deleted attribute and set that to true
        throw new Error("Method not implemented.");
    }
}
