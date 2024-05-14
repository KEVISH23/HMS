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
import { ApiError } from "../utils/ApiError";
import errorHandler from "../utils/errorHandler";
import status_code from "../contants/status";
import { inject } from "inversify";
import { PatientService } from "../services/patient.service";
import TYPES from "../contants/TYPES";
import responseMessage from "../contants/message";
import { ILogs, Iusers, RequestUser, RequestVerify } from "../interfaces";
import mongoose, { PipelineStage } from "mongoose";
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
      const { email, name, password, speciality, dob } = req.body;
      if (speciality) {
        throw new ApiError(500, "Patient odes not need speaciality");
      }
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
      if (!email || !password) {
        throw new ApiError(503, "Email and password are necessary for login");
      }
      const findData: Iusers | null = await this.PS.isUserExists(email);
      if (!findData) {
        throw new ApiError(503, "You are not registered");
      }
      const id: string = findData._id ? findData._id : "";
      let isLoggedIn = await this.PS.isLoggedIn(id);
      if (isLoggedIn) {
        throw new ApiError(400, "Already Loggeed In");
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
        throw new ApiError(400, "User not Logged In");
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
      let query: any = {
        $match: {},
      };
      let pageNumber = (page && Number(page)) || 1;
      const pageLimit = limit && Number(limit);
      if (pageNumber < 1) {
        pageNumber = 1;
      }

      let rangeArr: string[] = dateRange ? dateRange.toString().split("/") : [];
      let filteredArray = [
        ...(year ? [{ "dateAdmitted.year": Number(year) }] : []),
        ...(dateRange ? [{
          admittedAt:
            rangeArr.length === 2
              ? { $gte: new Date(rangeArr[0]), $lte: new Date(rangeArr[1]) }
              : { $gte: new Date(rangeArr[0]) },
        }]:[]),
        ...(disease ? [{ disease }]:[]),
      ];

      //dynamic query for filtering
      filteredArray.length > 0
        ? (query.$match = {
            ...query.$match,
            $and: filteredArray.map((ele) => ele),
          })
        : null;
      //dynamic query for searching
      search && search.toString().trim() !== ""
        ? (query.$match = {
            ...query.$match,
            $or: [
              "doctorName",
              "patientName",
              "doctorEmail",
              "patientEmail",
              "disease",
              "speciality",
            ].map((ele) => {
              return { [ele]: { $regex: search, $options: "i" } };
            }),
          })
        : null;

      // let filteredArray = [year&&"dateAdmitted.year",dateRange&&"admittedAt",disease&&"disease"].filter((ele)=>ele)
      // let filteredArray = [year&&{"dateAdmitted.year":year},dateRange&&{"admittedAt":rangeArr.length===2?true:false}].filter((ele)=>ele)

      // res.json(query)
      const pipeline: PipelineStage[] = [
        {
          $match: { patient: new mongoose.Types.ObjectId(id) },
        },
        {
          $lookup: {
            from: "users",
            localField: "doctor",
            foreignField: "_id",
            as: "result",
          },
        },
        {
          $unwind: {
            path: "$result",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            speciality: "$result.speciality",
            doctorName: "$result.name",
            doctorDOB: "$result.dob",
            doctorEmail: "$result.email",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "patient",
            foreignField: "_id",
            as: "patientResult",
          },
        },
        {
          $unwind: {
            path: "$patientResult",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            patientName: "$patientResult.name",
            patientDOB: "$patientResult.dob",
            patientEmail: "$patientResult.email",
            dateAdmitted: {
              $dateToParts: { date: "$admittedAt" },
              // $toDate:'$admittedAt'
              // $dateTrunc:{date:'$admittedAt',unit:"month"}
            },
          },
        },
      ];
      if (search || filteredArray.length > 0) {
        pipeline.push(query);
      }
      pipeline.push({
        $project: {
          result: 0,
          patientResult: 0,
          patient: 0,
          doctor: 0,
          createdAt: 0,
          updatedAt: 0,
          __v: 0,
          dateAdmitted: 0,
        },
      });
      if (pageLimit) {
        pipeline.push(
          {
            $skip: (pageNumber - 1) * pageNumber,
          },
          {
            $limit: pageLimit,
          }
        );
      }
    //   res.json(pipeline)
      const data: ILogs[] = await this.PS.getLogService(pipeline);
      res.status(status_code.SUCCESS).json({ data });
      // console.log(req.user)
    } catch (err: any) {
      const message: string = errorHandler(err);
      res.status(status_code.SERVER_ERROR).json({ message });
    }
  }
}
