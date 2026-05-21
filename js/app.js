import {
  auth,
  db,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp
} from "./firebase.js";

/*
  CENTRAL ASCENSÃO LUNAR
  Arquivo: js/app.js

  Este arquivo controla toda a lógica do sistema:
  - login
  - navegação
  - membros
  - pontuações
  - rankings
  - atividades
  - textos
  - relatórios
  - configurações
  - backup
  - limpeza de pontuação
*/

/* ======================================================
   ATALHO PARA PEGAR ELEMENTOS PELO ID
====================================================== */

const $ = (id) => document.getElementById(id);

/* ======================================================
   ELEMENTOS DO HTML
====================================================== */

/* Login */
const loginForm = $("loginForm");
const loginMessage = $("loginMessage");
const loginScreen = $("loginScreen");
const mainApp = $("mainApp");
const logoutBtn = $("logoutBtn");

/* Navegação */
const menuButtons = document.querySelectorAll(".menu-btn");
const pages = document.querySelectorAll(".page");
const pageTitle = $("pageTitle");
const pageSubtitle = $("pageSubtitle");

/* Dashboard */
const totalMembers = $("totalMembers");
const totalPoints = $("totalPoints");
const openActivities = $("openActivities");
const totalTexts = $("totalTexts");
const latestMovements = $("latestMovements");
const dashboardTopMember = $("dashboardTopMember");
const dashboardPendingActivities = $("dashboardPendingActivities");
const dashboardPendingTexts = $("dashboardPendingTexts");

/* Membros */
const memberForm = $("memberForm");
const memberSheet = $("memberSheet");
const memberPreview = $("memberPreview");
const savePreviewMemberBtn = $("savePreviewMemberBtn");
const clearPreviewBtn = $("clearPreviewBtn");
const membersList = $("membersList");
const membersCount = $("membersCount");
const memberSearch = $("memberSearch");
const memberStatusFilter = $("memberStatusFilter");

/* Perfil do membro */
const memberProfileContent = $("memberProfileContent");
const internalNotesForm = $("internalNotesForm");
const internalNotesMemberId = $("internalNotesMemberId");
const internalNotesText = $("internalNotesText");

/* Pontuação */
const pointsForm = $("pointsForm");
const pointsMember = $("pointsMember");
const pointsType = $("pointsType");
const pointsValue = $("pointsValue");
const pointsReason = $("pointsReason");
const pointsDate = $("pointsDate");
const pointsResponsible = $("pointsResponsible");
const pointsHistory = $("pointsHistory");

/* Ranking */
const rankingForm = $("rankingForm");
const rankingStart = $("rankingStart");
const rankingEnd = $("rankingEnd");
const rankingTopThree = $("rankingTopThree");
const rankingList = $("rankingList");
const generateGeneralRankingBtn = $("generateGeneralRankingBtn");
const generalRankingList = $("generalRankingList");

/* Atividades */
const activityForm = $("activityForm");
const activityTitle = $("activityTitle");
const activityDescription = $("activityDescription");
const activityDeadline = $("activityDeadline");
const activityPoints = $("activityPoints");
const activityWinnerPoints = $("activityWinnerPoints");
const activityStatus = $("activityStatus");
const activitiesList = $("activitiesList");

/* Textos */
const textForm = $("textForm");
const textMember = $("textMember");
const textTitle = $("textTitle");
const textType = $("textType");
const textContent = $("textContent");
const textStatus = $("textStatus");
const textsList = $("textsList");
const textViewer = $("textViewer");

/* Configurações */
const scoreTypeForm = $("scoreTypeForm");
const scoreTypeName = $("scoreTypeName");
const scoreTypeValue = $("scoreTypeValue");
const scoreTypesList = $("scoreTypesList");

const responsibleForm = $("responsibleForm");
const responsibleName = $("responsibleName");
const responsiblesList = $("responsiblesList");

const exportBackupBtn = $("exportBackupBtn");
const importBackupInput = $("importBackupInput");
const backupMessage = $("backupMessage");

const clearPointsBtn = $("clearPointsBtn");
const clearPointsMessage = $("clearPointsMessage");

/* Relatórios */
const reportForm = $("reportForm");
const reportType = $("reportType");
const reportStart = $("reportStart");
const reportEnd = $("reportEnd");
const reportArea = $("reportArea");
const printReportBtn = $("printReportBtn");

/* ======================================================
   ESTADO GLOBAL DO SISTEMA
====================================================== */

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

/* ======================================================
   LOGIN
====================================================== */

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
    loginMessage.textContent = "Erro ao entrar. Verifique e-mail e senha.";
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

/* ======================================================
   NAVEGAÇÃO
====================================================== */

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

  const page = $(pageId);

  if (page) {
    page.classList.add("active-page");
  }

  menuButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.page === pageId);
  });

  pageTitle.textContent = title || "Central Ascensão Lunar";
  pageSubtitle.textContent = subtitle || "";
}

/* ======================================================
   CARREGAMENTO GERAL
====================================================== */

async function loadAllData() {
  await loadMembers();
  await loadPoints();
  await loadActivities();
  await loadTexts();
  await loadScoreTypes();
  await loadResponsibles();

  updateDashboard();
}

/* ======================================================
   MEMBROS
====================================================== */

memberForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const rawText = memberSheet.value.trim();

  if (!rawText) {
    alert("Cole a ficha do membro.");
    return;
  }

  pendingMember = parseMemberSheet(rawText);

  memberPreview.innerHTML = createParsedMemberFormHTML(pendingMember);
  savePreviewMemberBtn.classList.remove("hidden");
});

