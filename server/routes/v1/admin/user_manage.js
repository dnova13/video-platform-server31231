const express = require('express')
const router = express.Router()
const util = require('util')
const userMngSv = require("../../../services/userManageService");
const creatorSv = require("../../../services/creatorService");
const pointSv = require("../../../services/pointService");
const notifySv = require("../../../services/notifyService");


router.get("/member/list", async (req, res) => {

    let limit = req.query.limit;
    let offset = req.query.offset;
    let keyword = req.query.keyword;
    let isCreator = req.query.is_creator;

    let suspendChk = -1; // -1 : 전체, 0: 정지 안된 놈, 1: 정지 된 놈.

    if (!_util.hasKey(req.query, "keyword")) {
        console.log("not keyword")
        return res.json(jresp.invalidData());
    }

    if (!_util.areBeyondZero(limit, offset)) {
        return res.json(jresp.invalidData());
    }

    if (!_util.isNum(isCreator)) {
        console.log("not num");
        return res.json(jresp.invalidData());
    }

    if (isCreator < -1 || isCreator > 1) {
        console.log("dd");
        return res.json(jresp.invalidData());
    }

    let result = await userMngSv.searchMemberList(isCreator, suspendChk, limit, offset, keyword);
    return res.json(result);
});

/* 회원 정보 */
router.get("/member/detail/user", async (req, res) => {

    let uid = req.query.user_id;

    if (!_util.isBeyondZero(uid)) {
        console.log("not num");
        return res.json(jresp.invalidData());
    }

    let result = await userMngSv.getUserInfoMoreByUserId(uid);

    return res.json(result);
});


/* 크레이터 정보 */
router.get("/member/detail/creator-apply", async (req, res) => {

    let uid = req.query.user_id;

    if (!_util.isBeyondZero(uid)) {
        console.log("not num");
        return res.json(jresp.invalidData());
    }

    let result = await userMngSv.getCreatorAppliedInfoByUserId(uid);

    return res.json(result);
});


/* 포인트 */
// 포인트 량 조회
router.get("/member/detail/point/quantity", async (req, res) => {

    let uid = req.query.user_id;

    if (!_util.isBeyondZero(uid)) {
        console.log("not num");
        return res.json(jresp.invalidData());
    }

    let item = await pointSv.getTotalPointsByUserId(uid);

    if (!item) {
        return res.json(jresp.sqlError())
    }

    let totalSponsor = await pointSv.getTotalSponsorPointsByUserId(uid);
    let totalAdjustment = await pointSv.getTotalCompleteAdjustmentByUserId(uid);

    if (totalAdjustment < 0 || totalSponsor < 0) {
        return res.json(jresp.sqlError())
    }

    let data = {
        total_points: item.total_points,
        total_using: totalSponsor + totalAdjustment
    }

    return res.json(jresp.successData(data))
});

/// 포인트 내역 조회
router.get("/member/detail/point/list", async (req, res) => {

    let limit = req.query.limit;
    let offset = req.query.offset;
    let uid = req.query.user_id;
    let type = req.query.type;

    if (!_util.areBeyondZero(limit, offset, uid)) {
        return res.json(jresp.invalidData());
    }

    let result = await pointSv.getMoreDetailPointHistoryByUserId(uid, type, limit, offset);

    return res.json(result);
});


/* 후원한 포인트 조회 */
// 후원 포인트 량 조회
router.get("/member/detail/sponsoring/point", async (req, res) => {

    let uid = req.query.user_id;

    if (!_util.isBeyondZero(uid)) {
        console.log("not num");
        return res.json(jresp.invalidData());
    }

    let result = await pointSv.getTotalEachSponsoringPointsByUserId(uid)

    return res.json(result);
});

/// 후원한 내역 리스트 조회
router.get("/member/detail/sponsoring/list", async (req, res) => {

    let limit = req.query.limit;
    let offset = req.query.offset;
    let uid = req.query.user_id;

    if (!_util.areBeyondZero(limit, offset, uid)) {
        return res.json(jresp.invalidData());
    }

    let result = await pointSv.getMoreDetailSponsoringHistoryByUserId(uid, limit, offset);

    return res.json(result);

});

/* 후원 받음 포인트 조회 */ // 크리에이터 용.
// 후원 받은 포인트 량 조회 // 
router.get("/member/detail/sponsored/point", async (req, res) => {

    let uid = req.query.user_id;

    if (!_util.isBeyondZero(uid)) {
        console.log("not num");
        return res.json(jresp.invalidData());
    }

    let result = await pointSv.getTotalEachSponsoredPointsByUserId(uid)

    return res.json(result);
});

/// 후원받은 내역 리스트 조회
router.get("/member/detail/sponsored/list", async (req, res) => {

    let limit = req.query.limit;
    let offset = req.query.offset;
    let uid = req.query.user_id;

    if (!_util.areBeyondZero(limit, offset, uid)) {
        return res.json(jresp.invalidData());
    }

    let result = await pointSv.getMoreDetailSponsoredHistoryByUserId(uid, limit, offset);

    return res.json(result);
});


