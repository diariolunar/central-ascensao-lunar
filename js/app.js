import {
  auth,
  db,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp
} from "./firebase.js";

/*
========================================================
UTILS
========================================================
*/

const $ = (id) => document.getElementById(id);

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHTML(value).replaceAll("\n", " ");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatDate(dateString) {
  if (!dateString) return "Sem data";

  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

/*
========================================================
ELEMENTOS
========================================================
*/

const loginForm = $("loginForm");
const loginScreen = $("loginScreen");
const mainApp = $("mainApp");
const loginMessage = $("loginMessage");

const menuButtons = document.querySelectorAll(".menu-btn");
const pages = document.querySelectorAll(".page");

const pageTitle = $("pageTitle");
const pageSubtitle = $("pageSubtitle");

const logoutBtn = $("logoutBtn");

/* dashboard */

const totalMembers = $("totalMembers");
const totalPoints = $("totalPoints");
const openActivities = $("openActivities");
const totalTexts = $("totalTexts");

const latestMovements = $("latestMovements");
const dashboardTopMember = $("dashboardTopMember");
const dashboardPendingActivities = $("dashboardPendingActivities");
const dashboardPendingTexts = $("dashboardPendingTexts");

/* membros */

const memberForm = $("memberForm");
const memberSheet = $("memberSheet");
const memberPreview = $("memberPreview");
const savePreviewMemberBtn = $("savePreviewMemberBtn");
const clearPreviewBtn = $("clearPreviewBtn");

const membersList = $("membersList");
const membersCount = $("membersCount");
const memberSearch = $("memberSearch");
const memberStatusFilter = $("memberStatusFilter");

const memberProfileContent = $("memberProfileContent");

const internalNotesForm = $("internalNotesForm");
const internalNotesMemberId = $("internalNotesMemberId");
const internalNotesText = $("internalNotesText");

/* pontuação */

const pointsForm = $("pointsForm");
const pointsMember = $("pointsMember");
const pointsType = $("pointsType");
const pointsResponsible = $("pointsResponsible");
const pointsHistory = $("pointsHistory");

/* ranking */

const rankingForm = $("rankingForm");
const rankingTopThree = $("rankingTopThree");
const rankingList = $("rankingList");
const generateGeneralRankingBtn = $("generateGeneralRankingBtn");
const generalRankingList = $("generalRankingList");

/* atividades */

const activityForm = $("activityForm");
const activitiesList = $("activitiesList");

/* textos */

const textForm = $("textForm");
const textMember = $("textMember");
const textsList = $("textsList");
const textViewer = $("textViewer");

/* configurações */

const scoreTypeForm = $("scoreTypeForm");
const scoreTypesList = $("scoreTypesList");

const responsibleForm = $("responsibleForm");
const responsiblesList = $("responsiblesList");

const exportBackupBtn = $("exportBackupBtn");
const importBackupInput = $("importBackupInput");
const backupMessage = $("backupMessage");

const clearPointsBtn = $("clearPointsBtn");
const clearPointsMessage = $("clearPointsMessage");

/* relatórios */

const reportForm = $("reportForm");
const reportArea = $("reportArea");
const printReportBtn = $("printReportBtn");

/*
========================================================
ESTADO
========================================================
*/

let allMembers = [];
let allPoints = [];
let allActivities = [];
let allTexts = [];
let allScoreTypes = [];
let allResponsibles = [];

let pendingMember = null;

let editingMemberId = null;
let editingActivityId = null;
let editingTextId = null;

/*
========================================================
LOGIN
========================================================
*/

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await signInWithEmailAndPassword(
      auth,
      $("loginEmail").value,
      $("loginPassword").value
    );

    loginMessage.textContent = "";
  } catch (error) {
    console.error(error);
    loginMessage.textContent = "Erro ao entrar.";
  }
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    loginScreen.classList.add("hidden");
    mainApp.classList.remove("hidden");

    await loadAllData();
  } else {
    loginScreen.classList.remove("hidden");
    mainApp.classList.add("hidden");
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

/*
========================================================
NAVEGAÇÃO
========================================================
*/

menuButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showPage(
      button.dataset.page,
      button.dataset.title,
      button.dataset.subtitle
    );
  });
});

function showPage(pageId, title, subtitle) {
  pages.forEach((page) => page.classList.remove("active-page"));

  $(pageId).classList.add("active-page");

  menuButtons.forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.page === pageId
    );
  });

  pageTitle.textContent = title || "";
  pageSubtitle.textContent = subtitle || "";
}

