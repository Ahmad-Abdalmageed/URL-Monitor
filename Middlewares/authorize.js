const jwt = require("jsonwebtoken");
const { apiError } = require("../Utils/apiError");
const { jwt_password } = require("../Config/config.secrets");

const authorize = async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        if (!token)
            return res.status(403).json({ message: "Authorization Needed" });
        const decoded = jwt.verify(token, jwt_password);
        req.userID = decoded.user._id;
    } catch (error) {
        return next(new apiError(401, "Could not Authorize User"));
    }
};


module.exports = { authorize };