const express = require('express')
const router = express.Router()
const util = require('util')
const userMngSv = require("../../services/userManageService")
const notifySv = require("../../services/notifyService")

router.get("/get/profile", async (req, res) => {

    let uid = req.uinfo["u"]
    let result = await userMngSv.getUserProfile(uid);

    return res.json(result);
});

router.get("/show/setting", async (req, res) => {

    let uid = req.uinfo["u"]
    let result = await userMngSv.getSettingInfo(uid);

    return res.json(result);
});

router.post("/set/push", async (req, res) => {

    let uid = req.uinfo["u"]
    let result = await userMngSv.setPush(uid);

    return res.json(result);
});

router.post("/update/fcmtoken", async (req, res) => {

    let uid = req.uinfo["u"];
    let token = req.body.token;

    if (_util.isBlank(token)) {
        return res.json(jresp.invalidData());
    }

    let result = await userMngSv.updateFcmToken(uid, token);

    return res.json(result);
});

router.get("/get/info", async (req, res) => {

    let uid = req.uinfo["u"]
    let result = await userMngSv.getUserInfo(uid);

    return res.json(result);
});

router.post("/edit/info", async (req, res) => {

    let body = req.body;
    body.user_id = req.uinfo["u"];

    if (!_util.isBeyondZero(body.user_id)) {
        return res.json(jresp.invalidData());
    }

    let result = await userMngSv.modifyUserInfo(body);

    return res.json(result);
});

router.get("/get/myinfo", async (req, res) => {

    let uid = req.uinfo["u"]
    let result = await userMngSv.getMyInfoByUserId(uid);

    return res.json(result);
});

router.post("/edit/myinfo", async (req, res) => {

    let body = req.body;
    body.user_id = req.uinfo["u"];

    let result = await userMngSv.modifyMyInfo(body);

    return res.json(result);
});

router.post("/retire", async (req, res) => {

    let uid = req.uinfo["u"];
    let reason = req.body.reason;
    let content = req.body.content ? req.body.content : "";
    let category = req.body.category_id;

    if (_util.isBlank(reason)) {
        return res.json(jresp.invalidData());
    }

    if (!_util.isBeyondZero(category)) {
        return res.json(jresp.invalidData());
    }

    let result = await userMngSv.retireMember(uid, reason, content, category);

    return res.json(result);
});


module.exports = router;