import { User } from '../../../src/api/users/models/User';
import { Message } from '../../../src/api/messages/models/Message';

export const clearDB = async (): Promise<void> => {
    await Promise.all([User.deleteMany({}), Message.deleteMany({})]);
};
