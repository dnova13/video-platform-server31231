const express = require('express')
const router = express.Router()
const util = require('util')
const tagSv = require("../../services/tagsService")

// 관리자 추천 태그 리스트
router.get("/recommend", async (req,res) => {

    let result = await tagSv.getRecommendTagList();
    return res.json(result);
});

// 탐색 추천 해시 태그 리스트
router.get("/search", async (req,res) => {

    let result = await tagSv.getComSearchTagList();
    return res.json(result);
});

module.exports = router;