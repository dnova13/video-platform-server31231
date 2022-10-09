import _import from "../../commons/import";

const express = require('express')
const router = express.Router()
const util = require('util')
const pointSv = require("../../services/pointService")
const notifySv = require("../../services/notifyService");

// 최소 충전 금액
const minChargePoints = 1 * Math.pow(10, 3);

// 최대 충전 금액
const maxChargePoints = 1 * Math.pow(10, 6);

// 하루 최대 충전 가능 금액
const dailyChargeMaxPoints = 1 * Math.pow(10, 6);

// 최소 후원 금액
const minSponsorPoints = 1 * Math.pow(10, 3);

// 최대 우원 금액
const maxSponsorPoints = 1 * Math.pow(10, 6);

// 하루 최대 후원 가능 금액
const dailySponsorMaxPoints = 1 * Math.pow(10, 6);

// 최소 정산 가능 금액
const minAdjustmentPoints = 5 * Math.pow(10, 3);

router.post("/apply", async (req, res) => {

    let body = req.body;
    let uid = req.uinfo["u"];
    let msg = `possible between ${_util.commaMoney(minChargePoints)} and ${_util.commaMoney(maxChargePoints)}`;

    let chargeLimit = {
        min: minChargePoints,
        max: maxChargePoints
    }

    let result;

    if (!_util.hasKeys(body, "point_quantity")) {
        return res.json(jresp.invalidData());
    }

    if (!_util.isBeyondZero(body.point_quantity)) {
        return res.send(jresp.invalidData());
    }

    if (Number(body.point_quantity) < minChargePoints) {
        return res.send(jresp.invalidData(msg, chargeLimit));
    }

    if (Number(body.point_quantity) > maxChargePoints) {
        return res.send(jresp.invalidData(msg, chargeLimit));
    }

    let dailyCharged = await pointSv.getDailyChargePointsByUserId(uid);
    let possibleDailyCharge = dailyChargeMaxPoints - dailyCharged;


    if (Number(body.point_quantity) > possibleDailyCharge) {

        let data = {
            "daily_charge_limit": dailyChargeMaxPoints,
            "possible_charge": possibleDailyCharge
        }

        return res.send(jresp.beyondSomething("beyond daily charge", data))
    }

    body.user_id = uid;

    result = await pointSv.applyPoints(body);

    return res.json(result);
});

router.post("/charge", async (req, res) => {

    let body = req.body;
    let uid = req.uinfo["u"];
    let result;

    if (!_util.hasKeys(body, "merchant_uid", "imp_uid")) {
        return res.json(jresp.invalidData());
    }

    if (_util.isBlanks(body.merchant_uid, body.imp_uid)) {
        return res.send(jresp.invalidData());
    }

    let impUid = body.imp_uid;
    let orderNum = body.merchant_uid;

    /* pg 사 정보 조회 */
    let pgOrder = await _import.getPaymentData(impUid);

    if (!pgOrder.success) {

        /// pg 접속 실패 2003
        return res.json(jresp.failInquiryDataFromPG());
    }

    /* db 정보 조회 */
    let dbOrder = await pointSv.getPointInfoByOrderNum(orderNum);

    if (!dbOrder) {
        /// db 접속 실패 2004
        return res.json(jresp.failInquiryDataFromDB());
    }

    // console.log(dbOrder);

    ///  구매 가격 일치 할 경우
    if (Number(pgOrder.amount) === Number(dbOrder.payment_price)) {

        /* status (string): 결제상태.

        ready:미결제,
        paid:결제완료,
        cancelled:결제취소,
        failed:결제실패     */


        switch (pgOrder["status"]) {

            // 결제 완료.
            case "paid":

                // console.log("paid")

                let data = {
                    id: dbOrder.id,
                    pg_id: impUid,
                    user_id: dbOrder.user_id,
                    points: pgOrder["amount"],
                    card_name: pgOrder["card_name"],
                    card_number: pgOrder["card_number"]
                }

                // 결제 완료 업데이트 하기
                let result = await pointSv.successCharge(data);

                // 결제는 했지만 sql 에러로 상태값 변경 실패한거.
                if (!result["success"]) {
                    return res.json(jresp.failPayment());
                }

                return res.json(jresp.successData());

            // 가상 계좌 발급.
            /*case "ready":
                break;
 
             case "cancelled":
                 break;
 
             case "failed":
                 break;*/

            default:
                return res.json(jresp.invalidPaymentData());
        }
    }

    /// 구매 가격이 다를 경우
    else {

        switch (pgOrder["status"]) {

            // 결제 완료 : 로직이 실패햇는데 결제난 경우 금액 반화해야함.
            case "paid":

                let reason = "결제 데이터가 일치하지 않아 금액 반환";
                let chkSum = pgOrder["amount"];

                let data = {
                    "imp_uid": pgOrder["imp_uid"],
                    "merchant_uid": pgOrder["merchant_uid"],
                    "amount": pgOrder["amount"], // 가맹점 클라이언트로부터 받은 환불금액
                    "checksum": chkSum, // 환불 가능 금액
                    "reason": reason,
                }

                let result = await _import.refund(data)

                console.log(result, "refund")

                console.log(result["success"])

                if (!result["success"]) {
                    // "유효 하지 않은 데이터 금액 반환 실패");

                    return res.json(jresp.errorFromProcessingInvalidData())
                }

                // ("유효 하지 않은 데이터 금액 반환 성공");
                return res.json(jresp.successFromProcessingInvalidData());

            // 가상 계좌 발급.
            /*case "ready":
                break;

             case "cancelled":
                 break;

             case "failed":
                 break;*/

            default:
                console.log("fail ")
                return res.json(jresp.invalidPaymentData());

        }
    }
});


