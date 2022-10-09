
let dailyVideoMangerService = {};

dailyVideoMangerService.isDailyChk = async (videoPostId) => {

    let sql = "select count(*) as cnt " +
        "    from daily_video_manager " +
        `    where video_post_id = ${videoPostId} ` +
        "    and daily_date = current_date() "

    let result = await db.qry(sql);

    if (!result['success'] || result['rows'].length < 1) {
        return -1;
    }

    return result['rows'][0]["cnt"] > 0 ? 1 : 0;
}

dailyVideoMangerService.dailyChkVideo = async (type, videoPostId, score) => {

    console.log("daily !@!@");

    let res;
    let result = await dailyVideoMangerService.isDailyChk(videoPostId);

    switch (result) {

        case 0:

            let sql = `INSERT INTO daily_video_manager (${type}_cnt, video_post_id, daily_date)
                        VALUES(1, ${videoPostId}, current_date())`

            if (type === "score") {
                sql = `INSERT INTO daily_video_manager (${type}_cnt, video_post_id, daily_date, score_sum)
                        VALUES(1, ${videoPostId}, current_date(), ${score})`
            }

            result = await db.qry(sql);

            if (!result['success'] || result['rows'].length < 1) {
                return -1;
            }

            res = result['rows']['insertId'];
            break;

        case 1:
            let sql2 = `update daily_video_manager 
                        set ${type}_cnt = ${type}_cnt + 1 
                        where video_post_id = ${videoPostId}
                        and daily_date = current_date() `

            if (type === "score") {
                sql2 = `update daily_video_manager 
                        set ${type}_cnt = ${type}_cnt + 1
                            , score_sum = score_sum + ${score}  
                        where video_post_id = ${videoPostId}
                        and daily_date = current_date() `
            }

            result = await db.qry(sql2);

            if (!result['success'] || result['rows'].length < 1) {
                return -1;
            }

            res = result['rows']['affectedRows'];
            break;
    }

    return res;
}
dailyVideoMangerService.dailyUnChkVideo = async (type, videoPostId) => {

    let res;
    let result = await dailyVideoMangerService.isDailyChk(videoPostId);

    switch (result) {

        case 0:
            let sql = `INSERT INTO daily_video_manager (${type}_cnt, video_post_id, daily_date)
                        VALUES(0, ${videoPostId}, current_date())`

            result = await db.qry(sql);

            if (!result['success'] || result['rows'].length < 1) {
                return -1;
            }

            res = result['rows']['insertId'];
            break;

        case 1:
            let sql2 = `update daily_video_manager 
                        set ${type}_cnt = if(${type}_cnt - 1 < 0, 0, ${type}_cnt - 1) 
                        where video_post_id = ${videoPostId}
                        and daily_date = current_date() `

            result = await db.qry(sql2);

            if (!result['success'] || result['rows'].length < 1) {
                return -1;
            }

            res = result['rows']['affectedRows'];
            break;
    }

    return res;
}


module.exports = dailyVideoMangerService;