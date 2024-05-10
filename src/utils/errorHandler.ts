import { ApiError } from "./ApiError";

export default function errorHandler(err:any):string{
    let message:string = ""
    if(err instanceof ApiError){
        return err.message
    }
    if(err.name === 'ValidationError'){
        for (const key in err.errors) {
          message += err.errors[key].message;
          message += ', '
        }
        return message.slice(0,message.length-2)
    }
    if(err.code === 11000){
        return "Email is already registered"
    }
    message+=err.message
    return message
}