savePreviewMemberBtn.addEventListener("click", async () => {
  if (!pendingMember) {
    alert("Reconheça uma ficha antes de salvar.");
    return;
  }

  const memberData = getMemberDataFromParsedFields();

  try {
    if (editingMemberId) {
      const oldMember = allMembers.find((member) => member.id === editingMemberId);

      await updateDoc(doc(db, "members", editingMemberId), {
        ...memberData,
        points: Number(oldMember?.points || 0),
        internalNotes: oldMember?.internalNotes || "",
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

  const member = allMembers.find((item) => item.id === memberId);

  if (!member) return;

  if (action === "view") {
    openMemberProfile(member);
  }

  if (action === "quick-points") {
    showPage(
      "pointsPage",
      "Pontuações",
      "Adicione ou retire pontos dos membros."
    );

    pointsMember.value = member.id;
    pointsValue.focus();
  }

  if (action === "edit") {
    editingMemberId = member.id;

    memberSheet.value = member.rawSheet || formatMemberDetails(member);

    pendingMember = normalizeOldMember(member);

    memberPreview.innerHTML = createParsedMemberFormHTML(pendingMember);

    savePreviewMemberBtn.textContent = "Salvar alterações";
    savePreviewMemberBtn.classList.remove("hidden");

    showPage(
      "registerMemberPage",
      "Editar membro",
      "Altere os campos e salve as mudanças."
    );
  }

  if (action === "delete") {
    const confirmed = confirm(`Excluir ${member.name}?`);

    if (!confirmed) return;

    await deleteDoc(doc(db, "members", member.id));

    await loadMembers();
    updateDashboard();
  }
});

internalNotesForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const memberId = internalNotesMemberId.value;

  if (!memberId) {
    alert("Nenhum membro selecionado.");
    return;
  }

  await updateDoc(doc(db, "members", memberId), {
    internalNotes: internalNotesText.value.trim()
  });

  await loadMembers();

  const updatedMember = allMembers.find((member) => member.id === memberId);

  if (updatedMember) {
    openMemberProfile(updatedMember);
  }

  alert("Observações internas salvas.");
});

async function loadMembers() {
  const q = query(collection(db, "members"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  allMembers = [];

  pointsMember.innerHTML = `<option value="">Selecione um membro</option>`;
  textMember.innerHTML = `<option value="">Selecione um membro</option>`;

  snapshot.forEach((docItem) => {
    const member = {
      id: docItem.id,
      ...docItem.data()
    };

    allMembers.push(member);

    pointsMember.innerHTML += `
      <option value="${member.id}">
        ${escapeHTML(member.name || "Sem nome")}
      </option>
    `;

    textMember.innerHTML += `
      <option value="${member.id}">
        ${escapeHTML(member.name || "Sem nome")}
      </option>
    `;
  });

  renderMembers();
  totalMembers.textContent = allMembers.length;
}

function renderMembers() {
  const searchTerm = memberSearch.value.toLowerCase().trim();
  const statusFilter = memberStatusFilter.value;

  const filteredMembers = allMembers.filter((member) => {
    const searchableText = `
      ${member.name || ""}
      ${member.wattpad || ""}
      ${member.user || ""}
      ${member.phone || ""}
      ${member.age || ""}
      ${member.writingGenre || ""}
      ${member.completedWork || ""}
      ${member.status || ""}
    `.toLowerCase();

    const matchesSearch = searchableText.includes(searchTerm);
    const matchesStatus = !statusFilter || member.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  membersList.innerHTML = filteredMembers.length
    ? filteredMembers.map((member) => createMemberCardHTML(member)).join("")
    : `<div class="empty-state">Nenhum membro encontrado.</div>`;

  membersCount.textContent = `${filteredMembers.length} membros`;
}

function openMemberProfile(member) {
  const memberPoints = allPoints.filter((point) => point.memberId === member.id);
  const memberTexts = allTexts.filter((text) => text.memberId === member.id);

  memberProfileContent.innerHTML = createMemberProfileHTML(
    member,
    memberPoints,
    memberTexts
  );

  internalNotesMemberId.value = member.id;
  internalNotesText.value = member.internalNotes || "";

  showPage(
    "memberProfilePage",
    "Perfil do membro",
    "Informações completas e observações internas."
  );
}

/* ======================================================
   PONTUAÇÕES
====================================================== */

pointsType.addEventListener("change", () => {
  const selected = allScoreTypes.find((type) => type.id === pointsType.value);

  if (!selected) return;

  pointsValue.value = selected.value;
  pointsReason.value = selected.name;
});

pointsForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const member = allMembers.find((item) => item.id === pointsMember.value);

  if (!member) {
    alert("Selecione um membro válido.");
    return;
  }

  if (!pointsResponsible.value) {
    alert("Selecione um responsável.");
    return;
  }

  await addPointToMember({
    member,
    value: Number(pointsValue.value),
    reason: pointsReason.value,
    date: pointsDate.value,
    responsible: pointsResponsible.value,
    origin: "manual"
  });

  pointsForm.reset();

  await loadMembers();
  await loadPoints();

  updateDashboard();
});

async function addPointToMember({ member, value, reason, date, responsible, origin }) {
  await addDoc(collection(db, "points"), {
    memberId: member.id,
    memberName: member.name || "",
    memberUser: member.wattpad || member.user || "",
    value: Number(value || 0),
    reason: reason || "Sem motivo",
    date: date || new Date().toISOString().slice(0, 10),
    responsible: responsible || "Não informado",
    origin: origin || "manual",
    createdAt: Timestamp.now()
  });

  await updateDoc(doc(db, "members", member.id), {
    points: Number(member.points || 0) + Number(value || 0)
  });
}

async function loadPoints() {
  const q = query(collection(db, "points"), orderBy("createdAt", "desc"));
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

    const html = createPointHistoryHTML(point);

    pointsHistory.innerHTML += html;

    if (movementCount < 5) {
      latestMovements.innerHTML += html;
      movementCount++;
    }
  });

  if (snapshot.empty) {
    pointsHistory.innerHTML = `
      <div class="empty-state">Nenhum ponto lançado ainda.</div>
    `;

    latestMovements.innerHTML = `
      <div class="empty-state">Nenhuma movimentação registrada ainda.</div>
    `;
  }

  totalPoints.textContent = total;
}

/* ======================================================
   LIMPAR REGISTROS DE PONTUAÇÃO
====================================================== */

clearPointsBtn.addEventListener("click", async () => {
  const firstConfirm = confirm(
    "Esta ação vai apagar TODOS os registros de pontuação e zerar os pontos de TODOS os membros. Deseja continuar?"
  );

  if (!firstConfirm) return;

  const secondConfirm = confirm(
    "Confirma novamente? Esta ação não pode ser desfeita sem backup."
  );

  if (!secondConfirm) return;

  try {
    clearPointsMessage.textContent = "Limpando registros...";

    const snapshot = await getDocs(collection(db, "points"));

    for (const pointDoc of snapshot.docs) {
      await deleteDoc(doc(db, "points", pointDoc.id));
    }

    for (const member of allMembers) {
      await updateDoc(doc(db, "members", member.id), {
        points: 0
      });
    }

    clearPointsMessage.textContent = "Registros de pontuação apagados e membros zerados.";

    await loadMembers();
    await loadPoints();

    updateDashboard();
    renderGeneralRanking();
  } catch (error) {
    console.error(error);
    clearPointsMessage.textContent = "Erro ao limpar registros de pontuação.";
  }
});

/* ======================================================
   RANKINGS
====================================================== */

rankingForm.addEventListener("submit", (event) => {
  event.preventDefault();

  generateQuinzenalRanking();
});

generateGeneralRankingBtn.addEventListener("click", () => {
  renderGeneralRanking();
});

function generateQuinzenalRanking() {
  const start = rankingStart.value;
  const end = rankingEnd.value;

  const rankingMap = {};

  allPoints.forEach((point) => {
    if (point.date >= start && point.date <= end) {
      if (!rankingMap[point.memberId]) {
        rankingMap[point.memberId] = 0;
      }

      rankingMap[point.memberId] += Number(point.value || 0);
    }
  });

  const ranking = Object.entries(rankingMap)
    .map(([memberId, points]) => {
      const member = allMembers.find((item) => item.id === memberId);

      return {
        name: member?.name || "Membro",
        user: member?.wattpad || member?.user || "",
        work: member?.completedWork || "",
        points
      };
    })
    .sort((a, b) => b.points - a.points);

  renderRanking(ranking, rankingTopThree, rankingList);
}

function renderGeneralRanking() {
  const ranking = [...allMembers]
    .map((member) => ({
      name: member.name || "Sem nome",
      user: member.wattpad || member.user || "",
      work: member.completedWork || "",
      points: Number(member.points || 0)
    }))
    .sort((a, b) => b.points - a.points);

  generalRankingList.innerHTML = ranking.length
    ? ranking.map((item, index) => createRankingItemHTML(item, index)).join("")
    : `<div class="empty-state">Nenhum membro cadastrado.</div>`;
}

function renderRanking(ranking, podiumContainer, listContainer) {
  podiumContainer.innerHTML = "";
  listContainer.innerHTML = "";

  if (!ranking.length) {
    podiumContainer.innerHTML = `<div class="empty-state">Nenhum ponto encontrado nesse período.</div>`;
    listContainer.innerHTML = `<div class="empty-state">Nenhum ponto encontrado nesse período.</div>`;
    return;
  }

  const medals = ["🥇", "🥈", "🥉"];

  ranking.slice(0, 3).forEach((item, index) => {
    podiumContainer.innerHTML += `
      <article class="podium-card">
        <div class="podium-medal">${medals[index]}</div>
        <div class="podium-position">${index + 1}º lugar</div>
        <div class="podium-name">${escapeHTML(item.name)}</div>
        <p>${escapeHTML(item.user || "Sem user")}</p>
        <div class="podium-points">${Number(item.points || 0)}</div>
        <p>pontos</p>
      </article>
    `;
  });

  listContainer.innerHTML = ranking
    .map((item, index) => createRankingItemHTML(item, index))
    .join("");
}

function createRankingItemHTML(item, index) {
  return `
    <div class="ranking-item">
      <div class="ranking-position">#${index + 1}</div>

      <div>
        <strong>${escapeHTML(item.name)}</strong>
        <p>${escapeHTML(item.user || "")}</p>
        ${item.work ? `<p>${escapeHTML(item.work)}</p>` : ""}
      </div>

      <div class="ranking-points">${Number(item.points || 0)}</div>
    </div>
  `;
}

/* ======================================================
   ATIVIDADES
====================================================== */

activityForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const activityData = {
    title: activityTitle.value,
    description: activityDescription.value,
    deadline: activityDeadline.value,
    points: Number(activityPoints.value || 0),
    winnerPoints: Number(activityWinnerPoints.value || 0),
    status: activityStatus.value,
    createdAt: Timestamp.now()
  };

  try {
    if (editingActivityId) {
      const oldActivity = allActivities.find((item) => item.id === editingActivityId);

      await updateDoc(doc(db, "activities", editingActivityId), {
        ...activityData,
        deliveredBy: oldActivity?.deliveredBy || [],
        winners: oldActivity?.winners || [],
        deliveryPointsGiven: oldActivity?.deliveryPointsGiven || [],
        winnerPointsGiven: oldActivity?.winnerPointsGiven || []
      });

      editingActivityId = null;
    } else {
      await addDoc(collection(db, "activities"), {
        ...activityData,
        deliveredBy: [],
        winners: [],
        deliveryPointsGiven: [],
        winnerPointsGiven: []
      });
    }

    activityForm.reset();
    activityStatus.value = "Aberta";

    await loadActivities();
    updateDashboard();
  } catch (error) {
    console.error(error);
    alert("Erro ao salvar atividade.");
  }
});

