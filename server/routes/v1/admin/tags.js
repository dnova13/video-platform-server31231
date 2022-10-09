const express = require('express')
const router = express.Router()
const util = require('util');
const tagSv = require("../../../services/tagsService")

router.post("/recommend/register", async (req, res) => {

    let body = req.body;
    let type = 1; // 추천 태그 등록은 1

    if (!_util.hasKeys(body, "tags", "del_tags")) {
        return res.json(jresp.invalidData());
    }

    if (!Array.isArray(body.tags) || body.tags.length < 1) {
        console.log("not array or empty")
        return res.json(jresp.invalidData());
    }

    if (!Array.isArray(body.del_tags)) {
        console.log("not array ")
        return res.json(jresp.invalidData());
    }

    if (_util.areMaxLengthArr(100, body.tags)) {
        console.log("over length")
        return res.json(jresp.beyondSomething());
    }

    if (body.del_tags.length > 0) {

        let delResult = await tagSv.deleteTags(body.del_tags, type);

        if (!delResult["success"]) {
            return res.json(delResult);
        }
    }

    let insResult = await tagSv.insertTags(body.tags, type);

    return res.json(insResult);
});

router.get("/recommend/list", async (req, res) => {

    let result = await tagSv.getRecommendTagList();
    return res.json(result);
});


router.post("/com/register", async (req, res) => {

    let body = req.body;
    let type = 2; // 검색 태그 등록은 2

    if (!_util.hasKeys(body, "tags", "del_tags")) {
        return res.json(jresp.invalidData());
    }

    if (!Array.isArray(body.tags) || body.tags.length < 1) {
        console.log("not array or empty")
        return res.json(jresp.invalidData());
    }

    if (!Array.isArray(body.del_tags)) {
        console.log("not array ")
        return res.json(jresp.invalidData());
    }

    if (_util.areMaxLengthArr(100, body.tags)) {
        console.log("over length")
        return res.json(jresp.beyondSomething());
    }

    if (body.del_tags.length > 0) {

        let delResult = await tagSv.deleteTags(body.del_tags, type);

        if (!delResult["success"]) {
            return res.json(delResult);
        }
    }

    let insResult = await tagSv.insertTags(body.tags, type);

    return res.json(insResult);
});


router.get("/owner/list", async (req, res) => {

    let result = await tagSv.getComSearchTagList();
    return res.json(result);
});

module.exports = router;