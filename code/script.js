// 게시글 작성 및 저장
window.onload = function () {
  const postList = document.getElementById("postList");
  const savedPosts = JSON.parse(localStorage.getItem("posts")) || [];

  savedPosts.forEach(post => {
    const postElement = createPostElement(post);
    postList.appendChild(postElement);
  });
};

// 게시글 작성 버튼 클릭 시
function createPostElement(post) {
  const postDiv = document.createElement("div");
  postDiv.className = "post";

  const titleEl = createTitleElement(post, postDiv);
  const postTimeEl = createPostTimeElement(post);
  const separator = createSeparatorElement();
  const contentEl = createContentElement(post);
  const editBtn = createEditButton(post);
  const deleteBtn = createDeleteButton(post, postDiv);
  const likeWrapper = createLikeWrapper(post);
  const { commentInput, commentBtn, commentSection } = createCommentSection(post);

  titleEl.onclick = () => togglePostDetails(contentEl, separator, likeWrapper, commentInput, commentBtn, commentSection);

  postDiv.append(
    titleEl,
    postTimeEl,
    separator,
    contentEl,
    editBtn,
    deleteBtn,
    likeWrapper,
    commentInput,
    commentBtn,
    commentSection
  );

  return postDiv;
}

function createTitleElement(post, postDiv) {
  const titleEl = document.createElement("h3");
  titleEl.textContent = post.title;
  titleEl.style.cursor = "pointer";
  return titleEl;
}

function createPostTimeElement(post) {
  const postTimeEl = document.createElement("p");
  postTimeEl.className = "post-time";
  postTimeEl.textContent = post.time;
  return postTimeEl;
}

function createSeparatorElement() {
  const separator = document.createElement("hr");
  separator.className = "separator hidden";
  return separator;
}

function createContentElement(post) {
  const contentEl = document.createElement("p");
  contentEl.textContent = post.content;
  contentEl.classList.add("hidden");
  return contentEl;
}

function createEditButton(post) {
  const editBtn = document.createElement("button");
  editBtn.textContent = "수정";
  editBtn.className = "edit-btn";
  editBtn.onclick = () => {
    const postToEdit = {
      id: post.id,
      title: post.title,
      content: post.content,
      time: post.time,
    };
    localStorage.setItem("editPost", JSON.stringify(postToEdit));
    window.location.href = "커뮤니티_수정.html";
  };
  return editBtn;
}

function createDeleteButton(post, postDiv) {
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "삭제";
  deleteBtn.className = "delete-btn";
  deleteBtn.onclick = () => {
    postDiv.remove();
    removePostFromStorage(post.id);
  };
  return deleteBtn;
}

function createLikeWrapper(post) {
  let likeCount = post.likes || 0;
  const likeBtn = document.createElement("button");
  likeBtn.textContent = "추천";
  likeBtn.className = "like-button hidden";

  const likeDisplay = document.createElement("span");
  likeDisplay.className = "like-count";
  likeDisplay.textContent = `${likeCount}명 추천`;

  const likeWrapper = document.createElement("div");
  likeWrapper.className = "like-wrapper";
  likeWrapper.appendChild(likeDisplay);
  likeWrapper.appendChild(document.createTextNode(" "));
  likeWrapper.appendChild(likeBtn);

  likeBtn.addEventListener("click", () => {
    likeCount++;
    likeDisplay.textContent = `${likeCount}명 추천`;
    updateLikeInStorage(post.id, likeCount);
  });

  return likeWrapper;
}

function createCommentSection(post) {
  const commentInput = document.createElement("input");
  commentInput.placeholder = "댓글 입력";
  commentInput.className = "comment-input hidden";

  const commentBtn = document.createElement("button");
  commentBtn.textContent = "댓글 등록";
  commentBtn.className = "comment-btn hidden";

  const commentSection = document.createElement("div");
  commentSection.className = "comment-section hidden";

  commentBtn.onclick = () => {
    const commentText = commentInput.value.trim();
    if (!commentText) return;

    const comment = document.createElement("div");
    comment.className = "comment";

    const commentContent = document.createElement("div");
    commentContent.className = "comment-content";

    const commentTextEl = document.createElement("span");
    commentTextEl.textContent = commentText;

    const commentTimeEl = document.createElement("span");
    commentTimeEl.className = "comment-time";
    commentTimeEl.textContent = new Date().toLocaleString();

    commentContent.appendChild(commentTextEl);

    const editCommentBtn = document.createElement("button");
    editCommentBtn.textContent = "수정";
    editCommentBtn.className = "edit-comment-btn comment-action-btn";
    editCommentBtn.onclick = () => {
      const newCommentText = prompt("댓글을 수정하세요:", commentTextEl.textContent);
      if (newCommentText) {
        commentTextEl.textContent = newCommentText;
      }
    };

    const deleteCommentBtn = document.createElement("button");
    deleteCommentBtn.textContent = "삭제";
    deleteCommentBtn.className = "delete-comment-btn comment-action-btn";
    deleteCommentBtn.onclick = () => {
      comment.remove();
    };

    const commentActions = document.createElement("div");
    commentActions.className = "comment-actions";
    commentActions.appendChild(editCommentBtn);
    commentActions.appendChild(deleteCommentBtn);

    comment.appendChild(commentContent);
    comment.appendChild(commentTimeEl);
    comment.appendChild(commentActions);
    commentSection.appendChild(comment);

    commentInput.value = "";
  };

  return { commentInput, commentBtn, commentSection };
}

function togglePostDetails(contentEl, separator, likeWrapper, commentInput, commentBtn, commentSection) {
  contentEl.classList.toggle("hidden");
  separator.classList.toggle("hidden");
  likeWrapper.querySelector(".like-button").classList.toggle("hidden");
  commentInput.classList.toggle("hidden");
  commentBtn.classList.toggle("hidden");
  commentSection.classList.toggle("hidden");
}

function addNewPost(title, content) {
  const posts = JSON.parse(localStorage.getItem("posts")) || [];
  const newPost = {
    id: Date.now(),
    title: title,
    content: content,
    time: new Date().toLocaleString(),
    likes: 0
  };
  posts.unshift(newPost);
  localStorage.setItem("posts", JSON.stringify(posts));
  window.location.href = "커뮤니티.html";
}

function startChatbot() {
  // final_chatbot.py가 Flask 서버에서 실행 중이고, /chatbot 경로로 요청을 처리한다고 가정합니다.
  const chatbotWindow = window.open('/chatbot', '_blank');
  if (!chatbotWindow) {
    alert('챗봇 창을 열 수 없습니다. 팝업 차단 설정을 확인하세요.');
  }
}