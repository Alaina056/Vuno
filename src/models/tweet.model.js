import mongoose, { Schema } from "mongoose";

const tweetSchema = new Schema({
    content : {
        type: String,
        required: true
    },
    owner : {
        type: Schema.Types.ObjectId,      // in this type of fields, in controllers we have to fetch the data by hitting the db (i.e User)
        ref : "User"
    }
},{
    timestamps: true
})

export const Tweet = mongoose.model("Tweet", tweetSchema)