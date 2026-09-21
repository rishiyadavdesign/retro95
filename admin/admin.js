(() => {
  const state = { content: null, defaults: null, dirty: false, configured: true };
  const loginView = document.querySelector("#login-view");
  const adminView = document.querySelector("#admin-view");
  const saveState = document.querySelector("#save-state");

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const getPath = (object, path) => path.split(".").reduce((value, key) => value?.[key], object);
  const setPath = (object, path, value) => {
    const keys = path.split(".");
    const last = keys.pop();
    const target = keys.reduce((value, key) => value[key] ||= {}, object);
    target[last] = value;
  };

  function setDirty(value = true) {
    state.dirty = value;
    saveState.textContent = value ? "Unpublished changes" : "All changes saved";
  }

  async function request(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
    return payload;
  }

  async function loadContent() {
    state.defaults = await fetch("/content/default-content.json").then((response) => response.json());
    const payload = await request("/api/content", { cache: "no-store" });
    state.configured = payload.configured !== false;
    state.content = clone(payload.content || state.defaults);
    render();
    if (!state.configured) saveState.textContent = "Storage setup required";
  }

  function renderFields() {
    document.querySelectorAll("[data-path]").forEach((input) => {
      input.value = getPath(state.content, input.dataset.path) ?? "";
    });
    const wallpaper = state.content.appearance?.wallpaper;
    document.querySelector("#wallpaper-preview").style.backgroundImage = wallpaper ? `url("${wallpaper.replace(/"/g, "%22")}")` : "none";
  }

  function renderList(kind) {
    const list = document.querySelector(`#${kind === "tracks" ? "tracks" : kind}-list`);
    const templateName = kind === "tracks" ? "track" : kind.slice(0, -1);
    const template = document.querySelector(`#${templateName}-template`);
    list.replaceChildren();
    (state.content[kind] || []).forEach((item, index) => {
      const card = template.content.firstElementChild.cloneNode(true);
      card.dataset.index = index;
      card.querySelector("[data-item-title]").textContent = item.title || item.label || `${templateName} ${index + 1}`;
      card.querySelectorAll("[data-field]").forEach((input) => {
        const value = item[input.dataset.field];
        if (input.type === "checkbox") input.checked = value !== false;
        else input.value = value ?? "";
      });
      list.append(card);
    });
  }

  function render() {
    renderFields();
    renderList("socials");
    renderList("projects");
    renderList("tracks");
    setDirty(false);
  }

  function addItem(kind) {
    const defaults = {
      socials: { id: `social-${Date.now()}`, label: "New link", url: "https://" },
      projects: { id: `project-${Date.now()}`, title: "New project", description: "", image: "", url: "/", visible: true },
      tracks: { id: `track-${Date.now()}`, title: "New track", artist: "", cover: "", audio: "", visible: true }
    };
    state.content[kind].push(defaults[kind]);
    renderList(kind);
    setDirty();
  }

  document.querySelector("#login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const error = document.querySelector("#login-error");
    error.textContent = "";
    try {
      await request("/api/login", { method: "POST", body: JSON.stringify({ password: document.querySelector("#password").value }) });
      loginView.hidden = true;
      adminView.hidden = false;
      await loadContent();
    } catch (failure) {
      error.textContent = failure.message;
    }
  });

  document.querySelector("#tabs").addEventListener("click", (event) => {
    const button = event.target.closest("[data-tab]");
    if (!button) return;
    document.querySelectorAll("[data-tab]").forEach((item) => item.classList.toggle("active", item === button));
    document.querySelectorAll("[data-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === button.dataset.tab));
  });

  document.addEventListener("input", (event) => {
    const input = event.target;
    if (input.dataset.path) {
      setPath(state.content, input.dataset.path, input.value);
      if (input.dataset.path === "appearance.wallpaper") renderFields();
      setDirty();
      return;
    }
    const card = input.closest("[data-kind]");
    if (!card || !input.dataset.field) return;
    const item = state.content[card.dataset.kind][Number(card.dataset.index)];
    item[input.dataset.field] = input.type === "checkbox" ? input.checked : input.value;
    const title = card.querySelector("[data-item-title]");
    title.textContent = item.title || item.label || "Untitled";
    setDirty();
  });

  document.addEventListener("click", (event) => {
    const add = event.target.closest("[data-add]");
    if (add) return addItem(add.dataset.add);
    const card = event.target.closest("[data-kind]");
    if (!card) return;
    const kind = card.dataset.kind;
    const index = Number(card.dataset.index);
    if (event.target.closest("[data-remove]")) {
      if (!confirm("Remove this item?")) return;
      state.content[kind].splice(index, 1);
      renderList(kind);
      setDirty();
      return;
    }
    const move = event.target.closest("[data-move]");
    if (!move) return;
    const next = move.dataset.move === "up" ? index - 1 : index + 1;
    if (next < 0 || next >= state.content[kind].length) return;
    [state.content[kind][index], state.content[kind][next]] = [state.content[kind][next], state.content[kind][index]];
    renderList(kind);
    setDirty();
  });

  document.querySelector("#save-button").addEventListener("click", async () => {
    const button = document.querySelector("#save-button");
    button.disabled = true;
    button.textContent = "Publishing...";
    try {
      const payload = await request("/api/content", { method: "PUT", body: JSON.stringify(state.content) });
      state.content = payload.content;
      setDirty(false);
      button.textContent = "Published";
      setTimeout(() => button.textContent = "Publish changes", 1200);
    } catch (failure) {
      alert(failure.message === "Storage is not configured" ? "Connect Upstash Redis and add ADMIN_PASSWORD plus ADMIN_SECRET in Vercel first." : failure.message);
      button.textContent = "Publish changes";
    } finally {
      button.disabled = false;
    }
  });

  document.querySelector("#reset-button").addEventListener("click", () => {
    if (!confirm("Restore all fields to their original values?")) return;
    state.content = clone(state.defaults);
    render();
    setDirty();
  });

  document.querySelector("#logout-button").addEventListener("click", async () => {
    await request("/api/logout", { method: "POST" });
    location.reload();
  });

  window.addEventListener("beforeunload", (event) => {
    if (!state.dirty) return;
    event.preventDefault();
    event.returnValue = "";
  });

  request("/api/session", { cache: "no-store" }).then(async ({ authenticated }) => {
    loginView.hidden = authenticated;
    adminView.hidden = !authenticated;
    if (authenticated) await loadContent();
  }).catch(() => {
    loginView.hidden = false;
    document.querySelector("#login-error").textContent = "Admin API is unavailable on this deployment.";
  });
})();

