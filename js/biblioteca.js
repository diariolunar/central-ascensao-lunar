import {
  db,
  collection,
  getDocs,
  query,
  orderBy
} from "./firebase.js";

const publicTextsList = document.getElementById("publicTextsList");

const publicTextSearch = document.getElementById("publicTextSearch");
const publicTextTypeFilter = document.getElementById("publicTextTypeFilter");

const publicTextModal = document.getElementById("publicTextModal");

const publicTextModalTitle = document.getElementById("publicTextModalTitle");
const publicTextModalMeta = document.getElementById("publicTextModalMeta");
const publicTextModalContent = document.getElementById("publicTextModalContent");

let allTexts = [];

init();

async function init() {
  setupModalEvents();
  setupFilters();
  await loadTexts();
}

/* =========================================================
   EVENTOS
========================================================= */

function setupModalEvents() {
  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", () => {
      closeModal(button.dataset.closeModal);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal("publicTextModal");
    }
  });
}

function setupFilters() {
  publicTextSearch.addEventListener("input", renderTexts);
  publicTextTypeFilter.addEventListener("change", renderTexts);
}

/* =========================================================
   CARREGAMENTO DOS TEXTOS
========================================================= */

async function loadTexts() {
  try {
    publicTextsList.innerHTML = `
      <div class="empty-state">
        Carregando biblioteca...
      </div>
    `;

    const q = query(
      collection(db, "texts"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    allTexts = [];

    snapshot.forEach((docItem) => {
      allTexts.push({
        id: docItem.id,
        ...docItem.data()
      });
    });

    renderTexts();
  } catch (error) {
    console.error(error);

    publicTextsList.innerHTML = `
      <div class="empty-state">
        Erro ao carregar biblioteca.
      </div>
    `;
  }
}

/* =========================================================
   RENDERIZAÇÃO
========================================================= */

function renderTexts() {
  const search = publicTextSearch.value
    .toLowerCase()
    .trim();

  const typeFilter = publicTextTypeFilter.value;

  const filteredTexts = allTexts.filter((text) => {
    const searchable = `
      ${text.title || ""}
      ${text.memberName || ""}
      ${text.type || ""}
      ${text.status || ""}
      ${text.content || ""}
    `.toLowerCase();

    const matchesSearch = searchable.includes(search);

    const matchesType = !typeFilter || text.type === typeFilter;

    return matchesSearch && matchesType;
  });

  if (!filteredTexts.length) {
    publicTextsList.innerHTML = `
      <div class="empty-state">
        Nenhum texto encontrado.
      </div>
    `;

    return;
  }

  publicTextsList.innerHTML = filteredTexts
    .map(createPublicTextCardHTML)
    .join("");

  attachCardEvents();
}

function attachCardEvents() {
  document.querySelectorAll(".public-text-card").forEach((card) => {
    card.addEventListener("click", () => {
      const textId = card.dataset.id;

      const text = allTexts.find((item) => item.id === textId);

      if (!text) return;

      openText(text);
    });
  });
}

function createPublicTextCardHTML(text) {
  return `
    <article
      class="text-item public-text-card"
      data-id="${text.id}"
    >

      <div class="badges-row">
        <span class="badge">
          ${escapeHTML(text.type || "Texto")}
        </span>

        <span class="badge ${getStatusClass(text.status)}">
          ${escapeHTML(text.status || "Sem status")}
        </span>
      </div>

      <strong class="viewer-title">
        ${escapeHTML(text.title || "Sem título")}
      </strong>

      <p>
        <strong>Autor:</strong>
        ${escapeHTML(text.memberName || "Não informado")}
      </p>

      <p>
        ${escapeHTML(createPreview(text.content || ""))}
      </p>

    </article>
  `;
}

/* =========================================================
   MODAL DE LEITURA
========================================================= */

function openText(text) {
  publicTextModalTitle.textContent =
    text.title || "Sem título";

  publicTextModalMeta.textContent =
    `${text.memberName || "Autor não informado"} • ${text.type || "Texto"} • ${text.status || "Sem status"}`;

  publicTextModalContent.innerHTML = `
    <div class="viewer-content">
      ${formatText(text.content || "Sem conteúdo.")}
    </div>
  `;

  openModal("publicTextModal");
}

function openModal(id) {
  const modal = document.getElementById(id);

  if (modal) {
    modal.classList.remove("hidden");
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);

  if (modal) {
    modal.classList.add("hidden");
  }
}

/* =========================================================
   HELPERS
========================================================= */

function createPreview(text) {
  const cleanText = String(text)
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleanText.length <= 240) {
    return cleanText;
  }

  return `${cleanText.slice(0, 240)}...`;
}

function formatText(text) {
  return escapeHTML(text)
    .replace(/\n/g, "<br>");
}

function getStatusClass(status) {
  if (status === "Comentado") return "green";
  if (status === "Lido") return "blue";
  if (status === "Pendente") return "purple";
  if (status === "Revisado") return "green";
  if (status === "Devolvido") return "red";

  return "";
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}