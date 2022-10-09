const videoReplyService = {}

videoReplyService.getLv0ReplyListByPostId = async (limit, offset, postId, blindChk) => {

    let result;
    let qr = {
        id: postId,
        limit: limit,
        offset: offset
    };

    let blindParam = " , a.blind_chk ";
    let blindCondition = "";

    if (blindChk > -1 && blindChk < 2) {
        blindParam = blindChk > 0 ? blindParam : ``
        blindCondition = `and a.blind_chk = ${blindChk} `
    }

    let sql = "select a.id, video_post_id, reply_lv, content   " +
        "    , a.user_id, b.icon, b.nickname    " +
        "    , a.create_at, a.update_at  " + blindParam +
        "    , (select count(*) " +
        "      from reply_at_video " +
        "      where reply_ref = a.id and video_post_id = :id) as re_total " +
        "from reply_at_video a   " +
        "inner join `user` b   " +
        "on a.user_id = b.id   " +
        "where reply_ref = 0   " +
        "and video_post_id = :id   " + blindCondition +
        "order by a.create_at desc   " +
        `limit ${qr.limit} offset ${qr.offset - 1} `;

    let sqlParams = {
        id: qr.id
    }

    result = await db.qry(sql, sqlParams);

    if (!result['success']) {
        return jresp.sqlError();
    }

    if (result['rows'].length < 1) {
        return jresp.emptyData()
    }

    let data = result["rows"];

    for (let item of data) {

        if (item.blind_chk > -1) {
            item.blind_chk = item.blind_chk > 0
        }

        item.icon = _util.createImgDownPath(item.icon);
    }

    let total = await videoReplyService.getTotalReply(qr.id);

    return jresp.successData(data, data.length, total);
}

videoReplyService.getReReplyListByPostId = async (limit, offset, postId, replyId, blindChk) => {

    let result;
    let qr = {
        id: postId,
        limit: limit,
        offset: offset,
        reply_id: replyId
    };
    let blindParam = " , a.blind_chk ";
    let blindCondition = "";

    if (blindChk > -1 && blindChk < 2) {
        blindParam = blindChk > 0 ? blindParam : ``
        blindCondition = `and a.blind_chk = ${blindChk} `
    }

    let sql = "select a.id, video_post_id, reply_lv, content " +
        " , a.user_id, b.icon, b.nickname " +
        " , a.target_id, (select nickname from `user` where id = a.target_id ) as target_nickname " +
        " , a.create_at, a.update_at  " + blindParam +
        "from reply_at_video a " +
        "inner join `user` b " +
        "on a.user_id = b.id " +
        "where reply_ref = :reply_id " +
        "and video_post_id = :id " + blindCondition +
        "order by a.create_at asc " +
        `limit ${qr.limit} offset ${qr.offset - 1} `;
    let sqlParams = {
        id: qr.id,
        reply_id: qr.reply_id
    }

    result = await db.qry(sql, sqlParams);

    if (!result['success']) {
        return jresp.sqlError();
    }

    if (result['rows'].length < 1) {
        return jresp.emptyData();
    }


    let data = result["rows"];

    for (let item of data) {

        if (item.blind_chk > -1) {
            item.blind_chk = item.blind_chk > 0
        }

        item.icon = _util.createImgDownPath(item.icon);
        item.target_nickname = item.target_nickname ? "@" + item.target_nickname : "";
    }

    let total = await videoReplyService.getTotalReReply(qr.id, qr.reply_id);

    return jresp.successData(data, data.length, total);

}

