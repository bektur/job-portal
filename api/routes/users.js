const express = require('express');
const router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {    
  res.json({status: '1', msg: 'respond with a resource'});
});



module.exports = router;
