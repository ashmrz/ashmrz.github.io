// Initialize AOS after DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  AOS.init({
    duration: 1000,
    once: true,
    offset: 100,
    easing: "ease-in-out-quad", // More natural easing
  });

  // Add smooth scroll behavior to the scroll indicator
  document
    .querySelector(".scroll-indicator")
    .addEventListener("click", function (e) {
      e.preventDefault();
      const targetSection = document.getElementById("post-profile");
      targetSection.scrollIntoView({ behavior: "smooth" });
    });
  loadAndDisplayExperience();
});

let publications = []; // Store publications data globally

// Load and display publications
fetch("content/papers.json?" + new Date().getTime())
  .then((response) => response.json())
  .then((data) => {
    publications = data.papers; // Store the publications
    displayPublications(publications);
  })
  .catch((error) => {
    console.error("Error loading publications:", error);
  });

function toggleAbstract(index) {
  const card = document.getElementById(`publication-${index}`);
  const abstractContent = document.getElementById(`abstract-${index}`);
  card.classList.toggle("expanded");
  abstractContent.style.maxHeight = card.classList.contains("expanded")
    ? `${abstractContent.scrollHeight}px`
    : "0";
  const chevronIcon = card.querySelector(".fa-chevron-down");
  if (chevronIcon) {
    chevronIcon.classList.toggle("rotate-180");
  }
}

function displayPublications(papers) {
  const container = document.getElementById("publications-container");
  container.innerHTML = "";

  let allPapersHTML = "";
  papers.forEach((paper, index) => {
    const delay = Math.min((index + 1) * 50, 500);
    const paperHTML = `
      <div class="col-md-12" data-aos="fade-up" data-aos-delay="${delay}">
          <div class="card publication-card shadow-sm" id="publication-${index}"
               onclick="event.preventDefault(); ${
                 paper.abstract ? `toggleAbstract(${index})` : ""
               }"
               style="cursor: ${paper.abstract ? "pointer" : "default"}">
              <div class="row g-0">
                  <div class="col-md-3">
                      ${
                        paper.media.match(/\.(mp4|webm|mov|avi|mkv)$/)
                          ? `<video src="${paper.media}" class="publication-media rounded-start" autoplay loop muted playsinline style="width: 100%; object-fit: cover; aspect-ratio: 16/9;" onerror="this.style.display='none'"></video>`
                          : `<img src="${paper.media}" alt="${paper.title} Preview" class="publication-media rounded-start" style="width: 100%; object-fit: cover; aspect-ratio: 16/9;" onerror="this.style.display='none'">`
                      }
                  </div>
                  <div class="col-md-9">
                      <div class="publication-body p-4">
                          <span class="venue-badge">${paper.venue}</span>
                          <h5 class="mb-1">${paper.title}</h5>
                          <p class="mb-0 small">${paper.authors.replace(
                            "Ashkan Mirzaei",
                            "<strong>Ashkan Mirzaei</strong>"
                          )}</p>
                          ${
                            paper.url
                              ? `<div class="mt-3">
                                  <a href="${paper.url}" target="_blank" class="project-link" onclick="event.stopPropagation()">
                                      <i class="fas fa-external-link-alt"></i>
                                      Project Page
                                  </a>
                              </div>`
                              : ""
                          }
                          ${
                            paper.abstract
                              ? `<div class="abstract-content overflow-hidden transition-all duration-300" id="abstract-${index}" style="max-height: 0;">
                                  <p class="mt-2 small">${paper.abstract}</p>
                              </div>
                              <div class="text-center mt-2">
                                  <i class="fas fa-chevron-down text-gray-400 transition-transform duration-300 ${index}"></i>
                              </div>`
                              : ""
                          }
                      </div>
                  </div>
              </div>
          </div>
      </div>
  `;
    allPapersHTML += paperHTML;
  });

  container.innerHTML = allPapersHTML;

  setTimeout(() => {
    AOS.refresh();
  }, 100);
}

function filterPublications() {
  const searchTerm = document
    .getElementById("publicationSearch")
    .value.toLowerCase();
  const filteredPapers = publications.filter((paper) => {
    return (
      paper.title.toLowerCase().includes(searchTerm) ||
      paper.authors.toLowerCase().includes(searchTerm) ||
      paper.venue.toLowerCase().includes(searchTerm) ||
      (paper.abstract && paper.abstract.toLowerCase().includes(searchTerm))
    );
  });
  displayPublications(filteredPapers);
}

function loadAndDisplayExperience() {
  fetch("content/experience.json?" + new Date().getTime())
    .then((response) => response.json())
    .then((data) => {
      const experience = data.experience;
      displayExperience(experience);
    })
    .catch((error) => {
      console.error("Error loading experience data:", error);
    });
}

function displayExperience(experience) {
  const timeline = document.getElementById("timeline");
  timeline.innerHTML = ""; // Clear any existing content

  // Start adding items from the right
  for (let i = experience.length - 1; i >= 0; i--) {
    const item = experience[i];
    const delay = Math.min((experience.length - i) * 50, 500); // Delay for right-to-left animation

    const timelineItem = `
      <div class="timeline-item" data-aos="fade-up" data-aos-delay="${delay}">
          <h4>${item.company}</h4>
          <p>${item.title}</p>
          <p class="time-range">${item.time}</p>
      </div>
  `;
    timeline.innerHTML = timelineItem + timeline.innerHTML; // Add to the start for right-to-left
  }

  // Set initial scroll position to the right
  const timelineContainer = document.querySelector(".timeline-container");
  setTimeout(() => {
    timelineContainer.scrollLeft = timelineContainer.scrollWidth;
  }, 0);
}