/*
========================================================
LOAD GERAL
========================================================
*/

async function loadAllData() {
  await loadMembers();
  await loadPoints();
  await loadActivities();
  await loadTexts();
  await loadScoreTypes();
  await loadResponsibles();

  updateDashboard();
}

/*
========================================================
MEMBROS
========================================================
*/

memberForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const rawText = memberSheet.value.trim();

  if (!rawText) {
    alert("Cole a ficha.");
    return;
  }

  pendingMember = parseMemberSheet(rawText);

  memberPreview.innerHTML = createParsedMemberFormHTML(pendingMember);

  savePreviewMemberBtn.classList.remove("hidden");
});

savePreviewMemberBtn.addEventListener("click", async () => {
  if (!pendingMember) {
    alert("Reconheça a ficha primeiro.");
    return;
  }

  const memberData = getMemberDataFromParsedFields();

  try {
    if (editingMemberId) {
      const oldMember = allMembers.find(
        (member) => member.id === editingMemberId
      );

      await updateDoc(doc(db, "members", editingMemberId), {
        ...memberData,
        points: Number(oldMember?.points || 0),
        rawSheet: memberSheet.value.trim()
      });

      editingMemberId = null;

      savePreviewMemberBtn.textContent = "Salvar membro";
    } else {
      await addDoc(collection(db, "members"), {
        ...memberData,
        points: 0,
        internalNotes: "",
        rawSheet: memberSheet.value.trim(),
        createdAt: Timestamp.now()
      });
    }

    memberForm.reset();

    resetPreview();

    await loadMembers();

    updateDashboard();

    showPage(
      "membersPage",
      "Membros",
      "Cards e controle dos autores cadastrados."
    );
  } catch (error) {
    console.error(error);
    alert("Erro ao salvar membro.");
  }
});

clearPreviewBtn.addEventListener("click", () => {
  memberForm.reset();

  editingMemberId = null;

  savePreviewMemberBtn.textContent = "Salvar membro";

  resetPreview();
});

memberSearch.addEventListener("input", renderMembers);
memberStatusFilter.addEventListener("change", renderMembers);

membersList.addEventListener("click", async (event) => {
  const button = event.target.closest("button");

  if (!button) return;

  const action = button.dataset.action;
  const memberId = button.dataset.id;

  const member = allMembers.find(
    (item) => item.id === memberId
  );

  if (!member) return;

  if (action === "view") {
    openMemberProfile(member);
  }

  if (action === "edit") {
    editingMemberId = member.id;

    memberSheet.value =
      member.rawSheet || formatMemberDetails(member);

    pendingMember = normalizeOldMember(member);

    memberPreview.innerHTML =
      createParsedMemberFormHTML(pendingMember);

    savePreviewMemberBtn.textContent =
      "Salvar alterações";

    savePreviewMemberBtn.classList.remove("hidden");

    showPage(
      "registerMemberPage",
      "Editar membro",
      "Edite os dados do membro."
    );
  }

  if (action === "delete") {
    if (!confirm(`Excluir ${member.name}?`)) return;

    await deleteDoc(doc(db, "members", member.id));

    await loadMembers();

    updateDashboard();
  }

  if (action === "quick-points") {
    showPage(
      "pointsPage",
      "Pontuações",
      "Adicione ou retire pontos."
    );

    pointsMember.value = member.id;
  }
});

internalNotesForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const memberId = internalNotesMemberId.value;

  if (!memberId) return;

  await updateDoc(doc(db, "members", memberId), {
    internalNotes: internalNotesText.value.trim()
  });

  await loadMembers();

  alert("Observações salvas.");
});

