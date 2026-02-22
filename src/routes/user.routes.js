import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import {upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

// we use Router from express to do backend routing
const router = Router();

//  URL: http:localhost:8000/api/v1/users/register 
// this URL with the POST rquest from user will hit the registerUser function
// see app.js , the entry point of routes
router.route("/register").post(
    // injecting upload middleware for file handling when user registers
    upload.fields([
        {
            name: "avatar"   // frontend input field mai name attr "avatar" hoga laazmi
            , maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser)

router.route("/login").post(loginUser);

// Secure Routes 
// the routes allowed when user is logged in.
router.route("/logout").post(verifyJWT, logoutUser)
// by running verifyJWT middleware, we now have user in req obj in logout user func

// token is the only way to check if user is logged in or not.  (using auth middleware)


export default router;