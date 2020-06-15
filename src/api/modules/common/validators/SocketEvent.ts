import Joi from '@hapi/joi';

export const ConfirmationHash = Joi.string().guid();

export const UserId = Joi.string().regex(/^[0-9a-fA-F]{24}$/, 'valid mongo id');

export const Token = Joi.string();

export const Username = Joi.string().alphanum().trim().min(1).max(20);

export const MessageParams = Joi.object({
    from: UserId.required(),
    text: Joi.string().min(1).max(200).required(),
    to: UserId.required(),
});

//

export const JoinMessage = Joi.alternatives().try(
    Joi.array().items(Username).length(1),
    Joi.array().items(Username.allow(null), Token)
);

export const GetMessages = Joi.array().items(UserId.required(), Token.required()).length(2);

export const ReadDialog = Joi.array().items(UserId.required(), Token.required()).length(2);

export const SendMessage = Joi.array().items(MessageParams, Token.required(), ConfirmationHash).length(3);
