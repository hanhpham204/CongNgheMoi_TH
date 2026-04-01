require("dotenv").config()

const express = require("express")
const path = require("path")
const methodOverride = require("method-override")

const bookRoutes = require("./routes/books")

const app = express()

app.use(express.urlencoded({extended:true}))
app.use(express.json())

app.use(methodOverride("_method"))

app.use(express.static(path.join(__dirname,"public")))

app.set("view engine","ejs")
app.set("views",path.join(__dirname,"views"))

app.use("/books",bookRoutes)

app.get("/",(req,res)=>{
 res.redirect("/books")
})

app.listen(3000,()=>{
 console.log("Server running http://localhost:3000")
})