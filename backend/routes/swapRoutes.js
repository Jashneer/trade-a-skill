const express = require('express');

const router = express.Router();

const authVerify = require('../middleware/authVerify');

const {
    getSwapRequests,
    createSwapRequest,
    deleteSwapRequest
} = require('../controllers/swapController');

router.get('/', authVerify, getSwapRequests);

router.post('/', authVerify, createSwapRequest);

router.delete('/:id', authVerify, deleteSwapRequest);

module.exports = router;