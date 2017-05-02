'use strict';

const moment = require('moment');

module.exports = {

    formatBetfairDateTime: function(dateStr) {
        var newDateString;

        //if (isNaN(Date.parse(dateStr))) {
        newDateString = moment(dateStr, 'DD-MM-YYYY hh:mm:ss').format('YYYY-MM-DD HH:mm:ssZZ');

        // Parse new date
        if (!isNaN(Date.parse(newDateString))) {
            dateStr = newDateString;
        }
        //}

        return dateStr;
    },

    /**
     * Take a JS date and return is a format suitable to insert into PG
     *
     */
    formatPGDateTime: function(date) {
        let formattedDate = moment(date).format('YYYY-MM-DD HH:mm:ss');

        return formattedDate;
    },

    /**
     * Returns the time intervals of the date passed
     *
     * @param {Date} The date to get date intervals for
     
     * @return {Object} An object of intervals with appropriate key names
     */
    getIntervalsFromDate: function(date) {
        var mDate = moment(new Date(date));

        return {
            year: mDate.year(),
            quarter: mDate.quarter(),
            month: mDate.month(),
            week: mDate.isoWeek(),
            monthDay: mDate.date(),
            day: mDate.day(),
            hour: mDate.hour(),
            minute: mDate.minute()
        };

    }
};