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
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

app.use(session({ secret: '비밀코드', resave: true, saveUninitialized: false }));
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
    //      [1] 홈페이지
    // ==========================================================

    // 유저가 해당 url 초기 진입 시 보여줄 화면
    app.get('/', function (req, res) {
        res.render('index.ejs')
        console.log('요청성공')
    })


    // ==========================================================
    //      [1] 할일 작성 기능
    // ==========================================================

    // 글 작성 페이지 보여준다
    app.get('/write', function (req, res) {
        res.render('write.ejs')
        console.log('요청성공')
    })

    // 글 작성 완료 시 동작 : 1) 서버 측 DB저장, 2) 사용자 측 리스트에 추가
    app.post('/add', function (req, res) {

        //  [1] 누군가가 /add로 post 요청을 하면, 아래 작업 수행한다

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
    //      [2] 할일 목록 보기
    // ==========================================================

    app.get('/list', function (req, res) {
        //  누군가가 /list로 get요청하면, db저장 내용을 콘솔에 출력하고, 응답으로 list.ejs를 렌더해 보여준다.
        db.collection('post').find().toArray(function (err, result) {
            console.log(result)
            res.render('list.ejs', { posts: result })
        })
    })


    // ==========================================================
    //      [4] 목록 상세 내용 보기
    // ==========================================================

    app.get('/detail/:id', function (req, res) {
        // ---------------------------------------------------------
        // 누군가 /detail로 get요청 보내면, DB의 데이터를 꽂아 보내준다
        // url하위경로와 같은 id값을 가진 데이터를 DB에서 찾아, 그 데이터를 detil.ejs에 바인딩하여 출력한다
        // ---------------------------------------------------------

        db.collection('post').findOne({ _id: parseInt(req.params.id) }, function (err, result) {
            res.render('detail.ejs', { data: result })
            console.log(result);
            if (err) { return console.log(err) }
        })
    })

    // ==========================================================
    //      [3] 작성한 글 삭제
    // ==========================================================

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

    // ==========================================================
    //      [5] 작성한 글 수정하기
    // ==========================================================

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

    //======================================================
    //      [7] 회원가입
    //======================================================

    // 가입페이지 라우팅
    app.get('/signup', function (req, res) {
        res.render('signup.ejs')
    })

    // 가입완료 시
    app.post('/signup', function (req, res) {
        res.render('signupdone.ejs')

        db.collection('counter').findOne({ name: '회원수' }, function (err, result) {
            if (err) { return console.log(err) }

            console.log('아이디 :' + req.body.id)
            console.log('비밀번호 :' + req.body.pw)
            // (1) DB의 counter콜렉션의 'name'키가 게시물갯수인 요소 찾아(result), 그것의 totalPost키값을 postsSum 변수에 저장한다
            var userSum = result.totalUser;

            // (2) 포스트 요청 시 받은 정보를 DB에 저장한다. 이때 DB의 번호는 (1)에서 지정한 변수를 받아 만든다           
            db.collection('login').insertOne({ _id: (userSum + 1), id: req.body.id, pw: req.body.pw }, function (err, result) {
                console.log('DB에 회원 정보 생성 완료')
            })

            // (3) 게시물 갯수 저장해둔 데이터 찾아 1 증가시키도록 한다
            db.collection('counter').updateOne({ name: '회원수' }, { $inc: { totalUser: 1 } }, function (err, rst) {
                if (err) { return console.log(err) }
            })
        });
    })
    /*회원가입하면 과정
    DB내 counter의 회원수 가져와서 변수저장 2 login 콜렉션에 no, id, pw 저장 3 counter 1 증가*/


    //======================================================
    //      [6] 로그인
    //======================================================
    app.get('/login', function (req, res) {
        res.render('login.ejs')
    })
    app.post('/login', passport.authenticate('local', { failureRedirect: '/fail' }), function (req, res) {
        res.redirect('/')
    });

    //======================================================
    //      2.1. 마이페이지 진입 시
    //======================================================
    app.get('/mypage', 로그인했니, function (req, res) {
        res.render('mypage.ejs', { user: req.user })
    })

    function 로그인했니(req, res, next) {
        if (req.user) {
            next()
        } else {
            res.send('로그인해주세요')
        }
    }

    //======================================================
    //      1.2. 로그인시 입력받은 정보 유효성 검증
    //======================================================
    passport.use(new LocalStrategy({
        usernameField: 'id',
        passwordField: 'pw',
        session: true,
        passReqToCallback: false,
    }, function (입력한아이디, 입력한비번, done) {
        //console.log(입력한아이디, 입력한비번);
        db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
            if (에러) return done(에러)

            if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
            if (입력한비번 == 결과.pw) {
                return done(null, 결과)
            } else {
                return done(null, false, { message: '비번틀렸어요' })
            }
        })
    }));
    //======================================================
    //      유저에게 세선 발급해준다 (유저의 브라우저 쿠키에 저장됨)
    //======================================================
    passport.serializeUser(function (user, done) {
        done(null, user.id)
    });
    // 세션정보 바탕으로 DB에서 대응하는 데이터 찾아준다
    passport.deserializeUser(function (아이디, done) {
        db.collection('login').findOne({ id: 아이디 }, function (에러, 결과) {
            done(null, 결과)
        })
    });




});
