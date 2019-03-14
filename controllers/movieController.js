const mongoose = require('mongoose');
const update_controller = require('./updateController');
const async = require('async');
const Genre = require('../models/genre');
const MovieConst = mongoose.model('Movie');
const GenreConst = mongoose.model('Genre');
const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');


/**
 *
 *  Create new DB entrie for non existing movies.
 *  If the movie already exist, ignore call and continue.
 *
 *  @param  [object]    $movieObj,
 *          [string]    $folder
 *  @return [callback]  $statusResults
 *
 */
exports.addOfflineMovies = function MovieCreate(movieObj,folder,statusResults){
    // Find Genres
    translateGenreIDs(movieObj.genre_ids,function(cb){
        MovieDetail = {
            movie_id       : movieObj.id,
            movie_rating   : movieObj.vote_average,
            movie_name     : movieObj.title,
            movie_genre    : cb,
            movie_local    : true,
            movie_path     : movieObj.filename,
            movie_poster   : "https://image.tmdb.org/t/p/w185/"+movieObj.poster_path,
            movie_backdrop : "https://image.tmdb.org/t/p/w185/"+movieObj.backdrop_path,
            movie_date     : movieObj.release_date,
            movie_desc     : movieObj.overview
        }
        // create scheme
        let Movie = new MovieConst(MovieDetail);

        async.waterfall([
            function(callback) {
                // check if entry allready exists
                MovieConst.count({movie_id:movieObj.id}, function (err, count) {
                    if(err) return callback(err,null);
                    console.log("got "+count+" duplicates");
                    callback(null,count);
                });
            },
            function(count,callback) {
                // skip duplicates
                console.log("COUNTED "+count+" duplicates");
                if (count) return callback(count,null);
                // Save new movies
                Movie.save(function (err,status) {
                    if (err) {
                        callback(err,null);
                    }
                    callback(null,"Saved "+Movie.movie_name);
                });
            }
        ],
        function(results) {
            // return results
            console.log(results);
            statusResults(results);
        });
    });
}

/**
 *
 *  The TMDB-API returns integers for each movie as genres, this functions maps them to
 *  the corresponding strings
 *
 *  @param [array]      $IDs
 *  @return [callback]  $cb
 *
 */
function translateGenreIDs (IDs,cb){
    let newIds = [];
    let leng = IDs.length;
    let requests = IDs.map((item) => {
        return promise = new Promise((resolve) => {
            GenreConst.findOne({'genre_id':item},'genre_name', function(err,genre){
                // If genre exist push them to array
                if(genre){
                    newIds.indexOf(genre.genre_name) === -1 ? newIds.push(genre.genre_name) : null;
                    resolve(newIds);
                }else{
                    // If no genre exist, ask TMDB for new genres - save them
                    // to db and push them into array
                    update_controller.askforGenres(function(){
                        GenreConst.findOne({'genre_id':item},'genre_name', function(err,genre){
                            newIds.indexOf(genre.genre_name) === -1 ? newIds.push(genre.genre_name) : null;
                            resolve(newIds);
                        });
                    });
                }
            });
        });
    });
    Promise.all(requests).then( function(items) {
        cb(items[0]);
    });
}

/**
 *
 *  Save genres to DB
 *
 *  @param  [object]    $obj
 *  @return [callback]  $cb
 *
 */
exports.populateGenreList = function (obj,cb){
    obj.forEach(function(items){
        GenreDetail = {
            genre_name : items.name,
            genre_id   : items.id
        }
        let NewGenre = new GenreConst(GenreDetail);
        NewGenre.save(function (err){
            if (err) return console.log(err);
            cb(true);
        });
    });
}

/**
 *
 *  Get POST request to remove movie from filesystem and database.
 *
 *  @param  [object] POST request,
 *          [object] POST response
 *  @return [string] ok
 *
 */
exports.movie_delete =[
    // Sanitize (trim and escape) the name field.
    body('tid', 'Search term required').isDecimal().trim(),
    // Sanitize (trim and escape) the search field.
    sanitizeBody('tid').trim().escape(),
    // Process request after validation and sanitization.
    (req, res, next) => {
        const errors = validationResult(req);
        const movie = req.body.tid;
        // delete movie from DB
        removefromDB(movie,function(err,rmmovie){
            // Unlink from fs
            console.log("REMOVE DEBUG Nr.2:")
            console.log("err:"+err)
            console.log("path:"+rmmovie.path)
            try {
                update_controller.unlinkfromFS(rmmovie.path,function(err,cont){
                    res.send("ok")
                });
            }finally{
                res.send("ok");
            }
        });
    }
]


/**
 *
 *  Remove movie from Database via id.
 *
 *  @param  [string]    $id
 *  @return [callback]  $cb
 *
 */
function removefromDB(id,cb){
    MovieConst.findOneAndRemove({ 'movie_id':id },{select:'movie_name movie_path'},function(err,doc){
        if(err) return(cb(err,null));
        if(!doc) return(cb(err,null));
        movie = {
            'name':doc.movie_name,
            'path':doc.movie_path
        }
        cb(null,movie);
    });
}
