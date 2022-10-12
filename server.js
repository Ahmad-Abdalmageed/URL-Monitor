require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./Config/config.db");

const PORT = process.env.PORT || 8000;
const app = express();


// Routes & Middlewares
app.use(cors());
app.use(express.json());


// Server
app.get("/", (req, res) => {
    res.json({ message: "Hello Bosta" });
});

(async () => await connectDB())();
app.listen(PORT, () => {
    console.log(`Server Started on ${PORT}...`);
});
