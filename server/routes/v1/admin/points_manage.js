const express = require('express')
const router = express.Router()
const util = require('util')
const pointSv = require("../../../services/pointService")
const notifySv = require("../../../services/notifyService")


/* 포인트 내역*/
// 포인트 충전 내역 조회 및 검색
router.get("/charge/list", async (req, res) => {

    let limit = req.query.limit;
    let offset = req.query.offset;
    let keyword = req.query.keyword;

    if (!_util.hasKey(req.query, "keyword")) {
        // console.log("not keyword")
        return res.json(jresp.invalidData());
    }

    if (!_util.areBeyondZero(limit, offset)) {
        return res.json(jresp.invalidData());
    }

    let result = await pointSv.searchChargingPointHistory(limit, offset, keyword);

    return res.json(result);
});

// 포인트 충전 내역 조회 및 검색
router.get("/charge/read", async (req, res) => {

    let id = req.query.id;

    if (!_util.isBeyondZero(id)) {
        return res.json(jresp.invalidData());
    }

    let result = await pointSv.readChargingPointDetail(id);

    return res.json(result);
});


/* 후원 내역 */
/// 후원을 많이 한 회원
router.get("/sponsor/ing/lots/user", async (req, res) => {

    let limit = req.query.limit;

    if (!_util.isBeyondZero(limit)) {
        return res.json(jresp.invalidData());
    }

    let result = await pointSv.getLotsOfSponsoringUser(limit);

    return res.json(result);
});

/// 후원을 많이 받은 회원
router.get("/sponsor/ed/lots/user", async (req, res) => {

    let limit = req.query.limit;

    if (!_util.isBeyondZero(limit)) {
        return res.json(jresp.invalidData());
    }

    let result = await pointSv.getLotsOfSponsoredUser(limit);

    return res.json(result);
});

/// 후원한 내역 조회 및 검색.
router.get("/sponsor/list", async (req, res) => {

    let limit = req.query.limit;
    let offset = req.query.offset;
    let type = req.query.type; /// -1 : 전체, 0: 크레이터, 1: 영상
    let keyword = req.query.keyword;

    if (!_util.hasKey(req.query, "keyword")) {
        // console.log("not keyword")
        return res.json(jresp.invalidData());
    }

    if (!_util.areBeyondZero(limit, offset)) {
        return res.json(jresp.invalidData());
    }

    let result = await pointSv.searchSponsorHistory(type, limit, offset, keyword);

    return res.json(result);
});

/// 영상 후원 내역 조회
router.get("/sponsor/video/read", async (req, res) => {

    let id = req.query.id

    if (!_util.isBeyondZero(id)) {
        return res.json(jresp.invalidData());
    }

    let result = await pointSv.readVideoSponsorHistoryDetail(id);

    return res.json(result);
});

router.get("/sponsor/creator/read", async (req, res) => {

    let id = req.query.id

    if (!_util.isBeyondZero(id)) {
        return res.json(jresp.invalidData());
    }

    let result = await pointSv.readCreatorSponsorHistoryDetail(id);

    return res.json(result);
});



/* 정산 내역 */
/// 정산 신청 내역 (메인)
router.get("/adjustment/apply/list", async (req, res) => {

    let limit = req.query.limit;
    let offset = req.query.offset;

    if (!_util.areBeyondZero(limit, offset)) {
        return res.json(jresp.invalidData());
    }

    let result = await pointSv.getAdjustmentAppliedHistory(limit, offset);

    return res.json(result);
});



///  정산 내역 전체 조회
router.get("/adjustment/all/list", async (req, res) => {

    let status = req.query.status
    let limit = req.query.limit;
    let offset = req.query.offset;
    let keyword = req.query.keyword;

    // console.log(keyword)

    if (!_util.hasKey(req.query, "keyword")) {
        // console.log("not keyword")
        return res.json(jresp.invalidData());
    }

    if (!_util.areBeyondZero(limit, offset)) {
        return res.json(jresp.invalidData());
    }

    if (!_util.isNum(status)) {
        // console.log("not num");
        return res.json(jresp.invalidData());
    }

    if (status < -1 || status > 1) {
        // console.log("dd");
        return res.json(jresp.invalidData());
    }

    let result = await pointSv.searchAdjustmentAllHistory(status, limit, offset, keyword);

    return res.json(result);
});


/// 하나의 정산 상세 내역 조회
router.get("/adjustment/read", async (req, res) => {

    let id = req.query.id

    if (!_util.areBeyondZero(id)) {
        return res.json(jresp.invalidData());
    }

    let result = await pointSv.readAdjustmentHistoryDetail(id);

    return res.json(result);
});

/// 정산 완료
router.post("/adjustment/complete", async (req, res) => {

    let id = req.body.id
    let uid = req.body.user_id
    let type = req.body.point_type

    if (!_util.isBeyondZero(id)) {
        return res.json(jresp.invalidData());
    }

    if (Number(type) < 0 || Number(type) > 1) {
        return res.json(jresp.invalidData());
    }

    let result = await pointSv.completeAppliedAdjustment(id, type);

    if (result["success"]) {
        await notifySv.notifyAdjustment(uid)
    }


    return res.json(result);
});

module.exports = router;