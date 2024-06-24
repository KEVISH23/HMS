import { Request, Response } from "express";
import {
  controller,
  httpDelete,
  httpGet,
  httpPut,
  httpPost,
  request,
  response,
} from "inversify-express-utils";
import {errorHandler,ApiError} from "@utils";
import { inject } from "inversify";
import { doctorService, LogService } from "@service";
import {responseMessage,status_code,TYPES} from "@constants";
import { ILogs, Iusers, RequestUser, RequestVerify } from "@interface";
import { deleteFunction, updateFunction } from "@handler";
import * as multer from 'multer'
import { doctorSchema, patientSchema } from "@validations";
import * as path from 'node:path'
const RequredRole = role => (req, res, next) => {
  req.requiredRole = role; 
  console.log(req.requiredRole)
  next();
}
const storageConfig = multer.diskStorage({
  destination:path.join(__dirname,"../uploads"),
  filename:(req,file,res)=>{
    console.log(file)
    res(null, req.body.name + "-" + file.originalname);
  }
})
const upload = multer(
  {
    storage:storageConfig,
    dest:'../uploads/',
  }
)
@controller("/doctor")
export class doctorController {
  constructor(
    @inject<doctorService>(TYPES.doctorService)
    private readonly DS: doctorService,
    @inject<LogService>(TYPES.LogService) private LS: LogService
  ) {}

  @httpPost("/register",upload.single('image'))
  async register(
    @request() req: Request,
    @response() res: Response
  ): Promise<void> {
    try {
      const { email, name, password, speciality, dob} = req.body;
     await doctorSchema.validate(req.body)
        await this.DS.registerService({
          email,
          name,
          password,
          speciality,
          dob,
          role: "Doctor",
        });
        res
          .status(status_code.CREATED)
          .json({ message: responseMessage.CREATED });
      
     
    } catch (err: any) {
      const message: string = errorHandler(err);
      res.status(status_code.SERVER_ERROR).json({ message });
    }
  }

  @httpGet("/")
  async getDoctors(
    @request() req: Request,
    @response() res: Response
  ): Promise<void> {
    try {
      const data: Iusers[] = await this.DS.getDocotrs();
      res.status(status_code.SUCCESS).json({ data });
    } catch (err) {
      const message: string = errorHandler(err);
      res.status(status_code.SERVER_ERROR).json({ message });
    }
  }

  @httpPost("/login")
  async loginDoctor(
    @request() req: Request,
    @response() res: Response
  ): Promise<void> {
    try {
      
      const { email, password } = req.body;
      await patientSchema.validate({login:req.body})
      const findData: Iusers | null = await this.DS.isUserExists(email);
      if (!findData) {
        throw new ApiError(503, responseMessage.NOT_REGISTERED);
      }
      const id: string = findData._id ? findData._id : "";
      let isLoggedIn = await this.DS.isLoggedIn(id);
      if (isLoggedIn) {
        throw new ApiError(400, responseMessage.ALREADY_LOGIN);
      }
      await this.DS.loginService(email, password, findData);
      res.status(status_code.SUCCESS).json({ message: responseMessage.LOGIN });
    } catch (err: any) {
      const message: string = errorHandler(err);
      res.status(err.status || status_code.SERVER_ERROR).json({ message });
    }
  }

  @httpPost("/logout", TYPES.IsDoctor)
  async logOut(
    @request() req: RequestVerify,
    @response() res: Response
  ): Promise<void> {
    try {

      const user: RequestUser = req.user ? req.user : {};
      const id: string = user._id ? user._id : "";
      let isLoggedIn = await this.DS.isLoggedIn(id);
      if (!isLoggedIn) {
        throw new ApiError(400, responseMessage.NOT_LOGED_IN);
      }
      user._id ? await this.DS.logoutService(user._id) : null;
      res.status(status_code.SUCCESS).json({ message: responseMessage.LOGOUT });
    } catch (err) {
      const message: string = errorHandler(err);
      res.status(status_code.SERVER_ERROR).json({ message });
    }
  }

  @httpGet("/logs", TYPES.IsDoctor)
  async getLogsByDoctor(
    @request() req: RequestVerify,
    @response() res: Response
  ): Promise<void> {
    try {
      const user: RequestUser = req.user ? req.user : {};
      const id: string = user._id ? user._id : "";
      //temp for this project scenario...
      let isLoggedIn = await this.DS.isLoggedIn(id);
      if (!isLoggedIn) {
        throw new ApiError(401, responseMessage.NOT_LOGED_IN);
      }

      const { search, year, dateRange, disease, page, limit } = req.query;
      
      const data: ILogs[] = await this.DS.getLogService({
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

  @httpPut("/logs/update/:id", TYPES.IsDoctor)
  async updateLog(
    @request() req: RequestVerify,
    @response() res: Response
  ): Promise<void> {
    try {
      // console.log('here')
      const { id } = req.params;
      const { dischargeAt, amount } = req.body;
      updateFunction(id, { dischargeAt, amount });
      const data: ILogs | null = await this.LS.isLogExists(id);
      if (!data) {
        throw new ApiError(404, responseMessage.DNF);
      }
      await this.LS.updateLogs(id, { dischargeAt, amount });
      res
        .status(status_code.SUCCESS)
        .json({ message: responseMessage.UPDATED });
    } catch (err: any) {
      const message: string = errorHandler(err);
      res.status(status_code.SERVER_ERROR).json({ message });
    }
  }

  @httpDelete("/logs/delete/:id", TYPES.IsDoctor)
  async deleteLog(
    @request() req: RequestVerify,
    @response() res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      deleteFunction(id);
      const data: ILogs | null = await this.LS.isLogExists(id);
      if (!data) {
        throw new ApiError(404, responseMessage.DNF);
      }
      await this.LS.deleteLog(id);
      res
        .status(status_code.SUCCESS)
        .json({ message: responseMessage.DELETED });
    } catch (err: any) {
      const message: string = errorHandler(err);
      res.status(status_code.SERVER_ERROR).json({ message });
    }
  }
  //update and delete after getting stufffsss
}
