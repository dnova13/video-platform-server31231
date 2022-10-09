const express = require('express')
const router = express.Router()
const util = require('util')
const creatorSv = require("../../services/creatorService");
const pointSv = require("../../services/pointService");


router.get("/is-creator", async (req, res) => {

    let uid = req.uinfo["u"];
    let result = await creatorSv.isCreator(uid);

    return res.json(result);
})

router.get("/uploaded/list", async (req, res) => {

    let uid = req.uinfo["u"];
    let limit = req.query.limit;
    let offset = req.query.offset;

    if (!_util.areBeyondZero(limit, offset)) {
        return res.json(jresp.invalidData());
    }

    let result = await creatorSv.getUploadedListByUserId(uid, limit, offset);

    return res.json(result);
});


router.get("/sponsored/all", async (req, res) => {

    let uid = req.uinfo["u"];
    let limit = req.query.limit;
    let offset = req.query.offset;

    if (!_util.areBeyondZero(limit, offset)) {
        return res.json(jresp.invalidData());
    }

    let result = await pointSv.getSponsoredAllHistoryByReceiver(uid, limit, offset);

    return res.json(result);

});

router.get("/sponsored/video", async (req, res) => {

    let uid = req.uinfo["u"];
    let limit = req.query.limit;
    let offset = req.query.offset;

    if (!_util.areBeyondZero(limit, offset)) {
        return res.json(jresp.invalidData());
    }

    let result = await pointSv.getSponsoredVideoHistoryByReceiver(uid, limit, offset);

    return res.json(result);
});


module.exports = router;