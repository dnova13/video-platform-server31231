const express = require('express')
const router = express.Router()
const util = require('util')
const notifySv = require("../../services/notifyService");
const userMngSv = require("../../services/userManageService");


router.get("/get/profile", async (req, res) => {

    let uid = req.uinfo["u"];
    let id = req.query.id;

    if (!_util.isBeyondZero(id)) {
        return res.send(jresp.invalidData());
    }

    let result = await userMngSv.showOtherUserProfile(uid, id);

    return res.send(result);
});

router.get("/is-follow", async (req, res) => {

    let uid = req.uinfo["u"]
    let chkId = req.query.user_id;

    if (!_util.isBeyondZero(chkId)) {
        console.log("under zero");
        return res.send(jresp.invalidData());
    }

    if (parseInt(uid) === parseInt(chkId)) {
        console.log("same user")
        return res.send(jresp.sameUser());
    }

    let result = await isChkFollow(uid, chkId);

    if (result < 0) {
        return res.json(jresp.sqlError());
    }

    return res.json(jresp.successData({ follow_chk: result > 0 }))

})

router.post("/check", async (req, res) => {

    let followId = req.body.follow_id;

    console.log(followId);

    let uid = req.uinfo["u"];
    let result

    if (!_util.isBeyondZero(followId)) {
        console.log("under zero");
        return res.send(jresp.invalidData());
    }

    if (uid === followId) {
        console.log("same user")
        return res.send(jresp.sameUser());
    }

    result = await isChkFollow(uid, followId);

    console.log(result);

    switch (result) {

        // not follow
        case 0:
            result = await chkFollow(uid, followId);

            // fcm 메시징.
            await notifySv.notifyFollow(uid, followId);

            break;

        // follow
        case 1:
            result = await unChkFollow(uid, followId);
            break;

        default:
            return res.json(jresp.sqlError());
    }

    return res.json(result);
});

router.get("/list/following", async (req, res) => {

    let uid = req.query.user_id ? req.query.user_id : req.uinfo["u"];
    let limit = req.query.limit;
    let offset = req.query.offset;

    if (!_util.areBeyondZero(limit, offset)) {
        console.log("is zero");
        return res.json(jresp.invalidData());
    }

    let result;

    let sql = "select a.user_id " +
        " , a.follower as follower_id, b.nickname as follower_nickname " +
        " , b.icon as follower_icon " +
        ` , (select count(*) as cnt
                        from creator cr
                        inner join creator_apply ap
                        where cr.user_id = ap.user_id
                        and cr.user_id = a.follower
                        and ap.status = 1 ) as is_creator ` +
        "from follow a " +
        "inner join `user` b  " +
        "on a.follower = b.id " +
        "where a.user_id = :user_id " +
        "and b.retire_chk = 0 " +
        "and b.suspend_chk = 0 " +
        `order by a.create_at desc limit ${limit} offset ${offset - 1}`;
    let sqlParams = { user_id: uid }

    result = await db.qry(sql, sqlParams);

    console.log(result);

    if (!result['success']) {
        return res.json(jresp.sqlError());
    }

    if (result['rows'].length < 1) {
        return res.json(jresp.emptyData());
    }

    let data = result["rows"];

    for (let item of data) {

        item.follower_icon = _util.createImgDownPath(item.follower_icon);
        item.is_creator = item.is_creator > 0;
    }

    let total = await getTotalFollowing(uid);

    return res.json(jresp.successData(data, data.length, total));
});