/* 업로드한 영상 조회 */
router.get("/member/detail/upload/list", async (req, res) => {

    let limit = req.query.limit;
    let offset = req.query.offset;
    let uid = req.query.user_id;

    if (!_util.areBeyondZero(limit, offset, uid)) {
        return res.json(jresp.invalidData());
    }

    let result = await userMngSv.getUploadedVideosByUserId(uid, limit, offset);

    return res.json(result);
})

/* 작성 댓글 조회 */
router.get("/member/detail/reply/list", async (req, res) => {

    let limit = req.query.limit;
    let offset = req.query.offset;
    let uid = req.query.user_id;

    if (!_util.areBeyondZero(limit, offset, uid)) {
        return res.json(jresp.invalidData());
    }

    let result = await userMngSv.getReplyListByUserId(uid, limit, offset);

    return res.json(result);
})


/* 정지 회원 관리 */
router.get("/suspend/list", async (req, res) => {

    let limit = req.query.limit;
    let offset = req.query.offset;
    let keyword = req.query.keyword;
    let isCreator = req.query.is_creator;

    let suspendChk = 1; // -1 : 전체, 0: 정지 안된 놈, 1: 정지 된 놈.

    if (!_util.hasKey(req.query, "keyword")) {
        console.log("not keyword")
        return res.json(jresp.invalidData());
    }

    if (!_util.areBeyondZero(limit, offset)) {
        return res.json(jresp.invalidData());
    }

    if (!_util.isNum(isCreator)) {
        console.log("not num");
        return res.json(jresp.invalidData());
    }

    if (isCreator < -1 || isCreator > 1) {
        console.log("dd");
        return res.json(jresp.invalidData());
    }

    let result = await userMngSv.searchMemberList(isCreator, suspendChk, limit, offset, keyword);
    return res.json(result);
});

router.post("/:type/suspend/member", async (req, res) => {

    let uid = req.body.user_id;
    let chk = req.params.type
    let result;

    if (!_util.isBeyondZero(uid)) {
        return res.json(jresp.invalidData());
    }

    if (chk === "chk") {
        result = await userMngSv.chkSuspendedMember(uid);

    }
    else if (chk === "unchk") {
        result = await userMngSv.unchkSuspendedMember(uid);
    }
    else {
        console.log("fdsdfsddfssd");
        return res.json(jresp.invalidData());
    }

    return res.json(result);
});


/* 탈퇴 사유 */
/// 탈퇴 사유 카테 고리별 건수
router.get("/retire/count", async (req, res) => {

    return res.json(await userMngSv.getRetireReasonCount());
});

// 탈퇴 사유 리스트
router.get("/retire/list", async (req, res) => {

    let limit = req.query.limit;
    let offset = req.query.offset;
    let category = req.query.category ? req.query.category : 0;

    if (!_util.areBeyondZero(limit, offset)) {
        return res.json(jresp.invalidData());
    }

    if (!_util.isNum(category)) {
        console.log("not num");
        return res.json(jresp.invalidData());
    }

    if (category < 0 || category > 8) {
        console.log("dd");
        return res.json(jresp.invalidData());
    }

    let result = await userMngSv.getRetireList(category, limit, offset);

    return res.json(result);
});


/* 크리에이터 관리 */
router.get("/creator/apply/list", async (req, res) => {

    // let uid = req.uinfo["u"]
    let status = req.query.status;
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

    if (!_util.isNum(status)) {
        console.log("not num");
        return res.json(jresp.invalidData());
    }

    if (status < -1 || status > 2) {
        console.log("dd");
        return res.json(jresp.invalidData());
    }

    let result = await creatorSv.searchAppliedInfoList(status, limit, offset, keyword);

    return res.json(result);
});

router.get("/creator/apply/detail", async (req, res) => {

    let id = req.query.id;

    if (!_util.isBeyondZero(id)) {
        return res.json(jresp.invalidData());
    }

    let result = await creatorSv.getAppliedInfoByApplyId(id);

    return res.json(result);
});


router.post("/creator/apply/:auth", async (req, res) => {

    let id = req.body.id;
    let auth = req.params.auth
    let result;

    if (!_util.areBeyondZero(id)) {
        return res.json(jresp.invalidData());
    }

    if (auth === "approve") {
        result = await creatorSv.doAuthCreator(id);

        if (result["success"]) {
            await notifySv.notifyAuthCreator(id)
        }
    }
    else if (auth === "reject") {
        result = await creatorSv.rejectAuthCreator(id);
    }
    else if (auth === "pending") {
        result = await creatorSv.pendingAuthCreator(id);
    }
    else
        return res.json(jresp.invalidData());

    return res.json(result);
});


module.exports = router;