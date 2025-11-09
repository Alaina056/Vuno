// Read Nodejs Error built-in class
class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        errStack = ""
    ){
        // overriding Error constructor
        super(message)
        this.statusCode = statusCode;
        this.data = null   // READ THIS ASSIGNMENT
        this.message = message
        this.success = false     // because we are handling Response error
        this.errors = errors

        // ye stack sirf development env mai kaam ati hia, production pr isai hata detai hia
        if(errStack){
            this.stack = errStack;
        }else{
            // this -> means reference of the context
            Error.captureStackTrace(this, this.constructor)
        }
    }


}

export {ApiError}
