const express = require('express')
const router = express.Router()
const util = require('util')

const fs = require('fs-extra')
const ffmpeg = require('fluent-ffmpeg');
const ffprobeInstaller = require('@ffprobe-installer/ffprobe');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

import aws from "aws-sdk";
import multer from "multer";
import {
    imgUpload,
    videoUpload,
    filesUpload,
    s3VideoUpload,
    s3HlsUpload
} from "../../commons/upload";

ffmpeg.setFfprobePath(ffprobeInstaller.path);


// 일반 서버 이미지 업로드 용.
router.post('/upload/image', (req, res) => {

    try {
        imgUpload(req, res, async (err) => { // params : images

            if (err instanceof multer.MulterError) {

                return res.send(jresp.uploadError(err.message))

            } else if (err) {
                // console.log("err", err.message);
                return res.json(jresp.uploadError(err.message))
            }

            let files = req.files;
            let result;
            let fids = [];

            console.log(files);

            if (!files) {
                return res.json(jresp.uploadError())
            }

            for (let file of files) {

                let body = {};

                body.name = file.originalname;
                body.uuid = file.filename;
                body.size = file.size;
                body.mimetype = file.mimetype;
                body.path = file.destination.replaceAll(__upload_dir, "") + "/" + file.filename;

                result = await insertFile(body, 0)

                console.log(result);

                if (result > 0) {
                    fids.push(result);
                } else {
                    return res.send(jresp.sqlError());
                }
            }

            if (fids.length < 1) {
                return res.json(jresp.uploadError())
            }

            return res.send(jresp.successData({ "fids": fids }))
        })

    } catch (err) {
        return res.send(jresp.uploadError());
    }
})

// 일반 서버 파일 업로드 용
router.post('/upload/files', (req, res) => {

    try {
        filesUpload(req, res, async (err) => { // params : files

            console.log(__upload_dir);

            if (err instanceof multer.MulterError) {

                return res.send(jresp.uploadError(err.message))

            } else if (err) {
                console.log("err", err.message);
                return res.json(jresp.uploadError(err.message))
            }

            let files = req.files;
            let result;
            let fids = [];

            console.log(files);

            if (!files) {
                return res.json(jresp.uploadError())
            }

            for (let file of files) {

                let body = {};

                body.name = file.originalname;
                body.uuid = file.filename;
                body.size = file.size;
                body.mimetype = file.mimetype;
                body.path = file.destination.replaceAll(__upload_dir, "") + "/" + file.filename;

                result = await insertFile(body, 0)

                console.log(result);

                if (result > 0) {
                    fids.push(result);
                } else {
                    return res.send(jresp.sqlError());
                }
            }

            if (fids.length < 1) {
                return res.json(jresp.uploadError())
            }

            return res.send(jresp.successData({ "fids": fids }))
        })

    } catch (err) {
        return res.send(jresp.uploadError());
    }
})

// 일반 서버용 업로드.
router.post('/upload/video', (req, res) => {

    try {
        videoUpload(req, res, err => {

            // console.log(__upload_dir);
            if (err instanceof multer.MulterError) {

                return res.send(jresp.uploadError(err.message))

            } else if (err) {
                console.log("err1", err.message);
                return res.send(jresp.uploadError(err.message))
            }

            let file = req.file;
            let result;

            console.log(file)
            if (!file) {
                return res.send(jresp.uploadError())
            }

            // hls 변환 추가
            ffmpeg.setFfmpegPath(ffmpegInstaller.path);
            let hls_video = ffmpeg(file.path, { timeout: 432000 })

            hls_video.addOptions([
                '-profile:v baseline',
                '-level 3.0',
                '-start_number 0',
                '-hls_time 10',
                '-hls_list_size 0',
                '-f hls'
            ])
            hls_video.output(file.path + '.m3u8').on('end', async () => {

                console.log("end")

                // insert file table
                let body = {};

                body.name = file.originalname;
                body.uuid = file.filename.replaceAll(".mp4", "");
                body.size = file.size;
                body.mimetype = file.mimetype;

                ffmpeg.ffprobe(file.path, async (err, metadata) => {

                    if (err) {
                        console.error(err)
                        return res.send(jresp.uploadError());
                    }

                    // console.dir(metadata);
                    // console.log(metadata.format.duration);

                    body.duration = parseInt(metadata.format.duration);
                    body.path = file.destination.replaceAll(__upload_video_dir, "") + "/" + file.filename;

                    result = await insertFile(body, 1)

                    if (result < 1) {
                        return res.send(jresp.sqlError());
                    }
                    fs.unlink(file.path, err => {
                    });
                    return res.send(jresp.successData({ "fid": result }))
                });
            }).run()

        })

    } catch (err) {
        return res.send(jresp.uploadError());
    }
})

