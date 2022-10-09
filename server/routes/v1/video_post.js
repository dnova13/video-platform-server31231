const express = require('express')
const router = express.Router()
const util = require('util')
const tagSv = require("../../services/tagsService");
const dailyVideoSv = require("../../services/dailyVideoMangerService");
const notifySv = require("../../services/notifyService");

router.post("/write", async (req, res) => {

    let body = req.body;
    let result;
    let _tags = body.tags

    let keys = ['title', 'content', 'video_id', 'tags', 'thumbnail_id'];

    if (!_util.hasKeysArray(body, keys)) {

        console.log("key err");
        return res.send(jresp.invalidData());
    }

    if (_util.isObjectBlankArray(body, keys, keys.length - 2)) {
        console.log("blank err");
        return res.send(jresp.invalidData());
    }

    result = await tagSv.insertTags(_tags);

    if (!result["success"]) {
        return res.json(result);
    }

    body.user_id = req.uinfo["u"];
    body.tags = JSON.stringify(_tags);

    result = await insertVideoPost(body);

    if (!result["success"]) {
        console.log("insertPost")
        return res.json(result);
    }

    return res.json(result);
});


router.get("/read", async (req, res) => {

    console.log("read")

    let id = req.query.id;
    let uid = req.uinfo["u"];

    if (!_util.isBeyondZero(id)) {
        return res.json(jresp.invalidData());
    }

    let sql = "SELECT a.id, title, content " +
        ", video, thumbnail " +
        ", view_cnt, like_cnt, dibs_cnt, reply_cnt " +
        ", ifnull(ROUND(score_sum/score_cnt, 2), 0) as score " +
        ", tags " +
        ", a.user_id, b.nickname, b.icon as user_icon " +
        ", ifnull(a.my_info,'') as my_info " +
        ", a.create_at, a.update_at, a.copyright " +
        `, (select count(*) from video_post_meta where user_id=:user_id and video_post_id = a.id and \`type\` = 'dibs') as dibs_chk
                    , (select count(*) from video_post_meta where user_id=:user_id and video_post_id = a.id and \`type\` = 'like') as like_chk
                    , (select count(*) from video_post_meta where user_id=:user_id and video_post_id = a.id and \`type\` = 'score') as score_chk
                    , (select count(*) from follow where user_id=:user_id and follower = a.user_id) as follow_chk
                    , (
                        select count(*) as cnt
                        from creator cr
                        inner join creator_apply ap
                        where cr.user_id = ap.user_id
                        and cr.user_id = b.id
                        and ap.status = 1 ) as is_creator ` +
        "FROM video_post a " +
        "inner join `user` b " +
        "on a.user_id = b.id " +
        "where blind_chk = 0 " +
        `and a.id = ${id} `
    let sqlParams = {
        user_id: uid
    }

    let result = await db.qry(sql, sqlParams)

    if (!result['success']) {
        return res.json(jresp.sqlError());
    }

    if (result['rows'].length < 1) {
        return res.json(jresp.emptyData());
    }

    // 뷰 포인트 증가
    let sql1 = "update video_post " +
        "set view_cnt = ifnull(view_cnt, 0) + 1 " +
        `where id = ${id}`

    await db.qry(sql1);

    let item = result["rows"][0];

    item.create_at = item.create_at.replaceAll("-", ".");
    item.update_at = item.update_at.replaceAll("-", ".");
    item.user_icon = Number(item.user_icon) < 1 ? "" : _util.createImgDownPath(item.user_icon);
    item.video = !item.video ? "" : _util.createVideoDownPath(item.video);
    item.thumbnail = Number(item.thumbnail) < 1 ? "" : _util.createImgDownPath(item.thumbnail);
    item.dibs_chk = parseInt(item.dibs_chk) > 0;
    item.like_chk = parseInt(item.like_chk) > 0;
    item.score_chk = parseInt(item.score_chk) > 0;
    item.follow_chk = parseInt(item.follow_chk) > 0;
    item.tags = item.tags ? JSON.parse(item.tags) : [];
    item.copyright = item.copyright > 0;
    item.is_creator = item.is_creator > 0;

    await dailyVideoSv.dailyChkVideo("view", id);
    await insertRecentPost(uid, id);

    return res.json(jresp.successData(item, 1, 1))
});


router.post("/edit", async (req, res) => {

    console.log("!!!edit");

    let body = req.body;
    let result;
    let _tags = body.tags

    if (!_util.isBeyondZero(body.id)) {
        return res.json(jresp.invalidData());
    }

    if (_tags) {
        console.log("edit tag");
        result = await tagSv.insertTags(_tags);

        if (!result["success"]) {
            return res.json(result);
        }
    }

    body.user_id = req.uinfo["u"];
    body.tags = JSON.stringify(_tags);

    result = await editVideoPost(body);

    if (!result["success"]) {
        console.log("editPost")
        return res.json(result);
    }

    return res.json(result);

});


