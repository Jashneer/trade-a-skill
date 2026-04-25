const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100,
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        completedTrades: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    { _id: false }
);

const skillSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 120,
        },
        description: {
            type: String,
            required: true,
            trim: true,
            minlength: 10,
            maxlength: 1000,
        },
        category: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            enum: ['technology', 'language', 'arts', 'business', 'user'],
        },
        level: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            enum: ['beginner', 'intermediate', 'advanced', 'flexible'],
        },
        duration: {
            type: String,
            required: true,
            trim: true,
            maxlength: 60,
        },
        teacher: {
            type: teacherSchema,
            required: true,
        },
    },
    {
        strict: 'throw',
        timestamps: true,
        versionKey: false,
        toJSON: {
            transform: (doc, ret) => {
                ret.id = ret._id.toString();
                delete ret._id;
                return ret;
            },
        },
    }
);

module.exports = mongoose.model('Skill', skillSchema);
