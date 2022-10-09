const reportService = {}

reportService.insertReport = async (body) => {

    let sql = "INSERT INTO report_history (target, target_id, reason, content, user_id, category) " +
        "VALUES( :target, :target_id, :reason, :content, :user_id, :category) "
    let sqlParams = {
        target: body.target,
        target_id: body.target_id,
        reason: body.reason,
        content: body.content,
        user_id: body.user_id,
        category: body.category_id
    }

    let result = await db.qry(sql, sqlParams)
    console.log(result);

    if (!result['success'] || result['rows']['insertId'] < 1) {
        console.log("insert fail");
        return jresp.sqlError();
    }

    let insId = result['rows']['insertId'];
    console.log(insId);

    return jresp.successData({id: insId});
}

reportService.updateVideoBlindChkFromReport = async (id, chk, where) => {

    let condition = ""

    if (!where) {
        condition = `where id = (select target_id from report_history where id = ${id} and target = "video")`
    }
    else {
        condition = `where id = ${id} `
    }

    let sql = `update video_post 
                set blind_chk = ${chk ? 1 : 0}
                ${condition} `

    let result = await db.qry(sql)

    if (!_util.updateChkFromDB(result)) {
        return jresp.sqlError()
    }

    return jresp.successData({chk: chk});
}

reportService.updateReplyBlindChkFromReport = async (id, chk, where) => {

    let condition = ""

    if (!where) {
        condition = `where id = (select target_id from report_history where id = ${id} and target = "reply") `
    }
    else {
        condition = `where id = ${id} `
    }


    let sql = `update reply_at_video 
                set blind_chk = ${chk ? 1 : 0}
                ${condition} `

    let result = await db.qry(sql)

    if (!_util.updateChkFromDB(result)) {
        return jresp.sqlError()
    }

    return jresp.successData({chk: chk});
}

reportService.chkDuplicateReport = async (type, targetId, userId) => {

    let sql = `select count(*) as cnt
                from report_history 
                where target = :type
                and target_id = :target_id
                and user_id = :user_id`
    let sqlP = {
        type:type,
        target_id : targetId,
        user_id :userId
    }

    let result = await db.qry(sql, sqlP);

    console.log(result)

    let chk = _util.selectChkFromDB(result);

    if (chk < 1) {
        return -1
    }

    return result["rows"][0]["cnt"];

}


reportService.getReportCategory = async () => {

    let sql = `select id_key as id, value as reason 
                from others_meta 
                where \`type\` = "report"
                order by id_key `

    let result = await db.qry(sql);

    let chk = _util.selectChkFromDB(result);

    if (chk < 0) {
        return jresp.sqlError();
    }

    if (chk === 0) {
        return jresp.emptyData();
    }

    return jresp.successData(result["rows"]);
}


reportService.getReportSimpleList = async (limit, offset) => {

    let sql = `select id, target, target_id, reason, create_at, category 
                from report_history 
                order by id desc
                limit ${limit} offset ${offset - 1} 
                `
    let result = await db.qry(sql);

    let chk = _util.selectChkFromDB(result);

    if (chk < 0) {
        return jresp.sqlError();
    }

    if (chk === 0) {
        return jresp.emptyData();
    }

    return jresp.successData(result["rows"]);
}


// 비디오 신고 내역 검색
reportService.searchReportVideoHistory = async (category, limit, offset, keywords) => {

    let head = `select a.id, a.target_id as post_id, target 
                        , a.category , a.reason
                        , b.thumbnail ,b.title , a.create_at
                        , a.user_id as reporting_uid
                        , c.nickname as reporting_nickname
                        , b.blind_chk
                        , b.user_id as reported_uid
                        , d.nickname as reported_nickname
                from report_history a
                inner join video_post b
                on a.target_id = b.id
                inner join \`user\` c
                on a.user_id = c.id
                inner join \`user\` d
                on b.user_id = d.id
                where a.target = "video" `

    let condition = "";

    if (category > 0) {
        condition = ` and a.category = ${category} `
    }

    let searchQry = _util.createConditionQryForSearch("concat(c.nickname, ' ',b.title)", "and", keywords, "and");
    let order = ` order by a.create_at desc, a.id desc
                limit ${limit} offset ${offset - 1}`

    let sql = head + condition + searchQry + order;

    let result = await db.qry(sql);

    let chk = _util.selectChkFromDB(result);

    if (chk < 0) {
        return jresp.sqlError();
    }

    if (chk === 0) {
        return jresp.emptyData();
    }

    let data = result["rows"];

    for (let item of data) {
        item.thumbnail = _util.createImgDownPath(item.thumbnail)
        item.blind_chk = item.blind_chk > 0
    }

    let sql2 = `select count(*) as total
                from report_history a
                inner join video_post b
                on a.target_id = b.id
                inner join \`user\` c
                on a.user_id = c.id
                where a.target = "video" `

    result = await db.qry(sql2 + condition + searchQry)

    chk = _util.selectChkFromDB(result);

    if (chk < 1) {
        return jresp.sqlError();
    }

    console.log(result);

    let total = result["rows"][0]["total"];

    return jresp.successData(data, data.length, total);
}

