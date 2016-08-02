var path = require('path');
var math = require('mathjs');
var input = require(path.resolve(process.argv[2]));
var outputDir = process.argv[2].split('.');
outputDir.pop();
outputDir = outputDir.join('.');
outputDir = path.resolve('output', outputDir);

function parseNumber(numString){
    numString = numString.replace(' ', '+');
    return math.eval(numString);
}
function parseDimensions(str){
    var obj = {
        dimensions: str
    };
    var parts = str.split('x');
    if(parts.length == 3){
        var tness = parts.shift().trim();
        obj.thicknessStr = tness;
        obj.thickness = parseNumber(tness);
    }
    obj.width = parseNumber(parts.shift().trim());
    obj.length = parseNumber(parts.shift().trim());
    return obj;
}
function cloneDimensions(dimensionsArray){
    var arr = [];
    for(var i=0; i<dimensionsArray.length; i++){
        arr.push({
            dimensions: dimensionsArray[i].dimensions,
            thicknessStr: dimensionsArray[i].thicknessStr,
            thickness: dimensionsArray[i].thickness,
            width: dimensionsArray[i].width,
            length: dimensionsArray[i].length
        });
    }
    return arr;
}

var sheets = {};
var thicknesses = Object.keys(input.sheets);
for(var i=0; i<thicknesses.length; i++){
    var tness = thicknesses[i],
        tnessNum = parseNumber(tness);
    sheets[tness] = parseDimensions(input.sheets[tness]);
}

var pieces = {};
var cuts = Object.keys(input.cuts);
for(var i=0; i<cuts.length; i++){
    var cut = cuts[i],
        cutd = parseDimensions(cut);
    if(!pieces[cutd.thicknessStr]){
        pieces[cutd.thicknessStr] = [];
    }
    pieces[cutd.thicknessStr].push(cutd);
}

var simpleStripPack = require('./algs/simple-strip-pack');
for(var i=0; i<thicknesses.length; i++){
    var tness = thicknesses[i];
    simpleStripPack(cloneDimensions(pieces[tness]), sheets[tness], outputDir);
}
