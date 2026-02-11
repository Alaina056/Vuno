1. async function --> related to promise --> and it always returns a PROMISE
2. Most important things is: req.body and req.params, req.cookies
3. MIDDLEWARES: middlewares is nothing but some processing we do between the req-response cycle. like we get request , append some thing to it and then send it to the servder (to jo beech mai request rok kr jo kaam hm ne kia hai wohi middlewares hotai hai)  [ye configurations k liye use hota hai]
    app.use(cors())

-- browser se request gayi server pr , beech mai kuch middlewares that (like check if user is logged in, check if user is admin etc), ye middlewares ne request ko check kia [ye beech ki checking hi middlewares ka kaam hai, ye hmari server ki computing power ko reduce krti hai], then server pr gayi at the end request.

4. CORS_ORIGIN =*    #this means we are allowing request from everywhere,[ in production, you are going t write the URL where your frontend is hosted, the vercel one ,or the netlify one etc]

5. (err,req, res, next) --> next is a flag variable k mera kaam huwa hai ya nge


VIDEO 10: 
6. MONGODB Bson mai data save krta hai
The BSON data type is the binary representation of a JSON data type format for serializing JSON documents. When you insert JSON documents through the wire listener with MongoDB API commands, a BSON column that is named data is created in the specified collection.
7. For images and videos storing in db, we use a third party service (it could be AWS, cloudinary etc), we upload our data their, then it generates a URL, and we save this URL as string in our database.

8. true power of Mongodb is "Aggregation queries/pipeline"
for this we use, mongoose-aggregate-paginate-v2
        A page based custom aggregate pagination library for Mongoose with customizable labels.

If you are looking for basic query pagination library without aggregate, use this one mongoose-paginate-v2

9. REFRESH Token is not stored in the db
10. we write generateTokens() fn in models

------------------------------------------------------------------------------------
VIDEO 12: ROUTING
Exmaple GET Request

GET /api/profile/me
This means you’re asking the server, “Hey, give me the profile info.”

And here’s the backend code that handles this:

app.get('/api/profile/me', (c) => {
  return c.json({
    name: 'Steve Rogers',
    role: 'Captain America',
    team: 'Avengers'
  });
});
app.get(...) this listens for a GET request at the route /api/profile/me
c.json(...) this sends back a JSON response.
Inside the response, we’re sending some data like name, role, and team. Just like a real profile!

Let’s break it down:
Intent GET
Route /api/profile/me
Response some user data from the serve



SO, GET with a URL means in frontend means, asking the server to give me this data
and GET in backend means ,server is listening GET request on a specific URL , and whenever that hits, i am going to send you response 

article : https://medium.com/@notcodesid/routing-for-backend-engineer-aeaa6f4d8465 
----------------------------------------------------











ASSIGNMENTS:
1. study response object of connectionInstance
2. study CORS from npm