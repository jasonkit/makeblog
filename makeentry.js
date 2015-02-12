"use strict";
var MarkedMetaData = require("marked-metadata-with-options");
var getopt = require("node-getopt");
var fs = require("fs");
var path = require("path");
var highlight = require("highlight.js");

var options = getopt.create([
        ["i", "input=ARG",      "input markdown file."],
        ["o", "output=ARG",     "output html file."],
        ["t", "template=ARG",   "template directory."],
        ["h", "help",           "display this help."]
        ]).bindHelp().parseSystem().options;

// Template Engine Config
var template = require([options.template,"template.js"].join(path.sep))(options, require("Handlebars"));
template.init();

// marked Config
var md = new MarkedMetaData(options.input);
md.defineTokens("---", "---");
md.setOptions({
    highlight: function (code, lang) {
        return highlight.highlight(lang, code).value;
    }
});

try {
    var context = md.metadata();
    context.contents = md.markdown();
} catch(err) {
    console.log("Bad markdown file or metadata: ", options.input); 
    process.exit(1);
}

try {
    if (!fs.existsSync(path.dirname(options.output))) {
        fs.mkdirSync(path.dirname(options.output));
    }
    fs.writeFileSync(options.output, template.apply(context));
} catch(err) {
    console.log("Cannot write output to", options.output);
    process.exit(2);
}
