import { ApiError } from "./ApiError";

export default function errorHandler(err:any):string{
    let message:string = ""
    if(err instanceof ApiError){
        return err.message
    }
    if(err.name === 'ValidationError'){
        console.log(err)
       
            for (const key in err.errors) {
                if(err.errors[key].name === 'CastError'){
                    message += `Reference for ${key} is not valid Id`;
                }else{
                    message += err.errors[key].message;
                }
                message += ', '
            }
        
        return message.slice(0,message.length-2)
    }
    if(err.code === 11000){
        return "Email is already registered"
    }

    if(err.name === "CastError"){
        return "Invalid Id"
    }
    message+=err.message
    return message
}