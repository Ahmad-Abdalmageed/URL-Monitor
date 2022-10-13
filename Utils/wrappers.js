// Async Function Wrapper

const tryCatchWrap = async (message, callback) => {
    try {
        return await callback();
    } catch (e) {
        throw new Error(`${message} -:> ${e}`);
    }
};

const tryCatchWrapExpress = (callback) => {
    return async (req, res, next) => {
        try {
            // Execute the Passed Callback
            await callback(req, res, next);
        } catch (error) {
            //Catch errors if any
            next(error);
        }
    };
};

module.exports = {
    tryCatchWrap,
    tryCatchWrapExpress
};
