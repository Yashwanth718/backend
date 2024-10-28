import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { uploadOnCloudinary } from "../utils/FileUpload.js"

const userRegister = asyncHandler(async(req,res) => {
  //take data from user(frontend)
  //data validation
  //whether the data already exists in DB
  //check for images,videos(basically files) , if found, upload them to cloudinary
  //create a entry(object) in DB
  //remove password and refreshToken
  //check whether entry is created, if yes, return response else, return error

  const {username,email,fullName,password} = req.body
  // console.log(req.body)
  // console.log(req.files)

  if(
    [username,email,fullName,password].some( 
      (field) => (field?.trim() === "")
    )
  ){
    throw new ApiError(400,"All fields are required to meet the criteria")
  }

  const existingUser = await User.findOne({
    $or: [{ username },{ email }]
  })

  if(existingUser){
    throw new ApiError(408,"user with this email or username already exists")
  }

  const avatarLocalFilePath = req.files?.avatar[0]?.path
  // const coverImageLocalFilePath = req.files?.coverImage[0]?.path
  let coverImageLocalFilePath;
  if(Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
    coverImageLocalFilePath = req.files.coverImage[0].path
  }

  if(!avatarLocalFilePath){
    throw new ApiError(400,"Avatar File is required")
  }

  const avatar = await uploadOnCloudinary(avatarLocalFilePath)
  let coverImage;
  // if(coverImageLocalFilePath){
  //   coverImage = await uploadOnCloudinary(coverImageLocalFilePath)
  // }

  coverImage = await uploadOnCloudinary(coverImageLocalFilePath)

  console.log(avatarLocalFilePath)
  console.log(coverImage)

  if(!avatar){
    throw new ApiError(500,"File not Supported")
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
  })

  const createdUser = await User.findById(user._id).select("-password -refreshToken")

  if(!createdUser){
    throw new ApiError(500,"Something went wrong while registering in Server")
  }
  
  return res.status(201).json(new ApiResponse(200,"User registered successfully",createdUser))
})

export {userRegister}