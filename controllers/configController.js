const ConfigConst = require('../models/config');
const async = require('async');
const { sanitizeBody } = require('express-validator/filter');

/**
 *
 *  Update Config table via POST request.
 *
 *  @param  [object] $req,
 *          [object] $res
 *  @return redirection
 *
 */
exports.updateConfig = [
    // Sanitize EVERYTHING!
    sanitizeBody('movie_folder').trim(),
    sanitizeBody('torrent_folder').trim(),
    sanitizeBody('transmission_host').trim().escape(),
    sanitizeBody('tmdb_key').trim().escape(),
    (req, res) => {
        let params = req.body;
        let updateConfigSchema = {
            transmission_host : params.transmission_host,
            tmdb_key          : params.tmdb_key,
            movie_folder      : params.movie_folder,
            torrent_folder    : params.torrent_folder
        }
        ConfigConst.findOneAndUpdate({}, updateConfigSchema, {new:true}, function(err, doc){
            console.log(err);
            if (err) return res.send(500, { error: err });
        });
        res.redirect('/config');
    }
]

/**
 *
 *  Get configuration items for /config overview.
 *
 *  @param  [object] request GET,
 *          [object] response GET
 *  @return [object] $configs
 *
 *
 */
exports.getConfig = function (req, res) {
        ConfigConst.find({}, function(err, finds) {
            if(err) return res.send(err);
            let config_items = finds[0];
            let configs = {
                moviefolder   : config_items.movie_folder,
                transmission  : config_items.transmission_host,
                torrentfolder : config_items.torrent_folder,
                tmdb          : config_items.tmdb_key,
                blacklist     : config_items.blacklist
            }
            res.render('config', {title: 'Config', data:configs});
    });
}

/**
 *
 *  Export configuration serverside for handling.
 *  If no configuration exists, create default values.
 *
 *  @param [string] $configs
 *  @return [object] $result
 *
 */
exports.exportConfig = function(configs) {
    async.waterfall( [
        // Count existing entries
        function(callback) {
            ConfigConst.count(function(err,count) {
                if(!err && count === 0){
                    callback(null, 'new');
                }else{
                    callback(null, 'found');
                }

            });
        },
        // If the first call doesn't return any entries, create default entries
        function(arg1, callback){
            if(arg1 === 'new'){
                createDefaultValues(function(err,count){
                    if(err) console.error('Created default values ERROR');
                    callback(null,'ok');
                });
            }else{
                callback(null,'ok');

            }
        },
        function(arg1,callback){
            ConfigConst.find({},function(err,finds){
                if(!err){
                    callback(null,finds);
                }
            });
        }
    ],async function(err, result){
        // Return all items
        await configs(err,result[0]);
    });
}

/**
 *
 *  Create default values if none are existing yet.
 *
 *  @param none
 *  @return [object](callback) $cb
 *
 */
function createDefaultValues(cb){

    // default blacklist
    const defblacklist          = ["1080p","720p","6CH","BluRay","ShAaNiG","AC3","mkv","mp4","ETRG","tomcat12","CH","x264","PHOBOS","AAC","BDRip","HDWinG","DTS","4Audio","EtHD","YIFY","X264","avi"];
    // default tranmission_host
    const deftrans              = "transmission";
    // default movie_folder
    const movie                 = "/media/";
    // default torrent_folder
    const torrent                 = "/downloads/complete/";
    // default tmdb_key
    const api                   = "000000"

    // Create basic Scheme
    let defaultSchema = {
        transmission_host : deftrans,
        tmdb_key          : api,
        movie_folder      : movie,
        torrent_folder    : torrent,
        blacklist         : defblacklist
    }
    let defaultConfig = new ConfigConst(defaultSchema);

    // save new scheme
    defaultConfig.save(function(err){
        if(err) cb(err,null);
        console.log('created default config');
        cb(null,true);
    });
}

/**
 *
 *  Search for $string in db and remove it (See "Filter bad words" in /config)
 *
 *  @param  [object] POST $request,
 *          [object] POST $response
 *  @return [string] ok
 *
 */
exports.tag_delete = [
    // Sanitize (trim and escape) the search field.
    sanitizeBody('dtag').trim().escape(),
    (req, res, next) => {
        ConfigConst.findOneAndUpdate({},{ $pull: {"blacklist":req.body.dtag}}, {new:true},function(err, finds){
            if(err) return res.send('err')
            res.send('ok')
        });
    }
]

/**
 *
 *  Add tag to existing document for blacklisting filenames (See "Filter bad
 *  words in /config)
 *
 *  @param  [object] POST $request,
 *          [object] POST $response
 *  @return [string] ok
 *
 */
exports.tag_add = [
    // Sanitize (trim and escape) the search field.
    sanitizeBody('tag').trim().escape(),
    (req, res, next) => {
        ConfigConst.findOneAndUpdate({},{ $push: {"blacklist":req.body.tag}},{new:true,upsert:true},function(err, finds){
            if(err) return res.send('err')
            res.send('ok')
        });
    }

]
