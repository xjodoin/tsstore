'use strict';

var fs = require('fs');
var moment = require('moment');
var es = require('event-stream');

module.exports = function (options, ready) {


    var path = options.dir + '/ts.dat';
    var wstream = fs.createWriteStream(path, { flags: 'a'});

    var start = fs.existsSync(path) ? fs.statSync(path).size : 0;

    wstream.on('open', function () {
        var writer = function (data) {
            var utc = moment().utc();
            var row = {timestamp: utc.toISOString(), data: data };

            var buf = new Buffer(JSON.stringify(row) + '\n', 'UTF8');
            var end = start + buf.length;

            //console.log('start ' + start + ' end ' + end)
            wstream.write(buf);
            start = end;
        };


        var close = function () {
            wstream.end();
        };


        var query = function (queryInfo, writableStream) {
            var readStream = fs.createReadStream(path);

            var end = false;
            var first = true;

            readStream.on('end', function () {
                end = true;
            });


            readStream
                .pipe(es.split()) //defaults to lines.
                .pipe(es.map(function (data, cb) {
                    if (end) {
                        cb(null, data + ']');
                    }
                    else if (first) {
                        first = false;
                        cb(null, '[' + data);
                    }
                    else {
                        cb(null, ',' + data);
                    }
                }))
                .pipe(writableStream);
        };

        ready({writer: writer, close: close, query: query});
    });

};







