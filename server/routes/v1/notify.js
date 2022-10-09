const express = require('express')
const router = express.Router()
const util = require('util')
const notifySv = require("../../services/notifyService")

router.get("/list", async (req, res) => {

    let uid = req.uinfo["u"]
    let limit = req.query.limit;
    let offset = req.query.offset;
    let isReading = req.query.is_reading;

    if (!_util.areBeyondZero(limit, offset)) {
        return res.json(jresp.invalidData());
    }

    if (!_util.isNum(isReading)) {
        return res.json(jresp.invalidData());
    }

    if (isReading < -1 || isReading > 1) {
        return res.json(jresp.invalidData());
    }

    let result = await notifySv.getNotifyListByUserId(uid, limit, offset, isReading);

    return res.json(result);
});


router.get("/total", async (req, res) => {

    let uid = req.uinfo["u"]
    let isReading = req.query.is_reading;

    if (!_util.isNum(isReading)) {
        console.log("not num");
        return res.json(jresp.invalidData());
    }

    if (isReading < -1 || isReading > 1) {
        return res.json(jresp.invalidData());
    }

    let result = await notifySv.getTotalNotifyByUserId(uid, isReading);

    if (result < 0) {
        return res.json(jresp.sqlError());
    }

    return res.json(jresp.successData({ total: result }));
});


router.post("/delete", async (req, res) => {

    let uid = req.uinfo["u"]
    let _id = req.body.id;

    if (!_util.areBeyondZero(_id)) {
        return res.json(jresp.invalidData());
    }

    let result = await notifySv.delete(_id, uid);

    return res.json(result);
});

router.post("/read", async (req, res) => {

    let uid = req.uinfo["u"]
    let _id = req.body.id;

    if (!_util.areBeyondZero(_id)) {
        return res.json(jresp.invalidData());
    }

    let result = await notifySv.readNotify(_id, uid);

    return res.json(result);
});



module.exports = router;