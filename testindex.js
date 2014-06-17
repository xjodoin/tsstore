var tsindex = require('./tsindex');


tsindex.add(new Date('2014-06-16T19:08:38.317Z'), 100);
tsindex.add(new Date('2014-06-16T19:10:38.317Z'), 200);


tsindex.gt(new Date('2014-06-16T20:09:38.317Z'), function (err, start) {
   console.log(start);
});