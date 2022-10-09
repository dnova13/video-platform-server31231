const notifyService = {}

const setMessage = (type, targetName) => {

    let msg = {
        1: `${targetName} 님이 내 게시물에 박수를 보냈습니다.`,
        2: `${targetName} 님이 내 게시물에 댓글을 작성하였습니다.`,
        3: `${targetName} 님이 내 댓글에 대댓글을 작성하였습니다.`,
        4: `${targetName} 님이 나를 팔로우하기 시작하였습니다.`,
        5: `${targetName} 님이 게시물을 업로드하였습니다.`,
        6: `정산이 완료되었습니다.`,
        7: `${targetName} 영상이 후원을 받았습니다.`,
        8: `${targetName} 님께서 후원하셨습니다.`,
        9: `크리에이터 승인이 되었습니다.`
    }

    return msg[type];
}

const sendPush = (type, title, body, token) => {

    let data = {};

    data.title = title;
    data.body = type === 7 ? setMessage(7, body.relation_name) : setMessage(type, body.target_name)

}

const sendMultiPush = (type, title, body, tokens) => {

    let data = {};

    data.title = title;
    data.body = setMessage(type, body.target_name)
}


const chkDuplicateInsert = async (type, body) => {

    let sql;

    if ([1].includes(type)) {

        sql = `select id
                from notify_history 
                where \`type\` = :type
                and user_id = :user_id
                and target_id  = :target_id
                and relation_id = :relation_id`
    } else if ([4].includes(type)) {
        sql = `select id
                from notify_history 
                where \`type\` = :type
                and user_id = :user_id
                and target_id  = :target_id`
    } else {
        return -1
    }

    let sqlParams = {
        type: type,
        target_id: body.target_id ? body.target_id : 0,
        user_id: body.user_id,
        relation_id: body.relation_id ? body.relation_id : 0,
    }

    let result = await db.qry(sql, sqlParams)
    let chk = _util.selectChkFromDB(result)

    return chk < 1 ? chk : result["rows"][0]["id"];
}

notifyService.setNotifyData = (targetId, targetName, userId, relationId, relationName) => {

    let data = {
        target_id: targetId,
        target_name: targetName,
        user_id: userId,
        relation_id: relationId,
        relation_name: relationName,
    }

    return data;
}


notifyService.getUserNickname = async (userId) => {

    let sql = `select nickname
                from \`user\` 
                where id = ${userId}`

    let result = await db.qry(sql);

    let chk = _util.selectChkFromDB(result);

    if (chk < 1)
        return null;

    return result["rows"][0]["nickname"];
}

notifyService.getUserNicknameAndVideoTitle = async (userId, videoPostId) => {

    let sql = `select nickname
                    , (select title from video_post where id = ${videoPostId}) as title
                from \`user\` 
                where id = ${userId}
                ;`

    let result = await db.qry(sql);

    let chk = _util.selectChkFromDB(result);

    if (chk < 1)
        return null;

    return result["rows"][0];
}

notifyService.getUserDataForCommonPush = async (userId, targetId) => {

    let sql = `select fcm_token, push_chk
                    , (select nickname from \`user\` where id = ${userId} ) as nickname 
                from \`user\` 
                where id = ${targetId}`

    let result = await db.qry(sql);

    let chk = _util.selectChkFromDB(result);

    if (chk < 1)
        return null;

    return result["rows"][0];
}

notifyService.getUserDataForPostPush = async (userId, videoPostId) => {

    let sql = `select b.fcm_token, b.push_chk, a.user_id as posted_user_id, a.title
                    , (select nickname from \`user\` where id = ${userId}) as nickname 
                from video_post a 
                inner join \`user\` b
                on a.user_id = b.id
                where a.id = ${videoPostId}`

    let result = await db.qry(sql);
    let chk = _util.selectChkFromDB(result);

    if (chk < 1)
        return null;

    return result["rows"][0];
}

notifyService.insertNotifyLikeOrFollow = async (type, body) => {

    let chk = await chkDuplicateInsert(type, body);
    let sql;
    let sqlParams;

    if (chk < 0) {
        return chk;
    }

    if (chk === 0) {
        return await notifyService.insert(type, body);
    } else {

        sql = `update notify_history 
                set create_at = now()
                    , update_at = now()
                    , is_reading = 0
                where id = ${chk}`

        let result = await db.qry(sql);

        if (!_util.updateChkFromDB(result)) {
            return 0;
        }

        return 1;
    }

}

notifyService.insert = async (type, body) => {

    let sql;

    sql = `INSERT INTO notify_history (\`type\`, target_id, target_name, user_id, relation_id, relation_name) 
             values (:type, :target_id, :target_name, :user_id, :relation_id, :relation_name)`;

    let sqlParams = {
        type: type,
        target_id: body.target_id ? body.target_id : 0,
        target_name: body.target_name ? body.target_name : "",
        user_id: body.user_id,
        relation_id: body.relation_id ? body.relation_id : 0,
        relation_name: body.relation_name ? body.relation_name : "",
    }

    let result = await db.qry(sql, sqlParams);

    if (!_util.insertChkFromDB(result)) {
        return 0
    }

    return result['rows']['insertId'];
}

