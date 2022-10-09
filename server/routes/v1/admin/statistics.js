const express = require('express')
const router = express.Router()
const util = require('util')
const dailyStaSv = require("../../../services/dailyStatisticsService");
const userStaSv = require("../../../services/userStatisticsService");

/// 오늘 총 매출
router.get("/daily/earnings", async (req, res) => {

    let result = await dailyStaSv.getDailyEarnings();
    return res.json(result);
});

// 오늘 접속 자수
router.get("/daily/login", async (req, res) => {

    let result = await dailyStaSv.getDailyLogin();
    return res.json(result);
});

// 오늘 가입자 수
router.get("/daily/join", async (req, res) => {

    let result = await dailyStaSv.getDailyJoin();
    return res.json(result);
});


/// 일별 7일간 가입자 수 통계
router.get("/day/in7days/join", async (req, res) => {

    let date = req.query.date;

    if (_util.isBlank(date)) {
        res.json(jresp.invalidData());
    }

    let result = await userStaSv.getJoinCountEachDayIn7days(date);
    return res.json(result);
});


/// 접속자 수 통계
// 요일 별
router.get("/day/in-week/login", async (req, res) => {

    let date = req.query.date;

    if (_util.isBlank(date)) {
        res.json(jresp.invalidData());
    }

    let result = await userStaSv.getLoginCountEachDayInWeek(date);
    return res.json(result);
});

// 지난 7일간
router.get("/day/in7days/login", async (req, res) => {

    let date = req.query.date;

    if (_util.isBlank(date)) {
        res.json(jresp.invalidData());
    }

    let result = await userStaSv.getLoginCountEachDayIn7days(date);
    return res.json(result);
});

/// 월별, 지난 1년간
router.get("/month/in-year/login", async (req, res) => {

    let date = req.query.date;

    if (_util.isBlank(date)) {
        res.json(jresp.invalidData());
    }

    let result = await userStaSv.getLoginCountEachMonthInTheYear(date);
    return res.json(result);
});


module.exports = router;