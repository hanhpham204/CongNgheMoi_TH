require("dotenv").config();
const express = require("express");
const path = require("path");
const methodOverride = require("method-override");
const roomRoutes = require("./routes/roomRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (_req, res) => {
  res.redirect("/rooms");
});

app.use("/rooms", roomRoutes);

app.use((req, res) => {
  res.status(404).send("404 Not Found");
});

app.use((err, _req, res, _next) => {
  console.error("Unhandled Error:", err);
  res.status(500).send("Internal Server Error");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
