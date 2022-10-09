const jwt = require('jsonwebtoken')

// 토큰 초기화
function _JWT(secret) {
    if(!(this instanceof _JWT)) {
        return new _JWT(secret)
    }

    this.secret = secret
}

// 토큰 등록
_JWT.prototype.register = function(__payload) {
    return new Promise((resolve, reject) => {
        jwt.sign(__payload, this.secret, {
            expiresIn: process.env.JWT_EXPIRE
            ,issuer: process.env.JWT_ISSUER
            ,subject: process.env.JWT_SUBJECT
        }, (err, token) => {
            if (err) reject(err)
            resolve(token)
        })
    })
}

// 토큰 디스크립트
_JWT.prototype.verify = function(token) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, this.secret, (err, decoded) => {
            if(err) reject(err)
            resolve(decoded)
        })
    })
}


module.exports = _JWT