import multer from "multer";

// a middleware , that will be use when there is a file in the request  or response


// option desc: A string or function may be specified to determine the destination directory, and a function to determine filenames. If no options are set, files will be stored in the system's temporary directory with random 32 character filenames.
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp")
    } ,
    filename: function(req,file,cb){
        cb(null, file.originalname)
    }

    // diskStorage mai functions ki logic simple JS hai , like jb multer({storage}), ye functions khud execute hogai

})

export const upload = multer({
    storage,
})