import { speciality } from "../enum";
import mongoose, { Schema, Model } from "mongoose";
import bcrypt from 'bcrypt'
const userSchema = new Schema({
    email: {
        type: String,
        trim: true,
        unique: true,
        required: [true, 'Email is required'],
    },
    password: {
        type: String,
        trim: true,
        required: [true, 'Password is required'],
        minlength: [4, 'Minimum 4 characters for password']
    },
    name: {
        type: String,
        trim: true,
        required: [true, 'Name is required'],
        maxLength: [50, 'Maximun 50 characters for name']
    },
    dob: {
        type: Date,
        trim: true,
        required: [true, "D.O.B required"]
    },
    speciality: {
        type: String,
        enum: Object.values(speciality),
        // default:""
    },
    role: {
        type: String,
        required: [true, "Role is required"],
        enum: ["Doctor", "Patient"]
    },
    token: {
        type: String,
        default: ""
    }
})
userSchema.pre('save', async function (next) {
    if (this.password) {
        const salt = bcrypt.genSaltSync(10)
        const hashPassword = bcrypt.hashSync(this.password, salt)
        this.password = hashPassword
    }
    return next();
})

// userSchema.methods.
const User = mongoose.model('user', userSchema)
export { User }
