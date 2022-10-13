const { tryCatchWrapExpress } = require("../Utils/wrappers");
const { User, validate } = require("../Models/users");
const Token = require("../Models/tokens");
const crypto = require("crypto");
const { apiError } = require("../Utils/apiError");
const { bcrypt_pass, bcrypt_salt } = require("../Config/config.secrets");
const bcrypt = require("bcryptjs");
// const sendEmail = require("../Utils/mail");


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
    // await sendEmail(user.email, "Verify Email", verificationURL);

    res.status(200).json({
        message: "Verification Sent",
        user,
        url: verificationURL
    });
});


module.exports = { createUser };