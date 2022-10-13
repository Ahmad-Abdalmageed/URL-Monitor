require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./Config/config.db");
const usersRouter = require("./Routes/users");
const errorHandler = require("./Middlewares/errorHandler");
const PORT = process.env.port || 8000;
const app = express();


// Routes & Middlewares
app.use(cors());
app.use(express.json());

app.use("/api/v1/users", usersRouter);


app.use(errorHandler);
// Server
app.get("/", (req, res) => {
    res.json({ message: "Hello Bosta" });
});

(async () => await connectDB())();
app.listen(PORT, () => {
    console.log(`Server Started on ${PORT}...`);
});
