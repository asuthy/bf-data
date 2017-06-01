'use strict';

const app = require('commander'),
    config = require('./config/local'),
    logger = require('./lib/logger'),
    db = require('./lib/db'),
    dateUtils = require('./lib/date-utils'),
    promise = require('bluebird'),
    fs = require('fs'),
    csv = require('csv-stream'),
    _ = require('lodash');

app
    .option('-y, --year [value]', 'Import Year')
    .parse(process.argv);

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