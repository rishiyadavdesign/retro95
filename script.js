const bios = document.querySelector("#bios");
const desktop = document.querySelector("#desktop");
const bootButton = document.querySelector("#boot");
const flash = document.querySelector(".boot-flash");
const dialogs = [...document.querySelectorAll(".win-dialog")];
const taskButtons = [...document.querySelectorAll(".task-button")];
let booted = false;
let topLayer = 6;

if (new URLSearchParams(window.location.search).has("desktop")) {
  booted = true;
  bios.hidden = true;
  desktop.hidden = false;
}

function bootDesktop() {
  if (booted) return;
  booted = true;
  bios.classList.add("booting");
  flash.classList.add("on");
  window.setTimeout(() => {
    bios.hidden = true;
    desktop.hidden = false;
  }, 360);
}

bootButton.addEventListener("click", bootDesktop);
document.addEventListener("keydown", (event) => {
  if (!booted && event.key === "Enter") bootDesktop();
  if (!booted && event.key.toLowerCase() === "f") {
    bootButton.firstElementChild.innerHTML = "Respect paid. <b>F</b>";
  }
});

function setActive(name) {
  taskButtons.forEach((button) => {
    const active = name === "home" ? button.hasAttribute("data-home") : button.dataset.dialog === name;
    button.classList.toggle("active", active);
  });
}

function openDialog(name) {
  const dialog = document.querySelector(`#dialog-${name}`);
  if (!dialog) return;
  dialog.hidden = false;
  dialog.style.zIndex = String(++topLayer);
  setActive(name);
}

document.addEventListener("click", (event) => {
  const opener = event.target.closest("[data-dialog]");
  if (opener) openDialog(opener.dataset.dialog);
  const closer = event.target.closest("[data-close]");
  if (closer) {
    closer.closest(".win-dialog").hidden = true;
    setActive("home");
  }
  if (event.target.closest("[data-home]")) {
    dialogs.forEach((dialog) => { dialog.hidden = true; });
    setActive("home");
  }
});

dialogs.forEach((dialog) => {
  dialog.addEventListener("pointerdown", () => {
    dialog.style.zIndex = String(++topLayer);
  });
});

document.querySelector(".contact-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const button = event.currentTarget.querySelector("button");
  button.textContent = "Message sent";
  window.setTimeout(() => { button.textContent = "Send"; }, 1600);
});

function updateClock() {
  document.querySelector("#clock").textContent = new Intl.DateTimeFormat([], {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());
}

updateClock();
window.setInterval(updateClock, 1000);
