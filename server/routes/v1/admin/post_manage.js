const express = require('express')
const router = express.Router()
const util = require('util')
const videoSv = require('../../../services/videoService')
const videoReplySv = require('../../../services/videoReplyService')


router.get("/list", async (req, res) => {

    let keyword = req.query.keyword;
    let limit = req.query.limit;
    let offset = req.query.offset;

    if (!_util.hasKey(req.query, "keyword")) {
        // console.log("not keyword")
        return res.json(jresp.invalidData());
    }

    if (!_util.areBeyondZero(limit, offset)) {
        // console.log("under zero")
        return res.json(jresp.invalidData());
    }

    let result = await videoSv.searchVideoListForAdmin(1, limit, offset, keyword);
    return res.json(result);
});


router.get("/list/no-blind", async (req, res) => {

    let keyword = req.query.keyword;
    let limit = req.query.limit;
    let offset = req.query.offset;

    if (!_util.hasKey(req.query, "keyword")) {
        // console.log("not keyword")
        return res.json(jresp.invalidData());
    }

    if (!_util.areBeyondZero(limit, offset)) {
        // console.log("under zero")
        return res.json(jresp.invalidData());
    }

    let result = await videoSv.searchVideoListForAdmin(1, limit, offset, keyword, 0);
    return res.json(result);
});

router.get("/list/blind", async (req, res) => {

    let keyword = req.query.keyword;
    let limit = req.query.limit;
    let offset = req.query.offset;

    if (!_util.hasKey(req.query, "keyword")) {
        // console.log("not keyword")
        return res.json(jresp.invalidData());
    }

    if (!_util.areBeyondZero(limit, offset)) {
        // console.log("under zero")
        return res.json(jresp.invalidData());
    }

    let result = await videoSv.searchVideoListForAdmin(1, limit, offset, keyword, 1);
    return res.json(result);
});

router.get("/read", async (req, res) => {

    let id = req.query.id;

    if (!_util.isBeyondZero(id)) {
        // console.log("under zero")
        return res.json(jresp.invalidData());
    }


    let result = await videoSv.readVideoDetail(id);
    return res.json(result);
});

router.get("/reply/list/all", async (req, res) => {

    let limit = req.query.limit;
    let offset = req.query.offset;
    let postId = req.query.id;

    if (!_util.areBeyondZero(limit, offset, postId)) {
        return res.json(jresp.invalidData());
    }

    let result = await videoReplySv.getReplyAllListByPostId(limit, offset, postId);

    return res.json(result);
});

router.post("/:type/blind/video", async (req, res) => {

    let id = req.body.id;
    let chk = req.params.type
    let result;

    if (!_util.isBeyondZero(id)) {
        return res.json(jresp.invalidData());
    }

    if (chk === "chk") {
        result = await videoSv.chkVideoBlind(id);

    }
    else if (chk === "unchk") {
        result = await videoSv.unchkVideoBlind(id);
    }
    else {
        return res.json(jresp.invalidData());
    }

    return res.json(result);
});


router.post("/:type/blind/reply", async (req, res) => {

    let id = req.body.id;
    let chk = req.params.type
    let result;

    if (!_util.isBeyondZero(id)) {
        return res.json(jresp.invalidData());
    }

    if (chk === "chk") {
        result = await videoReplySv.chkVideoReplyBlind(id);

    }
    else if (chk === "unchk") {
        result = await videoReplySv.unchkVideoReplyBlind(id);
    }
    else {
        return res.json(jresp.invalidData());
    }

    return res.json(result);
});



module.exports = router;

