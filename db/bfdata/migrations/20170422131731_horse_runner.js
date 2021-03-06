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
            table.boolean('matched_at_141');
            table.boolean('matched_at_152');
            table.boolean('matched_at_153');
            table.boolean('matched_at_155');
            table.boolean('matched_at_156');
            table.boolean('matched_at_158');
            table.boolean('matched_at_161');
            table.boolean('matched_at_181');
            table.boolean('matched_at_200');
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

/*
Add these

CREATE INDEX CONCURRENTLY "horse_runner1" ON "horse_runner" ("event_id", "selection_id");
*/