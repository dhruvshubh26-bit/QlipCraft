let selectedCategory = "Technology";
let loaderTimer;
const topic = document.getElementById("topic-input");
const createCard = document.getElementById("create-card");
const selectedName = document.getElementById("selected-name");
const selectedIcon = document.getElementById("selected-icon");
const loader = document.getElementById("loader");
const loaderText = document.getElementById("loader-text");
const generateButton = document.getElementById("generate-button");
const modal = document.getElementById("result-modal");
const modalVideo = document.getElementById("modal-video");
const modalMeta = document.getElementById("modal-meta");

function selectCommunity(name, scrollToCreate = false) {
  const selectedPill = [...document.querySelectorAll(".pill")].find((pill) => pill.dataset.community === name);
  if (!selectedPill) return;
  document.querySelectorAll(".pill").forEach((pill) => pill.classList.toggle("active", pill === selectedPill));
  selectedCategory = name;
  selectedName.textContent = name;
  selectedIcon.innerHTML = selectedPill.innerHTML.split("<span>")[0];
  if (scrollToCreate) createCard.scrollIntoView({ behavior: "smooth", block: "center" });
}

function setLoading(active) {
  generateButton.disabled = active;
  loader.classList.toggle("visible", active);
  clearInterval(loaderTimer);
  if (!active) return;
  const steps = ["Generating script...", "Writing voiceover...", "Picking visuals...", "Composing video..."];
  let index = 0;
  loaderText.textContent = steps[index];
  loaderTimer = setInterval(() => {
    index = (index + 1) % steps.length;
    loaderText.textContent = steps[index];
  }, 2500);
}

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  modalVideo.pause();
  modalVideo.removeAttribute("src");
  modalVideo.load();
}

function openModal(data) {
  modalVideo.src = `/output/${encodeURIComponent(data.id)}.mp4`;
  modalMeta.replaceChildren();
  [["Hook 1", data.hook1], ["Hook 2", data.hook2], ["Caption", data.caption], ["Hashtags", data.hashtags]].forEach(([label, value]) => {
    const row = document.createElement("p");
    row.textContent = `${label}: ${value || ""}`;
    modalMeta.appendChild(row);
  });
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

async function generateQlip() {
  const value = topic.value.trim();
  if (!value) { alert("Please enter a topic"); topic.focus(); return; }
  setLoading(true);
  try {
    const form = new FormData();
    form.append("topic", value);
    form.append("community", selectedCategory);
    const response = await fetch("/generate", { method: "POST", body: form });
    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data.error || "Generation failed.");
    openModal(data);
    setTimeout(() => window.location.reload(), 800);
  } catch (error) {
    setLoading(false);
    alert(`Error: ${error.message}`);
  }
}

document.querySelectorAll(".pill").forEach((pill) => pill.addEventListener("click", () => selectCommunity(pill.dataset.community)));
document.querySelectorAll(".story").forEach((story) => story.addEventListener("click", () => selectCommunity(story.dataset.community, true)));
document.querySelectorAll("[data-message]").forEach((button) => button.addEventListener("click", () => alert(button.dataset.message)));
document.querySelectorAll("[data-nav]").forEach((button) => button.addEventListener("click", () => {
  const destination = button.dataset.nav;
  if (destination === "top") window.scrollTo({ top: 0, behavior: "smooth" });
  if (destination === "recent") document.getElementById("recent").scrollIntoView({ behavior: "smooth" });
  if (destination === "categories") document.getElementById("categories").scrollIntoView({ behavior: "smooth" });
  if (destination === "search") { createCard.scrollIntoView({ behavior: "smooth" }); topic.focus(); }
}));
document.getElementById("plus-button").addEventListener("click", () => { window.scrollTo({ top: 0, behavior: "smooth" }); setTimeout(() => { createCard.scrollIntoView({ behavior: "smooth" }); topic.focus(); }, 200); });
generateButton.addEventListener("click", generateQlip);
topic.addEventListener("keydown", (event) => { if (event.key === "Enter") generateQlip(); });
document.getElementById("modal-close").addEventListener("click", closeModal);
modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && modal.classList.contains("open")) closeModal(); });
