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
========================================================
ATALHO
========================================================
*/

const $ = (id) => document.getElementById(id);

/*
========================================================
ELEMENTOS
========================================================
*/

const loginForm = $("loginForm");
const loginMessage = $("loginMessage");
const loginScreen = $("loginScreen");
const mainApp = $("mainApp");
const logoutBtn = $("logoutBtn");

const menuButtons = document.querySelectorAll(".menu-btn");
const pages = document.querySelectorAll(".page");
const pageTitle = $("pageTitle");
const pageSubtitle = $("pageSubtitle");

const totalMembers = $("totalMembers");
const totalPoints = $("totalPoints");
const openActivities = $("openActivities");
const totalTexts = $("totalTexts");
const latestMovements = $("latestMovements");
const dashboardTopMember = $("dashboardTopMember");
const dashboardPendingActivities = $("dashboardPendingActivities");
const dashboardPendingTexts = $("dashboardPendingTexts");

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

const pointsForm = $("pointsForm");
const pointsMember = $("pointsMember");
const pointsType = $("pointsType");
const pointsValue = $("pointsValue");
const pointsReason = $("pointsReason");
const pointsDate = $("pointsDate");
const pointsResponsible = $("pointsResponsible");
const pointsHistory = $("pointsHistory");

const rankingForm = $("rankingForm");
const rankingTopThree = $("rankingTopThree");
const rankingList = $("rankingList");
const generateGeneralRankingBtn = $("generateGeneralRankingBtn");
const generalRankingList = $("generalRankingList");

const activityForm = $("activityForm");
const activitiesList = $("activitiesList");

const textForm = $("textForm");
const textMember = $("textMember");
const textsList = $("textsList");
const textViewer = $("textViewer");

const scoreTypeForm = $("scoreTypeForm");
const scoreTypesList = $("scoreTypesList");
const responsibleForm = $("responsibleForm");
const responsiblesList = $("responsiblesList");

const exportBackupBtn = $("exportBackupBtn");
const importBackupInput = $("importBackupInput");
const backupMessage = $("backupMessage");

const clearPointsBtn = $("clearPointsBtn");
const clearPointsMessage = $("clearPointsMessage");

const reportForm = $("reportForm");
const reportType = $("reportType");
const reportStart = $("reportStart");
const reportEnd = $("reportEnd");
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
  pages.forEach((page) => {
    page.classList.remove("active-page");
  });

  $(pageId).classList.add("active-page");

  menuButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.page === pageId);
  });

  pageTitle.textContent = title || "Central Ascensão Lunar";
  pageSubtitle.textContent = subtitle || "";
}

/*
========================================================
CARREGAMENTO GERAL
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

  pendingMember = null;
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
    if (!confirm(`Excluir ${member.name}?`)) return;

    try {
      await deleteDoc(doc(db, "members", member.id));

      await loadMembers();
      updateDashboard();
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir membro.");
    }
  }
});

internalNotesForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const memberId = internalNotesMemberId.value;

  if (!memberId) {
    alert("Nenhum membro selecionado.");
    return;
  }

  try {
    await updateDoc(doc(db, "members", memberId), {
      internalNotes: internalNotesText.value.trim()
    });

    await loadMembers();

    const updatedMember = allMembers.find((member) => member.id === memberId);

    if (updatedMember) {
      openMemberProfile(updatedMember);
    }

    alert("Observações salvas.");
  } catch (error) {
    console.error(error);
    alert("Erro ao salvar observações.");
  }
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
      ${member.genre || ""}
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

/*
========================================================
PONTUAÇÕES
========================================================
*/

pointsType.addEventListener("change", () => {
  const selected = allScoreTypes.find((type) => type.id === pointsType.value);

  if (!selected) return;

  pointsValue.value = Number(selected.value || 0);
  pointsReason.value = selected.name || "";
});

pointsForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const memberId = pointsMember.value;
  const selectedMember = allMembers.find((member) => member.id === memberId);

  if (!selectedMember) {
    alert("Selecione um membro válido.");
    return;
  }

  if (!pointsResponsible.value) {
    alert("Selecione um responsável.");
    return;
  }

  try {
    await addPointToMember({
      member: selectedMember,
      value: Number(pointsValue.value || 0),
      reason: pointsReason.value,
      date: pointsDate.value,
      responsible: pointsResponsible.value,
      origin: "manual"
    });

    pointsForm.reset();

    await loadMembers();
    await loadPoints();

    updateDashboard();
  } catch (error) {
    console.error(error);
    alert("Erro ao lançar pontuação.");
  }
});

