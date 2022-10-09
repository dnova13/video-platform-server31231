let userManageService = {}

userManageService.chkSlang = async (str) => {

    let sql = `select count(*) as cnt
                from others_meta 
                where \`type\` = 'slang'
                and '${str}' like concat('%', value ,'%')`

    let result = await db.qry(sql);
    let chk = _util.selectChkFromDB(result);

    if (chk < 1) {
        return jresp.sqlError();
    }

    return jresp.successData({ is_slang: result["rows"][0]["cnt"] > 0 });
}


userManageService.signup = async (body) => {

    let sql;
    let sqlParams;
    let result;
    let keys = ['name', 'nickname', 'birth', 'phone', 'address', 'email', 'type', 'app_id'];

    if (!_util.hasKeysArray(body, keys)) {

        console.log("key err");
        return jresp.invalidData();
    }

    if (_util.isObjectBlankArray(body, keys, keys.length)) {
        console.log("blank err");
        return jresp.invalidData();
    }

    sql = "INSERT INTO `user` (`name`, nickname, birth, phone, address, email, icon, gender)" +
        "VALUES(:name, :nickname, :birth, :phone, :addr, :email, :icon, :gender) "
    sqlParams = {
        name: body['name']
        , nickname: body['nickname']
        , birth: body['birth']
        , phone: body['phone']
        , addr: body['address']
        , email: body['email']
        , icon: body['icon'] ? body['icon'] : 0
        , gender: body['gender'] ? body['gender'] : 1
    }

    result = await db.qry(sql, sqlParams)

    if (!result['success'] || result['rows'].length < 1) {
        console.log(result)
        return jresp.sqlError(result.message);
    }

    const uid = result['rows']['insertId']

    sql = "INSERT INTO oauth (oauth_type, app_id, `password`, user_id) " +
        "VALUES(:type, :app_id, password(:pw), :uid) ";
    sqlParams = {
        type: body['type']
        , app_id: body['app_id']
        , pw: body['password'] ? body['password'] : null
        , uid: uid
    }

    result = await db.qry(sql, sqlParams)

    if (!result['success'] || result['rows'].length < 1) {

        return jresp.sqlError();
    }

    return jresp.successData();
}

userManageService.checkDuplicateEmail = async (email) => {

    let sql;
    let sqlP;
    let result;

    sql = "select count(*) as cnt " +
        "from `user` " +
        "where email = :email";
    sqlP = { email: email }

    result = await db.qry(sql, sqlP)

    // sql err
    if (!result['success']) {
        console.error(result)
        return jresp.sqlError();
    }

    if (result['rows'].length < 1) {
        return jresp.sqlError();
    }

    if (result["rows"][0]["cnt"] < 1) {
        return jresp.successData();
    }

    return jresp.duplicateData();
}

userManageService.checkDuplicateNickname = async (nickname) => {

    let sql;
    let sqlP;
    let result;

    sql = "select count(*) as cnt " +
        "from `user` " +
        "where nickname = :nickname";
    sqlP = { nickname: nickname };

    result = await db.qry(sql, sqlP)

    // sql err
    if (!result['success']) {
        console.error(result)
        return jresp.sqlError();
    }

    if (result['rows'].length < 1) {
        return jresp.sqlError();
    }

    if (result["rows"][0]["cnt"] < 1) {
        return jresp.successData();
    }

    return jresp.duplicateData();
}

userManageService.checkDuplicatePhone = async (phone) => {

    let sql;
    let sqlP;
    let result;

    sql = "select count(*) as cnt " +
        "from `user` " +
        "where phone = :phone";
    sqlP = { phone: phone };

    result = await db.qry(sql, sqlP)

    // sql err
    if (!result['success']) {
        console.error(result)
        return jresp.sqlError();
    }

    if (result['rows'].length < 1) {
        return jresp.sqlError();
    }

    if (result["rows"][0]["cnt"] < 1) {
        return jresp.successData();
    }

    return jresp.duplicateData();
}


