import {
  controller,
  httpDelete,
  httpGet,
  httpPost,
  httpPut,
  request,
  response,
} from "inversify-express-utils";
import { Request, Response } from "express";
import {errorHandler,ApiError} from "@utils";
import {status_code,responseMessage,TYPES} from "@constants";
import { inject } from "inversify";
import { PatientService } from "@service";
import { ILogs, Iusers, RequestUser, RequestVerify } from "@interface";
import { patientSchema } from "../validations/validationsSchema";
@controller("/patient")
export class PatientController {
  constructor(
    @inject<PatientService>(TYPES.PatientService) private PS: PatientService
  ) {}
  @httpPost("/register")
  async patientRegister(
    @request() req: Request,
    @response() res: Response
  ): Promise<void> {
    try {
      const { email, name, password, dob } = req.body;
      const data = {
        register:req.body
      }
      await patientSchema.validate(data)
      await this.PS.registerPatient({
        email,
        name,
        password,
        dob,
        role: "Patient",
      });
      res
        .status(status_code.CREATED)
        .json({ message: responseMessage.CREATED });
    } catch (err: any) {
      const message: string = errorHandler(err);
      res.status(err.status || status_code.SERVER_ERROR).json({ message });
    }
  }

  @httpGet("/")
  async getPatients(
    @request() req: Request,
    @response() res: Response
  ): Promise<void> {
    try {
      const data: Iusers[] = await this.PS.getPatients();
      res.status(status_code.SUCCESS).json({ data });
    } catch (err: any) {
      const message: string = errorHandler(err);
      res.status(err.status || status_code.SERVER_ERROR).json({ message });
    }
  }

  @httpPost("/login")
  async loginPatient(
    @request() req: Request,
    @response() res: Response
  ): Promise<void> {
    try {
      const { email, password } = req.body;
      await patientSchema.validate({login:req.body})
      const findData: Iusers | null = await this.PS.isUserExists(email);
      if (!findData) {
        throw new ApiError(503, responseMessage.NOT_REGISTERED);
      }
      const id: string = findData._id ? findData._id : "";
      let isLoggedIn = await this.PS.isLoggedIn(id);
      if (isLoggedIn) {
        throw new ApiError(400, responseMessage.ALREADY_LOGIN);
      }
      await this.PS.loginService(email, password, findData);
      res.status(status_code.SUCCESS).json({ message: responseMessage.LOGIN });
    } catch (err: any) {
      const message: string = errorHandler(err);
      res.status(err.status || status_code.SERVER_ERROR).json({ message });
    }
  }

  @httpPost("/logout", TYPES.IsPatient)
  async logOut(
    @request() req: RequestVerify,
    @response() res: Response
  ): Promise<void> {
    try {
      const user: RequestUser = req.user ? req.user : {};
      const id: string = user._id ? user._id : "";
      let isLoggedIn = await this.PS.isLoggedIn(id);
      if (!isLoggedIn) {
        throw new ApiError(400, responseMessage.NOT_LOGED_IN);
      }
      user._id ? await this.PS.logoutService(user._id) : null;
      res.status(status_code.SUCCESS).json({ message: responseMessage.LOGOUT });
    } catch (err) {
      const message: string = errorHandler(err);
      res.status(status_code.SERVER_ERROR).json({ message });
    }
  }

  @httpGet("/logs", TYPES.IsPatient)
  async getLogsByPatient(
    @request() req: RequestVerify,
    @response() res: Response
  ): Promise<void> {
    try {
      const user: RequestUser = req.user ? req.user : {};
      const id: string = user._id ? user._id : "";
      //temp for this project scenario...
      // let isLoggedIn = await this.DS.isLoggedIn(id)
      // if(!isLoggedIn){
      //     throw new ApiError(401,'User not logged In')
      // }

      const { search, year, dateRange, disease, page, limit } = req.query;
      
        
      const data: ILogs[] = await this.PS.getLogService({
        search: search?.toString(),
        year: year?.toString(),
        dateRange: dateRange?.toString(),
        disease: disease?.toString(),
        page: page?.toString(),
        limit: limit?.toString(),
        id
      });
      res.status(status_code.SUCCESS).json({ data });
      // console.log(req.user)
    } catch (err: any) {
      const message: string = errorHandler(err);
      res.status(status_code.SERVER_ERROR).json({ message });
    }
  }
}
