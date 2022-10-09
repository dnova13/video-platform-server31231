let userActivityService = {}


let postSqlHead = `select a.id, title, thumbnail
                        , a.user_id
                        , (select nickname from \`user\` where id = a.user_id ) as nickname
                        , (select icon from \`user\` where id = a.user_id ) as user_icon 
                        , view_cnt
                        , like_cnt
                        , ifnull(ROUND(score_sum/score_cnt, 2), 0) as score   
                        , ifnull((select duration from files where \`uuid\` = a.video and file_type = 1  limit 1), 0) as duration
                        , a.create_at, b.create_at as active_at
                    from video_post a
                    `

/// 댓글 단 내역
userActivityService.getRepliedVideoPostByUserId = async (uid, limit, offset) => {

    let sql = postSqlHead + `inner join (
                      select video_post_id, max(create_at) as create_at
                      from reply_at_video 
                      where user_id = ${uid}
                      group by video_post_id 
                      order by max(create_at) desc
                ) b
                on a.id = b.video_post_id
                where a.blind_chk = 0 
                limit ${limit} offset ${offset - 1}`

    let result = await db.qry(sql);
    console.log(result);

    if (!result['success']) {
        return jresp.sqlError();
    }

    if (result['rows'].length < 1) {
        return jresp.emptyData();
    }

    let data = result["rows"];

    for (let item of data) {
        item.thumbnail = _util.createImgDownPath(item.thumbnail)
        item.user_icon = _util.createImgDownPath(item.user_icon);
    }

    // total 구하기
    let sql2 = `select count(*) as total
                from video_post a
                inner join (
                  select video_post_id, max(create_at) as create_at
                  from reply_at_video 
                  where user_id = ${uid}
                  group by video_post_id 
                ) b
                on a.id = b.video_post_id
                where a.blind_chk = 0 `;

    result = await db.qry(sql2);
    console.log(result);

    let total = 0;

    if (!result['success'] || result['rows'].length < 1) {
        total = 0;
    }
    else
        total = result["rows"][0]["total"];

    console.log(total);

    return jresp.successData(data, data.length, total);
}

// 추천 보낸 게시물
userActivityService.getRecommendVideoPostByUserId = async (uid, limit, offset) => {

    let _type = "like";
    let sql = postSqlHead
            + `inner join video_post_meta b
                on a.id = b.video_post_id
                where b.user_id = ${uid}
                and \`type\` = '${_type}'
                and a.blind_chk = 0
                order by b.create_at desc
                limit ${limit} offset ${offset - 1}`

    let result = await db.qry(sql);
    console.log(result);

    if (!result['success']) {
        return jresp.sqlError();
    }

    if (result['rows'].length < 1) {
        return jresp.emptyData();
    }

    let data = result["rows"];

    for (let item of data) {
        item.thumbnail = _util.createImgDownPath(item.thumbnail)
        item.user_icon = _util.createImgDownPath(item.user_icon);
    }

    // total 구하기
    let sql2 = `select count(*) as total
                from video_post a
                inner join video_post_meta b
                on a.id = b.video_post_id
                where b.user_id = ${uid}
                and \`type\` = '${_type}'
                and a.blind_chk = 0`;

    result = await db.qry(sql2);
    console.log(result);

    let total = 0;

    if (!result['success'] || result['rows'].length < 1) {
        total = 0;
    }
    else
        total = result["rows"][0]["total"];

    console.log(total);
    return jresp.successData(data, data.length, total);
}

// 평점 남긴 게시물
userActivityService.getScoredVideoPostByUserId = async (uid, limit, offset) => {

    let _type = "score";
    let sql = postSqlHead
        + `inner join video_post_meta b
                    on a.id = b.video_post_id
                    where b.user_id = ${uid}
                    and \`type\` = '${_type}'
                    and a.blind_chk = 0
                    order by b.create_at desc
                    limit ${limit} offset ${offset - 1}`

    let result = await db.qry(sql);
    console.log(result);

    if (!result['success']) {
        return jresp.sqlError();
    }

    if (result['rows'].length < 1) {
        return jresp.emptyData();
    }

    let data = result["rows"];

    for (let item of data) {
        item.thumbnail = _util.createImgDownPath(item.thumbnail)
        item.user_icon = _util.createImgDownPath(item.user_icon);
    }

    // total 구하기
    let sql2 = `select count(*) as total
                from video_post a
                inner join video_post_meta b
                on a.id = b.video_post_id
                where b.user_id = ${uid}
                and \`type\` = '${_type}'
                and a.blind_chk = 0`;

    result = await db.qry(sql2);
    console.log(result);

    let total = 0;

    if (!result['success'] || result['rows'].length < 1) {
        total = 0;
    }
    else
        total = result["rows"][0]["total"];

    console.log(total);
    return jresp.successData(data, data.length, total);
}

// 최근 본 게시물
userActivityService.getRecentPostByUserId = async (uid, limit, offset) => {

    let _type = "recent";
    let sql = postSqlHead
            + `inner join video_post_meta b
                    on a.id = b.video_post_id
                    where b.user_id = ${uid}
                    and \`type\` = '${_type}'
                    and a.blind_chk = 0
                    order by b.create_at desc
                    limit ${limit} offset ${offset - 1}`

    let result = await db.qry(sql);
    console.log(result);

    if (!result['success']) {
        return jresp.sqlError();
    }

    if (result['rows'].length < 1) {
        return jresp.emptyData();
    }

    let data = result["rows"];

    for (let item of data) {
        item.thumbnail = _util.createImgDownPath(item.thumbnail)
        item.user_icon = _util.createImgDownPath(item.user_icon);
    }

    // total 구하기
    let sql2 = `select count(*) as total
                from video_post a
                inner join video_post_meta b
                on a.id = b.video_post_id
                where b.user_id = ${uid}
                and \`type\` = '${_type}'
                and a.blind_chk = 0`;

    result = await db.qry(sql2);
    console.log(result);

    let total = 0;

    if (!result['success'] || result['rows'].length < 1) {
        total = 0;
    }
    else
        total = result["rows"][0]["total"];

    console.log(total);
    return jresp.successData(data, data.length, total);
}

module.exports = userActivityService;


