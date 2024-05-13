import { controller,httpDelete,httpGet,httpPost,httpPut,request,response } from "inversify-express-utils";
import { Request,Response } from "express";
import { ApiError } from "../utils/ApiError";
import errorHandler from "../utils/errorHandler";
import status_code from "../contants/status";
import { inject } from "inversify";
import { PatientService } from "../services/patient.service";
import TYPES from "../contants/TYPES";
import responseMessage from "../contants/message";
import { Iusers, RequestUser, RequestVerify } from "../interfaces";
@controller('/patient')
export class PatientController{
    constructor(@inject<PatientService>(TYPES.PatientService) private PS:PatientService){}
    @httpPost('/register')
    async patientRegister(@request() req:Request,@response() res:Response):Promise<void>{
        try{
            const {email,name,password,speciality,dob} = req.body
            if(speciality){
                throw new ApiError(500,'Patient odes not need speaciality')
            }
            await this.PS.registerPatient({email,name,password,dob,role:"Patient"})
            res.status(status_code.CREATED).json({message:responseMessage.CREATED})
        }catch(err:any){
            const message:string = errorHandler(err)
            res.status(err.status || status_code.SERVER_ERROR).json({message})
        }
    }


    @httpGet('/')
    async getPatients(@request() req:Request,@response() res:Response):Promise<void>{
        try{
            const data:Iusers[] = await this.PS.getPatients()
            res.status(status_code.SUCCESS).json({data})
        }catch(err:any){
            const message:string = errorHandler(err)
            res.status(err.status || status_code.SERVER_ERROR).json({message})
        }
    }

    @httpPost('/login')
    async loginPatient(@request() req:Request,@response() res:Response):Promise<void>{
        try{
            const {email,password} = req.body
            if(!email || !password){
                throw new ApiError(503,'Email and password are necessary for login')
            }
            const findData:Iusers|null  = await this.PS.isUserExists(email)
            if(!findData){
                throw new ApiError(503,'You are not registered')
            }
            const id:string = findData._id?findData._id:""
            let isLoggedIn = await this.PS.isLoggedIn(id)
            if(isLoggedIn){
                throw new ApiError(400,'Already Loggeed In')
            }
            await this.PS.loginService(email,password,findData)
            res.status(status_code.SUCCESS).json({message:responseMessage.LOGIN})
        }catch(err:any){
            const message:string = errorHandler(err)
            res.status(err.status || status_code.SERVER_ERROR).json({message})
        }
    }

    @httpPost('/logout',TYPES.IsPatient)
    async logOut(@request() req:RequestVerify,@response() res:Response):Promise<void>{
        try{
            const user:RequestUser = req.user?req.user:{}
            const id:string = user._id?user._id:""
            let isLoggedIn = await this.PS.isLoggedIn(id)
            if(!isLoggedIn){
                throw new ApiError(400,'User not Logged In')
            }
            user._id?
            await this.PS.logoutService(user._id):null
            res.status(status_code.SUCCESS).json({message:responseMessage.LOGOUT})
        }catch(err){
            const message:string = errorHandler(err)
            res.status(status_code.SERVER_ERROR).json({message})
        }
    }
}