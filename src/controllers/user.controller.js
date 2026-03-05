import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt, { decode } from "jsonwebtoken";
import { channel, subscribe } from "diagnostics_channel";
import mongoose from "mongoose";

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
  if (!username && !email) {
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
  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id
  );

  // STEP 5 :sending Cookie;
  // db mai aik or query chla rhai hai --> this might be expensive so here you  have to decide what to do, existing user obj ko hi modify krna hai ya aik or db call
  // jo purana user object hai us mai refreshTOken nhe hai kio k we have saved this after
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //! ERROR: That error:

  // MongoServerError: Cannot do exclusion on field refreshToken in inclusion projection
  // means you're mixing inclusion and exclusion in the same projection.
  // In MongoDB, you must choose one style (except for _id):
  // const loggedInUser = await User.findById(user._id).select("password -refreshToken")  // including password and excluding refreshToken --> not allowed in mongoDB

  const options = {
    httpOnly: true,
    secure: true,
    // the above two properties makes sure that this cookie can only be modified by server and not frontend
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged In Successfully"
      )
    );
});

// loggin out user means: 1. remove access and refresh token from client browser 2. remove(reset to null) the refresh Token from db
const logoutUser = asyncHandler(async (req, res) => {
  //request , response aik object hi hota hai
  // and through middlewar e hm in objects mai hi method/property add krte hai

  // so we get the user info from accessTOken, as if user is logged in , then it has accessTOken in its cookies, so we retrieve that from cookies (we created a auth middleare for this)
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      // returned mai jo response milai ga , wo updated value de ga
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request");
  }

  try {
    // decoding the encrypted token stored in user cookies, as in db it is not encrptyed
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id); // see generateRefreshTOken func
    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (user?.refreshToken != decodedToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access Token is Refreshed."
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

//? UPDATE CONTROLLERS FOR USER
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (newPassword != confirmPassword) {
    throw new ApiError(401, "New Password and Confirm Password do not match.");
  }
  // again , here we can use the middleware verifyJWT to check if the user is logged in or not? [Loggin user can only change password na]
  // after the verifyJWT middleware, we know req.user is injected to request.

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid Password");
  }

  user.password = newPassword;

  // here we have isPassword method in user.model.js , so the encryption of password is already being done ther
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Updated Successfully"));
});

// verifyJWT middleware chlai ga
const getCurrentUser = asyncHandler(async (req, res) => {
  return (
    res
      .status(200)

      // frontend pr ye json handle krte hai
      .json(200, req.user, "Current User fetched successfully")
  );
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const { username, email, fullname } = req.body;
  if (!username && !email && !fullname) {
    throw new ApiError(400, "All fields are required");
  }

  const user = User.findByIdAndUpdate(
    req.user._id,
    {
      // mongoose operator to update field in db
      $set: {
        username,
        email,
        fullname,
      },
    },
    { new: true } // send the updated response
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

// when updating any file, we will use two middlewares: first authenticated user can update photo so verifyJWT , and to updload new file the "mutler middleware"
const updateUserAvatar = asyncHandler(async (req, res) => {
  // to update the avatar:
  // user is logged in? --> checked by verifyJWT middleware (will insert this in routes)
  // multer middleware will updload the file "locally"
  // now we have localFilePath, we can upload it to cloudinary by uploadOnCloudinary() utility

  // here we want only 1 file so not fileS
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is misssing");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar?.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      // PATCH
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  //? TODO : After file is uploaded correctly , DELETE old file (make a utility function)
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar Image is updated successfully"));
});

//? SUBSCRIPTION SCHEMA  [AGGREGATION PIPELINE]
const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiError(400, "Username is missing");
  }

  //* MongoDB Aggregation Pipelines
  // User.aggregate( [{ first pipeline}, { second pipeline} ])
  // pipeline means stage by stage operation. the output of one stage is the input of another stage
  const userAggregate = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(), // will give you one user , whose username
      },
    },
    {
      $lookup: {
        // join operation  [User and Subscripton model ka join]
        from: "subscriptions", // in mongodb , our table is saved as all lowercase and plural form
        localField: "_id",
        foreignField: "channel",
        as: "subscribers", // will give all doc where user k subscribers
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo", // maine kis ko subscribe kr rkha hai
      },
    },
    {
      $addFields: {
        // add this fields (column) into our table ( or docuemnt ), this will add subscriberCOunt and channelsSUbscribedToCount in the User table as two more fields
        subscribersCount: {
          $size: "$subscribers", // this is same --> the above lookup alias "subscribers"
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo", // $ indicates it is a field now
        },
        isSubscribed: {
          // to check k subscribe button ko kia dekhana hai? subscribed ya subscribe

          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        // like giving fields name in Select statement
        fullname: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  // aggregate pipeline returns an array of objects
  // console.log(userAggregate)

  if (!userAggregate?.length) {
    throw new ApiError(404, "Channel does not exists");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, userAggregate[0], "User Channel Fetched Successfully")
    );
});

//? VIDEO MODEL (watch history)
const getWatchHistory = asyncHandler(async (req, res) => {

  //* INTERVIEW:
    // req.user._id  --> gives you the string ObjectId(dfdfjsdl)
    // when we use this _id in moongoose methods it automatically parse to idss.

  const user = await User.aggregate([
    {
      $match : {
        // _id : req.user._id             // yaha wo uper wali logic nhe clhit , (aggregation mai)
        // we have to manually parse it
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from: "videos" ,   // all lower case + plural
        localField: "watchHistory",
        foreignField: "_id",
        as : 'watchHistory',

        pipeline :[                       //nested lookup : here we are in videos table
          {
              $lookup: {
                from: "users",
                localField: "owner",   // video table ki field (that is user id)
                foreignField: "_id",
                as : "owner",

                // owner field k andr ye pipeline chlai gi
                pipeline: [
                  {
                    $project: {
                        fullname : 1,
                        username: 1,
                        avatar: 1
                    }
                  }
                ]
              }
          },
          {
              $addFields : {
                owner : {
                  $first: "$owner"    // owner field se value retrieve krni hai so $ sign
                }
              }

          }
        ]
      }
    }
  ])

  return res.status(200)
            .json(new ApiResponse(200, user[0].watchHistory, "Watched History Fetched Successfully"))
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  changeCurrentPassword,
  updateUserProfile,
  updateUserAvatar,
  getUserChannelProfile,
  getWatchHistory
};
// Routes are very important in backend, koi backend function kb chalai? jb koi URL hit ho , tb aik specific function/code chlai
// n short routing just means connecting a URL to some logic on the server that handles it.
