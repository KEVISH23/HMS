import { Request } from "express"
interface RequestVerify extends Request{
    user?:object
}

export default RequestVerify