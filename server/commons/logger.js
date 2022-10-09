const fs = require('fs-extra');

function logger(path, level) {

    if (!(this instanceof logger)) {
        return new logger(path, level)
    }

    this.level = level

    if (path != null) {
        this.path = path
        this.f = fs.createWriteStream(path, { flags: 'a' })
    }
}

logger.prototype.error = function (s) {

    if (this.level < 5) {
        return
    }

    s = obj2str(s)
    const d = new Date().toISOString()
    console.error(`${d}: ${s}`)
    // writeFile(`${d}: ${s}`)
}

logger.prototype.info = function (s) {
    if (this.level < 3) {
        return
    }
    s = obj2str(s)
    const d = new Date().toISOString()
    console.info(`${d}: ${s}`)
    // writeFile(`${d}: ${s}`)
}

logger.prototype.debug = function (s) {
    if (this.level < 2) {
        return
    }
    s = obj2str(s)
    const d = new Date().toISOString()
    console.log(`${d}: ${s}`)
    // writeFile(`${d}: ${s}`)
}

logger.prototype.warn = function (s) {
    if (this.level < 4) {
        return
    }
    s = obj2str(s)
    const d = new Date().toISOString()
    console.warn(`${d}: ${s}`)
    // writeFile(`${d}: ${s}`)
}

function obj2str(o) {
    if (typeof o === 'object') {
        return JSON.stringify(o)
    }
    return o
}

function writeFile(s) {

    if (this.f) {
        return
    }
    log.write(`${s}\n`)
}

module.exports = logger