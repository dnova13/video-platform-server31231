const videoService = {}

videoService.searchVideoListForAdmin = async (order, limit, offset, keyword, blindChk) => {

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
            // console.log("invalid Order name");
            return jresp.invalidData();
    }

    let head = `SELECT a.id    
                     , view_cnt, like_cnt, dibs_cnt, reply_cnt      
                     , ifnull(ROUND(a.score_sum/a.score_cnt, 2), 0) as score
                     , title     
                     , a.user_id, b.nickname         
                     , a.thumbnail    
                     , a.create_at , a.update_at
                     , a.blind_chk
                     , a.video  
                 from video_post a
                 inner join \`user\` b
                 on a.user_id = b.id 
                 `;

    let searchQry = _util.createConditionQryForSearch(`concat(a.title," ",b.nickname," ",a.tags )`, "and", keyword);
    let otherCondition = '';

    if (blindChk > -1 && blindChk < 2) {
        otherCondition = `and a.blind_chk = ${blindChk}`
    }

    let tail = ` limit ${limit} offset ${offset - 1} `;

    let sql = head + searchQry + otherCondition + orderBy + tail;
    // console.log(sql);

    let result = await db.qry(sql);
    // console.log(result);

    if (!result['success']) {
        return jresp.sqlError();
    }

    if (result['rows'].length < 1) {
        return jresp.emptyData();
    }

    let data = result["rows"];

    for (let item of data) {
        item.thumbnail = _util.createImgDownPath(item.thumbnail)
        item.blind_chk = item.blind_chk > 0;
        item.video = _util.createVideoDownPath(item.video);
    }

    let total = await getTotalVideoSearchForAdmin(searchQry, otherCondition);

    return jresp.successData(data, data.length, total);
}

async function getTotalVideoSearchForAdmin(searchQry, otherCondition) {

    let head = `select count(*) as total
                from video_post a
                inner join \`user\` b
                on a.user_id = b.id `;
    let sql = head + searchQry + otherCondition;

    let result = await db.qry(sql);

    if (!result['success'] || result['rows'].length < 1) {
        return 0;
    }

    return result["rows"][0]["total"];
}

// 비디오 신고 상세 읽기
videoService.readVideoDetail = async (id) => {

    let sql = `select vd.id 
                        , vd.thumbnail ,vd.title, vd.video 
                        , vd.view_cnt, vd.content, vd.tags
                        , (select count(*) 
                            from video_post_meta 
                            where \`type\` = "recent" 
                            and video_post_id = vd.id) as member_view_cnt
                        , vd.like_cnt, vd.reply_cnt, vd.dibs_cnt
                        , ifnull(sum(sp.point_quantity),0) as total_sponsor_points 
                        , count(sp.id) as number_of_sponsor
                        , ifnull(ROUND(vd.score_sum/vd.score_cnt, 2), 0) as score
                        , vd.create_at 
                        , vd.user_id, u.nickname, u.icon, u.my_info 
                        , vd.blind_chk, vd.copyright
                        , (
                            select count(*) as cnt
                            from creator cr
                            inner join creator_apply ap
                            where cr.user_id = ap.user_id
                            and cr.user_id = u.id
                            and ap.status = 1 ) as is_creator
                from video_post vd
                inner join \`user\` u
                on vd.user_id = u.id
                left join sponsor_history sp
                on sp.video_post_id = vd.id
                where vd.id = ${id}`

    let result = await db.qry(sql);

    let chk = _util.selectChkFromDB(result);

    if (chk < 1) {
        return jresp.sqlError();
    }

    let item = result["rows"][0];

    if (item.id === null) {
        return jresp.sqlError();
    }

    item.blind_chk = item.blind_chk > 0;
    item.tags = item.tags ? JSON.parse(item.tags) : [];
    item.thumbnail = _util.createImgDownPath(item.thumbnail);
    item.video = _util.createVideoDownPath(item.video);
    item.icon = _util.createImgDownPath(item.icon);
    item.is_creator = item.is_creator > 0;
    item.copyright = item.copyright > 0;


    return jresp.successData(item, 1, 1);
}

const updateVideoBlindChk = async (id, chk) => {

    let sql = `update video_post 
                set blind_chk = ${chk ? 1 : 0}
                where id = ${id} `

    let result = await db.qry(sql)

    if (!_util.updateChkFromDB(result)) {
        return jresp.sqlError()
    }

    return jresp.successData({ chk: chk });
}


videoService.chkVideoBlind = async (id) => {

    return await updateVideoBlindChk(id, true)
}

videoService.unchkVideoBlind = async (id) => {

    return await updateVideoBlindChk(id, false)
}

videoService.insertCuration = async (body) => {

    let type = "curation"

    let sql = `insert into video_manager 
                    (\`type\`, title, parent_id, video_post_id, thumbnail)
                values 
                    ("${type}", '${body.title}', 0, 0, 0)`
    let result = await db.qry(sql);

    if (!_util.insertChkFromDB(result)) {
        return jresp.sqlError()
    }

    let lastInsId = result['rows']['insertId'];

    let valuesQry = "";
    let i = 1;

    for (let video of body.ins_videos) {
        valuesQry += ` ("${type}", null, :parent_id, ${video}, ${i++}, 0), `
    }

    valuesQry = valuesQry.slice(0, -2)

    let sql2 = `insert into video_manager 
                    (\`type\`, title, parent_id, video_post_id, idx, thumbnail)
                values ${valuesQry} `
    let sqlParams2 = {
        parent_id: lastInsId
    }


    result = await db.qry(sql2, sqlParams2)

    if (!_util.insertChkFromDB(result)) {
        return jresp.sqlError()
    }

    return jresp.successData();
}


