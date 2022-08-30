var router = require('express').Router();

// 우선 Crypto 모듈의 randomBytes 메소드를 통해 Salt를 반환하는 함수를 작성한다.
const createSalt = () =>
    new Promise((resolve, reject) => {
        crypto.randomBytes(64, (err, buf) => {
            if (err) reject(err);
            resolve(buf.toString('base64'));
        });
    });
// 이제 암호화가 안된 비밀번호를 인자로 받아 위에서 작성한 createSalt 함수로 salt를 생성하고 sha-512로 해싱한 암호화된 비밀번호가 생성된다.
// 이 함수는 password와 salt 모두를 반환하고 데이터베이스에 둘 다 넣어주면 된다. 
const createHashedPassword = (plainPassword) =>
    new Promise(async (resolve, reject) => {
        const salt = await createSalt();
        crypto.pbkdf2(plainPassword, salt, 9999, 64, 'sha512', (err, key) => {
            if (err) reject(err);
            resolve({ password: key.toString('base64'), salt });
        });
    });


router.get('/', function (req, res) {
    res.send('test');
    console.log('테스트페이지')
})


module.exports = router;