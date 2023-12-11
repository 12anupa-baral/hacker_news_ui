let currentPage = 1;
const storiesPerPage = 10;
const totalPages = 5;
let currentSearchQuery = "";

async function fetchTopStories(pageNumber, storiesPerPage) {
  try {
    const response = await fetch(
      "https://hacker-news.firebaseio.com/v0/topstories.json"
    );
    const storyIds = await response.json();

    const startIdx = (pageNumber - 1) * storiesPerPage;
    const endIdx = startIdx + storiesPerPage;
    const pageStoryIds = storyIds.slice(startIdx, endIdx);

    const storyPromises = pageStoryIds.map(async (storyId) => {
      const storyResponse = await fetch(
        `https://hacker-news.firebaseio.com/v0/item/${storyId}.json`
      );
      return storyResponse.json();
    });

    const stories = await Promise.all(storyPromises);
    return stories.filter((story) => story);
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}

function displayStories(stories) {
  const app = document.getElementById("app");
  app.innerHTML = "";

  stories.forEach((story) => {
    if (matchesSearchQuery(story, currentSearchQuery)) {
      const storyElement = document.createElement("div");
      storyElement.classList.add("story");
      storyElement.innerHTML = `
    <h2>${story.title}</h2>
    <p>By: ${story.by}</p>
    <p>Score: ${story.score}</p>
    <a href="${story.url}" target="_blank" id="read">Read more</a>
    <button class="toggle-button" data-story-id="${story.id}" onclick="toggleComments(this)" id="comment">Show Comments</button>
  `;

      if (story.kids) {
        const commentList = document.createElement("ul");
        commentList.classList.add("comments");
        story.kids.slice(0, 3).forEach(async (commentId) => {
          const commentResponse = await fetch(
            `https://hacker-news.firebaseio.com/v0/item/${commentId}.json`
          );
          const comment = await commentResponse.json();

          const commentElement = document.createElement("li");
          commentElement.classList.add("comment");
          commentElement.textContent = comment.text;
          commentList.appendChild(commentElement);
        });

        storyElement.appendChild(commentList);
      }

      app.appendChild(storyElement);
    }
  });
}
function toggleComments(button) {
  const storyId = button.dataset.storyId;

  if (!storyId) {
    console.error("Story ID not found.");
    return;
  }

  window.location.href = `comment.html?storyId=${storyId}`;
}

async function loadPage(pageNumber) {
  try {
    if (pageNumber < 1 || pageNumber > totalPages) {
      return;
    }
    const stories = await fetchTopStories(pageNumber, storiesPerPage);
    displayStories(stories);
    updatePagination(pageNumber);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

function updatePagination(pageNumber) {
  currentPage = pageNumber;
  document.getElementById("currentPage").textContent = `Page ${pageNumber}`;
  document.getElementById("prevButton").disabled = pageNumber === 1;
  document.getElementById("nextButton").disabled = pageNumber === totalPages;
}

function matchesSearchQuery(data, query) {
  if (!query) {
    return true;
  }

  const lowerCaseQuery = query.toLowerCase();
  const title = data.title.toLowerCase();
  const author = data.by.toLowerCase();

  return title.includes(lowerCaseQuery) || author.includes(lowerCaseQuery);
}

document.addEventListener("DOMContentLoaded", async () => {
  const searchInput = document.querySelector(".search");

  searchInput.addEventListener("input", () => {
    currentSearchQuery = searchInput.value.trim();
    handleSearch();
  });

  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearch();
    }
  });

  await loadPage(currentPage);

  const prevButton = document.getElementById("prevButton");
  const nextButton = document.getElementById("nextButton");

  prevButton.addEventListener("click", () => {
    loadPage(currentPage - 1);
  });

  nextButton.addEventListener("click", () => {
    loadPage(currentPage + 1);
  });

  function handleSearch() {
    currentPage = 1;
    loadPage(currentPage);
  }
});
