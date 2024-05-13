import { Request,Response } from "express";
import { controller, httpDelete,httpGet,httpPut,httpPost,request,response } from "inversify-express-utils";
import jwt from 'jsonwebtoken'
import errorHandler from "../utils/errorHandler";
import status_code from "../contants/status";
import { inject } from "inversify";
import { doctorService, LogService } from "../services";
import TYPES from "../contants/TYPES";
import responseMessage from "../contants/message";
import { ILogs, Iusers, RequestUser, RequestVerify } from "../interfaces";
import { ApiError } from "../utils/ApiError";
import { deleteFunction, updateFunction } from "../handlers/functionsHandler";
import mongoose, { PipelineStage } from "mongoose";

@controller('/doctor')
export class doctorController{
    constructor(
        @inject<doctorService>(TYPES.doctorService) private readonly DS:doctorService,
        @inject<LogService>(TYPES.LogService) private LS:LogService
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
            const id:string = findData._id?findData._id:""
            let isLoggedIn = await this.DS.isLoggedIn(id)
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
            const user:RequestUser = req.user?req.user:{}
            const id:string = user._id?user._id:""
            let isLoggedIn = await this.DS.isLoggedIn(id)
            if(!isLoggedIn){
                throw new ApiError(400,'User not logged In')
            }
            user._id?
            await this.DS.logoutService(user._id):null
            res.status(status_code.SUCCESS).json({message:responseMessage.LOGOUT})
        }catch(err){
            const message:string = errorHandler(err)
            res.status(status_code.SERVER_ERROR).json({message})
        }
    }


    @httpGet('/logs',TYPES.IsDoctor)
    async getLogsByDoctor(@request() req:RequestVerify,@response() res:Response):Promise<void>{
        try{
            // console.log('here')
            // const {}
            const user:RequestUser = req.user?req.user:{}
            const id:string = user._id?user._id:""
            //temp for this project scenario...
            let isLoggedIn = await this.DS.isLoggedIn(id)
            if(!isLoggedIn){
                throw new ApiError(401,'User not logged In')
            }
            // console.log(id);
            
            const pipeline:PipelineStage[] = [
                {
                  $match:{
                    doctor:new mongoose.Types.ObjectId(id)
                  }
                }
                ,
                {
                  $lookup: {
                    from: "users",
                    localField: "doctor",
                    foreignField: "_id",
                    as: "result"
                  }
                }
                ,{
                  $unwind: {
                    path: "$result",
                    preserveNullAndEmptyArrays: true
                  }
                }
                ,{
                  $addFields: {
                    speciality: "$result.speciality",
                    doctorName:"$result.name",
                    doctorDOB:"$result.dob",
                    doctorEmail:"$result.email"
                  }
                }
                ,{
                  $lookup: {
                    from: "users",
                    localField: "patient",
                    foreignField: "_id",
                    as: "patientResult"
                  }
                }
                ,{
                  $unwind: {
                    path: "$patientResult",
                    preserveNullAndEmptyArrays: true
                  }
                }
                ,{
                  $addFields: {
                    patientName:"$patientResult.name",
                    patientDOB:"$patientResult.dob",
                    patientEmail:"$patientResult.email"
                  }
                }
                ,{
                  $project:{
                    result:0,
                    patientResult:0,
                    patient:0,
                    doctor:0,
                    createdAt:0,
                    updatedAt:0,
                    __v:0
                  }
                }                
              ]
            const data:ILogs[] = await this.DS.getLogService(pipeline)
            res.status(status_code.SUCCESS).json({data})
            // console.log(req.user)
        }catch(err:any){
            const message:string = errorHandler(err)
            res.status(status_code.SERVER_ERROR).json({message})
        }
    }

    @httpPut('/logs/update/:id',TYPES.IsDoctor)
    async updateLog(@request() req:RequestVerify,@response() res:Response):Promise<void>{
        try{
            // console.log('here')
            const {id} = req.params
            const {dischargeAt,amount} = req.body
            updateFunction(id,{dischargeAt,amount})
            const data:ILogs|null = await this.LS.isLogExists(id)
            if(!data){
                throw new ApiError(404,responseMessage.DNF)
            } 
            await this.LS.updateLogs(id,{dischargeAt,amount})
            res.status(status_code.SUCCESS).json({message:responseMessage.UPDATED})
            
        }catch(err:any){
            const message:string = errorHandler(err)
            res.status(status_code.SERVER_ERROR).json({message})
        }
    }

    @httpDelete('/logs/delete/:id',TYPES.IsDoctor)
    async deleteLog(@request() req:RequestVerify,@response() res:Response):Promise<void>{
        try{
            const {id} = req.params
            deleteFunction(id)
            const data:ILogs|null = await this.LS.isLogExists(id)
            if(!data){
                throw new ApiError(404,responseMessage.DNF)
            } 
            await this.LS.deleteLog(id)
            res.status(status_code.SUCCESS).json({message:responseMessage.DELETED})
        }catch(err:any){
            const message:string = errorHandler(err)
            res.status(status_code.SERVER_ERROR).json({message})
        }
    }
    //update and delete after getting stufffsss
}

