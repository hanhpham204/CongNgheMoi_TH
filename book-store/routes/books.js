const express = require("express")
const router = express.Router()

const controller = require("../controllers/bookController")

router.get("/", controller.listBooks)

router.get("/add", controller.showAdd)

router.get("/edit/:id", controller.showEdit)

router.post("/add", controller.addBook)

router.post("/edit/:id", controller.updateBook)

router.post("/delete/:id", controller.deleteBook)

module.exports = router