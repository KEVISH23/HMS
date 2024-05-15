import { Container } from "inversify";
import { doctorService,LogService,PatientService } from "@service";
import {TYPES} from "@constants";
import { IsDoctor,IsPatient } from "@middleware";
const container = new Container()
container.bind<doctorService>(TYPES.doctorService).to(doctorService)
container.bind<IsDoctor>(TYPES.IsDoctor).to(IsDoctor)
container.bind<PatientService>(TYPES.PatientService).to(PatientService)
container.bind<IsPatient>(TYPES.IsPatient).to(IsPatient)
container.bind<LogService>(TYPES.LogService).to(LogService)
export default container