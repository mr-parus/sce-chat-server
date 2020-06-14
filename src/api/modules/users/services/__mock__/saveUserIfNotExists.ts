import mongoose from 'mongoose';

import { IUser } from '../../../common/types/IUser';
import { WrongArgumentError } from '../../../common/errors/WrongArgumentError';

export const createdUsers = new Map<string, IUser>();

export const saveUserIfNotExists = async ({ username }: { username: string }): Promise<IUser> => {
    username = username.trim();

    if (username.length < 2) {
        throw new WrongArgumentError('username', username, 'Username is too short');
    }

    if (username.length > 20) {
        throw new WrongArgumentError('username', username, 'Username is too long');
    }

    let user = createdUsers.get(username);
    if (!user) {
        user = {
            id: mongoose.Types.ObjectId().toHexString(),
            username,
        };
        createdUsers.set(username, user);
        createdUsers.set(user.id, user);
    }

    return user;
};
