const getPrisma = require('../lib/prisma');

const getSwapRequests = async (req, res, next) => {

    try {

        const prisma = await getPrisma();

        const requests = await prisma.swapRequest.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.status(200).json({
            success: true,
            message: 'Swap requests fetched successfully',
            data: requests
        });

    } catch (error) {

        next(error);

    }
};

const createSwapRequest = async (req, res, next) => {

    try {

        const prisma = await getPrisma();

        const payload = { ...req.body };

        delete payload.id;

        const createdRequest = await prisma.swapRequest.create({
            data: payload
        });

        res.status(201).json({
            success: true,
            message: 'Swap request created successfully',
            data: createdRequest
        });

    } catch (error) {

        next(error);

    }
};

const deleteSwapRequest = async (req, res, next) => {

    try {

        const prisma = await getPrisma();

        const { id } = req.params;

        await prisma.swapRequest.delete({
            where: {
                id
            }
        });

        res.status(200).json({
            success: true,
            message: 'Swap request deleted successfully'
        });

    } catch (error) {

        next(error);

    }
};

module.exports = {
    getSwapRequests,
    createSwapRequest,
    deleteSwapRequest
};