router.get("/list/follower", async (req, res) => {

    let uid = req.uinfo["u"];
    let targetUid = req.query.uid;
    let limit = req.query.limit;
    let offset = req.query.offset;

    if (!_util.areBeyondZero(limit, offset)) {
        console.log("is zero");
        return res.json(jresp.invalidData());
    }

    let result;

    let sql = "select a.follower as user_id " +
        " , a.user_id as following_id , b.nickname as following_nickname " +
        " , b.icon as following_icon " +
        " , (select count(*) from follow where follower = a.user_id and user_id = :target_uid) as follow_chk " +
        ` , (select count(*) as cnt
                        from creator cr
                        inner join creator_apply ap
                        where cr.user_id = ap.user_id
                        and cr.user_id = a.user_id
                        and ap.status = 1 ) as is_creator ` +
        "from follow a " +
        "inner join `user` b " +
        "on a.user_id = b.id " +
        "where a.follower = :user_id " +
        "and b.retire_chk = 0 " +
        "and b.suspend_chk = 0 " +
        `order by a.create_at desc limit ${limit} offset ${offset - 1}`;
    let sqlParams = { user_id: targetUid ? targetUid : uid, target_uid: uid }

    result = await db.qry(sql, sqlParams);

    if (!result['success']) {
        return res.json(jresp.sqlError());
    }

    if (result['rows'].length < 1) {
        return res.json(jresp.emptyData());
    }

    console.log(result);

    let data = result["rows"];

    for (let item of data) {

        item.following_icon = _util.createImgDownPath(item.following_icon);
        item.follow_chk = item.follow_chk > 0;
        item.is_creator = item.is_creator > 0;
    }

    let total = await getTotalFollower(uid);

    return res.json(jresp.successData(data, data.length, total));
});

router.get("/list/video", async (req, res) => {

    let fwId = req.query.follow_id ? req.query.follow_id : 0;

    let uid = req.uinfo["u"];
    let limit = req.query.limit;
    let offset = req.query.offset;
    let order = req.query.order;

    console.log(order);

    if (!_util.areBeyondZero(limit, offset, order)) {
        console.log("is zero");
        return res.json(jresp.invalidData());
    }

    let sum;
    let sql;
    let orderBy;
    let head = "SELECT a.id, a.view_cnt   " +
        " , like_cnt    " +
        " , ifnull(ROUND(a.score_sum/a.score_cnt, 2), 0) as score   " +
        " , title    " +
        " , a.user_id     " +
        " , (select nickname from `user` where id = a.user_id ) as nickname   " +
        " , (select icon from `user` where id = a.user_id ) as icon    " +
        " , a.thumbnail   " +
        " , ifnull((select duration from files where `uuid` = a.video and file_type = 1  limit 1),0) as duration " +
        " , create_at , update_at ";

    switch (parseInt(order)) {

        // 최근 업로드 순
        case 1:
            sum = "";
            orderBy = " order by a.id desc ";
            break;

        // 추천 많은 순 지난 7일간
        case 2:
            sum = " ifnull(sum(like_cnt), 0) "
            orderBy = " order by total desc, a.like_cnt desc ,  a.id desc ";
            break;

        // 평점 높은 순 지난 7일간
        case 3:
            sum = " ifnull(sum(score_sum), 0) "
            orderBy = " order by total desc, a.score_sum desc , a.id desc ";
            break;

        // 영상 추천순 평점 + 추천 + 찜을 합친 순 지난 7일간
        case 4:
            sum = " ifnull(ifnull(sum(score_sum), 0)/ ifnull(sum(score_cnt),0),0) + ifnull(sum(like_cnt),0) + ifnull(sum(dibs_cnt), 0) "
            orderBy = " order by total desc, a.id desc ";
            break;

        default:
            // console.log("!!!")
            return res.json(jresp.invalidData());
    }

    let subQry = sum.length > 0 ?
        `, ifnull((    
                             select ${sum}    
                             from daily_video_manager    
                             where daily_date between current_date() - interval 7 day and current_date() - interval 1 day       
                             group by video_post_id    
                             having video_post_id = a.id     
                        ),0) as total ` : "";

    let condition = " from video_post a  " +
        `where a.blind_chk = 0 
                     ${parseInt(fwId) === 0 ?
            `and a.user_id in (select follower from follow where user_id = ${uid}) `
            : `and a.user_id = ${parseInt(fwId)}`} `;


    let tail = ` limit ${limit} offset ${offset - 1} `;

    sql = head + subQry + condition + orderBy + tail;

    console.log("sql ", sql);

    let result = await db.qry(sql);
    // console.log(result);

    if (!result['success']) {
        return res.json(jresp.sqlError());
    }

    if (result['rows'].length < 1) {
        return res.json(jresp.emptyData());
    }

    let data = result["rows"];

    for (let item of data) {
        item.thumbnail = _util.createImgDownPath(item.thumbnail)
        item.icon = _util.createImgDownPath(item.icon)
        delete item.total;
    }

    let total = await getTotalFollowVideo(fwId, uid);

    return res.json(jresp.successData(data, data.length, total));
});

