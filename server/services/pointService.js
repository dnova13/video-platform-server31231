const { v4: uuidv4 } = require('uuid');

let pointService = {};

// 포인트 충전 신청
pointService.applyPoints = async body => {

    let _uuid = uuidv4();

    let sql = `INSERT INTO points_history 
                        (order_num, point_quantity, user_id, payment_price)
                VALUES (:order_num, :point_quantity, :user_id, :payment_price) `
    let sqlParams = {
        order_num : _uuid,
        point_quantity : body.point_quantity,
        user_id : body.user_id,
        payment_price : body.point_quantity,
    }

    let result = await db.qry(sql, sqlParams);

    console.log(result);

    if (!result['success'] || result['rows']['insertId'] < 1) {
        return jresp.sqlError();
    }

    let insId = result['rows']['insertId'];
    console.log(insId);

    return jresp.successData({"order_num":_uuid});
}

//
pointService.successCharge = async (body) => {

    let sql2 = `update points_history 
                set pg_id = :pg_id 
                    , point_purpose = 1
                    , payment_info = '${body.card_name + " " + body.card_number}'
                where user_id = :user_id 
                and id = :id`
    let sqlParams2 = {
        id : body.id,
        pg_id : body.pg_id,
        user_id : body.user_id
    }

    let result = await db.qry(sql2, sqlParams2);

    if (!result['success'] || result['rows']['affectedRows'] < 1) {
        console.log("update fail");
        return jresp.sqlError();
    }

    return jresp.successData();
}


// 포인트 충전
pointService.chargePoints = async (body) => {

    let sql = `insert into points (total_points, user_id)
                values (:points, :user_id)
                ON DUPLICATE KEY 
                UPDATE total_points = ifnull(total_points,0) + :points
                        , update_at = now() `
    let sqlParams = {
        points : body.points,
        user_id : body.user_id
    }

    console.log(sqlParams);

    let result = await db.qry(sql, sqlParams);

    console.log(result);

    if (!result['success'] || result['rows']['insertId'] < 1) {
        console.log("insert fail");
        return jresp.sqlError();
    }

    let insId = result['rows']['insertId'];
    console.log(insId);


    return jresp.successData();
}

/// 하루 포인트 충전량 조회
pointService.getDailyChargePointsByUserId = async (uid) => {

    let sql = `select ifnull(sum(point_quantity),0) as daily_charge 
                from points_history 
                where user_id = ${uid}
                and point_purpose = 1
                and date_format(update_at, "%Y-%m-%d") = current_date()`

    let result = await db.qry(sql);

    // sql err
    if (!result['success']) {
        return -1;
    }

    // empty data
    if (result['rows'].length < 1) {
        return 0;
    }

    return result["rows"][0]["daily_charge"];
}

/// 하루 포인트 후원량 조회
pointService.getDailySponsorPointsByUserId = async (uid) => {

    let sql = `select ifnull(sum(point_quantity),0) as daliy_sponsor 
                from sponsor_history 
                where user_id = ${uid}
                and date_format(create_at, "%Y-%m-%d") = current_date()`

    let result = await db.qry(sql);

    // sql err
    if (!result['success']) {
        return -1;
    }

    // empty data
    if (result['rows'].length < 1) {
        return 0;
    }

    return result["rows"][0]["daliy_sponsor"];
}

// 포인트 후원
pointService.sponsorPoints = async (body) => {

    let sql = `INSERT INTO sponsor_history 
                        (order_num , point_quantity, user_id, video_post_id, receiver)
                VALUES (uuid(), :point_quantity, :user_id, :video_post_id, :receiver) `
    let sqlParams = {
        point_quantity : body.point_quantity,
        user_id : body.user_id,
        video_post_id : body.video_post_id ? body.video_post_id: 0,
        receiver : body.receiver
    }

    let result = await db.qry(sql, sqlParams);

    console.log(result);

    if (!result['success'] || result['rows']['insertId'] < 1) {
        console.log("insert fail");
        return jresp.sqlError();
    }

    let insId = result['rows']['insertId'];
    console.log(insId);

    let sql2 = `update points spon, points rev
                set 
                    spon.update_at = now()
                    , rev.update_at = now()
                    , spon.total_points = spon.total_points - :point_quantity
                    , rev.total_sponsored = rev.total_sponsored + :point_quantity
                where spon.user_id = :user_id
                and rev.user_id = :receiver `
    let sqlParams2 = {
        point_quantity : body.point_quantity,
        user_id : body.user_id,
        receiver : body.receiver
    }

    result = await db.qry(sql2, sqlParams2);

    if (!result['success'] || result['rows']['affectedRows'] < 1) {
        console.log("update fail");
        return jresp.sqlError();
    }

    return jresp.successData();
}

