const fs = require('fs');
const path = require('path');
const Movie = require('../models/movies');

// SRC https://medium.com/@daspinola/video-stream-with-node-js-and-html5-320b3191a6b6

/**
 *
 * Stream movies which are located in the movie folder.
 *
 * @params  [object] $req,
 *          [object] $res,
 * @return  [object] POST Streamobject
 *
 */
exports.streamOfflineMovie = function (req,res){
    Movie.findOne({ movie_id:req.params.id }, 'movie_path', function (err, db) {
        if (err) return err;
        // Get file metainformations
        let MovieStats = fs.statSync(db.movie_path);
        let StreamObj = {
            filepath : db.movie_path,
            stats    : MovieStats,
            fileSize : MovieStats.size,
            range    : req.headers.range
        }
        try {
            startStream(StreamObj,res);
        } catch {
            return;
        }
    });
}

/**
 *
 * Construct streaming object and send it via HTTP Header
 *
 * @params  [objects] $Obj,
 *          [objects] $res,
 * @return  [object] $cb
 *
 */
function startStream(Obj,res,cb){
        if(Obj.range) {
            const parts = Obj.range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10)
            // calculate filesize
            const end = parts[1]
                ? parseInt(parts[1], 10)
                : Obj.fileSize-1;
            const chunksize = (end-start)+1
            const file = fs.createReadStream(Obj.filepath, {start, end});
            const head = {
                      'Content-Range': `bytes ${start}-${end}/${Obj.fileSize}`,
                      'Accept-Ranges': 'bytes',
                      'Content-Length': chunksize,
                      'Content-Type': 'video/mp4',
            }

            res.writeHead(206, head);
            file.pipe(res);
        } else {
            const head = {
                'Content-Length' : Obj.fileSize,
                'Content-Type': 'video/mp4',
            }
            res.writeHead(200, head);
            fs.createReadStream(Obj.filepath).pipe(res);

        // TODO
        // throw err
    }
}






