import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    // FIX 1: Yahan 'await' nahi lagana. Humein sirf aggregation object chahiye.
    const commentQuery = Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "userDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            email: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            // Optional: Lookup hamesha array deta hai, unwind use karke object bana lo
            $unwind: "$userDetails"
        }
    ]);

   
    const comments = await Comment.aggregatePaginate(commentQuery, {
        page: pageNumber,
        limit: limitNumber
    });

    if (!comments || comments.docs.length === 0) {
        // Zaroori nahi ki error throw karein, empty array bhi valid response hai
        return res.status(200).json(new ApiResponse(200, [], "No comments found"));
    }

    return res.status(200).json(
        new ApiResponse(200, comments, "Comments Successfully Fetched")
    );
});

const addComment = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { videoId } = req.params;
    const userId = req.user._id;

    if(!content.trim()){
        throw new ApiError(400, "Tweet Content is empty")
    }
    const comment = await Comment.create({
        content: content,
        video: videoId,
        owner: userId
    })

    // lookup and populate is for join
    // await Comment.populate("","")
    // fetching completet data to send to frontend using aggregation pipeline
    const commentCreated = await Comment.aggregate([
        {
            // I have commented on x video, so i have to find that video 
            // this will give you only the comment doc which is creatd now
            $match: {
                _id : comment._id
            }
        },
        {
            $lookup: {
                from : "videos",

                // we have to store videoId in "video" field of our comment table, and in "video"table we can use its "_id" for join operation.
                localField: "video",
                foreignField: "_id",
                as: "videoDetails"
            }
        },
        
        {
            $lookup : {
                from : "users",
                localField: "owner",
                foreignField: "_id",
                as : "ownerDetails"
            }
        },
        { $unwind: "$videoDetails" },
        { $unwind: "$ownerDetails" },
    ]);
    if(!commentCreated){
        throw new ApiError(500, "Comment is not created")
    }

    return res
    .status(200)
    .json(
      new ApiResponse(200, commentCreated[0], "User Channel Fetched Successfully")
    );

})

const updateComment = asyncHandler(async (req, res) => {
    // we are going to receive the commentid of the comment to be updated in "route" 
    // using that id , we are  going to find that particular comment document from the comment table
    // replacing the "content" value with the user sent updated value (from req.body)
    // then call the "save" method to save it in db , (or use patch maybe?)
    // send response back to frontend

    const { commentId } = req.params;
    const {content} = req.body;

    if(!content.trim()){
        throw new ApiError(400, "Tweet content is empty");
    }


    const comment = await Comment.findById(commentId);

    // Checking AUTHORIZATION
    // i.e user A is not allowed to update user B comment
    if(req.user._id.toString() != comment.owner.toString()){
        throw new ApiError(403, "Unauthorized User")
    }
    if(!comment){
        throw new ApiError(400, "Comment to be updated is not found")
    }
    comment.content = content;
    // us particular document ko save krna hai so we use the "comment" and not model name "Comment"
    await comment.save({ validateBeforeSave : false })
    return res.status(200).json(new ApiResponse(200, "Tweet is updated successfuly"))


})

const deleteComment = asyncHandler(async (req, res) => {

    // retrieve commentId from params
    // check if comment exist?
    // If yes: check if this loggedin user can delete this comment (i.e checkOWnership)
    // delete the comment and send response
    
    const { commentId } = req.params;
    const deletedComment = await Comment.findById(commentId);
    if(!deletedComment){
        throw new ApiError(400, "Comment not found")
    }
    if(deletedComment.owner.toString() != req.user._id.toString()){
        throw new ApiError(403, "Unauthorized User")
    }

    await Comment.findByIdAndDelete(commentId);
    return res.status(200).json(new ApiResponse(200, "Comment Deleted Successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }




    // 2. IDs vs. Full Objects
// This is the most common source of confusion. Here is the rule of thumb:

// When to use just the ID:
// When saving a new document to the database. Most databases (like MongoDB or SQL) prefer "References." Instead of saving a giant user object inside every comment, you save the userId.

// Performance: It keeps your database small.

// Consistency: If the user changes their profile picture, you don't want to have to update 1,000 comments where that picture was saved. If you only saved the ID, the link stays the same.

// When to use the Full Object:
// When sending a response to the frontend. The frontend needs the user's name and avatar to display the comment, not just a random string of numbers like 64afb2....

// In MongoDB, you use .populate('user').

// In SQL, you use a JOIN




// 3. 
// Case A: String mein (No $)
// Jab aap kisi Field ka naam define kar rahe hote hain (Naya naam de rahe ho), tab $ nahi lagta.

// as: "ownerDetails" (Yahan hum naya field bana rahe hain).

// localField: "owner" (Yahan hum bata rahe hain ki "owner" naam ka column check karo).

// Case B: Value Reference mein ($ Use Karein)
// Jab aap Mongoose ko bol rahe ho ki "Is field ke andar jo VALUE hai use uthao", tab $ lagta hai.

// $unwind: "$ownerDetails" (Yahan hum bol rahe hain "ownerDetails" field ke andar jo data hai use kholo).

// $match: { _id: "$someId" }
// Pro-Tip for $project
// Project stage mein dono use hote hain, isliye dhyan se dekho:

// JavaScript
// {
//   $project: {
//     userName: "$ownerDetails.name", // "$" kyunki hum VALUE utha rahe hain
//     status: 1                      // No "$" kyunki hum bas bol rahe hain "ye field dikhao"
//   }
// }



// 4. 
// 1. Authentication (verifyJWT)
// Ye middleware sirf ye check karta hai:

// Kya user ke paas valid ID card (Token) hai?

// Agar haan, toh uski details req.user mein daal do.

// Problem: Ye middleware ye nahi jaanta ki user "A" user "B" ka comment edit karne ki koshish kar raha hai.

// 2. Authorization (The Manual Check)
// Ye wo check hai jo aapne controller mein kiya.

// Example: Ek gym mein entry ke liye card (JWT) chahiye. Lekin card hone ka matlab ye nahi ki aap manager ke cabin (dusre ka comment) mein ja kar furniture change kar sakte ho.

// Aapko check karna hi padega: comment.owner === req.user._id.

// PAGINATION : https://www.geeksforgeeks.org/mongodb/how-to-paginate-with-mongoose-in-node-js/ 