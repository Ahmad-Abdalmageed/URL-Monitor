const { tryCatchWrapExpress } = require("../Utils/wrappers");
const { User, validate } = require("../Models/users");
const Token = require("../Models/tokens");
const crypto = require("crypto");
const { apiError } = require("../Utils/apiError");
const { bcrypt_pass, bcrypt_salt, jwt_password } = require("../Config/config.secrets");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../Utils/mail");


const createUser = tryCatchWrapExpress(async (req, res) => {
    const isNotValid = validate(req.body);
    if (isNotValid) throw new apiError(400, isNotValid.details[0].message);

    const isDuplicate = await User.findOne({ email: req.body.email });
    if (isDuplicate)
        return res.status(400).json({ message: "User Already Exists" });

    const passHash = bcrypt.hashSync(req.body.password + bcrypt_pass, parseInt(bcrypt_salt));
    const user = await new User({
        username: req.body.username,
        email: req.body.email,
        password: passHash
    }).save();

    const token = await new Token({
        userID: user._id,
        token: crypto.randomBytes(32).toString("hex")
    }).save();

    const verificationURL = `${process.env.base_url}/users/verify/${user._id}/${token.token}`;
    await sendEmail(user.email, "Verify Email", verificationURL);

    res.status(200).json({
        message: "Verification Sent",
        user,
        url: verificationURL
    });
});

const authenticateUser = tryCatchWrapExpress(async (req, res) => {
    const isNotValid = validate(req.body, true);
    if (isNotValid) throw new apiError(400, isNotValid.details[0].message);

    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).json({ message: "User not found " });

    const authenticated = bcrypt.compareSync(
        req.body.password + bcrypt_pass, user.password
    );
    if (!authenticated) return res.status(400).json({ message: "wrong password" });

    const generatedToken = jwt.sign({ user }, jwt_password);
    res.status(200).json({
        message: "User Authentication Successful",
        token: generatedToken
    });
});

module.exports = { createUser, authenticateUser };