const express = require('express');
const Book = require('../schemas/book');
const router = express.Router();

// 모든 도서 목록 가져오기
router.get('/', async (req, res, next) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    res.render('books/list', { title: '도서 목록', books });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 새 도서 등록 폼
router.get('/new', (req, res) => {
  res.render('books/new', { title: '새 도서 등록' });
});

// 새 도서 등록 처리
router.post('/', async (req, res, next) => {
  try {
    const { title, author, publisher, publishedYear, isbn, category, description, quantity } = req.body;
    
    // ISBN 중복 확인
    const existingBook = await Book.findOne({ isbn });
    if (existingBook) {
      return res.status(400).render('books/new', {
        title: '새 도서 등록',
        error: '이미 등록된 ISBN입니다.',
        book: req.body
      });
    }
    
    // 새 도서 생성
    const book = await Book.create({
      title,
      author,
      publisher,
      publishedYear,
      isbn,
      category,
      description,
      quantity,
      available: quantity
    });
    
    res.redirect(`/books/${book._id}`);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 도서 상세 정보
router.get('/:id', async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).render('error', { message: '도서를 찾을 수 없습니다.' });
    }
    res.render('books/detail', { title: book.title, book });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 도서 수정 폼
router.get('/:id/edit', async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).render('error', { message: '도서를 찾을 수 없습니다.' });
    }
    res.render('books/edit', { title: '도서 수정', book });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 도서 수정 처리
router.post('/:id', async (req, res, next) => {
  try {
    const { title, author, publisher, publishedYear, isbn, category, description, quantity } = req.body;
    
    // ISBN 중복 확인 (자기 자신 제외)
    const existingBook = await Book.findOne({ isbn, _id: { $ne: req.params.id } });
    if (existingBook) {
      return res.status(400).render('books/edit', {
        title: '도서 수정',
        error: '이미 등록된 ISBN입니다.',
        book: { ...req.body, _id: req.params.id }
      });
    }
    
    // 도서 정보 업데이트
    const book = await Book.findByIdAndUpdate(req.params.id, {
      title,
      author,
      publisher,
      publishedYear,
      isbn,
      category,
      description,
      quantity,
      updatedAt: Date.now()
    }, { new: true });
    
    if (!book) {
      return res.status(404).render('error', { message: '도서를 찾을 수 없습니다.' });
    }
    
    res.redirect(`/books/${book._id}`);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 도서 삭제
router.post('/:id/delete', async (req, res, next) => {
  try {
    const result = await Book.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).render('error', { message: '도서를 찾을 수 없습니다.' });
    }
    res.redirect('/books');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 도서 검색
router.get('/search', async (req, res, next) => {
  try {
    const { query, type } = req.query;
    let searchCondition = {};
    
    if (query && query.trim()) {
      if (type === 'title') {
        searchCondition.title = new RegExp(query, 'i');
      } else if (type === 'author') {
        searchCondition.author = new RegExp(query, 'i');
      } else if (type === 'isbn') {
        searchCondition.isbn = new RegExp(query, 'i');
      } else {
        // 기본 검색은 제목, 저자, ISBN 모두 검색
        searchCondition = {
          $or: [
            { title: new RegExp(query, 'i') },
            { author: new RegExp(query, 'i') },
            { isbn: new RegExp(query, 'i') }
          ]
        };
      }
    }
    
    const books = await Book.find(searchCondition).sort({ createdAt: -1 });
    res.render('books/list', { 
      title: '도서 검색 결과', 
      books,
      searchQuery: query,
      searchType: type
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
