import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

/**
 * NOTES:
 *  1. Database is in another continent , so it takes times to communicate with db --> we use asyn await
 *  2. During communication , there might occur some error --> so keep it under try-catch
 */
const connectDB = async ()=>{
    try {
        // this will return an object (response)
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        //! study this connectionInstance object
        // db prod, development, testing ka alag alag hota hai
        console.log(`\n MongoDB connected, DB HOST: ${connectionInstance.connection.host}`);
        
    } catch (error) {
        console.log("MONGODB connection error ", error)
        // our current running application is running on a process so "process" variable is the reference of that 
        process.exit(1)
    }
}

export default connectDB;