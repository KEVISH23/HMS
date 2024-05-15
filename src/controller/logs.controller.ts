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
import {status_code,responseMessage,TYPES} from "@constants";
import { inject } from "inversify";
import { LogService } from "@service";
import { ILogs } from "@interface";
import { deleteFunction, updateFunction } from "@handler";

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
      const { search, year, dateRange, disease, page, limit } = req.query;
      const data: ILogs[] = await this.LS.getLogs({
        search: search?.toString(),
        year: year?.toString(),
        dateRange: dateRange?.toString(),
        disease: disease?.toString(),
        page: page?.toString(),
        limit: limit?.toString(),
      });
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
