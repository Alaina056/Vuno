import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";

//WRITING A CUSTOM MIDDLEWARE
// verifying the current Logged in user, if true, we are going to inject the user in the request obj
export const verifyJWT = asyncHandler(async (req, _, next) => {    //since we do not need res, so we just write underscore here
  try {
    // getting the tokens from cookies
    // mobile mai cookies nhe hotai, so ye hoskta hai user custom header bheje, normally Authorization k key se bearer token send krte hai
    // Authorization : Bearer <access token>     {bearer is a key word}
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    // decoded token mai wo object ayai ga pura jo accesstoken generate krte wawt hmen set kia tha, waha _id se id store ki thi(see the user.model.js --> generateAccesstoken functions)

    req.user = user; // injecting to request obj

    // next --> mera kaam khtm , ap agai brh jao,
    // like a return statement for middlewares
    next();
  } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token")

  }
});
