const express = require('express')
const router = express.Router()
const util = require('util')
const userActSv = require("../../services/userActivityService")

router.get("/replied/post", async (req, res) => {

    let uid = req.uinfo["u"]
    let limit = req.query.limit;
    let offset = req.query.offset;

    if (!_util.areBeyondZero(limit, offset)) {
        return res.json(jresp.invalidData());
    }

    let result = await userActSv.getRepliedVideoPostByUserId(uid, limit, offset);

    return res.json(result);
});

router.get("/recommend/post", async (req, res) => {

    let uid = req.uinfo["u"]
    let limit = req.query.limit;
    let offset = req.query.offset;

    if (!_util.areBeyondZero(limit, offset)) {
        return res.json(jresp.invalidData());
    }

    let result = await userActSv.getRecommendVideoPostByUserId(uid, limit, offset);

    return res.json(result);
});

router.get("/scored/post", async (req, res) => {

    let uid = req.uinfo["u"]
    let limit = req.query.limit;
    let offset = req.query.offset;

    if (!_util.areBeyondZero(limit, offset)) {
        return res.json(jresp.invalidData());
    }

    let result = await userActSv.getScoredVideoPostByUserId(uid, limit, offset);

    return res.json(result);
});

router.get("/recent/post", async (req, res) => {

    let uid = req.uinfo["u"]
    let limit = req.query.limit;
    let offset = req.query.offset;

    if (!_util.areBeyondZero(limit, offset)) {
        // console.log("not zero");
        return res.json(jresp.invalidData());
    }

    let result = await userActSv.getRecentPostByUserId(uid, limit, offset);

    return res.json(result);
});


module.exports = router;