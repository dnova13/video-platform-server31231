const express = require('express')
const router = express.Router()
const util = require('util')
const videoSv = require('../../../services/videoService')

router.post("/curation/register", async (req, res) => {

    let body = req.body;
    let result

    // insert
    if (!body.id) {

        if (_util.isBlank(body.title)) {
            // console.log("not str")
            return res.json(jresp.invalidData());
        }

        if (!_util.areBeyondZeroArr(body.ins_videos)) {
            // console.log("nor arr")
            return res.json(jresp.invalidData())
        }

        if (body.ins_videos.length < 1) {
            // console.log(" empty")
            return res.json(jresp.invalidData());
        }

        result = await videoSv.insertCuration(body);
    }

    /// update
    else {

        if (!_util.isBeyondZero(body.id)) {
            console.log("under zero");
            return res.json(jresp.invalidData())
        }

        if (!_util.areBeyondZeroArr(body.ins_videos)) {
            console.log("ins not arr")
            return res.json(jresp.invalidData())
        }

        if (!_util.areBeyondZeroArr(body.del_videos)) {
            console.log("del not arr")
            return res.json(jresp.invalidData())
        }

        result = await videoSv.updateCuration(body);
    }

    return res.json(result);

});


router.post("/pick/register", async (req, res) => {

    let body = req.body;
    let result

    // insert
    if (!body.id) {

        if (_util.isBlank(body.title)) {
            console.log("not str")
            return res.json(jresp.invalidData());
        }

        if (!_util.isBeyondZero(body.fid)) {
            console.log("not str")
            return res.json(jresp.invalidData());
        }

        if (!_util.areBeyondZeroArr(body.ins_videos)) {
            console.log("!! nor arr")
            return res.json(jresp.invalidData())
        }

        if (body.ins_videos.length < 1) {
            console.log(" empty")
            return res.json(jresp.invalidData());
        }

        result = await videoSv.insertPick(body);
    }

    /// update
    else {
        if (!_util.isBeyondZero(body.id)) {
            console.log("under zero");
            return res.json(jresp.invalidData())
        }

        if (!_util.areBeyondZeroArr(body.ins_videos)) {
            console.log("ins not arr")
            return res.json(jresp.invalidData())
        }

        if (!_util.areBeyondZeroArr(body.del_videos)) {
            console.log("del not arr")
            return res.json(jresp.invalidData())
        }

        result = await videoSv.updatePick(body);
    }

    return res.json(result);
});



router.post("/pick/delete", async (req, res) => {

    let body = req.body;
    let result

    if (!_util.isBeyondZero(body.id)) {
        console.log("under zero");
        return res.json(jresp.invalidData())
    }

    result = await videoSv.deletePick(body.id);
    return res.json(result);
});

// 픽
router.get("/pick/list", async (req, res) => {

    let limit = req.query.limit;
    let offset = req.query.offset;

    if (!_util.areBeyondZero(limit, offset)) {
        return res.json(jresp.invalidData());
    }

    let sql = `select id, title, thumbnail, create_at
                    , (select count(*) from video_manager where parent_id = a.id) as list_cnt   
                from video_manager a
                where parent_id = 0  
                and \`type\` = 'pick'  
                order by id desc 
                limit ${limit} offset ${offset - 1} 
                `
    let result = await db.qry(sql);

    if (!result['success']) {
        return res.json(jresp.sqlError());
    }

    if (result['rows'].length < 1) {
        return res.json(jresp.emptyData());
    }

    let data = result["rows"];

    for (let item of data) {
        item.thumbnail = _util.createImgDownPath(item.thumbnail)
    }


    let sql2 = `select count(*) as total   
                from video_manager a
                where parent_id = 0  
                and \`type\` = 'pick'  
                `
    let result2 = await db.qry(sql2);

    if (!result['success']) {
        return res.json(jresp.sqlError());
    }

    if (result['rows'].length < 1) {
        return res.json(jresp.sqlError());
    }

    return res.json(jresp.successData(data, data.length, result2["rows"]["0"]["total"]));
});


