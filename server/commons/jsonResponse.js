
let jsonResponse = {};

jsonResponse.successData = (_data, _length, _total, re_total) => {

    let result = {};

    /*if (!Array.isArray(_data)) {
        _length = 1
        _total = 1
    }*/

    result.success = true;
    result.code = 1000;
    result.message = "success";
    result.data = _data ? _data : null;
    result.length = _length === 0 || _length ? _length : _data ? Array(_data).length : 0;
    result.total = _total === 0 || _total ? _total : _data ? Array(_data).length : 0;

    if (re_total)
        result.re_total = re_total === 0 || re_total ? re_total : _data ? Array(_data).length : 0;

    return result;
}

jsonResponse.emptyData = (msg) => {

    let result = {};

    result.success = false;
    result.code = 1001;
    result.message = msg ? msg : "invalid data";

    return result;
}

jsonResponse.invalidData = (msg, data) => {

    let result = {};

    result.success = false;
    result.code = 1002;
    result.message = msg ? msg : "invalid data";

    if (data) {
        result.data = data;
    }

    return result;
}

jsonResponse.invalidAccount = (msg) => {

    let result = {};

    result.success = false;
    result.code = 1003;
    result.message = msg ? msg : "invalid data";

    return result;
}

jsonResponse.notFound = () => {

    let result = {};

    result.success = false;
    result.code = 1004;
    result.message = "not found";

    return result;
}

jsonResponse.brokenSomething = () => {

    let result = {};

    result.success = false;
    result.code = 1005;
    result.message = "something broke";

    return result;
}

jsonResponse.parsingError = (msg) => {

    let result = {};

    result.success = false;
    result.code = 1006;
    result.message = msg ? msg : "parsing error";

    return result;
}

jsonResponse.invalidAccess = (msg) => {

    let result = {};

    result.success = false;
    result.code = 1007;
    result.message = msg ? msg : "invalid data";

    return result;
}

jsonResponse.tokenError = (msg) => {

    let result = {};

    result.success = false;
    result.code = 1008;
    result.message = msg ? msg : "invalid data";

    return result;
}

jsonResponse.sqlError = (msg) => {

    let result = {};

    result.success = false;
    result.code = 1009;
    result.message = msg ? msg : "invalid data";

    return result;
}

jsonResponse.duplicateData = (msg) => {

    let result = {};

    result.success = false;
    result.code = 1010;
    result.message = msg ? msg : "duplicate data";

    return result;
}

jsonResponse.uploadError = (msg) => {

    let result = {};

    result.success = false;
    result.code = 1011;
    result.message = msg ? msg : "upload failed";

    return result;
}

jsonResponse.downloadError = (msg) => {

    let result = {};

    result.success = false;
    result.code = 1012;
    result.message = msg ? msg : "download failed";

    return result;
}

jsonResponse.beyondSomething = (msg, data) => {

    let result = {};

    result.success = false;
    result.code = 1013;
    result.message = msg ? msg : "invalid data";
    result.data = data ? data : null;

    return result;
}

jsonResponse.underSomething = (msg, data) => {

    let result = {};

    result.success = false;
    result.code = 1014;
    result.message = msg ? msg : "invalid data";
    result.data = data ? data : null;

    return result;
}

jsonResponse.sameUser = (msg) => {

    let result = {};

    result.success = false;
    result.code = 1015;
    result.message = msg ? msg : "invalid data";

    return result;
}

jsonResponse.suspendedUser = (msg) => {

    let result = {};

    result.success = false;
    result.code = 1016;
    result.message = msg ? msg : "invalid data";

    return result;
}

jsonResponse.retiredUser = (msg) => {

    let result = {};

    result.success = false;
    result.code = 1017;
    result.message = msg ? msg : "invalid data";

    return result;
}


// 2000 대
jsonResponse.failCreatingOrderNum = (msg) => {

    let result = {};

    result.success = false;
    result.code = 2001;
    result.message = msg ? msg : "fail crating order num";

    return result;
}

jsonResponse.failRefund = (msg) => {

    let result = {};

    result.success = false;
    result.code = 2002;
    result.message = msg ? msg : "fail refund";

    return result;
}

jsonResponse.failInquiryDataFromPG = (msg) => {

    let result = {};

    result.success = false;
    result.code = 2003;
    result.message = msg ? msg : "fail inquiry";

    return result;
}


jsonResponse.failInquiryDataFromDB = (msg) => {

    let result = {};

    result.success = false;
    result.code = 2004;
    result.message = msg ? msg : "fail inquiry";

    return result;
}


jsonResponse.failPayment = (msg) => {

    let result = {};

    result.success = false;
    result.code = 2005;
    result.message = msg ? msg : "fail payment";

    return result;
}


jsonResponse.errorFromProcessingInvalidData = (msg) => {

    let result = {};

    result.success = false;
    result.code = 2006;
    result.message = msg ? msg : "error from processing invalid data";

    return result;
}

jsonResponse.successFromProcessingInvalidData = (msg) => {

    let result = {};

    result.success = false;
    result.code = 2007;
    result.message = msg ? msg : "success from processing invalid data";

    return result;
}


jsonResponse.invalidPaymentData = (msg) => {

    let result = {};

    result.success = false;
    result.code = 2008;
    result.message = msg ? msg : "invalid payment data";

    return result;
}

module.exports = jsonResponse