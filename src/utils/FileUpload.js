import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
  if(!localFilePath) return null
  try {
    const response = await cloudinary.uploader.upload(localFilePath,{
      resource_type: "auto"
    })
    console.log("File is uploaded successfully on Cloudinary ", response.url)
    return response
  } catch (error) {
    //File upload failed
    fs.unlinkSync(localFilePath)
    return null
  }
}

export {uploadOnCloudinary}