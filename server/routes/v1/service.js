const express = require('express')
const router = express.Router()
const util = require('util')
const otherPostSv = require("../../services/otherPostSevice");

router.post("/suggest", async (req, res) => {

    let body = req.body;
    body.user_id = req.uinfo["u"];

    if (!_util.hasKeys(body, "title", "content")) {
        return res.json(jresp.invalidData());
    }

    if (_util.isBlanks(body.title, body.content)) {
        return res.send(jresp.invalidData());
    }

    let result = await otherPostSv.writePost("suggest", body);

    return res.json(result);
});

router.get("/notice/list", async (req, res) => {

    let limit = req.query.limit;
    let offset = req.query.offset;

    if (!_util.areBeyondZero(limit, offset)) {
        return res.json(jresp.invalidData());
    }

    let result = await otherPostSv.getNoticePostList(limit, offset - 1);
    return res.json(result);
});

router.get("/intro/list", async (req, res) => {

    let limit = req.query.limit;
    let offset = req.query.offset;
    let keyword = "";

    if (!_util.areBeyondZero(limit, offset)) {
        return res.json(jresp.invalidData());
    }

    let result = await otherPostSv.searchIntroPostList(limit, offset, keyword);

    return res.json(result);
});

module.exports = router;