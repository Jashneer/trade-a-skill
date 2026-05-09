const express = require('express');

const router = express.Router();

const authVerify = require('../middleware/authVerify');

const {
    getSkills,
    createSkill,
    updateSkill,
    deleteSkill
} = require('../controllers/skillController');

router.get('/', getSkills);

router.post('/', authVerify, createSkill);

router.patch('/:id', authVerify, updateSkill);

router.delete('/:id', authVerify, deleteSkill);

module.exports = router;