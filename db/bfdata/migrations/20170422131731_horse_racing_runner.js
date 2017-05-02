'use strict';

const tableName = 'horse_racing_runner';

exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.createTableIfNotExists(tableName, function(table) {
            table.integer('event_id');
            table.text('country');
            table.text('course');
            table.text('distance');
            table.text('race_class');
            table.integer('runners');
            table.integer('selection_id');
            table.decimal('sp_odds', 8, 2);
            table.decimal('min_in_play_odds', 8, 2);
            table.timestamp('actual_off');
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