// 포인트 사용
pointService.usePoints = async (body) => {

    let sql = `insert into points (total_points, user_id)
                values (:points, :user_id)
                ON DUPLICATE KEY 
                UPDATE total_points = total_points - :points
                        , update_at = now() `
    let sqlParams = {
        points : body.point_quantity,
        user_id : body.user_id
    }

    let result = await db.qry(sql, sqlParams);

    console.log(result);

    if (!result['success'] || result['rows']['insertId'] < 1) {
        console.log("insert fail");
        return jresp.sqlError();
    }

    let insId = result['rows']['insertId'];
    console.log(insId);

    let sql2 = `update points_history 
                set pg_id = :pg_id 
                    , point_purpose = 2
                where user_id = :user_id 
                and id = :id`
    let sqlParams2 = {
        id : body.id,
        pg_id : body.pg_id,
        user_id : body.user_id
    }

    result = await db.qry(sql2, sqlParams2);

    if (!result['success'] || result['rows']['affectedRows'] < 1) {
        console.log("update fail");
        return jresp.sqlError();
    }

    return jresp.successData();
}

// 정산 신청
pointService.applyAdjustment = async (body) => {

    let ratio = 1;

    let sql = `INSERT INTO transactions 
                            (user_id, point_type, account, point_quantity, ratio) 
                VALUES(:user_id, :point_type, :account, :point_quantity, ${ratio}) `
    let sqlParams = {
        point_type : body.point_type,
        user_id : body.user_id,
        account : body.account,
        point_quantity : body.point_quantity
    }

    let result = await db.qry(sql, sqlParams);

    console.log(result);

    if (!result['success'] || result['rows']['insertId'] < 1) {
        console.log("insert fail");
        return jresp.sqlError();
    }

    let insId = result['rows']['insertId'];
    console.log(insId);

     let condition = body.point_type === 0 ?
                    `set total_points = total_points - ${body.point_quantity}` : `set total_sponsored = total_sponsored - ${body.point_quantity}`
    
    // 정산 신청 금액 감소
    let sql2 = `update points 
                ${condition}
                where user_id = ${body.user_id}`
    
    result = await db.qry(sql2);

    if (!_util.updateChkFromDB(result)) {
        return jresp.sqlError();
    }

    return jresp.successData();
}

/*
   리스트 구역.
*/

/// 주문 번호를 통한 포인트 충전 정보 조회
pointService.getPointInfoByOrderNum = async (order_num) => {

    let sql = "SELECT id, order_num, point_quantity, user_id, payment_price " +
                "FROM points_history " +
                "WHERE order_num = :order_num ";
    let sqlParams = {order_num:order_num}

    let result = await db.qry(sql, sqlParams);

    if (!result['success']) {
        return null;
    }

    if (result['rows'].length < 1) {
        return null;
    }

    let item = result["rows"][0];

    return item;
}


// 한 유저의 총 가지고 잇는 포인트 량 조회
pointService.getTotalPointsByUserId = async (user_id) => {

    let sql = "SELECT total_points, total_sponsored " +
                "from points " +
                "where user_id = :user_id";
    let sqlParams = {user_id:user_id}

    let result = await db.qry(sql, sqlParams);

    if (!result['success']) {
        return null;
    }

    if (result['rows'].length < 1) {
        return {total_points: 0, total_sponsored: 0};
    }

    return result["rows"][0];
}

/// 한 유저가 정산 신청한 포인트 량 조회.
pointService.getTotalAppliedAdjustmentByUserId = async (uid, pointType) => {

    let sql = "select ifnull(sum(point_quantity),0) as total " +
                "from transactions " +
                "where user_id = :user_id " +
                "and point_type = :point_type " +
                "and status = 0";
    let sqlParams = {user_id:uid, point_type:pointType}

    let result = await db.qry(sql, sqlParams);

    if (!result['success']) {
        return -1;
    }

    if (result['rows'].length < 1) {
        return -1;
    }

    return result["rows"][0]["total"];
}