// 댓글 신고 내역 검색
reportService.searchReportReplyHistory = async (category, limit, offset, keywords) => {

    let head = `select a.id, a.target_id as reply_id, target 
                        , a.category, a.reason, a.create_at
                        , a.user_id as reporting_uid
                        , c.nickname as reporting_nickname
                        , b.blind_chk
                        , b.user_id as reported_uid
                        , d.nickname as reported_nickname
                from report_history a
                inner join reply_at_video b
                on a.target_id = b.id
                inner join \`user\` c
                on a.user_id = c.id
                inner join \`user\` d
                on b.user_id = d.id
                where a.target = "reply" `

    let condition = "";

    if (category > 0) {
        condition = ` and a.category = ${category} `
    }

    let searchQry = _util.createConditionQryForSearch("concat(c.nickname, ' ', d.nickname)", "and", keywords, "and");
    let order = ` order by a.create_at desc, a.id desc
                limit ${limit} offset ${offset - 1}`

    let sql = head + condition + searchQry + order;

    let result = await db.qry(sql);

    let chk = _util.selectChkFromDB(result);

    if (chk < 0) {
        return jresp.sqlError();
    }

    if (chk === 0) {
        return jresp.emptyData();
    }

    let data = result["rows"];

    for (let item of data) {
        item.blind_chk = item.blind_chk > 0
    }

    let sql2 = `select count(*) as total
                from report_history a
                inner join reply_at_video b
                on a.target_id = b.id
                inner join \`user\` c
                on a.user_id = c.id
                inner join \`user\` d
                on b.user_id = d.id
                where a.target = "reply" `

    result = await db.qry(sql2 + condition + searchQry)

    chk = _util.selectChkFromDB(result);

    if (chk < 1) {
        return jresp.sqlError();
    }

    console.log(result);

    let total = result["rows"][0]["total"];

    return jresp.successData(data, data.length, total);
}

// 비디오 신고 상세 읽기
reportService.readReportVideoDetail = async (id) => {

    let sql = `select a.id, a.target_id as post_id, target 
                        , a.category, a.reason, a.content 
                        , b.thumbnail ,b.title, b.video 
                        , b.view_cnt, b.like_cnt, b.reply_cnt, b.dibs_cnt
                        , ifnull(ROUND(b.score_sum/b.score_cnt, 2), 0) as score
                        , a.create_at as report_at, b.create_at as video_create_at
                        , a.user_id as reporting_uid
                        , c.nickname as reporting_nickname
                        , b.blind_chk
                        , b.user_id as reported_uid
                        , d.nickname as reported_nickname
                        , ifnull(sum(e.point_quantity),0) as total_sponsor_points 
                        , count(e.id) as number_of_sponsor
                from report_history a
                inner join video_post b
                on a.target_id = b.id
                inner join \`user\` c
                on a.user_id = c.id
                inner join \`user\` d
                on b.user_id = d.id
                left join sponsor_history e
                on e.video_post_id = b.id
                where a.target = "video"
                and a.id = ${id}`

    let result = await db.qry(sql);

    let chk = _util.selectChkFromDB(result);

    if (chk < 1) {
        return jresp.sqlError();
    }

    let item = result["rows"][0];

    if (item.id === null) {
        return jresp.sqlError();
    }

    item.blind_chk = item.blind_chk > 0
    item.creator_nickname = item.reported_nickname
    item.thumbnail = _util.createImgDownPath(item.thumbnail);
    item.video = _util.createVideoDownPath(item.video);

    return jresp.successData(item,1,1);
}


// 댓글 신고 상세 읽기
reportService.readReportReplyDetail = async (id) => {

    let sql = `select a.id, a.target_id as reply_id, target 
                        , a.category, a.reason, a.content 
                        , vd.thumbnail , vd.title, vd.video 
                        , vd.view_cnt, vd.like_cnt, vd.reply_cnt, vd.dibs_cnt
                        , ifnull(ROUND(vd.score_sum/vd.score_cnt, 2), 0) as score
                        , a.create_at as report_at, b.create_at as reply_create_at, vd.create_at as video_create_at
                        , (select nickname from \`user\` where id = vd.user_id) as creator_nickname
                        , a.user_id as reporting_uid
                        , c.nickname as reporting_nickname
                        , b.content as reply_content 
                        , b.blind_chk
                        , b.user_id as reported_uid
                        , d.nickname as reported_nickname
                        , ifnull(sum(sp.point_quantity),0) as total_sponsor_points 
                        , count(sp.id) as number_of_sponsor
                from report_history a
                inner join reply_at_video b
                on a.target_id = b.id
                inner join \`user\` c
                on a.user_id = c.id
                inner join \`user\` d
                on b.user_id = d.id
                inner join video_post vd
                on vd.id = b.video_post_id 
                left join sponsor_history sp
                on sp.video_post_id = vd.id 
                where a.target = "reply"
                and a.id = ${id}`

    let result = await db.qry(sql);

    let chk = _util.selectChkFromDB(result);

    if (chk < 1) {
        return jresp.sqlError();
    }

    let item = result["rows"][0];

    if (item.id === null) {
        return jresp.sqlError();
    }

    item.blind_chk = item.blind_chk > 0
    item.thumbnail = _util.createImgDownPath(item.thumbnail);
    item.video = _util.createVideoDownPath(item.video);

    return jresp.successData(item,1,1);
}


module.exports = reportService;