'use strict';

const tableName = 'horse_race';

exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.createTableIfNotExists(tableName, function(table) {
            table.integer('event_id');
            table.text('country');
            table.text('event');
            table.text('course');
            table.text('venue');
            table.text('distance');
            table.text('race_class');
            table.integer('runners');
            table.timestamp('actual_off');
            table.integer('matches_at_156');
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