router.post("/charge/webhook", async (req, res) => {

    let body = req.body;

    if (!_util.hasKeys(body, "merchant_uid", "imp_uid")) {
        console.log("not key");
        return res.json(jresp.invalidData());
    }

    if (_util.isBlanks(body.merchant_uid, body.imp_uid)) {
        console.log("blank");
        return res.send(jresp.invalidData());
    }

    let impUid = body.imp_uid;
    let orderNum = body.merchant_uid;

    /* pg 사 정보 조회 */
    let pgOrder = await _import.getPaymentData(impUid);

    if (!pgOrder.success) {

        /// pg 접속 실패 2003
        return res.json(jresp.failInquiryDataFromPG());
    }

    /* db 정보 조회 */
    let dbOrder = await pointSv.getPointInfoByOrderNum(orderNum);

    if (!dbOrder) {
        /// db 접속 실패 2004
        return res.json(jresp.failInquiryDataFromDB());
    }


    ///  구매 가격 일치 할 경우
    if (Number(pgOrder.amount) === Number(dbOrder.payment_price)) {

        /* status (string): 결제상태.

        ready:미결제,
        paid:결제완료,
        cancelled:결제취소,
        failed:결제실패     */


        switch (pgOrder["status"]) {


            // 결제 완료.
            case "paid":

                console.log("paid")

                let data = {
                    id: dbOrder.id,
                    pg_id: impUid,
                    user_id: dbOrder.user_id,
                    points: pgOrder["amount"],
                    card_name: pgOrder["card_name"],
                    card_number: pgOrder["card_number"]
                }

                // 결제 완료 업데이트 하기
                let result = await pointSv.successCharge(data);

                if (!result["success"]) {
                    return res.json(jresp.failPayment());
                }

                result = await pointSv.chargePoints(data);

                // 결제는 했지만 sql 에러로 상태값 변경 실패한거.
                if (!result["success"]) {
                    return res.json(jresp.failPayment());
                }

                return res.json(jresp.successData());

            // 가상 계좌 발급.
            /*case "ready":
                break;

             case "cancelled":
                 break;

             case "failed":
                 break;*/

            default:
                return res.json(jresp.invalidPaymentData());
        }
    }

    /// 구매 가격이 다를 경우
    else {

        switch (pgOrder["status"]) {

            // 결제 완료 : 로직이 실패햇는데 결제난 경우 금액 반화해야함.
            case "paid":

                let reason = "결제 데이터가 일치하지 않아 금액 반환";
                let chkSum = pgOrder["amount"];

                let data = {
                    "imp_uid": pgOrder["imp_uid"],
                    "merchant_uid": pgOrder["merchant_uid"],
                    "amount": pgOrder["amount"], // 가맹점 클라이언트로부터 받은 환불금액
                    "checksum": chkSum, // 환불 가능 금액
                    "reason": reason,
                }

                let result = await _import.refund(data)

                if (!result["success"]) {
                    // "유효 하지 않은 데이터 금액 반환 실패");

                    return res.json(jresp.errorFromProcessingInvalidData)
                }

                // ("유효 하지 않은 데이터 금액 반환 성공");
                return res.json(jresp.successFromProcessingInvalidData);

            // 가상 계좌 발급.
            /*case "ready":
                break;

             case "cancelled":
                 break;

             case "failed":
                 break;*/

            default:
                console.log("fail ")
                return res.json(jresp.invalidPaymentData());

        }
    }
});

