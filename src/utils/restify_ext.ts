import { User } from '../models/user';

declare module 'restify' {
    interface Request {
        user?: User;
    }
}
