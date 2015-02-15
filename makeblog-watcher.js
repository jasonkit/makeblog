"use strict";
var watch = require("watch");
var ws = require("ws");
var exec = require("child_process").exec;
var sys = require("sys");
var fs = require("fs");
var os = require("os");
var path = require("path");

function MakeblogWatch(dirs, port, watchOptions)
{
    if (!(dirs instanceof Array)) {
        dirs = [dirs];
    }

    var server = new ws.Server({port:port});

    var watchOptions = watchOptions || {
        ignoreDotFiles: true,
        ignoreUnreadableDir: true,
        ignoreDirectoryPattern: /node_modules/
    };

    var lastFile = null;

    var make = function (f, stat)
    {
        if (lastFile != f) {
            lastFile = f;
            exec("make", function(err, stdout, stderr) {
                if (err === null) {
                    server.clients.forEach(function (socket) {
                        socket.send(f);
                    });
                    lastFile = null;
                }
            });
        }
    };

    var i;
    for (i in dirs) {
        if (fs.existsSync(dirs[i])) {
            watch.createMonitor(dirs[i], watchOptions, function(monitor) {
                monitor.on("created", make);
                monitor.on("changed", make);
                monitor.on("removed", make);
            });
        }
    }
}

var getopt = require("node-getopt");
var options = getopt.create([
        ["s", "source=ARG",     "source directory."],
        ["t", "template=ARG",   "template directory."],
        ["p", "port=ARG",       "web socket server port."],
        ["k", "kill",           "kill watcher,"],
        ["h", "help",           "display this help."]
        ]).bindHelp().parseSystem().options;

var pid_file = [os.tmpdir(), "makeblog-watcher.pid"].join(path.sep);

if (!fs.existsSync(pid_file)) {
    if (options.kill === undefined) {
        fs.writeFileSync(pid_file, process.pid.toString());
        MakeblogWatch([options.source, options.template], parseInt(options.port));
    }
}else {
    if (options.kill) {
        var pid = parseInt(fs.readFileSync(pid_file));
        process.kill(pid);
        fs.unlinkSync(pid_file);
    }else {
        console.log("Another watcher is running.");
    }
}
