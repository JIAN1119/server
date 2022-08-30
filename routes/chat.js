var router = require('express').Router();
const MongoClient = require('mongodb').MongoClient;


router.get('/', function (req, res) {
    res.render('chat.ejs')
    console.log('채팅 신규')
})

router.post('/', function (req, res) {

    console.log('서버 : /chat에서 POST요청 감지')
    // post요청과 함꼐 온 글번호
    var 글번호 = parseInt(req.body._id)
    console.log(글번호)

    // 1) db서 글번호와 일치하는 작성자 찾아 넣기
    req.app.db.collection('post').findOne({ _id: 글번호 }, function (err, result) {
        if (err) { return console.log(err) }
        
        console.log(result.작성자)
    })
    // 2) 로그인 여부 알아내서, 로그인중이면 유저 이름 넣고, 아니면 로그인 페이지로 이동
})






module.exports = router;