const express = require('express')
const router = express.Router()
const util = require('util')
const dailyVideoSv = require("../../services/dailyVideoMangerService");
const notifySv = require("../../services/notifyService");


router.post("/check/:type", async (req, res) => {

    let videoPostId = req.body.id;
    let postedUserId = req.body.user_id;

    let mType = req.params.type;
    let types = ['like', 'dibs']
    let uid = req.uinfo["u"];
    let result

    if (!_util.areBeyondZero(videoPostId, postedUserId)) {
        // console.log("under zero");
        return res.json(jresp.invalidData());
    }

    if (!types.includes(mType)) {
        // console.log("not type");
        return res.json(jresp.invalidData());
    }

    if ((uid === postedUserId)) {
        return res.json(jresp.sameUser());
    }

    result = await isChkVideoMeta(uid, mType, videoPostId);

    switch (result) {

        case 0:
            result = await chkVideoMeta(mType, uid, videoPostId);
            await dailyVideoSv.dailyChkVideo(mType, videoPostId)

            /// fcm 메시징.
            if (mType === "like") {
                // console.log("noti msg")
                // 사용자 닉네임, 게시물 사용자 아이디
                await notifySv.notifyPostEvent(uid, videoPostId);
            }

            break;

        case 1:
            result = await unChkVideoMeta(mType, uid, videoPostId);
            await dailyVideoSv.dailyUnChkVideo(mType, videoPostId);
            break;

        default:
            return res.json(jresp.sqlError());
    }

    return res.json(result);
});

router.post("/give/score", async (req, res) => {

    let uid = req.uinfo["u"];
    let body = req.body;

    let result;

    if (!_util.hasKeys(body, "id", "score")) {
        return res.json(jresp.invalidData());
    }

    if (!_util.isBeyondMinus(body.score) || Number(body.score) > 5) {
        console.error("beyond score ")
        return res.json(jresp.invalidData());
    }

    if (!_util.areBeyondZero(body.id, body.user_id)) {
        // console.log("under zero");
        return res.json(jresp.invalidData());
    }

    if ((uid === body.user_id)) {
        return res.json(jresp.sameUser());
    }

    result = await isScoreByUserId(uid, "score", body.id);

    if (!result) {
        return res.json(jresp.sqlError());
    }

    if (result["user_score"] > -1) {
        return res.json(jresp.duplicateData())
    }

    let beforeSum = Number(result["score_sum"])
    let beforeCnt = Number(result["score_cnt"])

    let sql = `INSERT INTO video_post_meta (\`type\`, user_id, video_post_id, \`value\`) 
                VALUES('score', :user_id, :video_post_id, :score ) `

    let sqlParams = { user_id: uid, video_post_id: body.id, score: body.score };

    result = await db.qry(sql, sqlParams);

    if (!result['success'] || result['rows']['insertId'] < 1) {
        return res.json(jresp.sqlError())
    }

    let sql2 = `update video_post 
                set score_sum = score_sum + ${body.score}
                    , score_cnt = score_cnt + 1
                where id = ${body.id} `

    result = await db.qry(sql2);
    console.log(result['rows']['affectedRows']);

    await dailyVideoSv.dailyChkVideo("score", body.id, body.score)

    let avg = Math.round(((beforeSum + Number(body.score)) / (beforeCnt + 1)) * 100) / 100

    return res.json(jresp.successData({ "score": avg }));
});

router.post("/cancel/score", async (req, res) => {

    let body = req.body;
    let uid = req.uinfo["u"];
    let result

    if (!_util.hasKeys(body, "id")) {
        return res.json(jresp.invalidData());
    }

    if (!_util.areBeyondZero(body.id)) {
        console.log("under zero");
        return res.json(jresp.invalidData());
    }

    body.user_id = uid;
    result = await cancelScore(body)

    return res.json(result);
});


