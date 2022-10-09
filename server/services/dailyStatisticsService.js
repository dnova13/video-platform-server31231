let dailyStatisticsService = {};

dailyStatisticsService.dailyChkStatistics = async (type) => {

    console.log("daily statistics");

    let res;
    let result;
    let sql = `insert into daily_statistics (${type}_cnt, daily_date)
                values (1, current_date())
                ON DUPLICATE KEY 
                update ${type}_cnt = ${type}_cnt + 1
                    , update_at = now()`

    result = await db.qry(sql);

    if (!result['success'] || result['rows'].length < 1) {
        return -1;
    }

    res = result['rows']['insertId'];

    console.log(res)
    return res;
}

const getDailyCount = async (type) => {

    let sql;
    let result;

    sql = `select ${type}_cnt 
            from daily_statistics 
            where daily_date = current_date()`

    result = await db.qry(sql);

    let chk = _util.selectChkFromDB(result);

    return chk < 1 ? chk : result["rows"][0][`${type}_cnt`]
}

dailyStatisticsService.getDailyJoin = async () => {

    let type = "join";
    let result = await getDailyCount(type);

    if (result < 0) {
        return jresp.sqlError();
    }

    return jresp.successData({"daily_join":result});
}

dailyStatisticsService.getDailyLogin = async () => {

    let type = "access";
    let result = await getDailyCount(type);

    if (result < 0) {
        return jresp.sqlError();
    }

    return jresp.successData({"daily_login":result});
}

dailyStatisticsService.getDailyEarnings = async () => {

    let sql;
    let result;

    sql = `select ifnull(sum(point_quantity), 0) as daily_earnings
            from points_history 
            where point_purpose = 1
            and date_format(update_at, "%Y-%m-%d") = current_date()`

    result = await db.qry(sql);

    let chk = _util.selectChkFromDB(result);

    if (chk < 0) {
        return jresp.sqlError();
    }

    let earnings = chk === 0 ? chk : result["rows"][0]["daily_earnings"]

    return jresp.successData({"daily_earnings":earnings});
}

module.exports = dailyStatisticsService;