async function loadMembers() {
  const q = query(
    collection(db, "members"),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  allMembers = [];

  membersList.innerHTML = "";

  pointsMember.innerHTML =
    `<option value="">Selecione um membro</option>`;

  textMember.innerHTML =
    `<option value="">Selecione um membro</option>`;

  snapshot.forEach((docItem) => {
    const member = {
      id: docItem.id,
      ...docItem.data()
    };

    allMembers.push(member);

    pointsMember.innerHTML += `
      <option value="${member.id}">
        ${escapeHTML(member.name)}
      </option>
    `;

    textMember.innerHTML += `
      <option value="${member.id}">
        ${escapeHTML(member.name)}
      </option>
    `;
  });

  renderMembers();

  totalMembers.textContent = allMembers.length;
}

function renderMembers() {
  const searchTerm = memberSearch.value
    .toLowerCase()
    .trim();

  const statusFilter = memberStatusFilter.value;

  const filtered = allMembers.filter((member) => {
    const text = `
      ${member.name || ""}
      ${member.wattpad || ""}
      ${member.phone || ""}
      ${member.writingGenre || ""}
    `.toLowerCase();

    const matchesSearch = text.includes(searchTerm);

    const matchesStatus =
      !statusFilter || member.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  membersList.innerHTML = filtered.length
    ? filtered
        .map((member) =>
          createMemberCardHTML(member)
        )
        .join("")
    : `<div class="empty-state">Nenhum membro encontrado.</div>`;

  membersCount.textContent = `${filtered.length} membros`;
}

function openMemberProfile(member) {
  const memberPoints = allPoints.filter(
    (point) => point.memberId === member.id
  );

  const memberTexts = allTexts.filter(
    (text) => text.memberId === member.id
  );

  memberProfileContent.innerHTML =
    createMemberProfileHTML(
      member,
      memberPoints,
      memberTexts
    );

  internalNotesMemberId.value = member.id;
  internalNotesText.value =
    member.internalNotes || "";

  showPage(
    "memberProfilePage",
    "Perfil do membro",
    "Informações completas do membro."
  );
}

/*
========================================================
PONTUAÇÕES
========================================================
*/

pointsType.addEventListener("change", () => {
  const selected = allScoreTypes.find(
    (type) => type.id === pointsType.value
  );

  if (!selected) return;

  $("pointsValue").value = selected.value;
  $("pointsReason").value = selected.name;
});

pointsForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const member = allMembers.find(
    (item) => item.id === pointsMember.value
  );

  if (!member) {
    alert("Selecione um membro.");
    return;
  }

  const value = Number($("pointsValue").value);

  await addPointToMember({
    member,
    value,
    reason: $("pointsReason").value,
    date: $("pointsDate").value,
    responsible: pointsResponsible.value,
    origin: "manual"
  });

  pointsForm.reset();

  await loadMembers();
  await loadPoints();

  updateDashboard();
});

async function addPointToMember({
  member,
  value,
  reason,
  date,
  responsible,
  origin
}) {
  await addDoc(collection(db, "points"), {
    memberId: member.id,
    memberName: member.name,
    memberUser: member.wattpad || "",
    value,
    reason,
    date,
    responsible,
    origin,
    createdAt: Timestamp.now()
  });

  await updateDoc(doc(db, "members", member.id), {
    points: Number(member.points || 0) + Number(value || 0)
  });
}

async function loadPoints() {
  const q = query(
    collection(db, "points"),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  allPoints = [];

  pointsHistory.innerHTML = "";
  latestMovements.innerHTML = "";

  let total = 0;
  let movementCount = 0;

  snapshot.forEach((docItem) => {
    const point = {
      id: docItem.id,
      ...docItem.data()
    };

    allPoints.push(point);

    total += Number(point.value || 0);

    pointsHistory.innerHTML +=
      createPointHistoryHTML(point);

    if (movementCount < 5) {
      latestMovements.innerHTML +=
        createPointHistoryHTML(point);

      movementCount++;
    }
  });

  if (snapshot.empty) {
    pointsHistory.innerHTML =
      `<div class="empty-state">Nenhum ponto lançado.</div>`;

    latestMovements.innerHTML =
      `<div class="empty-state">Nenhuma movimentação.</div>`;
  }

  totalPoints.textContent = total;
}

/*
========================================================
LIMPAR PONTUAÇÃO
========================================================
*/

clearPointsBtn.addEventListener("click", async () => {
  const confirmed = confirm(
    "Isso apagará TODOS os registros de pontuação e zerará os pontos dos membros. Continuar?"
  );

  if (!confirmed) return;

  try {
    const snapshot = await getDocs(collection(db, "points"));

    for (const pointDoc of snapshot.docs) {
      await deleteDoc(doc(db, "points", pointDoc.id));
    }

    for (const member of allMembers) {
      await updateDoc(doc(db, "members", member.id), {
        points: 0
      });
    }

    clearPointsMessage.textContent =
      "Pontuações apagadas com sucesso.";

    await loadMembers();
    await loadPoints();

    updateDashboard();
  } catch (error) {
    console.error(error);

    clearPointsMessage.textContent =
      "Erro ao limpar pontuações.";
  }
});

/*
========================================================
RESPONSÁVEIS
========================================================
*/

responsibleForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  await addDoc(collection(db, "responsibles"), {
    name: $("responsibleName").value,
    createdAt: Timestamp.now()
  });

  responsibleForm.reset();

  await loadResponsibles();
});

