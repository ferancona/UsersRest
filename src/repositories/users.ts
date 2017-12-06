import * as fs from '../utils/fs_promise';
import { User } from '../models/user';

interface UserModel {
    [id: string]: User;
}

export class UsersRepository {

    private users: UserModel = {};

    constructor(
            private filename: string
    ) { }

    async init() {
        if (await fs.existsAsync(this.filename)) {
            this.users = await fs.readJsonAsync<UserModel>(this.filename);
        } else {
            this.users = {};
        }
    }

    async saveFile() {
        await fs.writeFileAsync(
            this.filename,
            JSON.stringify(this.users, null, 4),
        );
    }

    all(): Array<User> {
        return Object.keys(this.users)
            .map(id => this.users[id]);
    }

    filter(query: Partial<User>): Array<User> {
        return this.all()
            .filter(user => {
                return ! Object.keys(query)
                    .some(key => query[key] !== user[key]);
            });
    }

    find(query: Partial<User>): User {
        return this.filter(query)[0];
    }

    save(user: User): User {
        this.users[user.id] = user;
        this.saveFile();
        return user;
    }

    update(id: string, data: Partial<User>): User {
        Object.assign(this.users[id], data);
        this.saveFile();
        return this.users[id];
    }

    del(id: string): User {
        const user = this.users[id];
        delete this.users[id];
        this.saveFile();
        return user;
    }
}