router.post("/delete", async (req, res) => {

    let body = req.body

    if (!_util.isNum(body.id) || body.id < 1) {
        return res.json(jresp.invalidData());
    }

    let sql = `delete p, d, vm
                from video_post p
                left join video_manager vm
                on p.id = vm.video_post_id
                left join daily_video_manager d
                on p.id = d.video_post_id 
                where p.id = :id
                and p.user_id = :user_id `;
    let sqlParams = {
        "id": body.id,
        "user_id": req.uinfo["u"]
    }

    let result = await db.qry(sql, sqlParams);

    if (!result['success'] || result["rows"]["affectedRows"] < 1) {
        return res.json(jresp.sqlError());
    }

    return res.json(jresp.successData());
});

async function insertRecentPost(uid, postId) {

    let sql1 = "select count(*) as cnt " +
        "from video_post_meta  " +
        "where `type` = 'recent' " +
        "and user_id = :user_id " +
        "and video_post_id = :video_post_id "

    let sqlParams = { user_id: uid, video_post_id: postId };
    let result = await db.qry(sql1, sqlParams);

    if (!result['success']) {
        console.error(result)
        return jresp.sqlError();
    }

    if (result['rows'].length < 1) {
        return jresp.sqlError();
    }

    let cnt = result["rows"][0]["cnt"]
    let sql2

    switch (cnt) {

        case 0:
            sql2 = "INSERT INTO video_post_meta (`type`, user_id, video_post_id) " +
                "values ('recent', :user_id, :video_post_id)"
            break;
        case 1:
            sql2 = "update video_post_meta  " +
                "set update_at = now() " +
                "where `type` = 'recent' " +
                "and user_id = :user_id " +
                "and video_post_id = :video_post_id"
            break;
        default:
            return jresp.invalidData();
    }

    result = await db.qry(sql2, sqlParams);

    if (!result['success']) {
        console.error(result)
        return jresp.sqlError();
    }

    if (result['rows'].length < 1) {
        return jresp.sqlError();
    }

    if (cnt === 0 && result['rows']["insertId"] < 1) {
        return jresp.sqlError();
    }

    if (cnt === 1 && result['rows']["affectedRows:"] < 1) {
        return jresp.sqlError();
    }

    return jresp.successData();

}

async function insertVideoPost(body) {

    let sql = "INSERT INTO video_post " +
        "(title, content, video, thumbnail, tags, user_id, my_info) " +
        "select :title, :content, uuid, :thumbnail, :tags, :user_id" +
        " , (select my_info from `user` where id = :user_id ) " +
        "from files " +
        "where id = :video_id";

    let sqlParams = {
        "title": body.title,
        "content": body.content,
        "thumbnail": body.thumbnail_id ? body.thumbnail_id : 0,
        "tags": body.tags,
        "user_id": body.user_id,
        "video_id": body.video_id,
    }

    let result = await db.qry(sql, sqlParams);

    if (!result['success'] || result['rows'].length < 1) {
        return jresp.sqlError();
    }

    if (result['rows']['insertId'] < 1) {
        console.log("not insrt")
        return jresp.sqlError();
    }

    return jresp.successData({ id: result['rows']['insertId'] });
}

async function editVideoPost(body) {

    let sql = "UPDATE video_post " +
        "SET title= if(length(:title) > 0, :title, title)" +
        " , content = if(length(:content) > 0, :content, content)" +
        " , thumbnail = if(:thumbnail_id > -1, :thumbnail_id, thumbnail)" +
        " , tags = if(length(:tags) > 0, :tags, tags)" +
        " , my_info = (select my_info from `user` where id = :user_id)" +
        " , update_at = now()"
        + " WHERE id = :id and user_id = :user_id ";

    let sqlParams = {
        "title": body.title ? body.title : "",
        "content": body.content ? body.content : "",
        "thumbnail_id": body.thumbnail_id ? body.thumbnail_id : body.thumbnail_id === 0 ? body.thumbnail_id : -1,
        "tags": body.tags ? body.tags : "",
        "user_id": body.user_id,
        "id": body.id
    }

    let result = await db.qry(sql, sqlParams);

    if (!result['success'] || result["rows"]["affectedRows"] < 1) {
        return jresp.sqlError();
    }

    return jresp.successData();
}


module.exports = router