notifyService.delete = async (_id, uid) => {

    let sql = `delete
                from notify_history
                where id = ${_id}
                and user_id = ${uid}`

    let result = await db.qry(sql);

    if (!_util.updateChkFromDB(result)) {
        return jresp.sqlError()
    }

    return jresp.successData();
}


notifyService.readNotify = async (_id, uid) => {

    let sql = `update notify_history
                set is_reading = 1
                where id = ${_id}
                and user_id = ${uid}`

    let result = await db.qry(sql);

    if (!_util.updateChkFromDB(result)) {
        return jresp.sqlError()
    }

    return jresp.successData();
}

notifyService.getFcmToken = async (uid) => {

    let sql = `select fcm_token 
                from \`user\` 
                where id = ${uid}
                and push_chk = 1`

    let result = await db.qry(sql);

    if (_util.selectChkFromDB(result) < 1) {
        return ""
    }

    return result['rows'][0]['fcm_token'];
}

notifyService.getFollowingFcmTokens = async (uid) => {

    let sql = `select b.fcm_token 
                from follow a
                inner join \`user\` b
                on a.user_id = b.id 
                where follower = ${uid}
                and push_chk = 1`

    let result = await db.qry(sql);

    if (_util.selectChkFromDB(result) < 1) {
        return null
    }

    return result['rows'];
}


notifyService.getNotifyListByUserId = async (uid, limit, offset, condition) => {

    let where = "";

    if (condition > -1) {
        where = `and is_reading = ${condition} `
    }

    let head = `select id, \`type\` 
                        , target_id
                        , ifnull(target_name, "") as target_name
                        , user_id
                        , relation_id
                        , ifnull(relation_name, "") as relation_name
                        , if(\`type\` = 3,
                            ifnull((select video_post_id 
                                    from reply_at_video
                                    where id = relation_id),0)
                            , 0) as post_id
                        , is_reading
                        , create_at 
                from notify_history
                where user_id = ${uid} `

    let order = ` order by create_at desc, id desc
                limit ${limit} offset ${offset - 1}`

    let sql = head + where + order;


    let result = await db.qry(sql);
    let chk = _util.selectChkFromDB(result);

    if (chk < 0) {
        return jresp.sqlError()
    }

    if (chk === 0) {
        return jresp.emptyData()
    }

    let data = result["rows"];
    let list = [];

    for (let item of data) {

        let __item = {};

        __item.id = item.id;
        __item.type = item.type;
        __item.message = item.type === 7 ? setMessage(7, item.relation_name) : setMessage(item.type, item.target_name);
        __item.user_id = item.user_id
        __item.is_reading = item.is_reading

        if ([1, 2, 7].indexOf(item.type) > -1) {
            __item.post_id = item.relation_id;
        }
        if (item.type === 3) {
            __item.reply_id = item.relation_id;
            __item.post_id = item.post_id
        }
        if (item.type === 5) {
            __item.creator_id = item.target_id;
        }

        __item.create_at = item.create_at

        list.push(__item);
    }

    let total = await notifyService.getTotalNotifyByUserId(uid, condition);

    if (total < 0) {
        return jresp.sqlError();
    }

    return jresp.successData(list, list.length, total);
}


notifyService.getTotalNotifyByUserId = async (uid, condition) => {


    let sql2 = `select count(*) as total 
                from notify_history
                where user_id = ${uid} `

    let where = "";

    if (condition > -1) {
        where = `and is_reading = ${condition} `
    }

    let result = await db.qry(sql2 + where);
    let chk = _util.selectChkFromDB(result);

    if (chk < 1) {
        return -1;
    }

    let total = result["rows"][0]["total"];

    return total
}


// userId : 알림을 받게한 원인 제공 사용자 아이디, postId : 알림 받을 게시판 아이디
notifyService.notifyPostEvent = async (userId, postId) => {

    let type = 1;
    let item = await notifyService.getUserDataForPostPush(userId, postId);

    if (!item) {
        console.log("dont find user data")
        return;
    }

    let body = notifyService.setNotifyData(userId, item.nickname, item.posted_user_id, postId, item.title);
    let result = await notifyService.insertNotifyLikeOrFollow(type, body);

    console.log("body ", body);
    console.log("reslut ", result);
    console.log("item ", item);

    if (result < 1) {
        return jresp.sqlError();
    }

    if (item["push_chk"] < 1) {
        return;
    }

    let title = "";
    await sendPush(type, title, body, item.fcm_token);

    return jresp.successData();
}

notifyService.notifyReply = async (userId, postId) => {

    let type = 2;

    let item = await notifyService.getUserDataForPostPush(userId, postId);

    if (!item) {
        console.log("dont find user data")
        return;
    }

    if (userId === item.posted_user_id) {
        console.log("same_user");
        return;
    }

    let body = notifyService.setNotifyData(userId, item.nickname, item.posted_user_id, postId, item.title);
    let result = await notifyService.insert(type, body);

    if (result < 1) {
        return jresp.sqlError();
    }

    if (item["push_chk"] < 1) {
        return;
    }

    let title = "";

    await sendPush(type, title, body, item.fcm_token);

    return jresp.successData();
}