/// 한 사용자의 후원한 포인트 총량 조회
pointService.getTotalSponsorPointsByUserId = async (uid) => {

    let sql = `select ifnull(sum(point_quantity),0) as total 
                from sponsor_history 
                where user_id = :user_id`
    let sqlParams = {user_id:uid}

    let result = await db.qry(sql, sqlParams);

    if (!result['success']) {
        return -1;
    }

    if (result['rows'].length < 1) {
        return -1;
    }

    return result["rows"][0]["total"];
}

/// 한 사용자의 후원한 각각의 포인트 양 조회
pointService.getTotalEachSponsoringPointsByUserId = async (uid) => {

    let sql = `select ifnull(sum(if(a.video_post_id > 0, a.point_quantity, 0)),0) as total_sponsoring_video
                        , ifnull(sum(if(a.video_post_id = 0, a.point_quantity, 0)),0) as total_sponsoring_creator 
                        , ifnull(sum(a.point_quantity),0) as total_sponsoring
                from sponsor_history a
                where a.user_id = :user_id`
    let sqlParams = {user_id:uid}

    let result = await db.qry(sql, sqlParams);

    let chk = _util.selectChkFromDB(result);

    if (chk < 1) {
        return jresp.sqlError()
    }

    return jresp.successData(result["rows"][0]);
}

//// 한 사용자가 후원 받은 각각의 포인트 량 조회
pointService.getTotalEachSponsoredPointsByUserId = async (uid) => {

    let sql = `select ifnull(sum(if(a.video_post_id > 0, a.point_quantity, 0)),0) as total_sponsored_video
                        , ifnull(sum(if(a.video_post_id = 0, a.point_quantity, 0)),0) as total_sponsored_creator 
                        , ifnull(sum(a.point_quantity),0) as total_sponsored
                from sponsor_history a
                where a.receiver = :user_id`
    let sqlParams = {user_id:uid}

    let result = await db.qry(sql, sqlParams);

    let chk = _util.selectChkFromDB(result);

    if (chk < 1) {
        return jresp.sqlError()
    }

    return jresp.successData(result["rows"][0],1,1);
}


/// 한 사용자의 정산 완료한 포인트 총량 조회
pointService.getTotalCompleteAdjustmentByUserId = async (uid) => {

    let sql = `select ifnull(sum(point_quantity),0) as total 
                from transactions 
                where user_id = :user_id
                and status = 1`;
    let sqlParams = {user_id:uid}

    let result = await db.qry(sql, sqlParams);

    if (!result['success']) {
        return -1;
    }

    if (result['rows'].length < 1) {
        return -1;
    }

    return result["rows"][0]["total"];
}


// 한 크레이터에 대한 후원 받은 영상 내역
pointService.getSponsoredVideoHistoryByReceiver = async (uid, limit, offset) => {

    let sql = `select a.id, a.video_post_id, a.user_id as sponsor_id
                    , b.thumbnail, b.title
                    , a.point_quantity, a.create_at as sponsor_at 
                from sponsor_history a
                inner join video_post b
                on a.video_post_id = b.id
                where a.receiver = ${uid}
                and a.video_post_id > 0
                order by a.create_at desc
                limit ${limit} offset ${offset - 1}`

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
                from sponsor_history 
                where receiver = ${uid}
                and video_post_id > 0`

    result = await db.qry(sql2)

    chk = _util.selectChkFromDB(result);

    if (chk < 1) {
        return jresp.sqlError();
    }

    let total = result["rows"][0]["total"];

    for (let item of data) {
        item.thumbnail = _util.createImgDownPath(item.thumbnail);
    }

    return jresp.successData(data, data.length, total);

}

// 한 크레이터에 대한 후원 받은 전체 내역
pointService.getSponsoredAllHistoryByReceiver = async (uid, limit, offset) => {

    let sql = `select a.id, a.video_post_id, a.user_id as sponsor_id
                    , b.icon as sponsor_icon , b.nickname as sponsor_nickname
                    , ifnull((select title from video_post where id = a.video_post_id),"") as title 
                    , a.point_quantity, a.create_at as sponsor_at
                from sponsor_history a
                inner join \`user\` b
                on b.id = a.user_id 
                where receiver = ${uid}
                order by a.create_at desc
                limit ${limit} offset ${offset - 1}`

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
                from sponsor_history 
                where receiver = ${uid}`

    result = await db.qry(sql2)

    chk = _util.selectChkFromDB(result);

    if (chk < 1) {
        return jresp.sqlError();
    }

    let total = result["rows"][0]["total"];

    for (let item of data) {
        item.sponsor_icon = _util.createImgDownPath(item.sponsor_icon);
        item.does_sponsor_creator = item.video_post_id === 0;

        delete item.video_post_id;
    }

    return jresp.successData(data, data.length, total);
}


// 한 유저에 대한  포인트 내역
pointService.getPointHistoryByUserId = async (uid, limit, offset) => {

    let sql = `select id, point_quantity, 1 \`type\`, create_at
                from points_history a 
                where user_id = ${uid}
                and point_purpose = 1
                union all
                select id, point_quantity, 2, create_at 
                from sponsor_history b
                where user_id = ${uid}
                union all
                select id, point_quantity, 3, create_at 
                from transactions c
                where user_id = ${uid}
                and status = 1
                order by create_at desc
                limit ${limit} offset ${offset - 1}`

    let result = await db.qry(sql);

    let chk = _util.selectChkFromDB(result);

    if (chk < 0) {
        return jresp.sqlError();
    }

    if (chk === 0) {
        return jresp.emptyData();
    }

    let data = result["rows"];

    let sql2 = `select count(*)
                        + (select count(*) 
                            from sponsor_history b
                            where user_id = ${uid}) 
                        + (select count(*) 
                            from transactions c
                            where user_id = ${uid}
                            and status = 1) as total			
                from points_history a 
                where user_id = ${uid}
                and point_purpose = 1`

    result = await db.qry(sql2)

    chk = _util.selectChkFromDB(result);

    if (chk < 1) {
        return jresp.sqlError();
    }

    let total = result["rows"][0]["total"];

    return jresp.successData(data, data.length, total);
}

