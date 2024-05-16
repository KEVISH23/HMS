interface ILogs {
    _id?:string,
    doctor:string
    patient:string,
    admittedAt:Date,
    dischargeAt?:Date,
    amount?:number,
    createdAt?:Date,
    updatedAt?:Date
}

export {ILogs}