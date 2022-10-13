const { tryCatchWrapExpress } = require("../Utils/wrappers");
const Token = require("../Models/tokens");
const { User } = require("../Models/users");

const verifyUser = tryCatchWrapExpress(async (req, res) => {
    const foundUser = await User.findById(req.params.id);

    if (!foundUser)
        return res.status(400).json({ message: "Invalid/Expired Link" });

    const token = await Token.findOne({
        userID: foundUser._id,
        token: req.params.token
    });

    if (!token) return res.status(400).json({ message: "Invalid/Expired Link" });

    await User.findByIdAndUpdate({ _id: foundUser._id }, { verified: true });
    await Token.findByIdAndRemove(token._id);

    res.status(200).json({ message: "Verified Successfully " });
});

module.exports = { verifyUser };