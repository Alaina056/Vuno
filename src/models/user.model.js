import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt';

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String,   // Cloudinary (a service like AWS) URL storing
            required: true,
        },
        coverImage:{
            type: String,
        },
        // watch history is linked with videio.model.js ,  ObjectId[] videos
        watchHistory: [  //Array of object
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            requried: [true, "Password is required"]   // [value, custom message]
        },
        refreshToken :{
            type: String
        }

    },
     {
        timestamps: true
    });



// mongoose hook which helps to apply any logic just before something
// userSchema.pre("save", ()=> {})  do not use arrow function because yaha context pta hona laazmi hai

// every callback on hooks have three params must --> req , res, next()
userSchema.pre("save", async function (next) {
    
    // we  want to change the encrypted password only when the password is modified
                                                        // next() callback means apna kaam hogya hai ab next hook/middleware pr brh jao            
    if(!this.isModified("password")) return next()
                                                // hash round - 10
    this.password = await bcrypt.hash(this.password,10);
    next();
})

// OOP concept: Adding custom methods into an object
userSchema.methods.isPasswordCorrect = async  function( password ){
    //DONOT use arrow function as it do not have this binding     
    // compare fn , compares user string pswd with the stored encrypted pswd
  return await bcrypt.compare(password, this.password)
}

//JWT --> is a bearer token , jis k pass bhi ye token hoga , hm usia data de degai 
// in tamam methods mai stored data jo db mai hai un ka access hai this kr k

// short lived expiry
// authorization : i.e Login user (authenticated user) ko hi kaam krne do
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: ACCESS_TOKEN_EXPIRY
        }
    )

}

// long lived expiry 
ye db or user dono k paas rehta hai, user
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: REFRESH_TOKEN_EXPIRY
        }
    )

}

// moongose model bna do, okay kis naam se ,"User" se , or kon sa schema use krna hai "userSchema" jo upper defined hai
export const User = mongoose.model("User", userSchema);
// Mongo Db mai kis name sai save hoga model? --> users (all lower case + s at end)
// index: true --> jb hmai kisi bhi field ko db mai optimzed way mai searchable bnan hoto hm index: true krdete hai [INDEXING is a vast topic in db] --> remember it is expensive

// Mongo db do allow store media files (like images etc), but it is not a good practice as this will be heavy on db.
//System design , Database design


// bycrypt and bycrypt.js --> A library to help you hash passwords
// json web token (jwn) --> it creates token
// the above both are cryptographic algorithm 
// payload --> data


// arrow function do not have "this" binding , us k pass this ka reference nhe hota means "context" nhe hota k ye kis object pr chlana hai