document.addEventListener('DOMContentLoaded', () => {
    // 헤더
    fetch('/partials/header.html')
      .then(res => res.text())
      .then(html => {
        document.getElementById('header-container').innerHTML = html;
  
        // 로그인 쿠키 있없
        const isLoggedIn = document.cookie
          .split(';')
          .some(c => c.trim().startsWith('connect.sid='));
  
        // 링크채우기
        const authSpan = document.getElementById('auth-links');
        if (isLoggedIn) {
          authSpan.innerHTML = `
            <a href="/mypage">마이페이지</a>
            <a href="/logout">로그아웃</a>
          `;
        } else {
          authSpan.innerHTML = `<a href="/login">로그인</a>`;
        }
      })
      .catch(console.error);
  });
  