activitiesList.addEventListener("click", async (event) => {
  const button = event.target.closest("button");

  if (!button) return;

  const action = button.dataset.action;
  const activityId = button.dataset.id;
  const memberId = button.dataset.member;

  const activity = allActivities.find((item) => item.id === activityId);

  if (!activity) return;

  if (action === "toggle-delivery") {
    const deliveredBy = [...(activity.deliveredBy || [])];

    if (deliveredBy.includes(memberId)) {
      deliveredBy.splice(deliveredBy.indexOf(memberId), 1);
    } else {
      deliveredBy.push(memberId);
    }

    await updateDoc(doc(db, "activities", activityId), { deliveredBy });
    await loadActivities();
  }

  if (action === "toggle-winner") {
    const winners = [...(activity.winners || [])];

    if (winners.includes(memberId)) {
      winners.splice(winners.indexOf(memberId), 1);
    } else {
      winners.push(memberId);
    }

    await updateDoc(doc(db, "activities", activityId), { winners });
    await loadActivities();
  }

  if (action === "give-delivery-points") {
    await giveActivityPoints(activity, "delivery");
  }

  if (action === "give-winner-points") {
    await giveActivityPoints(activity, "winner");
  }

  if (action === "edit-activity") {
    editingActivityId = activity.id;

    activityTitle.value = activity.title || "";
    activityDescription.value = activity.description || "";
    activityDeadline.value = activity.deadline || "";
    activityPoints.value = activity.points || "";
    activityWinnerPoints.value = activity.winnerPoints || "";
    activityStatus.value = activity.status || "Aberta";

    activityTitle.focus();
  }

  if (action === "delete-activity") {
    const confirmed = confirm(`Excluir atividade "${activity.title}"?`);

    if (!confirmed) return;

    await deleteDoc(doc(db, "activities", activity.id));

    await loadActivities();
    updateDashboard();
  }
});

