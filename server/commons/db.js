function DB(pool) {
    if (!(this instanceof DB)) {
        return new DB(pool);
    }

    this.pool = pool

    this.pool.config.connectionConfig.queryFormat = function (query, values) {

        if (!values) return query;

        return query.replace(/\:(\w+)/g, function (txt, key) {
            if (values.hasOwnProperty(key)) {
                return this.escape(values[key]);
            }
            return txt;
        }.bind(this));
    };
}

DB.prototype.qry = function (qry, params) {
    return new Promise((resolve, reject) => {

        if (!this.pool) {
            console.error("not found db pool")
            // console.error("not found db pool");

            let res = {success: false}
            //reject(new Error("db conn error"))
            resolve(res)
            return
        }

        this.pool.getConnection((err, conn) => {

            if (err) {
                console.error(err.stack)

                if (conn && conn.hasOwnProperty('release')) conn.release()

                let res = {success: false}
                //reject(new Error("db conn error"))
                resolve(res)
                return
            }

            conn.query(qry, params, (err, rows, fin) => {
                let res = {}

                if (err) {
                    console.error(err.stack)
                    // console.error(e.stack);
                    res = err
                    res['success'] = false
                    conn.release()
                    resolve(res)
                    return
                }

                res['success'] = true
                res['rows'] = rows

                // console.log(fin);

                conn.release()
                resolve(res)
            })
        })
    })
}

DB.prototype.getConn = function() {
    return new Promise((resolve, reject) => {
        this.pool.getConnection((err, conn) => {
            if (err) {
                reject(err)
                return
            }

            resolve(conn)
        })
    })
}

DB.prototype.execQry = function(conn, qry, params) {
    return new Promise((resolve, reject) => {

        if (params && params.hasOwnProperty && params.hasOwnProperty('p')) {
            if (!params.hasOwnProperty('limit')) {
                params['limit'] = 10
            }

            if (params.page < 1) {
                params.page = 0
            } else {
                params.page -= 1
            }

            params.page *= params.limit
        }

        conn.query(conn, params, (err,result,final) => {

            if (err) {
                reject(err)
                return
            }

            resolve(result)
        })
    })
}

module.exports = DB