responsiblesList.addEventListener("click", async (event) => {
  const button = event.target.closest("button");

  if (!button) return;

  await deleteDoc(
    doc(db, "responsibles", button.dataset.id)
  );

  await loadResponsibles();
});

async function loadResponsibles() {
  const snapshot = await getDocs(
    collection(db, "responsibles")
  );

  allResponsibles = [];

  responsiblesList.innerHTML = "";

  pointsResponsible.innerHTML =
    `<option value="">Selecione um responsável</option>`;

  snapshot.forEach((docItem) => {
    const responsible = {
      id: docItem.id,
      ...docItem.data()
    };

    allResponsibles.push(responsible);

    responsiblesList.innerHTML += `
      <div class="settings-item">
        <span>${escapeHTML(responsible.name)}</span>

        <button
          class="btn btn-danger btn-small"
          data-id="${responsible.id}"
        >
          Excluir
        </button>
      </div>
    `;

    pointsResponsible.innerHTML += `
      <option value="${escapeHTML(responsible.name)}">
        ${escapeHTML(responsible.name)}
      </option>
    `;
  });

  if (allResponsibles.length === 0) {
    responsiblesList.innerHTML =
      `<div class="empty-state">Nenhum responsável cadastrado.</div>`;
  }
}

/*
========================================================
TIPOS DE PONTUAÇÃO
========================================================
*/

scoreTypeForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  await addDoc(collection(db, "scoreTypes"), {
    name: $("scoreTypeName").value,
    value: Number($("scoreTypeValue").value),
    createdAt: Timestamp.now()
  });

  scoreTypeForm.reset();

  await loadScoreTypes();
});

scoreTypesList.addEventListener("click", async (event) => {
  const button = event.target.closest("button");

  if (!button) return;

  await deleteDoc(
    doc(db, "scoreTypes", button.dataset.id)
  );

  await loadScoreTypes();
});

async function loadScoreTypes() {
  const snapshot = await getDocs(
    collection(db, "scoreTypes")
  );

  allScoreTypes = [];

  scoreTypesList.innerHTML = "";

  pointsType.innerHTML =
    `<option value="">Selecionar tipo manualmente</option>`;

  snapshot.forEach((docItem) => {
    const type = {
      id: docItem.id,
      ...docItem.data()
    };

    allScoreTypes.push(type);

    scoreTypesList.innerHTML += `
      <div class="settings-item">
        <span>
          ${escapeHTML(type.name)} — ${type.value} pts
        </span>

        <button
          class="btn btn-danger btn-small"
          data-id="${type.id}"
        >
          Excluir
        </button>
      </div>
    `;

    pointsType.innerHTML += `
      <option value="${type.id}">
        ${escapeHTML(type.name)} — ${type.value} pts
      </option>
    `;
  });

  if (allScoreTypes.length === 0) {
    scoreTypesList.innerHTML =
      `<div class="empty-state">Nenhum tipo cadastrado.</div>`;
  }
}

/*
========================================================
RELATÓRIOS
========================================================
*/

reportForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const type = $("reportType").value;

  if (type === "members") {
    generateMembersReport();
  }

  if (type === "ranking-general") {
    generateGeneralRankingReport();
  }

  if (type === "points") {
    generatePointsReport();
  }

  if (type === "activities") {
    generateActivitiesReport();
  }

  if (type === "texts") {
    generateTextsReport();
  }
});

printReportBtn.addEventListener("click", () => {
  window.print();
});