router.get("/had/total", async (req, res) => {

    let uid = req.uinfo["u"];
    let item = await pointSv.getTotalPointsByUserId(uid);

    if (!item) {
        return res.json(jresp.sqlError())
    }

    delete item.total_sponsored;

    return res.json(jresp.successData(item))
});

router.get("/sponsored/total", async (req, res) => {

    let uid = req.uinfo["u"];
    let item = await pointSv.getTotalPointsByUserId(uid);

    if (!item) {
        return res.json(jresp.sqlError())
    }

    delete item.total_points;

    return res.json(jresp.successData(item))
});

router.get("/all/total", async (req, res) => {

    let uid = req.uinfo["u"];
    let item = await pointSv.getTotalPointsByUserId(uid);

    if (!item) {
        return res.json(jresp.sqlError())
    }

    return res.json(jresp.successData(item))
});


router.post("/sponsor/video", async (req, res) => {

    let body = req.body;
    let uid = req.uinfo["u"];
    let msg = `possible between ${_util.commaMoney(minSponsorPoints)} and ${_util.commaMoney(maxSponsorPoints)}`;
    let sponsorLimit = {
        min: minSponsorPoints,
        max: maxSponsorPoints
    }

    let result;

    if (!_util.hasKeys(body, "point_quantity", "video_post_id", "receiver")) {
        console.log("not key");
        return res.json(jresp.invalidData());
    }

    if (!_util.areBeyondZero(body.point_quantity, body.video_post_id, body.receiver)) {
        console.log("not num");
        return res.json(jresp.invalidData());
    }

    // 1000 이상 가능
    if (Number(body.point_quantity) < minSponsorPoints) {
        console.log("invalid price");
        return res.send(jresp.invalidData(msg, sponsorLimit));
    }

    // 백만 이하 가능
    if (Number(body.point_quantity) > maxSponsorPoints) {
        console.log("invalid price");
        return res.send(jresp.invalidData(msg, sponsorLimit));
    }

    // 하루 후원 가능액 체크
    let dailySponsored = await pointSv.getDailySponsorPointsByUserId(uid);
    let possibleDailySponsor = dailySponsorMaxPoints - dailySponsored;

    console.log(dailySponsored);
    console.log(possibleDailySponsor);

    if (Number(body.point_quantity) > possibleDailySponsor) {
        console.log("invalid price");

        let data = {
            "daily_sponsor_limit": dailySponsorMaxPoints,
            "possible_sponsor": possibleDailySponsor
        }

        return res.send(jresp.beyondSomething("beyond daily sponsor points", data))
    }

    /// 사용자 포인트 조회
    let points = await pointSv.getTotalPointsByUserId(uid);
    // let appliedAdjustmentTotal = await pointSv.getTotalAppliedAdjustmentByUserId(uid, 0);
    let appliedAdjustmentTotal = 0;

    console.log("totalPoints", points);
    console.log("totalPoints", points.total_points);
    console.log("adjustment", appliedAdjustmentTotal);

    let possibleSponsorPoints = points.total_points - appliedAdjustmentTotal;

    if (possibleSponsorPoints < 0) {
        console.log("total select fail")
        return res.send(jresp.sqlError());
    }

    if (possibleSponsorPoints < body.point_quantity) {
        console.log("short point")

        let data = {
            "own_points": possibleSponsorPoints
        }

        return res.json(jresp.underSomething("short of your points", data));
    }

    body.user_id = uid;

    result = await pointSv.sponsorPoints(body);

    // fcm 메시징.
    await notifySv.notifySponsorVideo(uid, body.video_post_id);

    return res.json(result);

});