videoReplyService.getReplyAllListByPostId = async (limit, offset, postId, blindChk) => {

    let result;
    let qr = {
        id: postId,
        limit: limit,
        offset: offset
    };
    let blindParam = " , a.blind_chk ";
    let blindCondition = "";

    if (blindChk > -1 && blindChk < 2) {
        blindParam = blindChk > 0 ? blindParam : ``
        blindCondition = `and a.blind_chk = ${blindChk} `
    }

    let sql = "select a.id, video_post_id, reply_lv, content   " +
        "    , a.user_id, b.icon, b.nickname    " +
        "    , a.create_at, a.update_at  " +
        `    , (
                select count(*) as cnt
                from creator cr
                inner join creator_apply ap
                where cr.user_id = ap.user_id
                and cr.user_id = a.user_id
                and ap.status = 1) as is_creator ` +
        "" + blindParam +
        /*        "    , (select count(*) " +
                "      from reply_at_video " +
                "      where reply_ref = a.id and video_post_id = :id) as re_total " +*/
        "from reply_at_video a   " +
        "inner join `user` b   " +
        "on a.user_id = b.id   " +
        "where reply_ref = 0   " + blindCondition +
        "and video_post_id = :id   " +
        "order by a.create_at desc   " +
        `limit ${qr.limit} offset ${qr.offset - 1} `;
    let sqlParams = {
        id: qr.id
    }

    result = await db.qry(sql, sqlParams);

    if (!result['success']) {
        return jresp.sqlError();
    }

    if (result['rows'].length < 1) {
        return jresp.emptyData();
    }

    let data = result["rows"];
    let reSum = 0;

    for (let item of data) {

        let sql2 = "select a.id, video_post_id, reply_lv, content " +
            " , a.user_id, b.icon, b.nickname " +
            " , a.target_id, (select nickname from `user` where id = a.target_id ) as target_nickname " +
            ` , (
                         select count(*) as cnt
                        from creator cr
                        inner join creator_apply ap
                        where cr.user_id = ap.user_id
                        and cr.user_id = a.user_id
                        and ap.status = 1
                        ) as is_creator ` +
            " , a.create_at, a.update_at  " + blindParam +
            "from reply_at_video a " +
            "inner join `user` b " +
            "on a.user_id = b.id " +
            "where reply_ref = :reply_id " +
            "and video_post_id = :id " + blindCondition +
            "order by a.create_at asc "

        let sqlParams2 = {
            id: item.video_post_id,
            reply_id: item.id
        }

        let result2 = await db.qry(sql2, sqlParams2);

        if (!result2['success']) {
            return jresp.sqlError();
        }

        let data2 = result2["rows"];

        for (let item of data2) {

            if (item.blind_chk > -1) {
                item.blind_chk = item.blind_chk > 0
            }

            item.icon = _util.createImgDownPath(item.icon);
            item.target_nickname = item.target_nickname ? "@" + item.target_nickname : "";
            item.is_creator = item.is_creator > 0;
        }

        if (item.blind_chk > -1) {
            item.blind_chk = item.blind_chk > 0
        }

        item.icon = _util.createImgDownPath(item.icon);
        item.re = data2;
        item.re_total = data2.length;
        item.is_creator = item.is_creator > 0;

        reSum += data2.length;
    }

    let total = await videoReplyService.getTotalReply(qr.id, blindChk);
    let allTotal = await videoReplyService.getTotalAllReply(qr.id, blindChk)

    return jresp.successData(data, data.length, allTotal, total)
}

videoReplyService.getTotalReply = async (_id, blindChk) => {

    let blindParam = " , a.blind_chk ";
    let blindCondition = "";

    if (blindChk > -1 && blindChk < 2) {
        blindParam = blindChk > 0 ? blindParam : ``
        blindCondition = `and blind_chk = ${blindChk} `
    }

    let sql = "select count(*) as total  " +
        "from reply_at_video  " +
        `where reply_ref = 0 and video_post_id = ${_id} ${blindCondition}`

    let result = await db.qry(sql);

    if (!result['success'] || result['rows'].length < 1) {
        return 0;
    }

    return result["rows"][0]["total"];
}


