import connectDB from "./db/index.js";
import dotenv from "dotenv";
// Study package.json file
//As early as possible , import and configure environment variable

dotenv.config({
    path: './env'
})
// Load the db immediately after the app is running, so that we can get data at the start of application
connectDB();