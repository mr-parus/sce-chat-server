import { IMessage } from '../../common/types/IMessage';
import { Message } from '../models/Message';
import { User } from '../../users/models/User';
import { WrongArgumentError } from '../../common/errors/WrongArgumentError';

export const saveMessage = async (messageParams: IMessage): Promise<object> => {
    if (!(await User.exists({ username: messageParams.from }))) {
        throw new WrongArgumentError('messageParams.from', messageParams.from, 'There is not such user in the system!');
    }

    if (!(await User.exists({ username: messageParams.to }))) {
        throw new WrongArgumentError('messageParams.to', messageParams.from, 'There is not such user in the system!');
    }

    if (!(await User.exists({ username: messageParams.to }))) {
        throw new WrongArgumentError('messageParams.to', messageParams.from, 'There is not such user in the system!');
    }

    if (!(messageParams.text && messageParams.text.length)) {
        throw new WrongArgumentError('messageParams.text', messageParams.text, 'Invalid message text!');
    }

    const message = new Message(messageParams);
    return message.save();
};
