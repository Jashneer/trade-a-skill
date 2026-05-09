const express = require('express');

const router = express.Router();

const authVerify = require('../middleware/authVerify');

const {
    getUsers,
    createUser,
    updateUser,
    deleteUser
} = require('../controllers/userController');

router.get('/',getUsers);

router.post('/', createUser);

router.patch('/:id', authVerify, updateUser);

router.delete('/:id', authVerify, deleteUser);

module.exports = router;