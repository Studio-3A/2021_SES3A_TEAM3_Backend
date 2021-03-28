import express, { Request, Response } from "express";
import { TripGenerationInput } from "../../common/objects";
import { tripController } from "../../controllers";
import { TripRequest } from "../../controllers/Trip/Trip";

export const tripRouter = express.Router({
    strict: true
});

tripRouter.post("/", (req: TripRequest, res: Response) => {
    tripController.create(req, res);
});

tripRouter.get("/", (req: Request, res: Response) => {
    tripController.read(req, res);
});

tripRouter.patch("/:tripId", (req: Request, res: Response) => {
    tripController.update(req, res);
});

tripRouter.delete("/:tripId", (req: Request, res: Response) => {
    tripController.delete(req, res);
});
