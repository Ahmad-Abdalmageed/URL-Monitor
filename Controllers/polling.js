const reportController = require("./reports");
const axios = require("axios");
const sendEmail = require("../Utils/mail");
const userController = require("./users");

const axiosInstance = axios.create();

// Configure axios to calculate request parameters
axiosInstance.interceptors.request.use((axiosRequestConfig) => {
    axiosRequestConfig.headers["start"] = Date.now();
    return axiosRequestConfig;
}, function(error) {
    return Promise.reject(error);
});

axiosInstance.interceptors.response.use((axiosResponseConfig) => {
    const start = axiosResponseConfig.config.headers["start"];
    axiosResponseConfig.config.headers["end"] = Date.now();

    axiosResponseConfig.config.headers["duration"] = Date.now() - start;
    return axiosResponseConfig;
}, function(error) {
    error.config.headers["end"] = Date.now();

    error.config.headers["duration"] = error.config.headers["end"] - error.config.headers["start"];
    return Promise.reject(error);
});

async function updateReportOnSuccess(userID, checkID, success) {
    const oldReport = await reportController.getReport(checkID, userID);
    const newReport = {
        status: "available",
        availability: oldReport.uptime / (oldReport.downtime + oldReport.uptime + 1),
        uptime: oldReport.uptime + success.config.headers["duration"],
        responseTime: success.config.headers["duration"],
        $push: {
            history: {
                status: "available",
                availability: oldReport.uptime / (oldReport.downtime + oldReport.uptime + 1)
            }
        }
    };
    await reportController.updateReport(newReport, checkID, userID);
}

async function updateReportOnFail(userID, checkID, fail) {
    const oldReport = await reportController.getReport(checkID, userID);
    const newReport = {
        status: fail.response ? "error" : "unavailable",
        downtime: oldReport.downtime + fail.config.headers["duration"],
        outages: fail.response ? oldReport.outages + 1 : oldReport.outages,
        responseTime: fail.config.headers["duration"],
        $push: {
            history: {
                status: fail.response ? "error" : "unavailable",
                availability: oldReport.availability
            }
        }
    };
    if (newReport.outages % oldReport.threshold === 0) {
        // Notify User by mail
        const user = await userController.userExists(userID);
        const message = `Dear ${user.username},\n Your Service with url: ${fail.config.headers.url} Failed`;
        await sendEmail(user.email, "Failed Service", message);
    }

    await reportController.updateReport(newReport, checkID, userID);
}

async function testURL(urlCheck) {
    const options = {
        method: `get`,
        timeout: urlCheck.timeout
    };
    let url = urlCheck.port ?
        `${urlCheck.protocol}//${urlCheck.url}:${urlCheck.port}` :
        `${urlCheck.protocol}//${urlCheck.url}`;
    if (urlCheck.path)
        url += urlCheck.path;

    await axiosInstance.get(url, options).then((resp) => {
        // Update Report with Successful entry
        console.log(resp.config.headers["duration"]);
        updateReportOnSuccess(urlCheck.userID, urlCheck._id, resp);

    }).catch((error) => {
        // Update Report with Failure Entry
        console.log(error.config.headers["duration"]);
        updateReportOnFail(urlCheck.userID, urlCheck._id, error);
    });
}

function startPoll(urlCheck) {
    function poll() {
        testURL(urlCheck).then(() => console.log(`URL TESTED: ${urlCheck.url}`));
        setTimeout(poll, urlCheck.interval);
    }

    poll();
}


module.exports = { startPoll };
// Polling
// get all reports

// const testURLs = [
//     "https://google.com.br/iaculis/justo/in/hac.jsp?nec=ornare&euismod=imperdiet&scelerisque=sapien&quam=urna&turpis=pretium&adipiscing=nisl&lorem=ut&vitae=volutpat&mattis=sapien&nibh=arcu&ligula=sed&nec=augue&sem=aliquam&duis=erat&aliquam=volutpat&convallis=in&nunc=congue&proin=etiam&at=justo&turpis=etiam&a=pretium&pede=iaculis&posuere=justo&nonummy=in&integer=hac&non=habitasse&velit=platea&donec=dictumst&diam=etiam&neque=faucibus&vestibulum=cursus&eget=urna&vulputate=ut&ut=tellus&ultrices=nulla&vel=ut&augue=erat&vestibulum=id&ante=mauris&ipsum=vulputate&primis=elementum&in=nullam&faucibus=varius&orci=nulla&luctus=facilisi&et=cras&ultrices=non&posuere=velit&cubilia=nec&curae=nisi&donec=vulputate&pharetra=nonummy&magna=maecenas&vestibulum=tincidunt&aliquet=lacus&ultrices=at&erat=velit&tortor=vivamus&sollicitudin=vel&mi=nulla&sit=eget&amet=eros&lobortis=elementum&sapien=pellentesque&sapien=quisque&non=porta&mi=volutpat&integer=erat&ac=quisque&neque=erat&duis=eros&bibendum=viverra&morbi=eget&non=congue&quam=eget&nec=semper&dui=rutrum&luctus=nulla&rutrum=nunc&nulla=purus&tellus=phasellus&in=in&sagittis=felis&dui=donec&vel=semper&nisl=sapien&duis=a&ac=libero&nibh=nam&fusce=dui"
//     , "https://4shared.com/augue/vestibulum/rutrum/rutrum/neque.xml?donec=lacus&semper=at&sapien=velit&a=vivamus&libero=vel&nam=nulla&dui=eget&proin=eros&leo=elementum&odio=pellentesque&porttitor=quisque&id=porta&consequat=volutpat&in=erat&consequat=quisque&ut=erat&nulla=eros&sed=viverra&accumsan=eget&felis=congue"
//     , "https://nature.com/pellentesque/quisque/porta/volutpat.aspx?imperdiet=nunc&nullam=donec&orci=quis&pede=orci&venenatis=eget&non=orci&sodales=vehicula&sed=condimentum&tincidunt=curabitur&eu=in&felis=libero&fusce=ut&posuere=massa&felis=volutpat&sed=convallis&lacus=morbi&morbi=odio&sem=odio&mauris=elementum&laoreet=eu&ut=interdum&rhoncus=eu&aliquet=tincidunt&pulvinar=in&sed=leo&nisl=maecenas&nunc=pulvinar&rhoncus=lobortis&dui=est&vel=phasellus&sem=sit"
//     , "http://unicef.org/pede/ac/diam.png?nulla=vitae&suspendisse=consectetuer&potenti=eget&cras=rutrum&in=at&purus=lorem&eu=integer&magna=tincidunt&vulputate=ante&luctus=vel&cum=ipsum&sociis=praesent&natoque=blandit&penatibus=lacinia&et=erat&magnis=vestibulum&dis=sed&parturient=magna&montes=at&nascetur=nunc"
// ];


axiosInstance.get("http://localhost:8000/").then((resp) => {
    // Update Report with Successful entry
    console.log(resp.config.headers["duration"]);
}).catch((error) => {
    // Update Report with Failure Entry
    console.log(error);
    console.log(error.config.headers["duration"]);

});