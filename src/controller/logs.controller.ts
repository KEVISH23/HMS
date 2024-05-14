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
import jwt from "jsonwebtoken";
import errorHandler from "../utils/errorHandler";
import status_code from "../contants/status";
import { inject } from "inversify";
import { doctorService, LogService } from "../services";
import TYPES from "../contants/TYPES";
import responseMessage from "../contants/message";
import { ILogs, RequestUser, RequestVerify } from "../interfaces";
import { ApiError } from "../utils/ApiError";
import { isValidObjectId, PipelineStage } from "mongoose";
import { deleteFunction, updateFunction } from "../handlers/functionsHandler";

@controller("/logs")
export class LogsController {
  constructor(@inject<LogService>(TYPES.LogService) private LS: LogService) {}

  @httpPost("/addLog")
  async addLog(
    @request() req: Request,
    @response() res: Response
  ): Promise<void> {
    try {
      const { doctor, patient, disease, admittedAt } = req.body;
      await this.LS.addLogsService({ doctor, patient, disease, admittedAt });
      res
        .status(status_code.CREATED)
        .json({ message: responseMessage.CREATED });
    } catch (err: any) {
      const message: string = errorHandler(err);
      res.status(err.status || status_code.SERVER_ERROR).json({ message });
    }
  }

  @httpGet("/")
  async getLogs(
    @request() req: Request,
    @response() res: Response
  ): Promise<void> {
    try {
      const { search, year, dateRange, disease, page, limit, sort } = req.query;
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
      // res.json(pipeline)
      const data: ILogs[] = await this.LS.getLogs(pipeline);
      res.status(status_code.SUCCESS).json({ data });
    } catch (err: any) {
      const message: string = errorHandler(err);
      res.status(err.status || status_code.SERVER_ERROR).json({ message });
    }
  }

  @httpPut("/update/:id")
  async updateLog(
    @request() req: Request,
    @response() res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { dischargeAt, amount } = req.body;
      updateFunction(id, { dischargeAt, amount });
      await this.LS.updateLogs(id, { dischargeAt, amount });
      res
        .status(status_code.SUCCESS)
        .json({ message: responseMessage.UPDATED });
    } catch (err: any) {
      const message: string = errorHandler(err);
      res.status(err.status || status_code.SERVER_ERROR).json({ message });
    }
  }

  @httpDelete("/delete/:id")
  async deleteLog(
    @request() req: Request,
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
      res.status(err.status || status_code.SERVER_ERROR).json({ message });
    }
  }
}
