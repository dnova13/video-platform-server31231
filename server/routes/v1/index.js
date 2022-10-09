const express = require('express')
const router = express.Router();

const oauth = require('./oauth');
const _file = require('./files');
const test = require('./test');

const videoList = require('./video_list');
const videoPost = require('./video_post');
const videoMeta = require('./video_meta');
const videoReply = require('./video_reply');

const tags = require('./tags');
const search = require('./search');

const follow = require('./follow');
const point = require('./points');
const report = require('./report');

const notify = require('./notify');
const userManage = require('./user_manage');
const userActivity = require('./user_activity');

const creatorApply = require('./creator_apply');
const creatorManage = require('./creator_manage');

const _service = require('./service')

const admin = require('./admin')

const oauthChk = require('./oauth_check');

router.get('/', async (req, res) => {

    return res.json(jresp.successData());
})


router.use('/oauth', oauth);

// test 용
// router.use('/video', _videoSample);

router.use('/file', _file);
router.use('/test', test)

// auth check
router.use(oauthChk);

router.use('/video-post', videoMeta);
router.use('/video-post', videoPost);
router.use('/video-post/list', videoList);
router.use('/video-post/reply', videoReply);
router.use('/report', report);

router.use('/tags', tags);

router.use('/point', point);

router.use('/search', search);
router.use('/follow', follow);

router.use('/user/manage', userManage);
router.use('/user/activity', userActivity);
router.use('/notify', notify);

router.use('/creator/apply', creatorApply);
router.use('/creator/manage', creatorManage);

router.use('/service', _service);

router.use('/admin', admin);



module.exports = router
