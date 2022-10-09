const express = require('express')
const router = express.Router()
const util = require('util')
const videoSv = require('../../services/videoService')

// 영상 검색
router.get("/search", async (req, res) => {

    let keyword = req.query.keyword;
    let limit = req.query.limit;
    let offset = req.query.offset;

    if (!_util.hasKey(req.query, "keyword")) {
        return res.json(jresp.invalidData());
    }

    if (!_util.areBeyondZero(limit, offset)) {
        return res.json(jresp.invalidData());
    }

    let result = await videoSv.searchVideoListForAdmin(1, limit, offset, keyword);
    return res.json(result);
});


// 지금 화제 영상
router.get("/now", async (req, res) => {

    let limit = req.query.limit;
    let offset = req.query.offset;

    if (!_util.areBeyondZero(limit, offset)) {
        return res.json(jresp.invalidData());
    }

    return res.json(await getListDailyChart(1, limit, offset))
});

// 영상 차트
router.get("/chart", async (req, res) => {

    let limit = req.query.limit;
    let offset = req.query.offset;

    if (!_util.areBeyondZero(limit, offset)) {
        return res.json(jresp.invalidData());
    }

    return res.json(await getListDailyChart(2, limit, offset));
});


// 새로운 크레이터
router.get("/new-creator", async (req, res) => {

    let limit = req.query.limit;
    let offset = req.query.offset;

    if (!_util.areBeyondZero(limit, offset)) {
        return res.json(jresp.invalidData());
    }

    let sql = "select a.user_id, b.icon, b.nickname " +
        " , a.intro, a.create_at " +
        "from creator a " +
        "inner join `user` b " +
        "on a.user_id = b.id " +
        "where date_format(a.create_at,'%Y-%m-%d') <= current_date() - 1 " +
        "order by create_at desc " +
        `limit ${limit} offset ${offset - 1} `;

    let result = await db.qry(sql);

    if (!result['success']) {
        return res.json(jresp.sqlError());
    }

    if (result['rows'].length < 1) {
        return res.json(jresp.emptyData());
    }


    let data = result["rows"];

    for (let item of data) {

        item.icon = _util.createImgDownPath(item.icon);
    }

    let sql2 = "select count(*) as cnt " +
        "from creator a " +
        "where date_format(a.create_at,'%Y-%m-%d') <= current_date() - 1"

    result = await db.qry(sql2);

    let cnt = 0;

    try {
        cnt = result["rows"][0]["cnt"];
    } catch (err) {
        console.log(err.message);
    }

    return res.json(jresp.successData(data, data.length, cnt));

});

// 큐레이션
router.get("/curation", async (req, res) => {

    let sql = "select  b.id, a.parent_id, a.curation_title " +
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
        "where b.blind_chk = 0 " +
        "order by a.id desc "

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

// 픽
router.get("/pick", async (req, res) => {

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
                order by id asc
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

    let sql = "select a.id, video_post_id, parent_id " +
        " , a.title as playlist_title " +
        " , b.title as video_title " +
        " , b.view_cnt , b.like_cnt, b.dibs_cnt, b.reply_cnt " +
        " , ifnull(ROUND(b.score_sum/b.score_cnt, 2), 0) as score " +
        " , b.user_id  " +
        " , (select nickname from `user` where id = b.user_id ) as nickname  " +
        " , (select icon from `user` where id = b.user_id ) as icon   " +
        " , b.thumbnail " +
        " , a.thumbnail as pick_thumbnail" +
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
        " where b.blind_chk = 0 " +
        "order by a.id asc ";

    let result = await db.qry(sql);
    // console.log(result);

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

        delete item.video_title;
    }

    let __res = {
        "title": header,
        "pick_list": data
    }

    return res.json(jresp.successData(__res, data.length + 1, data.length + 1));
});


// 해시 태그별 영상 리스트
router.get("/tags", async (req, res) => {

    let limit = req.query.limit;
    let offset = req.query.offset;
    let _tag = req.query.tag
    let order = req.query.order;

    // console.log(order);
    console.log(_tag);

    if (!_util.areBeyondZero(limit, offset, order)) {
        console.log("is zero");
        return res.json(jresp.invalidData());
    }

    if (_util.isBlank(_tag)) {
        console.log("is blank");
        return res.json(jresp.invalidData());
    }


    let sum;

    switch (parseInt(order)) {

        // 최근 업로드 순
        case 1:
            sum = "";
            break;

        // 추천 많은 순 지난 7일간
        case 2:
            sum = " ifnull(sum(like_cnt), 0) "
            break;

        // 평점 높은 순 지난 7일간
        case 3:
            sum = " ifnull(sum(score_sum), 0) "
            break;

        // 영상 추천순 평점 + 추천 + 찜을 합친 순 지난 7일간
        case 4:
            sum = " ifnull(ifnull(sum(score_sum), 0)/ ifnull(sum(score_cnt),0),0) + ifnull(sum(like_cnt),0) + ifnull(sum(dibs_cnt), 0) "
            break;


        default:
            console.log("!!!")
            return res.json(jresp.invalidData());
    }

    let sql;
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

    let subQry = sum.length > 0 ?
        `, ifnull((    
                             select ${sum}    
                             from daily_video_manager    
                             where daily_date between current_date() - interval 7 day and current_date() - interval 1 day       
                             group by video_post_id    
                             having video_post_id = a.id     
                        ),0) as total ` : "";

    let condition = " from video_post a  " +
        `where json_extract(if(tags = '',null,tags), JSON_UNQUOTE(JSON_SEARCH(tags, 'one', '${_tag}'))) is not null 
                     and a.blind_chk = 0`;


    let orderBy = sum.length > 0 ? " order by total desc, a.id desc" : " order by a.id desc";

    let tail = ` limit ${limit} offset ${offset - 1} `;

    sql = head + subQry + condition + orderBy + tail;

    // console.log("sql ", sql);

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
        // delete item.total;
    }

    let total = await getTotalTagList(_tag);

    return res.json(jresp.successData(data, data.length, total));
});

