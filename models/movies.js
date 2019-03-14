const mongoose = require('mongoose');
const Schema = mongoose.Schema;



/**
 *
 * Setup for DB MovieSchema
 *
 *
 */
const MovieSchema = new Schema(
    {
        movie_rateing:   { type:  Number, required:   false, max:     10},
        movie_id :       { type:  Number, required:   false, max:     1000000},
        movie_name:      { type:  String, required:   true, max:      25},
        movie_genre:     { type:  String, required:   true, max:      15},
        movie_local:     { type:  Boolean,required:   true, default:  false},
        movie_path:      { type:  String, required:   false, max:     100},
        movie_poster:    { type:  String, required:   false, max:     100},
        movie_backdrop:  { type:  String, required:   false, max:     100},
        movie_date:      { type:  String, required:   false, max:     30},
        movie_desc:      { type:  String, required:   false, max:     250}
    }
);

// Export
module.exports = mongoose.model('Movie', MovieSchema);
