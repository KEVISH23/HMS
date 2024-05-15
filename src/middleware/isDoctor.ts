import { BaseMiddleware} from 'inversify-express-utils'
import {NextFunction,Response} from 'express'
import * as  jwt from "jsonwebtoken"
import { ApiError , errorHandler} from '@utils'
import {status_code} from '@constants'
import {  RequestVerify } from '@interface'

export class IsDoctor extends BaseMiddleware{
    handler(req: RequestVerify, res: Response, next: NextFunction): void {
        try{

            const {token} = req.headers
            if(!token){
                throw new ApiError(400,'Token not provided')
            }
            jwt.verify(token.toString(),"bhaagMilkhaBhhag",(err,decoded:any)=>{
                if(err){
                    throw new ApiError(401,'Invalid Token')
                }
                // console.log(decoded)
                if(decoded.role === 'Doctor'){
                    req.user = decoded
                    next()
                }else{
                    throw new ApiError(401,'Sorry you cant access this route')
                }
                // req.user = decoded
            })
        }catch(err:any){
            const message:string = errorHandler(err)
            res.status(err.status || status_code.SERVER_ERROR).json({message})
        }
    }
}
