'use strict';

const config = require('../config/local.js'),
    knex = require('knex')({
        client: config.connections.production.client,
        connection: config.connections.production,
        pool: config.connections.production.pool,
        acquireConnectionTimeout: 3600000 // Allow an hour to get connection to cater for pool being filled
    });

let destroyed = false;

const destroy = function() {
    if (destroyed) {
        return undefined;
    } else {
        destroyed = true;
        return knex.destroy();
    }
};

module.exports = {
    knex: knex,
    destroy: destroy
};