// userId : 알림을 받게한 원인 제공 사용자 아이디, targeId 알림 받는 사용자 아이디,  postId : 알림 받을 댓글 아이디
notifyService.notifyReReply = async (userId, targetId, replyId) => {

    let type = 3;

    let item = await notifyService.getUserDataForCommonPush(userId, targetId);

    if (!item) {
        console.log("dont find user data")
        return;
    }

    /*if (userId === targetId) {
        console.log("same_user");
        return;
    }*/

    let body = notifyService.setNotifyData(userId, item.nickname, targetId, replyId, null);
    let result = await notifyService.insert(type, body);

    if (result < 1) {
        return jresp.sqlError();
    }

    if (item["push_chk"] < 1) {
        return;
    }

    let title = "";
    await sendPush(type, title, body, item.fcm_token);

    return jresp.successData();
}

notifyService.notifyFollow = async (userId, targetId) => {

    let type = 4;

    let item = await notifyService.getUserDataForCommonPush(userId, targetId);

    if (!item) {
        console.log("dont find user data")
        return;
    }

    let body = notifyService.setNotifyData(userId, item.nickname, targetId, null, null);
    let result = await notifyService.insertNotifyLikeOrFollow(type, body);

    if (result < 1) {
        return jresp.sqlError();
    }

    if (item["push_chk"] < 1) {
        return;
    }

    let title = "";
    await sendPush(type, title, body, item.fcm_token);

    return jresp.successData();
}

notifyService.notifyUploadVideoPost = async (userId, postId, postTitle) => {

    let type = 5;
    let userNick = await notifyService.getUserNickname(userId);

    if (!userNick) {
        return jresp.sqlError();
    }

    let fcmTokens = await notifyService.getFollowingFcmTokens(userId);

    let sql = `INSERT INTO notify_history (\`type\`, target_id, target_name, user_id, relation_id, relation_name) 
                select 5, :target_id, :target_name, user_id , :relation_id, :relation_name
                from follow 
                where follower = :target_id`;

    let sqlParams = {
        target_id: userId,
        target_name: userNick,
        relation_id: postId,
        relation_name: postTitle,
    }

    let result = await db.qry(sql, sqlParams);

    if (!_util.insertChkFromDB(result)) {
        return 0
    }

    if (result < 1) {
        return jresp.sqlError()
    }

    let title = ""
    await sendMultiPush(type, title, sqlParams, fcmTokens)

    return jresp.successData();
}

notifyService.notifyAdjustment = async (userId) => {

    let type = 6;
    let token = await notifyService.getFcmToken(userId);
    let body = notifyService.setNotifyData(null, null, userId, null, null);

    let result = await notifyService.insert(type, body);

    if (result < 1) {
        return jresp.sqlError();
    }

    if (token.length < 1) {
        console.log("dont find user data")
        return;
    }

    let title = "";
    await sendPush(type, title, body, token);

    return jresp.successData();
}


notifyService.notifySponsorVideo = async (userId, postId) => {

    let type = 7;

    let item = await notifyService.getUserDataForPostPush(userId, postId);

    if (!item) {
        console.log("dont find user data")
        return;
    }

    let body = notifyService.setNotifyData(userId, item.nickname, item.posted_user_id, postId, item.title);
    let result = await notifyService.insert(type, body);

    if (result < 1) {
        return jresp.sqlError();
    }

    if (item["push_chk"] < 1) {
        return;
    }

    let title = "";
    await sendPush(type, title, body, item.fcm_token);

    return jresp.successData();
}


notifyService.notifySponsorCreator = async (userId, targetId) => {

    let type = 8;
    let item = await notifyService.getUserDataForCommonPush(userId, targetId);

    if (!item) {
        console.log("dont find user data")
        return;
    }

    let body = notifyService.setNotifyData(userId, item.nickname, targetId, null, null);
    let result = await notifyService.insert(type, body);

    // console.log("body ", body);
    // console.log("reslut ", result);
    // console.log("item ", item);

    if (result < 1) {
        return jresp.sqlError();
    }

    if (item["push_chk"] < 1) {
        return;
    }

    let title = "";
    await sendPush(type, title, body, item.fcm_token);

    return jresp.successData();
}

notifyService.notifyAuthCreator = async (userId) => {

    let type = 9;
    let token = await notifyService.getFcmToken(userId);

    let body = notifyService.setNotifyData(null, null, userId, null, null);

    let result = await notifyService.insert(type, body);

    if (result < 1) {
        return jresp.sqlError();
    }

    if (token.length < 1) {
        console.log("dont find user data")
        return;
    }

    let title = "";
    await sendPush(type, title, body, token);

    return jresp.successData();
}


module.exports = notifyService;