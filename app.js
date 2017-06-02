'use strict';

const app = require('commander'),
    config = require('./config/local'),
    logger = require('./lib/logger'),
    db = require('./lib/db'),
    dateUtils = require('./lib/date-utils'),
    course = require('./lib/course'),
    promise = require('bluebird'),
    fs = require('fs'),
    csv = require('csv-stream'),
    _ = require('lodash');

app
    .option('-y, --year [value]', 'Import Year')
    .option('-r, --races', 'Populate runners and races')
    .option('-v, --venues', 'Update venues')
    .parse(process.argv);

if (app.venues) {

    async function setVenues() {
        const courses = await db.knex.raw(`select distinct course from horse_race where venue is null`);

        for (let courseRow of courses.rows) {
            const venue = course.getVenueFromCourse(courseRow.course);
            await db.knex.raw(`update horse_race set venue = ${venue} where course = '${courseRow.course}' and venue is null;`);
        }

        db.destroy();
        return;
    }

    setVenues();
    return;
}

if (app.races) {

    db.knex.raw(`delete from horse_runner; insert into horse_runner (event_id, actual_off, selection_id, selection, min_in_play_odds, matched_at_156, win_flag, created_at) select distinct event_id, actual_off, selection_id, selection, min(odds) as min_in_play_odds, case when min(odds) <= 1.56 then true else false end as matched_at_156, win_flag, now() from betfair_horse_data where in_play = 'IP' group by event_id, actual_off, selection_id, selection, win_flag;
        update horse_runner set sp_odds = sp_odds.sp_odds from (select d.event_id, d.selection_id, min(d.odds) as sp_odds from (select event_id, selection_id, max(latest_taken) as max_latest_taken from betfair_horse_data where in_play = 'PE' group by event_id, selection_id) as last_match, betfair_horse_data d where d.in_play = 'PE' and d.event_id = last_match.event_id and d.selection_id = last_match.selection_id and d.latest_taken = last_match.max_latest_taken group by d.event_id, d.selection_id) as sp_odds where horse_runner.event_id = sp_odds.event_id and horse_runner.selection_id = sp_odds.selection_id;
        delete from horse_race; insert into horse_race(event_id, country, event, course, actual_off, created_at, distance, race_class, off_hour, off_day, off_week, off_quarter, off_year) select distinct r.event_id, d.country, d.event, d.course, r.actual_off, now(), split_part(event, ' ', 1) as distance, trim(replace(event, split_part(event, ' ', 1), '')) as race_class, date_part('hour', r.actual_off), date_part('dow', r.actual_off), date_part('week', r.actual_off), date_part('quarter', r.actual_off), date_part('year', r.actual_off) from horse_runner r, betfair_horse_data d where r.event_id = d.event_id and r.selection_id = d.selection_id;
        update horse_race set runners = runners.runners from (select event_id, count(1) as runners from horse_runner group by event_id) as runners where horse_race.event_id = runners.event_id;
        update horse_race set matches_at_156 = matches.matches_at_156 from (select event_id, count(1) as matches_at_156 from horse_runner where matched_at_156 = true group by event_id) as matches where horse_race.event_id = matches.event_id;
        update horse_race set favourite_sp_odds = favourite.min_sp_odds from (select event_id, min(sp_odds) as min_sp_odds from horse_runner group by event_id) as favourite where horse_race.event_id = favourite.event_id;`)
        .then(function() {
            db.destroy();
            return;
        });

    db.destroy();
    return;
}

let importYear = 2017;

if (app.year) {
    importYear = app.year;
}

db.knex.raw('select filename from betfair_horse_imported')
    .then(function(importedFiles) {
        const filePath = `./data/betfair/horseracing/${importYear}/`;

        // Iterate files to import and process if not already imported
        fs.readdir(filePath, (err, files) => {
            promise.each(files, function(file) {
                    return processFile(file, importedFiles.rows)
                })
                .then(function(result) {
                    logger.log(`Completed all imports`, 'info');
                    db.destroy();
                    return;
                    /*return db.knex.raw(`delete from horse_race; insert into horse_race(event_id, country, event, course, distance, actual_off, selection_id, selection, win_flag, created_at) select event_id, country, event, course, distance, actual_off, selection_id, selection, win_flag, now() from betfair_horse_data group by event_id, country, event, course, distance, actual_off, selection_id, selection, win_flag order by event_id, selection_id;`)
                        .then(function(result) {
                            logger.log(`Completed all imports`, 'info');
                            db.destroy();
                        })
                        .catch(function(err) {
                            logger.log('Error inserting into horse_race', 'error');
                            console.log(err);
                            return;
                        });*/
                });
        });
    });

const processFile = async function(fileName, importedFiles) {
    return new promise(function(resolve, reject) {
        const imported = _.find(importedFiles, {
            'filename': fileName
        });

        if (fileName === '.DS_Store') {
            return resolve();
        }

        if (!imported) {
            importFile(fileName)
                .then(function(result) {
                    logger.log(`Completed importing Data from ${fileName}`, 'info');
                    return resolve(result);
                });
        } else {
            return resolve();
        }
    });
}