userManageService.showOtherUserProfile = async (uid, fid) => {

    let sql = `select id, nickname, icon, following_cnt, follower_cnt  
                     , (select count(*) as cnt
                        from creator cr
                        inner join creator_apply ap
                        where cr.user_id = ap.user_id
                        and cr.user_id = :follow
                        and ap.status = 1) as is_creator
                     , (select count(*) from follow where follower = a.id and user_id = :user_id) as follow_chk
                from \`user\` a
                where id = :follow`
    let sqlParams = { user_id: uid, follow: fid }

    let result = await db.qry(sql, sqlParams);

    console.log(result);

    if (!result['success']) {
        return jresp.sqlError();
    }

    if (result['rows'].length < 1) {
        return jresp.emptyData();
    }

    let item = result["rows"][0];

    item.icon = _util.createImgDownPath(item.icon);
    item.is_creator = item.is_creator > 0;
    item.follow_chk = item.follow_chk > 0;


    if (parseInt(uid) === parseInt(fid)) {
        item.is_same_user = true;
    }

    return jresp.successData(item);
}

userManageService.getUserProfile = async (uid) => {

    console.log(uid);

    let sql = "select id, nickname, icon, following_cnt, follower_cnt " +
        ` , (select count(*) as cnt
                    from creator cr
                    inner join creator_apply ap
                    where cr.user_id = ap.user_id
                    and cr.user_id = :user_id
                    and ap.status = 1
                ) as is_creator ` +
        " , ifnull((select total_points from points where user_id = :user_id), 0) as total_points  " +
        "from `user` " +
        "where id = :user_id"
    let sqlParams = { user_id: uid }

    let result = await db.qry(sql, sqlParams);

    console.log(result);

    if (!result['success']) {
        return jresp.sqlError();
    }

    if (result['rows'].length < 1) {
        return jresp.emptyData();
    }

    let item = result["rows"][0];

    item.icon = _util.createImgDownPath(item.icon);
    item.is_creator = item.is_creator > 0;

    return jresp.successData(item);
}

userManageService.getSettingInfo = async (uid) => {


    let sql = "select push_chk  " +
        "from `user` " +
        "where id = :user_id"
    let sqlParams = { user_id: uid }

    let result = await db.qry(sql, sqlParams);

    console.log(result);

    if (!result['success']) {
        return jresp.sqlError();
    }

    if (result['rows'].length < 1) {
        return jresp.emptyData();
    }

    let item = result["rows"][0];
    item.push_chk = item.push_chk > 0;

    return jresp.successData(item);
}

userManageService.setPush = async (uid) => {

    let result = await userManageService.getSettingInfo(uid);

    if (!result['success']) {
        return jresp.sqlError();
    }

    let item = result["data"];
    console.log(item);

    let sql = "update `user` " +
        "set push_chk = push_chk * -1 + 1 " +
        `where id = ${uid}`

    result = await db.qry(sql);

    if (!result['success'] || result['rows']['affectedRows'] < 1) {
        return jresp.sqlError();
    }

    item.push_chk = !item.push_chk;
    return jresp.successData(item);
}

userManageService.updateFcmToken = async (uid, token) => {

    let sql = `update \`user\` 
                set fcm_token = '${token}'
                where id = ${uid}`

    let result = await db.qry(sql);

    if (!result['success'] || result['rows']['affectedRows'] < 1) {
        return jresp.sqlError();
    }

    return jresp.successData();
}

userManageService.getUserInfo = async uid => {

    let sql = `select id, nickname, email, phone, address, icon, gender, name, birth, lv
                from \`user\` 
                where id = :user_id `
    let sqlParams = { user_id: uid }

    let result = await db.qry(sql, sqlParams);

    console.log(result);

    if (!result['success']) {
        return jresp.sqlError();
    }

    if (result['rows'].length < 1) {
        return jresp.emptyData();
    }

    let item = result["rows"][0];
    item.icon = _util.createImgDownPath(item.icon);
    item.is_creator = item.lv >= 100;
    delete item.lv

    return jresp.successData(item);
}

