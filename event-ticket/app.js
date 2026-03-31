const exprees = require('express');
const bodyParser = require('body-parser');

const app = exprees();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}))

const router = require("./routes/ticketRoutes")
app.use("/", router)

app.listen(3000, () => {
    console.log("http://localhost:3000");
})