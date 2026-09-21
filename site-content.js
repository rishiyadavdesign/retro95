(() => {
  const DEFAULT_URL = "/content/default-content.json";

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);

  const replaceExactText = (root, from, to) => {
    if (!from || !to) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue.trim() === from) node.nodeValue = node.nodeValue.replace(from, to);
    }
  };

  const normalizeText = (value) => String(value ?? "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\s+/g, " ")
    .trim();

  const replaceMatchingText = (root, from, to) => {
    if (!from || !to) return;
    const expected = normalizeText(from);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (normalizeText(node.nodeValue) === expected) node.nodeValue = to;
    }
  };

  const setImageMatches = (needle, value) => {
    if (!value) return;
    document.querySelectorAll(`img[src*="${needle}"]`).forEach((image) => {
      image.src = value;
      image.removeAttribute("srcset");
    });
  };

  function applyProfile(content) {
    const profile = content.profile || {};
    replaceExactText(document.body, "Robert Stanley", profile.name);
    replaceExactText(document.body, "Web Designer", profile.role);
    replaceExactText(document.body, "Available for hire", profile.availability);
    replaceMatchingText(document.body, "Designing websites that don't just look good, but actually work. I turn ideas into functional, user-friendly experiences, and I'm all about keeping it clean, simple, and fun. Let's make something awesome together.", profile.bio);
    document.querySelectorAll('a[href^="mailto:"], a[href*="yahoo.com"]').forEach((link) => {
      if (profile.email) {
        link.href = `mailto:${profile.email}`;
        link.textContent = profile.email;
      }
    });
    if (profile.email) replaceExactText(document.body, "robertstanley@yahoo.com", profile.email);
    if (profile.resumeUrl) document.querySelectorAll('a').forEach((link) => {
      if (link.textContent.trim() === "Resume") link.href = profile.resumeUrl;
    });
    setImageMatches("v6koUYxQNpRHR4Qlbyog588BAQI", profile.portrait);
  }

  function applyAppearance(content) {
    setImageMatches("zs919a76VN2FpkglNseVvMWSEJ4", content.appearance?.wallpaper);
  }

  function applySocials(content) {
    const socials = (content.socials || []).filter((item) => item.label && item.url);
    const instagram = socials.find((item) => item.id === "instagram");
    const x = socials.find((item) => item.id === "x");
    if (instagram?.url) document.querySelectorAll('a[href*="instagram.com"]').forEach((link) => link.href = instagram.url);
    if (x?.url) document.querySelectorAll('a[href*="x.com/"]').forEach((link) => link.href = x.url);

    document.querySelectorAll('[data-framer-name="Email + Socials"] [data-framer-name="Socials"]').forEach((section) => {
      section.classList.add("managed-social-section");
      section.innerHTML = `
        <p class="managed-social-heading">Socials</p>
        <div class="managed-social-list">
          ${socials.map((social) => `
            <a href="${escapeHtml(social.url)}" target="_blank" rel="noopener noreferrer">
              <span>/${escapeHtml(social.label)}</span><span aria-hidden="true">-&gt;</span>
            </a>
          `).join("")}
        </div>`;
    });
  }

  function startClocks() {
    const clocks = document.querySelectorAll('.framer-10ie8ns-container p');
    if (!clocks.length) return;
    const update = () => {
      const time = new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit" }).format(new Date());
      clocks.forEach((clock) => {
        clock.textContent = time;
        clock.style.visibility = "visible";
      });
    };
    update();
    window.setInterval(update, 30000);
  }

  function renderProjects(content) {
    if (!location.pathname.includes("/portfolio/" ) || location.pathname !== "/portfolio/index.html") return;
    const main = document.querySelector('main[data-framer-name^="Content Area"]');
    if (!main) return;
    const projects = (content.projects || []).filter((item) => item.visible !== false);
    main.innerHTML = `
      <h1 class="managed-project-heading">My Portfolio</h1>
      <div class="managed-project-grid">
        ${projects.map((project) => `
          <article class="managed-project-card">
            <img class="managed-project-image" loading="lazy" src="${escapeHtml(project.image)}" alt="${escapeHtml(project.title)}">
            <div class="managed-project-meta">
              <div>
                <h2 class="managed-project-title">${escapeHtml(project.title)}</h2>
                <p class="managed-project-description">${escapeHtml(project.description)}</p>
              </div>
              <a class="managed-button" href="${escapeHtml(project.url)}">See Project</a>
            </div>
          </article>
        `).join("")}
      </div>`;
  }

  function renderMusic(content) {
    if (location.pathname !== "/music/index.html") return;
    const main = document.querySelector('main[data-framer-name^="Content Area"]');
    if (!main) return;
    main.closest('[data-framer-name="Window"]')?.classList.add("managed-music-window");
    const tracks = (content.tracks || []).filter((item) => item.visible !== false);
    main.innerHTML = `
      <h1 class="managed-music-heading">Music</h1>
      <div class="managed-track-list">
        ${tracks.map((track) => `
          <article class="managed-track">
            <img loading="lazy" src="${escapeHtml(track.cover)}" alt="${escapeHtml(track.title)}">
            <div>
              <h2>${escapeHtml(track.title)}</h2>
              <p>${escapeHtml(track.artist)}</p>
              <audio controls preload="metadata" src="${escapeHtml(track.audio)}"></audio>
            </div>
          </article>
        `).join("")}
      </div>`;
  }

  async function loadContent() {
    const defaults = await fetch(DEFAULT_URL).then((response) => response.json());
    try {
      const response = await fetch("/api/content", { cache: "no-store" });
      if (!response.ok) return defaults;
      const payload = await response.json();
      return payload.content || defaults;
    } catch {
      return defaults;
    }
  }

  loadContent().then((content) => {
    applyProfile(content);
    applyAppearance(content);
    applySocials(content);
    renderProjects(content);
    renderMusic(content);
    startClocks();
    document.dispatchEvent(new CustomEvent("retro95:content-ready", { detail: content }));
  });
})();
