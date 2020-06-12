import _ from 'lodash';
import mongoose from 'mongoose';

const schema = new mongoose.Schema({
    from: {
        type: String,
        required: true,
    },
    to: {
        type: String,
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
export const Message = mongoose.model(collectionName, schema);
