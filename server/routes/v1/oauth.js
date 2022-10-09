import express from "express"
import dailyStSv from "../../services/dailyStatisticsService"
const userMngSv = require("../../services/userManageService")

const router = express.Router();

router.post("/signin", async (req, res) => {

    let body = req.body
    let sql
    let sqlP
    let result
    let out = {}
    let oauthType = ["normal", "kakao", "naver", "google", "facebook"];

    if (!oauthType.includes(body["type"])) {
        return res.json(jresp.invalidData());
    }

    if (body['type'] === 'normal') {

        if (_util.isBlanks(body['id'], body["password"])) {
            return res.json(jresp.invalidAccount());
        }

        sql = 'select a.user_id, b.retire_chk, b.suspend_chk, b.lv ' +
            'from oauth a ' +
            'inner join `user` b ' +
            'on a.user_id  = b.id ' +
            'where a.app_id = :id ' +
            'and a.oauth_type = :type ' +
            'and a.password = password(:pw) ';
        sqlP = { id: body['id'], pw: body["password"], type: body['type'] }

        result = await db.qry(sql, sqlP)

        // sql err
        if (!result['success']) {
            console.error(result)
            return res.json(jresp.sqlError());
        }

        if (result['rows'].length < 1) {
            return res.json(jresp.invalidAccount());
        }

    } else {

        if (_util.isBlanks(body['type'], body['id'])) {
            return res.json(jresp.invalidAccount());
        }

        sql = 'select a.user_id, b.retire_chk, b.suspend_chk, b.lv ' +
            'from oauth a ' +
            'inner join `user` b ' +
            'on a.user_id  = b.id ' +
            'where a.app_id = :id ' +
            'and a.oauth_type = :type '
        sqlP = { id: body['id'], type: body['type'] }

        result = await db.qry(sql, sqlP)

        console.log(result);

        // sql err
        if (!result['success']) {
            console.error(result)
            return res.json(jresp.sqlError());
        }

        if (result['rows'].length < 1) {
            return res.json(jresp.emptyData());
        }
    }

    let retireChk = result['rows'][0]["retire_chk"];
    let suspendChk = result['rows'][0]["suspend_chk"];

    if (suspendChk > 0) {
        return res.json(jresp.suspendedUser());
    }

    if (retireChk > 0) {
        return res.json(jresp.retiredUser());
    }

    let jwtObj = {
        u: result['rows'][0]['user_id']
        , l: result['rows'][0]['lv']
    }

    let token = await jwt.register(jwtObj)

    // 쿠키 셋팅
    res.cookie('token', token)

    let _data = {
        token: token
    }

    dailyStSv.dailyChkStatistics("access");

    return res.json(jresp.successData(_data, result['rows'].length, result['rows'].length));
});

router.post("/signup", async (req, res) => {

    let body = req.body
    let out;

    out = await userMngSv.signup(body);

    await dailyStSv.dailyChkStatistics("join");
    return res.json(out);
});

router.post("/duplicate-nickname", async (req, res) => {

    let body = req.body;
    let result;

    if (!_util.hasKey(body, 'nickname') || _util.isBlank(body['nickname'])) {
        return res.json(jresp.invalidData())
    }

    result = await userMngSv.checkDuplicateNickname(body['nickname'])
    res.send(result)
});

router.post("/duplicate-phone", async (req, res) => {

    let body = req.body;
    let result;

    if (!_util.hasKey(body, 'phone') || _util.isBlank(body['phone'])) {
        return res.json(jresp.invalidData())
    }

    result = await userMngSv.checkDuplicatePhone(body['phone'])
    res.send(result)
});

router.post("/duplicate-email", async (req, res) => {

    let body = req.body;
    let result;

    if (!_util.hasKey(body, 'email') || _util.isBlank(body['email'])) {
        return res.json(jresp.invalidData())
    }

    result = await userMngSv.checkDuplicateEmail(body['email'])
    res.send(result)
});

router.post("/update/fcmtoken", async (req, res) => {

    let uid = req.body.user_id;
    let token = req.body.token;

    if (_util.isBlank(token)) {
        return jresp.invalidData();
    }

    let result = await userMngSv.updateFcmToken(uid, token);

    return res.json(result);
});

router.post("/chk-slang", async (req, res) => {

    let body = req.body;

    if (!_util.hasKey(body, 'str') || _util.isBlank(body['str'])) {
        return res.json(jresp.invalidData())
    }

    let str = body['str'].replace(/[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]|(?:\s)+|\s{2,}/gi, "");
    let result = await userMngSv.chkSlang(str);

    res.send(result)
});


module.exports = router
