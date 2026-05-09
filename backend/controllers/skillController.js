const getPrisma = require('../lib/prisma');

const formatSkill = (skill) => ({
    ...skill,
    teacher: {
        name: skill.teacherName,
        rating: skill.teacherRating,
        completedTrades: skill.teacherCompletedTrades
    }
});

const getSkills = async (req, res, next) => {

    try {

        const prisma = await getPrisma();

        const skills = await prisma.skill.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });

        const formattedSkills = skills.map(formatSkill);

        res.status(200).json({
            success: true,
            message: 'Skills fetched successfully',
            data: formattedSkills
        });

    } catch (error) {

        next(error);

    }
};

const createSkill = async (req, res, next) => {

    try {

        const prisma = await getPrisma();

        const payload = { ...req.body };

        delete payload.id;

        const formattedPayload = {
            title: payload.title,
            description: payload.description,
            category: payload.category,
            level: payload.level,
            duration: payload.duration,

            teacherName:
                payload.teacher?.name ||
                payload.teacherName ||
                'Unknown',

            teacherRating:
                payload.teacher?.rating ||
                payload.teacherRating ||
                0,

            teacherCompletedTrades:
                payload.teacher?.completedTrades ||
                payload.teacherCompletedTrades ||
                0
        };

        const skill = await prisma.skill.create({
            data: formattedPayload
        });

        res.status(201).json({
            success: true,
            message: 'Skill created successfully',
            data: formatSkill(skill)
        });

    } catch (error) {

        next(error);

    }
};

const updateSkill = async (req, res, next) => {

    try {

        const prisma = await getPrisma();

        const { id } = req.params;

        const updatedSkill = await prisma.skill.update({
            where: {
                id
            },
            data: req.body
        });

        res.status(200).json({
            success: true,
            message: 'Skill updated successfully',
            data: formatSkill(updatedSkill)
        });

    } catch (error) {

        next(error);

    }
};

const deleteSkill = async (req, res, next) => {

    try {

        const prisma = await getPrisma();

        const { id } = req.params;

        await prisma.skill.delete({
            where: {
                id
            }
        });

        res.status(200).json({
            success: true,
            message: 'Skill deleted successfully'
        });

    } catch (error) {

        next(error);

    }
};

module.exports = {
    getSkills,
    createSkill,
    updateSkill,
    deleteSkill
};