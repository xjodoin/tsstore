'use strict';

var moment = require('moment');
var async = require('async');

function query(globalIndex) {

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

        var continueEach = true;

        async.eachSeries(dateArray, function (item, done) {
            if (continueEach) {
                index.getChild(item, function (err, child) {

                    if (!child || child.children.length === 0) {
                        var sliceResult = index.children.slice(item);

                        if (sliceResult.length > 0) {
                            var element = getFirstNotNull(sliceResult);
                            index.load(element, function (err, loaded) {
                                startPosition = loaded.value;
                                continueEach = false;
                                done();
                            });

                        }
                        else if (parentNextValues.length > 0) {
                            var element = getFirstNotNull(parentNextValues);
                            index.load(element, function (err, loaded) {
                                startPosition = loaded.value;
                                continueEach = false;
                                done();
                            });

                        }
                        else {
                            continueEach = false;
                            done();
                        }
                    }
                    else if (child) {
                        parentNextValues = index.children.slice(item);
                        index = child;
                        done();
                    }


                });
            }
            else {
                done();
            }

        }, function (err) {
            callback(err, startPosition);
        })


    };

    return {
        gt: gt
    }

}

module.exports = query;