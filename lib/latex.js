var mathmode = require("./mathmode.js");
var DataURI = require("datauri");

function tex2png(tex, callback) {
    var duri = new DataURI();
    var stream = mathmode(tex, {dpi:150});
    var buffers = [];
    stream.on("data", function(chunk) {
        buffers.push(chunk);
    });

    stream.on("end", function() {
        duri.format(".png", Buffer.concat(buffers));
        callback(duri.content);
    });
}

module.exports = function (content, startDelimiter, endDelimiter, callback) {
    // Split the string at the start delimiters
    var substrings = content.split(startDelimiter);
    var nTex = 0;
    var nTexDone = 0;

    for (var i = 1; i < substrings.length; i += 2) {
        // If the start and end delimiters are different,
        // split each substring at the end delimiter.
        if (startDelimiter !== endDelimiter) {
            var splitEnd = substrings[i].split(endDelimiter);
            if (splitEnd.length === 2) {
                substrings[i] = splitEnd[0];
                substrings.splice(i + 1, 0, splitEnd[1]);
            }
            else {
                substrings.splice(i, 0, "");
            }
        }
        
        var tex = substrings[i].trim();
        if (tex.length) {
            nTex++;
            (function(idx) {
                tex2png(tex, function(content) {
                    substrings[idx] = "<img class='latex' src='" + content + "' />";
                    nTexDone++;
                    if (nTexDone == nTex) {
                        callback(substrings.join(""));
                    }
                });
            })(i);
        }
    }
    
    if (nTex == 0) {
        callback(content);
    }
};
