import { isValidObjectId } from "mongoose"
import { ApiError } from "@utils"
import {responseMessage} from "@constants"

export function updateFunction(id:string,data:any){
    // const {id} = req.params
    if(id && !isValidObjectId(id)){
        throw new ApiError(400,responseMessage.INVALID_ID)
    }
    const {dischargeAt,amount} = data
    if(!dischargeAt||!amount){
        throw new ApiError(401,responseMessage.LOG_UPDATE_REQUIRED)
    }
}

export function deleteFunction(id:string){
 // const {id} = req.params
 if(id && !isValidObjectId(id)){
    throw new ApiError(400,responseMessage.INVALID_ID)
}
}