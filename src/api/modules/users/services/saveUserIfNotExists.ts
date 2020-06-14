import { IUser } from '../../../common/types/IUser';
import { User } from '../models/User';
import { WrongArgumentError } from '../../../common/errors/WrongArgumentError';

export const saveUserIfNotExists = async ({ username }: { username: string }): Promise<IUser> => {
    username = username.trim();

    if (username.length < 2) {
        throw new WrongArgumentError('username', username, 'Username is too short');
    }

    if (username.length > 20) {
        throw new WrongArgumentError('username', username, 'Username is too long');
    }

    let user = await User.findOne({ username });
    if (!user) {
        const newUser = new User({ username });
        user = await newUser.save();
    }

    return user.toObject();
};
