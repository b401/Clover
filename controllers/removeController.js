const mongoose = require('mongoose');
const MovieConst = mongoose.model('Movie');
const GenreConst = mongoose.model('Genre');

/**
 *
 *  Purge DB
 *  Only used for debug purpose.
 *
 *  @params -
 *  @return void
 *
 */
exports.removeOfflineMovies = function(id) {
        MovieConst.remove({}, function(callback){
              console.log("Removed all")
        });
        GenreConst.remove({}, function(callback){
            console.log("Removed all");
        })
}



