const Transmission = require('transmission');
const Pirate = require('./pirateController');
const config_controller = require('./configController');
const async = require('async');
const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
// prepare configuration
var config;
config_controller.exportConfig(function(err,configx){
    config = configx;
});


/**
 *
 * Add torrent to Transmission for downloading
 *
 * @params [object] req$
 * @return void
 *
 */
exports.downloadTorrent = function (req){
    config_controller.exportConfig(function(err,configs){
        transmission = new Transmission({
            host         : configs.transmission_host,
            download_dir : configs.transmission_folder
        });
        Pirate.searchIDTorrent(req.body.tid,function(err,res){
            if(err) return console.error(err);
            // Add Magneturl to transmission
            transmission.addUrl(res,function(err,result){
            console.log(err);
                console.log(result);
            });
        });
    });
}

/**
 *
 * Helper function the stop, start and cancel torrent
 *
 *  @params [object] POST $req,
 *          [object] POST $res,
 *          [object] POST $next
 *  @return [string] $state
 *
 *
 */
exports.changeTorrentState = [
    // Sanitize (trim and escape)
    body('torrentID').isDecimal().trim(),
    body('state').trim(),
    // Sanitize (trim and escape)
    sanitizeBody('torrentID').trim().escape(),
    // Process request after validation and sanitization.
    (req, res, next) => {
        let state = req.body.state;
        let id = req.body.torrentID;
        // object to hold functions
        changeState = {
            pause: function(id){
                transmission.stop(id, function(err,arg){});
                console.log("Stopped: "+id);
            },
            play: function(id){
                transmission.start(id, function(err,arg){});
                console.log("Started: "+id);
            },
            remove: function(id){
                console.log("Removed: "+id)
                transmission.remove(id,function(err){});
            }
        }

        // use object to change state via ID
        changeState[state](id);
        res.send(state);
    }
]

/**
 *
 * Get progression of currently active downloads
 *
 * @params  [object] GET $req,
 *          [object] GET $res,
 *          [object] $next
 * @return  [object] $torrents
 *
 *
 */
exports.percentTorrent =  [
    (req, res, next) => {
        let torrents = [];
        transmission = new Transmission({
            host : config.transmission_host,
        });

        transmission.get(req.params.id,function(err,torrentStatus){
            if (!torrentStatus.torrents || err) {
                return;
            }
            // Create object for each active torrent
            async.forEach(torrentStatus.torrents,function(obj,callback){
                getState(obj.status,function(state){
                    torrents.push( {
                        id     : obj.id,
                        left   : Math.floor(obj.eta/60) + "min",
                        down   : obj.percentDone*100,
                        Dspeed : Math.floor(obj.rateDownload/1024),
                        Uspeed : Math.floor(obj.rateUpload/1024),
                        peers  : obj.peersConnected,
                        tstate : state,
                    });

                    callback(torrents);
                })
            },function(torrents){
                res.send(torrents);
            });
        });
    }

]

/**
 *
 * Check if torrent is paused or active
 *
 * @params  [object] $req,
 *          [object] $res
 * @return  [object] $torrents
 *
 *
 */
exports.statusTorrent = function(req,res){
    let torrents = [];
        transmission = new Transmission({
            host         : config.transmission_host,
            download_dir : config.torrent_folder,
        });

        transmission.get(function(err,torrentStatus){
            // ignore this q_q
            if(torrentStatus !== undefined || torrentStatus[0] !== undefined || torrentStatus.torrents[0] !== undefined){
                async.forEach(torrentStatus.torrents,function(obj,callback){
                    getState(obj.status,function(state){
                        console.log(obj);
                        torrents.push( {
                            id     : obj.hashString,
                            realid : obj.id,
                            name   : obj.name,
                            left   : Math.floor(obj.eta/60)+ "min",
                            down   : Math.floor(obj.percentDone*100),
                            Dspeed : Math.floor(obj.rateDownload/1024),
                            Uspeed : Math.floor(obj.rateUpload/1024),
                            peers  : obj.peersConnected,
                            tstate : state,
                        });
                        callback();
                    })
                },function(err){
                    res.send(torrents);
                });
            }
        });
}

/**
 *
 * Map state id to state description
 *
 * @params [int] status
 * @return [string] $cb
 *
 *
 */
function getState(status,cb){
    switch(status) {
        case 0:
            cb("STOPPED");
            break;
        case 1:
            cb("CHECK_WAIT");
            break;
        case 2:
            cb("CHECK");
            break;
        case 3:
            cb("DOWNLOAD_WAIT");
            break;
        case 4:
            cb("DOWNLOAD");
            break;
        case 5:
            cb("SEED_WAIT");
            break;
        case 6:
            cb("SEED")
            break;
        case 7:
            cb("ISOLATED");
            break;
        default:
            cb("DONE");
            break;
    }
}