async function giveActivityPoints(activity, type) {
  const today = new Date().toISOString().slice(0, 10);

  const targetIds = type === "delivery"
    ? activity.deliveredBy || []
    : activity.winners || [];

  const alreadyGiven = type === "delivery"
    ? activity.deliveryPointsGiven || []
    : activity.winnerPointsGiven || [];

  const value = type === "delivery"
    ? Number(activity.points || 0)
    : Number(activity.winnerPoints || 0);

  if (!value) {
    alert("Esta atividade não tem pontos configurados para essa ação.");
    return;
  }

  const pendingIds = targetIds.filter((id) => !alreadyGiven.includes(id));

  if (pendingIds.length === 0) {
    alert("Nenhuma pontuação pendente para lançar.");
    return;
  }

  const responsible = "Sistema";

  for (const memberId of pendingIds) {
    const member = allMembers.find((item) => item.id === memberId);

    if (member) {
      await addPointToMember({
        member,
        value,
        reason: type === "delivery"
          ? `Entrega da atividade: ${activity.title}`
          : `Vencedor da atividade: ${activity.title}`,
        date: today,
        responsible,
        origin: type === "delivery" ? "activity-delivery" : "activity-winner"
      });
    }
  }

  const payload = {};

  if (type === "delivery") {
    payload.deliveryPointsGiven = [...alreadyGiven, ...pendingIds];
  } else {
    payload.winnerPointsGiven = [...alreadyGiven, ...pendingIds];
  }

  await updateDoc(doc(db, "activities", activity.id), payload);

  await loadMembers();
  await loadPoints();
  await loadActivities();

  updateDashboard();

  alert("Pontuação lançada com sucesso.");
}

async function loadActivities() {
  const q = query(collection(db, "activities"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  allActivities = [];
  activitiesList.innerHTML = "";

  let totalOpen = 0;

  snapshot.forEach((docItem) => {
    const activity = {
      id: docItem.id,
      ...docItem.data()
    };

    allActivities.push(activity);

    if (activity.status === "Aberta") {
      totalOpen++;
    }

    activitiesList.innerHTML += createActivityHTML(activity);
  });

  if (!allActivities.length) {
    activitiesList.innerHTML = `<div class="empty-state">Nenhuma atividade cadastrada ainda.</div>`;
  }

  openActivities.textContent = totalOpen;
}

/* ======================================================
   TEXTOS
====================================================== */

textForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const selectedMember = allMembers.find((member) => member.id === textMember.value);

  const textData = {
    memberId: textMember.value,
    memberName: selectedMember?.name || "",
    title: textTitle.value,
    type: textType.value,
    content: textContent.value,
    status: textStatus.value,
    createdAt: Timestamp.now()
  };

  try {
    if (editingTextId) {
      await updateDoc(doc(db, "texts", editingTextId), textData);
      editingTextId = null;
    } else {
      await addDoc(collection(db, "texts"), textData);
    }

    textForm.reset();

    await loadTexts();
    updateDashboard();
  } catch (error) {
    console.error(error);
    alert("Erro ao salvar texto.");
  }
});

textsList.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  const item = event.target.closest(".text-item");

  if (button) {
    const textId = button.dataset.id;
    const action = button.dataset.action;
    const text = allTexts.find((entry) => entry.id === textId);

    if (!text) return;

    if (action === "edit-text") {
      editingTextId = textId;

      textMember.value = text.memberId || "";
      textTitle.value = text.title || "";
      textType.value = text.type || "Outro";
      textContent.value = text.content || "";
      textStatus.value = text.status || "Pendente";

      textTitle.focus();
    }

    if (action === "delete-text") {
      const confirmed = confirm(`Excluir texto "${text.title}"?`);

      if (!confirmed) return;

      await deleteDoc(doc(db, "texts", textId));

      await loadTexts();
      resetTextViewer();
      updateDashboard();
    }

    return;
  }

  if (item) {
    const textId = item.dataset.id;
    const text = allTexts.find((entry) => entry.id === textId);

    if (text) {
      renderTextViewer(text);
    }
  }
});

async function loadTexts() {
  const q = query(collection(db, "texts"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  allTexts = [];
  textsList.innerHTML = "";

  snapshot.forEach((docItem) => {
    const text = {
      id: docItem.id,
      ...docItem.data()
    };

    allTexts.push(text);
    textsList.innerHTML += createTextItemHTML(text);
  });

  if (!allTexts.length) {
    textsList.innerHTML = `<div class="empty-state">Nenhum texto cadastrado ainda.</div>`;
  }

  totalTexts.textContent = allTexts.length;
}

/* ======================================================
   CONFIGURAÇÕES: TIPOS DE PONTUAÇÃO
====================================================== */

scoreTypeForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  await addDoc(collection(db, "scoreTypes"), {
    name: scoreTypeName.value,
    value: Number(scoreTypeValue.value || 0),
    createdAt: Timestamp.now()
  });

  scoreTypeForm.reset();

  await loadScoreTypes();
});

