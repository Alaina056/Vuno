import express from 'express';
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// setting middlewares
app.use(cors({
    origin: process.env.CORS_ORIGIN,                   // production grade code
    credentials: true
}))

// the following middleware is saying that : I am allowing json data in my app and limit is 16kb
app.use(express.json({limit: "16kb"}))

// URL se bhi data ataa hai or URL encoded hota hai , if we see any URL on google it is encoded [like space is %20], so the express needs to understand this
app.use(express.urlencoded({
    extended : true,          // mean nested objects hoskta hai
    limit: "16kb"
}))   

// the following middleware means k kuch files hai /pdfs hai jo kahi se aarhe hai ya images hai jinhe hm server pr hi rkhna chahte hai 
app.use(express.static("public"))

// cookie-parser : to get/set or to perform CRUD operations on clients (browsers) cookies, ye secure cookies jinhe sirf server hi read kr skta hai or write krskta hai
app.use(cookieParser())

// NOTES: app mai data boht jaga se aaskta hai, JSON mai askta hai kisi URL se aaskta hai, agr form hai to body se aaskta hai to is ki preparation krni hogi
// like we cannot allow unlimited to JSON data, we have to limit because if we don't our server will crash
export {app}