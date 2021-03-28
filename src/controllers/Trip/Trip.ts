import { Request, Response } from "express";
import { BasicUser, Trip, TripGenerationInput } from "../../common/objects";
import { StatusCode } from "../../common/expresstypes";
import { CrudController } from "../CrudController";

export type TripRequest = Request<unknown, unknown, TripGenerationInput, unknown>;

const trip: Trip = { tripId: "98h2nd92" }
export class TripController extends CrudController {
    public create(req: TripRequest, res: Response): void {
        // check if all required fields were supplied
        // generate the trip
        // call the python code here
        // return
        res.status(StatusCode.Created).json(trip);
    }

    public read(req: Request, res: Response): void {
        // should support getting a single user or more
        // find trip based on id / certain filter params
        res.status(StatusCode.OK).json(trip);
    }

    public update(req: Request, res: Response): void {
        const id = req.params.tripId;
        // check if all required fields were supplied - dont allow modding of secure fields
        // modify the trip in mongo, then return
        res.status(StatusCode.NoContent).send();
    }

    public delete(req: Request, res: Response): void {
        const id = req.params.tripId;
        // not sure if we need this one at all :/ - maybe just add a deleted attribute and set that to true
        throw new Error("Method not implemented.");
    }
}
