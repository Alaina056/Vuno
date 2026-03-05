import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateUserAvatar,
  updateUserProfile,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

// we use Router from express to do backend routing
const router = Router();

//  URL: http:localhost:8000/api/v1/users/register
// this URL with the POST rquest from user will hit the registerUser function
// see app.js , the entry point of routes

// If user is sending any data --> use post , otherwise get
// post --> updates whole doc, while patch only updates the required (i.e one or two field as specified)
router.route("/register").post(
  // injecting upload middleware for file handling when user registers
  upload.fields([
    {
      name: "avatar", // frontend input field mai name attr "avatar" hoga laazmi
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

// Secure Routes
// the routes allowed when user is logged in.
router.route("/logout").post(verifyJWT, logoutUser);
// by running verifyJWT middleware, we now have user in req obj in logout user func

router.route("/refresh-token").post(refreshAccessToken);
// token is the only way to check if user is logged in or not.  (using auth middleware)

router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, updateUserProfile);

router.route("/update-avatar").patch(
  verifyJWT,
  // single user , so single image for avatar
  upload.single("avatar"),
  updateUserAvatar
);

// we are taking values from params in controller, so we have to give it into route
router.route("/c/:username").get(verifyJWT, getUserChannelProfile);
router.route("/watch-history").get(verifyJWT, getWatchHistory);

export default router;
