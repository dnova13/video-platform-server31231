const crypto = require('crypto')
const numeral = require('numeral');
const dotenv = require('dotenv');

// import dotenv from "dotenv";

dotenv.config();

let utils = {}

utils.hasKey = function (_object, key) {

    if (_object.hasOwnProperty) {
        return _object.hasOwnProperty(key)
    }

    return false
}

utils.hasKeys = function (_object, ...keys) {

    let res = true

    console.log(_object);
    console.log(keys);

    if (!_object.hasOwnProperty) {
        res = false
        return res
    }

    for (let i = 0; i < keys.length; i++) {

        if (this.hasKey(_object, keys[i])) {
            continue
        }

        res = false
        break
    }

    return res
}

utils.hasKeysArray = function (_object, keyArr) {

    let res = true

    if (!_object.hasOwnProperty) {
        res = false
        return res
    }

    for (let i = 0; i < keyArr.length; i++) {

        if (this.hasKey(_object, keyArr[i])) {
            continue
        }

        res = false
        break
    }

    return res
}

// 문자 공백 체크
utils.isBlank = function (str) {

    /*// 문자가 아닐 경우
    if (typeof str !== 'string') {
        return true
    }
    */

    if (!str) {
        return true;
    }

    // 공백일 경우
    if (String(str).trim().length < 1) {
        return true
    }

    return false
}

utils.isBlanks = function (...items) {

    let res = false

    for (let i = 0; i < items.length; i++) {
        if (this.isBlank(items[i])) {
            res = true
            break
        }
    }

    return res
}

utils.isBlanksArray = function (itemArr) {

    let res = false

    if (!Array.isArray(itemArr)) {
        return true
    }

    for (let i = 0; i < itemArr.length; i++) {
        if (this.isBlank(itemArr[i])) {
            res = true
            break
        }
    }

    return res
}

// 각 객체에서의 문자 공백 체크
utils.isObjectBlank = function (_object, ...keys) {

    let res = false

    for (let i = 0, e = keys.length; i < e; i++) {

        if (this.isBlank(_object[keys[i]])) {
            res = true
            break;
        }
    }

    return res
}

utils.isObjectBlankArray = function (_object, keysArr, length) {

    let res = false

    if (!Array.isArray(keysArr)) {
        return true
    }

    for (let i = 0; i < length; i++) {

        console.log(_object[keysArr[i]]);

        if (this.isBlank(_object[keysArr[i]])) {
            res = true
            break;
        }
    }

    return res
}

// 객체 속 null 체크
utils.isNull = function (_object, ...keys) {

    let res = false

    for (let i = 0, e = keys.length; i < e; i++) {

        if (!this.hasKey(_object, keys[i])) {
            res = true
            break
        }

        if (typeof _object[keys[i]] === 'string' && this.isBlank(_object[keys[i]])) {
            // 문자 타입 일때만 공백 체크
            res = true
            break
        }
    }

    return res
}

utils.isNumCheck = function (_object, ...keys) {

    let res = false

    for (let i = 0, e = keys.length; i < e; i++) {

        if (!this.hasKey(_object, keys[i])) {
            res = true
            break
        }

        if (typeof _object[keys[i]] === 'string' && this.isBlank(_object[keys[i]])) {
            res = true
            break
        }

        if (isNaN(parseInt(_object[keys[i]]))) {
            res = true
            break
        }

    }
    return res
}

utils.isNum = function (item) {

    return !isNaN(Number(item))
}

utils.isNums = function (...items) {

    let res = true

    for (let i = 0, e = items.length; i < e; i++) {
        if (this.isNum(items[i])) {
            continue
        }

        res = false
        break
    }

    return res
}

utils.isBeyondZero = function (item) {

    return !(isNaN(Number(item)) || Number(item) < 1);
}

utils.areBeyondZero = function (...items) {

    let res = false

    for (let i = 0; i < items.length; i++) {

        if (this.isBeyondZero(items[i])) {
            res = true
            continue
        }

        res = false
        break;
    }

    return res
}

utils.areBeyondZeroArr = function (arr) {

    let res = true

    // console.log(Array.isArray(arr));
    if (!Array.isArray(arr)) {
        return false
    }

    for (let i = 0; i < arr.length; i++) {

        if (this.isBeyondZero(arr[i])) {
            res = true
            continue
        }

        res = false
        break;
    }

    return res
}

utils.isBeyondMinus = function (item) {

    return !(isNaN(Number(item)) || Number(item) < 0);
}