router.post("/sponsor/creator", async (req, res) => {

    let body = req.body;
    let uid = req.uinfo["u"];
    let msg = `possible between ${_util.commaMoney(minSponsorPoints)} and ${_util.commaMoney(maxSponsorPoints)}`;
    let sponsorLimit = {
        min: minSponsorPoints,
        max: maxSponsorPoints
    }

    let result;

    if (!_util.hasKeys(body, "point_quantity", "receiver")) {
        console.log("not key");
        return res.json(jresp.invalidData());
    }

    if (!_util.areBeyondZero(body.point_quantity, body.receiver)) {
        console.log("not num");
        return res.json(jresp.invalidData());
    }

    if (Number(body.point_quantity) < minSponsorPoints) {
        console.log("invalid price");
        return res.send(jresp.invalidData(msg, sponsorLimit));
    }

    // 백만 이상 가능
    if (Number(body.point_quantity) > maxSponsorPoints) {
        console.log("invalid price");
        return res.send(jresp.invalidData(msg, sponsorLimit));
    }

    // 하루 후원 가능액 체크
    let dailySponsored = await pointSv.getDailySponsorPointsByUserId(uid);
    let possibleDailySponsor = dailySponsorMaxPoints - dailySponsored;

    console.log(dailySponsored);
    console.log(possibleDailySponsor);

    if (Number(body.point_quantity) > possibleDailySponsor) {
        console.log("invalid price");

        let data = {
            "daily_sponsor_limit": dailySponsorMaxPoints,
            "possible_sponsor": possibleDailySponsor
        }

        return res.send(jresp.beyondSomething("beyond daily sponsor points", data))
    }

    /// 사용자 포인트 조회
    let points = await pointSv.getTotalPointsByUserId(uid);
    // let appliedAdjustmentTotal = await pointSv.getTotalAppliedAdjustmentByUserId(uid, 0);
    let appliedAdjustmentTotal = 0;

    console.log("totalPoints", points);
    console.log("totalPoints", points.total_points);
    console.log("adjustment", appliedAdjustmentTotal);

    let possibleSponsorPoints = points.total_points - appliedAdjustmentTotal;

    if (possibleSponsorPoints < 0) {
        console.log("total select fail")
        return res.send(jresp.sqlError());
    }

    if (possibleSponsorPoints < body.point_quantity) {
        console.log("short point")

        let data = {
            "own_points": possibleSponsorPoints
        }

        return res.json(jresp.underSomething("short of your points", data));
    }

    body.user_id = uid;

    result = await pointSv.sponsorPoints(body);

    // fcm 메시징.
    await notifySv.notifySponsorCreator(uid, body.receiver);

    return res.json(result);
});

/// 포인트 내역
router.get("/history", async (req, res) => {

    let uid = req.uinfo["u"];
    let limit = req.query.limit;
    let offset = req.query.offset;

    let result = ""

    if (!_util.areBeyondZero(limit, offset)) {
        return res.json(jresp.invalidData());
    }

    result = await pointSv.getPointHistoryByUserId(uid, limit, offset);

    return res.json(result);
});


/// 후원 내역
router.get("/history/sponsor/video", async (req, res) => {

    let uid = req.uinfo["u"];
    let limit = req.query.limit;
    let offset = req.query.offset;

    if (!_util.areBeyondZero(limit, offset)) {
        return res.json(jresp.invalidData());
    }

    let result = await pointSv.getSponsorVideoHistoryByUserId(uid, limit, offset);

    return res.json(result);
});


router.get("/history/sponsor/creator", async (req, res) => {

    let uid = req.uinfo["u"];
    let limit = req.query.limit;
    let offset = req.query.offset;

    if (!_util.areBeyondZero(limit, offset)) {
        return res.json(jresp.invalidData());
    }

    let result = await pointSv.getSponsorCreatorHistoryByUserId(uid, limit, offset);

    return res.json(result);
});


/*
    정산 관리
*/

// 정산 내역
router.get("/history/adjustment", async (req, res) => {

    let uid = req.uinfo["u"];
    let limit = req.query.limit;
    let offset = req.query.offset;

    if (!_util.areBeyondZero(limit, offset)) {
        return res.json(jresp.invalidData());
    }

    let result = await pointSv.getAdjustmentHistoryByUserId(uid, limit, offset);

    return res.json(result);
});