userManageService.modifyUserInfo = async body => {

    let sql = `update \`user\` 
                set 
                     update_at = now()
                     , nickname = if(length(:nickname) > 0, :nickname, nickname)
                     , email = if(length(:email) > 0, :email, email)
                     , phone = if(length(:phone) > 0, :phone, phone)
                     , address = if(length(:address) > 0, :address, address)
                     , icon = if(:icon > 0, :icon, icon)
                     , birth = if(:birth > 0, :birth, birth)
                     , gender = if(:gender > 0, :gender, gender)
                where id = :user_id `

    let sqlParams = {
        "nickname": body.nickname ? body.nickname : "",
        "email": body.email ? body.email : "",
        "phone": body.phone ? body.phone : "",
        "address": body.address ? body.address : "",
        "icon": body.icon ? body.icon : 0,
        "birth": body.birth ? body.birth : 0,
        "gender": body.gender ? body.gender : 0,
        "user_id": body.user_id
    }

    console.log(sqlParams)

    let result = await db.qry(sql, sqlParams);

    console.log(result)

    if (!result['success'] || result["rows"]["affectedRows"] < 1) {
        return jresp.sqlError();
    }

    return jresp.successData();
}

userManageService.getMyInfoByUserId = async uid => {

    let sql = `select id, my_info
                from \`user\` 
                where id = :user_id `
    let sqlParams = { user_id: uid }

    let result = await db.qry(sql, sqlParams);

    console.log(result);

    if (!result['success']) {
        return jresp.sqlError();
    }

    if (result['rows'].length < 1) {
        return jresp.emptyData();
    }

    let item = result["rows"][0];

    return jresp.successData(item);
}

userManageService.modifyMyInfo = async body => {

    let sql = `update \`user\` 
                set 
                    my_info = if(length(:my_info) > 0, :my_info, my_info)
                where id = :user_id `

    let sqlParams = {
        "my_info": body.my_info ? body.my_info : "",
        "user_id": body.user_id
    }

    console.log(sqlParams)

    let result = await db.qry(sql, sqlParams);

    console.log(result)

    if (!result['success'] || result["rows"]["affectedRows"] < 1) {
        return jresp.sqlError();
    }

    return jresp.successData();
}

/* 관리자 쪽*/
/* 회원 관리 */
/* 회원 정보 서치 */
userManageService.searchMemberList = async (isCreator, suspendChk, limit, offset, keyword) => {

    let head = `select a.id
                        , (
                            select count(*) as cnt
                            from creator cr
                            inner join creator_apply ap
                            where cr.user_id = ap.user_id
                            and cr.user_id = a.id
                            and ap.status = 1 ) as is_creator
                        , a.create_at 
                        , a.nickname , a.name, a.phone 
                        , a.email , a.suspend_chk 
                    from \`user\` a`

    let suspendChkCondition = "";
    let creatorCondition = "";

    if (suspendChk > 0) { //  -1 : 전체, 0 : 정지 안된. , 1 : 정지
        suspendChkCondition = ` and a.suspend_chk = ${suspendChk} `
    }

    if (isCreator > 0) {  //  -1 : 전체, 0 : 일반, 1 : 크레이터
        creatorCondition = ` having is_creator = ${isCreator} `
    }

    let searchCol = "concat(a.nickname, ' ', a.name, ' ', a.phone, ' ' , a.email)"

    let searchQry = _util.createConditionQryForSearch(searchCol, "and", keyword, "where");
    let order = ` order by a.create_at desc, a.id desc
                limit ${limit} offset ${offset - 1}`

    let condition = searchQry + suspendChkCondition + creatorCondition
    let sql = head + condition + order;

    console.log(sql);

    let result = await db.qry(sql);

    let chk = _util.selectChkFromDB(result);

    if (chk < 0) {
        return jresp.sqlError();
    }

    if (chk === 0) {
        return jresp.emptyData();
    }

    let data = result["rows"];

    let sql2 = `select count(*) as total
                from (
                    select (
                            select count(*) as cnt
                            from creator cr
                            inner join creator_apply ap
                            where cr.user_id = ap.user_id
                            and cr.user_id = a.id
                            and ap.status = 1
                            ) as is_creator
                    from \`user\` a
                    ${condition}
                ) b `

    result = await db.qry(sql2)

    chk = _util.selectChkFromDB(result);

    if (chk < 1) {
        return jresp.sqlError();
    }

    console.log(result);

    let total = result["rows"][0]["total"];

    data.is_creator = data.is_creator > 0;

    return jresp.successData(data, data.length, total);
}


