document.addEventListener("DOMContentLoaded", function () {
  AOS.init({
    duration: 800,
    once: true,
    offset: 80,
    easing: "ease-in-out-quad",
  });

  document
    .querySelector(".scroll-indicator")
    .addEventListener("click", function (e) {
      e.preventDefault();
      document.getElementById("post-profile").scrollIntoView({
        behavior: "smooth",
      });
    });

  loadAndDisplayExperience();
  loadAndDisplayPublications();
});

let publications = [];

function loadAndDisplayPublications() {
  fetch("content/papers.json?" + new Date().getTime())
    .then((response) => response.json())
    .then((data) => {
      publications = data.papers;
      displayPublications(publications);
    })
    .catch((error) => {
      console.error("Error loading publications:", error);
    });
}

function toggleAbstract(index) {
  const card = document.getElementById(`publication-${index}`);
  const abstractContent = document.getElementById(`abstract-${index}`);
  const isExpanded = card.classList.contains("expanded");

  card.classList.toggle("expanded");
  abstractContent.style.maxHeight = isExpanded
    ? "0"
    : `${abstractContent.scrollHeight}px`;
  const chevronIcon = card.querySelector(".fa-chevron-down");
  if (chevronIcon) {
    chevronIcon.classList.toggle("rotate-180");
  }
}

function displayPublications(papers) {
  const container = document.getElementById("publications-container");
  container.innerHTML = "";
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
                        ? `<video src="${paper.media}" class="publication-media rounded-start"
                                      autoplay loop muted playsinline
                                       style="width: 100%; object-fit: cover; aspect-ratio: 16/9;"
                                      onerror="this.style.display='none'"></video>`
                        : `<img src="${paper.media}" alt="${paper.title} Preview"
                                     class="publication-media rounded-start"
                                     style="width: 100%; object-fit: cover; aspect-ratio: 16/9;"
                                     onerror="this.style.display='none'">`
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
                            ? `<div class="abstract-content" id="abstract-${index}">
                                <p class="mt-2 small">${paper.abstract}</p>
                            </div>
                            <div class="text-center mt-2 abstract-toggle">
                                <i class="fas fa-chevron-down text-gray-400 transition-transform duration-300"></i>
                            </div>`
                            : ""
                        }
                    </div>
                </div>
            </div>
        </div>
    </div>
`;
    container.innerHTML += paperHTML;
  });
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
  timeline.innerHTML = "";

  for (let i = experience.length - 1; i >= 0; i--) {
    const item = experience[i];
    const delay = Math.min((experience.length - i) * 50, 500);

    const timelineItem = `
          <div class="timeline-item" data-aos="fade-up" data-aos-delay="${delay}">
              <h4>${item.company}</h4>
              <p>${item.title}</p>
              <p class="time-range">${item.time}</p>
          </div>
      `;
    timeline.innerHTML = timelineItem + timeline.innerHTML;
  }
  const timelineContainer = document.querySelector(".timeline-container");
  setTimeout(() => {
    timelineContainer.scrollLeft = timelineContainer.scrollWidth;
  }, 0);
}
