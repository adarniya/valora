const express = require('express');
const router  = express.Router();
const { getAgingReport } = require('../controllers/agingController');
const authenticateToken = require('../middleware/auth');

router.get('/', authenticateToken, getAgingReport);

module.exports = router;