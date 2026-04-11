import mongoose, {isValidObjectId, mongo} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    const user = await User.findById(req.user._id);

    // the logic is that if there exist like having that  videoId in video and currently logged in user as likeBy, then delete , if not then create a like obj

    // by aggregation pipeline
    // const likeDocument = await Like.aggregate([
        
    //     {
    //         $match : {
    //             $and : [
    //                 { video : new mongoose.Types.ObjectId(videoId)},
    //                 { likeBy: new mongoose.Types.ObjectId(req.user._id)}
    //             ]
    //         }
    //     }
    
    // ])

    // way 2: by find method
    // const likeDoc = await Like.find({
    //    $and : [
    //                 { video : videoId},
    //                 { likeBy: req.user._id}
    //             ]
    // })

    const likeDoc = await Like.find(
        { video: videoId, likeBy: req.user._id}
    ) 

    // if likeDoc is not found then --> [], and empty array is truthy
    if (likeDoc.length > 0){
        await Like.findByIdAndDelete(likeDoc._id);
        return res.status(200).json(new ApiResponse(200, {isLiked : false}, "Like Deleted from Video"))
    }else{
        const like = await Like.create({
            video : videoId,
            likeBy: req.user._id
        })
        return res.status(200).json(new ApiResponse(200, {isLiked : true}, "Like the video"))
    }
})


const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params

    const likeComment  = await Like.find({
        comment : commentId,
        likeBy: req.user._id
    })
    if(likeComment.length > 0){
            await Like.findByIdAndDelete(likeComment._id)
            return res.status(200).json(new ApiResponse(200, {isLiked: false}, "Deleted Like in the comment"))
    }else{
        await Like.create(
            {
                comment : commentId,
                likeBy: req.user._id
            }
        )
        return res.status(200).json(new ApiResponse(200, { isLiked: true}, "Like the comment"))
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const tweetLike = await Like.find({
        tweet: tweetId,
        likeBy: req.user._id
    })  
    if(tweetLike.length > 0){
        await Like.findByIdAndDelete(tweetLike._id);
        return res.status(200).json(new ApiResponse(200, {isLiked: false}, "Tweet Like is removed"))
    }else {
        await Like.create({
            tweet: tweetId,
            likeBy: req.user._id
        })
        return res.status(200).json(new ApiResponse(200, {isLiked: true}, "Tweet Liked"))
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {

//    const likedVideos = await Like.aggregate([
//     {
//         // we are storing videos and comments likes in a single table, so to get liked videos , the video should not be equal to null
//         $match: {
//             likeBy: new mongoose.Types.ObjectId(req.user._id),
//             video :  { $ne : null }
//         }
//     },
//     {
//         $lookup: {
//             from: "videos",        // collection name stored in mongoDb table (plural and all Lower case)
//             localField: "video",
//             foreignField: "_id",
//             as :"videoDetails",
//             pipeline : [
//                 {
//                     $lookup : {
//                         from: "users",
//                         localField: "owner",
//                         foreignField: "_id",
//                         as : "ownerDetails",
//                         pipeline : [
//                      {       $project: {
//                                 firstname: 1,
//                                 lastname: 1,
//                                 username: 1,
//                                 avatar: 1
//                             }}
//                         ]
//                     }
//                 }
//             ]
//         }
//     }
//    ])

const likedVideos = await Like.aggregate([
    {
        // 1. Filter for likes by this user specifically for videos
        $match: {
            likedBy: new mongoose.Types.ObjectId(req.user._id),
            video: { $exists: true, $ne: null }
        }
    },
    {
        // 2. Join with the videos collection
        $lookup: {
            from: "videos",
            localField: "video",
            foreignField: "_id",
            as: "video", // Overwriting the ID with the object for cleaner data
            pipeline: [
                {
                    // 3. Nested join to get the video creator's info
                    $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner",
                        pipeline: [
                            {
                                $project: {
                                    firstname: 1,
                                    lastname: 1,
                                    username: 1,
                                    avatar: 1
                                }
                            }
                        ]
                    }
                },
                {
                    // 4. Flatten the owner array inside the video object
                    $addFields: {
                        owner: { $first: "$owner" }
                    }
                }
            ]
        }
    },
    {
        // 5. Flatten the video array so the result is an array of objects, not nested arrays
        $addFields: {
            video: { $first: "$video" }
        }
    }
]);

    
    return res.status(200).json(new ApiResponse(200, likedVideos.length>0? likedVideos[0] : [], "Liked Videos Fetched"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}