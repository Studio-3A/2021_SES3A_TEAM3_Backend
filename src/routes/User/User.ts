import express, { Request, Response } from "express";
import { userController } from "../../controllers";

export const userRouter = express.Router({
    strict: true
});

userRouter.post("/", async (req: Request, res: Response) => {
    userController.create(req, res);
});

userRouter.get("/", (req: Request, res: Response) => {
    userController.read(req, res);
});

// Should we use PATCH (was already here) or PUT (a more common update HTTP verb)
// I will support both for now
userRouter.patch("/:objectId", (req: Request, res: Response) => {
    userController.update(req, res);
});

userRouter.put("/:objectId", (req: Request, res: Response) => {
    userController.update(req, res);
});

userRouter.delete("/", (req: Request, res: Response) => {
    userController.delete(req, res);
});

userRouter.delete("/:objectId", (req: Request, res: Response) => {
    userController.delete(req, res);
});