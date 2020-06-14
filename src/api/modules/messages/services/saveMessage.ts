import mongoose from 'mongoose';

import { IMessage, MessageParams } from '../../../common/types/IMessage';
import { Message } from '../models/Message';
import { User } from '../../users/models/User';
import { WrongArgumentError } from '../../../common/errors/WrongArgumentError';

export const saveMessage = async (messageParams: MessageParams): Promise<IMessage> => {
    const { from, to, text } = messageParams;

    if (!mongoose.Types.ObjectId.isValid(from) || !mongoose.Types.ObjectId.isValid(to)) {
        throw new WrongArgumentError('messageParams.from', messageParams.from, 'Invalid message structure!');
    }

    if (!(await User.exists({ _id: from }))) {
        throw new WrongArgumentError('messageParams.from', from, 'There is not such user in the system!');
    }

    if (!(await User.exists({ _id: to }))) {
        throw new WrongArgumentError('messageParams.to', to, 'There is not such user in the system!');
    }

    if (!text?.length) {
        throw new WrongArgumentError('messageParams.text', text, 'Invalid message text!');
    }

    const message = await new Message(messageParams).save();
    return message.toObject();
};
