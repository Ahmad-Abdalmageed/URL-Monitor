const { apiError } = require("../Utils/apiError");
const { Check, validateCheck } = require("../Models/urlCheck");
const reportController = require("../Controllers/reports");
const { userExists } = require("../Controllers/users");

function validCheckParameters(check, update = false) {
    const isNotValid = validateCheck(check, update);
    if (isNotValid) throw new apiError(400, isNotValid.details[0].message);
}


const createCheck = async (check, userID) => {
    if (!userID) throw new apiError(400, "User Missing");

    //Check user Existence
    if (!await userExists(userID))
        throw new apiError(400, "User Does Not Exist");

    validCheckParameters(check);

    // Check Duplicate URL
    const foundCheckDuplicate = await Check.findOne({ name: check.name, url: check.url, userID });
    if (foundCheckDuplicate) throw new apiError(400, "Duplicate Check");

    const newCheck = await new Check({
        ...check,
        userID
    }).save();
    // Create Accompanied Report
    await reportController.createReport({}, newCheck._id, userID);

    return { message: "Check Created", checkID: newCheck._id };
};

const getChecks = async (userID) => {
    if (!userID) throw new apiError(400, "User Missing");

    //Check user Existence
    if (!await userExists(userID))
        throw new apiError(400, "User Does Not Exist");

    const userChecks = await Check.find({ userID });

    return { message: "Checks Found", userChecks };
};

// TODO : Remove
const getCheckByName = async (userID, checkName) => {
    if (!userID) throw new apiError(400, "User Missing");
    if (!checkName) throw new apiError(400, "Check Name Missing");
    //Check user Existence
    if (!await userExists(userID))
        throw new apiError(400, "User Does Not Exist");

    const exists = await Check.exists({ name: checkName, userID });
    if (!exists)
        throw new apiError(400, "Check Not Found");
    const check = await Check.findById(exists);
    return { message: "Found Check", check };
};

const updateCheck = async (userID, checkID, newCheck) => {
    if (!newCheck || Object.keys(newCheck).length === 0)
        throw new apiError(400, "Empty Update Check");
    if (!checkID)
        throw new apiError(400, "Missing Check ID");
    if (!userID)
        throw new apiError(400, "Missing User ID");
    //Check user Existence
    if (!await userExists(userID))
        throw new apiError(400, "User Does Not Exist");

    validCheckParameters(newCheck, true);

    const exists = await Check.exists({ _id: checkID, userID });
    if (!exists)
        throw new apiError(400, "Check Not Found");

    await Check.findByIdAndUpdate(exists, newCheck);
    return { message: "Check Updated" };
};


const deleteCheck = async (userID, checkID) => {
    if (!checkID)
        throw new apiError(400, "Missing Check ID");
    if (!userID)
        throw new apiError(400, "Missing User ID");
    //Check user Existence
    if (!await userExists(userID))
        throw new apiError(400, "User Does Not Exist");

    const exists = await Check.exists({ _id: checkID, userID });
    if (!exists)
        throw new apiError(400, "Check Not Found");

    await Check.findByIdAndDelete(exists);

    // Delete Accompanied Report
    await reportController.deleteReport(checkID, userID);
    return { message: "Check Deleted" };
};


module.exports = {
    createCheck,
    getChecks,
    getCheckByName,
    updateCheck,
    deleteCheck
};
