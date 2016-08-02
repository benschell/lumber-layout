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

function createStrip(x, y, width, length){
    return {
        x: x,
        y: y,
        width: width,
        length: length,
        pieces: [],
        remainder: length
    };
}
function createStripInSheet(width, sheet){
    for(var i=0; i<sheet.holes.length; i++){
        var hole = sheet.holes[i];
        if(width < hole.width){
            // Can allocate a new strip here!

            // Remove the hole
            sheet.holes.splice(i, 1);

            // Create the strip from the hole
            var strip = createStrip(hole.x, hole.y, width, hole.length);
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
function createStripInStrip(width, strip){
    var y = 0;
    if(!strip.substrips){
        // First substrip
        strip.remainingWidth = strip.width - width - utils.BLADE_WIDTH;
        strip.substrips = [];
    }else{
        // We've got previously existing substrips!
        // Let's figure out our new y
        for(var i=0; i<strip.substrips.length; i++){
            y += strip.substrips[i].width + utils.BLADE_WIDTH;
        }
        strip.remainingWidth -= width + utils.BLADE_WIDTH;
    }
    var newStrip = createStrip(
        strip.length - strip.remainder, // x
        y,                              // y
        width,                          // width
        strip.remainder                 // length
    );
    strip.substrips.push(newStrip);
    return newStrip;
}
function addPieceToStrip(piece, strip){
    strip.pieces.push(piece);
    strip.remainder -= (piece.length + utils.BLADE_WIDTH); // 1/8 for width of cutting blade
    return true;
}

module.exports = function(pieces, sheetSize, outputDir){
    outputDir = path.resolve(outputDir, '2-phase-strip-pack');
    var stripWidths = stripSizes(pieces);
    var sortedPieces = [],
        h, i;
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

    var sheet;
    while(sortedPieces.length > 0){
        // While we have un-allocated pieces, keep packing
        var piece = sortedPieces.shift();

        // Attempt to pack this piece into the sheet
        var didPack = false;
        var strip;

        // Make sure there's at least one sheet
        if(sheets.length === 0){
            createSheet(piece.thicknessStr, piece.thickness);
        }

        for(h=0; h<sheets.length; h++){
            sheet = sheets[h];
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
                if(strip.substrips && strip.substrips.length > 0){
                    for(j=0; j<strip.substrips.length; j++){
                        var substrip = strip.substrips[j];
                        if(substrip.width == piece.width){
                            if(substrip.remainder > piece.length){
                                didPack = addPieceToStrip(piece, substrip);
                                if(didPack){
                                    break;
                                }
                            }
                        }
                    }
                }
            }

            // We did not find a strip of the exact size of this piece
            // Let's try to find a strip that's bigger than we need and make a strip inside the strip (whoa)
            if(!didPack){
                for(i=0; i<sheet.strips.length; i++){
                    strip = sheet.strips[i];
                    if(strip.width > piece.width){
                        // This piece could fit in a new strip within this strip
                        if(
                            strip.remainder > piece.length &&
                            (!strip.substrips || strip.remainingWidth > piece.width)
                        ){
                            // Add a new strip to this strip!
                            var newStrip = createStripInStrip(piece.width, strip);
                            // Add this piece to the strip!
                            didPack = addPieceToStrip(piece, newStrip);
                            if(didPack){
                                break;
                            }
                        }

                    }
                }
            }

            // We did not put this piece into an existing strip
            // Nor did we find an existing strip that could be re-partitioned with a new strip
            // So, we need to make a brand-new strip!
            if(!didPack){
                strip = createStripInSheet(piece.width, sheet);
                if(strip){
                    didPack = addPieceToStrip(piece, strip);
                }
            }

            if(didPack){
                break;
            }
        }

        // did pack!
        if(!didPack){
            // Couldn't create strip in the sheet
            // So, let's create a new sheet?
            sheet = createSheet(piece.thicknessStr, piece.thickness);
            strip = createStripInSheet(piece.width, sheet);

            // console.error('Didn\'t pack?!?!');
            // process.exit(1);
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
    var j, k, l, piece;
    for(j=0; j<sheet.strips.length; j++){
        var strip = sheet.strips[j];
        var x = 0;
        for(k=0; k<strip.pieces.length; k++){
            piece = strip.pieces[k];
            piece.x = x;
            piece.y = strip.y;
            sheet.pieces.push(piece);
            x += piece.length + utils.BLADE_WIDTH; // 1/8 for blade width
        }
        if(strip.substrips && strip.substrips.length > 0){
            for(k=0; k<strip.substrips.length; k++){
                var substrip = strip.substrips[k];
                var xx = 0;
                for(l=0; l<substrip.pieces.length; l++){
                    piece = substrip.pieces[l];
                    piece.x = substrip.x + xx;
                    piece.y = strip.y + substrip.y;
                    sheet.pieces.push(piece);
                    xx += piece.length + utils.BLADE_WIDTH;
                }
            }
        }
    }
}
