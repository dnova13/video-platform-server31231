module.exports = async (req, res, next) => {

    if (req.originalUrl.includes("/charge/webhook")) {

        return next();
    }

    if (!_util.hasKey(req.cookies, 'token') && !_util.hasKey(req.headers, 'token')) {

        console.log("is not token")
        res.json(jresp.invalidAccount())
        return
    }

    const token = req.cookies['token'] || req.headers['token']

    try {

        const info = await jwt.verify(token)
        req.uinfo = info;

        // 유저 체크
        if (!_util.hasKey(info, "u") || !_util.isBeyondZero(info["u"])) {
            console.log("!!!! invalid u")
            throw new Error();
        }

        /*      /// 토큰 10분 유예기간
                if ( 600 > (info['exp'] - Math.round(new Date().valueOf()/1000)) ) {
                    const gt = {uuid: info['uuid'], id: info['id'], type: info['type']}
                    let token = await jwt.sign(JSON.parse(JSON.stringify(gt)))
                    res.cookie('jwt', token)
                    console.log(token)
                }
        */
    } catch (e) {
        return res.json(jresp.tokenError())
    }

    next();
}
