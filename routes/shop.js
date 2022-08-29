var router = require('express').Router();

router.get('/shirts', function(req, res){
    res.send('셔츠');
})

router.get('/pants', function(req, res){
    res.send('바지');
})

module.exports = router;