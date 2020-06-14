import { Message } from '../../../src/api/modules/messages/models/Message';
import { User } from '../../../src/api/modules/users/models/User';

export const clearDB = async (): Promise<void> => {
    await Promise.all([User.deleteMany({}), Message.deleteMany({})]);
};
