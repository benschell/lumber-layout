var path = require('path'),
    fs = require('fs'),
    mkdirp = require('mkdirp'),
    utils = require('./utils'),
    randomcolor = require('randomcolor');

var IMG_PADDING = utils.IMG_PADDING,
    IMG_ZOOM = utils.IMG_ZOOM;

module.exports = function(sheet, outputDir, filename){
    /* Expecting:
{
    width: Number,
    length: Number,
    thickness: Number,
    thicknessStr: String,
    pieces: [
        {
            x: Number,
            y: Number,
            width: Number,
            length: Number
        },
        ...
    ]
}
    **/
    mkdirp(outputDir, function(err){

        var Canvas = require('canvas');
        var Image = Canvas.Image;
        var canvas = new Canvas(
            sheet.length * IMG_ZOOM + IMG_PADDING * 2,
            sheet.width * IMG_ZOOM + IMG_PADDING * 2
        );
        var ctx = canvas.getContext('2d');

        ctx.strokeStyle = '#000';
        ctx.strokeRect(
            IMG_PADDING,
            IMG_PADDING,
            sheet.length * IMG_ZOOM,
            sheet.width * IMG_ZOOM
        );
        ctx.strokeText(
            'Thickness: '+sheet.thicknessStr,
            IMG_PADDING / 2,
            IMG_PADDING / 2
        );
        for(var j=0; j<sheet.pieces.length; j++){
            var piece = sheet.pieces[j];
            ctx.fillStyle = randomcolor();
            ctx.fillRect(
                IMG_PADDING + piece.x * IMG_ZOOM,
                IMG_PADDING + piece.y * IMG_ZOOM,
                piece.length * IMG_ZOOM,
                piece.width * IMG_ZOOM
            );

            ctx.strokeText(
                piece.dimensions.replace(sheet.thicknessStr+' x ', ''),
                IMG_PADDING + piece.x * IMG_ZOOM,
                IMG_PADDING + piece.y * IMG_ZOOM + IMG_PADDING / 2
            );
        }

        filename = path.resolve(outputDir, filename);
        canvas.createPNGStream().pipe(fs.createWriteStream(filename));
        console.log('Wrote', sheet.thicknessStr, 'sheet to', filename);
    });
};
