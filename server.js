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

// 서버가 환경변수를 인식하게 한다
require('dotenv').config()

var db;

{ useUnifiedTopology: true } // 워닝메세지 제거해준다

MongoClient.connect(process.env.DB_URL, function (에러, client) {
    // MongoDB 내 shop DB 접속하여 변수db에 저장한다.
    if (에러) return console.log(에러);

    db = client.db('shop')
    app.db = db
    // 8080포트에 서버 띄운다
    app.listen(process.env.PORT, function () {
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

    //======================================================
    //      2.1. 마이페이지 진입 시
    //======================================================

    // 진입 전 세션 보유여부 체크하여 보유X > 로그인/ 보유O > 마이페이지 이동시킨다
    app.get('/mypage', 로그인했니, function (req, res) {
        res.render('mypage.ejs', { user: req.user })
    })

    function 로그인했니(req, res, next) {
        if (req.user) {
            next()
        } else {
            res.redirect('/login');
        }
    }

    //======================================================
    //      1.2. 로그인 시 입력받은 정보 유효성 검증
    //======================================================
    passport.use(new LocalStrategy({
        usernameField: 'id',
        passwordField: 'pw',
        session: true,
        passReqToCallback: false,
    }, function (입력한아이디, 입력한비번, done) {
        console.log(입력한아이디, 입력한비번);
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

    //======================================================
    //      메모 검색기능
    //======================================================

    app.get('/search', function (req, res) {

        console.log(req.query.value);
        var 검색조건 = [
            {
                $search: {
                    index: 'titleSearch',
                    text: {
                        query: req.query.value,
                        path: '제목'  // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
                    }
                }
            },
            { $sort: { _id: -1 } }
        ]
        db.collection('post').aggregate(검색조건).toArray(function (err, result) {
            console.log(result)
            res.render('findlist.ejs', { list: result })
        })
    })


    //======================================================
    //      [7] 회원가입
    //======================================================

    // '/signup' 진입 시 가입페이지 보여준다
    app.get('/signup', function (req, res) {
        res.render('signup.ejs')
    })

    // 가입완료 시
    app.post('/signup', function (req, res) {

        // 아이디 중복 체크
        db.collection('login').findOne({ id: req.body.id }, function (err, result) {
            if (err) { return console.log(err) }
            // console.log(result.id)

            // 1) 중복X 아이디인 경우
            if (result == null) {
                db.collection('counter').findOne({ name: '회원수' }, function (err, result) {
                    if (err) { return console.log(err) }

                    console.log('아이디 :' + req.body.id)
                    console.log('비밀번호 :' + req.body.pw)
                    // (1) DB의 counter콜렉션의 'name'키가 게시물갯수인 요소 찾아(result), 그것의 totalPost키값을 postsSum 변수에 저장한다
                    var userSum = result.totalUser;

                    // (2) 포스트 요청 시 받은 정보ㅁ를 DB에 저장한다. 이때 DB의 번호는 (1)에서 지정한 변수를 받아 만든다  


                    db.collection('login').insertOne({ _id: (userSum + 1), id: req.body.id, pw: req.body.pw }, function (err, result) {
                        console.log('DB에 회원 정보 생성 완료')
                    })

                    // (3) 게시물 갯수 저장해둔 데이터 찾아 1 증가시키도록 한다
                    db.collection('counter').updateOne({ name: '회원수' }, { $inc: { totalUser: 1 } }, function (err, rst) {
                        if (err) { return console.log(err) }
                    })
                    res.render('signupdone.ejs')
                });
                // 2) 중복O 아이디인 경우
            } else {
                res.send('이미 있는 아이디');

            }
        })
        // 입력 데이터 DB 저장
    })

    //======================================================
    //      [6] 로그인
    //======================================================
    app.get('/login', function (req, res) {
        res.render('login.ejs')
    })

    // 로그인 성공 시 /mypage 로 이동
    app.post('/login', passport.authenticate('local', { failureRedirect: '/login-fail' }), function (req, res) {
        res.redirect('/mypage')
    });

    // 로그아웃
    app.post('/logout', function (req, res, next) {
        req.logout(function (err) {
            if (err) { return next(err); }
            res.redirect('/');
        });
    });
})

// 로그인 실패시 이동 경로
app.get('/login-fail', function (req, res) {
    console.log('로그인 실패')
    res.send('로그인 실패')
})

// ==========================================================
//      [1] 할일 작성 기능
// ==========================================================

// 글 작성 페이지 보여준다
app.get('/write', 로그인했니, function (req, res) {
    console.log(req.user.id)
    console.log(req.body)

    var writeDate = new Date()
    const year = writeDate.getFullYear();
    const month = writeDate.getMonth() + 1;
    const date = writeDate.getDate();

    writeDate = (`${year}-${month >= 10 ? month : '0' + month}-${date >= 10 ? date : '0' + date}`);
    console.log(writeDate)

    res.render('write.ejs', { userID: req.user.id, wDate: writeDate })
    console.log('/write GET 요청성공')
})


app.post('/add', function (req, res) {

    //  [1] 누군가가 /add로 post 요청을 하면, 아래 작업 수행한다

    // (0) 요청 들어오면 사용자에게 '전송완료' 텍스트 보여주고, 사용자가 입력한 정보를 받아 서버폴더 콘솔에 출력한다
    // res.send('전송완료')
    res.render('add.ejs')
    console.log('제목 :' + req.body.title)
    console.log('상세내용 :' + req.body.date)
    // console.log(req.user)


    // (1) DB의 counter콜렉션의 'name'키가 게시물갯수인 요소 찾아(result), 그것의 totalPost키값을 postsSum 변수에 저장한다
    db.collection('counter').findOne({ name: '게시물갯수' }, function (err, result) {
        var postsSum = result.totalPost;
        // (2) 포스트 요청 시 받은 정보를 DB에 저장한다. 이때 DB의 번호는 (1)에서 지정한 변수를 받아 만든다           
        db.collection('post').insertOne({ _id: (postsSum + 1), 제목: req.body.title, 날짜: req.body.date, 작성자: req.user.id, 작성자ID: req.user._id, 작성일: req.body.writeDate }, function (err, result) {
            console.log('db저장완료')
        })

        // (3) 게시물 갯수 저장해둔 데이터 찾아 1 증가시키도록 한다
        db.collection('counter').updateOne({ name: '게시물갯수' }, { $inc: { totalPost: 1 } }, function (err, rst) {
            if (err) { return console.log(err) }
        })
    });
})

// ==========================================================
//      [3] 작성한 글 삭제
// ==========================================================

app.delete('/delete', function (req, res) {
    // res.send('삭제완료')
    console.log(req.body);
    console.log(req.user);
    res.status(200).send('요청성공')

    req.body._id = parseInt(req.body._id) // 문자형을 숫자(정수)형으로 변환
    // DB서 데이터 삭제
    db.collection('post').deleteOne({ _id: req.body._id, 작성자: req.user._id }, function (err, result) {
        console.log('삭제완료')
    })
})


// ==========================================================
//      [2] 할일 목록 보기
// ==========================================================

app.get('/list', function (req, res) {
    //  누군가가 /list로 get요청하면, db저장 내용을 콘솔에 출력하고, 응답으로 list.ejs를 렌더해 보여준다.
    db.collection('post').find().sort({ "_id": -1 }).toArray(function (err, result) {
        // console.log(result)
        console.log(req.body)
        res.render('list.ejs', { posts: result })
    })
})

// ==========================================================
//      [4] 목록 상세 내용 보기
// ==========================================================

app.get('/detail/:id', function (req, res) {

    // url하위경로와 같은 id값을 가진 데이터를 DB에서 찾아, 그 데이터를 detil.ejs에 바인딩하여 렌더해준다
    db.collection('post').findOne({ _id: parseInt(req.params.id) }, function (err, result) {
        console.log(result);
        res.render('detail.ejs', { data: result })

        if (err) { return console.log(err) }
    })
})

// ==========================================================
//      [5] 작성한 글 수정하기
// ==========================================================
// postId : 게시물 정보 postId.작성자 = 작성자 정보
var postId;
app.get('/edit/:id', function (req, res) {
    postId = { _id: parseInt(req.params.id) }
    console.log(postId)

    db.collection('post').findOne(postId, function (err, result) {
        res.render('edit.ejs', { data: result })
        if (err) { return console.log(err) }
    })
})

// function 로그인했니(req, res, next) {
//     // 로그인 중인경우
//     if (req.user) {
//         // 작성자 != 로그인유저 : 메세지 (유저만 수정 가능)
//         if(1==1){

//             res.send('작성자만 수정가능')
//             // 작성자 == 로그인유저 : /다음 단계 진행
//         } else {
//             next()

//         }
//         // 로그인 X : 로그인페이지로
//     } else {
//         res.redirect('/login');
//     }
// }

app.put('/edit', function (req, res) {
    db.collection('post').updateOne({ _id: parseInt(req.body.id), 작성자: req.user.id }, { $set: { 제목: req.body.title, 날짜: req.body.date } }, function (err, result) {
        console.log('수정완료')
        res.redirect('/list')

    })
})


// ==========================================================
//      이미지 서버 만들기
// ==========================================================

// multer라이브러리 사용 환경 설정

// 1) multer라이브러리 가져와 변수에 저장한다
let multer = require('multer');

// 1. 파일 업로드시 세부 설정
// 1.1. diskStorage : 하드에 저장한다 (비휘발성)
var storage = multer.diskStorage({
    // 1.2. 저장 위치 설정
    destination: function (req, file, cb) {
        cb(null, './public/image')
    },
    // 1.2. 저장 시 이름 설정
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});

var upload = multer({ storage: storage });

app.get('/upload', function (req, res) {
    res.render('upload.ejs')
})

app.post('/upload', upload.single('photo'), function (req, res) {
    res.send('업로드완료')
})

// 특정경로로 진입 시 이미지 파일 보내준다
app.get('/image/:imageName', function (req, res) {
    res.sendFile(__dirname + "/public/image/" + req.params.imageName)
})

// ==========================================================
//      채팅
// ==========================================================

app.get('/chat', 로그인했니, function (req, res) {
    // DB에서 해당 유저 들어간 데이터 뽑아 ejs에 꽂아주기
    db.collection('chat').find({ member: req.user._id }).toArray()
        .then((result) => {
            res.render('chat.ejs', { data: result })
        })
        .catch((err) => { return console.log(err) })
    console.log('채팅 신규')
})

app.post('/chat', 로그인했니, function (req, res) {

    // [[3]]
    // 2) 로그인중이면 유저 이름 넣고, 아니면 로그인 페이지로 이동
    console.log('서버 : /chat에서 POST요청 감지')
    var 글번호 = parseInt(req.body._id)
    console.log(글번호)

    db.collection('post').findOne({ _id: 글번호 }, function (err, result) {
        if (err) { return console.log(err) }
        // 채팅 버튼 누르면 포스트요청 옴. 채팅 버튼 달린 게시물의 작성자 찾기
        var 작성자2 = result.작성자ID
        var date = new Date()
        var saveData = {
            member: [req.user._id, 작성자2],
            채팅방이름: '채팅방',
            생성일: date
        }

        db.collection('chat').insertOne(saveData).then((result) => {
            res.send('sd')
            console.log('채팅방생성완료')
        })
    })
})

const { ObjectId } = require('mongodb');

app.post('/message', function (req, res) {
    console.log('채팅메세지 신규')
    console.log(req.body)
    var chatMsg = {
        parent: req.body.parent,
        userid: req.user._id,
        content: req.body.content,
        date: new Date()
    }

    db.collection('message').insertOne(chatMsg)
        .then((result) => {
            console.log('채팅메세지 DB저장완료' + result)
            res.send('DB저장성공')
        })
        .catch((err) => { return console.log(err) })
})

app.get('/message/:id', 로그인했니, function (req, res) {
    // [1] 클라이언트에서 요청 없어도 데이터 보내줌
    res.writeHead(200, {
        "Connection": "keep-alive",
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
    });

    db.collection('message').find({ parent: req.params.id }).toArray()
        .then((result) => {
            console.log(result)
            res.write('event: test\n');
            res.write('data: ' + JSON.stringify(result) + '\n\n');
        })

        // [2] DB변동사항 있을 때 감지해 특정 동작 수행토록한다
        const pipeline = [
            // 콜렉션 내 key가 parent인 것만 감지
            { $match: { 'fullDocument.parent' : req.params.id } }
        ];
        // const collection = db.collection('message');
        const changeStream = db.collection('message').watch(pipeline);
        
        changeStream.on('change', (result) => {
            console.log('DB변경사항감지');
            var 추가된문서 =[result.fullDocument]
            console.log(추가된문서);

            res.write('event: test\n');
            res.write(`data: ${JSON.stringify(추가된문서)}\n\n`);
        });
})


// 2) 로그인 여부 알아내서, 로그인중이면 유저 이름 넣고, 아니면 로그인 페이지로 이동
function 로그인했니(req, res, next) {
    // 1)로그인중이라면 >> [[3]]
    if (req.user) {
        next()
        // 1)로그인중 X
    } else {
        res.redirect('/login')
    }
}



// ==========================================================
// 세션 데이터를 브라우져에서 확인하기 위해 GET /debug 엔드포인트
// ==========================================================

app.get("/debug", (req, res) => {
    res.json({
        "req.session": req.session, // 세션 데이터
        "req.user": req.user, // 유저 데이터(뒷 부분에서 설명)
        "req._passport": req._passport, // 패스포트 데이터(뒷 부분에서 설명)
    })
})

// ==========================================================
//      라우팅
// ==========================================================
app.use('/shop', require('./routes/shop.js'))
app.use('/board/sub', require('./routes/board.js'))
app.use('/test', require('./routes/test.js'))
