"use strict";
var getopt = require("node-getopt");
var fs = require("fs");
var path = require("path");
var hljs = require("highlight.js");
var MarkdownIt   = require("markdown-it");
var MarkdownMetaData = require("./lib/markdown-metadata.js");
var latex = require("./lib/latex.js");

var options = getopt.create([
        ["i", "input=ARG",      "input markdown file."],
        ["o", "output=ARG",     "output html file."],
        ["t", "template=ARG",   "template directory."],
        ["h", "help",           "display this help."]
        ]).bindHelp().parseSystem().options;

// Template Engine Config
var template = require([options.template,"template.js"].join(path.sep))(options, require("Handlebars"));
template.init();

// markdown config
var mdIt = new MarkdownIt({
    highlight: function (str, lang) {
        if (lang === "latex"){
            return str;
        }

        if (lang && hljs.getLanguage(lang)) {
            try {
                return hljs.highlight(lang, str).value;
            } catch (__) {}
        }
        try {
          return hljs.highlightAuto(str).value;
        } catch (__) {}
        return '';
    },
    html: true,
    linkify: true,
    typographer: true
}).use(require("markdown-it-footnote"));

var mmd = new MarkdownMetaData(options.input, mdIt);
mmd.defineTokens("---", "---");

try {
    var context = mmd.metadata();
    context.contents = mmd.markdown();
} catch(err) {
    console.log("Bad markdown file or metadata: ", options.input); 
    process.exit(1);
}

latex(context.contents, '<pre><code class="language-latex">', '</code></pre>', function(content) {
    context.contents = content;

    try {
        if (!fs.existsSync(path.dirname(options.output))) {
            fs.mkdirSync(path.dirname(options.output));
        }
        fs.writeFileSync(options.output, template.apply(context));
    } catch(err) {
        console.log("Cannot write output to", options.output);
        process.exit(2);
    }
});
