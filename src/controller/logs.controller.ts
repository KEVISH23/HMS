import { Request,Response } from "express";
import { controller, httpDelete,httpGet,httpPut,httpPost,request,response } from "inversify-express-utils";
import jwt from 'jsonwebtoken'
import errorHandler from "../utils/errorHandler";
import status_code from "../contants/status";
import { inject } from "inversify";
import { doctorService, LogService } from "../services";
import TYPES from "../contants/TYPES";
import responseMessage from "../contants/message";
import {  ILogs, RequestUser, RequestVerify } from "../interfaces";
import { ApiError } from "../utils/ApiError";
import { isValidObjectId, PipelineStage } from "mongoose";
import { deleteFunction, updateFunction } from "../handlers/functionsHandler";

@controller('/logs')
export class LogsController{
    constructor(@inject<LogService>(TYPES.LogService) private LS:LogService){}

    @httpPost('/addLog')
    async addLog(@request() req:Request ,@response() res:Response):Promise<void>{
        try{
            const {doctor,patient,disease,admittedAt} = req.body
            await this.LS.addLogsService({doctor,patient,disease,admittedAt})
            res.status(status_code.CREATED).json({message:responseMessage.CREATED})
        }catch(err:any){
            const message:string = errorHandler(err)
            res.status(err.status || status_code.SERVER_ERROR).json({message})
        }
    }

    @httpGet('/')
    async getLogs(@request() req:Request ,@response() res:Response):Promise<void>{
        try{
            const {search} = req.query;
            let query:any = {
                $match:{}
            }
            search&&search.toString().trim()!==""?query.$match={
                ...query.$match,
                $or:["doctorName"].map(ele=>{return({[ele]:{$regex:search,$options:'i'}})})
            }:null

            
            // console.log(query)
            // res.json(query)
            const pipeline:PipelineStage[] = [
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
            const data:ILogs[] = await this.LS.getLogs(pipeline)
            res.status(status_code.SUCCESS).json({data})
        }catch(err:any){
            const message:string = errorHandler(err)
            res.status(err.status || status_code.SERVER_ERROR).json({message})
        }
    }

    @httpPut('/update/:id')
    async updateLog(@request() req:Request ,@response() res:Response):Promise<void>{
        try{
            const {id} = req.params
            const {dischargeAt,amount} = req.body
           updateFunction(id,{dischargeAt,amount})
            await this.LS.updateLogs(id,{dischargeAt,amount})
            res.status(status_code.SUCCESS).json({message:responseMessage.UPDATED})
        }catch(err:any){
            const message:string = errorHandler(err)
            res.status(err.status || status_code.SERVER_ERROR).json({message})
        }
    }

    @httpDelete('/delete/:id')
    async deleteLog(@request() req:Request ,@response() res:Response):Promise<void>{
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
            res.status(err.status || status_code.SERVER_ERROR).json({message})
        }
    }
}