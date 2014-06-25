require('./fileIndex')(function (err, tsindex) {
    tsindex.add(new Date('2014-06-16T19:08:38.317Z'), 100, function () {
        tsindex.add(new Date('2014-06-16T19:10:38.317Z'), 200, function () {
        });
    });
});





