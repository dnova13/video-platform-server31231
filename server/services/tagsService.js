let tagsService = {};

tagsService.insertTags = async (tags, _type) => {

    if (!tags) {
        return jresp.invalidData();
    }

    _type = _type ? _type : 0;

    let updateIdx = "";
    let idxCol = ", idx_search";

    if (_type === 2) {
        idxCol = ", idx_search "
        updateIdx = `, idx_search = VALUES(idx_search) `
    }

    else if (_type === 1) {
        idxCol = ", idx_recommend "
        updateIdx = `, idx_recommend = VALUES(idx_recommend) `
    }

    let sql;
    let sqlF = `insert into tags(tag, who_using ${idxCol} ) ` +
                "values ";

    let sqlM = "";
    let onDup = " ON DUPLICATE KEY " +
        `UPDATE cnt = if(${_type} = 0, cnt + 1, cnt)  
                        , who_using = if(who_using like '%${_type}%', who_using, concat(who_using, ${_type}))
                        ${updateIdx}
                        , update_at = now() `;
    let result;
    let i = 0;

    for (let tag of tags) {

        i++;

        if (String(tag).length < 1 ) {
            return jresp.invalidData();
        }

        sqlM += `('${tag}', ${_type}, ${_type > 0 ? i : 0}),`
    }

    sqlM = sqlM.slice(0, -1);
    sql = sqlF + sqlM + onDup

    // console.log(sql)

    result = await db.qry(sql);

    console.log(result);

    if (!result['success'] || result['rows'].length < 1) {
        return jresp.sqlError();
    }

    return jresp.successData();
}


tagsService.getRecommendTagList = async () => {

    console.log("getRecommendTagList");

    let sql = `select id, tag  
                from tags  
                where who_using like '%1%'
                order by idx_recommend asc 
                `

    let result = await db.qry(sql);

    if (!result['success']) {
        return jresp.sqlError();
    }

    if (result['rows'].length < 1) {
        return jresp.emptyData();
    }

    let data = result["rows"];

    return jresp.successData(data, data.length, data.length);
}

tagsService.getComSearchTagList = async () => {

    console.log("getSearchTagList");

    let sql = `select id, tag  
                from tags  
                where who_using like '%2%'
                order by idx_search asc 
                `

    let result = await db.qry(sql);

    if (!result['success']) {
        return jresp.sqlError();
    }

    if (result['rows'].length < 1) {
        return jresp.emptyData();
    }

    let data = result["rows"];

    return jresp.successData(data, data.length, data.length);
}

tagsService.deleteTags = async (tags, _type) => {

    let idStr = tags.toString();

    let sql = `update tags 
                set who_using = replace (who_using, ${_type}, "")
                where who_using like '%${_type}%'
                and id in (${idStr}) `

    let result = await db.qry(sql);

    // console.log(sql)

    if (!_util.updateChkFromDB(result)) {
        return jresp.sqlError();
    }

    await deleteTagsFromDB(idStr)

    return jresp.successData();
}

const deleteTagsFromDB = async (ids) => {

    let idStr = ids;

    let sql = ` delete from tags
                where length(ifnull(who_using,"")) = 0
                and id in (${idStr}) `

    let result = await db.qry(sql)

    if (!_util.updateChkFromDB(result)) {
        return jresp.sqlError();
    }

    return jresp.successData();
}

module.exports = tagsService;