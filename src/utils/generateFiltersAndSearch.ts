import { PipelineStage } from "mongoose";

export function generateSearch(array:string[],query:any,searchString:string ):any{
    query.$match = {
        ...query.$match,
        $or: array.map((ele) => {
          return { [ele]: { $regex: searchString, $options: "i" } };
        }),
      }

      return query
}

export function generateFilter (array:object[],query:any):any{
    query.$match = {
        ...query.$match,
        $and: array.map((ele) => ele),
      }
    return query
}

export function createPagination(page:number,limit:number):PipelineStage[]{
    return ([{
        $skip: (page - 1) * limit,
      },
      {
        $limit: limit,
      }])
}