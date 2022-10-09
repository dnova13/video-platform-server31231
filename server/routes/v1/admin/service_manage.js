const express = require('express')
const router = express.Router()
const util = require('util')
const otherPostSv = require("../../../services/otherPostSevice");


router.post("/notice/write", async (req, res) => {

    let body = req.body;
    let type = "notice"
    body.user_id = req.uinfo["u"];

    if (_util.isBlanks(body.title, body.content)) {
        console.log("not str")
        return res.json(jresp.invalidData());
    }

    let result = await otherPostSv.writePost(type, body)

    return res.json(result);
});


router.post("/notice/modify", async (req, res) => {

    let body = req.body;
    let type = "notice"
    body.user_id = req.uinfo["u"];

    if (!_util.isBeyondZero(body.id)) {
        return res.json(jresp.invalidData());
    }

    let result = await otherPostSv.modifyPost(type, body)

    return res.json(result);
});

router.post("/notice/delete", async (req, res) => {

    let id = req.body.id;
    let type = "notice"

    if (!_util.isBeyondZero(id)) {
        return res.json(jresp.invalidData());
    }

    let result = await otherPostSv.deletePost(type, id)

    return res.json(result);
});

router.get("/notice/list", async (req, res) => {

    let limit = req.query.limit;
    let offset = req.query.offset;
    let keyword = req.query.keyword;

    if (!_util.hasKey(req.query, "keyword")) {
        console.log("not keyword")
        return res.json(jresp.invalidData());
    }

    if (!_util.areBeyondZero(limit, offset)) {
        return res.json(jresp.invalidData());
    }

    let result = await otherPostSv.searchNoticePostList(limit, offset, keyword);

    return res.json(result);
});

router.get("/notice/read", async (req, res) => {

    let id = req.query.id;
    let type = "notice"

    if (!_util.isBeyondZero(id)) {
        return res.json(jresp.invalidData());
    }

    let result = await otherPostSv.readPostDetail(type, id)

    return res.json(result);
});


router.get("/suggest/list", async (req, res) => {

    let limit = req.query.limit;
    let offset = req.query.offset;
    let keyword = req.query.keyword;

    if (!_util.hasKey(req.query, "keyword")) {
        console.log("not keyword")
        return res.json(jresp.invalidData());
    }

    if (!_util.areBeyondZero(limit, offset)) {
        return res.json(jresp.invalidData());
    }

    let result = await otherPostSv.searchSuggestPostList(limit, offset, keyword);

    return res.json(result);
});

router.get("/suggest/read", async (req, res) => {

    let id = req.query.id;
    let type = "suggest"

    if (!_util.isBeyondZero(id)) {
        return res.json(jresp.invalidData());
    }

    let result = await otherPostSv.readPostDetail(type, id)

    return res.json(result);
});


router.post("/intro/write", async (req, res) => {

    let body = req.body;
    let type = "intro"

    body.user_id = req.uinfo["u"];
    body.content = null;

    if (_util.isBlanks(body.title)) {
        console.log("not str")
        return res.json(jresp.invalidData());
    }

    if (!_util.isBeyondZero(body.file_id)) {
        console.log("under zero")
        return res.json(jresp.invalidData());
    }

    let result = await otherPostSv.writePost(type, body)

    return res.json(result);
});


router.post("/intro/modify", async (req, res) => {

    let body = req.body;
    let type = "intro"

    body.user_id = req.uinfo["u"];

    if (!_util.isBeyondZero(body.id)) {
        return res.json(jresp.invalidData());
    }

    let result = await otherPostSv.modifyPost(type, body)

    return res.json(result);
});

router.post("/intro/delete", async (req, res) => {

    let id = req.body.id;
    let type = "intro"

    if (!_util.isBeyondZero(id)) {
        return res.json(jresp.invalidData());
    }

    let result = await otherPostSv.deletePost(type, id)

    return res.json(result);
});

router.get("/intro/list", async (req, res) => {

    let limit = req.query.limit;
    let offset = req.query.offset;
    let keyword = req.query.keyword;

    if (!_util.hasKey(req.query, "keyword")) {
        console.log("not keyword")
        return res.json(jresp.invalidData());
    }

    if (!_util.areBeyondZero(limit, offset)) {
        return res.json(jresp.invalidData());
    }

    let result = await otherPostSv.searchIntroPostList(limit, offset, keyword);

    return res.json(result);
});

router.get("/intro/read", async (req, res) => {

    let id = req.query.id;
    let type = "intro"

    if (!_util.isBeyondZero(id)) {
        return res.json(jresp.invalidData());
    }

    let result = await otherPostSv.readPostDetail(type, id)

    return res.json(result);
});



module.exports = router;