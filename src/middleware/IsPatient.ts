import {request,response,next, BaseMiddleware} from 'inversify-express-utils'
import {NextFunction, Request,Response} from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ParsedQs } from 'qs'
import jwt from "jsonwebtoken"
import { ApiError } from '../utils/ApiError'
import errorHandler from '../utils/errorHandler'
import status_code from '../contants/status'
import { RequestUser, RequestVerify } from '../interfaces'

export class IsPatient extends BaseMiddleware{
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
                console.log(decoded)
                if(decoded.role === 'Patient'){
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