// 한 유저에 대한 포인트 내역 옵션 추가 더 상세 ( 관리자용)
pointService.getMoreDetailPointHistoryByUserId = async (uid, type, limit, offset) => {


    let pointQry = ` select id, point_quantity, 1 as \`type\`, a.payment_info as detail ,create_at
                    from points_history a 
                    where user_id = :user_id
                    and point_purpose = 1 `

    let sponQry = ` select id, point_quantity, 2 as \`type\`
                    , case  
                        when video_post_id > 0 
                        then (select title from video_post where id = b.video_post_id)
                        else (select nickname from \`user\` where id = b.receiver)
                        end as detail
                    , create_at 
                    from sponsor_history b
                    where user_id = :user_id `

    let adjustmentQry = ` select id, point_quantity, 3 \`type\` , "포인트 정산" as detail , create_at 
                            from transactions c
                            where user_id = :user_id
                            and status = 1 `


    let header = "";
    let union = "union all "
    let totalQry = ""

    switch (Number(type)) {

        case 0 :
            header = pointQry + union + sponQry + union + adjustmentQry
            totalQry = `select count(*)
                                + (select count(*) 
                                    from sponsor_history b
                                    where user_id = ${uid}) 
                                + (select count(*) 
                                    from transactions c
                                    where user_id = ${uid}
                                    and status = 1) as total			
                        from points_history a 
                        where user_id = ${uid}
                        and point_purpose = 1`
            break;
        
        // 충전
        case 1 :
            header = pointQry
            totalQry = `select count(*) as total
                        from points_history a 
                        where user_id = ${uid}
                        and point_purpose = 1 `
            break;
        
        /// 후원
        case 2 :
            header = sponQry
            totalQry = `select count(*) as total 
                        from sponsor_history b
                        where user_id = ${uid}`
            break;
            
        /// 정산
        case 3 :
            header = adjustmentQry
            totalQry = `select count(*) as total 
                        from transactions c
                        where user_id = ${uid}
                        and status = 1`
            break;

        default :
            return jresp.invalidData();
    }

    let order = `order by create_at desc
                limit ${limit} offset ${offset - 1}`

    let sql = header + order
    let sqlP = {user_id:uid}

    let result = await db.qry(sql, sqlP);

    let chk = _util.selectChkFromDB(result);

    if (chk < 0) {
        return jresp.sqlError();
    }

    if (chk === 0) {
        return jresp.emptyData();
    }

    let data = result["rows"];

    result = await db.qry(totalQry)

    chk = _util.selectChkFromDB(result);

    if (chk < 1) {
        return jresp.sqlError();
    }

    let total = result["rows"][0]["total"];

    return jresp.successData(data, data.length, total);
}

