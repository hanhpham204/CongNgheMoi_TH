const express = require("express");

const router = express.Router();

const controller = require("../controllers/ticketController");

const upload = require("../middlewares/upload");

router.get("/", controller.index);

router.get("/tickets/add", (req, res) => {
  res.render("add");
});

router.post(
  "/tickets/add",
  upload.single("image"),
  controller.createTicket
);

// Đồng bộ với link trong index.ejs: /tickets/delete/:id
router.get("/tickets/delete/:id", controller.deleteTicket);

router.get("/search", controller.search);

router.get("/tickets/edit/:id", controller.showEdit);


router.post(
  "/tickets/update/:id",
  upload.single("image"),
  controller.updateTicket
);

module.exports = router;