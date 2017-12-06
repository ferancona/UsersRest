import * as crypto from 'crypto';

export class Hasher {

    constructor(
            private algorithm: string,
            private encoding: crypto.HexBase64Latin1Encoding = 'base64',
            private saltLength: number = 16,
    ) { }

    salt() {
        return crypto.randomBytes(this.saltLength).toString(this.encoding);
    }

    hash(password: string, salt: string = this.salt()): string {
        const hasher = crypto.createHmac(this.algorithm, salt);
        hasher.update(password);
        const digest = hasher.digest(this.encoding);
        return `${salt} ${digest}`;
    }

    check(plain: string, hashed: string): boolean {
        const [salt, digest] = hashed.split(' ');
        return this.hash(plain, salt) === hashed;
    }
}

export default new Hasher('sha512');
