const config_controller = require('./configController');
const async = require('async');
const exec = require('child_process').execFile;
const request = require('request');
const AddMovie = require('./movieController');
const fs = require('fs-extra');
const path = require('path');


/**
 *
 * Search filesystem for files with extensions which reside whitelist.
 * - Depends on /sbin/find
 *
 * @params [string] $folder
 * @return [string] $cb
 *
 */
function findFiles(folder, cb){
    let whitelist = [
            ".mp4",
            ".mkv",
            ".avi",
            ".flv",
            ".ogv",
            ".wmv",
            ".ogg",
            ".mpg",
            ".mpeg",
            ".webm",
            ".vob",
        ]

    // Execute find recursive
    exec('find', [folder], function(err, out, stderr){
        // split newlines
        let files = out.replace(" "," \\").split('\n');
        // check if extension reside in whitelist
        files = files.filter(val => whitelist.includes(path.extname(val)));
        files.forEach(function(element){
            cb((element.replace(folder,'')),path.extname(element));
        });
    });
}




/**
 *
 * Normalizes filenames.
 * For example:
 *  "Ghost.In.The.Shell.2017.1080p.HC.HDRip.X264.AC3-EVO[EtHD].mp4"
 *  will be normalized to
 *  "Ghost In The Shell 2017"
 *
 * @params [string] $filename,
 * @return [string] $cb
 *
 */
function rebuildFileName(filename,cb){
    let searchcon = {};
    // Check if user added a / at the end of the movie folder
    if(filename.includes("/")){
        filenametmp = filename.split('/');
        // Get current filename without extension
        filename = filenametmp.pop(filename[filenametmp.length-1]);
    }

    // Replace specialchars in filename with whitespaces
    searchcon = filename.replace(/[\.\*+\-\?\^\$\{\}\(\)\|\_\[\]\\@]/g, " ").split(' ');

    // Get configuration
    config_controller.exportConfig( async function(err,config){

        /*
         * Split blacklist to array
         * somewhat hacky :D
         */
        let blacklist = config.blacklist.join(' ').split(' ');

        // Debug purpose

        // load blacklist config from db and use it to filter filenames
        let filteredSearch = searchcon.filter(val => !blacklist.includes(val)).join(' ');

        // Get current date
        const date = new Date();
        const CurrentYear = date.getFullYear();

        /* check if maybe a year is available
         * This try functions only purpose is to exclude certain edge cases
         * like Bladerunner 2049 which wouldn't get added.
         */
        let year ="";
        try{
            year = filename.match(/19.{2}|20.{2}/g)[0];
        }catch(err){
            year = null;
        }finally{
            // Fix for bladerunner 2049 etc.
            if(year > CurrentYear){
                year = null;
            }
            // For debugging purpose
            console.log('\x1b[31m'+filename+'\x1b[0m');
            console.log('\x1b[31m'+filteredSearch+'\x1b[0m');
            cb(filteredSearch.replace(year, " "),year);
        }
    });
}

/**
 *
 * Check TMDB if it knows about a certain movie.
 *
 * @params  [string] $moviename,
 *          [string] $year
 * @return  [object] $cb
 *
 */
function findMovieInDB(moviename,year,cb) {
    return new Promise(
        function (resolve, reject) {
            config_controller.exportConfig( async function(err,configs){
                tmdb = await require('tmdbv3').init(configs.tmdb_key);
                tmdb.search.movie(moviename, {year : year }, function(err,res) {
                    if(err) {
                        reject(cb(err,null));
                    } else if (res.total_results !== 0){
                        resolve(cb(null,res.results[0]));
                    }
                });
            });
        }
    );
}


/**
 *
 * Helper function for movieadding
 *
 * @params [string] $path
 * @return [object] $cb
 *
 */
function buildMovie(path,cb) {
    // If $path doesn't end with "/" - add it.
    path.slice(-1) !== '/' ? path += '/' : null;
    findFiles(path, function(file,ext){
        rebuildFileName(file, function (movie,year){
            findMovieInDB(movie,year,function(err,res){
                if(err) return console.error(err);
                res.filename = path+file;
                cb(res,path,ext,movie);
            });
        });
    });
};



/**
 *
 * Main function to build a complete query to add new movies.
 *
 * @params  [object] GET $req,
 *          [object] GET $res,
 *          [object] $next
 * @return  void
 *
 */
exports.buildMovieQuery = function(req,res,next){
    config_controller.exportConfig( async function(err,configs){
        buildMovie(configs.movie_folder,function(film,path){
            // console.log is for debugging
            AddMovie.addOfflineMovies(film,path,function(statusCode){});
        });
        res.redirect('/');
    });
};

/**
 *
 * Ask TMDB for the genre list and add it to DB
 *
 * @params -
 * @return [bool] $cb
 *
 */
exports.askforGenres = function(cb){
    config_controller.exportConfig( async function(err,configs){
        tmdb = await require('tmdbv3').init(configs.tmdb_key);
        request(tmdb.api_urls.genre_list, function(err,res){
            const genres = JSON.parse(res.body).genres;
            AddMovie.populateGenreList(genres,function(){
                return(cb(true));
            });
        });
    });
}


/**
 *
 * Remove file association from filesystem.
 *
 * @params [string] $filepath
 * @return [bool]   $cb
 *
*/
// TODO
// config is not defined
exports.unlinkfromFS = function(filepath,cb){
    if(filepath.split('/').length > 2){
        filepath = config.movie_folder+filepath.replace(config.movie_folder,'').split('/')[0];
    }
    fs.remove(filepath.replace(" ","\ "), function(err){
        cb(null,true);
    });
}