userManageService.getUserInfoMoreByUserId = async (uid) => {

    let sql = `select a.id
                        , (
                            select count(*) as cnt
                            from creator cr
                            inner join creator_apply ap
                            where cr.user_id = ap.user_id
                            and cr.user_id = a.id
                            and ap.status = 1
                            ) as is_creator
                        , a.create_at 
                        , a.nickname , a.name, a.phone 
                        , a.email, a.birth, a.gender, a.address, a.suspend_chk
                        , a.icon  
                    from \`user\` a
                    where a.id = ${uid}
                    `

    let result = await db.qry(sql);

    let chk = _util.selectChkFromDB(result);

    if (chk < 1) {
        return jresp.sqlError();
    }

    let data = result["rows"][0];
    data.icon = _util.createImgDownPath(data.icon);
    data.is_creator = data.is_creator > 0;

    return jresp.successData(data, 1, 1);
}

// 크레이터 신청 정보 by uid
userManageService.getCreatorAppliedInfoByUserId = async (uid) => {

    let sql = `select id, intro, sns, account, piece, name, copyright
                    , user_id, activity_region, status, create_at, update_at 
                from creator_apply 
                where user_id = ${uid}`

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

    // console.log("files",files);

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


/// 업로드한 영상
userManageService.getUploadedVideosByUserId = async (uid, limit, offset) => {

    let sql = `select  a.id
                        , view_cnt, like_cnt, dibs_cnt, reply_cnt
                        , ifnull(ROUND(a.score_sum/a.score_cnt, 2), 0) as score
                        , title
                        , a.user_id, b.nickname
                        , a.thumbnail
                        , a.blind_chk
                        , a.create_at
                    from video_post a
                    inner join \`user\` b
                    on a.user_id = b.id
                    where a.user_id = ${uid}
                    order by a.create_at desc, a.id desc
                    limit ${limit} offset ${offset - 1}`

    let result1 = await db.qry(sql);
    let chk = _util.selectChkFromDB(result1);

    if (chk < 0) {
        return jresp.sqlError()
    }

    if (chk === 0) {
        return jresp.emptyData();
    }

    let sql2 = `select count(*) as total
                from video_post a
                where a.user_id = ${uid} 
                `

    let result2 = await db.qry(sql2);
    chk = _util.selectChkFromDB(result2);

    if (chk < 1) {
        return jresp.sqlError()
    }

    let data = result1['rows'];

    for (let item of data) {

        item.thumbnail = _util.createImgDownPath(item.thumbnail);
        item.blind_chk = item.blind_chk > 0;
    }


    return jresp.successData(data, data.length, result2["rows"]["0"]['total']);
}


/// 작성한 댓글
userManageService.getReplyListByUserId = async (uid, limit, offset) => {

    let sql = `select a.id, a.user_id
                    , (select nickname from \`user\` where id = a.user_id) as nickname
                    , a.video_post_id, b.title, b.thumbnail 
                    , a.content 
                    , a.blind_chk
                    , a.create_at 
                from reply_at_video a
                inner join video_post b
                on a.video_post_id = b.id
                where a.user_id = ${uid} 
                order by a.create_at desc, a.id desc
                limit ${limit} offset ${offset - 1}`

    let result = await db.qry(sql);
    let chk = _util.selectChkFromDB(result);

    if (chk < 0) {
        return jresp.sqlError()
    }

    if (chk === 0) {
        return jresp.emptyData();
    }

    let data = result["rows"];

    let sql2 = `select count(*) as total
                from reply_at_video a
                where a.user_id = ${uid} 
                `

    result = await db.qry(sql2);
    chk = _util.selectChkFromDB(result);

    if (chk < 1) {
        return jresp.sqlError()
    }


    for (let item of data) {

        item.thumbnail = _util.createImgDownPath(item.thumbnail);
    }

    return jresp.successData(data, data.length, result["rows"]["0"]['total']);
}


/* 정지 관리 */
const updateSuspendMember = async (uid, chk) => {

    let sql = `update \`user\` u
                left join video_post vd
                on u.id = vd.user_id 
                left join reply_at_video re
                on u.id = re.user_id 
                set u.suspend_chk = ${chk}
                    , vd.blind_chk = ${chk}
                    , re.blind_chk = ${chk}
                where u.id = ${uid} `

    let result = await db.qry(sql);

    console.log(result)

    if (!_util.updateChkFromDB(result)) {
        return jresp.sqlError();
    }

    return jresp.successData();
}


userManageService.chkSuspendedMember = async (uid) => {
    return updateSuspendMember(uid, 1);
}

userManageService.unchkSuspendedMember = async (uid) => {
    return updateSuspendMember(uid, 0);
}


/* 퇄퇴 관리  */
userManageService.insertRetireReason = async (uid, reason, content, category) => {

    let sql = `insert into retire_history(user_id, name, reason, content, category)
               select id, name, '${reason}', '${content}', ${category}
               from \`user\`
               where id = ${uid}
               `;

    let result = await db.qry(sql);

    console.log(result)
    console.log(_util.insertChkFromDB(result));

    if (!_util.insertChkFromDB(result)) {
        return jresp.sqlError();
    }

    return jresp.successData();
}



userManageService.retireMember = async (uid, reason, content, category) => {

    let result = await userManageService.insertRetireReason(uid, reason, content, category);

    if (!result["success"]) {
        console.log("insert reason fail");
        return jresp.sqlError();
    }

    let sql = `delete flw, cr, oth, pts, re, u, p, vm, d
                from \`user\` u
                inner join oauth oth
                on oth.user_id = u.id
                left join follow flw
                on (
                    u.id = flw.user_id 
                    OR
                    u.id = flw.follower 
                )
                left join creator cr
                on cr.user_id = u.id
                left join points pts
                on pts.user_id = u.id
                left join reply_at_video re
                on re.user_id = u.id
                left join video_post p
                on p.user_id = u.id
                left join video_manager vm
                on p.id = vm.video_post_id
                left join daily_video_manager d
                on p.id = d.video_post_id 
                where u.id = ${uid} `

    result = await db.qry(sql);

    if (!_util.updateChkFromDB(result)) {
        return jresp.sqlError();
    }

    return jresp.successData();
}



/* 관리자 */
userManageService.getRetireReasonCount = async () => {

    let sql = `select category, count(*) as cnt
                from retire_history
                group by category
                order by category
                `

    let result = await db.qry(sql);

    let chk = _util.selectChkFromDB(result);

    if (chk < 0) {
        return jresp.sqlError();
    }

    if (chk === 0) {
        return jresp.emptyData();
    }

    let data = result["rows"];
    return jresp.successData(data);
}


userManageService.getRetireList = async (category, limit, offset) => {

    let condition = "";

    if (category > 0) {
        condition = ` where category = ${category} `
    }

    let sql = `select id, category, reason , content , create_at 
                from retire_history
                ${condition}
                order by create_at desc, id desc
                limit ${limit} offset ${offset - 1} `

    let result = await db.qry(sql);

    console.log(sql);

    let chk = _util.selectChkFromDB(result);

    if (chk < 0) {
        return jresp.sqlError();
    }

    if (chk === 0) {
        return jresp.emptyData();
    }

    let data = result["rows"];

    let sql2 = `select count(*) as total 
                from retire_history
                ${condition} 
                `

    result = await db.qry(sql2)

    chk = _util.selectChkFromDB(result);

    if (chk < 1) {
        return jresp.sqlError();
    }

    let total = result["rows"][0]["total"];

    return jresp.successData(data, data.length, total);
}




module.exports = userManageService;