videoReplyService.getTotalAllReply = async (_id, blindChk) => {

    let blindParam = " , a.blind_chk ";
    let blindCondition = "";

    if (blindChk > -1 && blindChk < 2) {
        blindParam = blindChk > 0 ? blindParam : ``
        blindCondition = `and blind_chk = ${blindChk} `
    }

    let sql = "select count(*) as total  " +
        "from reply_at_video  " +
        `where video_post_id = ${_id} ${blindCondition}`

    let result = await db.qry(sql);

    if (!result['success'] || result['rows'].length < 1) {
        return 0;
    }

    return result["rows"][0]["total"];
}

videoReplyService.getTotalReReply = async (_id, replyId) => {

    let sql = "select count(*) as total  " +
        "from reply_at_video  " +
        `where reply_ref = ${replyId} and video_post_id = ${_id} `

    let result = await db.qry(sql);

    if (!result['success'] || result['rows'].length < 1) {
        return 0;
    }

    return result["rows"][0]["total"];
}


videoReplyService.insertReply = async (body, lv) => {

    let sql = "INSERT INTO reply_at_video (reply_ref, video_post_id, reply_lv, content, user_id, target_id) " +
        "VALUES(:reply_id, :id, :lv, :content, :user_id, :target_id);";

    let sqlParams = {
        "content": body.content,
        "user_id": body.user_id,
        "id": body.id,
        "lv": lv ? lv : 0,
        "reply_id": body.reply_id ? body.reply_id : 0,
        "target_id": lv > 1 ? (body.target_id ? body.target_id : 0) : 0
    }

    let result = await db.qry(sql, sqlParams);

    if (!result['success'] || result['rows'].length < 1) {
        return jresp.sqlError();
    }

    let sql2 = "update video_post " +
        "set reply_cnt = ifnull(reply_cnt, 0) + 1 " +
        `where id = ${body.id} `

    let result2 = await db.qry(sql2)

    return jresp.successData({ id: result['rows']['insertId'] });
}


videoReplyService.editReply = async (body) => {

    let sql = "update reply_at_video  " +
        "set content = :content " +
        "where id = :id and user_id = :user_id";

    let sqlParams = {
        "id": body.id,
        "content": body.content,
        "user_id": body.user_id,
    }

    let result = await db.qry(sql, sqlParams);

    console.log(result)

    if (!result['success'] || result["rows"]["affectedRows"] < 1) {
        return jresp.sqlError();
    }

    return jresp.successData();
}

videoReplyService.deleteReply = async (body) => {


    let sql2 = `update video_post v, reply_at_video r
                set reply_cnt = (
                                    select count(*)
                                    from reply_at_video a 
                                    where a.video_post_id = r.video_post_id 
                                    and (
                                        reply_ref = 0
                                        or 
                                        0 < (select id from reply_at_video where id = a.reply_ref)
                                        )
                                    )
                where v.id = r.video_post_id 
                and r.id = ${body.id} `

    let result2 = await db.qry(sql2);

    console.log(result2);
    console.log(result2['rows'] ? result2['rows']['affectedRows'] : "del fail");


    let sql = "delete from reply_at_video  " +
        "where id = :id and user_id = :user_id";

    let sqlParams = {
        "id": body.id,
        "user_id": body.user_id,
    }

    let result = await db.qry(sql, sqlParams);

    if (!result['success'] || result["rows"]["affectedRows"] < 1) {
        return jresp.sqlError();
    }

    return jresp.successData();
}

const updateVideoReplyBlindChk = async (id, chk) => {

    let sql = `update reply_at_video 
                set blind_chk = ${chk ? 1 : 0}
                where id = ${id} `

    let result = await db.qry(sql)

    if (!_util.updateChkFromDB(result)) {
        return jresp.sqlError()
    }

    return jresp.successData({ chk: chk });
}


videoReplyService.chkVideoReplyBlind = async (id) => {

    return await updateVideoReplyBlindChk(id, true)
}

videoReplyService.unchkVideoReplyBlind = async (id) => {

    return await updateVideoReplyBlindChk(id, false)
}


module.exports = videoReplyService;