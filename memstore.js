'use strict';

var moment = require('moment');

function create() {

    var globalIndex = [];

    function add(date, start) {

        var moDate = moment(date);
        var dateArray = moDate.toArray();
        var index = globalIndex;

        dateArray.forEach(function (item) {
            if (!index[item]) {
                index[item] = {
                    start: start,
                    children: []
                }
            }
            else {
                if (index[item].start > start) {
                    index[item].start = start;
                }
            }

            index = index[item].children;
        });

    }


    var getFirstNotNull = function (array) {
        var notNull;
        array.every(function (item) {
            if (item) {
                notNull = item;
                return false;
            }
        });

        return notNull;
    }


    function gt(date, callback) {
        var moDate = moment(date);
        var dateArray = moDate.toArray();

        var index = globalIndex;
        var startPosition = -1;
        var parentNextValues = [];


        dateArray.every(function (item) {

            if (!index[item] || index[item].children.length === 0) {
                var sliceResult = index.slice(item);

                if (sliceResult.length > 0) {
                    startPosition = getFirstNotNull(sliceResult).start;
                    return false;
                }
                else if (parentNextValues.length > 0) {
                    startPosition = getFirstNotNull(parentNextValues).start;
                    return false;
                }
                else {
                    return false;
                }
            }
            else {
                parentNextValues = index.slice(item + 1);
                index = index[item].children;
                return true;
            }

        });

        callback(null, startPosition);

    };

    return {
        add: add,
        gt: gt,
        toJSON: function () {
            return JSON.stringify(globalIndex);
        }
    }

}

module.exports = create;