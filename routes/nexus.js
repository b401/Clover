const express = require('express');
const router = express.Router();

const nexus_controller = require('../controllers/nexusController');
const update_controller = require('../controllers/updateController.js');
const config_controller = require('../controllers/configController.js');
const remove_controller = require('../controllers/removeController.js');
const stream_controller = require('../controllers/streamController.js');
const torrent_controller = require('../controllers/torrentController.js');

/// FILM ROUTE ///
//

router.get('/', function(req,res,next){
    res.redirect('/0');
});

router.get('/:site(\\d+)/', nexus_controller.index);
router.get('/stream/:id(\\d+)/', stream_controller.streamOfflineMovie);
router.post('/torrent', torrent_controller.downloadTorrent);
router.post('/torrent/change', torrent_controller.changeTorrentState);
router.get('/torrent/status', torrent_controller.statusTorrent);
router.get('/torrent/percent/:id([0-9a-fA-F]{40}$)', torrent_controller.percentTorrent);
//
 // TODO
 //  REMOVE
router.get('/genres', update_controller.askforGenres);

router.get('/config', config_controller.getConfig);
router.post('/config', config_controller.updateConfig);
router.post('/dtag', config_controller.tag_delete);
router.post('/atag', config_controller.tag_add);

 // TODO
 //  REMOVE
router.get('/update', update_controller.buildMovieQuery);
 // TODO
 //  REMOVE
router.get('/remove', remove_controller.removeOfflineMovies);


module.exports = router;
