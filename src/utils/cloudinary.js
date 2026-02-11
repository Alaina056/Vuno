// we use multer to upload files 

import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

//~ This configuration allows you to talk with cloudinary
  // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        // api_key: process.env.CLOUDINARY_API_KEY,
        api_key: "734155213489923", 
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });

const uploadOnCloudinary = async (localFilePath) =>{
  try{
      if(!localFilePath) return null

    // this is going to upload file in to cloudinary ,we hold it in a variable because after uploading , it returns a response object which holds information like the public URL of the uploaded file, we return this to our frontend designer
   // second thing is that "uploader" is an upload API, api means time lgai ga , plus response ayai ga wapis lazmi
    // cloudinary.uploader(
    //     localFilePath,{
    //         resource_type: "auto"
    //     })


    const response = await cloudinary.uploader.upload(
        localFilePath,{
            resource_type: "auto"
        })

        // file has been uploaded succsfully 
        console.log("file is uploaded on cloudinary", response.url)
        fs.unlinkSync(localFilePath)
        return response;
  } catch (error){
    fs.unlinkSync(localFilePath) // removed the locally saved temporary file as the upload is failed
    return null;
  }
    
}

export {uploadOnCloudinary}