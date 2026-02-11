import connectDB from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js";
// Study package.json file
//As early as possible , import and configure environment variable

dotenv.config({
    path: './.env'
})

let portNumber = process.env.PORT || 8000;
// Load the db immediately after the app is running, so that we can get data at the start of application
connectDB()
.then(()=>{

    // Assignment 2: on listener
    app.on("error", (error)=>{
        console.log("ERROR: ",error);
        throw error;
    })
    app.listen(portNumber, ()=>{
        console.log(`App is listening at: ${portNumber}`);
        
    });
})
.catch((error)=>{
    console.log("MONGO db connection failed !!!", err);
    
})