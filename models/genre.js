const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 *
 * Setup fro DB GenreSchema
 *
 */
const GenreSchema = new Schema(
    {
        genre_name : { type : String, required : false, max : 50},
        genre_id   : { type : Number, required : false, max : 100000},
    }
);

// Export
module.exports = mongoose.model('Genre', GenreSchema);
