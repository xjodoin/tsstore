//require('./fileIndex')(function (err, tsindex) {
//    tsindex.add(new Date('2014-06-16T19:08:38.317Z'), 100, function () {
//        tsindex.add(new Date('2014-06-16T19:10:38.317Z'), 200, function () {
//        });
//    });
//});

var query = require('./tsindex');

require('./fileIndex')(function (err, tsindex) {
      query(tsindex).gt(new Date('2014-06-16T19:09:38.317Z'), function (err, start) {
        console.log(start);
    });
});





