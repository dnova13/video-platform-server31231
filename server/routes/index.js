const express = require('express')
const router = express.Router()

const v1Api = require( `${__base}/routes/v1` )

router.use('/v1', v1Api)

module.exports = router