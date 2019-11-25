/**
 * Format Google Calendar JSON output into human readable list
 *
 * Based on script Copyright 2017, Milan Lund
 *
 */

window.formatGoogleCalendar = (() => {

    'use strict';

    var config;

    const renderList = (data, settings) => {
        var i;

        var output = "";
        for (i in data.items) {
            var calEvent = data.items[i];
            if ((typeof calEvent.start != 'undefined') && (typeof calEvent.end != 'undefined'))
            {
                output += transformationList(calEvent);
            }
        }

        if (output == "")
        {
            output = '<div class="alert alert-primary">We do not have any dates officially announced yet.<br/>Please check back soon.</div>';
        }

        document.getElementById(settings.upcomingSelector).innerHTML = output;
    };

    //Gets JSON from Google Calendar and transfroms it into html list items and appends it to past or upcoming events list
    const init = (settings) => {
        config = settings;

        var finalURL = settings.calendarUrl;

        // Want all forthcoming dates from first thing this morning.
        var dateAsString = (new Date()).toISOString();
        finalURL = finalURL.concat('&timeMin=' + dateAsString);

        //Get JSON, parse it, transform into list items and append it to past or upcoming events list
        var request = new XMLHttpRequest();
        request.open('GET', finalURL, true);
        
        request.onload = () => {
            if (request.status >= 200 && request.status < 400) {
                var data = JSON.parse(request.responseText);
                renderList(data, settings);
            } else {
                console.error(request.statusText);
            }
        };
        
        request.onerror = () => {
            console.error(err);
        };
        
        request.send();
    };

    const isAllDay = (dateStart, dateEnd) => {
        var dateEndTemp = subtractOneDay(dateEnd);
        var isAll = true;
        
        for (var i = 0; i < 3; i++) {
            if (dateStart[i] !== dateEndTemp[i]) {
                isAll = false;
            }
        } 

        return isAll;
    };

    const isSameDay = (dateStart, dateEnd) => {
        var isSame = true;

        for (var i = 0; i < 3; i++) {
            if (dateStart[i] !== dateEnd[i]) {
                isSame = false;
            }
        } 

        return isSame;
    }

    //Get all necessary data (dates, location, summary, description) and creates a list item
    const transformationList = (result) => {
        var dateStart = getDateInfo(result.start.dateTime || result.start.date);
        var dateEnd = getDateInfo(result.end.dateTime || result.end.date);
        var moreDaysEvent = true;
        var isAllDayEvent = isAllDay(dateStart, dateEnd);

        if (typeof result.end.date !== 'undefined') {
            dateEnd = subtractOneDay(dateEnd);
        }

        if (isSameDay(dateStart, dateEnd)) {
            moreDaysEvent = false;
        }

        var dateFormatted = getFormattedDate(dateStart, dateEnd, moreDaysEvent, isAllDayEvent);
        var output = '<div class="alert alert-secondary"'

        if (typeof result.description !== 'undefined')
        {
            output += ' popover-top="'+ result.description + '"';
        }

				output += '><span class="text-danger">' + dateFormatted +'</span>';

        if (typeof result.location !== 'undefined')
        {
            output += '<br/><span class="text-danger">'+ result.location + '</span>';
        }

        return output + '<br/>'+ result.summary + '</div>';
    };


    //Get temp array with information about day in followin format: [day number, month number, year, hours, minutes]
    const getDateInfo = date => {
        date = new Date(date);
        return [date.getDate(), date.getMonth(), date.getFullYear(), date.getHours(), date.getMinutes(), 0, 0];
    };

    //Get month name according to index
    const getMonthName = month => {
        var monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
        ];

        return monthNames[month];
    };

    const calculateDate = (dateInfo, amount) => {
        var date = getDateFormatted(dateInfo);
        date.setTime(date.getTime() + amount);
        return getDateInfo(date);
    };

    const getDayNameFormatted = dateFormatted => {
        var dayNames = [
          'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
        ];
        return dayNames[(getDateFormatted(dateFormatted).getDay())] + ' ';
    }
    
    const getDateFormatted = dateInfo => new Date(dateInfo[2], dateInfo[1], dateInfo[0], dateInfo[3], dateInfo[4] + 0, 0);
    
    //Subtract one day
    const subtractOneDay = (dateInfo) => calculateDate(dateInfo, -86400000);

    //Transformations for formatting date into human readable format
    const formatDateSameDay = (dateStart, dateEnd, moreDaysEvent, isAllDayEvent) => {
        var formattedTime = '',
            dayNameStart = '';

        dayNameStart = getDayNameFormatted(dateStart);

        if (!moreDaysEvent && !isAllDayEvent) {
            formattedTime = ' from ' + getFormattedTime(dateStart) + ' - ' + getFormattedTime(dateEnd);
        }

        //month day, year time-time
        return dayNameStart + dateStart[0] + ' ' + getMonthName(dateStart[1]) + ' ' + dateStart[2] + formattedTime;
    };


    const formatDateDifferentDay = (dateStart, dateEnd, dayNames) => {
      var dayNameStart = '',
          dayNameEnd = '';

      if (dayNames) {
        dayNameStart = getDayNameFormatted(dateStart);
        dayNameEnd = getDayNameFormatted(dateEnd);
      }
        //month day-day, year
        return dayNameStart + dateStart[0] + ' ' + getMonthName(dateStart[1]) + '-' + dayNameEnd + dateEnd[0] + ', ' + dateStart[2];
    };

    const formatDateDifferentMonth = (dateStart, dateEnd, dayNames) => {
      var dayNameStart = '',
          dayNameEnd = '';

      if (dayNames) {
        dayNameStart = getDayNameFormatted(dateStart);
        dayNameEnd = getDayNameFormatted(dateEnd);
      }
        //month day - month day, year
        return dayNameStart + dateStart[0] + ' ' + getMonthName(dateStart[1]) + '-' + dayNameEnd + dateEnd[0] + ' ' + getMonthName(dateEnd[1]) + ', ' + dateStart[2];
    };

    const formatDateDifferentYear = (dateStart, dateEnd, dayNames) => {
      var dayNameStart = '',
          dayNameEnd = '';

      if (dayNames) {
        dayNameStart = getDayNameFormatted(dateStart);
        dayNameEnd = getDayNameFormatted(dateEnd);
      }
        //month day, year - month day, year
        return dayNameStart + dateStart[0] + ' ' + getMonthName(dateStart[1]) + ', ' + dateStart[2] + '-' + dayNameEnd + dateEnd[0] + ' ' + getMonthName(dateEnd[1]) + ', ' + dateEnd[2];
    };

    //Check differences between dates and format them
    const getFormattedDate = (dateStart, dateEnd, dayNames, moreDaysEvent, isAllDayEvent) => {
        var formattedDate = '';

        if (dateStart[0] === dateEnd[0]) {
            if (dateStart[1] === dateEnd[1]) {
                if (dateStart[2] === dateEnd[2]) {
                    //month day, year
                    formattedDate = formatDateSameDay(dateStart, dateEnd, dayNames, moreDaysEvent, isAllDayEvent);
                } else {
                    //month day, year - month day, year
                    formattedDate = formatDateDifferentYear(dateStart, dateEnd, dayNames);
                }
            } else {
                if (dateStart[2] === dateEnd[2]) {
                    //month day - month day, year
                    formattedDate = formatDateDifferentMonth(dateStart, dateEnd, dayNames);
                } else {
                    //month day, year - month day, year
                    formattedDate = formatDateDifferentYear(dateStart, dateEnd, dayNames);
                }
            }
        } else {
            if (dateStart[1] === dateEnd[1]) {
                if (dateStart[2] === dateEnd[2]) {
                    //month day-day, year
                    formattedDate = formatDateDifferentDay(dateStart, dateEnd, dayNames);
                } else {
                    //month day, year - month day, year
                    formattedDate = formatDateDifferentYear(dateStart, dateEnd, dayNames);
                }
            } else {
                if (dateStart[2] === dateEnd[2]) {
                    //month day - month day, year
                    formattedDate = formatDateDifferentMonth(dateStart, dateEnd, dayNames);
                } else {
                    //month day, year - month day, year
                    formattedDate = formatDateDifferentYear(dateStart, dateEnd, dayNames);
                }
            }
        }

        return formattedDate;
    };

    const getFormattedTime = (date) => {
        var formattedTime = '',
            period = 'AM',
            hour = date[3],
            minute = date[4];

        // Handle afternoon.
        if (hour >= 12) {
            period = 'PM';

            if (hour >= 13) {
                hour -= 12;
            }
        }

        // Handle midnight.
        if (hour === 0) {
            hour = 12;
        }

        // Ensure 2-digit minute value.
        minute = (minute < 10 ? '0' : '') + minute;

        // Format time.
        formattedTime = hour + ':' + minute + period;
        return formattedTime;
    };

    return { 
        init: function (settings) {
            init(settings);
        }
    };
})();