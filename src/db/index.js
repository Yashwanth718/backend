import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectToDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
    console.log(`MongoDB Connection Host is:${connectionInstance.connection.host}`)
  } catch (err) {
    console.log("MongoDB Connection Failed ",err)
    process.exit(1)
  }
}

export {connectToDB}