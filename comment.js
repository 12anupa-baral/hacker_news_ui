document.addEventListener("DOMContentLoaded", async () => {
  const commentsContainer = document.getElementById("comments-container");
  const loadMoreButton = document.getElementById("load-more-button");
  const commentsPerPage = 10;
  let offset = 0;

  const fetchComments = async (storyId) => {
    try {
      // Fetch story details
      const storyResponse = await fetch(
        `https://hacker-news.firebaseio.com/v0/item/${storyId}.json`
      );
      const storyData = await storyResponse.json();

      // Display story details
      const storyDetails = document.createElement("div");
      storyDetails.classList.add("story-details");
      storyDetails.innerHTML = `
        <h1>${storyData.title}</h1>
        <div class="data">
          <p>By: ${storyData.by}</p>
          <p>Score: ${storyData.score}</p>
          <a  id="view" href="${storyData.url}">View Story</a>
        </div>
      `;
      commentsContainer.appendChild(storyDetails);

      if (storyData.kids && storyData.kids.length > 0) {
        const commentIds = storyData.kids.slice(
          offset,
          offset + commentsPerPage
        );
        const commentPromises = commentIds.map(async (commentId) => {
          const commentResponse = await fetch(
            `https://hacker-news.firebaseio.com/v0/item/${commentId}.json`
          );
          return await commentResponse.json();
        });

        const comments = await Promise.all(commentPromises);
        offset += commentsPerPage;

        displayComments(comments);

        if (offset < storyData.kids.length) {
          loadMoreButton.style.display = "inline-block";
        } else {
          loadMoreButton.style.display = "none";
        }
      } else {
        commentsContainer.textContent = "No comments available for this story.";
        loadMoreButton.style.display = "none";
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      commentsContainer.textContent = "Error fetching comments.";
      loadMoreButton.style.display = "none";
    }
  };

  const displayComments = (comments) => {
    comments.forEach((commentData) => {
      const commentElement = createCommentElement(commentData);
      commentsContainer.appendChild(commentElement);
    });
  };

  // Function to create a comment element
  const createCommentElement = (data) => {
    const commentElement = document.createElement("div");
    commentElement.classList.add("comment");

    // Show Replies button
    const showRepliesButton = document.createElement("button");
    showRepliesButton.textContent = "Show Replies";
    showRepliesButton.addEventListener("click", async () => {
      const repliesContainer =
        commentElement.querySelector(".replies-container");

      // Check if replies are already loaded
      if (repliesContainer.dataset.loaded === "true") {
        repliesContainer.style.display =
          repliesContainer.style.display === "none" ? "block" : "none";
      } else {
        // Fetch and display replies if not loaded
        await fetchReplies(data.id, repliesContainer);
        repliesContainer.style.display = "block";
        repliesContainer.dataset.loaded = "true";
      }
    });

    // Hide Replies button
    const hideRepliesButton = document.createElement("button");
    hideRepliesButton.textContent = "Hide Replies";
    hideRepliesButton.style.display = "none";
    hideRepliesButton.addEventListener("click", () => {
      const repliesContainer =
        commentElement.querySelector(".replies-container");
      repliesContainer.style.display = "none";
      showRepliesButton.style.display = "inline-block";
      hideRepliesButton.style.display = "none";
    });

    // Customize the comment content based on your needs
    commentElement.innerHTML = `
      <p>Author: ${data.by}</p>
      <p>${data.text}</p>
      <div class="replies-container" style="display: none;" data-loaded="false"></div>
    `;

    // Append buttons to the comment element
    commentElement.appendChild(showRepliesButton);
    commentElement.appendChild(hideRepliesButton);

    return commentElement;
  };

  const fetchReplies = async (commentId, repliesContainer) => {
    try {
      const response = await fetch(
        `https://hacker-news.firebaseio.com/v0/item/${commentId}.json`
      );
      const commentData = await response.json();

      if (commentData.kids && commentData.kids.length > 0) {
        const replyIds = commentData.kids.slice(0, 10);
        const replyPromises = replyIds.map(async (replyId) => {
          const replyResponse = await fetch(
            `https://hacker-news.firebaseio.com/v0/item/${replyId}.json`
          );
          return replyResponse.json();
        });

        const replies = await Promise.all(replyPromises);

        replies.forEach((replyData) => {
          const replyElement = createCommentElement(replyData);
          repliesContainer.appendChild(replyElement);
        });

        if (commentData.kids.length > 10) {
          // Show "View More Replies" button for additional replies
          const viewMoreButton = document.createElement("button");
          viewMoreButton.textContent = "View More Replies";
          viewMoreButton.addEventListener("click", () => {
            fetchReplies(commentId, repliesContainer);
            viewMoreButton.remove();
          });
          repliesContainer.appendChild(viewMoreButton);
        }
      }
    } catch (error) {
      console.error("Error fetching replies:", error);
    }
  };

  // Extract story ID from the URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const storyId = urlParams.get("storyId");

  if (storyId) {
    // Fetch and display comments for the specified story ID
    fetchComments(storyId);
  } else {
    commentsContainer.textContent = "Viewed story ID not found.";
    loadMoreButton.style.display = "none";
  }

  function viewStory(url) {
    window.location.href = url;
  }

  loadMoreButton.addEventListener("click", () => {
    fetchComments(storyId);
  });
});
