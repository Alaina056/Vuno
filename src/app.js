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

//**  ROUTES import */
import userRouter from './routes/user.routes.js';

// ------------------------------------------------------

// we can define routes like the following also, but in this project we are using "ROUTER" separately
// mtlb k hm ne express mai sai pehle hi ROUTER ko separte krliye hai (see user.routes.js), to hm through middleware likhe gai

// ? app.get("/users")

// ------------------------------------------------------

// PRODUCTION GRADE WAY OF WRITING ROUTES FOR BACKEND
// routes declaration

app.use("/api/v1/users",userRouter)
// SO when user hits the api/v1/users URL , the control will pass to the userRouter function, userRouter is nothing but the user.route.js default export
// api/v1 --> is nothing but a standard practice in production , this is called API VERSIONING

/************************************************************************************************************** */
// api versioning is necessary 
// 5. Route Versioning

// Sometimes APIs modified or grow over time. To avoid breaking old apps, we use versioning.

// It’s like saying: “Hey! This is version 1 of the API.”

// So instead of:
// /api/profile/me
// we use:
// /api/v1/profile/me

// Here, v1 means version 1.

// Why it is useful?

// Let’s say later we make a new version with more features or a different structure.
// Instead of changing the old route, we just create:
// /api/v2/profile/me

// Now both versions can live together!

/************************************************************************************************************** */

export {app}