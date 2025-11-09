1. async function --> related to promise --> and it always returns a PROMISE
2. Most important things is: req.body and req.params, req.cookies
3. MIDDLEWARES: middlewares is nothing but some processing we do between the req-response cycle. like we get request , append some thing to it and then send it to the servder (to jo beech mai request rok kr jo kaam hm ne kia hai wohi middlewares hotai hai)  [ye configurations k liye use hota hai]
    app.use(cors())

-- browser se request gayi server pr , beech mai kuch middlewares that (like check if user is logged in, check if user is admin etc), ye middlewares ne request ko check kia [ye beech ki checking hi middlewares ka kaam hai, ye hmari server ki computing power ko reduce krti hai], then server pr gayi at the end request.

4. CORS_ORIGIN =*    #this means we are allowing request from everywhere,[ in production, you are going t write the URL where your frontend is hosted, the vercel one ,or the netlify one etc]

5. (err,req, res, next) --> next is a flag variable k mera kaam huwa hai ya nge
















ASSIGNMENTS:
1. study response object of connectionInstance
2. study CORS from npm