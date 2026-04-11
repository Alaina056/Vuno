import { Router } from "express";
import { addComment, deleteComment, getVideoComments, updateComment } from "../controllers/comment.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

router.use(verifyJWT)
// User wants to retrieve(get) data from db --> that's why get()
router.route('/:videoId').get(getVideoComments);

// user wants to save complete data in the db --> that's why post()
router.route('/:videoId').post(addComment);

router.route('/:commentId').delete(deleteComment).patch(updateComment);

// user wants to update only a part of data (only one field) --> that's why patch()
// if we use post() then the other fields (non-specified) will be overriden and their value will be saved as null.
export default router;