// 하나의 픽 영상 리스트
router.get("/pick/:id", async (req, res) => {

    let pickId = req.params.id

    if (!_util.isBeyondZero(pickId)) {
        return res.json(jresp.invalidData());
    }

    let sql = "select video_post_id as id, parent_id, a.id as child_id " +
        " , a.title as playlist_title " +
        " , b.title as video_title " +
        " , b.view_cnt , b.like_cnt, b.dibs_cnt, b.reply_cnt " +
        " , ifnull(ROUND(b.score_sum/b.score_cnt, 2), 0) as score " +
        " , b.user_id  " +
        " , (select nickname from `user` where id = b.user_id ) as nickname  " +
        " , (select icon from `user` where id = b.user_id ) as icon   " +
        " , b.thumbnail " +
        " , a.thumbnail as pick_thumbnail, b.video " +
        " , ifnull((select duration from files where `uuid` = b.video and file_type = 1  limit 1),0) as duration " +
        " , b.create_at, b.update_at " +
        "from ( " +
        `select b.video_post_id, b.parent_id 
                                   , b.id
                                   , a.thumbnail, a.title
                            from video_manager a
                            inner join video_manager b
                            on a.id = b.parent_id 
                            where b.parent_id = ${pickId} 
                            and b.\`type\` = 'pick' ` +
        ") a " +
        "inner join video_post b  " +
        "on a.video_post_id = b.id " +
        "order by a.id asc ";

    let result = await db.qry(sql);

    if (!result['success']) {
        return res.json(jresp.sqlError());
    }

    if (result['rows'].length < 1) {
        return res.json(jresp.emptyData());
    }

    let data = result["rows"];
    let header = {};
    let i = 0;

    for (let item of data) {

        if (i < 1) {
            header.title = item.playlist_title
            header.thumbnail = _util.createImgDownPath(item.pick_thumbnail)
            header.id = item.parent_id
        }

        i++;

        delete item.playlist_title;
        delete item.pick_thumbnail;

        item.title = item.video_title;
        item.icon = _util.createImgDownPath(item.icon);
        item.thumbnail = _util.createImgDownPath(item.thumbnail)
        item.video = _util.createVideoDownPath(item.video)

        delete item.video_title;
    }

    let __res = {
        "title": header,
        "pick_list": data
    }

    return res.json(jresp.successData(__res, data.length + 1, data.length + 1));
});



// 큐레이션
router.get("/curation", async (req, res) => {

    let sql = "select  b.id, a.parent_id, a.id as child_id, a.curation_title " +
        " , b.title " +
        " , b.view_cnt , b.like_cnt, b.dibs_cnt, b.reply_cnt   " +
        " , ifnull(ROUND(b.score_sum/b.score_cnt, 2), 0) as score " +
        " , b.user_id  " +
        " , (select nickname from `user` where id = b.user_id ) as nickname  " +
        " , (select icon from `user` where id = b.user_id ) as icon   " +
        " , b.thumbnail, b.video " +
        " , ifnull((select duration from files where `uuid` = b.video and file_type = 1  limit 1),0) as duration " +
        " , b.create_at, b.update_at " +
        "from ( " +
        `select b.video_post_id, b.parent_id 
                       , b.id
                       , a.title as curation_title
                from video_manager a
                inner join video_manager b
                on a.id = b.parent_id  
                where b.\`type\` = 'curation'
                and b.parent_id > 0 ` +
        ") a " +
        "inner join video_post b  " +
        "on a.video_post_id = b.id " +
        "order by a.id asc "

    let result = await db.qry(sql);

    if (!result['success']) {
        return res.json(jresp.sqlError());
    }

    if (result['rows'].length < 1) {
        return res.json(jresp.emptyData());
    }

    let data = result["rows"];

    let __data = {
        id: 0,
        title: "",
        list: []
    }

    let i = 0;
    for (let item of data) {

        if (i === 0) {

            __data.id = item.parent_id;
            __data.title = item.curation_title;
        }
        else {
            delete item.curation_title
        }

        item.icon = _util.createImgDownPath(item.icon);
        item.thumbnail = _util.createImgDownPath(item.thumbnail)
        item.video = _util.createVideoDownPath(item.video)

        __data.list.push(item);

        i++;
    }

    return res.json(jresp.successData(__data, __data.list.length, __data.list.length));
});

module.exports = router;