const express = require('express')
const router = express.Router()
const util = require('util')
const reportSv = require("../../services/reportService")

router.post("/post", async (req, res) => {

    let body = req.body;
    body.target = "video"

    if (!_util.hasKeys(body, "target_id", "reason", "content", "category_id")) {
        console.log("not key");
        return res.json(jresp.invalidData());
    }

    if (!_util.isBeyondZero(body.target_id, body.category_id)) {
        console.log("not num");
        return res.send(jresp.invalidData());
    }

    if (_util.isBlanks(body.reason, body.content)) {
        console.log("blank");
        return res.send(jresp.invalidData());
    }

    body.user_id = req.uinfo["u"];

    let chk = await reportSv.chkDuplicateReport("video", body.target_id, body.user_id);

    if (chk < 0) {
        return res.json(jresp.sqlError())
    }

    else if (chk > 0) {
        return res.json(jresp.duplicateData())
    }

    let result = await reportSv.insertReport(body);
    return res.json(result);
});


router.post("/reply", async (req, res) => {

    let body = req.body;
    body.target = "reply"

    if (!_util.hasKeys(body, "target_id", "reason", "content", "category_id")) {
        console.log("not key");
        return res.json(jresp.invalidData());
    }

    if (!_util.isBeyondZero(body.target_id, body.category_id)) {
        console.log("not num");
        return res.send(jresp.invalidData());
    }

    if (_util.isBlanks(body.reason, body.content)) {
        console.log("blank");
        return res.send(jresp.invalidData());
    }

    body.user_id = req.uinfo["u"];

    let chk = await reportSv.chkDuplicateReport("reply", body.target_id, body.user_id);

    if (chk < 0) {
        return res.json(jresp.sqlError())
    }

    else if (chk > 0) {
        return res.json(jresp.duplicateData())
    }

    let result = await reportSv.insertReport(body);
    return res.json(result);
});


router.get("/category", async (req, res) => {

    let result = await reportSv.getReportCategory();
    return res.json(result);
});


module.exports = router;