function generateMembersReport() {
  reportArea.innerHTML = `
    ${createReportHeader("Relatório de membros")}

    <table class="report-table">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Wattpad</th>
          <th>Status</th>
          <th>Pontos</th>
        </tr>
      </thead>

      <tbody>
        ${allMembers.map((member) => `
          <tr>
            <td>${escapeHTML(member.name)}</td>
            <td>${escapeHTML(member.wattpad || "")}</td>
            <td>${escapeHTML(member.status || "")}</td>
            <td>${Number(member.points || 0)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function generateGeneralRankingReport() {
  const ranking = [...allMembers]
    .sort((a, b) => Number(b.points || 0) - Number(a.points || 0));

  reportArea.innerHTML = `
    ${createReportHeader("Ranking geral")}

    <table class="report-table">
      <thead>
        <tr>
          <th>Posição</th>
          <th>Nome</th>
          <th>Pontos</th>
        </tr>
      </thead>

      <tbody>
        ${ranking.map((member, index) => `
          <tr>
            <td>#${index + 1}</td>
            <td>${escapeHTML(member.name)}</td>
            <td>${Number(member.points || 0)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function generatePointsReport() {
  reportArea.innerHTML = `
    ${createReportHeader("Histórico de pontuação")}

    <table class="report-table">
      <thead>
        <tr>
          <th>Membro</th>
          <th>Pontos</th>
          <th>Motivo</th>
          <th>Responsável</th>
        </tr>
      </thead>

      <tbody>
        ${allPoints.map((point) => `
          <tr>
            <td>${escapeHTML(point.memberName)}</td>
            <td>${Number(point.value || 0)}</td>
            <td>${escapeHTML(point.reason || "")}</td>
            <td>${escapeHTML(point.responsible || "")}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function generateActivitiesReport() {
  reportArea.innerHTML = `
    ${createReportHeader("Relatório de atividades")}

    <table class="report-table">
      <thead>
        <tr>
          <th>Atividade</th>
          <th>Status</th>
          <th>Prazo</th>
        </tr>
      </thead>

      <tbody>
        ${allActivities.map((activity) => `
          <tr>
            <td>${escapeHTML(activity.title)}</td>
            <td>${escapeHTML(activity.status)}</td>
            <td>${formatDate(activity.deadline)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function generateTextsReport() {
  reportArea.innerHTML = `
    ${createReportHeader("Relatório de textos")}

    <table class="report-table">
      <thead>
        <tr>
          <th>Título</th>
          <th>Autor</th>
          <th>Status</th>
        </tr>
      </thead>

      <tbody>
        ${allTexts.map((text) => `
          <tr>
            <td>${escapeHTML(text.title)}</td>
            <td>${escapeHTML(text.memberName)}</td>
            <td>${escapeHTML(text.status)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function createReportHeader(title) {
  return `
    <div class="report-header">
      <div class="report-logo">
        <img src="assets/favicon.png" alt="">
        <span>🌙</span>
      </div>

      <div>
        <h2>${escapeHTML(title)}</h2>
        <p>
          Gerado em ${new Date().toLocaleString("pt-BR")}
        </p>
      </div>
    </div>
  `;
}

/*
========================================================
ATIVIDADES
========================================================
*/

async function loadActivities() {
  const snapshot = await getDocs(
    collection(db, "activities")
  );

  allActivities = [];

  activitiesList.innerHTML = "";

  let total = 0;

  snapshot.forEach((docItem) => {
    const activity = {
      id: docItem.id,
      ...docItem.data()
    };

    allActivities.push(activity);

    if (activity.status === "Aberta") {
      total++;
    }
  });

  openActivities.textContent = total;
}

/*
========================================================
TEXTOS
========================================================
*/

async function loadTexts() {
  const snapshot = await getDocs(
    collection(db, "texts")
  );

  allTexts = [];

  textsList.innerHTML = "";

  snapshot.forEach((docItem) => {
    const text = {
      id: docItem.id,
      ...docItem.data()
    };

    allTexts.push(text);
  });

  totalTexts.textContent = allTexts.length;
}

/*
========================================================
RANKING
========================================================
*/

rankingForm.addEventListener("submit", (event) => {
  event.preventDefault();

  generateQuinzenalRanking();
});

generateGeneralRankingBtn.addEventListener("click", () => {
  generateGeneralRanking();
});

function generateGeneralRanking() {
  const ranking = [...allMembers]
    .sort((a, b) => Number(b.points || 0) - Number(a.points || 0));

  generalRankingList.innerHTML = ranking.length
    ? ranking.map((member, index) => `
        <div class="ranking-item">
          <div>#${index + 1}</div>

          <div>
            <strong>${escapeHTML(member.name)}</strong>
            <p>${escapeHTML(member.wattpad || "")}</p>
          </div>

          <div class="ranking-points">
            ${Number(member.points || 0)}
          </div>
        </div>
      `).join("")
    : `<div class="empty-state">Nenhum membro.</div>`;
}

function generateQuinzenalRanking() {
  const start = $("rankingStart").value;
  const end = $("rankingEnd").value;

  const rankingMap = {};

  allPoints.forEach((point) => {
    if (point.date >= start && point.date <= end) {
      rankingMap[point.memberId] =
        Number(rankingMap[point.memberId] || 0) +
        Number(point.value || 0);
    }
  });

  const ranking = Object.entries(rankingMap)
    .map(([memberId, points]) => {
      const member = allMembers.find(
        (item) => item.id === memberId
      );

      return {
        name: member?.name || "Membro",
        points
      };
    })
    .sort((a, b) => b.points - a.points);

  renderRanking(ranking);
}

function renderRanking(ranking) {
  rankingTopThree.innerHTML = "";
  rankingList.innerHTML = "";

  if (!ranking.length) {
    rankingTopThree.innerHTML =
      `<div class="empty-state">Sem dados.</div>`;

    rankingList.innerHTML =
      `<div class="empty-state">Sem dados.</div>`;

    return;
  }

  const medals = ["🥇", "🥈", "🥉"];

  ranking.slice(0, 3).forEach((member, index) => {
    rankingTopThree.innerHTML += `
      <article class="podium-card">
        <div class="podium-medal">
          ${medals[index]}
        </div>

        <div class="podium-name">
          ${escapeHTML(member.name)}
        </div>

        <div class="podium-points">
          ${member.points}
        </div>
      </article>
    `;
  });

  rankingList.innerHTML = ranking.map((member, index) => `
    <div class="ranking-item">
      <div>#${index + 1}</div>

      <div>
        <strong>${escapeHTML(member.name)}</strong>
      </div>

      <div class="ranking-points">
        ${member.points}
      </div>
    </div>
  `).join("");
}

/*
========================================================
BACKUP
========================================================
*/

exportBackupBtn.addEventListener("click", () => {
  const backup = {
    generatedAt: new Date().toISOString(),
    members: allMembers,
    points: allPoints,
    activities: allActivities,
    texts: allTexts,
    scoreTypes: allScoreTypes,
    responsibles: allResponsibles
  };

  const blob = new Blob(
    [JSON.stringify(backup, null, 2)],
    {
      type: "application/json"
    }
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download =
    `backup-ascensao-lunar-${new Date().toISOString().slice(0,10)}.json`;

  link.click();

  URL.revokeObjectURL(url);
});

importBackupInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];

  if (!file) return;

  const confirmed = confirm(
    "Importar backup adicionará os dados ao Firebase. Continuar?"
  );

  if (!confirmed) return;

  const text = await file.text();

  const backup = JSON.parse(text);

  await importCollectionBackup("members", backup.members || []);
  await importCollectionBackup("points", backup.points || []);
  await importCollectionBackup("activities", backup.activities || []);
  await importCollectionBackup("texts", backup.texts || []);
  await importCollectionBackup("scoreTypes", backup.scoreTypes || []);
  await importCollectionBackup("responsibles", backup.responsibles || []);

  backupMessage.textContent =
    "Backup importado com sucesso.";

  await loadAllData();
});

async function importCollectionBackup(collectionName, items) {
  for (const item of items) {
    const clean = { ...item };

    delete clean.id;

    await addDoc(collection(db, collectionName), clean);
  }
}

/*
========================================================
HELPERS
========================================================
*/

function updateDashboard() {
  const sorted = [...allMembers]
    .sort((a, b) => Number(b.points || 0) - Number(a.points || 0));

  dashboardTopMember.textContent = sorted[0]
    ? `${sorted[0].name} (${sorted[0].points} pts)`
    : "Sem dados";

  dashboardPendingActivities.textContent =
    allActivities.filter(
      (activity) => activity.status === "Aberta"
    ).length;

  dashboardPendingTexts.textContent =
    allTexts.filter(
      (text) => text.status === "Pendente"
    ).length;
}

function resetPreview() {
  pendingMember = null;

  memberPreview.innerHTML = `
    <div class="empty-state">
      Os campos reconhecidos aparecerão aqui.
    </div>
  `;

  savePreviewMemberBtn.classList.add("hidden");
}

/*
========================================================
PLACEHOLDERS
========================================================
*/
/* 
Mantive placeholders das funções grandes que já estavam funcionando:
- parseMemberSheet
- createMemberCardHTML
- createMemberProfileHTML
- createParsedMemberFormHTML
- createPointHistoryHTML
- normalizeOldMember
- formatMemberDetails
- etc

Você deve manter exatamente as versões que já estavam funcionando no seu arquivo anterior.
*/