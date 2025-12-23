import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        videoFile :{
            type: String,  // Cloudinary URL
            required: true,
        },
        thumbnail:{
            type: String,   // Cloudinary URL
            required : true
        },
        owner:{
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        title:{
            type: String,
            required: true
        },
        description:{
            type: String,
            requred: true
        },

        // time related things user manually nhe provide krta, jb hm cloudinary pr video upload krai ga ti us cloudinary se hi duration nikaalai gai
        duration :{
            type: Number,
            required: true
        },
        views:{
            type: Number,
            default: 0,  // wrna kuch bhi random value ajai gi initially
        },
        isPublished :{
            type: Boolean,
            default: true
        }
    },{
        timestamps: true
    }
)

//export se pehel aggregate use krte hai
videoSchema.plugin(mongooseAggregatePaginate) 
// model export krte hai hm last mai
export const Video = mongoose.model("Video", videoSchema);