// 한 크리에이터가 대한 후원 받은 내역(관리자용)
pointService.getMoreDetailSponsoredHistoryByUserId = async (uid, limit, offset) => {

    let sponQry = ` select id, point_quantity, video_post_id, user_id as sponsor, receiver as user_id
                            , (select title from video_post where id = b.video_post_id) as title
                            , (select nickname from \`user\` where id = b.user_id) as sponsor_nickname                            
                            , (select nickname from \`user\` where id = b.receiver) as receiver_nickname
                            , create_at 
                    from sponsor_history b
                    where receiver = :user_id `

    let totalQry = `select count(*) as total 
                        from sponsor_history b
                        where receiver = ${uid}`

    let order = `order by create_at desc
                limit ${limit} offset ${offset - 1}`

    let sql = sponQry + order
    let sqlP = {user_id:uid}

    let result = await db.qry(sql, sqlP);

    let chk = _util.selectChkFromDB(result);

    if (chk < 0) {
        return jresp.sqlError();
    }

    if (chk === 0) {
        return jresp.emptyData();
    }

    let data = result["rows"];

    result = await db.qry(totalQry)

    chk = _util.selectChkFromDB(result);

    if (chk < 1) {
        return jresp.sqlError();
    }

    let total = result["rows"][0]["total"];

    return jresp.successData(data, data.length, total);
}

// 한 유저에 대한 후원한 내역(관리자용)
pointService.getMoreDetailSponsoringHistoryByUserId = async (uid, limit, offset) => {

    let sponQry = ` select id, point_quantity, video_post_id, user_id, receiver                            
                            , (select title from video_post where id = b.video_post_id) as title
                            , (select nickname from \`user\` where id = b.receiver) as receiver_nickname
                            , create_at 
                    from sponsor_history b
                    where user_id = :user_id `

    let totalQry = `select count(*) as total 
                        from sponsor_history b
                        where user_id = ${uid}`

    let order = `order by create_at desc
                limit ${limit} offset ${offset - 1}`

    let sql = sponQry + order
    let sqlP = {user_id:uid}

    let result = await db.qry(sql, sqlP);

    let chk = _util.selectChkFromDB(result);

    if (chk < 0) {
        return jresp.sqlError();
    }

    if (chk === 0) {
        return jresp.emptyData();
    }

    let data = result["rows"];

    result = await db.qry(totalQry)

    chk = _util.selectChkFromDB(result);

    if (chk < 1) {
        return jresp.sqlError();
    }

    let total = result["rows"][0]["total"];

    return jresp.successData(data, data.length, total);
}


