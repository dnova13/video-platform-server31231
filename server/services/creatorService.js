const util = require('util')

let creatorService = {};

creatorService.isCreator = async (uid) => {

    let sql = `select count(*) as cnt
                from creator a
                inner join creator_apply b
                where a.user_id = b.user_id
                and a.user_id = :user_id
                and b.status = 1`
    let sqlP = { user_id: uid }

    let result = await db.qry(sql, sqlP)

    let chk = _util.selectChkFromDB(result);

    if (chk < 1) {
        return jresp.sqlError();
    }

    return jresp.successData({ is_creator: result["rows"][0]["cnt"] > 0 });
}

creatorService.applyCreator = async (body) => {

    let sql = `INSERT INTO creator_apply (name, intro, sns, account, piece, activity_region, user_id) 
                VALUES(:name, :intro, :sns, :account, :piece, :activity_region, :user_id)`

    let sqlParams = {
        name: body.name,
        intro: body.intro,
        sns: body.sns,
        account: body.account,
        piece: body.piece,
        activity_region: body.activity_region,
        user_id: body.user_id,
    }

    let result = await db.qry(sql, sqlParams);

    if (!_util.insertChkFromDB(result)) {
        console.log("fail apply ")

        if (result["code"] === "ER_DUP_ENTRY")
            return jresp.duplicateData(result["sqlMessage"]);

        return jresp.sqlError();
    }

    let insId = result['rows']['insertId'];

    if (body.fids.length > 0) {

        let sql2 = util.format(`INSERT INTO files_meta (file_id, parent, file_key) 
                            select id ,${insId}, 'apply_pic'
                            from files 
                            where id in (%s)`, body.fids.toString());

        result = await db.qry(sql2);

        if (!_util.insertChkFromDB(result)) {
            console.log("fail upload")
            return jresp.sqlError();
        }
    }

    return jresp.successData({ id: insId });
}


creatorService.uploadVideos = async (body) => {

    let id = body.id;
    let values = "";

    for (let video of body.videos) {

        if (!_util.isBeyondZero(video.fid)) {
            console.log("videoArr not num")
            return jresp.invalidData();
        }

        if (_util.isBlanks(video.title, video.content)) {
            console.log("videoArr not str")
            return jresp.invalidData();
        }

        let obj = {};

        obj.title = video.title;
        obj.content = video.content;

        values += ` (${video.fid}, ${id}, 'apply_video', 1, '${JSON.stringify(obj)}'), `
    }

    values = values.slice(0, -2);

    let sql = util.format(`INSERT INTO files_meta (file_id, parent, file_key, idx, value) 
                                values %s`, values);

    let result = await db.qry(sql);

    if (!_util.insertChkFromDB(result)) {
        return jresp.sqlError();
    }

    return jresp.successData();
}


creatorService.chkDuplicateApply = async (uid) => {

    let sql = `select ifnull(id,0) as id
                        , count(*) as cnt
                    , ifnull((select count(*) from files_meta where parent =a.id and file_key='apply_video'),0) as video_cnt
                from creator_apply a
                where user_id = ${uid}`

    let result = await db.qry(sql);

    let chk = _util.duplicateSelectChkFromDB(result);

    if (chk < 0) {
        return jresp.sqlError()
    }

    let item = {
        id: result["rows"][0]["id"],
        phase: result["rows"][0]["cnt"] < 1 ? 0 : result["rows"][0]["video_cnt"] < 1 ? 1 : 2
    }

    return jresp.successData(item);
}

