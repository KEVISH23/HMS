import { injectable } from "inversify";
import { Logs } from "../models/";
import { ILogs } from "../interfaces";
import { PipelineStage } from "mongoose";

@injectable()
export class LogService {
    async addLogsService(data:object):Promise<void>{
        await Logs.create(data)
    }
    async getLogs(pipeline:PipelineStage[]):Promise<ILogs[]>{
        return await Logs.aggregate(pipeline)
    }

    async updateLogs(id:string,data:object):Promise<void>{
        await Logs.findByIdAndUpdate(id,data)
    }

    async deleteLog(id:string):Promise<void>{
        await Logs.findByIdAndDelete(id)
    }

    async isLogExists(id:string):Promise<ILogs|null>{
        return Logs.findById(id)
    }

}