scoreTypesList.addEventListener("click", async (event) => {
  const button = event.target.closest("button");

  if (!button) return;

  const confirmed = confirm("Excluir este tipo de pontuação?");

  if (!confirmed) return;

  await deleteDoc(doc(db, "scoreTypes", button.dataset.id));

  await loadScoreTypes();
});

async function loadScoreTypes() {
  const snapshot = await getDocs(collection(db, "scoreTypes"));

  allScoreTypes = [];
  scoreTypesList.innerHTML = "";

  pointsType.innerHTML = `<option value="">Selecionar tipo manualmente</option>`;

  snapshot.forEach((docItem) => {
    const type = {
      id: docItem.id,
      ...docItem.data()
    };

    allScoreTypes.push(type);

    scoreTypesList.innerHTML += `
      <div class="settings-item">
        <span>${escapeHTML(type.name)} — ${Number(type.value || 0)} pts</span>

        <button class="btn btn-danger btn-small" data-id="${type.id}">
          Excluir
        </button>
      </div>
    `;

    pointsType.innerHTML += `
      <option value="${type.id}">
        ${escapeHTML(type.name)} — ${Number(type.value || 0)} pts
      </option>
    `;
  });

  if (!allScoreTypes.length) {
    scoreTypesList.innerHTML = `<div class="empty-state">Nenhum tipo cadastrado ainda.</div>`;
  }
}

/* ======================================================
   CONFIGURAÇÕES: RESPONSÁVEIS
====================================================== */

responsibleForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  await addDoc(collection(db, "responsibles"), {
    name: responsibleName.value,
    createdAt: Timestamp.now()
  });

  responsibleForm.reset();

  await loadResponsibles();
});

responsiblesList.addEventListener("click", async (event) => {
  const button = event.target.closest("button");

  if (!button) return;

  const confirmed = confirm("Excluir este responsável?");

  if (!confirmed) return;

  await deleteDoc(doc(db, "responsibles", button.dataset.id));

  await loadResponsibles();
});

async function loadResponsibles() {
  const snapshot = await getDocs(collection(db, "responsibles"));

  allResponsibles = [];
  responsiblesList.innerHTML = "";

  pointsResponsible.innerHTML = `<option value="">Selecione um responsável</option>`;

  snapshot.forEach((docItem) => {
    const responsible = {
      id: docItem.id,
      ...docItem.data()
    };

    allResponsibles.push(responsible);

    responsiblesList.innerHTML += `
      <div class="settings-item">
        <span>${escapeHTML(responsible.name)}</span>

        <button class="btn btn-danger btn-small" data-id="${responsible.id}">
          Excluir
        </button>
      </div>
    `;

    pointsResponsible.innerHTML += `
      <option value="${escapeAttribute(responsible.name)}">
        ${escapeHTML(responsible.name)}
      </option>
    `;
  });

  if (!allResponsibles.length) {
    responsiblesList.innerHTML = `<div class="empty-state">Nenhum responsável cadastrado ainda.</div>`;
  }
}

/* ======================================================
   BACKUP
====================================================== */

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

  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `backup-ascensao-lunar-${new Date().toISOString().slice(0, 10)}.json`;

  link.click();

  URL.revokeObjectURL(url);
});

importBackupInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];

  if (!file) return;

  const confirmed = confirm(
    "Importar backup adicionará os dados ao Firebase. Isso pode duplicar registros. Continuar?"
  );

  if (!confirmed) return;

  try {
    const text = await file.text();
    const backup = JSON.parse(text);

    await importCollectionBackup("members", backup.members || []);
    await importCollectionBackup("points", backup.points || []);
    await importCollectionBackup("activities", backup.activities || []);
    await importCollectionBackup("texts", backup.texts || []);
    await importCollectionBackup("scoreTypes", backup.scoreTypes || []);
    await importCollectionBackup("responsibles", backup.responsibles || []);

    backupMessage.textContent = "Backup importado com sucesso.";

    await loadAllData();
  } catch (error) {
    console.error(error);
    backupMessage.textContent = "Erro ao importar backup.";
  }
});

async function importCollectionBackup(collectionName, items) {
  for (const item of items) {
    const cleanItem = { ...item };

    delete cleanItem.id;

    await addDoc(collection(db, collectionName), {
      ...cleanItem,
      importedAt: Timestamp.now()
    });
  }
}

/* ======================================================
   RELATÓRIOS
====================================================== */

reportForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const type = reportType.value;

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

function getFilteredPointsByReportDate() {
  const start = reportStart.value;
  const end = reportEnd.value;

  return allPoints.filter((point) => {
    if (start && point.date < start) return false;
    if (end && point.date > end) return false;
    return true;
  });
}

function getFilteredActivitiesByReportDate() {
  const start = reportStart.value;
  const end = reportEnd.value;

  return allActivities.filter((activity) => {
    if (!activity.deadline) return true;
    if (start && activity.deadline < start) return false;
    if (end && activity.deadline > end) return false;
    return true;
  });
}

