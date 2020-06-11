import _ from 'lodash';
import mongoose from 'mongoose';

const schema = new mongoose.Schema({
    username: {
        maxlength: [20, 'Username is too long.'],
        minlength: [2, 'Username is too short.'],
        required: [true, 'Username is required.'],
        trim: true,
        type: String,
        unique: true,
    },
});

schema.set('toJSON', {
    transform: (doc, ret) => ({ ..._.omit(ret, ['__v', '_id']), id: ret._id.toString() }),
});

export const collectionName = process.env.NODE_ENV === 'test' ? 'users.test' : 'users';
export const User = mongoose.model(collectionName, schema);
