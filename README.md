## bf-data


## Setup
Create config/local.js:

	module.exports = {
        connections: {
            production: {
                port: 5432,
                user: 'postgres',
                password: 'password',
                database: 'bfdata',
                client: 'pg',
                poolSize: 10,
                pool: {
                    min: 1,
                    max: 80
                }
            }
        },
        log: {
            level: 'silly'
        }
    };
