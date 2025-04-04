const express = require("express");
const Book = require("../schemas/book");
const router = express.Router();

// 메인 페이지 라우트
router.get("/", async (req, res, next) => {
  try {
    // 세션 사용자 정보 확인 (간소화)
    if (req.session.user) {
      console.log("로그인된 사용자:", req.session.user.name);
    } else {
      console.log("로그인되지 않은 상태");
    }

    // 최근 추가된 도서 10권 가져오기
    const recentBooks = await Book.find().sort({ createdAt: -1 }).limit(10);

    // 사용자 정보 전달
    res.render("index", {
      title: "도서 관리 시스템",
      recentBooks,
      user: req.session.user,
    });
  } catch (error) {
    console.error("메인 페이지 오류:", error);
    next(error);
  }
});

module.exports = router;
