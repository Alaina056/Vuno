import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema(
    {
        content : {
            type: String,
            required: true
        },
        video : {
            type: Schema.Types.ObjectId,
            ref: "Video"
        },
        owner : {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
},
{
    timestamps: true
})

commentSchema.plugin(mongooseAggregatePaginate); // there can be millions of comments we cannot show them at once wrna bad UX so we paginate them

export const Comment = mongoose.model("Comment", commentSchema)