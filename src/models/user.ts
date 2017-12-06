import { v1 as uuid } from 'uuid';

export function createUser(
        username: string,
        email: string,
        password: string,
        admin: boolean = false,
): User {
    const id = uuid();
    return {
        id: id,
        username: username,
        email: email,
        password: password,
        token: id,
        admin: admin,
        valid: false,
    };
}

export interface User {

    // Eliminate 'no index signature' typescript error.
    [key: string]: any;

    id: string;
    username: string;
    email: string;
    password: string;
    token: string;
    admin: boolean;
    valid: boolean;
}
