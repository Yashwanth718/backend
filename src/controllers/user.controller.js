import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { uploadOnCloudinary } from "../utils/FileUpload.js"
import jwt from "jsonwebtoken"

const generateAccess_And_RefreshToken = async(userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({validateBeforeSave : false})

    return {accessToken,refreshToken}
  } catch (error) {
    throw new ApiError(500,"Server is busy and can't generate tokens")
  }
}

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
  console.log(req.files)

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

  // console.log(avatarLocalFilePath)
  // console.log(coverImage)

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

const loginUser = asyncHandler(async(req,res) => {
  //take login details from user(frontend)
  //peform data-validation
  //check if user exists or not,if yes->password check , else-> user does not exist
  //if password valid 
  //Generate Access Token, Refresh Token and send a success response
  //else -> Invalid credentials

  const {username,password} = req.body

  if(!username){
    throw new ApiError(400,"Username is required")
  }

  const user = await User.findOne({username})

  if(!user){
    throw new ApiError(404,"User does not exist")
  }

  const passwordMatch = await user.isPasswordCorrect(password)

  if(!passwordMatch){
    throw new ApiError(401,"Password is incorrect")
  }

  const {accessToken,refreshToken} = await generateAccess_And_RefreshToken(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options = {
    httpOnly : true,
    secure: true
  }

  return res.status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
    new ApiResponse(200,"User Logged in Successfully",{User:loggedInUser,accessToken,refreshToken})
  )
})

const logoutUser = asyncHandler(async(req,res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    {
      new: true
    }
  )

  const options = {
    httpOnly : true,
    secure: true
  }

  return res
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .status(200).json(new ApiResponse(200,{},"Logged out Successfully"))
})

const refreshAccessToken = asyncHandler(async(req,res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken){
    throw new ApiError(400,"Unauthorized request")
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id)

    if(!user){
      throw new ApiError(400,"Invalid User")
    }

    if(incomingRefreshToken !== user.refreshToken){
      throw new ApiError(400,"Invalid Refresh Token")
    }

    const {accessToken,refreshToken} = await generateAccess_And_RefreshToken(user._id)

    const options = {
      httpOnly: true,
      secure: true
    }
    
    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
      new ApiResponse(200,{accessToken,refreshToken},"Refreshed Access Token")
    )
  } catch (error) {
    throw new ApiError(400,"Invalid Token")
  }
})

const changeCurrentPassword = asyncHandler(async(req,res) => {
  const {oldPassword,newPassword} = req.body

  try {
    const user = await User.findById(req.user._id)

    const isOldPasswordValid = await user.isPasswordCorrect(oldPassword)

    if(!isOldPasswordValid){
      throw new ApiError(400,"Invalid Old Password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(
      new ApiResponse(200,"Password updated",{})
    )
  } catch (error) {
    throw new ApiError(400,error?.message || "Server Not Responding")
  }
})

const getCurrentUser = asyncHandler(async(req,res) => {
  return res
  .status(200)
  .json(
    new ApiResponse(200,"Current User fetched",req.user)
  )
})

const changeAccountDetails = asyncHandler(async(req,res) => {
  const {fullName} = req.body
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          fullName
        }
      },
      {
        new: true 
      }
    ).select("-password -refreshToken")

      return res
      .status(200)
      .json(new ApiResponse(200,"FullName Updated",{}))
  } catch (error) {
    throw new ApiError(500,error.message || "Server Not able to handle requests")
  }
})

const updateAvatar = asyncHandler(async(req,res) => {
  try {
    const avaterLocalFilePath = req.file?.path

    if(!avaterLocalFilePath){
      throw new ApiError(400,"Avatar File is Not Provided")
    }

    const avatar = await uploadOnCloudinary(avaterLocalFilePath)

    await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          avatar: avatar.url
        }
      },
      {
        new : true
      }
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(new ApiResponse(200,"Avatar Image Updated",{}))
  } catch (error) {
    throw new ApiError(500,"Cloudinary couldn't upload updated Avatar image")
  }
})

const updateCoverImage = asyncHandler(async(req,res) => {
  try {
    const coverImageLocalFilePath = req.file?.path

    if(!coverImageLocalFilePath){
      throw new ApiError(400,"Cover Image is Not Provided")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalFilePath)

    await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          coverImage: coverImage.url
        }
      },
      {
        new : true
      }
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(new ApiResponse(200,"Cover Image Updated",{}))
  } catch (error) {
    throw new ApiError(500,"Cloudinary couldn't upload updated Cover image")
  }
})

const getUserChannelProfile = asyncHandler(async(req,res) => {
  const {username} = req.params

  if(!username?.trim()){
    throw new ApiError(400,"Username shhould not be empty")
  }

  const channel = await User.aggregate(
    [
      {
        $match: {
          username: username
        }
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers"
        }
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "subscriber",
          as: "subscribedTo"
        }
      },
      {
        $addFields: {
          subscribersCount : {
            $size : "$Subscribers"
          },
          subscribedToCount: {
            $size: "$SubscribedTo"
          },
          isSubscribed: {
            $cond : {
              if: {$in : [req?.user._id,"$subscribers.subscriber"]},
              then : true,
              else: false
            }
          }
        }
      },
      {
        $project: {
          fullName : 1,
          username: 1,
          subscribersCount : 1,
          subscribedToCount: 1,
          isSubscribed : 1
        }
      }
    ]
  )

  if(!channel?.length){
    throw new ApiError(400,"Channel does not exist")
  }

  return res
  .status(200)
  .json(new ApiResponse(200,"Channel details fetched",channel[0]))
})

export 
{
  userRegister,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  changeAccountDetails,
  updateAvatar,
  updateCoverImage,
  getUserChannelProfile
}