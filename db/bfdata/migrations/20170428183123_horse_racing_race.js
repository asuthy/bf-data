'use strict';

const tableName = 'horse_racing_race';

exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.createTableIfNotExists(tableName, function(table) {
            table.integer('event_id');
            table.text('country');
            table.text('event');
            table.text('course');
            table.text('distance');
            table.timestamp('actual_off');
            table.integer('selection_id');
            table.text('selection');
            table.boolean('win_flag');
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