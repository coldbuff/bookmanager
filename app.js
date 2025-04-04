const express = require('express');
const path = require('path');
const morgan = require('morgan');
const nunjucks = require('nunjucks');
const cors = require('cors');
const moment = require('moment');
const session = require('express-session');
const connect = require('./schemas');

// 라우터 가져오기 (나중에 구현)
const indexRouter = require('./routes');
const bookRouter = require('./routes/book');
const userRouter = require('./routes/user');
const loanRouter = require('./routes/loan');

// Express 앱 초기화
const app = express();
app.set('port', process.env.PORT || 3003); // 3002 대신 3003 포트 사용
app.set('view engine', 'html');
const env = nunjucks.configure('views', {
  express: app,
  watch: true,
  autoescape: true,
  trimBlocks: true,
  lstripBlocks: true
});

// date 필터 강화 - 다양한 날짜 형식 처리
env.addFilter('date', function(date, format) {
  // 날짜가 없는 경우 처리
  if (!date) return '-';
  
  try {
    // 날짜 객체인지 문자열인지 확인
    let momentDate;
    
    if (date instanceof Date) {
      momentDate = moment(date);
    } else if (typeof date === 'string') {
      momentDate = moment(date);
    } else if (typeof date === 'number') {
      momentDate = moment(new Date(date));
    } else {
      // 기타 형식은 문자열로 변환 후 시도
      momentDate = moment(String(date));
    }
    
    if (!momentDate.isValid()) {
      console.error('잘못된 날짜 형식:', date);
      return '-';
    }
    
    return momentDate.format(format || 'YYYY-MM-DD');
  } catch (error) {
    console.error('날짜 형식 변환 오류:', error, date);
    return '-';
  }
});

// 날짜 유효성 확인 필터 추가
env.addFilter('isValidDate', function(date) {
  if (!date) return false;
  return moment(date).isValid();
});

// MongoDB 연결
connect();

// 미들웨어 설정
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// 세션 설정 - 완전히 새로운 설정
const sessionOptions = {
  secret: 'bookmanager-secret-key',
  resave: true, // true로 변경
  saveUninitialized: true, // true로 변경
  name: 'bookmanager.sid', // 세션 쿠키 이름 지정
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 24시간
    httpOnly: true,
    secure: false,
    path: '/',
    sameSite: 'lax'
  }
};

// 세션 설정 로그
console.log('세션 설정 적용:', sessionOptions);

// 세션 미들웨어 적용
app.use(session(sessionOptions));

console.log('메모리 세션 스토어 사용 중');

// 세션 사용자 정보를 템플릿에 전달
app.use((req, res, next) => {
  // 세션에서 사용자 정보를 가져와 템플릿에 전달
  res.locals.user = req.session.user || null;
  
  // 디버깅 정보 추가 (로그인 상태를 위한 중요 정보)
  if (req.session.user) {
    console.log(`페이지 로드: 사용자 ${req.session.user.name} 로그인 상태`);
  }
  
  next();
});

// 라우터 설정
app.use('/', indexRouter);
app.use('/books', bookRouter);
app.use('/users', userRouter);
app.use('/loans', loanRouter);

// 404 에러 처리
app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error);
});

// 404 에러 처리
app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error);
});

// 에러 처리 미들웨어
app.use((err, req, res, next) => {
  console.error('에러 발생:', err);
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
  res.status(err.status || 500);
  res.render('error', { title: '에러 발생', error: err });
});

// 서버 시작
app.listen(app.get('port'), () => {
  console.log(`서버가 http://localhost:${app.get('port')} 에서 실행 중입니다.`);
  console.log(`EC2 서버 주소: http://13.125.250.187:${app.get('port')}`);
});