// s3 비디오 업로드용.
router.post('/upload/s3/video', (req, res) => {

    try {
        s3HlsUpload(req, res, err => {

            if (err instanceof multer.MulterError) {
                return res.send(jresp.uploadError(err.message))
            } else if (err) {
                console.log("err1", err.message);
                return res.send(jresp.uploadError(err.message))
            }

            let file = req.file;
            let result;

            if (!file) {
                return res.send(jresp.uploadError())
            }

            // hls 변환 추가
            ffmpeg.setFfmpegPath(ffmpegInstaller.path);
            let hls_video = ffmpeg(file.path, { timeout: 432000 })

            hls_video.addOptions([
                '-profile:v baseline',
                '-level 3.0',
                '-start_number 0',
                '-hls_time 10',
                '-hls_list_size 0',
                '-f hls'
            ]);
            hls_video.output(`${file.path}.m3u8`).on('end', async () => {
                console.log("end")

                // const fileContent = fs.readFileSync(file.destination);

                let is_err = await uploadHlsToS3(file)

                console.log("###########", is_err)
                if (is_err) return res.send(jresp.uploadError("not upload at s3"));

                let body = {};

                body.name = file.originalname;
                body.uuid = file.filename.replaceAll(".mp4", "");
                body.size = file.size;
                body.mimetype = file.mimetype;


                ffmpeg.ffprobe(file.path, async (err, metadata) => {

                    if (err) {
                        console.error(err)
                        return res.send(jresp.uploadError());
                    }


                    body.duration = parseInt(metadata.format.duration);
                    body.path = file.destination.replaceAll(__upload_video_dir, "") + "/" + file.filename;

                    result = await insertFile(body, 1)

                    if (result < 1) {
                        return res.send(jresp.sqlError());
                    }

                    fs.removeSync(file.destination)
                    return res.send(jresp.successData({ "fid": result }))
                });
            }).run()
        })

    } catch (err) {
        console.log("!!!!!!!", err)
        return res.send(jresp.uploadError());
    }
})

async function uploadHlsToS3(_file) {

    let _path = _file.destination
    const fileDir = fs.readdirSync(_path);
    const bucket = new aws.S3({
        accessKeyId: process.env.AWS_ID,
        secretAccessKey: process.env.AWS_SECRET,
        // region: process.env.S3_REGION
    });

    let _err = false

    for (let f of fileDir) {

        if (_err) return _err

        if (f.includes(".ts") || f.includes(".m3u8")) {

            const fileContent = fs.readFileSync(`${_path}/${f}`)

            let params = {
                Bucket: process.env.AWS_BUCKET + "/hls",
                Key: `${_file.uuid}/${f}`,
                Body: fileContent,
                ACL: 'public-read'
            };

            bucket.putObject(params, async function (err, data) {
                if (err) _err = true
            });
        }
    }

    return _err;
}

router.get('/image/:id', async (req, res) => {

    let out = {}
    let sql
    let sqlP
    let result
    let id = req.params.id

    if (id == null || _util.isBlank(id)) {

        return res.json(jresp.invalidData());
    }

    sql = "SELECT `path`, mime_type, `size`, name " +
        "FROM files " +
        "WHERE id = :id " +
        "AND file_type = 0"
    sqlP = { id: id }
    result = await db.qry(sql, sqlP)

    if (!result['success']) {
        return res.json(jresp.sqlError());
    }

    if (result['rows'].length < 1) {
        return res.json(jresp.emptyData());
    }

    let _stream = fs.createReadStream(util.format('%s%s', __upload_dir, result['rows'][0]['path']))

    _stream.on('open', () => {
        // res.set('Content-Type', result['rows'][0]['mime_type']);
        res.set('Content-Type', "image/" + "png");
        res.set('Content-Length', result['rows'][0]['size']);

        _stream.pipe(res);
    })

    _stream.on('error', e => {
        return res.json(jresp.downloadError());
    });
})

