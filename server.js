const express = require('express');
const app = express();

// express 라이브러리에서 bodyParser 가져온다
app.use(express.urlencoded({ extended: true }))

// bodyParser 사용할 수 있도록 설정한다
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: true }))

// MongoDB 세팅
// 1) 설치한 라이브러리를 이 파일에서 사용하도록 한다
const MongoClient = require('mongodb').MongoClient;


app.set('view engine', 'ejs'); // ejs 엔진 사용하도록 처리 (서버에서 HTML 바인딩 가능하게 함)

// 2) MongoDB의 아래 계정의 DB로으로 접속한다.

var db;

{ useUnifiedTopology: true } // 워닝메세지 제거해준다

MongoClient.connect('mongodb+srv://JIAN:Mg1234321!@cluster0.agvttyu.mongodb.net/?retryWrites=true&w=majority', function (에러, client) {
    if (에러) return console.log(에러);
    db = client.db('shop') // MongoDB 내 shop DB 접속하여 변수db에 저장한다.

    db.collection('post').insertOne({ 이름: '루이', _id: 100 }, function (err, result) {
        console.log('저장완료')
    });

    // 8080포트에 서버 띄우는 코드
    app.listen('8080', function () {
        console.log('listening on 8080')
    });

    app.post('/add', function (req, res) {

        res.send('전송완료')
        console.log(req.body.date)
        console.log(req.body.title)

        db.collection('post').insertOne({ 제목: req.body.title, 날짜: req.body.date }, function (err, result) {
            console.log('db저장완료')
        });
    })




    // 누군가 8080의 특정경로 요청 보내면 처리해주는 코드
    app.get('/', function (req, res) {
        res.sendFile(__dirname + '/index.html')
    })

    app.get('/pet', function (req, res) {
        res.send('펫페이지입니다')
    })

    app.get('/write', function (req, res) {
        res.sendFile(__dirname + '/write.html')
    })

});