videoService.updateCuration = async (body) => {

    let result;

    if (body.del_videos.length > 0) {
        result = await deleteVideoFromCuration(body.id, body.del_videos);

        if (!result["success"]) {
            return result;
        }
    }

    result = await updateVideoFromCuration(body.id, body.title, body.ins_videos);

    return result;
}

const updateVideoFromCuration = async (parentId, title, insVideos) => {

    let type = "curation"

    let values = "";
    let titleQry = "";

    if (title) {
        values = ` (${parentId}, "${type}", '${title}', 0, 0, 0, 0), `
        titleQry = `, title = '${title}'`
    }

    for (let video of insVideos) {
        values += ` (null, "${type}", null, ${parentId}, ${video}, 0, 0), `
    }

    values = values.slice(0, -2)

    let sql = `insert into video_manager 
                        (id, \`type\`, title, parent_id, video_post_id, idx, thumbnail)
                values ${values}
                on duplicate key 
                update
                    update_at = now()
                    ${titleQry}`;

    let result = await db.qry(sql);

    if (!_util.insertChkFromDB(result)) {
        return jresp.sqlError();
    }

    return jresp.successData();
}

const deleteVideoFromCuration = async (parentId, delVideos) => {

    let sql = `delete from video_manager 
                where parent_id = ${parentId}
                and video_post_id in (${delVideos.toString()}) `

    let result = await db.qry(sql);

    if (!_util.updateChkFromDB(result)) {
        console.log("del err");
        return jresp.sqlError();
    }

    return jresp.successData();
}


videoService.insertPick = async (body) => {

    let type = "pick"

    let sql = `insert into video_manager 
                    (\`type\`, title, parent_id, video_post_id, thumbnail)
                values 
                    ("${type}", '${body.title}', 0, 0, ${body.fid})`
    let result = await db.qry(sql);

    if (!_util.insertChkFromDB(result)) {
        return jresp.sqlError()
    }

    let lastInsId = result['rows']['insertId'];

    let valuesQry = "";
    let i = 1;

    for (let video of body.ins_videos) {
        valuesQry += ` ("${type}", null, :parent_id, ${video}, ${i++}, 0), `
    }

    valuesQry = valuesQry.slice(0, -2)

    let sql2 = `insert into video_manager 
                    (\`type\`, title, parent_id, video_post_id, idx, thumbnail)
                values ${valuesQry} `
    let sqlParams2 = {
        parent_id: lastInsId
    }

    result = await db.qry(sql2, sqlParams2)

    if (!_util.insertChkFromDB(result)) {
        return jresp.sqlError()
    }

    return jresp.successData({ id: lastInsId });
}


videoService.updatePick = async (body) => {

    let result;

    if (body.del_videos.length > 0) {
        result = await deleteVideoFromPick(body.id, body.del_videos);

        if (!result["success"]) {
            return result;
        }
    }

    result = await updateVideoFromPick(body.id, body.title, body.ins_videos, body.fid);

    return result;
}


videoService.deletePick = async (id) => {

    let sql = `delete from video_manager 
                where \`type\` = "pick"
                and (
                    id = ${id}
                    or
                    parent_id = ${id}
                )`

    let result = await db.qry(sql);

    if (!_util.updateChkFromDB(result)) {
        console.log("del err");
        return jresp.sqlError();
    }

    return jresp.successData();
}


const updateVideoFromPick = async (parentId, title, insVideos, fid) => {

    let type = "pick"

    let values = "";
    let additionalQry = "";

    if (title || fid) {
        values = ` (${parentId}, "${type}", '${title}', 0, 0, 0, ${fid ? fid : 0}), `
        additionalQry = title ? `, title = '${title}' ` : ""
        additionalQry += fid ? `, thumbnail = '${fid}' ` : ""
    }

    for (let video of insVideos) {
        values += ` (null, "${type}", null, ${parentId}, ${video}, 0, 0), `
    }

    values = values.slice(0, -2)

    let sql = `insert into video_manager 
                        (id, \`type\`, title, parent_id, video_post_id, idx, thumbnail)
                values ${values}
                on duplicate key 
                update
                    update_at = now()
                    ${additionalQry}`;

    let result = await db.qry(sql);

    if (!_util.insertChkFromDB(result)) {
        return jresp.sqlError();
    }

    return jresp.successData();
}

const deleteVideoFromPick = async (parentId, delVideos) => {

    let sql = `delete from video_manager 
                where parent_id = ${parentId}
                and video_post_id in (${delVideos.toString()}) `

    let result = await db.qry(sql);

    if (!_util.updateChkFromDB(result)) {
        console.log("del err");
        return jresp.sqlError();
    }

    return jresp.successData();
}



module.exports = videoService;