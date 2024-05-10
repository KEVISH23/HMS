import jwt from "jsonwebtoken"
import { ApiError } from "./ApiError"
export default function(token:string){
    jwt.verify(token?.toString(),(err,decoded):object=>{
        if(err){
            throw new ApiError(401,'Invalid Token')
        }
        return decoded
    })
}