async function cancelScore(body) {

    let result
    let uid = body.user_id
    let videoPostId = body.id

    result = await isScoreByUserId(uid, "score", videoPostId);

    if (!result) {
        return jresp.sqlError();
    }

    if (result["user_score"] < 0) {
        return jresp.invalidData();
    }

    let beforeSum = Number(result["score_sum"])
    let beforeCnt = Number(result["score_cnt"])
    let score = Number(result["user_score"])

    console.log("before sum", beforeSum)
    console.log("before cnt ", beforeCnt)
    console.log("your scr ", score)

    let sql1 = `update video_post a 
                set a.score_cnt = if(a.score_cnt - 1 < 0, 0, a.score_cnt - 1)
                    , a.score_sum = if(a.score_sum - ${score} < 0, 0, a.score_sum - ${score}) 
                where a.id = ${videoPostId}`

    result = await db.qry(sql1)

    if (!_util.updateChkFromDB(result)) {
        console.log("update err")
        return jresp.sqlError()
    }

    let sql2 = `delete video_post_meta from video_post_meta 
                where \`type\`= "score"
                and video_post_id = ${videoPostId}
                and user_id = ${uid};`

    result = await db.qry(sql2)

    if (!_util.updateChkFromDB(result)) {
        console.log("delect err")
        return jresp.sqlError()
    }

    let sql3 = `update daily_video_manager a 
                set a.score_cnt = if(a.score_cnt - 1 < 0, 0, a.score_cnt - 1)
                    , a.score_sum = if(a.score_sum - ${score} < 0, 0, a.score_sum - ${score})
                where a.video_post_id = ${videoPostId}`

    await db.qry(sql3);

    let avg = beforeCnt - 1 === 0 ? 0 : Math.round(((beforeSum - score) / (beforeCnt - 1)) * 100) / 100

    return jresp.successData({ score: avg ? avg : 0 });
}


async function isScoreByUserId(uid, type, videoPostId) {

    let sql = `select score_cnt, score_sum 
                    , ifnull((select value 
                        from video_post_meta 
                        where user_id = :user_id
                        and \`type\` = "score" 
                        and video_post_Id = a.id), -1) as user_score 
                from video_post a
                where id = :video_post_id`

    let sqlParams = { user_id: uid, type: type, video_post_id: videoPostId }
    let result = await db.qry(sql, sqlParams);

    if (!result['success'] || result['rows'].length < 1) {
        return null
    }

    return result['rows'][0];
}


async function getScoreByPostId(videoPostId) {

    let sql = `select score_cnt, score_sum  
                from video_post 
                where id = :video_post_id`

    let sqlParams = { video_post_id: videoPostId }
    let result = await db.qry(sql, sqlParams);

    if (!result['success'] || result['rows'].length < 1) {
        return null
    }

    return result['rows'][0];
}

async function isChkVideoMeta(uid, type, videoPostId) {

    let sql = "select count(*) as cnt " +
        "from video_post_meta " +
        "where user_id = :user_id " +
        "and `type` = :type " +
        "and video_post_id = :video_post_id "

    let sqlParams = { user_id: uid, type: type, video_post_id: videoPostId }
    let result = await db.qry(sql, sqlParams);

    if (!result['success'] || result['rows'].length < 1) {
        return -1;
    }

    return result['rows'][0]["cnt"] > 0 ? 1 : 0;
}

async function chkVideoMeta(type, uid, videoPostId) {

    console.log("chkVideoMeta");

    let sql = "INSERT INTO video_post_meta (`type`, user_id, video_post_id) " +
        "VALUES(:type, :user_id, :video_post_id) "
    let sqlParams = { user_id: uid, type: type, video_post_id: videoPostId }

    let result = await db.qry(sql, sqlParams);

    if (!result['success'] || result['rows']['insertId'] < 1) {
        return jresp.sqlError();
    }

    let sql2 = "update video_post " +
        `set ${type}_cnt = ifnull(${type}_cnt,0) + 1 ` +
        `where id = ${videoPostId} `

    result = await db.qry(sql2)

    return jresp.successData({ chk: true });
}

async function unChkVideoMeta(type, uid, videoPostId) {

    let sql = "delete from video_post_meta " +
        "where video_post_id = :video_post_id " +
        "and user_id = :user_id " +
        "and `type` = :type ";
    let sqlParams = { user_id: uid, type: type, video_post_id: videoPostId }

    let result = await db.qry(sql, sqlParams);

    if (!result['success'] || result['rows']['affectedRows'] < 1) {
        return jresp.sqlError();
    }

    let sql2 = "update video_post " +
        `set ${type}_cnt = if( ifnull(${type}_cnt, 0) - 1 < 0, 0, ifnull(${type}_cnt, 0) - 1) ` +
        `where id = ${videoPostId} `

    result = await db.qry(sql2);

    return jresp.successData({ chk: false });
}


module.exports = router