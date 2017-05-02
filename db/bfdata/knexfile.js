const config = require('../../config/local.js');

module.exports = {
    production: {
        client: 'postgresql',
        connection: config.connections.production,
        migrations: {
            tableName: 'knex_migrations'
        }
    }
};