const express = require('express')
const router = express.Router()
const util = require('util')


router.get("/video", async (req, res) => {

    let keyword = req.query.keyword;
    let limit = req.query.limit;
    let offset = req.query.offset;
    let order = req.query.order;

    console.log(req.query)

    if (!_util.hasKey(req.query, "keyword")) {
        console.log("not keyword")
        return res.json(jresp.invalidData());
    }

    if (!_util.areBeyondZero(limit, offset, order)) {
        console.log("under zero")
        return res.json(jresp.invalidData());
    }

    let orderBy;

    switch (parseInt(order)) {

        // 최신순
        case 1:
            orderBy = " order by a.id desc ";
            break;

        // 좋아요 순
        case 2:
            orderBy = " order by a.like_cnt desc, id desc ";
            break;

        // 평점 순
        case 3:
            orderBy = " order by a.score_sum desc, id desc ";
            break;

        // 추천 순
        case 4:
            orderBy = " order by ifnull(a.score_sum/a.score_cnt,0) + a.like_cnt + a.dibs_cnt desc, a.id desc ";
            break;

        default:
            console.log("invalid Order name");
            return res.json(jresp.invalidData());
    }

    let head = `SELECT a.id, a.view_cnt    
                     , a.like_cnt     
                     , ifnull(ROUND(a.score_sum/a.score_cnt, 2), 0) as score    
                     , a.title     
                     , a.user_id, b.nickname    
                     , (select icon from \`user\` where id = a.user_id ) as icon     
                     , a.thumbnail    
                     , ifnull((select duration from files where \`uuid\` = a.video and file_type = 1  limit 1),0) as duration  
                     , a.create_at, a.update_at  
                from video_post a 
                inner join \`user\` b
                on a.user_id = b.id 
                `  ;

    let searchQry = _util.createConditionQryForSearch(`concat(a.title," ",b.nickname," ",a.tags )`, "and", keyword);
    let otherCondition = ` and a.blind_chk = 0 `
    let tail = ` limit ${limit} offset ${offset - 1} `;

    let sql = head + searchQry + otherCondition + orderBy + tail;

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
        item.icon = _util.createImgDownPath(item.icon)
    }

    let total = await getTotalVideoSearch(searchQry);

    return res.json(jresp.successData(data, data.length, total));

});

router.get("/creator", async (req, res) => {

    let keyword = req.query.keyword;
    let limit = req.query.limit;
    let offset = req.query.offset;

    if (!_util.hasKey(req.query, "keyword")) {
        console.log("not keyword")
        return res.json(jresp.invalidData());
    }

    if (!_util.areBeyondZero(limit, offset)) {
        console.log("under zero")
        return res.json(jresp.invalidData());
    }

    let searchQry = _util.createConditionQryForSearch("b.nickname", "and", keyword);

    let sql = "select b.id, b.nickname, b.icon  " +
        "from creator a " +
        "inner join `user` b " +
        "on a.user_id = b.id " +
        searchQry +
        "order by nickname asc " +
        `limit ${limit} offset ${offset - 1}`

    let sqlParams = { keyword: keyword };

    let result = await db.qry(sql, sqlParams);

    if (!result['success']) {
        return res.json(jresp.sqlError());
    }

    if (result['rows'].length < 1) {
        return res.json(jresp.emptyData());
    }

    let data = result["rows"];

    for (let item of data) {
        item.icon = _util.createImgDownPath(item.icon)
    }

    let total = await getTotalCreator(searchQry);

    return res.json(jresp.successData(data, data.length, total));
});


router.get("/tags", async (req, res) => {

    let keyword = req.query.keyword;
    let limit = req.query.limit;
    let offset = req.query.offset;
    let order = req.query.order;

    if (!_util.hasKey(req.query, "keyword")) {
        console.log("not keyword")
        return res.json(jresp.invalidData());
    }

    if (!_util.areBeyondZero(limit, offset, order)) {
        console.log("under zero")
        return res.json(jresp.invalidData());
    }

    let orderBy;

    switch (parseInt(order)) {

        // 최신순
        case 1:
            orderBy = " order by id desc ";
            break;

        // 좋아요 순
        case 2:
            orderBy = " order by like_cnt desc, id desc ";
            break;

        // 평점 순
        case 3:
            orderBy = " order by score_sum desc, id desc ";
            break;

        // 추천 순
        case 4:
            orderBy = " order by ifnull(score_sum/score_cnt,0) + like_cnt + dibs_cnt desc, id desc ";
            break;

        default:
            console.log("invalid Order name");
            return res.json(jresp.invalidData());
    }

    let head = "SELECT a.id, a.view_cnt   " +
        " , like_cnt    " +
        " , ifnull(ROUND(a.score_sum/a.score_cnt, 2), 0) as score   " +
        " , title    " +
        " , a.user_id     " +
        " , (select nickname from `user` where id = a.user_id ) as nickname   " +
        " , (select icon from `user` where id = a.user_id ) as icon    " +
        " , a.thumbnail   " +
        " , ifnull((select duration from files where `uuid` = a.video and file_type = 1 limit 1),0) as duration " +
        " , tags" +
        " , create_at , update_at " +
        " from video_post a ";

    let searchQry = _util.createConditionQryForSearch("tags", "and", keyword);
    let otherCondition = ` and a.blind_chk = 0 `

    let tail = ` limit ${limit} offset ${offset - 1} `;
    let sql = head + searchQry + otherCondition + orderBy + tail;

    let result = await db.qry(sql)

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
        item.tags = item.tags ? JSON.parse(item.tags) : [];
    }

    let total = await getTotalTagsSearch(searchQry);

    return res.json(jresp.successData(data, data.length, total));
});

router.get("/recommend/words", async (req, res) => {

    let sql = "select value as word " +
        "from others_meta " +
        "where `type` = 'recommend_word' " +
        "order by value asc, create_at desc"

    let result = await db.qry(sql);

    if (!result['success']) {
        return res.json(jresp.sqlError());
    }

    if (result['rows'].length < 1) {
        return res.json(jresp.emptyData());
    }

    let data = result["rows"];

    return res.json(jresp.successData(data, data.length, data.length));
})

async function getTotalVideoSearch(searchQry) {

    let head = `select count(*) as total
                from video_post a
                inner join \`user\` b
                on a.user_id = b.id
                `
    let otherCondition = ` and a.blind_chk = 0 `

    let sql = head + searchQry + otherCondition;

    let result = await db.qry(sql);
    console.log(result);

    if (!result['success'] || result['rows'].length < 1) {
        return 0;
    }

    return result["rows"][0]["total"];
}


async function getTotalTagsSearch(searchQry) {

    let head = "select count(*) as total " +
        "from video_post "
    let otherCondition = ` and blind_chk = 0 `
    let sql = head + searchQry + otherCondition;

    let result = await db.qry(sql);
    console.log(result);

    if (!result['success'] || result['rows'].length < 1) {
        return 0;
    }

    return result["rows"][0]["total"];
}


async function getTotalCreator(searchQry) {

    let head = "select count(*) as total " +
        "from creator a " +
        "inner join `user` b " +
        "on a.user_id = b.id "
    let sql = head + searchQry;

    let result = await db.qry(sql);
    console.log(result);

    if (!result['success'] || result['rows'].length < 1) {
        return 0;
    }

    return result["rows"][0]["total"];
}



module.exports = router;