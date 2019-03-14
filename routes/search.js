const express = require('express');
const router = express.Router();

const search_controller = require('../controllers/searchController');

/// Search ROUTE ///
//

// Redirect
router.get('/', function(req,res){
    res.redirect('/');
});

router.post('/', search_controller.search_post);


module.exports = router;
