var tstore = require('./tsstore');
tstore(function (writer, close) {
    writer({toto: 'test'});
    close();
});