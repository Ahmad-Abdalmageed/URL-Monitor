const express = require("express");
const { createUser } = require("../Controllers/users");
const { verifyUser } = require("../Controllers/tokens");

const usersRouter = express.Router();

usersRouter.route("/signup").post(createUser);
usersRouter.route("/verify/:id/:token").get(verifyUser);

module.exports = usersRouter;