async function addPointToMember({ member, value, reason, date, responsible, origin }) {
  await addDoc(collection(db, "points"), {
    memberId: member.id,
    memberName: member.name,
    memberUser: member.wattpad || member.user || "",
    value: Number(value || 0),
    reason,
    date,
    responsible,
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

/*
========================================================
LIMPAR REGISTROS DE PONTUAÇÃO
========================================================
*/

clearPointsBtn.addEventListener("click", async () => {
  const firstConfirm = confirm(
    "Isso vai apagar TODOS os registros de pontuação e zerar os pontos de TODOS os membros. Continuar?"
  );

  if (!firstConfirm) return;

  const secondConfirm = confirm(
    "Tem certeza absoluta? Essa ação não pode ser desfeita sem backup."
  );

  if (!secondConfirm) return;

  try {
    const pointsSnapshot = await getDocs(collection(db, "points"));

    for (const pointDoc of pointsSnapshot.docs) {
      await deleteDoc(doc(db, "points", pointDoc.id));
    }

    for (const member of allMembers) {
      await updateDoc(doc(db, "members", member.id), {
        points: 0
      });
    }

    clearPointsMessage.textContent = "Registros de pontuação apagados e pontos zerados.";

    await loadMembers();
    await loadPoints();
    updateDashboard();
  } catch (error) {
    console.error(error);
    clearPointsMessage.textContent = "Erro ao limpar registros de pontuação.";
  }
});

/*
========================================================
RANKINGS
========================================================
*/

rankingForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const start = $("rankingStart").value;
  const end = $("rankingEnd").value;

  const rankingMap = {};

  allPoints.forEach((point) => {
    if (point.date >= start && point.date <= end) {
      rankingMap[point.memberId] =
        Number(rankingMap[point.memberId] || 0) + Number(point.value || 0);
    }
  });

  const finalRanking = Object.entries(rankingMap)
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

  renderRanking(finalRanking, rankingTopThree, rankingList);
});

generateGeneralRankingBtn.addEventListener("click", () => {
  renderGeneralRanking();
});

function renderGeneralRanking() {
  const ranking = [...allMembers]
    .sort((a, b) => Number(b.points || 0) - Number(a.points || 0))
    .map((member) => ({
      name: member.name,
      user: member.wattpad || member.user || "",
      work: member.completedWork || "",
      points: Number(member.points || 0)
    }));

  generalRankingList.innerHTML = ranking.length
    ? ranking.map((item, index) => createRankingItemHTML(item, index)).join("")
    : `<div class="empty-state">Nenhum membro cadastrado.</div>`;
}

function renderRanking(finalRanking, podiumContainer, listContainer) {
  podiumContainer.innerHTML = "";
  listContainer.innerHTML = "";

  if (finalRanking.length === 0) {
    podiumContainer.innerHTML = `
      <div class="empty-state">Nenhum ponto encontrado nesse período.</div>
    `;

    listContainer.innerHTML = `
      <div class="empty-state">Nenhum ponto encontrado nesse período.</div>
    `;

    return;
  }

  const medals = ["🥇", "🥈", "🥉"];

  finalRanking.slice(0, 3).forEach((item, index) => {
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

  listContainer.innerHTML = finalRanking
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

/*
========================================================
ATIVIDADES
========================================================
*/

activityForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const activity = {
    title: $("activityTitle").value,
    description: $("activityDescription").value,
    deadline: $("activityDeadline").value,
    points: Number($("activityPoints").value || 0),
    winnerPoints: Number($("activityWinnerPoints").value || 0),
    status: $("activityStatus").value,
    deliveredBy: [],
    winners: [],
    deliveryPointsGiven: [],
    winnerPointsGiven: [],
    createdAt: Timestamp.now()
  };

  try {
    if (editingActivityId) {
      const oldActivity = allActivities.find((item) => item.id === editingActivityId);

      await