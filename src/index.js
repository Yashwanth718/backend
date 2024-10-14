// import mongoose from "mongoose";
// import { DB_NAME } from "./constants.js";
// import express from "express"
// const app = express()

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

import dotenv from 'dotenv'
dotenv.config({path: "./.env"})

import { app } from './app.js';

import { connectToDB } from './db/index.js';
connectToDB()
.then( () => {
  const port = process.env.PORT || 8000
  app.listen(port, () => {
    console.log(`Server is running at PORT:${port}`)
  })
  app.on("error", (err) => {
    console.log("App is not listening!, ",err)
    throw err
  })
})
.catch( (err) => {
  console.log("MONGO DB Connection FAILED!!! ",err)
})