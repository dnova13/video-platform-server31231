const express = require('express')
const router = express.Router()
const util = require('util')
const notifySv = require("../../services/notifyService");
const videoReplySv = require("../../services/videoReplyService");

router.get("/list", async (req, res) => {

    let uid = req.uinfo["u"];

    let limit = req.query.limit;
    let offset = req.query.offset;
    let postId = req.query.id;

    if (!_util.areBeyondZero(limit, offset, postId)) {
        return res.json(jresp.invalidData());
    }

    let result = await videoReplySv.getLv0ReplyListByPostId(limit, offset, postId, 0);

    return res.json(result);
});

router.get("/re/list", async (req, res) => {

    let uid = req.uinfo["u"];

    let limit = req.query.limit;
    let offset = req.query.offset;
    let postId = req.query.id;
    let replyId = req.query.reply_id;

    if (!_util.areBeyondZero(limit, offset, postId, replyId)) {
        return res.json(jresp.invalidData());
    }

    let result = await videoReplySv.getReReplyListByPostId(limit, offset, postId, replyId, 0);

    return res.json(result);
});

router.get("/list/all", async (req, res) => {

    let uid = req.uinfo["u"];

    let limit = req.query.limit;
    let offset = req.query.offset;
    let postId = req.query.id;

    if (!_util.areBeyondZero(limit, offset, postId)) {
        return res.json(jresp.invalidData());
    }

    let result = await videoReplySv.getReplyAllListByPostId(limit, offset, postId, 0);

    return res.json(result);
});


router.post("/write", async (req, res) => {

    console.log("!!!write");

    let body = req.body;
    let result;

    let keys = ['id', 'content'];

    if (!_util.hasKeysArray(body, keys)) {

        console.log("key err");
        return res.send(jresp.invalidData());
    }

    if (_util.isObjectBlankArray(body, keys, keys.length)) {
        console.log("blank err");
        return res.send(jresp.invalidData());
    }

    if (!_util.areBeyondZero(body.id)) {
        console.log("not num");
        return res.send(jresp.invalidData());
    }

    body.user_id = req.uinfo["u"];

    result = await videoReplySv.insertReply(body);

    if (!result["success"]) {
        console.log("insertPost")
        return res.json(result);
    }

    let uid = body.user_id;
    let videoPostId = body.id;


    // fcm 메시징.
    await notifySv.notifyReply(uid, videoPostId);

    return res.json(result);
});

router.post("/re/write", async (req, res) => {

    console.log("!!!write");

    let body = req.body;
    let result;

    let keys = ['id', 'content', "reply_id", "target_id"];

    if (!_util.hasKeysArray(body, keys)) {

        console.log("key err");
        return res.send(jresp.invalidData());
    }

    if (_util.isObjectBlankArray(body, keys, keys.length)) {
        console.log("blank err");
        return res.send(jresp.invalidData());
    }

    if (!_util.areBeyondZero(body.id, body.reply_id, body.target_id)) {
        console.log("not num");
        return res.send(jresp.invalidData());
    }

    body.user_id = req.uinfo["u"];

    result = await videoReplySv.insertReply(body, 1);

    if (!result["success"]) {
        console.log("insertPost")
        return res.json(result);
    }

    let uid = body.user_id
    let targetId = body.target_id
    let replyId = result["data"]["id"];

    // fcm 메시징.
    await notifySv.notifyReReply(uid, targetId, replyId);

    return res.json(result);
});

router.post("/re/answer/write", async (req, res) => {

    console.log("!!!write");

    let body = req.body;
    let result;

    let keys = ['id', 'content', "reply_id", "target_id"];

    if (!_util.hasKeysArray(body, keys)) {

        console.log("key err");
        return res.send(jresp.invalidData());
    }

    if (_util.isObjectBlankArray(body, keys, keys.length)) {
        console.log("blank err");
        return res.send(jresp.invalidData());
    }

    if (!_util.areBeyondZero(body.id, body.reply_id, body.target_id)) {
        console.log("not num");
        return res.send(jresp.invalidData());
    }

    body.user_id = req.uinfo["u"];

    result = await videoReplySv.insertReply(body, 2);

    if (!result["success"]) {
        console.log("insertPost")
        return res.json(result);
    }

    let uid = body.user_id
    let targetId = body.target_id
    let replyId = result["data"]["id"];

    // fcm 메시징.
    await notifySv.notifyReReply(uid, targetId, replyId);

    return res.json(result);
});


router.post("/edit", async (req, res) => {

    console.log("!!!edit");

    let body = req.body;
    let result;

    let keys = ['id', 'content'];

    if (!_util.hasKeysArray(body, keys)) {

        console.log("key err");
        return res.send(jresp.invalidData());
    }

    if (_util.isObjectBlankArray(body, keys, keys.length)) {
        console.log("blank err");
        return res.send(jresp.invalidData());
    }

    if (!_util.isBeyondZero(body.id)) {
        console.log("not num");
        return res.send(jresp.invalidData());
    }

    body.user_id = req.uinfo["u"];

    result = await videoReplySv.editReply(body);

    if (!result["success"]) {
        console.log("editReply err")
        return res.json(result);
    }

    return res.json(result);
});


router.post("/delete", async (req, res) => {

    let body = req.body;
    let result;

    let keys = ['id'];

    if (!_util.hasKeysArray(body, keys)) {

        console.log("key err");
        return res.send(jresp.invalidData());
    }

    if (!_util.isBeyondZero(body.id)) {
        console.log("not num");
        return res.send(jresp.invalidData());
    }

    body.user_id = req.uinfo["u"];

    result = await videoReplySv.deleteReply(body);

    if (!result["success"]) {
        console.log("delete reply err")
        return res.json(result);
    }

    return res.json(result);
});


module.exports = router
