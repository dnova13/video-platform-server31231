const express = require('express')
const router = express.Router()
const util = require('util')
const reportSv = require("../../../services/reportService");


router.get("/list/simple", async (req, res) => {

    let limit = req.query.limit;
    let offset = req.query.offset;

    if (!_util.areBeyondZero(limit, offset)) {
        console.log("not zero");
        return res.json(jresp.invalidData());
    }

    let result = await reportSv.getReportSimpleList(limit, offset);
    return res.json(result);
});

router.get("/list/video", async (req, res) => {

    let limit = req.query.limit;
    let offset = req.query.offset;
    let keyword = req.query.keyword;
    let categoryId = req.query.category_id;

    if (!_util.hasKey(req.query, "keyword")) {
        console.log("not keyword")
        return res.json(jresp.invalidData());
    }

    if (!_util.areBeyondZero(limit, offset)) {
        return res.json(jresp.invalidData());
    }

    if (!_util.isNum(categoryId)) {
        console.log("not num");
        return res.json(jresp.invalidData());
    }

    if (categoryId < 0 || categoryId > 5) {
        console.log("dd");
        return res.json(jresp.invalidData());
    }

    let result = await reportSv.searchReportVideoHistory(categoryId, limit, offset, keyword);
    return res.json(result);
});


router.get("/list/reply", async (req, res) => {

    let limit = req.query.limit;
    let offset = req.query.offset;
    let keyword = req.query.keyword;
    let categoryId = req.query.category_id;

    console.log(categoryId);

    if (!_util.hasKey(req.query, "keyword")) {
        console.log("not keyword")
        return res.json(jresp.invalidData());
    }

    if (!_util.areBeyondZero(limit, offset)) {
        return res.json(jresp.invalidData());
    }

    if (!_util.isNum(categoryId)) {
        console.log("not num");
        return res.json(jresp.invalidData());
    }

    if (categoryId < 0 || categoryId > 5) {
        return res.json(jresp.invalidData());
    }

    let result = await reportSv.searchReportReplyHistory(categoryId, limit, offset, keyword);
    return res.json(result);
});

router.post("/:type/blind/video", async (req, res) => {

    let id = req.body.id;
    let chk = req.params.type
    let where = req.body.where;

    if (!_util.areBeyondZero(id)) {
        return res.json(jresp.invalidData());
    }

    if (chk === "chk") {
        chk = true
    }
    else if (chk === "unchk") {
        chk = false
    }
    else {
        return res.json(jresp.invalidData());
    }

    let result = await reportSv.updateVideoBlindChkFromReport(id, chk, where);
    return res.json(result);
});

router.post("/:type/blind/reply", async (req, res) => {

    let id = req.body.id;
    let chk = req.params.type
    let where = req.body.where;

    if (!_util.areBeyondZero(id)) {
        return res.json(jresp.invalidData());
    }

    if (chk === "chk") {
        chk = true
    }
    else if (chk === "unchk") {
        chk = false
    }
    else {
        return res.json(jresp.invalidData());
    }

    let result = await reportSv.updateReplyBlindChkFromReport(id, chk, where);
    return res.json(result);
});


router.get("/read", async (req, res) => {

    let id = req.query.id;
    let type = req.query.type;
    let result;

    if (!_util.areBeyondZero(id)) {
        return res.json(jresp.invalidData());
    }

    switch (type) {

        case "video":
            result = await reportSv.readReportVideoDetail(id);
            break;
        case "reply":
            result = await reportSv.readReportReplyDetail(id);
            break;

        default:
            return jresp.invalidData()
    }

    return res.json(result);
});


module.exports = router;