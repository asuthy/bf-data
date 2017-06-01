'use strict';

const tableName = 'horse_runner';

exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.createTableIfNotExists(tableName, function(table) {
            table.integer('event_id');
            table.timestamp('actual_off');
            table.integer('selection_id');
            table.text('selection');
            table.decimal('sp_odds', 8, 2);
            table.decimal('min_in_play_odds', 8, 2);
            table.boolean('matched_at_156');
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