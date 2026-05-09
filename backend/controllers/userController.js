const User = require('../models/User');
const getPrisma = require('../lib/prisma');

const getUsers = async (req, res, next) => {

    try {

        const email = (req.query.email || '')
            .toString()
            .toLowerCase()
            .trim();

        const query = email
            ? { email }
            : {};

        const users = await User.find(query).lean();

        res.status(200).json({
            success: true,
            message: 'Users fetched successfully',
            data: users
        });

    } catch (error) {

        next(error);

    }
};

const createUser = async (req, res, next) => {

    try {
        const prisma = await getPrisma();
        const payload = { ...req.body };

        delete payload.id;

        const createdUser = await prisma.user.create({
            data: payload
        });

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: createdUser
        });

    } catch (error) {

        next(error);

    }
};

const updateUser = async (req, res, next) => {

    try {
        const prisma = await getPrisma();
        const userId = req.params.id;

        const updates = { ...req.body };

        delete updates.id;

        if (updates.password) {
            return res.status(400).json({
                success: false,
                message: 'Password update not allowed here'
            });
        }

        const updatedUser = await prisma.user.update({
            where: {
                id: userId
            },
            data: updates
        });

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser
        });

    } catch (error) {

        next(error);

    }
};

const deleteUser = async (req, res, next) => {

    try {
        const prisma = await getPrisma();
        const userId = req.params.id;

        await prisma.user.delete({
            where: {
                id: userId
            }
        });

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {

        next(error);

    }
};

module.exports = {
    getUsers,
    createUser,
    updateUser,
    deleteUser
};