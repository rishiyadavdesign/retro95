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

  const setLinkByText = (from, url) => {
    if (!url) return;
    document.querySelectorAll("a").forEach((link) => {
      if (normalizeText(link.textContent) === normalizeText(from)) link.href = url;
    });
  };

  function applyBranding(content) {
    const branding = content.branding || {};
    if (branding.browserTitle) document.title = branding.browserTitle;
    replaceMatchingText(document.body, "Retro95", branding.siteName);
    if (branding.logo) {
      document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]').forEach((link) => link.href = branding.logo);
      setImageMatches("l6n90Hmo9UTHeRLTaNTZRSoJBac", branding.logo);
    }
  }

  function applyDesktop(content) {
    const desktop = content.desktop || {};
    document.querySelectorAll("footer").forEach((footer) => {
      [["Home", desktop.homeLabel], ["Portfolio", desktop.portfolioLabel], ["Contact Me", desktop.contactLabel]]
        .forEach(([from, to]) => replaceMatchingText(footer, from, to));
    });
    const values = [
      ["My Computer", desktop.computerLabel],
      ["Built with Framer", desktop.builderLabel], ["Buy This Template", desktop.templateLabel],
      ["Music", desktop.musicLabel], ["Recycle Bin", desktop.binLabel]
    ];
    values.forEach(([from, to]) => replaceMatchingText(document.body, from, to));
  }

  function applyHome(content) {
    if (location.pathname !== "/landing/index.html" && location.pathname !== "/landing/") return;
    const home = content.home || {};
    setImageMatches("CY9nFVcElQuS0aRbAPoUP4Q5xU", home.backgroundImage);
    setImageMatches("o3GwZDT6le2sn51WJTUP4c60Jg", home.heroImage);
    setImageMatches("H5oK06Nb4Ox2XCK3VecPGFw3g", home.verticalBannerImage);
    setImageMatches("hB5DJxvF67UvRc6cAlRWb4sHM", home.taskbarMascotImage);
    document.querySelectorAll('img[src*="v6koUYxQNpRHR4Qlbyog588BAQI"]').forEach((image) => {
      image.style.objectPosition = home.profileImagePosition || "center";
    });
    setImageMatches("wTkoplegutxUSHEe4nWZHJGnHA", home.tool1Image);
    setImageMatches("X2BrzKqqCuoq69839mV6KzsQSJM", home.tool2Image);
    setImageMatches("xIgWtc7daPpvOLDuWTGn71xdOnQ", home.tool3Image);
    setImageMatches("jnYlTGKIz34DPhCuFhTQgRsOio", home.tool4Image);
    const setToolType = (name, type) => {
      document.querySelectorAll("p").forEach((label) => {
        if (normalizeText(label.textContent) !== name) return;
        const card = label.closest('[data-framer-name="Variant 1"]');
        const typeLabel = [...(card?.querySelectorAll("p") || [])].find((item) => item !== label);
        if (typeLabel && type) typeLabel.textContent = type;
      });
    };
    setToolType("Figma", home.tool1Type);
    setToolType("Illustrator", home.tool2Type);
    setToolType("Notion", home.tool3Type);
    setToolType("Framer", home.tool4Type);
    setLinkByText("View My Portfolio", home.portfolioUrl);
    setLinkByText("Got any questions? Contact me!", home.contactUrl);
    const values = [
      ["Web Design Services", home.heroTitle], ["Portfolio", home.portfolioNavLabel],
      ["Services", home.servicesNavLabel], ["Tools", home.toolsNavLabel], ["FAQ", home.faqNavLabel],
      ["Resume", home.resumeNavLabel], ["My Work", home.workHeading],
      ["Wanna see more? Check my portfolio page!", home.portfolioPrompt],
      ["View My Portfolio", home.portfolioButton], ["Web Design", home.service1Title],
      ["From wireframes to final designs, I’ll craft a site that’s visually stunning and easy to use.", home.service1Description],
      ["UI/UX Design", home.service2Title],
      ["Creating seamless, user-focused experiences that make every click count.", home.service2Description],
      ["Responsive Design", home.service3Title],
      ["Your site will look amazing on every device—desktop, tablet, or smartphone.", home.service3Description],
      ["Website Updates & Maintenance", home.service4Title],
      ["Already have a site? I can keep it fresh, functional, and glitch-free.", home.service4Description],
      ["Figma", home.tool1Name], ["Illustrator", home.tool2Name], ["Notion", home.tool3Name],
      ["Productivity Tool", home.tool3Type], ["Framer", home.tool4Name], ["Website Builder", home.tool4Type],
      ["How much do you charge for a website?", home.faq1],
      ["Do you offer revisions?", home.faq2], ["Will my website be mobile-friendly?", home.faq3],
      ["What do you need from me to get started?", home.faq4],
      ["Got any questions? Contact me!", home.contactCta]
    ];
    values.forEach(([from, to]) => replaceMatchingText(document.body, from, to));
  }

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
    const tracks = (content.tracks || []).filter((item) => item.visible !== false);
    const originals = [...document.querySelectorAll('[data-framer-name="Song 1"]')];

    const formatTime = (seconds) => {
      if (!Number.isFinite(seconds)) return "0:00";
      const minutes = Math.floor(seconds / 60);
      return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
    };

    const updateSong = (song, track, index) => {
      song.hidden = !track;
      if (!track) return;
      song.dataset.managedTrack = String(index);
      song.querySelectorAll("img").forEach((image) => {
        image.src = track.cover;
        image.alt = track.title;
        image.removeAttribute("srcset");
      });
      song.querySelectorAll("h2").forEach((heading) => heading.textContent = track.title);
      const details = song.querySelector('[data-framer-name="TItle + Artist"]');
      details?.querySelectorAll(":scope > p, :scope > div > p").forEach((artist) => artist.textContent = track.artist);
      const artist = details?.querySelector('.framer-x5acua p');
      if (artist) artist.textContent = track.artist;
      song.querySelectorAll("section").forEach((section) => section.style.opacity = "1");

      const audio = song.querySelector("audio");
      if (!audio) return;
      audio.pause();
      audio.autoplay = false;
      audio.src = track.audio;
      const player = audio.parentElement;
      const play = player?.querySelector('[aria-label="play audio"], [aria-label="pause audio"]');
      const time = player?.querySelector("p");
      const range = player?.querySelector('input[type="range"]');
      const refresh = () => {
        if (time) time.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
        if (range) {
          range.max = Number.isFinite(audio.duration) ? audio.duration : 0;
          range.value = audio.currentTime || 0;
        }
      };
      play?.addEventListener("click", () => audio.paused ? audio.play() : audio.pause());
      audio.addEventListener("play", () => play?.setAttribute("aria-label", "pause audio"));
      audio.addEventListener("pause", () => play?.setAttribute("aria-label", "play audio"));
      audio.addEventListener("loadedmetadata", refresh);
      audio.addEventListener("timeupdate", refresh);
      range?.addEventListener("input", () => { audio.currentTime = Number(range.value); });
      refresh();
    };

    originals.forEach((original) => {
      original.parentElement?.querySelectorAll('[data-managed-song-clone="true"]').forEach((clone) => clone.remove());
      updateSong(original, tracks[0], 0);
      tracks.slice(1).forEach((track, index) => {
        const clone = original.cloneNode(true);
        clone.dataset.managedSongClone = "true";
        clone.classList.add("managed-song-clone");
        original.parentElement?.append(clone);
        updateSong(clone, track, index + 1);
      });
    });
  }

  async function loadContent() {
    const defaults = await fetch(DEFAULT_URL).then((response) => response.json());
    try {
      const response = await fetch("/api/content", { cache: "no-store" });
      if (!response.ok) return defaults;
      const payload = await response.json();
      const stored = payload.content;
      if (!stored) return defaults;
      return {
        ...defaults,
        ...stored,
        branding: { ...defaults.branding, ...stored.branding },
        desktop: { ...defaults.desktop, ...stored.desktop },
        home: { ...defaults.home, ...stored.home },
        profile: { ...defaults.profile, ...stored.profile },
        appearance: { ...defaults.appearance, ...stored.appearance }
      };
    } catch {
      return defaults;
    }
  }

  loadContent().then((content) => {
    applyBranding(content);
    applyHome(content);
    applyDesktop(content);
    applyProfile(content);
    applyAppearance(content);
    applySocials(content);
    renderProjects(content);
    renderMusic(content);
    startClocks();
    document.dispatchEvent(new CustomEvent("retro95:content-ready", { detail: content }));
  });
})();
