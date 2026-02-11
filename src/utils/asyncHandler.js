// The following two functions are wrapper for db connection, so we donot have to write same code multiple times

// promise wala way 
const asyncHandler  = (requestHandler)=>{
    // this is the function definintion, we are returning this function definition and not calling this,
    // express k through hm code likhte hai to hmarai pass 4 cheezai hoti hai by default: err,req, res, next
   return (req,res, next)=>{
        Promise.resolve( requestHandler(req,res, next))
        .catch((error)=>{ next(error )})
    }
}

export {asyncHandler}







// try catch wala 
// it is a higher order function {jo fn ko aik parameter bhi leskta hai or function return bhi krskta hia}
const tryHandler  = ( fn )=> async (req,res,next) =>{
    try {
        await fn(req,res,next)
    } catch (error) {
        // error code bhej rhe hai with json response to the frontend
        res.status(error.code || 500).json({
            success: false,
            message: error.message
        })
    }
}



//1.  const tryHandler = () =>{}    
//2.  const tryHandler = (fn) =>{ async()=>{} }  // taking function as a param and return a function