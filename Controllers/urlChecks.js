const { apiError } = require("../Utils/apiError");
const { Check, validateCheck } = require("../Models/urlCheck");
const reportController = require("../Controllers/reports");
const { userExists } = require("../Controllers/users");
// const { startPoll } = require("./polling");


const isValidUrl = (urlString) => {
    const urlPattern = new RegExp("^(https?:\\/\\/)?" + // validate protocol
        "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // validate domain name
        "((\\d{1,3}\\.){3}\\d{1,3}))" + // validate OR ip (v4) address
        "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // validate port and path
        "(\\?[;&a-z\\d%_.~+=-]*)?" + // validate query string
        "(\\#[-a-z\\d_]*)?$", "i"); // validate fragment locator
    return !!urlPattern.test(urlString);
};

function validCheckParameters(check, update = false) {
    const isNotValid = validateCheck(check, update);
    if (isNotValid) throw new apiError(400, isNotValid.details[0].message);
}

async function getCheckByID(checkID) {
    return Check.findById(checkID);
}

const createCheck = async (check, userID) => {
    if (!userID) throw new apiError(400, "User Missing");

    //Check user Existence
    if (!await userExists(userID))
        throw new apiError(400, "User Does Not Exist");

    validCheckParameters(check);
    const urlObj = new URL(check.url);
    const newCheck = {
        url: urlObj.hostname,
        path: urlObj.pathname ? urlObj.pathname : null,
        userID,
        protocol: urlObj.protocol,
        port: urlObj.port,
        ...check
    };
    if (newCheck.webhook && !isValidUrl(newCheck.webhook))
        throw new apiError(400, "Not a Valid URL");

    // Check Duplicate URL
    const foundCheckDuplicate = await Check.findOne({ name: check.name, url: check.url, userID });
    if (foundCheckDuplicate) throw new apiError(400, "Duplicate Check");

    const { _id } = await new Check(newCheck).save();
    // Create Accompanied Report
    await reportController.createReport({}, _id, userID);

    return { message: "Check Created", checkID: _id };
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

    const urlObj = new URL(newCheck.url);
    const newCheckUpdated = {
        url: urlObj.hostname,
        path: urlObj.pathname ? urlObj.pathname : null,
        userID,
        protocol: urlObj.protocol,
        port: urlObj.port,
        ...newCheck
    };
    const exists = await Check.exists({ _id: checkID, userID });

    if (!exists)
        throw new apiError(400, "Check Not Found");

    await Check.findByIdAndUpdate(exists, newCheckUpdated);
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

    // Delete Accompanied Report
    await reportController.deleteReport(checkID, userID);

    await Check.findByIdAndDelete(exists);
    return { message: "Check Deleted" };
};


module.exports = {
    getCheckByID,
    createCheck,
    getChecks,
    getCheckByName,
    updateCheck,
    deleteCheck
};
