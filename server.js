const express = require('express');
const app = express();

// express 라이브러리에서 bodyParser 가져온다
app.use(express.urlencoded({ extended: true }))

// server가 public 폴더 사용하게 한다
app.use('/public', express.static('public'))

// bodyParser 사용할 수 있도록 설정한다
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: true }))

// MongoDB 세팅
// 1) 설치한 라이브러리를 이 파일에서 사용하도록 한다
const MongoClient = require('mongodb').MongoClient;

// ejs 엔진 사용하도록 처리 (서버에서 HTML 바인딩 가능하게 함)
app.set('view engine', 'ejs');

// method-override 가져와서 server가 사용하도록 설정한다 (html에서 PUT, DELETE 요청 할 수 있게함)
const methodOverride = require('method-override')
app.use(methodOverride('_method'))

const passport = require('passport');
const LocalStrategy = require('passport-local');
const session = require('express-session');

app.use(session({secret: '비밀코드', resave : true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());
// 2) MongoDB의 아래 계정의 DB로으로 접속한다.

var db;

{ useUnifiedTopology: true } // 워닝메세지 제거해준다

MongoClient.connect('mongodb+srv://JIAN:Mg1234321!@cluster0.agvttyu.mongodb.net/?retryWrites=true&w=majority', function (에러, client) {
    // MongoDB 내 shop DB 접속하여 변수db에 저장한다.
    if (에러) return console.log(에러);

    db = client.db('shop')

    // 8080포트에 서버 띄운다
    app.listen('8080', function () {
        console.log('listening on 8080')
    });
    // ==========================================================
    //      [1] 누군가가 /add로 post 요청을 하면, 아래 작업 수행한다
    // ==========================================================
    app.post('/add', function (req, res) {

        // (0) 요청 들어오면 사용자에게 '전송완료' 텍스트 보여주고, 사용자가 입력한 정보를 받아 서버폴더 콘솔에 출력한다
        // res.send('전송완료')
        res.render('add.ejs')
        console.log('제목 :' + req.body.title)
        console.log('상세내용 :' + req.body.date)
        // (1) DB의 counter콜렉션의 'name'키가 게시물갯수인 요소 찾아(result), 그것의 totalPost키값을 postsSum 변수에 저장한다
        db.collection('counter').findOne({ name: '게시물갯수' }, function (err, result) {
            var postsSum = result.totalPost;

            // (2) 포스트 요청 시 받은 정보를 DB에 저장한다. 이때 DB의 번호는 (1)에서 지정한 변수를 받아 만든다           
            db.collection('post').insertOne({ _id: (postsSum + 1), 제목: req.body.title, 날짜: req.body.date }, function (err, result) {
                console.log('db저장완료')
            })

            // (3) 게시물 갯수 저장해둔 데이터 찾아 1 증가시키도록 한다
            db.collection('counter').updateOne({ name: '게시물갯수' }, { $inc: { totalPost: 1 } }, function (err, rst) {
                if (err) { return console.log(err) }
            })
        });
    })

    // ==========================================================
    //      [2] 누군가가 /list로 get요청하면, db저장 내용을 콘솔에 출력하고, 응답으로 list.ejs를 렌더해 보여준다.
    // ==========================================================
    app.get('/list', function (req, res) {
        db.collection('post').find().toArray(function (err, result) {
            console.log(result)
            res.render('list.ejs', { posts: result })
        })
    })

    app.delete('/delete', function (req, res) {
        // res.send('삭제완료')
        console.log(req.body);
        res.status(200).send('요청성공')

        req.body._id = parseInt(req.body._id) // 문자형을 숫자(정수)형으로 변환
        // DB서 데이터 삭제
        db.collection('post').deleteOne(req.body, function (err, result) {
            console.log('삭제완료')
        })
    })

    // =========================================================================
    // 누군가 /detail로 get요청 보내면, DB의 데이터를 꽂아 보내준다
    // url하위경로와 같은 id값을 가진 데이터를 DB에서 찾아, 그 데이터를 detil.ejs에 바인딩하여 출력한다
    // =========================================================================
    app.get('/detail/:id', function (req, res) {

        db.collection('post').findOne({ _id: parseInt(req.params.id) }, function (err, result) {
            res.render('detail.ejs', { data: result })
            console.log(result);
            if (err) { return console.log(err) }
        })
    })

    app.get('/edit/:id', function (req, res) {
        db.collection('post').findOne({ _id: parseInt(req.params.id) }, function (err, result) {
            res.render('edit.ejs', { data: result })
            console.log(result)
            console.log('/edit GET요청 처리 완료')
            if (err) { return console.log(err) }
        })
    })

    app.put('/edit', function (req, res) {
        db.collection('post').updateOne({ _id: parseInt(req.body.id) }, { $set: { 제목: req.body.title, 날짜: req.body.date } }, function (err, result) {
            console.log('수정완료')
            res.redirect('/list')
            
        })
    })

    app.get('/', function (req, res) {
        res.render('index.ejs')
        console.log('요청성공')
    })

    app.get('/write', function (req, res) {
        res.render('write.ejs')
        console.log('요청성공')
    })

    app.get('/pet', function (req, res) {
        res.send('펫페이지입니다')
    })



});

