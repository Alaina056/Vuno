import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
// An interpreter executes code line-by-line at runtime without generating a separate machine code file, whereas a Just-In-Time (JIT) compiler compiles frequently used blocks of code into native machine code at runtime and caches the result for future reuse, leading to better performance over time. The JIT is an optimization method often used within an interpreter's runtime environment.
// A JIT compiler is a hybrid approach that aims to combine the flexibility of interpretation with the speed of compilation. It operates at runtime, identifying "hot spots" (frequently executed code sections) and compiling them into highly optimized native machine code.

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // ading refresh Token in db
    user.refreshToken = refreshToken;
    // saving in db;
    // when we execute the save method, it does all the validations which we have specifed in moongoose schema, so in order to stop this :
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and referesh token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // sending a json response
  //testing
  //    return res.status(200).json({
  //         message: "ok"
  //     })

  //? STEP 1: Get data from User
  // We can take data from user, by URL, Form(req.body), Params
  const { fullname, email, username, password } = req.body;
  // console.log(req.body);

  //? STEP 2: File Handling (see user.routes.js --> upload middleware)

  //? STEP 3 : Validating User Data
  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All Fields are required");
  } else if (!email.includes("@")) {
    throw new ApiError(400, "Email is invalid");
  }

  //? STEP 4: Check if user already exists?
  // we talk to data tables like User table using the User schema we have defined in models
  // like jo bhi db /tables se commuincation hai wo un moongose.model se bnai gayai schema obj se hi hogi

  // moongoose funcitons and operators
  const existedUser = await User.findOne({
    $or: [{ email }, { username }], // or operator in mongodb
  });

  if (existedUser) {
    throw new ApiError(409, "User With email or username already exists");
  }
  //   console.log(existedUser);

  //? STEP 5: Mandatory Images uploaded ?
  // middleware adds fields in request
  // multer gives us req.files,  (avatar --> see the user routes.js middleware)

  // by this , we are retrieving the path where file is uploaded
  const avatarLocalPath = req.files?.avatar[0]?.path; // we make avatar mandatory in schema
  // console.log(req.files);

  const coverLocalPath = req.files?.coverImage[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  //? STEP 6 : Upload Images/ Files to Cloudinary ( From local server to Cloudinary )
  //* this is necessary to check if file is uploaded in cloudinary even if we have locally uploaded

  const coverImage = await uploadOnCloudinary(coverLocalPath);
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  //* Checking if avatar is properly uploaded on cloudinary as it is a mandatory field
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  //? STEP 7: Entry User object in db
  //* you need to do some working to ensure double entry for the same user is not created in db like diabling the submit button in form etc
  // db se baat krte waqt potentially error milskta hai , Second db dusrai content mai hai to time lgai ga
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  //? STEP 8: Check if user created? and removing password and refreshToken from Response sending to client side
  // this is a db call
  // about select: Specifies which document fields to include or exclude (also known as the query "projection")
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }
  // _id is created by mongodb (re check this info)

  //? STEP 9: Sending response to Client (browser)
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered"));
});

const loginUser = asyncHandler(async (req, res) => {
  // STTPE 1: Taking data from req.body
  const { email, username, password } = req.body;

  // STEP 2 : Checking if user exist by username or email
  if (!username || !email) {
    throw new ApiError(400, "Username or email is required");
  }
  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // STEP 3: User exist , now check if password is COrrect
  // we have already defined password correct mehtod in user obj

  // User --> capital U --> moongoose ka Object
  // ap ka user (specific user) --> user se (db se lia gya instance for that particular user)
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Credentials");
  }

  //STEP 4: Generating access and refresh token
  const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id);

  // STEP 5 :sending Cookie;
  // db mai aik or query chla rhai hai --> this might be expensive so here you  have to decide what to do, existing user obj ko hi modify krna hai ya aik or db call
  // jo purana user object hai us mai refreshTOken nhe hai kio k we have saved this after
  const loggedInUser = await User.findById(user._id).select("password -refreshToken")

  const options = {
    httpOnly: true,
    secure: true,
    // the above two properties makes sure that this cookie can only be modified by server and not frontend

  }

  return res.status(200)
            .cookie('accessToken',accessToken, options)
            .cookie('refreshToken',refreshToken, options)
            .json(
              new ApiResponse(200,
                {
                  user: loggedInUser, accessToken, refreshToken
                },
                "User Logged In Successfully"
              )
            )
            });


            // loggin out user means: 1. remove access and refresh token from client browser 2. remove(reset to null) the refresh Token from db
const logoutUser = asyncHandler(async (req, res) =>{
    //request , response aik object hi hota hai
    // and through middlewar e hm in objects mai hi method/property add krte hai
    
    // so we get the user info from accessTOken, as if user is logged in , then it has accessTOken in its cookies, so we retrieve that from cookies (we created a auth middleare for this)
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: { 
          refreshToken : undefined
        }
      },
      {

        // returned mai jo response milai ga , wo updated value de ga
        new: true
      }
    )

    const options = {
      httpOnly: true,
      secure: true
    }

    return res  
            .status(200)
            .clearCookie("accessToken",options)
            .clearCookie("refreshToken",options)
            .json(new ApiResponse(200,{}, "User Logged Out"))
})
export { registerUser, loginUser, logoutUser };
// Routes are very important in backend, koi backend function kb chalai? jb koi URL hit ho , tb aik specific function/code chlai
// n short routing just means connecting a URL to some logic on the server that handles it.