async function getTotalTagList(_tag) {

    let sql2 = "select count(*) as total " +
        "from video_post " +
        `where json_extract(if(tags = '',null,tags), JSON_UNQUOTE(JSON_SEARCH(tags, 'one', '${_tag}'))) is not null 
                 and blind_chk = 0 `;

    let result = await db.qry(sql2);

    if (!result['success'] || result['rows'].length < 1) {
        return 0;
    }

    return result["rows"][0]["total"];
}


// 추천 영상 리스트
router.get("/recommend", async (req, res) => {

    let limit = req.query.limit;
    let offset = req.query.offset;

    if (!_util.areBeyondZero(limit, offset)) {
        console.log("is zero");
        return res.json(jresp.invalidData());
    }

    let sql;
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

    let subQry = `, ifnull((    
                             select  ifnull(ifnull(sum(score_sum), 0)/ ifnull(sum(score_cnt),0),0) + ifnull(sum(like_cnt),0) + ifnull(sum(dibs_cnt), 0)      
                             from daily_video_manager    
                             where daily_date between current_date() - interval 7 day and current_date() - interval 1 day       
                             group by video_post_id    
                             having video_post_id = a.id     
                        ),0) as total `;

    let condition = " from video_post a where a.blind_chk = 0  ";
    let orderBy = " order by total desc, a.id desc";
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
        // delete item.total;
    }

    let total = await getTotalVideoList();

    return res.json(jresp.successData(data, data.length, total));
});

async function getTotalVideoList() {

    let sql2 = "select count(*) as total " +
        "from video_post " +
        "where blind_chk = 0 ";

    let result = await db.qry(sql2);
    console.log(result);

    if (!result['success'] || result['rows'].length < 1) {
        return 0;
    }

    return result["rows"][0]["total"];
}

router.get("/dibs", async (req, res) => {

    let uid = req.uinfo["u"];
    let limit = req.query.limit;
    let offset = req.query.offset;

    if (!_util.areBeyondZero(limit, offset)) {
        console.log("is zero");
        return res.json(jresp.invalidData());
    }

    let sql = "SELECT a.id, a.view_cnt   " +
        " , like_cnt    " +
        " , ifnull(ROUND(a.score_sum/a.score_cnt, 2), 0) as score   " +
        " , title    " +
        " , a.user_id     " +
        " , (select nickname from `user` where id = a.user_id ) as nickname   " +
        " , (select icon from `user` where id = a.user_id ) as icon    " +
        " , a.thumbnail   " +
        " , ifnull((select duration from files where `uuid` = a.video and file_type = 1  limit 1),0) as duration " +
        " , a.create_at , a.update_at " +
        "from video_post a  " +
        "inner join video_post_meta b " +
        "on a.id = b.video_post_id " +
        "where b.user_id = :uid " +
        "and b.`type` = 'dibs' " +
        "and a.blind_chk = 0 " +
        `order by b.create_at desc limit ${limit} offset ${offset - 1}`

    let sqlParams = { uid: uid };

    let result = await db.qry(sql, sqlParams);

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
    }

    let total = await getTotalDibsList(uid);

    return res.json(jresp.successData(data, data.length, total));
});