// 정산 신청
/// 충전 포인트
router.post("/apply/charge/adjustment", async (req, res) => {

    let body = req.body
    let uid = req.uinfo["u"];
    let result;

    if (!_util.hasKeys(body, "point_quantity", "account")) {
        console.log("not key");
        return res.json(jresp.invalidData());
    }

    if (_util.isBlank(body.account)) {
        console.log("blank");
        return res.json(jresp.invalidData());
    }

    if (!_util.isBeyondZero(body.point_quantity)) {
        console.log("not num");
        return res.json(jresp.invalidData());
    }

    /// 최소 정산 가능 금액
    if (Number(body.point_quantity) < minAdjustmentPoints) {
        console.log("under 5000");

        let msg = `under ${_util.commaMoney(minAdjustmentPoints)} points`

        return res.send(jresp.invalidData(msg, { min: minAdjustmentPoints }));
    }

    if (Number(body.point_quantity) % 100 > 0) {
        console.log("only 100");
        return res.send(jresp.invalidData("only 100 units or more"));
    }

    let points = await pointSv.getTotalPointsByUserId(uid);
    // let appliedTotal = await pointSv.getTotalAppliedAdjustmentByUserId(uid, 0);
    let appliedTotal = 0;

    // console.log("totalPoints", points.total_points);
    // console.log("appliedTotal", appliedTotal);
    // console.log("total", points.total_points - appliedTotal);

    let possibleAdjustmentPoint = points.total_points - appliedTotal;

    if (points.total_points < 0 || appliedTotal < 0) {
        console.log("total select fail")
        return res.send(jresp.sqlError());
    }

    if (possibleAdjustmentPoint < body.point_quantity) {

        console.log("beyond possible  points to apply")

        let data = {
            "own_charge_points": points.total_points,
            "applied_points": appliedTotal,
            "possible": possibleAdjustmentPoint
        }
        return res.json(jresp.beyondSomething("beyond possible points to apply", data));
    }

    body.user_id = uid;
    body.point_type = 0;

    result = await pointSv.applyAdjustment(body);

    return res.json(result);
});

/// 후원 포인트
router.post("/apply/sponsor/adjustment", async (req, res) => {

    let body = req.body
    let uid = req.uinfo["u"];
    let result;

    if (!_util.hasKeys(body, "point_quantity", "account")) {
        console.log("not key");
        return res.json(jresp.invalidData());
    }

    if (_util.isBlank(body.account)) {
        console.log("blank");
        return res.json(jresp.invalidData());
    }

    if (!_util.isBeyondZero(body.point_quantity)) {
        console.log("not num");
        return res.json(jresp.invalidData());
    }

    if (Number(body.point_quantity) < minAdjustmentPoints) {
        console.log("under 5000");

        let msg = `under ${_util.commaMoney(minAdjustmentPoints)} points`
        return res.send(jresp.invalidData(msg, { min: minAdjustmentPoints }));
    }

    if (Number(body.point_quantity) % 100 > 0) {
        console.log("only 100 units");
        return res.send(jresp.invalidData("only 100 units or more"));
    }

    let points = await pointSv.getTotalPointsByUserId(uid);
    // let appliedTotal = await pointSv.getTotalAppliedAdjustmentByUserId(uid, 1);
    let appliedTotal = 0;

    // console.log("total_sponsored", points.total_sponsored);
    // console.log("appliedTotal", appliedTotal);
    // console.log("total", points.total_sponsored - appliedTotal);

    let possibleAdjustmentPoint = points.total_sponsored - appliedTotal;

    if (points.total_sponsored < 0 || appliedTotal < 0) {
        console.log("total select fail")
        return res.send(jresp.sqlError());
    }

    if (possibleAdjustmentPoint < body.point_quantity) {
        console.log("beyond possible  points to apply")

        let data = {
            "own_sponsor_points": points.total_sponsored,
            "applied_points": appliedTotal,
            "possible": possibleAdjustmentPoint
        }
        return res.json(jresp.beyondSomething("beyond possible points to apply", data));
    }

    body.user_id = uid;
    body.point_type = 1;

    result = await pointSv.applyAdjustment(body);

    return res.json(result);
});


module.exports = router;