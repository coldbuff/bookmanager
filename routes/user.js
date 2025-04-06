const express = require("express");
const User = require("../schemas/user");
const router = express.Router();

// 사용자 목록 (관리자용)
router.get("/", async (req, res, next) => {
  try {
    // 관리자 권한 확인 (나중에 구현)
    // if (!req.session.user || req.session.user.role !== 'admin') {
    //   return res.status(403).render('error', {
    //     message: '접근 권한이 없습니다.',
    //     error: { status: 403 }
    //   });
    // }

    const users = await User.find().sort({ joinDate: -1 });
    console.log("사용자 목록:", users);
    res.render("users/list", { title: "사용자 목록", users });
  } catch (error) {
    console.error("사용자 목록 조회 오류:", error);
    next(error);
  }
});

// 회원가입 폼
router.get("/register", (req, res) => {
  res.render("users/register", { title: "회원가입" });
});

// 회원가입 처리
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // 비밀번호 확인
    if (password !== confirmPassword) {
      return res.status(400).render("users/register", {
        title: "회원가입",
        error: "비밀번호가 일치하지 않습니다.",
        user: { name, email },
      });
    }

    // 이메일 중복 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).render("users/register", {
        title: "회원가입",
        error: "이미 사용 중인 이메일입니다.",
        user: { name, email },
      });
    }

    // 새 사용자 생성 (실제 구현에서는 비밀번호 해싱 필요)
    await User.create({
      name,
      email,
      password, // 실제 구현에서는 해싱된 비밀번호 저장
      role: "user",
      joinDate: Date.now(),
      lastLogin: Date.now(),
      active: true,
    });

    res.redirect("/users/login");
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 로그인 폼
router.get("/login", (req, res) => {
  res.render("users/login", { title: "로그인" });
});

// 로그인 처리 - 강화된 세션 처리
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log("로그인 시도:", email);

    // 사용자 찾기
    const userObj = await User.findOne({ email });

    if (!userObj) {
      console.log("로그인 실패: 사용자 없음");
      return res.render("users/login", {
        error: "이메일 또는 비밀번호가 일치하지 않습니다.",
      });
    }

    // 비밀번호 확인 (임시로 일치 확인)
    if (password !== userObj.password) {
      console.log("로그인 실패: 비밀번호 불일치");
      return res.render("users/login", {
        error: "이메일 또는 비밀번호가 일치하지 않습니다.",
      });
    }

    // 마지막 로그인 시간 업데이트
    await User.findOneAndUpdate(
      { _id: userObj._id },
      { $set: { lastLogin: new Date() } }
    );

    // 세션에 사용자 정보 저장
    req.session.user = {
      _id: userObj._id.toString(),
      name: userObj.name,
      email: userObj.email,
      role: userObj.role,
    };

    // 세션 저장 확인
    req.session.save((err) => {
      if (err) {
        console.error("세션 저장 오류:", err);
        return next(err);
      }

      console.log("로그인 성공! 사용자:", userObj.name);
      console.log("세션 ID:", req.sessionID);
      console.log("세션 내용:", req.session);

      // 메인 페이지로 리디렉트
      return res.redirect("/");
    });
  } catch (error) {
    console.error("로그인 오류:", error);
    next(error);
  }
});

// 로그아웃 - 간소화 (특정 경로를 먼저 정의하여 라우트 충돌 방지)
router.get("/logout", (req, res) => {
  // 사용자 이름 기록
  const userName = req.session.user ? req.session.user.name : "알 수 없음";

  // 세션 삭제
  req.session.destroy((err) => {
    if (err) {
      console.error("로그아웃 오류:", err);
      return res.status(500).render("error", {
        message: "로그아웃 중 오류가 발생했습니다.",
      });
    }

    // 쿠키 삭제
    res.clearCookie("bookmanager.sid", { path: "/" });
    console.log(`사용자 ${userName} 로그아웃 성공`);

    return res.redirect("/");
  });
});

// 사용자 상세 정보
router.get("/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .render("error", { message: "사용자를 찾을 수 없습니다." });
    }
    res.render("users/detail", { title: user.name, user });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 사용자 정보 수정 폼
router.get("/:id/edit", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .render("error", { message: "사용자를 찾을 수 없습니다." });
    }
    res.render("users/edit", { title: "사용자 정보 수정", user });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 사용자 정보 수정 처리
router.post("/:id", async (req, res, next) => {
  try {
    const { name, email, role, active } = req.body;

    // 이메일 중복 확인 (자기 자신 제외)
    const existingUser = await User.findOne({
      email,
      _id: { $ne: req.params.id },
    });
    if (existingUser) {
      return res.status(400).render("users/edit", {
        title: "사용자 정보 수정",
        error: "이미 사용 중인 이메일입니다.",
        user: { ...req.body, _id: req.params.id },
      });
    }

    // 사용자 정보 업데이트
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        name,
        email,
        role,
        active: active === "true",
      },
      { new: true }
    );

    if (!user) {
      return res
        .status(404)
        .render("error", { message: "사용자를 찾을 수 없습니다." });
    }

    res.redirect(`/users/${user._id}`);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
