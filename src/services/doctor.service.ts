import { injectable } from "inversify";
import * as bcrypt from 'bcrypt'
import { ILogs, Iusers, LogsQuery } from "@interface";
import * as jwt from 'jsonwebtoken'
import { Logs, User } from "@models";
import mongoose, { PipelineStage } from "mongoose";
import { createPagination, generateFilter, generateSearch, logsPipeline, projectLogs,ApiError } from "@utils";

@injectable()
export class doctorService {
    async registerService(data: object): Promise<void> {
        await User.create(data)
    }

      async getDocotrs(): Promise<Iusers[]> {
          return await User.find({role:"Doctor"})
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

    async getLogService(logs:LogsQuery):Promise<ILogs[]>{
        const { search, year, dateRange, disease, page, limit,id } = logs
        let query: any = {
            $match: {},
        };
          let pageNumber = (page && Number(page)) || 1;
          const pageLimit = limit && Number(limit);
          if (pageNumber < 1) {
            pageNumber = 1;
          }
          let rangeArr: string[] = dateRange ? dateRange.toString().split("/") : [];
          let filteredArray = [
            ...(year ? [{ "dateAdmitted.year": Number(year) }] : []),
            ...(dateRange ? [{
              admittedAt:
                rangeArr.length === 2
                  ? { $gte: new Date(rangeArr[0]), $lte: new Date(rangeArr[1]) }
                  : { $gte: new Date(rangeArr[0]) },
            }]:[]),
            ...(disease ? [{ disease }]:[]),
          ];
    
          //dynamic query for filtering
          filteredArray.length > 0
            ? query = generateFilter(filteredArray,query)
            : null;
          //dynamic query for searching
          search && search.toString().trim() !== ""
            ? query = generateSearch([
              "doctorName",
              "patientName",
              "doctorEmail",
              "patientEmail",
              "disease",
              "speciality",
            ],query,search.toString())
            : null;

          const pipeline:PipelineStage[] = [...logsPipeline]
          pipeline.unshift({
            $match:{doctor:new mongoose.Types.ObjectId(id)}
          })
          if (search || filteredArray.length > 0) {
            pipeline.push(query);
          }
          pipeline.push(projectLogs);
          if (pageLimit) {
            pipeline.push(
              ...createPagination(pageNumber,pageLimit)
            );
          }
        return await Logs.aggregate(pipeline)
    }
}