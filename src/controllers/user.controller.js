import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
// An interpreter executes code line-by-line at runtime without generating a separate machine code file, whereas a Just-In-Time (JIT) compiler compiles frequently used blocks of code into native machine code at runtime and caches the result for future reuse, leading to better performance over time. The JIT is an optimization method often used within an interpreter's runtime environment.
// A JIT compiler is a hybrid approach that aims to combine the flexibility of interpretation with the speed of compilation. It operates at runtime, identifying "hot spots" (frequently executed code sections) and compiling them into highly optimized native machine code.

const registerUser = asyncHandler(async (req, res) => {
  // sending a json response
  //testing
  //    return res.status(200).json({
  //         message: "ok"
  //     })

  //? STEP 1: Get data from User
  // We can take data from user, by URL, Form(req.body), Params
  const { fullName, email, username, password } = req.body;
  // console.log(req.body);

  //? STEP 2: File Handling (see user.routes.js --> upload middleware)

  //? STEP 3 : Validating User Data
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All Fields are required");
  } else if (!email.includes("@")) {
    throw new ApiError(400, "Email is invalid");
  }

  //? STEP 4: Check if user already exists?
  // we talk to data tables like User table using the User schema we have defined in models
  // like jo bhi db /tables se commuincation hai wo un moongose.model se bnai gayai schema obj se hi hogi

  // moongoose funcitons and operators
  const existedUser = User.findOne({
    $or: [{ email }, { username }], // or operator in mongodb
  });

  if(existedUser) { throw new ApiError( 409, "User With email or username already exists") }
//   console.log(existedUser);
  

//? STEP 5: Mandatory Images uploaded ?
    // middleware adds fields in request
    // multer gives us req.files,  (avatar --> see the user routes.js middleware)
    
    // by this , we are retrieving the path where file is uploaded
    const avatarLocalPath = req.files?.avatar[0]?.path;           // we make avatar mandatory in schema
    // console.log(req.files);

    const coverLocalPath = req.files?.coverImage[0]?.path;
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required")
    }

//? STEP 6 : Upload Images/ Files to Cloudinary ( From local server to Cloudinary )
   //* this is necessary to check if file is uploaded in cloudinary even if we have locally uploaded

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverLocalPath)

    //* Checking if avatar is properly uploaded on cloudinary as it is a mandatory field
    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

//? STEP 7: Entry User object in db
    //* you need to do some working to ensure double entry for the same user is not created in db like diabling the submit button in form etc
       // db se baat krte waqt potentially error milskta hai , Second db dusrai content mai hai to time lgai ga
   const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

//? STEP 8: Check if user created? and removing password and refreshToken from Response sending to client side
   // this is a db call
   // about select: Specifies which document fields to include or exclude (also known as the query "projection")
   const createdUser = await User.findById(user._id).select(
     "-password -refreshToken"
   );
   if(!createdUser)  { throw new ApiError(500, "Something went wrong while registering the user")}
   // _id is created by mongodb (re check this info)  

//? STEP 9: Sending response to Client (browser)
   return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
   )
});

export { registerUser };
// Routes are very important in backend, koi backend function kb chalai? jb koi URL hit ho , tb aik specific function/code chlai
// n short routing just means connecting a URL to some logic on the server that handles it.
