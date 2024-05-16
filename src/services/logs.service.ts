import { injectable } from "inversify";
import { Logs } from "@models";
import { ILogs } from "@interface";
import { PipelineStage } from "mongoose";
import { LogsQuery } from "@interface";
import { createPagination, generateFilter, generateSearch, logsPipeline, projectLogs } from "@utils";

@injectable()
export class LogService {
    async addLogsService(data:object):Promise<void>{
        await Logs.create(data)
    }
    async getLogs(logs:LogsQuery):Promise<ILogs[]>{
        const { search, year, dateRange, disease, page, limit,sortBy } = logs
        // console.log(sortBy)
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
    
    
          // let filteredArray = [year&&"dateAdmitted.year",dateRange&&"admittedAt",disease&&"disease"].filter((ele)=>ele)
          // let filteredArray = [year&&{"dateAdmitted.year":year},dateRange&&{"admittedAt":rangeArr.length===2?true:false}].filter((ele)=>ele)
    
          // res.json(query)
          const pipeline:PipelineStage[] = [...logsPipeline]
          if (search || filteredArray.length > 0) {
            pipeline.push(query);
          }
          pipeline.push(projectLogs);
          if (pageLimit) {
            pipeline.push(
              ...createPagination(pageNumber,pageLimit)
            );
          }
          
          let obj = {}
          sortBy && sortBy.forEach((ele)=>{
            const d2 = ele.split(':')
            obj[d2[0]] = Number(d2[1])
          })


          // let sortQuery= sortBy.join()
          // sortQuery:JSON =  JSON.parse(sortQuery)
          // console.log(sortBy.join())
          //   sortBy.forEach(ele=>{
          //     const key = Object.keys(ele)
              
          //     console.log(ele,key)
          //   })
          
        // console.log(sortBy)

          sortBy && pipeline.push({
            $sort:{
              ...obj
            }
          })

          console.log(pipeline)
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