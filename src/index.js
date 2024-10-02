import dotenv from 'dotenv'
// import mongoose from "mongoose";
// import { DB_NAME } from "./constants.js";
// import express from "express"

// const app = express()
dotenv.config()

import { connectToDB } from './db/index.js';
connectToDB()

// ;(async ()=> {
//   try {
//     const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
//     //listeners(App is listening error event)
//     // app.on("error", (error) => {
//     //   console.log("ERROR: ",error)
//     //   throw error
//     // })
//     // app.listen(process.env.PORT, () => {
//     //   console.log(`App listening on PORT:${process.env.PORT}`)
//     // })
//     console.log(`MongoDB Connection Host:${connectionInstance.connection.host}`)
//   } catch (err) {
//     console.error(err)
//     throw err
//   }
// })()