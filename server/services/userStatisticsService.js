const userStatisticsService = {}

const dayofweekNumToKorean = (num) => {

    switch (num) {

        case 1 :
            return "일"
        case 2 :
            return "월"
        case 3 :
            return "화"
        case 4 :
            return "수"
        case 5 :
            return "목"
        case 6 :
            return "금"
        case 7 :
            return "토"
    }
}

// 월 - 일 까지
const getCountEachDayInWeek = async (type, date) => {

    let sql = `select dayofweek(daily_date) as 'dayofweek', daily_date as date
                    , ${type}_cnt 
                from daily_statistics 
                where daily_date  
                    between :date - interval (dayofweek(:date) - 1) - 1  day
                    and :date - interval (dayofweek(:date) - 7) - 1 day
                order by daily_date asc`
    let sqlParams = {date: date};
    let result = await db.qry(sql, sqlParams);

    let chk = _util.selectChkFromDB(result);

    if (chk < 0) {
        return jresp.sqlError();
    }

    if (chk === 0) {
        return jresp.emptyData()
    }

    let data = result["rows"];

    for (let item of data) {
        item.dayofweek_kr = dayofweekNumToKorean(item.dayofweek)
    }

    return jresp.successData(data)
}

const getCountEachDayIn7days = async (type, date) => {

    let sql = `select dayofweek(daily_date) as 'dayofweek', daily_date as date
                    , ${type}_cnt
                    , DATEDIFF(daily_date, :date) - 1 + 8 as idx 
                from daily_statistics 
                where daily_date  
                    between :date - interval 6 day
                    and :date
                order by daily_date asc`
    let sqlParams = {date: date};
    let result = await db.qry(sql, sqlParams);

    let chk = _util.selectChkFromDB(result);

    if (chk < 0) {
        return jresp.sqlError();
    }

    if (chk === 0) {
        return jresp.emptyData()
    }

    let data = result["rows"];

    for (let item of data) {
        item.dayofweek_kr = dayofweekNumToKorean(item.dayofweek)
    }

    return jresp.successData(data);
}


const getCountEachMonthInTheYear = async (type, date) => {

    let sql = `select ifnull(sum(access_cnt), 0) as ${type}_cnt 
                    , date_format(daily_date, "%Y-%m") as 'date'
                    , month(daily_date) as idx
                from daily_statistics
                where year(daily_date) = year(:date) 
                group by date_format(daily_date, "%Y%m")
                order by daily_date `
    let sqlParams = {date: date};
    let result = await db.qry(sql, sqlParams);

    let chk = _util.selectChkFromDB(result);

    if (chk < 0) {
        return jresp.sqlError();
    }

    if (chk === 0) {
        return jresp.emptyData()
    }

    let data = result["rows"];

    for (let item of data) {
        item.dayofweek_kr = dayofweekNumToKorean(item.dayofweek)
    }

    return jresp.successData(data);

}

userStatisticsService.getJoinCountEachDayIn7days = async (date) => {

    let type = "join";
    return getCountEachDayIn7days(type, date);
}

userStatisticsService.getLoginCountEachDayInWeek = async (date) => {

    let type = "access";
    return getCountEachDayInWeek(type, date);
}

userStatisticsService.getLoginCountEachDayIn7days = async (date) => {

    let type = "access";
    return getCountEachDayIn7days(type, date);
}

userStatisticsService.getLoginCountEachMonthInTheYear = async (date) => {

    let type = "access";
    return getCountEachMonthInTheYear(type, date);
}

module.exports = userStatisticsService;