async function getTotalDibsList(uid) {

    let sql2 = "select count(*) as total " +
        "from video_post a  " +
        "inner join video_post_meta b " +
        "on a.id = b.video_post_id " +
        "where b.user_id = :uid " +
        "and b.`type` = 'dibs' " +
        "and a.blind_chk = 0 "
    let sqlP = { uid: uid };

    let result = await db.qry(sql2, sqlP);
    console.log(result);

    if (!result['success'] || result['rows'].length < 1) {
        return 0;
    }

    return result["rows"][0]["total"];
}


router.post("/check/:type", async (req, res) => {

    console.log("meta chk");

    let videoPostId = req.body.id;
    let mType = req.params.type;

    console.log(videoPostId, mType);

    let types = ['like', 'dibs']
    let uid = req.uinfo["u"];
    let result

    if (!_util.isBeyondZero(videoPostId)) {
        console.log("under zero");
        return res.send(jresp.invalidData());
    }

    if (!types.includes(mType)) {
        console.log("not type");
        return res.send(jresp.invalidData());
    }

    result = await isChkVideoMeta(uid, mType, videoPostId);

    console.log(result);

    switch (result) {

        case 0:
            result = await chkVideoMeta(mType, uid, videoPostId);
            break;

        case 1:
            result = await unChkVideoMeta(mType, uid, videoPostId);
            break;

        default:
            return res.json(jresp.sqlError());
    }

    return res.json(result);
});


async function getListDailyChart(_type, limit, offset) {

    let result;
    let condition = "";

    switch (_type) {

        case 1:
            condition = `order by view_rate desc, like_rate desc, video_post_id desc limit ${limit} offset ${offset - 1}`
            break;
        case 2:
            condition = `order by like_rate + 60  + view_rate+ 40  desc, like_rate desc, view_rate desc, video_post_id desc limit ${limit} offset ${offset - 1}`
            break;

        default:
            return jresp.invalidData();
    }

    let sql = util.format(
        `SELECT a.id, a.view_cnt  
                     , like_cnt   
                     , ifnull(ROUND(a.score_sum/a.score_cnt, 2), 0) as score  
                     , title   
                     , a.user_id    
                     , (select nickname from \`user\` where id = a.user_id ) as nickname  
                     , (select icon from \`user\` where id = a.user_id ) as icon   
                     , a.thumbnail  
                     , ifnull((select duration from files where \`uuid\` = a.video and file_type = 1 limit 1),0) as duration   
                     , a.create_at, a.update_at  
                from video_post a   
                inner join (  
                         select prv.video_post_id 
                                , ifnull(cur.view_cnt, 0) - prv.view_cnt as view_rate
                                , ifnull(cur.like_cnt, 0) - prv.like_cnt as like_rate
                        from daily_video_manager prv
                        left outer join (
                            select id, video_post_id, like_cnt, view_cnt, daily_date
                            from daily_video_manager 
                            where daily_date = current_date()
                        ) cur
                        on cur.video_post_id = prv.video_post_id
                        where prv.daily_date = current_date() - 1  
                         %s 
                ) b ` +
        "on a.id = b.video_post_id where a.blind_chk = 0", condition);

    result = await db.qry(sql);

    if (!result['success']) {
        return jresp.sqlError();
    }

    if (result['rows'].length < 1) {
        return jresp.emptyData();
    }

    let data = result["rows"];

    for (let item of data) {

        item.icon = _util.createImgDownPath(item.icon);
        item.thumbnail = _util.createImgDownPath(item.thumbnail)
    }

    return jresp.successData(data, data.length, data.length);
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

    console.log(result['rows']['insertId']);

    let sql2 = "update video_post " +
        `set ${type}_cnt = ifnull(${type}_cnt,0) + 1 ` +
        `where id = ${videoPostId} `

    result = await db.qry(sql2)

    return jresp.successData({ chk: true });
}

async function unChkVideoMeta(type, uid, videoPostId) {

    console.log("unchkVideoMeta");

    let sql = "delete from video_post_meta " +
        "where video_post_id = :video_post_id " +
        "and user_id = :user_id " +
        "and `type` = :type ";
    let sqlParams = { user_id: uid, type: type, video_post_id: videoPostId }

    let result = await db.qry(sql, sqlParams);

    if (!result['success'] || result['rows']['affectedRows'] < 1) {
        return jresp.sqlError();
    }

    console.log(result['rows']['affectedRows']);

    let sql2 = "update video_post " +
        `set ${type}_cnt = if( ifnull(${type}_cnt, 0) - 1 < 0, 0, ifnull(${type}_cnt, 0) - 1) ` +
        `where id = ${videoPostId} `

    result = await db.qry(sql2);

    return jresp.successData({ chk: false });
}


module.exports = router