const express = require('express')
const router = express.Router();
import _import from "../../commons/import";

router.get("/tk", async (req, res) => {

    let id = "imp_425754519197"

    let result = await _import.getPaymentData(id)

    res.json(result)
})


router.post("/refund", async (req, res) => {

    let data = {
        "impUid" : "imp_104224025610",
        "merchantUid" : "ORD20180131-00d00011",
        "amount": 1000,
        "checksum": 1000,
        "reason": "fdssfd",
    }

    let result = await _import.refund(data)

    res.json(result)
})

router.get('/fcm/send', async (req, res) => {

    let token = req.query.token;
    let content = req.query.content;

    let data = {
        title: "test",
        body: content,
    }

    let msg = "succsss"

    try {
        // console.log("!!!!!!!!!!", await _fcm.send(token, data));
    } catch (e) {
        // console.log("#$##$$##$#$#$$#",e);
        // console.log("FSDFFDSSDFFDS",e.message)
        msg = e.message;
    }

    res.json({"msg" : msg })
});

router.post('/fcm/sendMulti', async (req, res) => {

    let tokens = req.body.token;
    let content = req.body.content;

    let data = {
        title: "test",
        body: content,
    }

    let msg = "succsss"

    try {
        // console.log("!!!!!!!!!!", msg = await _fcm.sendMulti(tokens, data));
    } catch (e) {
        // console.log("#$##$$##$#$#$$#",e);
        // console.log("FSDFFDSSDFFDS",e.message)
        msg = e.message;
    }

    res.json({"msg" : msg })
});

router.get('/sample', async (req, res) => {
    let out = {}
    let sql
    let sqlP
    let result

    sql = `SELECT id, title, content, view_count, user_id, close_chk 
            FROM post 
            WHERE id=1`
    sqlP = null
    result = await db.qry(sql, sqlP)

    // console.log(result);
    // console.log(jr.emptyData);

    if (!result['success']) {
        out['success'] = false
        out['message'] = 'something broke'
        out['data'] = {"success": false, "message": "failed", "item": [], "item_length": 0}
        res.json(out)
        return
    }

    if (result['rows'].length < 1) {
        out['success'] = true
        out['message'] = 'success'
        out['data'] = {
            success: false
            , message: 'empty'
            , item: []
            , item_length: 0
        }
        res.json(out)
        return
    }

    out['success'] = true
    out['message'] = 'success'
    out['data'] = {
        success: true
        , message: 'success'
        , item: result['rows']
        , item_length: result['rows'].length
    }

    res.json(out)
})

module.exports = router