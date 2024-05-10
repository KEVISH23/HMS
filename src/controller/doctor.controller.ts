import { Request,Response } from "express";
import { controller, httpDelete,httpGet,httpPut,httpPost,request,response } from "inversify-express-utils";
import jwt from 'jsonwebtoken'
import errorHandler from "../utils/errorHandler";
import status_code from "../contants/status";
import { inject } from "inversify";
import { doctorService } from "../services";
import TYPES from "../contants/TYPES";
import responseMessage from "../contants/message";
import { Iusers, RequestVerify } from "../interfaces";
import { ApiError } from "../utils/ApiError";

@controller('/doctor')
export class doctorController{
    constructor(
        @inject<doctorService>(TYPES.doctorService) private readonly DS:doctorService
    ){}


    @httpPost('/register')
    async register(@request() req:Request,@response() res:Response):Promise<void>{
        try{
            const {email,name,password,speciality,dob} = req.body
            if(!speciality){
                throw new ApiError(500,'Doctor must have speciality')
            }
            await this.DS.registerService({email,name,password,speciality,dob,role:"Doctor"})
            res.status(status_code.CREATED).json({message:responseMessage.CREATED})
        }catch(err:any){
            const message:string = errorHandler(err)
            res.status(status_code.SERVER_ERROR).json({message})
        }
    }


    @httpGet('/')
    async getDoctors(@request() req:Request,@response() res:Response):Promise<void>{
        try{
            const data:Iusers[] = await this.DS.getDocotrs()
            res.status(status_code.SUCCESS).json({data})
        }catch(err){
            const message:string = errorHandler(err)
            res.status(status_code.SERVER_ERROR).json({message})
        }
    }

    @httpPost('/login')
    async loginDoctor(@request() req:Request,@response() res:Response):Promise<void>{
        try{
            const {email,password} = req.body
            if(!email || !password){
                throw new ApiError(503,'Email and password are necessary for login')
            }
            const findData:Iusers|null  = await this.DS.isUserExists(email)
            if(!findData){
                throw new ApiError(503,'You are not registered')
            }
            let isLoggedIn = await this.DS.isLoggedIn(email)
            if(isLoggedIn){
                throw new ApiError(400,'Already Loggeed In')
            }
            await this.DS.loginService(email,password,findData)
            res.status(status_code.SUCCESS).json({message:responseMessage.LOGIN})
        }catch(err:any){
            const message:string = errorHandler(err)
            res.status(err.status || status_code.SERVER_ERROR).json({message})
        }
    }

    @httpPost('/logout',TYPES.IsDoctor)
    async logOut(@request() req:RequestVerify,@response() res:Response):Promise<void>{
        try{
            // const {_id} = req.user
            // await this.DS.logoutService(_id)
        }catch(err){
            const message:string = errorHandler(err)
            res.status(status_code.SERVER_ERROR).json({message})
        }
    }
}