import { isValidObjectId } from "mongoose"
import { ApiError } from "@utils"
import {responseMessage} from "@constants"
import { logsSchema } from "@validations"

export async function  updateFunction(id:string,data:any){
    // const {id} = req.params
    if(id && !isValidObjectId(id)){
        throw new ApiError(400,responseMessage.INVALID_ID)
    }
    
}

export function deleteFunction(id:string){
 // const {id} = req.params
 if(id && !isValidObjectId(id)){
    throw new ApiError(400,responseMessage.INVALID_ID)
}
}