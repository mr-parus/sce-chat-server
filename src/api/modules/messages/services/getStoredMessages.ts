import mongoose from 'mongoose';

import { IMessage } from '../../../common/types/IMessage';
import { Message } from '../models/Message';
import { User } from '../../users/models/User';
import { WrongArgumentError } from '../../../common/errors/WrongArgumentError';

export const getStoredMessages = async (requesterUserID: string, targetUserId: string): Promise<IMessage[]> => {
    if (!(mongoose.Types.ObjectId.isValid(requesterUserID) && (await User.exists({ _id: requesterUserID })))) {
        throw new WrongArgumentError('requesterUserID', requesterUserID, 'Invalid target user id!');
    }

    if (!(mongoose.Types.ObjectId.isValid(targetUserId) && (await User.exists({ _id: targetUserId })))) {
        throw new WrongArgumentError('targetUserId', targetUserId, 'Invalid target user id!');
    }

    const messages = await Message.find({
        $or: [
            { from: requesterUserID, to: targetUserId },
            { from: targetUserId, to: requesterUserID },
        ],
    });
    return messages.map((m) => m.toObject());
};
