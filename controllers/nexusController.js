Movie = require('../models/movies');
const async = require('async');

/**
 *
 *  Function for basic functions.
 *  - Counting movies (currently not implented)
 *  - Count movies which are not local (currently not implented)
 *  - list all movies
 *  - calculate number of sites
 *
 *  @param  [object] POST $req,
 *          [object] POST $res,
 *          [object] POST $next
 *  @return [object] render(nexus)
 *
 */
exports.index = function(req, res, next) {
    // get current site
    const site = parseInt(req.params.site);
    // get next site
    const nextSite = site + 1;
    // get prev site
    const prevSite = site - 1;

    let get_sitePos = {
        currentSite : site,
        nextSite    : nextSite,
        prevSite    : prevSite,
        lastSite    : 0
    }

    async.parallel({
        movie_count: function(callback) {
            Movie.count(callback);
        },
        movie_local_count: function(callback) {
            Movie.count({movie_local:false}, callback);
        },
        movie_list_all: function(callback) {
            // Default number for each site
            const limitErgebnisse = 8;
            // set skip rotation
            let skip = site * limitErgebnisse;
            Movie.find({}, callback).limit(limitErgebnisse).skip(skip);
        },
    }, function(err, results) {
        // Check how many sites are left
        if((results.movie_list_all.length / 6).toString().slice(0,1) !== "0"){
            get_sitePos.lastSite = results.movie_list_all.length;
        }
        res.render('nexus', { title: 'Clover', error: err, data: results, sites: get_sitePos});
    });
};

