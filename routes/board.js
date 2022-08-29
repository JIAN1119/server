var router = require('express').Router();

router.use('/sports', 로그인했니);

function 로그인했니(req, res, next) {
    if (req.user) {
        next()
    } else {
        res.redirect('/login');
    }
}

router.get('/sports', function(req, res){
    res.send('스포츠')
})

router.get('/game', function(req, res){
    res.send('게임게시판')
})


module.exports = router;