const express = require('express');
const router = express.Router();
const movie_controller = require('../controllers/movieController');

/// Movie ROUTE ///
//

//router.get('/', movie_controller.index);
//router.get('/:id(\\d+)/detail', movie_controller.movies_detail);

router.post('/delete', movie_controller.movie_delete);
/*
router.get('/local/', movie_controller.index_local);
router.get('/local/:id/detail', movie_controller.movies_local_detail);

router.get('/local/:id/update', movie_controller.movies_local_update);
router.post('/local/:id/update', movie_controller.movies_local_update);
router.get('/local/:id/remove', movie_controller.movies_local_remove);
router.post('/local/:id/remove', movie_controller.movies_local_remove);
router.get('/local/add', movie_controller.movies_local_add);
router.post('/local/add', movie_controller.movies_local_add);

router.get('/online', movie_controller.index_online);
router.get('/online/:id/detail', movie_controller.movies_local_detail);
router.get('/online/update', movie_controller.movies_online_update_get);
router.get('/online/:id/remove', movie_controller.movies_online_remove);
router.post('/online/:id/remove', movie_controller.movies_online_remove);
*/



module.exports = router;