const importFile = function(fileName) {
    return new promise(function(resolve, reject) {

        logger.log(`Importing Data from ${fileName}`, 'info');

        const options = {
                endLine: '\n',
                enclosedChar: '"'
            },
            readStream = fs.createReadStream(`./data/betfair/horseracing/${importYear}/${fileName}`),
            csvStream = csv.createStream(options);

        readStream.pipe(csvStream)
            .on('error', function(err) {
                console.error(err);
            })
            .on('end', function() {
                logger.log(`Completed reading Data from ${fileName}`, 'info');

                return db.knex.raw(`insert into betfair_horse_imported (import_batch_year, filename, created_at) select ${importYear}, '${fileName}', now()`)
                    .then(function(result) {
                        return resolve();
                    })
                    .catch(function(err) {
                        logger.log('Error inserting into betfair_horse_imported', 'error');
                        console.log(err);
                        return;
                    });
            })
            .on('data', function(data) {
                if (data.EVENT.substring(0, 3) === 'PA ') {
                    // Dodgy event name for Doncaster 8th Sep 2016
                    data.EVENT = data.EVENT.substring(3);
                }

                if ((data.COUNTRY.trim() === 'GB' || data.COUNTRY.trim() === 'IRE') && data.IN_PLAY !== 'NI' && data.SETTLED_DATE && ['TBP', '2 TPB', '3 places', '4 PLACES', '4 TPB', '10 TBP', '2 TBP', '2TBP', '3 TBP', '4 TBP', '5 TBP', '6 TBP', 'TO BE PLACED', 'Each Way', 'Aintree Top Jockey', 'Aintree Top Trainer', '2 PLACES', '4TBP', 'Accumulator', 'Accumulator 9th Feb', 'To Be Placed', 'Top Cheltenham Festival Jockey W/O Ruby Walsh', 'Who will win the Prestbury Cup$1', 'Ascot Accumulator', 'Ebor Festival Top Jockey', '5TBP', '3TPB', 'Derby Festival Top Jockey', '3 PLACES', 'Derby Festival Top Trainer', '3mHcap Chs', 'Dante Festival - Top Jockey', 'Dante Festival - Top Trainer', 'Grand National', 'Stks', 'Top Jockey', 'Top Trainer', '3TBP', 'Reverse FC', 'Geraghty v Scholfield', 'SirFre v Vivian', 'Balding v R Lad', 'Prix dAmerique', 'Prix de France', 'Prx de la Marne', 'Px DLile De Fra', 'Prix De Paris', 'Ballinrobe', 'Clonmel', 'Cork', 'Curragh', 'Down Royal', 'Downpatrick', 'Dundalk', 'Fairyhouse', 'Gowran Park', 'Leopardstown', 'Limerick', 'Naas', 'Navan', 'Punchestown', 'Sligo', 'Thurles', 'Tipperary', 'Tramore', 'Wexford'].indexOf(data.EVENT) === -1 && ['GB/Daily Win Dist Odds'].indexOf(data.FULL_DESCRIPTION) && ['Scoop6', 'Shergar', 'Cheltenham', 'Royal', 'Grand', 'Glorious', 'Aintree', 'Jackpot', 'Winning', 'GN', 'Hennessy', 'IRE', 'Market'].indexOf(data.COURSE) === -1) {
                    let insertSQL = 'insert into betfair_horse_data(';
                    let selectSQL = 'select ';

                    for (let column in data) {
                        insertSQL += '"' + column.toLowerCase() + '",';

                        if (["COUNTRY", "FULL_DESCRIPTION", "COURSE", "EVENT", 'SELECTION', 'IN_PLAY'].indexOf(column) > -1) {
                            selectSQL += "'" + data[column].replace(/'/g, "\''").trim() + "',";
                        } else if (["SPORTS_ID", "EVENT_ID", "SELECTION_ID", "ODDS", 'NUMBER_BETS', 'VOLUME_MATCHED'].indexOf(column) > -1) {
                            selectSQL += data[column] + ',';
                        } else if (['WIN_FLAG'].indexOf(column) > -1) {
                            selectSQL += (data[column] == 1) + ',';
                        } else {
                            // Dates
                            let dateToInsert = data[column];

                            if (dateToInsert.length === 16) {
                                dateToInsert += ':00';
                            }

                            if (dateToInsert === '') {
                                selectSQL += 'null,';
                            } else {
                                dateToInsert = dateUtils.formatBetfairDateTime(dateToInsert);
                                selectSQL += "'" + dateUtils.formatPGDateTime(dateToInsert) + "',";
                            }
                        }
                    }

                    insertSQL += '"import_batch_year", "created_at") ';
                    selectSQL += `${importYear}, now();`;

                    return db.knex.raw(insertSQL + selectSQL)
                        .then(function(result) {
                            return result;
                        })
                        .catch(function(err) {
                            logger.log('Error inserting data into database', 'error');
                            console.log(data);
                            console.log(insertSQL + selectSQL);
                            return;
                        });
                }
                return;
            });
    });
}