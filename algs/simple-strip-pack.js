var path = require('path'),
    utils = require('../utils'),
    printSheet = require('../print-sheet');

function stripSizes(pieces){
    var stripSizes = {};
    for(var i=0; i<pieces.length; i++){
        if(!stripSizes[pieces[i].width]){
            stripSizes[pieces[i].width] = true;
        }
    }
    return Object.keys(stripSizes).sort(function(a, b){
        return Number(b) - Number(a);
    });
}
function piecesOfWidth(pieces, width){
    var arr = [];
    for(var i=0; i<pieces.length; i++){
        if(pieces[i].width == width){
            arr.push(pieces[i]);
        }
    }
    return arr;
}

function sort(pieces){
    pieces.sort(function(a, b){
        return b.length - a.length;
    });
}

function createStripInSheet(width, sheet){
    for(var i=0; i<sheet.holes.length; i++){
        var hole = sheet.holes[i];
        if(width < hole.width){
            // Can allocate a new strip here!

            // Remove the hole
            sheet.holes.splice(i, 1);

            // Create the strip from the hole
            var strip = {
                x: hole.x,
                y: hole.y,
                width: width,
                pieces: [],
                remainder: hole.length
            };
            sheet.strips.push(strip);

            // Create a new hole
            var newHole = {
                x: hole.x,
                y: hole.y + width + utils.BLADE_WIDTH, // 1/8 for width of cutting blade,
                width: hole.width - width - utils.BLADE_WIDTH,
                length: hole.length
            };
            sheet.holes.push(newHole);

            return strip;
        }
    }
}
function addPieceToStrip(piece, strip){
    strip.pieces.push(piece);
    strip.remainder -= (piece.length + utils.BLADE_WIDTH); // 1/8 for width of cutting blade
    return true;
}

module.exports = function(pieces, sheetSize, outputDir){
    outputDir = path.resolve(outputDir, 'simple-strip-pack');
    var stripWidths = stripSizes(pieces);
    var sortedPieces = [],
        i;
    for(i=0; i<stripWidths.length; i++){
        var thesePieces = piecesOfWidth(pieces, stripWidths[i]);

        sort(thesePieces);
        sortedPieces = sortedPieces.concat(thesePieces);
    }

    var sheets = [];
    function createSheet(thicknessStr, thickness){
        // Allocate a sheet
        var sheet = {
            thicknessStr: thicknessStr,
            thickness: thickness,
            width: sheetSize.width,
            length: sheetSize.length,
            strips: [],
            holes: [
                {
                    x: 0,
                    y: 0,
                    width: sheetSize.width,
                    length: sheetSize.length
                }
            ]
        };
        sheets.push(sheet);
        return sheet;
    }
    function getSheetForThickness(thicknessStr, thickness){
        for(var i=0; i<sheets.length; i++){
            if(sheets[i].thickness == thickness){
                return sheets[i];
            }
        }

        return createSheet(thicknessStr, thickness);
    }

    var sheet;
    while(sortedPieces.length > 0){
        // While we have un-allocated pieces, keep packing
        var piece = sortedPieces.shift();
        sheet = getSheetForThickness(piece.thicknessStr, piece.thickness);

        // Attempt to pack this piece into the sheet
        var didPack = false;
        var strip;
        for(i=0; i<sheet.strips.length; i++){
            strip = sheet.strips[i];
            if(strip.width == piece.width){
                // This piece could fit in the strip!
                if(strip.remainder > piece.length){
                    // Add this piece to the strip!
                    didPack = addPieceToStrip(piece, strip);
                    if(didPack){
                        break;
                    }
                }
            }
        }
        if(!didPack){
            strip = createStripInSheet(piece.width, sheet);
            if(!strip){
                // Couldn't create strip in the sheet
                // So, let's create a new sheet?
                sheet = createSheet(piece.thicknessStr, piece.thickness);
                strip = createStripInSheet(piece.width, sheet);
            }
            didPack = addPieceToStrip(piece, strip);
        }

        // did pack!
        if(!didPack){
            console.error('Didn\'t pack?!?!');
            process.exit(1);
        }
    }

    for(i=0; i<sheets.length; i++){
        sheet = sheets[i];
        // compute the pieces on the sheet (put it in the right format for printSheet)
        computePieces(sheet);

        var filename = 'output-'+sheet.thicknessStr.replace('/', '_')+'-'+i+'.png';
        printSheet(sheet, outputDir, filename);
    }
};

function computePieces(sheet){
    sheet.pieces = [];
    for(var j=0; j<sheet.strips.length; j++){
        var strip = sheet.strips[j];
        var x = 0;
        for(var k=0; k<strip.pieces.length; k++){
            var piece = strip.pieces[k];
            piece.x = x;
            piece.y = strip.y;
            sheet.pieces.push(piece);
            x += piece.length + utils.BLADE_WIDTH; // 1/8 for blade width
        }
    }
}