creatorService.getAppliedInfoByUserId = async (uid) => {

    let sql = `select id, intro, sns, account, piece, name, copyright
                    , user_id, activity_region, status, create_at, update_at 
                from creator_apply 
                where user_id = ${uid}`

    let applyInfo = await db.qry(sql);
    let chk = _util.selectChkFromDB(applyInfo);

    if (chk < 0) {
        return jresp.sqlError()
    }

    if (chk === 0) {
        return jresp.emptyData();
    }

    let sql2 = `select id, file_id, parent, idx, value, file_key
                        , (select \`uuid\` from files where id = file_id) as \`uuid\`
                from files_meta 
                where parent = ${applyInfo['rows'][0]['id']}
                and file_key like 'apply%'
                order by file_key, idx, id `

    let files = await db.qry(sql2);
    chk = _util.selectChkFromDB(files);

    if (chk < 0) {
        return jresp.sqlError()
    }

    if (chk === 0) {
        return jresp.emptyData();
    }

    let item = applyInfo['rows'][0];
    item.videos = [];
    item.images = [];
    item.copyright = item.copyright > 0;

    for (let file of files['rows']) {

        if (file.file_key === "apply_video") {

            let video = {};

            video = JSON.parse(file.value);
            video.video = _util.createVideoDownPath(file.uuid);

            item.videos.push(video);
        }
        else {
            item.images.push(_util.createImgDownPath(file.file_id));
        }
    }

    return jresp.successData(item, 1, 1);
}

creatorService.searchAppliedInfoList = async (status, limit, offset, keyword) => {

    let condition = "";

    if (status > -1) {
        condition = ` and status = ${status} `
    }

    let searchQry = _util.createConditionQryForSearch('concat(a.name, " ",b.nickname)', "and", keyword, "where");

    let sql = `select a.id, a.intro, a.sns, a.account, a.piece
                        , a.name, b.nickname
                        , a.user_id, a.activity_region, a.status
                        , ( select CONCAT('[', GROUP_CONCAT(file_id order by idx, id), ']') AS file_id
                            from files_meta 
                            where parent = a.id
                            and file_key like 'apply_pic'
                            ) as images
                        , case 
                            when
                                (select count(*)
                                from files_meta 
                                where parent = a.id
                                and file_key like 'apply_video') > 0
                            then 
                                copyright
                            else 
                                0 
                        end as copyright
                        , a.create_at, a.update_at
                from creator_apply a
                inner join \`user\` b
                on a.user_id = b.id
                ${searchQry} ${condition}
                order by a.create_at desc, a.id desc
                limit ${limit} offset ${offset - 1} `

    let result = await db.qry(sql);

    let chk = _util.selectChkFromDB(result);

    if (chk < 0) {
        return jresp.sqlError()
    }

    if (chk === 0) {
        return jresp.emptyData()
    }

    let list = result["rows"];


    for (let item of list) {

        let arr = JSON.parse(item.images ? item.images : "[]")
        item.images = [];
        item.copyright = item.copyright > 0;

        for (let img of arr) {
            item.images.push(_util.createImgDownPath(img));
        }
    }

    let sql2 = `select count(*) as total
                from creator_apply a
                inner join \`user\` b
                on a.user_id = b.id
                ${searchQry} ${condition}
                `
    let result2 = await db.qry(sql2);

    chk = _util.selectChkFromDB(result2);

    if (chk < 1) {
        return jresp.sqlError();
    }

    let total = result2["rows"][0]["total"];

    return jresp.successData(list, list.length, total);
}

creatorService.getAppliedInfoByApplyId = async (id) => {

    let sql = `select id, intro, sns, account, piece, name
                    , user_id, activity_region, status, create_at, update_at, copyright 
                from creator_apply 
                where user_id = ${id}`

    let applyInfo = await db.qry(sql);
    let chk = _util.selectChkFromDB(applyInfo);

    console.log("applyInfo", applyInfo);

    if (chk < 0) {
        return jresp.sqlError()
    }

    if (chk === 0) {
        return jresp.emptyData();
    }

    let sql2 = `select id, file_id, parent, idx, value, file_key
                        , (select \`uuid\` from files where id = file_id) as \`uuid\`
                from files_meta 
                where parent = ${applyInfo['rows'][0]['id']}
                and file_key like 'apply%'
                order by file_key, idx, id `

    let files = await db.qry(sql2);
    chk = _util.selectChkFromDB(files);

    if (chk < 0) {
        return jresp.sqlError()
    }

    if (chk === 0) {
        return jresp.emptyData();
    }

    let item = applyInfo['rows'][0];
    item.videos = [];
    item.images = [];

    for (let file of files['rows']) {

        if (file.file_key === "apply_video") {

            let video = {};

            let str = file.value;
            str = str.replace(/\n/gi, "\\n").replace(/\r/gi, "\\r")

            video = JSON.parse(str);
            video.video = _util.createVideoDownPath(file.uuid);

            item.videos.push(video);
        }
        else {
            item.images.push(_util.createImgDownPath(file.file_id));
        }
    }


    item.copyright = item.videos.length < 1 ? false : item.copyright > 0;

    return jresp.successData(item, 1, 1);
}


