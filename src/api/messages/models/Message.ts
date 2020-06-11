import _ from 'lodash';
import mongoose from 'mongoose';

import { collectionName as userCollectionName } from '../../users/models/User';

const schema = new mongoose.Schema({
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: userCollectionName,
        required: true,
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: userCollectionName,
        required: true,
    },
    text: {
        type: String,
        minlength: 1,
        required: true,
    },
    sentAt: {
        type: Date,
        default: Date.now(),
    },
});

schema.set('toJSON', {
    transform: (doc, ret) => ({ ..._.omit(ret, ['__v', '_id']), id: ret._id.toString() }),
});

const collectionName = process.env.NODE_ENV === 'test' ? 'messages.test' : 'messages';
export const User = mongoose.model(collectionName, schema);
