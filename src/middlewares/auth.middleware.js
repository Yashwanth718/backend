import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"

export const verifyJWT = asyncHandler(async(req,res,next) => {
  try {
    const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
  
    if(!accessToken){
      throw new ApiError(401,"Unauthorized request")
    }
  
    const decodedToken = jwt.verify(accessToken,process.env.ACCESS_TOKEN_SECRET)
    // console.log(decodedToken)
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
  
    if(!user){
      throw new ApiError(400,"Invalid Access Token(Not the correct user)")
    }
  
    req.user = user
    next()
  } catch (error) {
    throw new ApiError(error?.code || 400,error?.message || "Invalid Access Token")
  }

})