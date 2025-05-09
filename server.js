const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── 데이터 디렉터리 및 파일 초기화 ───
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const COMMUNITY_FILE = path.join(DATA_DIR, 'community.json');
const SCHEDULES_FILE = path.join(DATA_DIR, 'schedules.json');

function initJson(filePath, initialData) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2));
  }
}
initJson(USERS_FILE, []);
initJson(COMMUNITY_FILE, { posts: [], comments: [], likes: [] });
initJson(SCHEDULES_FILE, []);

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}
function saveJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ─── Express 설정 ───
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// 세션 미들웨어
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 }
}));
// 템플릿에서 user 사용 가능
app.use((req, res, next) => {
  res.locals.user = req.session && req.session.user;
  next();
});

// 프로필 
const upload = multer({ dest: path.join(__dirname, 'public', 'uploads'), limits: { fileSize: 2 * 1024 * 1024 } });

//라우트
// 메인 화면
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'code', '메인 화면.html'));
});

// 로그인
app.get('/login', (req, res) => res.render('login'));
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const users = loadJson(USERS_FILE);
  const user = users.find(u => u.username === username);
  if (user && bcrypt.compareSync(password, user.password)) {
    req.session.user = { username, profile: user.profile };
    return res.redirect('/mypage');
  }
  res.render('login', { error: '아이디/비밀번호가 올바르지 않습니다.' });
});



// 회원가입
app.get('/register', (req, res) => res.render('register'));
app.post('/register', upload.single('profile'), (req, res) => {
  const { username, password } = req.body;
  const users = loadJson(USERS_FILE);
  if (users.find(u => u.username === username)) {
    return res.render('register', { error: '이미 존재하는 사용자입니다.' });
  }
  const hashed = bcrypt.hashSync(password, 10);
  const profile = req.file ? `/uploads/${req.file.filename}` : '/images/default.png';
  users.push({ username, password: hashed, profile });
  saveJson(USERS_FILE, users);
  res.redirect('/login');
});


// 로그아웃
app.get('/logout', (req, res) => req.session.destroy(() => res.redirect('/login')));

// 인증 미들웨어
function ensureAuth(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/login');
}

// 마이페이지
app.get('/mypage', ensureAuth, (req, res) => {
  console.log("세션 사용자 정보:", req.session.user);
  const { username, profile } = req.session.user;
  const community = loadJson(COMMUNITY_FILE);
  const schedules = loadJson(SCHEDULES_FILE);
  const myPosts = community.posts.filter(p => p.author === username);
  const myComments = community.comments.filter(c => c.author === username);
  const myLikes = community.likes.filter(l => l.user === username);
  res.render('mypage', { username, profile, myPosts, myComments, myLikes, schedules });
});


// 글쓰기 목록 남기는거
app.post('/api/posts', ensureAuth, (req, res) => {
  const { title, content } = req.body;
  const community = loadJson(COMMUNITY_FILE);
  const newPost = {
    id: community.posts.length
      ? community.posts[community.posts.length - 1].id + 1
      : 1,
    author: req.session.user.username,
    title,
    content,
    createdAt: new Date().toISOString()
  };
  community.posts.push(newPost);
  saveJson(COMMUNITY_FILE, community);
  res.json({ success: true, post: newPost });
});

// 게시글
app.get('/api/posts', (req, res) => {
  const community = loadJson(COMMUNITY_FILE);
  res.json(community.posts || []);
});

// 댓글
app.get("/api/comments/:postId", (req, res) => {
  const community = loadJson(COMMUNITY_FILE);
  const comments = community.comments.filter(c => c.postId === parseInt(req.params.postId));
  res.json(comments);
});

// 게시글추천
app.get("/api/likes/:postId", (req, res) => {
  const community = loadJson(COMMUNITY_FILE);
  const count = community.likes.filter(l => l.postId === parseInt(req.params.postId)).length;
  res.json({ count });
});

//추천 저장
app.post('/api/like', (req, res) => {
  const user = req.session.user;
  if (!user) return res.status(401).json({ message: '로그인 필요' });

  const { postId } = req.body;
  const community = loadJson(COMMUNITY_FILE);
  const alreadyLiked = community.likes.some(
    l => l.postId === parseInt(postId) && l.user === user.username
  );
  if (alreadyLiked) {
    return res.status(400).json({ message: '이미 추천함' });
  }

  community.likes.push({
    postId: parseInt(postId),
    user: user.username
  });
  saveJson(COMMUNITY_FILE, community);
  res.json({ success: true });
});


//댓글 저장
app.post('/api/comment', (req, res) => {
  const user = req.session.user;
  if (!user) return res.status(401).json({ message: '로그인 필요' });

  const { postId, content } = req.body;
  const community = loadJson(COMMUNITY_FILE);
  const comment = {
    postId: parseInt(postId),
    content,
    author: user.username,
    timestamp: new Date().toISOString()
  };
  community.comments.push(comment);
  saveJson(COMMUNITY_FILE, community);
  res.json({ success: true });
});



// 게시글 삭제
app.delete("/api/posts/:id", (req, res) => {
  const community = loadJson(COMMUNITY_FILE);
  const postId = parseInt(req.params.id);
  community.posts = community.posts.filter(p => p.id !== postId);
  community.comments = community.comments.filter(c => c.postId !== postId);
  community.likes = community.likes.filter(l => l.postId !== postId);
  saveJson(COMMUNITY_FILE, community);
  res.json({ success: true });
});

// 정적 미들웨어
app.use('/partials', express.static(path.join(__dirname, 'public/partials')));  //로그인헤더
app.use(express.static(path.join(__dirname, 'public')));  //이미지모음
app.use(express.static(path.join(__dirname, 'code')));    // HTML들




// 일정 등록
app.post('/schedule/add', ensureAuth, (req, res) => {
  const { hospitalId, date, time } = req.body;
  const schedules = loadJson(SCHEDULES_FILE);
  schedules.push({ user: req.session.user.username, hospitalId, date, time });
  saveJson(SCHEDULES_FILE, schedules);
  res.redirect('/mypage');
});

// 서버 시작
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
