import { Schema, model, Model, Document } from 'mongoose';
import { BasicUser } from '../objects';

interface UserDocument extends BasicUser, Document {};

export const UserSchema: Schema = new Schema({
    uId: {
        type: String,
        required: true,
    },
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String,
        required: false,
    },
}, { versionKey: false });

UserSchema.virtual("fullName").get(function (this: UserDocument) {
    return this.firstName + " " + this.lastName;
});

const User: Model<UserDocument> = model("User", UserSchema);
export default User;