async function getTotalFollowVideo(fwId, uid) {

    let sql2 = "select count(*) as total " +
        "from video_post a " +
        `where a.blind_chk = 0 
                ${parseInt(fwId) === 0 ?
            ` and a.user_id in (select follower from follow where user_id = ${uid}) `
            :
            ` and a.user_id = ${parseInt(fwId)}`} `;

    let result = await db.qry(sql2);
    console.log(result);

    if (!result['success'] || result['rows'].length < 1) {
        return 0;
    }

    return result["rows"][0]["total"];
}

async function getTotalFollowing(uid) {

    let sql2 = "select count(*) as total " +
        "from follow a " +
        "inner join `user` b  " +
        "on a.follower = b.id " +
        `where a.user_id = ${uid} ` +
        "and b.retire_chk = 0 " +
        "and b.suspend_chk = 0 ";

    let result = await db.qry(sql2);

    if (!result['success'] || result['rows'].length < 1) {
        return 0;
    }

    return result["rows"][0]["total"];
}

async function getTotalFollower(uid) {

    let sql2 = "select count(*) as total " +
        "from follow a   " +
        "inner join `user` b    " +
        "on a.user_id = b.id   " +
        `where a.follower = ${uid} ` +
        "and b.retire_chk = 0   " +
        "and b.suspend_chk = 0   ";

    let result = await db.qry(sql2);

    if (!result['success'] || result['rows'].length < 1) {
        return 0;
    }

    return result["rows"][0]["total"];
}


async function isChkFollow(uid, followId) {

    let sql = "select count(*) as cnt " +
        "from follow " +
        "where user_id = :user_id " +
        "and follower = :follower ";

    let sqlParams = { user_id: uid, follower: followId }
    let result = await db.qry(sql, sqlParams);

    if (!result['success'] || result['rows'].length < 1) {
        return -1;
    }

    return result['rows'][0]["cnt"] > 0 ? 1 : 0;
}

async function chkFollow(uid, followId) {

    let sql = "INSERT INTO follow (user_id, follower) " +
        "VALUES(:user_id, :follower) "
    let sqlParams = { user_id: uid, follower: followId }

    let result = await db.qry(sql, sqlParams);

    if (!result['success'] || result['rows']['insertId'] < 1) {
        return jresp.sqlError();
    }

    let sql2 = "update `user` fwing, `user` fwer " +
        " set fwing.following_cnt = ifnull(fwing.following_cnt,0) + 1 " +
        " , fwer.follower_cnt = ifnull(fwer.follower_cnt,0) + 1 " +
        `where fwing.id = ${uid} 
                 and fwer.id = ${followId}`

    result = await db.qry(sql2);

    return jresp.successData({ chk: true });
}

async function unChkFollow(uid, followId) {

    console.log("unchkFollow");

    let sql = "delete from follow " +
        "where user_id = :user_id " +
        "and `follower` = :follower ";

    let sqlParams = { user_id: uid, follower: followId };

    let result = await db.qry(sql, sqlParams);

    if (!result['success'] || result['rows']['affectedRows'] < 1) {
        return jresp.sqlError();
    }

    let sql2 = "update `user` fwing, `user` fwer " +
        " set fwing.following_cnt = if( ifnull(fwing.following_cnt, 0) - 1 < 0, 0, ifnull(fwing.following_cnt, 0) - 1) " +
        " , fwer.follower_cnt = if( ifnull(fwer.follower_cnt, 0) - 1 < 0, 0, ifnull(fwer.follower_cnt, 0) - 1) " +
        `where fwing.id = ${uid} 
                 and fwer.id = ${followId}`

    result = await db.qry(sql2);

    return jresp.successData({ chk: false });
}


module.exports = router