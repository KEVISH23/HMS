import { injectable } from "inversify";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { ApiError } from "../utils/ApiError";
// import { User } from "@models";
import { Logs, User } from "../models/index";
import { ILogs, Iusers } from "../interfaces";
import { PipelineStage } from "mongoose";

@injectable()
export class PatientService{
    async registerPatient(data:object):Promise<void>{
        await  User.create(data)
    }

    async getPatients():Promise<Iusers[]>{
        return await User.find({role:"Patient"})
    }

    async isUserExists(email: string): Promise<Iusers | null> {
        return await User.findOne({ email })
    }

    async loginService(email: string, password: string, data: Iusers): Promise<void> {
        let comparePassword = bcrypt.compareSync(password, data.password)
        if (!comparePassword) {
            throw new ApiError(401, 'Invalid Credentials')
        }
        let token: string = jwt.sign({ _id: data._id, role: data.role, email: data.email }, "bhaagMilkhaBhhag")
        await User.findOneAndUpdate({ email }, {
            $set: { token }
        })
    }

    async isLoggedIn(id: string): Promise<Iusers | null> {
        return await User.findOne({
            _id: id,
            $expr: { $gt: [{ $strLenCP: '$token' }, 0] }
        }
        )
    }

    async logoutService(id: string): Promise<void> {
        await User.findByIdAndUpdate(id, {
            $set: { token: "" }
        })
    }

    async getLogService(pipeline:PipelineStage[]):Promise<ILogs[]>{
        // console.log(pipeline)
        return await Logs.aggregate(pipeline)
    }
}