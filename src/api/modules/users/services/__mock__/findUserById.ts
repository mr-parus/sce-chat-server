import mongoose from 'mongoose';

import { IUser } from '../../../../common/types/IUser';
import { WrongArgumentError } from '../../../../common/errors/WrongArgumentError';
import { createdUsers } from './saveUserIfNotExists';

export const findUserById = async (id: string): Promise<IUser | null> => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new WrongArgumentError('id', id, 'User id is not valid!');
    }

    const user = createdUsers.get(id);
    return user || null;
};
