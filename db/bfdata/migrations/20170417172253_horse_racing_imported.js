'use strict';

const tableName = 'horse_racing_imported';

exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.createTableIfNotExists(tableName, function(table) {
            table.text('filename');
            table.timestamp('created_at');
            table.increments('id').primary();
        })
    ]);
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTableIfExists(tableName)
    ]);
};