import { Container } from "inversify";
import { doctorService } from "./services";
import TYPES from "./contants/TYPES";
import { IsDoctor } from "./middleware/isDoctor";
const container = new Container()
container.bind<doctorService>(TYPES.doctorService).to(doctorService)
container.bind<IsDoctor>(TYPES.IsDoctor).to(IsDoctor)
export default container