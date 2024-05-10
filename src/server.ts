import 'reflect-metadata'
import {InversifyExpressServer} from 'inversify-express-utils'
import container from './inverisy.config'
import express,{ Express } from 'express'
import mongoose from 'mongoose'
import './controller'
const app:Express = express()
app.use(express.json())
const server = new InversifyExpressServer(container,app)
server.build().listen(3000,()=>{
    console.log('server running on port 3000')
})

mongoose.connect("mongodb+srv://kevishshaligram:MKSTmRfboUqYJvPK@practicecluster.yuqi3gp.mongodb.net/?retryWrites=true&w=majority&appName=practiceCluster").then(()=>{console.log('db connected')}).catch(err=>{
    console.log(err)
})