import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

// Controller simply means --< req se data receive karo us pr kuch processing karo( processing canbe db related queries or some validations chenck or any middleware or any file uplading)
// then res send krdo (in creation : we create the data row in form of obj and save to db and return response)
// const createTweet = asyncHandler(async (req, res) => {
//     //TODO: create tweet
//     const content = req.body;
//     if(!content){
//         throw new ApiError(400,"Tweet content is required")
//     }

//     // The user logged in can only write a tweet , so verifyjWT middleware will be injected at the routes, so here we have req
//     const tweetOwner = await User.findById(req.user._id);
//     if(!tweetOwner){
//         throw new ApiError(400, "Tweet Owner is required")
//     }
//     const tweet = {
//         content,
//         owner: tweetOwner
//     }
//     return res.status(200)
//         .json(new ApiResponse(200, tweet, "Tweet Created Successfully")
// )
// })

// const getUserTweets = asyncHandler(async (req, res) => {
//     // TODO: get user tweets
//     let userId;
//         // to get All tweets from user x and userId is given in params in routes
//     if(req.params.userId){
//         userId = req.params.userId;
//     }
//     else{
//          userId = req.user._id;
//     }
//     // I am the user and i want to show my all tweets
//     const tweets = await Tweet.find({ _id : userId});
//     return res.status(200)
//                 .json(new ApiResponse(200, tweets,"Tweets Fetched Successfully"))    
// })

// const updateTweet = asyncHandler(async (req, res) => {
//     //TODO: update tweet

//     // I am user , i am updating my tweet using a frontend form, i will get the updated content from req.body
//     const tweetId = req.params.tweetId;
//     const updatedTweet = req.body;
//     const tweet = await Tweet.findByIdAndUpdate(
//             tweetId,
//             {
//             // PATCH
//             $set: {
//                 content: updatedTweet
//             }
//         },
//         {new : true}
//     )

//     return res.status(200)
//               .json(new ApiResponse(200, tweet, "Tweet Updated"))
// })

// const deleteTweet = asyncHandler(async (req, res) => {
//     //TODO: delete tweet

//     const tweetId = req.params.tweetId;
//     const deletedTweet = await Tweet.findByIdAndDelete(tweetId);
//     return res.status(200)
//               .json(new ApiResponse(200, deletedTweet, "Tweet Deleted"))

// })

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;

    if (!content?.trim()) {
        throw new ApiError(400, "Tweet content is required");
    }

    // Create the tweet in the DB
    const tweet = await Tweet.create({
        content,
        owner: req.user._id // Taken from verifyJWT middleware
    });

    return res.status(201)
        .json(new ApiResponse(201, tweet, "Tweet Created Successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid User ID");
    }

    // Find tweets where owner field matches the userId
    const tweets = await Tweet.find({ owner: userId });

    return res.status(200)
        .json(new ApiResponse(200, tweets, "Tweets Fetched Successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) throw new ApiError(400, "Content is required");

    // 1. Find the tweet
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) throw new ApiError(404, "Tweet not found");

    // 2. Check Ownership (Only owner can update)  [Authorization --> user is authorized to update this tweet i.e user A cannot update user B tweet]
    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to edit this tweet");
    }

    // 3. Update
    tweet.content = content;
    await tweet.save();

    return res.status(200)
        .json(new ApiResponse(200, tweet, "Tweet Updated"));
});

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) throw new ApiError(404, "Tweet not found");

    // Check Ownership
    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to delete this tweet");
    }

    await Tweet.findByIdAndDelete(tweetId);

    return res.status(200)
        .json(new ApiResponse(200, {}, "Tweet Deleted Successfully"));
});

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
