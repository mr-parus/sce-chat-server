import mongoose from 'mongoose';

import { User } from '../models/User';
import { IUser } from '../../common/types/IUser';
import { WrongArgumentError } from '../../common/errors/WrongArgumentError';

export const findUSerById = async (id: string): Promise<IUser | null> => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new WrongArgumentError('id', id, 'User id is not valid!');
    }

    const user = await User.findById(id);
    return user?.toObject() || null;
};
