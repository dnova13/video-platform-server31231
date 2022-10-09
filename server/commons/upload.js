import multer from "multer";
import multerS3 from "multer-s3";
import aws from "aws-sdk";

const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs-extra');


// 용량 및 파일 개수 셋팅
const maxFileSize = 1 * 1024 * 1024; // 2 mb
const maxVideoSize = 1 * 1024 * 1024 * 1024; // 1gb
const maxCount = 20;

/*const storage = multer.diskStorage({//서버에 파일 저장 관리

    destination: function (req, file, cb) {
        cb(null, 'public/images/upload/profile/'); //이미지 폴더 경로
    },

    filename: function (req, file, cb) { //파일의 이름을 지정
        console.log(file);
        const userId = req.user.user_id;
        const ext = path.extname(file.originalname); //확장자
        const uploadFile = path.basename(file.originalname, ext) + '_' + userId + '_' + new Date().valueOf() + ext;
        cb(null, uploadFile);
    }
});*/

// 디렉토리 생성
function createDir(rootDir, subDir, useDateDir) {

    const dateDir = useDateDir ? moment().format('/YYYYMMDD') : ""
    const _subDir = subDir ? `/${subDir}` : "";

    const path = rootDir + _subDir + dateDir;

    if (fs.existsSync(path)) {
        return path
    }

    fs.ensureDirSync(path)
    return path
}

//파일의 허용 범위 체크
const imgFilter = (req, file, cb) => {

    let ext = "";

    try {
        console.log(file);
        ext = file.mimetype.split("/")[1];
    } catch (err) {
    }

    console.log("ext : ", ext);

    if (ext !== 'png' && ext !== 'jpg' && ext !== 'jpeg') {
        cb(new Error('Only images are allowed'))
    }

    cb(null, true);
}

let videoStorage = multer.diskStorage({

    destination: function (req, file, cb) {

        let path = createDir(__upload_video_dir, "video/" + file.uuid);
        cb(null, path)  // server upload 경로
    },

    filename: function (req, file, cb) {

        cb(null, file.uuid);
    }
});


let s3VideoStorage = multer.diskStorage({

    destination: function (req, file, cb) {

        // console.log("##des",file);
        let path = createDir(__upload_video_dir, "video/" + file.uuid);

        cb(null, path)  // server upload 경로
    },

    filename: function (req, file, cb) {

        cb(null, file.uuid);
    }
});

const videoFilter = (req, file, cb) => { //파일의 허용 범위 체크

    let ext = "";

    try {
        ext = file.mimetype.split("/")[1].toLowerCase();
    } catch (err) {
    }

    console.log("ext", ext);

    if (ext !== 'mp4' && ext !== 'mov' && ext !== 'quicktime') {
        cb(new Error('Only h264 codec is allowed'))
    }

    file.uuid = uuidv4().replaceAll("-", "");

    cb(null, true)
}


const pdfFilter = (req, file, cb) => { //파일의 허용 범위 체크

    let ext = "";

    try {
        ext = file.mimetype.split("/")[1];
    } catch (err) {
    }

    if (ext !== 'pdf') {
        cb(new Error('Only pdfs are allowed'))
    }

    cb(null, true);
}

const s3 = new aws.S3({
    credentials: {
        accessKeyId: process.env.AWS_ID,
        secretAccessKey: process.env.AWS_SECRET,
    },
});

// multer s3 setting
const s3VideoUploader = multerS3({
    s3: s3,
    bucket: "haba-bucket/hls-videos",
    acl: "public-read",
    key: function (req, file, cb) {

        cb(null, uuidv4().replaceAll("-", ""));
    }
});

export const filesUpload = multer({
    dest: `${__upload_dir}${moment().format('/YYYYMMDD')}`,
    limits: { fileSize: maxFileSize },
    fileFilter: pdfFilter
}).array("files", maxCount);

export const imgUpload = multer({
    dest: `${__upload_dir}${moment().format('/YYYYMMDD')}`,
    limits: { fileSize: maxFileSize },
    fileFilter: imgFilter
}).array("images", maxCount);

export const videoUpload = multer({
    storage: videoStorage,
    limits: { fileSize: maxVideoSize }, // 3기가
    fileFilter: videoFilter
}).single("video");

export const s3VideoUpload = multer({
    dest: "uploads/videos/",
    storage: s3VideoUploader,
    limits: { fileSize: maxVideoSize }, // 3기가
    fileFilter: videoFilter
}).single("video");

export const s3HlsUpload = multer({
    storage: s3VideoStorage,
    limits: { fileSize: maxVideoSize }, // 3기가
    fileFilter: videoFilter
}).single("video");



let sampleStorage = multer.diskStorage({

    destination: function (req, file, cb) {

        let path = createDir(__upload_video_dir, "videos");

        cb(null, path)  // server upload 경로
    },

    filename: function (req, file, cb) {

        cb(null, uuidv4().replace(/-/g, "") + ".mp4");
    }
});


/*export const sampleUpload = multer({
    storage : sampleStorage,
    limits : {fileSize: maxVideoSize}, // 3기가
    fileFilter : videoFilter
}).single("video");*/

