const express = require('express');
const { createLead, getLead, calculateLead } = require('../controllers/leadController');

const router = express.Router();

router.post('/calculate', calculateLead);
router.post('/', createLead);
router.get('/:id', getLead);

module.exports = router;