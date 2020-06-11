import { User } from '../models/User';
import { WrongArgumentError } from '../../common/errors/WrongArgumentError';

export const saveUserIfNotExists = async ({ username }: { username: string }): Promise<object> => {
    username = username.trim();

    if (username.length < 2) {
        throw new WrongArgumentError('username', username, 'Username is too short');
    }

    if (username.length > 20) {
        throw new WrongArgumentError('username', username, 'Username is too long');
    }

    const user = await User.findOne({ username });
    return user || (await new User({ username }).save());
};
