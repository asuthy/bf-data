'use strict';

const tableName = 'horse_racing';

exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.createTableIfNotExists(tableName, function(table) {
            table.integer('sports_id');
            table.integer('event_id');
            table.timestamp('settled_date');
            table.text('country');
            table.text('full_description');
            table.text('course');
            table.timestamp('scheduled_off');
            table.text('event');
            table.timestamp('actual_off');
            table.integer('selection_id');
            table.text('selection');
            table.decimal('odds', 8, 2);
            table.integer('number_bets');
            table.decimal('volume_matched', 10, 2);
            table.timestamp('latest_taken');
            table.timestamp('first_taken');
            table.boolean('win_flag');
            table.text('in_play');
            table.text('distance');
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