utils.areBeyondMinus = function (...items) {

    let res = false

    for (let i = 0; i < items.length; i++) {

        if (this.isBeyondZero(items[i])) {
            res = true
            continue
        }

        res = false
        break;
    }

    return res
}

utils.encryptSha256 = function (plainText) {

    if (!plainText || typeof plainText !== 'string' || plainText.trim().length < 1) {
        return false
    }
    return crypto.createHash('sha256').update(plainText).digest('hex')
}


utils.secToHMS = (seconds) => {

    let hour = parseInt(seconds / 3600);
    let min = parseInt((seconds % 3600) / 60);
    let sec = parseInt(seconds % 60);

    hour = String(hour).length > 1 ? hour : "0" + hour;
    min = String(min).length > 1 ? min : "0" + min;
    sec = String(sec).length > 1 ? sec : "0" + sec;

    if (parseInt(hour) < 1) {
        return `${min}:${sec}`;
    }

    return `${hour}:${min}:${sec}`;
}

utils.createImgDownPath = (_id) => {

    let host = process.env.HOST;
    let port = process.env.PORT;
    host = "";


    // return `${host}:${port}/api/file/image/${_id}`
    return _id ? `${host}/api/v1/file/image/${_id}` : null;
}

utils.createFileDownPath = (_id) => {

    let host = process.env.HOST;
    let port = process.env.PORT;

    host = "";
    // return `${host}:${port}/api/file/image/${_id}`
    return _id ? `${host}/api/v1/file/download/${_id}` : null;
}

utils.createVideoDownPath = (_id) => {

    let host = process.env.HOST;
    let port = process.env.PORT;
    host = "";
    // host = process.env.IS_AWS ? process.env.AWS_HLS_URL: "";

    return _id ? `${host}/hls/${_id}/${_id}.m3u8` : null;
}

utils.insertChkFromDB = _result => {

    return _result['success'] && _result['rows']['insertId'] > 0
}

utils.updateChkFromDB = _result => {

    return _result['success'] && _result['rows']['affectedRows'] > 0
}

utils.selectChkFromDB = _result => {

    // sql err
    if (!_result['success']) {
        return -1;
    }

    // empty data
    if (_result['rows'].length < 1) {
        return 0;
    }

    return 1;
}

utils.duplicateSelectChkFromDB = (_result) => {

    // sql err
    if (!_result['success'] || _result['rows'].length < 1) {
        return -1;
    }

    return _result['rows'][0]["cnt"] > 0 ? 1 : 0;
}


utils.searchKeywordsToArray = (str) => {

    return str.trim().split(/(?:\s)+|\s{2,}/gi);
}

utils.createConditionQryForSearch = (column, operator, keywords, frontCondition) => {

    let keywordsArr = utils.searchKeywordsToArray(keywords);
    let condition = !frontCondition ? "where" : frontCondition;

    let qry = "";
    let i = 0;

    for (let item of keywordsArr) {

        if (i === 0) {
            qry = ` ${condition} ${column} like '%${item}%' `
        }
        else {
            let temp = ` ${operator} ${column} like '%${item}%' `

            qry += temp;
        }
        i++;
    }

    return qry;
}

utils.commaMoney = (num) => {

    return numeral(num).format('0,0');
}

utils.isHereSpecialCharacter = (str) => {

    let reg = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi

    return reg.test(str);
}

utils.chkSpecialCharacter = (str) => {

    let reg = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi

    //특수문자 검증
    if (reg.test(str)) {
        //특수문자 제거후 리턴
        return str.replace(reg, "");
    } else {
        //특수문자가 없으므로 본래 문자 리턴
        return str;
    }
}

utils.isMaxLength = function (max, str) {

    console.log(str)
    // console.log(str, str.length);

    if (!str) {
        return true;
    }

    // 공백일 경우
    if (String(str).trim().length < 1) {
        return true
    }

    return str.length > max;
}


utils.areMaxLength = function (max, ...items) {

    let res = false

    for (let i = 0; i < items.length; i++) {
        if (this.isMaxLength(max, items[i])) {
            res = true
            break
        }
    }

    return res
}

utils.areMaxLengthArr = function (max, arr) {

    let res = false

    if (!Array.isArray(arr)) {
        return false
    }

    for (let i = 0; i < arr.length; i++) {

        if (this.isMaxLength(max, arr[i])) {
            res = true
            break
        }
    }

    return res
}



module.exports = utils