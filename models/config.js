const mongoose = require('mongoose');
const Schema = mongoose.Schema;



/**
 *
 * Setup for DB ConfigSchema
 *
 */
const ConfigSchema = new Schema(
    {
        transmission_host : { type : String, required : false, max : 150},
        tmdb_key          : { type : String, required : false, max : 50},
        blacklist         : [{type : Array, required  : false}],
        movie_folder      : { type : String, required : false, max : 150},
        torrent_folder    : { type : String, required : false, max : 150}
    }
);

// Export
module.exports = mongoose.model('config', ConfigSchema);
