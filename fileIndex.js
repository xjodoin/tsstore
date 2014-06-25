'use strict';

var fs = require('fs');
var moment = require('moment');
var async = require('async');
var sf = require('slice-file');


function addChild(indexPosition, value) {
    this.dirty = true;
    var node = new Node(value);
    this.children[indexPosition] = node;
    return node;
}

function getChild(indexPosition, callback) {
    var that = this;
    var child = this.children[indexPosition];
    if (child instanceof Node) {
        child.io = that.io;
        callback(null, child);
    } else if (child) {
        this.load(child, function (err, loaded) {
            that.children[indexPosition] = loaded;
            callback(err, loaded);
        });
    }
    else {
        callback();
    }
}

function load(child, callback) {

    if (child instanceof Node) {
        callback(null, child);
    }
    else {
        var that = this;

        fs.read(that.io.fd, new Buffer(child.length), 0, child.length, child.offset, function (err, bytesRead, buf) {
            var node = JSON.parse(buf.toString());
            var deserialized = new Node(node.value);
            deserialized.dirty = false;
            deserialized.children = toJSArray(node.children);
            deserialized.io = that.io;
            callback(err, deserialized);
        });
    }

}

function toJSArray(compactArray) {
    var array = [];
    compactArray.forEach(function (element) {
        array[element.index] = element.value;
    });

    return array;
}


function toJSON() {

    var convertedValues = [];

    this.children.forEach(function (element, index) {
        if (element) {
            convertedValues.push({index: index, value: {
                offset: element.offset,
                length: element.length
            }});
        }

    });


    var toSerialized = {
        value: this.value,
        children: convertedValues
    };

    return toSerialized;
}

function flush(writer, done) {
    if (this.dirty) {

        var that = this;

        async.eachSeries(this.children, function (node, doneChild) {
            if (node && node.dirty) {
                node.flush(writer, doneChild);
            }
            else {
                doneChild();
            }
        }, function (err) {
            var wstream = writer.wstream;
            var buf = new Buffer(JSON.stringify(that) + '\n');

            wstream.write(buf, function () {
                that.offset = writer.currentPos;
                that.length = buf.length;
                writer.currentPos = writer.currentPos + buf.length;
                done();

                that.dirty = false;

            });
        });

    }
    else {
        done();
    }


};

function Node(value) {
    this.dirty = true;
    this.value = value;
    this.children = [];
};

Node.prototype.addChild = addChild;
Node.prototype.getChild = getChild;
Node.prototype.flush = flush;
Node.prototype.load = load;
Node.prototype.toJSON = toJSON;


var indexInstance = function (globalIndex, io, ready) {

    function add(date, value, callback) {

        var moDate = moment(date);
        var dateArray = moDate.toArray();

        var index = globalIndex;

        async.eachSeries(dateArray, function (item, done) {
            index.dirty = true;
            index.getChild(item, function (err, child) {
                if (!child) {
                    child = index.addChild(item, value);
                }
                else {
                    if (child.value > value) {
                        child.value = value;
                        child.dirty = true;
                    }
                }
                index = child;
                done();
            });

        });

        globalIndex.flush(io, callback);
    }

    globalIndex.add = add;
    globalIndex.io = io;
    ready(null, globalIndex);
};


function create(options, ready) {

    var path = options.path;
    var start = 0;

    var exists = fs.existsSync(path);

    fs.open(path, 'a+', function (err, fd) {

        var wstream = fs.createWriteStream(path, { flags: 'a'});

        if (exists) {
            start = fs.statSync(path).size;
            var xs = sf(path);
            xs.sliceReverse(-1, function (err, lines) {

                var writer = {
                    fd: fd,
                    wstream: wstream,
                    currentPos: start
                };

                var globalIndex = JSON.parse(lines[0].toString());
                var deserialized = new Node();
                deserialized.dirty = false;
                deserialized.children = toJSArray(globalIndex.children);

                indexInstance(deserialized, writer, ready);
            });
        }
        else {

            var writer = {
                fd: fd,
                wstream: wstream,
                currentPos: start
            };

            indexInstance(new Node(), writer, ready);
        }
    });


}

module.exports = create;