const express = require("express");

const router = express.Router();

const controller = require("../controllers/ticketController");

const upload = require("../middlewares/upload");

router.get("/", controller.index);

router.get("/add", controller.showAdd);

router.post(
  "/tickets/add",
  upload.single("image"),
  controller.createTicket
);

router.get("/delete/:id", controller.deleteTicket);

router.get("/search", controller.search);

router.get("/edit/:id", controller.showEdit);

router.post(
  "/update/:id",
  upload.single("image"),
  controller.updateTicket
);

module.exports = router;