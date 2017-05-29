'use strict';

const tableName = 'horse_racing_runner';

exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.createTableIfNotExists(tableName, function(table) {
            table.integer('event_id');
            table.text('country');
            table.text('course');
            table.text('venue');
            table.text('distance');
            table.text('race_class');
            table.integer('runners');
            table.integer('selection_id');
            table.text('selection');
            table.boolean('win_flag');
            table.decimal('sp_odds', 8, 2);
            table.decimal('min_in_play_odds', 8, 2);
            table.decimal('fav_sp_odds', 8, 2);
            table.decimal('sec_fav_sp_odds', 8, 2);
            table.decimal('fav_sec_fav_ratio', 8, 2);
            table.decimal('race_pre_total_matched', 10, 2);
            table.integer('race_pre_total_bets');
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