function generateMembersReport() {
  reportArea.innerHTML = `
    ${createReportHeader("Relatório de membros")}

    <p class="report-subtitle">
      Total de membros cadastrados: ${allMembers.length}
    </p>

    <table class="report-table">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Wattpad</th>
          <th>Telefone</th>
          <th>Status</th>
          <th>Pontos</th>
        </tr>
      </thead>

      <tbody>
        ${allMembers.map((member) => `
          <tr>
            <td>${escapeHTML(member.name || "")}</td>
            <td>${escapeHTML(member.wattpad || "")}</td>
            <td>${escapeHTML(member.phone || "")}</td>
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
    ${createReportHeader("Ranking geral acumulado")}

    <table class="report-table">
      <thead>
        <tr>
          <th>Posição</th>
          <th>Nome</th>
          <th>Wattpad</th>
          <th>Pontos</th>
        </tr>
      </thead>

      <tbody>
        ${ranking.map((member, index) => `
          <tr>
            <td>#${index + 1}</td>
            <td>${escapeHTML(member.name || "")}</td>
            <td>${escapeHTML(member.wattpad || "")}</td>
            <td>${Number(member.points || 0)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function generatePointsReport() {
  const points = getFilteredPointsByReportDate();

  reportArea.innerHTML = `
    ${createReportHeader("Histórico de pontuação")}

    <p class="report-subtitle">
      Total de registros: ${points.length}
    </p>

    <table class="report-table">
      <thead>
        <tr>
          <th>Data</th>
          <th>Membro</th>
          <th>Pontos</th>
          <th>Motivo</th>
          <th>Responsável</th>
        </tr>
      </thead>

      <tbody>
        ${points.map((point) => `
          <tr>
            <td>${formatDate(point.date)}</td>
            <td>${escapeHTML(point.memberName || "")}</td>
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
  const activities = getFilteredActivitiesByReportDate();

  reportArea.innerHTML = `
    ${createReportHeader("Relatório de atividades")}

    <p class="report-subtitle">
      Total de atividades: ${activities.length}
    </p>

    <table class="report-table">
      <thead>
        <tr>
          <th>Atividade</th>
          <th>Status</th>
          <th>Prazo</th>
          <th>Entregas</th>
          <th>Vencedores</th>
        </tr>
      </thead>

      <tbody>
        ${activities.map((activity) => `
          <tr>
            <td>${escapeHTML(activity.title || "")}</td>
            <td>${escapeHTML(activity.status || "")}</td>
            <td>${formatDate(activity.deadline)}</td>
            <td>${(activity.deliveredBy || []).length}</td>
            <td>${(activity.winners || []).length}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function generateTextsReport() {
  reportArea.innerHTML = `
    ${createReportHeader("Relatório de textos")}

    <p class="report-subtitle">
      Total de textos cadastrados: ${allTexts.length}
    </p>

    <table class="report-table">
      <thead>
        <tr>
          <th>Título</th>
          <th>Autor</th>
          <th>Tipo</th>
          <th>Status</th>
        </tr>
      </thead>

      <tbody>
        ${allTexts.map((text) => `
          <tr>
            <td>${escapeHTML(text.title || "")}</td>
            <td>${escapeHTML(text.memberName || "")}</td>
            <td>${escapeHTML(text.type || "")}</td>
            <td>${escapeHTML(text.status || "")}</td>
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
        <img src="assets/favicon.png" alt="Logo Ascensão Lunar" onerror="this.style.display='none'; this.parentElement.classList.add('logo-fallback');" />
        <span>🌙</span>
      </div>

      <div>
        <h2>${escapeHTML(title)}</h2>
        <p>Ascensão Lunar • Gerado em ${new Date().toLocaleString("pt-BR")}</p>
      </div>
    </div>
  `;
}

/* ======================================================
   HTML DINÂMICO
====================================================== */

function createParsedMemberFormHTML(member) {
  return `
    <div class="parsed-box">
      <h3>Conferir antes de salvar</h3>

      <div class="parsed-form">
        <label for="parsedName">Nome</label>
        <input id="parsedName" type="text" value="${escapeAttribute(member.name)}" />

        <label for="parsedWattpad">User do Wattpad</label>
        <input id="parsedWattpad" type="text" value="${escapeAttribute(member.wattpad)}" />

        <label for="parsedPhone">Telefone</label>
        <input id="parsedPhone" type="text" value="${escapeAttribute(member.phone)}" placeholder="Adicione manualmente" />

        <label for="parsedAge">Idade</label>
        <input id="parsedAge" type="text" value="${escapeAttribute(member.age)}" />

        <label for="parsedWritingGenre">Gênero que mais escreve</label>
        <input id="parsedWritingGenre" type="text" value="${escapeAttribute(member.writingGenre)}" />

        <label for="parsedHasCompletedWork">Tem obra concluída?</label>
        <input id="parsedHasCompletedWork" type="text" value="${escapeAttribute(member.hasCompletedWork)}" />

        <label for="parsedCompletedWork">Qual obra concluída?</label>
        <input id="parsedCompletedWork" type="text" value="${escapeAttribute(member.completedWork)}" />

        <label for="parsedDoubts">Dúvida, insegurança ou observação inicial</label>
        <textarea id="parsedDoubts" rows="4">${escapeHTML(member.doubts)}</textarea>

        <label for="parsedStatus">Status</label>
        <select id="parsedStatus">
          <option value="Novo" ${member.status === "Novo" ? "selected" : ""}>Novo</option>
          <option value="Ativo" ${member.status === "Ativo" ? "selected" : ""}>Ativo</option>
          <option value="Em acompanhamento" ${member.status === "Em acompanhamento" ? "selected" : ""}>Em acompanhamento</option>
          <option value="Inativo" ${member.status === "Inativo" ? "selected" : ""}>Inativo</option>
        </select>
      </div>

      <p class="parsed-note">
        Revise os campos acima. O telefone não vem na ficha, então fica para você preencher manualmente.
      </p>
    </div>
  `;
}

function createMemberCardHTML(member) {
  return `
    <article class="member-card">
      <div class="member-top">
        <div>
          <h3>${escapeHTML(member.name || "Sem nome")}</h3>
          <p>${escapeHTML(member.wattpad || member.user || "Sem Wattpad")}</p>
        </div>

        <div class="member-points">
          ${Number(member.points || 0)}
          <span>pontos</span>
        </div>
      </div>

      <div class="badges-row">
        <span class="badge ${getStatusClass(member.status)}">${escapeHTML(member.status || "Novo")}</span>
        <span class="badge">${escapeHTML(member.writingGenre || member.genre || "Sem gênero")}</span>
      </div>

      <div class="member-meta">
        <div><strong>Telefone:</strong> ${escapeHTML(member.phone || "Não informado")}</div>
        <div><strong>Idade:</strong> ${escapeHTML(member.age || "Não informada")}</div>
        <div><strong>Obra concluída?</strong> ${escapeHTML(member.hasCompletedWork || "Não informado")}</div>
        <div><strong>Qual obra:</strong> ${escapeHTML(member.completedWork || "Não informado")}</div>
      </div>

      <div class="member-actions">
        <button class="btn btn-blue btn-small" data-action="view" data-id="${member.id}">Perfil</button>
        <button class="btn btn-primary btn-small" data-action="quick-points" data-id="${member.id}">Pontuar</button>
        <button class="btn btn-secondary btn-small" data-action="edit" data-id="${member.id}">Editar</button>
        <button class="btn btn-danger btn-small" data-action="delete" data-id="${member.id}">Excluir</button>
      </div>
    </article>
  `;
}

function createMemberProfileHTML(member, memberPoints, memberTexts) {
  return `
    <div class="profile-header">
      <div>
        <div class="profile-name">${escapeHTML(member.name || "Sem nome")}</div>
        <p>${escapeHTML(member.wattpad || "Sem Wattpad")}</p>
      </div>

      <div class="member-points">
        ${Number(member.points || 0)}
        <span>pontos</span>
      </div>
    </div>

    <div class="badges-row">
      <span class="badge ${getStatusClass(member.status)}">${escapeHTML(member.status || "Novo")}</span>
      <span class="badge">${escapeHTML(member.writingGenre || "Sem gênero")}</span>
    </div>

    <div class="profile-section">
      <h3>Dados de entrada</h3>

      <div class="member-meta">
        <div><strong>Telefone:</strong> ${escapeHTML(member.phone || "Não informado")}</div>
        <div><strong>Idade:</strong> ${escapeHTML(member.age || "Não informada")}</div>
        <div><strong>Tem obra concluída?</strong> ${escapeHTML(member.hasCompletedWork || "Não informado")}</div>
        <div><strong>Obra:</strong> ${escapeHTML(member.completedWork || "Não informado")}</div>
        <div><strong>Dúvida/Insegurança:</strong> ${escapeHTML(member.doubts || "Nenhuma")}</div>
      </div>
    </div>

    <div class="profile-section">
      <h3>Histórico de pontos</h3>

      <div class="list">
        ${
          memberPoints.length
            ? memberPoints.map(createPointHistoryHTML).join("")
            : `<div class="empty-state">Nenhum ponto lançado para este membro.</div>`
        }
      </div>
    </div>

    <div class="profile-section">
      <h3>Textos enviados</h3>

      <div class="list">
        ${
          memberTexts.length
            ? memberTexts.map(createTextItemHTML).join("")
            : `<div class="empty-state">Nenhum texto cadastrado para este membro.</div>`
        }
      </div>
    </div>
  `;
}

function createPointHistoryHTML(point) {
  const className = Number(point.value || 0) >= 0 ? "points-positive" : "points-negative";
  const signal = Number(point.value || 0) > 0 ? "+" : "";

  return `
    <div class="history-item">
      <strong class="${className}">
        ${signal}${Number(point.value || 0)} pontos
      </strong>

      <p><strong>Membro:</strong> ${escapeHTML(point.memberName || "Não informado")} ${point.memberUser ? `— ${escapeHTML(point.memberUser)}` : ""}</p>
      <p><strong>Motivo:</strong> ${escapeHTML(point.reason || "Sem motivo")}</p>
      <p><strong>Data:</strong> ${formatDate(point.date)}</p>
      <p><strong>Responsável:</strong> ${escapeHTML(point.responsible || "Não informado")}</p>
    </div>
  `;
}

function createActivityHTML(activity) {
  const deliveredBy = activity.deliveredBy || [];
  const winners = activity.winners || [];
  const deliveryPointsGiven = activity.deliveryPointsGiven || [];
  const winnerPointsGiven = activity.winnerPointsGiven || [];

  const membersChecklist = allMembers.map((member) => {
    const delivered = deliveredBy.includes(member.id);
    const winner = winners.includes(member.id);
    const deliveryPaid = deliveryPointsGiven.includes(member.id);
    const winnerPaid = winnerPointsGiven.includes(member.id);

    return `
      <div class="activity-member-row">
        <span>${escapeHTML(member.name)}</span>

        <button class="btn ${delivered ? "btn-primary" : "btn-secondary"} btn-small" data-action="toggle-delivery" data-id="${activity.id}" data-member="${member.id}">
          ${delivered ? "Entregou" : "Pendente"}
        </button>

        <button class="btn ${winner ? "btn-primary" : "btn-secondary"} btn-small" data-action="toggle-winner" data-id="${activity.id}" data-member="${member.id}">
          ${winner ? "Vencedor" : "Marcar vencedor"}
        </button>

        <span class="badge ${deliveryPaid || winnerPaid ? "green" : ""}">
          ${deliveryPaid || winnerPaid ? "Pontuado" : "Sem pontos"}
        </span>
      </div>
    `;
  }).join("");

  return `
    <div class="activity-item">
      <strong>${escapeHTML(activity.title || "Sem título")}</strong>
      <p>${escapeHTML(activity.description || "Sem descrição.")}</p>
      <p>Prazo: ${formatDate(activity.deadline)}</p>
      <p>Pontos por entrega: ${Number(activity.points || 0)}</p>
      <p>Pontos extras para vencedor: ${Number(activity.winnerPoints || 0)}</p>
      <p>Status: ${escapeHTML(activity.status || "Aberta")}</p>

      <div class="item-actions">
        <button class="btn btn-primary btn-small" data-action="give-delivery-points" data-id="${activity.id}">
          Pontuar entregas
        </button>

        <button class="btn btn-primary btn-small" data-action="give-winner-points" data-id="${activity.id}">
          Pontuar vencedores
        </button>

        <button class="btn btn-secondary btn-small" data-action="edit-activity" data-id="${activity.id}">
          Editar
        </button>

        <button class="btn btn-danger btn-small" data-action="delete-activity" data-id="${activity.id}">
          Excluir
        </button>
      </div>

      <div class="activity-checklist">
        ${membersChecklist || `<p>Nenhum membro cadastrado.</p>`}
      </div>
    </div>
  `;
}

function createTextItemHTML(text) {
  return `
    <div class="text-item" data-id="${text.id}">
      <strong>${escapeHTML(text.title || "Sem título")}</strong>
      <p>Autor: ${escapeHTML(text.memberName || "Não informado")}</p>
      <p>Tipo: ${escapeHTML(text.type || "")}</p>
      <p>Status: ${escapeHTML(text.status || "")}</p>

      <div class="item-actions">
        <button class="btn btn-secondary btn-small" data-action="edit-text" data-id="${text.id}">
          Editar
        </button>

        <button class="btn btn-danger btn-small" data-action="delete-text" data-id="${text.id}">
          Excluir
        </button>
      </div>
    </div>
  `;
}

function renderTextViewer(text) {
  textViewer.innerHTML = `
    <div class="viewer-title">${escapeHTML(text.title || "Sem título")}</div>

    <div class="viewer-meta">
      Autor: ${escapeHTML(text.memberName || "Não informado")} |
      Tipo: ${escapeHTML(text.type || "")} |
      Status: ${escapeHTML(text.status || "")}
    </div>

    <div class="viewer-content">${escapeHTML(text.content || "Sem conteúdo.")}</div>
  `;
}

function resetTextViewer() {
  textViewer.innerHTML = `<div class="empty-state">Selecione um texto para visualizar.</div>`;
}

/* ======================================================
   PARSER DA FICHA DE ENTRADA
====================================================== */

function parseMemberSheet(text) {
  return {
    name: getValueAfterLabel(text, ["Nome"]),
    wattpad: getValueAfterLabel(text, ["User do Wattpad", "Wattpad"]),
    age: getValueAfterLabel(text, ["Idade"]),
    writingGenre: getValueAfterLabel(text, ["Gênero que mais escreve", "Genero que mais escreve"]),
    hasCompletedWork: getValueAfterQuestion(text, ["Tem alguma obra concluída?", "Tem alguma obra concluida?"]),
    completedWork: getValueAfterQuestion(text, ["Se sim, qual?"]),
    doubts: getValueAfterQuestion(text, [
      "Tem alguma dúvida, insegurança ou algo que gostaria de falar antes de entrar oficialmente no projeto?",
      "Tem alguma duvida, inseguranca ou algo que gostaria de falar antes de entrar oficialmente no projeto?"
    ]),
    phone: "",
    status: "Novo"
  };
}

function getValueAfterLabel(text, labels) {
  const lines = text.split(/\r?\n/);

  for (const label of labels) {
    for (const line of lines) {
      const cleaned = cleanLine(line);
      const regex = new RegExp(`${escapeRegExp(label)}\\s*:?\\s*(.+)$`, "i");
      const match = cleaned.match(regex);

      if (match) {
        return match[1].trim();
      }
    }
  }

  return "";
}

function getValueAfterQuestion(text, labels) {
  const lines = text.split(/\r?\n/);

  for (const label of labels) {
    for (const line of lines) {
      const cleaned = cleanLine(line);
      const regex = new RegExp(`${escapeRegExp(label)}\\s*:?\\s*(.*)$`, "i");
      const match = cleaned.match(regex);

      if (match && match[1].trim()) {
        return match[1].trim();
      }
    }
  }

  return "";
}

function cleanLine(line) {
  return String(line)
    .replace(/[🌙✨🖋️📚🎂📝📖💭]/g, "")
    .replace(/\*/g, "")
    .replace(/_/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getMemberDataFromParsedFields() {
  const wattpad = $("parsedWattpad").value.trim();
  const writingGenre = $("parsedWritingGenre").value.trim();
  const completedWork = $("parsedCompletedWork").value.trim();
  const doubts = $("parsedDoubts").value.trim();

  return {
    name: $("parsedName").value.trim(),
    wattpad,
    phone: $("parsedPhone").value.trim(),
    age: $("parsedAge").value.trim(),
    writingGenre,
    hasCompletedWork: $("parsedHasCompletedWork").value.trim(),
    completedWork,
    doubts,
    status: $("parsedStatus").value,

    user: wattpad,
    genre: writingGenre,
    work: completedWork || "Não informado",
    observations: doubts
  };
}

function normalizeOldMember(member) {
  return {
    name: member.name || "",
    wattpad: member.wattpad || member.user || "",
    phone: member.phone || "",
    age: member.age || "",
    writingGenre: member.writingGenre || member.genre || "",
    hasCompletedWork: member.hasCompletedWork || "",
    completedWork: member.completedWork || member.work || "",
    doubts: member.doubts || member.observations || "",
    status: member.status || "Novo"
  };
}

/* ======================================================
   DASHBOARD E AUXILIARES
====================================================== */

function updateDashboard() {
  const sortedMembers = [...allMembers].sort(
    (a, b) => Number(b.points || 0) - Number(a.points || 0)
  );

  dashboardTopMember.textContent = sortedMembers[0]
    ? `${sortedMembers[0].name} (${Number(sortedMembers[0].points || 0)} pts)`
    : "Sem dados";

  dashboardPendingActivities.textContent = allActivities.filter(
    (activity) => activity.status === "Aberta"
  ).length;

  dashboardPendingTexts.textContent = allTexts.filter(
    (text) => text.status === "Pendente"
  ).length;
}

function resetPreview() {
  pendingMember = null;

  memberPreview.innerHTML = `
    <div class="empty-state">
      Os campos reconhecidos aparecerão aqui.
      Você poderá corrigir antes de salvar.
    </div>
  `;

  savePreviewMemberBtn.classList.add("hidden");
}

function getStatusClass(status) {
  if (status === "Ativo") return "green";
  if (status === "Inativo") return "red";
  if (status === "Em acompanhamento") return "purple";
  return "blue";
}

function formatMemberDetails(member) {
  return `
Nome: ${member.name || ""}
User do Wattpad: ${member.wattpad || member.user || ""}
Telefone: ${member.phone || ""}
Idade: ${member.age || ""}
Gênero que mais escreve: ${member.writingGenre || ""}
Tem obra concluída?: ${member.hasCompletedWork || ""}
Se sim, qual?: ${member.completedWork || ""}
Dúvida/Insegurança: ${member.doubts || ""}
Status: ${member.status || ""}
Pontos: ${member.points || 0}
  `.trim();
}

function formatDate(dateString) {
  if (!dateString) return "Sem data";

  const parts = String(dateString).split("-");

  if (parts.length !== 3) return dateString;

  const [year, month, day] = parts;

  return `${day}/${month}/${year}`;
}

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