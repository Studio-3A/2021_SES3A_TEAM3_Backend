import { UserController } from "./User/User";
import { TripController } from "./Trip/Trip";

const userController = new UserController();
const tripController = new TripController();

export {
    userController,
    tripController
};
