const Movie = require('../models/movies');
const Pirate = require('./pirateController.js');
const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');


// Search Moviename
/**
 *
 * Search for movies in DB.
 * If the movie doesn't exists, ask Piratebay for it.
 *
 * @params  [object] $req,
 *          [object] $res,
 *          [object] $next
 * @return  [object] $doc
 *
 */
exports.search_post = [
    // Validate that the search field is not empty.
    body('search', 'Search term required').isLength({ min: 1 }).trim(),
    // Sanitize (trim and escape) the search field.
    sanitizeBody('search').trim().escape(),
    // Process request after validation and sanitization.
    (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);
        let search = req.body.search;
        console.log("SEARCH: "+search);
        // redirect if show all
        if(search === "*"){
            res.redirect("/");
        }
        // Use regex to ignore lower case
        Movie.find({movie_name: new RegExp(search, "i")},function (err,doc){
            if(err) console.log(err);
            // If no movies were found, ask piratebay
            if(! doc.length > 0 ){
                Pirate.searchTorrent(search,function(found){
                    res.render('torrent', {data:found});
                });
            }else{
                res.render('search', {data:doc});
            }
        });
    }
]