router.get('/img/:uuid', async (req, res) => {

    let out = {}
    let sql
    let sqlP
    let result
    let uuid = req.params.uuid

    if (uuid == null || _util.isBlank(uuid)) {

        return res.json(jresp.invalidData());
    }

    sql = "SELECT `path`, mime_type, `size`, name " +
        "FROM files " +
        "WHERE uuid = :uuid " +
        "AND file_type = 0"
    sqlP = { uuid: uuid }

    result = await db.qry(sql, sqlP)

    if (!result['success']) {
        return res.json(jresp.sqlError());
    }

    if (result['rows'].length < 1) {
        return res.json(jresp.emptyData());
    }

    let _stream = fs.createReadStream(util.format('%s%s', __upload_dir, result['rows'][0]['path']))

    _stream.on('open', () => {
        res.set('Content-Type', result['rows'][0]['mime_type']);
        res.set('Content-Length', result['rows'][0]['size']);
        _stream.pipe(res);
    })

    _stream.on('error', e => {
        return res.json(jresp.downloadError());
    });
});

router.get('/video/:uuid', async (req, res) => {

    let out = {}
    let sql
    let sqlP
    let result
    let uuid = req.params.uuid

    if (uuid == null || _util.isBlank(uuid)) {

        return res.json(jresp.invalidData());
    }

    sql = "SELECT `path`, mime_type, `size`, name " +
        "FROM files " +
        "WHERE uuid = :uuid " +
        "AND file_type = 1"
    sqlP = { uuid: uuid }

    result = await db.qry(sql, sqlP)

    if (!result['success']) {
        return res.json(jresp.sqlError());
    }

    if (result['rows'].length < 1) {
        return res.json(jresp.emptyData());
    }

    // res.sendredirect(result['rows'][0]["path"]);

    res.redirect(__host + result['rows'][0]["path"]);
});

router.get('/download/:uuid', async (req, res) => {

    let out = {}
    let sql
    let sqlP
    let result
    let uuid = req.params.uuid

    if (uuid == null || _util.isBlank(uuid)) {

        return res.json(jresp.invalidData());
    }

    sql = "SELECT `path`, mime_type, `size`, name " +
        "FROM files " +
        "WHERE uuid = :uuid " +
        "AND file_type = 0"
    sqlP = { uuid: uuid }

    result = await db.qry(sql, sqlP)

    if (!result['success']) {
        return res.json(jresp.sqlError());
    }

    if (result['rows'].length < 1) {
        return res.json(jresp.emptyData());
    }

    // res.sendredirect(result['rows'][0]["path"]);

    let _stream = fs.createReadStream(util.format('%s%s', __upload_dir, result['rows'][0]['path']))
    let fileName = encodeURIComponent(result['rows'][0]['name']);

    _stream.on('open', () => {
        res.set('Content-Type', result['rows'][0]['mime_type']);
        res.set('Content-Length', result['rows'][0]['size']);
        res.set('Content-Disposition', 'attachment;filename*=UTF-8\'\'' + fileName);

        _stream.pipe(res);
    })

    _stream.on('error', e => {
        return res.json(jresp.downloadError());
    });
});

router.get('/video/id/:id', async (req, res) => {

    let out = {}
    let sql
    let sqlP
    let result
    let id = Number(req.params.id)

    console.log(id);

    if (!id || id < 1) {

        return res.json(jresp.parsingError());
    }

    sql = "SELECT `path`, mime_type, `size`, name " +
        "FROM files " +
        "WHERE id = :id " +
        "AND file_type = 1"
    sqlP = { id: id }

    result = await db.qry(sql, sqlP)

    if (!result['success']) {
        return res.json(jresp.sqlError());
    }

    if (result['rows'].length < 1) {
        return res.json(jresp.emptyData());
    }

    return res.json(jresp.successData(__host + result['rows'][0]["path"]), 1, 1)
});


async function insertFile(body, _type) {

    let sql;
    let sqlParams;
    let result;

    sql = "INSERT INTO files (name, uuid, file_type, mime_type, `size`, `path`, duration) " +
        "VALUES(:name, :uuid, :type, :mimetype, :size, :path, :duration) ";
    sqlParams = {
        name: body['name']
        , uuid: body['uuid']
        , type: _type ? _type : 0
        , size: body['size']
        , path: body['path']
        , mimetype: body['mimetype']
        , duration: body['duration'] ? body['duration'] : 0
    }

    result = await db.qry(sql, sqlParams);

    if (!result['success'] || result['rows'].length < 1) {
        return 0;
    }

    const fid = result['rows']['insertId']

    return fid;
}


module.exports = router