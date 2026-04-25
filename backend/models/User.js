const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 50,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 50,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
        bio: {
            type: String,
            trim: true,
            maxlength: 500,
            default: '',
        },
        skillsToTeach: {
            type: [String],
            default: [],
            validate: {
                validator: (skills) => skills.every((skill) => String(skill).trim().length > 0),
                message: 'skillsToTeach cannot contain empty values',
            },
        },
        skillsToLearn: {
            type: [String],
            default: [],
            validate: {
                validator: (skills) => skills.every((skill) => String(skill).trim().length > 0),
                message: 'skillsToLearn cannot contain empty values',
            },
        },
        dateJoined: {
            type: String,
            default: () => new Date().toLocaleDateString(),
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        trades: {
            type: Number,
            default: 0,
            min: 0,
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

module.exports = mongoose.model('User', userSchema);
