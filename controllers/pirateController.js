const PirateBay = require('thepiratebay');
const async = require('async');

/**
 *
 *  Call Piratebay and ask for torrents.
 *
 *  @params [string] $movie
 *  @return [object] $cb
 *
 */
exports.searchTorrent = async function search(movie,cb) {
        let searchresults = await PirateBay.search(movie, {
            // search for videos
            category: 'video',
            page: 0,
            // get only verified torrents
            filter: {
                verified: true
            },
            orderBy: 'seeds',
            sortBy: 'desc'
        })
        .catch((error) => {
            assert.isNotOk(error, 'Promise error');
        });
        // If there weren't any results return nothing.
        if(searchresults.length === 0){
            console.log("Piratebay offline?");
        }
        cb(searchresults);
    }

/**
 *
 *  Search Piratebay for specific torrent.
 *
 *  @params [string] $id
 *  @return [object] $db
 *
 */
exports.searchIDTorrent = function(id,cb){
    PirateBay
        .getTorrent(id)
        .then(results => cb(null,results.magnetLink))
        .catch((error) =>{
            console.log(error);
        })
}
