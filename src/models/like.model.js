import mongoose, { Schema } from "mongoose";


// here , If user likes a video then a doc is saved with video and likedBY
// If user likes a tweet ,then the another doc will be saved with tweet and likeBy.
const likeSchema = new Schema({
    video : {
        type: Schema.Types.ObjectId,
        ref : "Video"
    },
    comment : {
        type: Schema.Types.ObjectId,
        ref: "Comment"
    },
    tweet : {
        type: Schema.Types.ObjectId,
        ref : "Tweet"
    },
    likedBy : {
        type: Schema.Types.ObjectId,
        ref : "User"
    }
},
{
    timestamps: true
})

export const Like = mongoose.model("Like", likeSchema)