/// 한 유저에 대한 영상에 후원한 내역
pointService.getSponsorVideoHistoryByUserId = async (uid, limit, offset) => {

    let sql = `select a.id, a.video_post_id, a.user_id
                    , (select nickname from \`user\` where id = a.receiver) as creator_nickname 
                    , b.thumbnail, b.title
                    , a.point_quantity, a.create_at as sponsor_at 
                from sponsor_history a
                inner join video_post b
                on a.video_post_id = b.id
                where a.user_id = ${uid}
                and video_post_id > 0
                order by a.create_at desc
                limit ${limit} offset ${offset - 1}`

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
                from sponsor_history 
                where user_id = ${uid}
                and video_post_id > 0`

    result = await db.qry(sql2)

    chk = _util.selectChkFromDB(result);

    if (chk < 1) {
        return jresp.sqlError();
    }

    let total = result["rows"][0]["total"];

    for (let item of data) {
        item.thumbnail = _util.createImgDownPath(item.thumbnail);
    }

    return jresp.successData(data, data.length, total);
}

/// 한 유저에 대한 크레이터에 후원한 내역
pointService.getSponsorCreatorHistoryByUserId = async (uid, limit, offset) => {

    let sql = `select a.id, a.user_id
                    , b.icon as creator_icon , b.nickname as creator_nickname
                    , b.id as receiver_id  
                    , a.point_quantity, a.create_at as sponsor_at
                from sponsor_history a
                inner join \`user\` b
                on b.id = a.receiver 
                where a.user_id = ${uid}
                and video_post_id = 0
                order by a.create_at desc
                limit ${limit} offset ${offset - 1}`

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
                from sponsor_history 
                where user_id = ${uid}
                and video_post_id = 0`

    result = await db.qry(sql2)

    chk = _util.selectChkFromDB(result);

    if (chk < 1) {
        return jresp.sqlError();
    }

    let total = result["rows"][0]["total"];

    for (let item of data) {
        item.creator_icon = _util.createImgDownPath(item.creator_icon);
    }

    return jresp.successData(data, data.length, total);
}


// 정산 내역
pointService.getAdjustmentHistoryByUserId = async (uid, limit, offset) => {

    let sql = `SELECT id, user_id, point_type, point_quantity, status, create_at, ratio
                FROM transactions
                where user_id = ${uid}
                order by create_at desc
                limit ${limit} offset ${offset - 1}`

    let result = await db.qry(sql);

    let chk = _util.selectChkFromDB(result);

    if (chk < 0) {
        return jresp.sqlError();
    }

    if (chk === 0) {
        return jresp.emptyData();
    }

    let data = result["rows"];

    let sql2 = `SELECT count(*) as total
                FROM transactions
                where user_id = ${uid}`

    result = await db.qry(sql2)

    chk = _util.selectChkFromDB(result);

    if (chk < 1) {
        return jresp.sqlError();
    }

    let total = result["rows"][0]["total"];


    for (let item of data) {
        item.price = item.point_quantity * item.ratio;
    }

    return jresp.successData(data, data.length, total);
}


// 관리자 메인
// 회원 정산 신청 내역
pointService.getAdjustmentAppliedHistory = async (limit, offset) => {

    let sql = `SELECT id, user_id
                    , (select nickname from \`user\` where id = a.user_id) as nickname
                    , point_type, point_quantity, account
                    , status, create_at
                FROM transactions a
                where status = 0
                order by create_at desc
                limit ${limit} offset ${offset - 1}`

    let result = await db.qry(sql);

    let chk = _util.selectChkFromDB(result);

    if (chk < 0) {
        return jresp.sqlError();
    }

    if (chk === 0) {
        return jresp.emptyData();
    }

    let data = result["rows"];

    let sql2 = `SELECT count(*) as total
                FROM transactions
                where status = 0 
                `

    result = await db.qry(sql2)

    chk = _util.selectChkFromDB(result);

    if (chk < 1) {
        return jresp.sqlError();
    }

    let total = result["rows"][0]["total"];

    return jresp.successData(data, data.length, total);
}

/* 포인트 충전 내역 */
// 포인트 충전 내역 전체 조회 검색 포함
pointService.searchChargingPointHistory = async (limit, offset, keywords) => {


    let head = ` select a.id, a.update_at as charge_at
                        , a.user_id, b.nickname 
                        , a.point_quantity, a.payment_price 
                        , a.payment_info 
                    from points_history a
                    inner join \`user\` b
                    on a.user_id = b.id
                    where a.point_purpose = 1 `

    let searchQry = _util.createConditionQryForSearch( "b.nickname","and", keywords, "and");
    let order = ` order by a.update_at desc
                limit ${limit} offset ${offset - 1}`

    let sql = head + searchQry + order;

    let result = await db.qry(sql);

    let chk = _util.selectChkFromDB(result);

    if (chk < 0) {
        return jresp.sqlError();
    }

    if (chk === 0) {
        return jresp.emptyData();
    }

    let data = result["rows"];

    let sql2 = ` select count(*) as total
                    from points_history a
                    inner join \`user\` b
                    on a.user_id = b.id
                    where a.point_purpose = 1 `
    result = await db.qry(sql2 + searchQry)

    chk = _util.selectChkFromDB(result);

    if (chk < 1) {
        return jresp.sqlError();
    }

    let total = result["rows"][0]["total"];

    return jresp.successData(data, data.length, total);
}

// 하나의 포인트 충전 상세 조회
pointService.readChargingPointDetail = async (id) => {

    let head = ` select a.id, a.update_at as charge_at
                        , a.user_id, b.nickname 
                        , a.point_quantity, a.payment_price 
                        , a.payment_info 
                    from points_history a
                    inner join \`user\` b
                    on a.user_id = b.id
                    where a.point_purpose = 1
                    and a.id = ${id} 
                    `
    let sql = head;

    let result = await db.qry(sql);

    let chk = _util.selectChkFromDB(result);

    if (chk < 1) {
        return jresp.sqlError();
    }

    let data = result["rows"][0];

    return jresp.successData(data, 1, 1);
}

/* 후원 내역 */
/// 후원 많이한 회원 top 5
pointService.getLotsOfSponsoringUser = async (limit) => {

    let sql = `select a.id, a.user_id
                    , b.nickname , b.icon 
                    , ifnull(sum(a.point_quantity),0) as total_sponsoring
                    , ifnull(sum(if(a.video_post_id > 0, a.point_quantity, 0)),0) as total_sponsoring_video
                    , ifnull(sum(if(a.video_post_id = 0, a.point_quantity, 0)), 0) as total_sponsoring_creator
                from sponsor_history a
                inner join \`user\` b
                on a.user_id = b.id
                group by user_id 
                order by total_sponsoring desc
                limit ${limit}`

    let result = await db.qry(sql);

    let chk = _util.selectChkFromDB(result);

    if (chk < 0) {
        return jresp.sqlError();
    }

    if (chk === 0) {
        return jresp.emptyData();
    }

    let data = result["rows"];

    for(let item of data) {
        item.icon = _util.createImgDownPath(item.icon);
    }

    return jresp.successData(data, 1, 1);
}

/// 후원 많이 받은 회원 top 5
pointService.getLotsOfSponsoredUser = async (limit) => {

    let sql = `select a.id, a.receiver as receiver_id
                    , b.nickname , b.icon 
                    , ifnull(sum(a.point_quantity),0) as total_sponsored
                    , ifnull(sum(if(a.video_post_id > 0, a.point_quantity, 0)),0) as total_sponsored_video
                    , ifnull(sum(if(a.video_post_id = 0, a.point_quantity, 0)),0) as total_sponsored_creator
                from sponsor_history a
                inner join \`user\` b
                on a.receiver = b.id
                group by receiver 
                order by total_sponsored desc
                limit ${limit}`

    let result = await db.qry(sql);

    let chk = _util.selectChkFromDB(result);

    if (chk < 0) {
        return jresp.sqlError();
    }

    if (chk === 0) {
        return jresp.emptyData();
    }

    let data = result["rows"];

    for(let item of data) {
        item.icon = _util.createImgDownPath(item.icon);
    }

    return jresp.successData(data, data.length, data.length);
}

// 후원 내역 전체 조회 검색 포함
pointService.searchSponsorHistory = async (type, limit, offset, keywords) => {

    let condition = "";

    if (type > -1) {
        condition = type > 0 ? ` and a.video_post_id > 0 ` : ` and a.video_post_id = 0 `
    }

    let head = `select a.id
                        , a.video_post_id, vd.thumbnail, vd.title 
                        , a.user_id, b.nickname 
                        , a.receiver as receiver_id
                        , (select nickname from \`user\` where id = a.receiver) as receiver_nickname
                        , a.create_at as sponsor_at
                        , a.point_quantity 
                from sponsor_history a
                inner join \`user\` b
                on a.user_id = b.id
                left join video_post vd
                on vd.id = a.video_post_id `

    let searchQry = _util.createConditionQryForSearch( "b.nickname","and", keywords, "where");
    let order = ` order by a.create_at desc
                limit ${limit} offset ${offset - 1}`

    let sql = head + searchQry +  condition  + order;

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
                from sponsor_history a
                inner join \`user\` b
                on a.user_id = b.id
                left join video_post vd
                on vd.id = a.video_post_id `
    result = await db.qry(sql2 + searchQry +  condition)

    chk = _util.selectChkFromDB(result);

    if (chk < 1) {
        return jresp.sqlError();
    }

    let total = result["rows"][0]["total"];

    if (Math.abs(type) === 1) {
        for(let item of data) {

            if (item.video_post_id > 0)
                item.thumbnail = _util.createImgDownPath(item.thumbnail);
        }
    }

    return jresp.successData(data, data.length, total);
}


// 영상 후원 내역 상세 조회
pointService.readVideoSponsorHistoryDetail = async (id) => {

    let sql = `select a.id
                      , a.user_id, b.nickname 
                      , a.receiver as receiver_id
                      , (select nickname from \`user\` where id = a.receiver) as receiver_nickname
                      , a.create_at as sponsor_at
                      , a.point_quantity 
                      , a.video_post_id, vd.thumbnail, vd.title 
                      , vd.video, vd.create_at as video_create_at
                      , vd.view_cnt, vd.like_cnt, vd.reply_cnt, vd.dibs_cnt
                      , ifnull(ROUND(vd.score_sum/vd.score_cnt, 2), 0) as score
                      , ifnull(sum(sp.point_quantity), 0) as total_sponsor_points 
                      , count(sp.id) as number_of_sponsor
                from sponsor_history a
                inner join \`user\` b
                on a.user_id = b.id
                inner join video_post vd
                on vd.id = a.video_post_id
                left join sponsor_history sp
                on sp.video_post_id = vd.id 
                where a.video_post_id > 0
                and a.id = ${id}`

    let result = await db.qry(sql);

    let chk = _util.selectChkFromDB(result);

    if (chk < 0) {
        return jresp.sqlError();
    }

    if (chk === 0) {
        return jresp.emptyData();
    }

    let data = result["rows"][0];

    if (data.id === null)
        return jresp.sqlError();

    data.thumbnail = _util.createImgDownPath(data.thumbnail);
    data.video = _util.createVideoDownPath(data.video);

    return jresp.successData(data, data.length, data.length);
}


// 크레이터 후원 내역 상세 조회
pointService.readCreatorSponsorHistoryDetail = async (id) => {

    let sql = `select a.id
                        , a.user_id, b.nickname 
                        , a.receiver as receiver_id
                        , (select nickname from \`user\` where id = a.receiver) as receiver_nickname
                        , a.create_at as sponsor_at
                        , a.point_quantity 
                from sponsor_history a
                inner join \`user\` b
                on a.user_id = b.id
                where a.video_post_id = 0
                and a.id = ${id}`

    let result = await db.qry(sql);

    let chk = _util.selectChkFromDB(result);

    if (chk < 0) {
        return jresp.sqlError();
    }

    if (chk === 0) {
        return jresp.emptyData();
    }

    let data = result["rows"][0];

    return jresp.successData(data, data.length, data.length);
}


/* 회원 정산 내역 - 관리자 */
// 회원 정산 신청 내역 전체 조회 검색 포함
pointService.searchAdjustmentAllHistory = async (status, limit, offset, keywords) => {

    let condition = "";

    if (status > -1) {
        condition = ` where status = ${status} `
    }

    let head = `SELECT id, user_id
                    , (select nickname from \`user\` where id = a.user_id) as nickname
                    , point_type, point_quantity, account
                    , status, create_at as apply_at, update_at as complete_at
                FROM transactions a `

    let searchQry = _util.createConditionQryForSearch( "nickname","and", keywords, "having");
    let order = ` order by create_at desc
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

    let sql2 = `select count(*) as total
                from ( 
                    select (select nickname from \`user\` where id = a.user_id) as nickname
                            , account
                    FROM transactions a
                    ${condition}
                    ${searchQry}
                ) a
                `
    result = await db.qry(sql2)

    chk = _util.selectChkFromDB(result);

    if (chk < 1) {
        return jresp.sqlError();
    }

    let total = result["rows"][0]["total"];

    for (let item of data) {
        if (item.status === 0)
            delete item.complete_at
    }

    return jresp.successData(data, data.length, total);
}

// 하나의 회원 정산 신청 내역 상세 조회
pointService.readAdjustmentHistoryDetail = async (id) => {


    let head = `SELECT id, user_id
                    , (select nickname from \`user\` where id = a.user_id) as nickname
                    , point_type, point_quantity, account
                    , status, create_at as apply_at, update_at as complete_at
                FROM transactions a
                where a.id = ${id} 
                `
    let sql = head;

    let result = await db.qry(sql);

    let chk = _util.selectChkFromDB(result);

    if (chk < 1) {
        return jresp.sqlError();
    }

    let item = result["rows"][0];

    if (item.status === 0)
        delete item.complete_at

    return jresp.successData(item, 1, 1);
}

// 정산 완료 처리
pointService.completeAppliedAdjustment = async (id, _type) => {

    let result;
    let sql;

    switch (Number(_type)) {

        // 충전 포인트 정산
        case 0 :
            sql = `update transactions tr
                    set 
                        tr.update_at = now()
                        , tr.status = 1 
                    where tr.id = :id
                    and tr.status = 0
                    and tr.point_type = 0`;
            break;

        // 후원 포인트 정산
        case 1 :
            sql = `update transactions tr
                    set 
                        tr.update_at = now()
                        , tr.status = 1  
                    where tr.id = :id
                    and tr.status = 0
                    and tr.point_type = 1`;
            break;

        default :
            return jresp.invalidData();
    }

    let sqlParams = {
        id:id,
    }

    result = await db.qry(sql,sqlParams);

    if (!result['success'] || result['rows']['affectedRows'] < 1) {
        console.log("update fail");
        return jresp.sqlError();
    }

    return jresp.successData();
};


module.exports = pointService;