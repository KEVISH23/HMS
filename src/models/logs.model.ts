import mongoose,{Schema} from "mongoose";

let LogsSchema = new mongoose.Schema({
    doctor:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:[true,"Doctor is needed"]
    },
    patient:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:[true,"Patient is needed"]
    },
    disease:{
        type:String,
        required:[true,"Disease is needed to be treated"]
    },
    admittedAt:{
        type:Date,
        required:[true,"Admitted date is required"]
    },
    dischargeAt:{
        type:Date,
    },
    amount:{
        type:Number
    }
},{
    timestamps:true
})

const Logs = mongoose.model("Logs",LogsSchema)
export {Logs}