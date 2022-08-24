const express = require('express');
const app = express();

// express 라이브러리에서 bodyParser 가져온다
app.use(express.urlencoded({extended: true}))

// bodyParser 사용할 수 있도록 설정한다
const bodyParser= require('body-parser')
app.use(bodyParser.urlencoded({extended: true}))

// MongoDB 세팅
const MongoClient = require('mongodb').MongoClient;

MongoClient.connect('mongodb+srv://JIAN:Mg1234321!@cluster0.agvttyu.mongodb.net/?retryWrites=true&w=majority', function(에러, client){
    if (에러) return console.log(에러);
    //서버띄우는 코드 여기로 옮기기
    app.listen('8080', function(){
      console.log('listening on 8080')
    });
  })

// 8080포트에 서버 오픈한다
// app.listen(8080, function() {
//     console.log('listening8080')
// })

// 누군가 8080포트의 하위경로로 요청 보내면 응답
app.get('/', function( req, res ) {
    res.sendFile(__dirname + '/index.html')
})

app.get('/pet', function (req, res) {
    res.send('펫페이지입니다')
})

app.get('/write', function (req, res) {
    res.sendFile(__dirname + '/write.html')
})

app.post('/add', function (req, res) {
    console.log(req.body)
    res.send('전송완료')
})