creatorService.getUploadedListByUserId = async (uid, limit, offset) => {

    let sql = `select a.id, title, thumbnail
                        , a.user_id
                        , view_cnt
                        , like_cnt 
                        , ifnull(ROUND(a.score_sum/a.score_cnt, 2), 0) as score
                        , (select icon from \`user\` where id = a.user_id ) as user_icon 
                        , ifnull((select duration from files where \`uuid\` = a.video and file_type = 1  limit 1), 0) as duration
                        , a.create_at, a.update_at 
                    from video_post a
                    where a.user_id = ${uid}
                    order by a.id desc
                    limit ${limit} offset ${offset - 1}`

    let result = await db.qry(sql);

    let chk = _util.selectChkFromDB(result);

    if (chk < 0) {
        return jresp.sqlError()
    }

    if (chk === 0) {
        return jresp.emptyData()
    }

    let list = result["rows"];
    let sql2 = `select count(*) as total
                from video_post a
                where a.user_id = ${uid}`

    let result2 = await db.qry(sql2);

    chk = _util.selectChkFromDB(result2);

    if (chk < 1) {
        return jresp.sqlError();
    }

    let total = result2["rows"][0]["total"];

    for (let item of list) {
        item.thumbnail = _util.createImgDownPath(item.thumbnail);
        item.user_icon = _util.createImgDownPath(item.user_icon);
    }

    return jresp.successData(list, list.length, total);
}


const updateAuth = async (id, status) => {

    let sql = ``

    // 승인 일 경우
    if (status === 1) {
        sql = `update creator_apply a, \`user\` b
                set a.status = 1
                where a.user_id = b.id
                and a.user_id = :id`
    }

    // 승인 대기 일 경우.
    else if (status === 0) {
        sql = `update creator_apply a, \`user\` b
                set a.status = :status
                where a.user_id = b.id
                and a.user_id = :id`
    }

    // 승인 거부 일 경우
    else {
        console.log("del")
        sql = `delete from creator_apply
                where user_id = :id `
    }

    let sqlP = {
        id: id,
        status: status
    }

    let result = await db.qry(sql, sqlP);

    if (!_util.updateChkFromDB(result)) {
        return jresp.sqlError();
    }

    return jresp.successData();
}

const insertCreator = async (id) => {

    let sql = `INSERT INTO points (user_id) 
                select user_id 
                from creator_apply 
                where user_id = ${id}
                ON DUPLICATE KEY 
                update update_at = now()`

    let result = await db.qry(sql);

    if (!_util.updateChkFromDB(result)) {
        return jresp.sqlError()
    }

    sql = `INSERT INTO creator (name, nickname, intro, sns, my_info, activity_region, account, user_id)
                select a.name, b.nickname, a.intro, a.sns , b.my_info , a.activity_region , a.account , a.user_id 
                from creator_apply a
                inner join \`user\` b
                on a.user_id = b.id 
                where a.user_id = ${id} 
                ON DUPLICATE KEY 
                update update_at = now()`

    result = await db.qry(sql);

    if (!_util.updateChkFromDB(result)) {
        return jresp.sqlError()
    }

    return jresp.successData();
};

creatorService.doAuthCreator = async (id) => {

    let result = await insertCreator(id);

    if (!result["success"]) {
        console.log("ins err");
        return jresp.sqlError();
    }

    return await updateAuth(id, 1, "byApplyId")
};


creatorService.rejectAuthCreator = async (id) => {
    return await updateAuth(id, 2)
};

creatorService.pendingAuthCreator = async (id) => {
    return await updateAuth(id, 0)
};


module.exports = creatorService;
