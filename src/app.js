import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"

const app = express()

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}))

//Configuraton of data, Data from frontend can be of form JSON, or it can come from URL
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true,limit: "16kb"}))

app.use(express.static("public")) //Anyone can access these files

//CookieParser is used to perform CRUD operations on cookies in  user's browser
app.use(cookieParser())

//routes import
import userRouter from "./routes/user.router.js"

//Router configuration for a endpoint
app.use("/users",userRouter)

// http://localhost:8000/users/register
export {app}