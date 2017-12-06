import { createServer, plugins } from 'restify';
import hasher from './utils/hashing';
import { UsersRepository } from './repositories/users';
import { createUser } from './models/user';

const packageJson = require('../package.json');

const repo = new UsersRepository('users.json');
repo.init();

const server = createServer({
    name: packageJson.name,
    version: packageJson.version,
});

server.use(plugins.acceptParser(server.acceptable));
server.use(plugins.queryParser());
server.use(plugins.bodyParser());

// Get user from request authorization header.
server.pre((req, res, next) => {
    const header = req.header('Authorization');
    if (!header) {
        return next();
    }

    const match = header.match(/Bearer (.*)/);
    if (!match) {
        return next();
    }

    const token = match[1];
    const user = repo.find({ token });
    if (!user) {
        return next();
    }

    req.user = user;
    return next();
});

server.post('/tokens', (req, res, next) => {
    const { username, password } = req.params;

    const user = repo.find({ username });
    if (!user) {
        // res.send(404, 'User not found');
        res.send(404, {
            apiVersion: packageJson.version,
            error: {
                code: 404,
                message: 'User not found',
            },
        });
        return next();
    }

    if (!hasher.check(password, user.password)) {
        // res.send(401, 'Incorrect password');
        res.send(401, {
            apiVersion: packageJson.version,
            error: {
                code: 401,
                message: 'Incorrect password',
            },
        });
        return next();
    }

    // Send token
    res.send(200, {
        apiVersion: packageJson.apiVersion,
        data: {
            token: user.token,
        },
    });
    return next();
});

server.get('/users', (req, res, next) => {
    if (!req.user!.admin) {
        // res.send(401, 'Unauthorized');
        res.send(401, {
            apiVersion: packageJson.version,
            error: {
                code: 401,
                message: 'Unauthorized',
            },
        });
        return next();
    }

    let users = repo.all();

    if (req.params.username) {
        users = users.filter(
            u => u.username.match(req.params.username)
        );
    }

    if (req.params.email) {
        users = users.filter(
            u => u.email.match(req.params.email)
        );
    }

    if (req.params.admin) {
        users = users.filter(
            u => u.admin == req.params.admin
        );
    }

    // res.send(200, { users });
    res.send(200, {
        apiVersion: packageJson.apiVersion,
        data: {
            users: users,
        },
    });
    return next();
});

server.post('/users', (req, res, next) => {
    if (!req.user!.admin) {
        // res.send(401, 'Unauthorized');
        res.send(401, {
            apiVersion: packageJson.version,
            error: {
                code: 401,
                message: 'Unauthorized',
            },
        });
        return next();
    }

    const errors = [];
    if (repo.find({ username: req.params.username })) {
        errors.push({
            location: 'username',
            message: 'Username already in use.'
        });
    }
    if (repo.find({ email: req.params.email })) {
        errors.push({
            location: 'email',
            message: 'Email already in use.',
        });
    }

    if (errors.length > 0) {
        // res.send(400, { errors });
        res.send(400, {
            apiVersion: packageJson.apiVersion,
            error: {
                code: 400,
                errors: errors,
            },
        });
        return next();
    }

    const user = createUser(
        req.params.username,
        req.params.email,
        hasher.hash(req.params.password),
        req.params.isAdmin === 'true',
    );

    repo.save(user);

    // res.send(200, { user });
    res.send(200, {
        apiVersion: packageJson.apiVersion,
        data: {
            user: user,
        },
    });
    return next();
});

server.get('/users/me', (req, res, next) => {
    if (!req.user!) {
        // res.send(401, 'Unauthorized');
        res.send(401, {
            apiVersion: packageJson.version,
            error: {
                code: 401,
                message: 'Unauthorized.',
            },
        });
        return next();
    }

    // res.send(200, { user: req.user! });
    res.send(200, {
        apiVersion: packageJson.apiVersion,
        data: {
            user: req.user
        },
    });
    return next();
})

server.put('/users/me', (req, res, next) => {
    if (!req.user!) {
        // res.send(401, 'Unauthorized');
        res.send(401, {
            apiVersion: packageJson.version,
            error: {
                code: 401,
                message: 'Unauthorized.',
            },
        });
        return next();
    }

    const user = repo.update(req.user!.id, req.params);
    // res.send(200, { user });
    res.send(200, {
        apiVersion: packageJson.apiVersion,
        data: {
            user: user,
        },
    });
    return next();
})

server.get('/users/:id', (req, res, next) => {
    if (!req.user!.admin) {
        // res.send(401, 'Unauthorized');
        res.send(401, {
            apiVersion: packageJson.version,
            error: {
                code: 401,
                message: 'Unauthorized.',
            },
        });
        return next();
    }

    const user = repo.find({ id: req.params.id });
    if (!user) {
        // res.send(401, 'Unauthorized');
        res.send(404, {
            apiVersion: packageJson.version,
            error: {
                code: 404,
                message: 'User not found.',
            },
        });
        return next();
    }

    // res.send(200, { user });
    res.send(200, {
        apiVersion: packageJson.apiVersion,
        data: {
            user: user,
        },
    });
    return next();
});

server.put('/users/:id', (req, res, next) => {
    if (!req.user!.admin) {
        // res.send(401, 'Unauthorized');
        res.send(401, {
            apiVersion: packageJson.version,
            error: {
                code: 401,
                message: 'Unauthorized.',
            },
        });
        return next();
    }

    const user = repo.update(req.params.id, req.params);

    // res.send(200, { user });
    res.send(200, {
        apiVersion: packageJson.apiVersion,
        data: {
            user: user,
        },
    });
    return next();
});

server.del('/users/:id', (req, res, next) => {
    if (!req.user!.admin) {
        // res.send(401, 'Unauthorized');
        res.send(401, {
            apiVersion: packageJson.version,
            error: {
                code: 401,
                message: 'Unauthorized.',
            },
        });
        return next();
    }

    if (req.user!.id === req.params.id) {
        // res.send(400, 'You can\'t delete yourself!');
        res.send(200, {
            apiVersion: packageJson.apiVersion,
            error: {
                code: 400,
                message: 'You can\'t delete yourself!',
            },
        });
        return next();
    }

    const user = repo.del(req.params.id);
    if (!user) {
        res.send(404, {
            apiVersion: packageJson.apiVersion,
            error: {
                code: 404,
                message: 'User not found.',
            },
        });
        return next();
    }

    // res.send(200, { user });
    res.send(200, {
        apiVersion: packageJson.apiVersion,
        data: {
            user: user,
            deleted: true,
        },
    });
    return next();
});

server.listen(8000, function() {
    console.log('listening...');
});
