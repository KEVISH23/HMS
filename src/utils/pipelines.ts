import { PipelineStage } from "mongoose";

export const logsPipeline: PipelineStage[] = [
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
    // '{
    //   $addFields: {
    //     speciality: "$result.speciality",
    //     doctorName: "$result.name",
    //     doctorDOB: "$result.dob",
    //     doctorEmail: "$result.email",
    //   },
    // }
    
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
        speciality: "$result.speciality",
        doctorName: "$result.name",
        doctorDOB: "$result.dob",
        doctorEmail: "$result.email",
      },
    },
  ];

  export const projectLogs:PipelineStage = {
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
  }