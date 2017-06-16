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
            table.integer('off_hour');
            table.integer('off_day');
            table.integer('off_week');
            table.integer('off_quarter');
            table.integer('off_year');
            table.decimal('favourite_sp_odds', 8, 2);
            table.integer('matches_at_141');
            table.integer('matches_at_152');
            table.integer('matches_at_153');
            table.integer('matches_at_155');
            table.integer('matches_at_156');
            table.integer('matches_at_158');
            table.integer('matches_at_161');
            table.integer('matches_at_181');
            table.integer('matches_at_200');
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
Add this

CREATE INDEX CONCURRENTLY "horse_race2" ON "horse_race" ("course", "venue");
*/