import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import {upload } from "../middlewares/multer.middleware.js";

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





export default router;