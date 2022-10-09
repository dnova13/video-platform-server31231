let otherPostService = {}

otherPostService.writePost = async (type, body) => {

    console.log(body);

    let sql = `INSERT INTO other_post_meta (\`type\`, title, content, user_id, file_id) 
                VALUES(:type, :title, :content, :user_id, :file_id)`
    let sqlParams = {
        type: type,
        title: body.title,
        content: body.content,
        user_id: body.user_id,
        file_id: body.file_id ? body.file_id : 0
    }

    let result = await db.qry(sql, sqlParams);

    if (!_util.insertChkFromDB(result)) {
        return jresp.sqlError();
    }

    return jresp.successData({ "id": result['rows']['insertId'] });
};

otherPostService.modifyPost = async (type, body) => {

    let sql = `update other_post_meta 
                set title = if(length(:title) > 0, :title, title)
                    , content = if(length(:content) > 0, :content, content)
                    , file_id = if(:file_id > 0, :file_id, file_id)
                where id = :id 
                and \`type\` = :type`

    let sqlParams =
    {
        type: type,
        id: body.id,
        title: body.title ? body.title : "",
        content: body.content ? body.content : "",
        file_id: body.file_id ? body.file_id : 0,
        user_id: body.user_id
    }

    let result = await db.qry(sql, sqlParams);

    if (!_util.updateChkFromDB(result)) {
        return jresp.sqlError();
    }

    return jresp.successData();
};

otherPostService.deletePost = async (type, id) => {

    let sql = `delete 
                from other_post_meta
                where id = :id 
                and \`type\` = :type`
    let sqlParams = { id: id, type: type }

    let result = await db.qry(sql, sqlParams);

    if (!_util.updateChkFromDB(result)) {
        return jresp.sqlError();
    }

    return jresp.successData();
};

const getPostList = async (type, limit, offset) => {

    let sql = `select id, title, content, create_at, update_at
                from other_post_meta 
                where \`type\` = '${type}'
                order by create_at desc, id desc
                limit ${limit} offset ${offset}`
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
                from other_post_meta 
                where \`type\` = '${type}'`

    result = await db.qry(sql2)

    chk = _util.selectChkFromDB(result);

    if (chk < 1) {
        return jresp.sqlError();
    }

    let total = result["rows"][0]["total"];

    return jresp.successData(data, data.length, total);
}


otherPostService.getNoticePostList = async (limit, offset) => {

    return await getPostList("notice", limit, offset);
}

otherPostService.searchNoticePostList = async (limit, offset, keyword) => {

    let head = `select id, title, content, create_at, update_at
                from other_post_meta 
                where \`type\` = 'notice'
                `

    let searchQry = _util.createConditionQryForSearch("concat(title, ' ', content)", "and", keyword, "and")

    let order = ` order by create_at desc, id desc
                limit ${limit} offset ${offset - 1} `

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

    let sql2 = `select count(*) as total
                from other_post_meta 
                where \`type\` = 'notice' `

    result = await db.qry(sql2 + searchQry)

    chk = _util.selectChkFromDB(result);

    if (chk < 1) {
        return jresp.sqlError();
    }

    let total = result["rows"][0]["total"];

    return jresp.successData(data, data.length, total);
}


otherPostService.searchSuggestPostList = async (limit, offset, keyword) => {

    let head = `select a.id, a.title, a.content
                        , a.create_at, a.update_at
                        , a.user_id, b.nickname 
                from other_post_meta a
                inner join \`user\` b
                on a.user_id = b.id
                where \`type\` = 'suggest'
                `

    let searchQry = _util.createConditionQryForSearch("concat(a.title, ' ', a.content, ' ', b.nickname)", "and", keyword, "and")

    let order = ` order by create_at desc, id desc
                limit ${limit} offset ${offset - 1} `

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

    let sql2 = `select count(*) as total 
                from other_post_meta a
                inner join \`user\` b
                on a.user_id = b.id
                where \`type\` = 'suggest' `

    result = await db.qry(sql2 + searchQry)
    chk = _util.selectChkFromDB(result);

    if (chk < 1) {
        return jresp.sqlError();
    }

    let total = result["rows"][0]["total"];

    return jresp.successData(data, data.length, total);
}

otherPostService.searchIntroPostList = async (limit, offset, keyword) => {

    let head = `select a.id, title
                        , f.uuid as file, f.name 
                        , a.create_at
                from other_post_meta a
                inner join files f
                on a.file_id = f.id
                where \`type\` = 'intro'
                `

    let searchQry = _util.createConditionQryForSearch("concat(title)", "and", keyword, "and")

    let order = ` order by create_at desc, id desc
                limit ${limit} offset ${offset - 1} `

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

    let sql2 = `select count(*) as total
                from other_post_meta 
                where \`type\` = 'intro' `

    result = await db.qry(sql2 + searchQry)
    chk = _util.selectChkFromDB(result);

    if (chk < 1) {
        return jresp.sqlError();
    }

    let total = result["rows"][0]["total"];

    for (let item of data) {
        item.file = _util.createFileDownPath(item.file);
    }

    return jresp.successData(data, data.length, total);
}


otherPostService.readPostDetail = async (type, id) => {

    let otherParams = "";

    if (type === "suggest") {
        otherParams = ", user_id, (select nickname from `user` where id = a.user_id) as nickname "
    }

    if (type === "intro") {
        otherParams = ", (select uuid from files where id = a.file_id) as file " +
            ", (select name from files where id = a.file_id) as name "
    }

    let sql = `select id, title, content, create_at, update_at
                    ${otherParams}
                from other_post_meta a
                where \`type\` = '${type}'
                and id = ${id};
                `
    let result = await db.qry(sql);
    let chk = _util.selectChkFromDB(result);

    if (chk < 1) {
        return jresp.sqlError();
    }

    let data = result["rows"][0];

    if (type === "intro") {
        delete data.content
        delete data.update_at;

        data.file = _util.createFileDownPath(data.file);
    }

    return jresp.successData(data, 1, 1);
}


module.exports = otherPostService;