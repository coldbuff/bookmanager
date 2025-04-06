const express = require('express');
const Loan = require('../schemas/loan');
const Book = require('../schemas/book');
const User = require('../schemas/user');
const router = express.Router();

// 모든 대출 목록 가져오기
router.get('/', async (req, res, next) => {
  try {
    const loans = await Loan.find()
      .populate('book')
      .populate('user')
      .sort({ loanDate: -1 });
    
    console.log('대출 목록:', loans);
    res.render('loans/list', { title: '대출 목록', loans });
  } catch (error) {
    console.error('대출 목록 조회 오류:', error);
    next(error);
  }
});

// 새 대출 등록 폼
router.get('/new', async (req, res, next) => {
  try {
    const books = await Book.find({ available: { $gt: 0 } });
    const users = await User.find({ active: true });
    
    res.render('loans/new', { 
      title: '새 대출 등록',
      books,
      users
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 새 대출 등록 처리
router.post('/', async (req, res, next) => {
  try {
    const { bookId, userId, dueDate } = req.body;
    
    console.log('대출 등록 요청 데이터:', { bookId, userId, dueDate });
    
    // 도서 및 사용자 확인
    const book = await Book.findById(bookId);
    const user = await User.findById(userId);
    
    if (!book || !user) {
      return res.status(404).render('error', { message: '도서 또는 사용자를 찾을 수 없습니다.' });
    }
    
    // 도서 대출 가능 여부 확인
    if (book.available <= 0) {
      return res.status(400).render('loans/new', {
        title: '새 대출 등록',
        error: '현재 대출 가능한 도서가 없습니다.',
        books: await Book.find({ available: { $gt: 0 } }),
        users: await User.find({ active: true })
      });
    }
    
    // 날짜 값 처리
    let parsedDueDate;
    try {
      parsedDueDate = new Date(dueDate);
      if (isNaN(parsedDueDate.getTime())) {
        throw new Error('유효하지 않은 날짜 형식');
      }
      console.log('파싱된 반납 예정일:', parsedDueDate);
    } catch (dateError) {
      console.error('날짜 파싱 오류:', dateError);
      return res.status(400).render('loans/new', {
        title: '새 대출 등록',
        error: '유효하지 않은 날짜 형식입니다. YYYY-MM-DD 형식으로 입력해주세요.',
        books: await Book.find({ available: { $gt: 0 } }),
        users: await User.find({ active: true })
      });
    }
    
    // 대출 생성
    const loan = await Loan.create({
      book: bookId,
      user: userId,
      loanDate: Date.now(),
      dueDate: parsedDueDate,
      status: 'borrowed'
    });
    
    console.log('생성된 대출 정보:', loan);
    
    // 도서 가용 수량 감소
    await Book.findByIdAndUpdate(bookId, {
      $inc: { available: -1 }
    });
    
    res.redirect(`/loans/${loan._id}`);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 대출 상세 정보
router.get('/:id', async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate('book')
      .populate('user');
    
    if (!loan) {
      return res.status(404).render('error', { message: '대출 정보를 찾을 수 없습니다.' });
    }
    
    // 현재 날짜 정보 추가
    const currentDate = new Date();
    res.render('loans/detail', { 
      title: '대출 상세 정보', 
      loan,
      currentDate
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 도서 반납 처리
router.post('/:id/return', async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id);
    
    if (!loan) {
      return res.status(404).render('error', { message: '대출 정보를 찾을 수 없습니다.' });
    }
    
    // 이미 반납된 도서인지 확인
    if (loan.status === 'returned') {
      return res.status(400).render('error', { message: '이미 반납된 도서입니다.' });
    }
    
    // 반납 처리
    await Loan.findByIdAndUpdate(req.params.id, {
      returnDate: Date.now(),
      status: 'returned'
    });
    
    // 도서 가용 수량 증가
    await Book.findByIdAndUpdate(loan.book, {
      $inc: { available: 1 }
    });
    
    console.log('반납 처리된 대출 정보:', loan);
    
    res.redirect(`/loans/${loan._id}`);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 연체 상태 업데이트 (관리자용)
router.post('/:id/overdue', async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id);
    
    if (!loan) {
      return res.status(404).render('error', { message: '대출 정보를 찾을 수 없습니다.' });
    }
    
    // 이미 반납된 도서인지 확인
    if (loan.status === 'returned') {
      return res.status(400).render('error', { message: '이미 반납된 도서입니다.' });
    }
    
    // 연체 처리
    await Loan.findByIdAndUpdate(req.params.id, {
      status: 'overdue',
      fine: req.body.fine || 0
    });
    
    res.redirect(`/loans/${loan._id}`);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
