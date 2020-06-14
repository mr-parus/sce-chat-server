import mongoose from 'mongoose';

import { IMessage } from '../../common/types/IMessage';
import { Message } from '../models/Message';
import { User } from '../../users/models/User';
import { WrongArgumentError } from '../../common/errors/WrongArgumentError';

export const getMessagesWithUser = async (userId: string): Promise<IMessage[]> => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new WrongArgumentError('userId', userId, 'Invalid user!');
    }

    if (!(await User.exists({ _id: userId }))) {
        throw new WrongArgumentError('userId', userId, 'There is not such user in the system!');
    }

    const messages = await Message.find({ $or: [{ from: userId }, { to: userId }] });
    return messages.map((m) => m.toObject());
};
