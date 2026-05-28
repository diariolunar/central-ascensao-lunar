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

const $ = (id) => document.getElementById(id);

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
let currentActivityId = null;
let currentReportCopyText = "";

let confirmResolve = null;

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
const rankingStart = $("rankingStart");
const rankingEnd = $("rankingEnd");
const rankingTopThree = $("rankingTopThree");
const rankingList = $("rankingList");
const generateGeneralRankingBtn = $("generateGeneralRankingBtn");
const generalRankingList = $("generalRankingList");

const openCreateActivityModalBtn = $("openCreateActivityModalBtn");
const createActivityModal = $("createActivityModal");
const activityForm = $("activityForm");
const activityTitle = $("activityTitle");
const activityDescription = $("activityDescription");
const activityDeadline = $("activityDeadline");
const activityPoints = $("activityPoints");
const activityWinnerPoints = $("activityWinnerPoints");
const activityStatus = $("activityStatus");
const activitiesList = $("activitiesList");

const activityDetailContent = $("activityDetailContent");
const backToActivitiesBtn = $("backToActivitiesBtn");
const openDeliveryModalBtn = $("openDeliveryModalBtn");
const openDeliveriesPageBtn = $("openDeliveriesPageBtn");
const backToActivityBtn = $("backToActivityBtn");
const deliveriesList = $("deliveriesList");

const deliveryModal = $("deliveryModal");
const activityDeliveryForm = $("activityDeliveryForm");
const deliveryActivityId = $("deliveryActivityId");
const editingDeliveryId = $("editingDeliveryId");
const deliveryMember = $("deliveryMember");
const deliveryText = $("deliveryText");
const saveDeliveryBtn = $("saveDeliveryBtn");

const activityWinnerForm = $("activityWinnerForm");
const winnerActivityId = $("winnerActivityId");
const activityWinnerSelect = $("activityWinnerSelect");
const completeActivityBtn = $("completeActivityBtn");
const editCurrentActivityBtn = $("editCurrentActivityBtn");
const deleteCurrentActivityBtn = $("deleteCurrentActivityBtn");

const openCreateTextModalBtn = $("openCreateTextModalBtn");
const createTextModal = $("createTextModal");
const textViewerModal = $("textViewerModal");
const textViewerTitle = $("textViewerTitle");
const textViewerMeta = $("textViewerMeta");
const textViewerContent = $("textViewerContent");

const textForm = $("textForm");
const textMember = $("textMember");
const textTitle = $("textTitle");
const textType = $("textType");
const textContent = $("textContent");
const textStatus = $("textStatus");
const textsList = $("textsList");

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

const reportForm = $("reportForm");
const reportType = $("reportType");
const reportStart = $("reportStart");
const reportEnd = $("reportEnd");
const reportArea = $("reportArea");
const printReportBtn = $("printReportBtn");
const copyReportBtn = $("copyReportBtn");

const systemMessageModal = $("systemMessageModal");
const systemMessageTitle = $("systemMessageTitle");
const systemMessageText = $("systemMessageText");
const systemMessageOkBtn = $("systemMessageOkBtn");

const systemConfirmModal = $("systemConfirmModal");
const systemConfirmTitle = $("systemConfirmTitle");
const systemConfirmText = $("systemConfirmText");
const systemConfirmCancelBtn = $("systemConfirmCancelBtn");
const systemConfirmOkBtn = $("systemConfirmOkBtn");

const systemLoadingModal = $("systemLoadingModal");
const systemLoadingTitle = $("systemLoadingTitle");
const systemLoadingText = $("systemLoadingText");

/* =========================================================
   SISTEMA DE MODAIS
========================================================= */

function openModal(id) {
  const modal = $(id);

  if (modal) {
    modal.classList.remove("hidden");
  }
}

function closeModal(id) {
  const modal = $(id);

  if (modal) {
    modal.classList.add("hidden");
  }
}

function showMessage(title, text) {
  systemMessageTitle.textContent = title || "Aviso";
  systemMessageText.textContent = text || "";
  openModal("systemMessageModal");
}

function showLoading(title, text) {
  systemLoadingTitle.textContent = title || "Processando...";
  systemLoadingText.textContent = text || "Aguarde alguns instantes.";
  openModal("systemLoadingModal");
}

function hideLoading() {
  closeModal("systemLoadingModal");
}

function showConfirm(title, text) {
  systemConfirmTitle.textContent = title || "Confirmar ação";
  systemConfirmText.textContent = text || "";

  openModal("systemConfirmModal");

  return new Promise((resolve) => {
    confirmResolve = resolve;
  });
}

document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", () => {
    closeModal(button.dataset.closeModal);
  });
});

systemMessageOkBtn.addEventListener("click", () => {
  closeModal("systemMessageModal");
});

systemConfirmCancelBtn.addEventListener("click", () => {
  closeModal("systemConfirmModal");

  if (confirmResolve) {
    confirmResolve(false);
    confirmResolve = null;
  }
});

systemConfirmOkBtn.addEventListener("click", () => {
  closeModal("systemConfirmModal");

  if (confirmResolve) {
    confirmResolve(true);
    confirmResolve = null;
  }
});

/* =========================================================
   LOGIN
========================================================= */

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  showLoading("Entrando...", "Verificando suas credenciais.");

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
  } finally {
    hideLoading();
  }
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    loginScreen.classList.add("hidden");
    mainApp.classList.remove("hidden");

    showLoading("Carregando plataforma...", "Buscando dados salvos no Firebase.");

    try {
      await loadAllData();
    } finally {
      hideLoading();
    }
  } else {
    loginScreen.classList.remove("hidden");
    mainApp.classList.add("hidden");
  }
});

logoutBtn.addEventListener("click", async () => {
  const confirmed = await showConfirm(
    "Sair da plataforma",
    "Deseja realmente sair da Central Ascensão Lunar?"
  );

  if (!confirmed) return;

  showLoading("Saindo...", "Encerrando sua sessão.");

  try {
    await signOut(auth);
  } finally {
    hideLoading();
  }
});

/* =========================================================
   NAVEGAÇÃO
========================================================= */

menuButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showPage(button.dataset.page, button.dataset.title, button.dataset.subtitle);
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

async function loadAllData() {
  await loadMembers();
  await loadPoints();
  await loadActivities();
  await loadTexts();
  await loadScoreTypes();
  await loadResponsibles();

  updateDashboard();
}

/* =========================================================
   MEMBROS
========================================================= */

memberForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const rawText = memberSheet.value.trim();

  if (!rawText) {
    showMessage("Ficha vazia", "Cole a ficha do membro antes de reconhecer os dados.");
    return;
  }

  pendingMember = parseMemberSheet(rawText);
  memberPreview.innerHTML = createParsedMemberFormHTML(pendingMember);
  savePreviewMemberBtn.classList.remove("hidden");
});

savePreviewMemberBtn.addEventListener("click", async () => {
  if (!pendingMember) {
    showMessage("Nenhuma ficha reconhecida", "Reconheça uma ficha antes de salvar o membro.");
    return;
  }

  const memberData = getMemberDataFromParsedFields();

  showLoading(
    editingMemberId ? "Atualizando membro..." : "Salvando membro...",
    "Aguarde enquanto os dados são enviados para o Firebase."
  );

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

      showMessage("Membro atualizado", "Os dados do membro foram atualizados com sucesso.");
    } else {
      await addDoc(collection(db, "members"), {
        ...memberData,
        points: 0,
        internalNotes: "",
        rawSheet: memberSheet.value.trim(),
        createdAt: Timestamp.now()
      });

      showMessage("Membro salvo", "O membro foi cadastrado com sucesso.");
    }

    memberForm.reset();
    resetPreview();

    await loadMembers();
    updateDashboard();

    showPage("membersPage", "Membros", "Controle completo dos membros.");
  } catch (error) {
    console.error(error);
    showMessage("Erro ao salvar", "Não foi possível salvar o membro. Verifique o console.");
  } finally {
    hideLoading();
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
    showPage("pointsPage", "Pontuações", "Gerencie pontuações.");
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
    showPage("registerMemberPage", "Cadastro", "Cadastro de novos membros.");
  }

  if (action === "delete") {
    const confirmed = await showConfirm(
      "Excluir membro",
      `Deseja excluir ${member.name}? Esta ação não apaga automaticamente os registros de pontos já lançados.`
    );

    if (!confirmed) return;

    showLoading("Excluindo membro...", "Removendo cadastro do Firebase.");

    try {
      await deleteDoc(doc(db, "members", member.id));
      await loadMembers();
      updateDashboard();

      showMessage("Membro excluído", "O membro foi removido com sucesso.");
    } catch (error) {
      console.error(error);
      showMessage("Erro ao excluir", "Não foi possível excluir o membro.");
    } finally {
      hideLoading();
    }
  }
});

internalNotesForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const memberId = internalNotesMemberId.value;

  if (!memberId) {
    showMessage("Nenhum membro selecionado", "Abra o perfil de um membro antes de salvar observações.");
    return;
  }

  showLoading("Salvando observações...", "Atualizando as anotações internas.");

  try {
    await updateDoc(doc(db, "members", memberId), {
      internalNotes: internalNotesText.value.trim()
    });

    await loadMembers();

    const updatedMember = allMembers.find((member) => member.id === memberId);

    if (updatedMember) {
      openMemberProfile(updatedMember);
    }

    showMessage("Observações salvas", "As observações internas foram salvas com sucesso.");
  } catch (error) {
    console.error(error);
    showMessage("Erro ao salvar", "Não foi possível salvar as observações internas.");
  } finally {
    hideLoading();
  }
});

async function loadMembers() {
  const q = query(collection(db, "members"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  allMembers = [];

  pointsMember.innerHTML = `<option value="">Selecione um membro</option>`;
  textMember.innerHTML = `<option value="">Selecione um membro</option>`;
  deliveryMember.innerHTML = `<option value="">Selecione um membro</option>`;

  snapshot.forEach((docItem) => {
    const member = {
      id: docItem.id,
      ...docItem.data()
    };

    allMembers.push(member);

    const option = `
      <option value="${member.id}">
        ${escapeHTML(member.name || "Sem nome")}
      </option>
    `;

    pointsMember.innerHTML += option;
    textMember.innerHTML += option;
    deliveryMember.innerHTML += option;
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

    return searchableText.includes(searchTerm) && (!statusFilter || member.status === statusFilter);
  });

  membersList.innerHTML = filteredMembers.length
    ? filteredMembers.map((member) => createMemberCardHTML(member)).join("")
    : `<div class="empty-state">Nenhum membro encontrado.</div>`;

  membersCount.textContent = `${filteredMembers.length} membros`;
}

function openMemberProfile(member) {
  const memberPoints = allPoints.filter((point) => point.memberId === member.id);
  const memberTexts = allTexts.filter((text) => text.memberId === member.id);

  memberProfileContent.innerHTML = createMemberProfileHTML(member, memberPoints, memberTexts);

  internalNotesMemberId.value = member.id;
  internalNotesText.value = member.internalNotes || "";

  showPage("memberProfilePage", "Perfil do membro", "Informações completas e observações internas.");
}

/* =========================================================
   PONTUAÇÕES
========================================================= */

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
    showMessage("Membro obrigatório", "Selecione um membro válido.");
    return;
  }

  if (!pointsResponsible.value) {
    showMessage("Responsável obrigatório", "Selecione um responsável pelo lançamento.");
    return;
  }

  showLoading("Salvando pontuação...", "Registrando movimentação e atualizando pontos do membro.");

  try {
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

    showMessage("Pontuação salva", "A pontuação foi registrada com sucesso.");
  } catch (error) {
    console.error(error);
    showMessage("Erro ao pontuar", "Não foi possível salvar a pontuação.");
  } finally {
    hideLoading();
  }
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
    pointsHistory.innerHTML = `<div class="empty-state">Nenhum ponto lançado ainda.</div>`;
    latestMovements.innerHTML = `<div class="empty-state">Nenhuma movimentação registrada ainda.</div>`;
  }

  totalPoints.textContent = total;
}

clearPointsBtn.addEventListener("click", async () => {
  const firstConfirm = await showConfirm(
    "Limpar pontuações",
    "Esta ação vai apagar TODOS os registros de pontuação e zerar os pontos de TODOS os membros. Deseja continuar?"
  );

  if (!firstConfirm) return;

  const secondConfirm = await showConfirm(
    "Confirmação final",
    "Confirma novamente? Esta ação não pode ser desfeita sem backup."
  );

  if (!secondConfirm) return;

  showLoading("Limpando pontuações...", "Apagando registros e zerando pontos dos membros.");

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

    showMessage("Pontuações limpas", "Os registros foram apagados e os membros foram zerados.");
  } catch (error) {
    console.error(error);
    clearPointsMessage.textContent = "Erro ao limpar registros de pontuação.";
    showMessage("Erro ao limpar", "Não foi possível limpar os registros de pontuação.");
  } finally {
    hideLoading();
  }
});

/* =========================================================
   RANKINGS
========================================================= */

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

/* =========================================================
   ATIVIDADES
========================================================= */

openCreateActivityModalBtn.addEventListener("click", () => {
  editingActivityId = null;
  activityForm.reset();
  activityStatus.value = "Aberta";
  openModal("createActivityModal");
});

activityForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const activityData = {
    title: activityTitle.value,
    description: activityDescription.value,
    deadline: activityDeadline.value,
    points: Number(activityPoints.value || 0),
    winnerPoints: Number(activityWinnerPoints.value || 0),
    status: activityStatus.value
  };

  showLoading(
    editingActivityId ? "Atualizando atividade..." : "Salvando atividade...",
    "Aguarde enquanto a atividade é salva."
  );

  try {
    if (editingActivityId) {
      const oldActivity = allActivities.find((item) => item.id === editingActivityId);

      await updateDoc(doc(db, "activities", editingActivityId), {
        ...activityData,
        deliveries: oldActivity?.deliveries || [],
        winner: oldActivity?.winner || null,
        createdAt: oldActivity?.createdAt || Timestamp.now()
      });

      editingActivityId = null;

      showMessage("Atividade atualizada", "A atividade foi atualizada com sucesso.");
    } else {
      await addDoc(collection(db, "activities"), {
        ...activityData,
        deliveries: [],
        winner: null,
        createdAt: Timestamp.now()
      });

      showMessage("Atividade salva", "A atividade foi cadastrada com sucesso.");
    }

    activityForm.reset();
    activityStatus.value = "Aberta";
    closeModal("createActivityModal");

    await loadActivities();
    updateDashboard();
  } catch (error) {
    console.error(error);
    showMessage("Erro ao salvar", "Não foi possível salvar a atividade.");
  } finally {
    hideLoading();
  }
});

activitiesList.addEventListener("click", (event) => {
  const card = event.target.closest(".activity-simple-card");

  if (!card) return;

  openActivityDetail(card.dataset.id);
});

backToActivitiesBtn.addEventListener("click", () => {
  showPage("activitiesPage", "Atividades", "Controle de atividades.");
});

openDeliveryModalBtn.addEventListener("click", () => {
  if (!currentActivityId) return;

  deliveryActivityId.value = currentActivityId;
  editingDeliveryId.value = "";
  saveDeliveryBtn.textContent = "Registrar entrega";
  activityDeliveryForm.reset();
  deliveryActivityId.value = currentActivityId;

  openModal("deliveryModal");
});

openDeliveriesPageBtn.addEventListener("click", () => {
  if (!currentActivityId) return;

  renderDeliveriesPage(currentActivityId);
  showPage("deliveriesPage", "Entregas registradas", "Lista de entregas da atividade.");
});

backToActivityBtn.addEventListener("click", () => {
  if (!currentActivityId) return;
  openActivityDetail(currentActivityId);
});

activityDeliveryForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const activity = allActivities.find((item) => item.id === deliveryActivityId.value);
  const member = allMembers.find((item) => item.id === deliveryMember.value);

  if (!activity || !member) {
    showMessage("Dados incompletos", "Selecione uma atividade e um membro.");
    return;
  }

  const deliveries = [...(activity.deliveries || [])];
  const editingId = editingDeliveryId.value;

  showLoading(
    editingId ? "Atualizando entrega..." : "Registrando entrega...",
    "Aguarde enquanto salvamos as informações."
  );

  try {
    if (editingId) {
      const delivery = deliveries.find((item) => item.id === editingId);

      if (delivery) {
        delivery.text = deliveryText.value;
        delivery.updatedAt = new Date().toISOString();
      }

      editingDeliveryId.value = "";
      saveDeliveryBtn.textContent = "Registrar entrega";
    } else {
      const alreadyDelivered = deliveries.some((item) => item.memberId === member.id);

      if (alreadyDelivered) {
        hideLoading();
        showMessage("Entrega já registrada", "Esse membro já tem uma entrega registrada nessa atividade.");
        return;
      }

      deliveries.push({
        id: crypto.randomUUID(),
        memberId: member.id,
        memberName: member.name || "",
        memberUser: member.wattpad || member.user || "",
        text: deliveryText.value,
        date: new Date().toISOString().slice(0, 10),
        pointsGiven: false,
        winnerPointsGiven: false
      });
    }

    await updateDoc(doc(db, "activities", activity.id), { deliveries });

    activityDeliveryForm.reset();
    closeModal("deliveryModal");

    await loadActivities();
    openActivityDetail(activity.id);

    showMessage("Entrega salva", editingId ? "A entrega foi atualizada." : "A entrega foi registrada com sucesso.");
  } catch (error) {
    console.error(error);
    showMessage("Erro ao salvar", "Não foi possível salvar a entrega.");
  } finally {
    hideLoading();
  }
});

activityWinnerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const activity = allActivities.find((item) => item.id === winnerActivityId.value);

  if (!activity) return;

  const delivery = (activity.deliveries || []).find(
    (item) => item.memberId === activityWinnerSelect.value
  );

  if (!delivery) {
    showMessage("Vencedor inválido", "Selecione um vencedor entre os membros que entregaram a atividade.");
    return;
  }

  showLoading("Salvando vencedor...", "Registrando vencedor do desafio.");

  try {
    await updateDoc(doc(db, "activities", activity.id), {
      winner: {
        memberId: delivery.memberId,
        name: delivery.memberName
      }
    });

    await loadActivities();
    openActivityDetail(activity.id);

    showMessage("Vencedor salvo", "O vencedor foi salvo com sucesso.");
  } catch (error) {
    console.error(error);
    showMessage("Erro ao salvar vencedor", "Não foi possível salvar o vencedor.");
  } finally {
    hideLoading();
  }
});

completeActivityBtn.addEventListener("click", async () => {
  if (!currentActivityId) return;

  const activity = allActivities.find((item) => item.id === currentActivityId);

  if (!activity) return;

  const confirmed = await showConfirm(
    "Concluir desafio",
    "Deseja concluir este desafio? O status será alterado para Encerrada."
  );

  if (!confirmed) return;

  showLoading("Concluindo desafio...", "Atualizando status da atividade.");

  try {
    await updateDoc(doc(db, "activities", activity.id), {
      status: "Encerrada"
    });

    await loadActivities();
    openActivityDetail(activity.id);
    updateDashboard();

    showMessage("Desafio concluído", "O desafio foi encerrado com sucesso.");
  } catch (error) {
    console.error(error);
    showMessage("Erro ao concluir", "Não foi possível concluir o desafio.");
  } finally {
    hideLoading();
  }
});

editCurrentActivityBtn.addEventListener("click", () => {
  const activity = allActivities.find((item) => item.id === currentActivityId);

  if (!activity) return;

  editingActivityId = activity.id;

  activityTitle.value = activity.title || "";
  activityDescription.value = activity.description || "";
  activityDeadline.value = activity.deadline || "";
  activityPoints.value = activity.points || "";
  activityWinnerPoints.value = activity.winnerPoints || "";
  activityStatus.value = activity.status || "Aberta";

  openModal("createActivityModal");
});

deleteCurrentActivityBtn.addEventListener("click", async () => {
  const activity = allActivities.find((item) => item.id === currentActivityId);

  if (!activity) return;

  const confirmed = await showConfirm(
    "Excluir atividade",
    `Deseja excluir a atividade "${activity.title}"? Esta ação não pode ser desfeita.`
  );

  if (!confirmed) return;

  showLoading("Excluindo atividade...", "Removendo atividade do Firebase.");

  try {
    await deleteDoc(doc(db, "activities", activity.id));

    currentActivityId = null;

    await loadActivities();
    updateDashboard();

    showPage("activitiesPage", "Atividades", "Controle de atividades.");

    showMessage("Atividade excluída", "A atividade foi removida com sucesso.");
  } catch (error) {
    console.error(error);
    showMessage("Erro ao excluir", "Não foi possível excluir a atividade.");
  } finally {
    hideLoading();
  }
});

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

    activitiesList.innerHTML += createActivitySimpleCardHTML(activity);
  });

  if (!allActivities.length) {
    activitiesList.innerHTML = `<div class="empty-state">Nenhuma atividade cadastrada ainda.</div>`;
  }

  openActivities.textContent = totalOpen;
}

function openActivityDetail(activityId) {
  const activity = allActivities.find((item) => item.id === activityId);

  if (!activity) return;

  currentActivityId = activity.id;

  deliveryActivityId.value = activity.id;
  winnerActivityId.value = activity.id;

  editingDeliveryId.value = "";
  saveDeliveryBtn.textContent = "Registrar entrega";

  renderActivityDetail(activity);
  renderWinnerSelect(activity);

  showPage("activityDetailPage", activity.title || "Atividade", "Controle completo da atividade.");
}

function renderWinnerSelect(activity) {
  activityWinnerSelect.innerHTML = `<option value="">Selecione um vencedor</option>`;

  (activity.deliveries || []).forEach((delivery) => {
    activityWinnerSelect.innerHTML += `
      <option value="${delivery.memberId}">
        ${escapeHTML(delivery.memberName)}
      </option>
    `;
  });

  if (activity.winner?.memberId) {
    activityWinnerSelect.value = activity.winner.memberId;
  }
}

function renderActivityDetail(activity) {
  const deliveries = activity.deliveries || [];

  activityDetailContent.innerHTML = `
    <div class="activity-hero">
      <div class="activity-hero-top">
        <div>
          <h1 class="activity-hero-title">${escapeHTML(activity.title || "Sem título")}</h1>

          <div class="activity-status-badge">${escapeHTML(activity.status || "Aberta")}</div>

          <p class="activity-hero-description">${escapeHTML(activity.description || "Sem descrição.")}</p>
        </div>
      </div>

      <div class="activity-info-grid">
        <div class="activity-info-card">
          <span>Prazo</span>
          <strong>${formatDate(activity.deadline)}</strong>
        </div>

        <div class="activity-info-card">
          <span>Pontos por entrega</span>
          <strong>${Number(activity.points || 0)}</strong>
        </div>

        <div class="activity-info-card">
          <span>Bônus vencedor</span>
          <strong>${Number(activity.winnerPoints || 0)}</strong>
        </div>

        <div class="activity-info-card">
          <span>Entregas</span>
          <strong>${deliveries.length}</strong>
        </div>
      </div>

      ${
        activity.winner
          ? `
            <div class="winner-highlight">
              <span>Vencedor atual</span>
              <strong>${escapeHTML(activity.winner.name)}</strong>
            </div>
          `
          : ""
      }
    </div>
  `;
}

function renderDeliveriesPage(activityId) {
  const activity = allActivities.find((item) => item.id === activityId);

  if (!activity) return;

  const deliveries = activity.deliveries || [];

  deliveriesList.innerHTML = deliveries.length
    ? deliveries.map((delivery) => createDeliveryCardHTML(activity, delivery)).join("")
    : `<div class="empty-state">Nenhuma entrega registrada ainda.</div>`;
}

function createActivitySimpleCardHTML(activity) {
  const deliveries = activity.deliveries || [];

  return `
    <div class="activity-simple-card" data-id="${activity.id}">
      <div class="activity-simple-top">
        <div>
          <h3 class="activity-simple-title">${escapeHTML(activity.title || "Sem título")}</h3>

          <p class="activity-simple-description">
            ${escapeHTML(activity.description || "Sem descrição.")}
          </p>

          <div class="activity-simple-meta">
            <span class="activity-simple-pill">Status: ${escapeHTML(activity.status || "Aberta")}</span>
            <span class="activity-simple-pill">Entregas: ${deliveries.length}</span>
            <span class="activity-simple-pill">Prazo: ${formatDate(activity.deadline)}</span>
          </div>
        </div>

        <button type="button" class="btn btn-primary activity-open-btn">Abrir</button>
      </div>
    </div>
  `;
}

function createDeliveryCardHTML(activity, delivery) {
  return `
    <div class="delivery-card">
      <div class="delivery-card-top">
        <div>
          <h3 class="delivery-member-name">${escapeHTML(delivery.memberName)}</h3>
          <span class="delivery-member-user">${escapeHTML(delivery.memberUser || "Sem user")}</span>
        </div>

        <span class="delivery-date">${formatDate(delivery.date)}</span>
      </div>

      <p class="delivery-preview">${escapeHTML(delivery.text || "")}</p>

      <div class="delivery-actions">
        <button class="btn btn-primary btn-small" data-action="view-delivery" data-activity="${activity.id}" data-delivery="${delivery.id}">
          Ver texto
        </button>

        <button class="btn btn-secondary btn-small" data-action="edit-delivery" data-activity="${activity.id}" data-delivery="${delivery.id}">
          Editar
        </button>

        <button class="btn btn-danger btn-small" data-action="delete-delivery" data-activity="${activity.id}" data-delivery="${delivery.id}">
          Excluir
        </button>
      </div>
    </div>
  `;
}

deliveriesList.addEventListener("click", async (event) => {
  const button = event.target.closest("button");

  if (!button) return;

  const action = button.dataset.action;
  const activityId = button.dataset.activity;
  const deliveryId = button.dataset.delivery;

  const activity = allActivities.find((item) => item.id === activityId);

  if (!activity) return;

  const delivery = (activity.deliveries || []).find((item) => item.id === deliveryId);

  if (!delivery) return;

  if (action === "view-delivery") {
    textViewerTitle.textContent = delivery.memberName;
    textViewerMeta.textContent = activity.title;
    textViewerContent.textContent = delivery.text || "";
    openModal("textViewerModal");
  }

  if (action === "edit-delivery") {
    deliveryActivityId.value = activity.id;
    deliveryMember.value = delivery.memberId;
    deliveryText.value = delivery.text || "";
    editingDeliveryId.value = delivery.id;
    saveDeliveryBtn.textContent = "Salvar edição";
    openModal("deliveryModal");
  }

  if (action === "delete-delivery") {
    const confirmed = await showConfirm(
      "Excluir entrega",
      "Deseja excluir esta entrega?"
    );

    if (!confirmed) return;

    showLoading("Excluindo entrega...", "Atualizando entregas da atividade.");

    try {
      const deliveries = (activity.deliveries || []).filter((item) => item.id !== deliveryId);

      await updateDoc(doc(db, "activities", activity.id), { deliveries });

      await loadActivities();
      renderDeliveriesPage(activity.id);

      showMessage("Entrega excluída", "A entrega foi removida com sucesso.");
    } catch (error) {
      console.error(error);
      showMessage("Erro ao excluir", "Não foi possível excluir a entrega.");
    } finally {
      hideLoading();
    }
  }
});

/* =========================================================
   TEXTOS
========================================================= */

openCreateTextModalBtn.addEventListener("click", () => {
  editingTextId = null;
  textForm.reset();
  openModal("createTextModal");
});

textForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const selectedMember = allMembers.find((member) => member.id === textMember.value);

  const textData = {
    memberId: textMember.value,
    memberName: selectedMember?.name || "",
    title: textTitle.value,
    type: textType.value,
    content: textContent.value,
    status: textStatus.value
  };

  showLoading(
    editingTextId ? "Atualizando texto..." : "Salvando texto...",
    "Aguarde enquanto o texto é salvo."
  );

  try {
    if (editingTextId) {
      const oldText = allTexts.find((item) => item.id === editingTextId);

      await updateDoc(doc(db, "texts", editingTextId), {
        ...textData,
        createdAt: oldText?.createdAt || Timestamp.now()
      });

      editingTextId = null;

      showMessage("Texto atualizado", "O texto foi atualizado com sucesso.");
    } else {
      await addDoc(collection(db, "texts"), {
        ...textData,
        createdAt: Timestamp.now()
      });

      showMessage("Texto salvo", "O texto foi registrado na biblioteca.");
    }

    textForm.reset();
    closeModal("createTextModal");

    await loadTexts();
    updateDashboard();
  } catch (error) {
    console.error(error);
    showMessage("Erro ao salvar", "Não foi possível salvar o texto.");
  } finally {
    hideLoading();
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

      openModal("createTextModal");
    }

    if (action === "delete-text") {
      const confirmed = await showConfirm(
        "Excluir texto",
        `Deseja excluir o texto "${text.title}"?`
      );

      if (!confirmed) return;

      showLoading("Excluindo texto...", "Removendo texto da biblioteca.");

      try {
        await deleteDoc(doc(db, "texts", textId));
        await loadTexts();
        updateDashboard();

        showMessage("Texto excluído", "O texto foi removido com sucesso.");
      } catch (error) {
        console.error(error);
        showMessage("Erro ao excluir", "Não foi possível excluir o texto.");
      } finally {
        hideLoading();
      }
    }

    return;
  }

  if (item) {
    const textId = item.dataset.id;
    const text = allTexts.find((entry) => entry.id === textId);

    if (text) {
      textViewerTitle.textContent = text.title || "Sem título";
      textViewerMeta.textContent = `${text.memberName || "Autor não informado"} • ${text.type || ""} • ${text.status || ""}`;
      textViewerContent.textContent = text.content || "Sem conteúdo.";
      openModal("textViewerModal");
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

/* =========================================================
   CONFIGURAÇÕES
========================================================= */

scoreTypeForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  showLoading("Salvando tipo...", "Registrando novo tipo de pontuação.");

  try {
    await addDoc(collection(db, "scoreTypes"), {
      name: scoreTypeName.value,
      value: Number(scoreTypeValue.value || 0),
      createdAt: Timestamp.now()
    });

    scoreTypeForm.reset();
    await loadScoreTypes();

    showMessage("Tipo salvo", "O tipo de pontuação foi cadastrado.");
  } catch (error) {
    console.error(error);
    showMessage("Erro ao salvar", "Não foi possível salvar o tipo de pontuação.");
  } finally {
    hideLoading();
  }
});

scoreTypesList.addEventListener("click", async (event) => {
  const button = event.target.closest("button");

  if (!button) return;

  const confirmed = await showConfirm(
    "Excluir tipo de pontuação",
    "Deseja excluir este tipo de pontuação?"
  );

  if (!confirmed) return;

  showLoading("Excluindo tipo...", "Removendo tipo de pontuação.");

  try {
    await deleteDoc(doc(db, "scoreTypes", button.dataset.id));
    await loadScoreTypes();

    showMessage("Tipo excluído", "O tipo de pontuação foi removido.");
  } catch (error) {
    console.error(error);
    showMessage("Erro ao excluir", "Não foi possível excluir o tipo de pontuação.");
  } finally {
    hideLoading();
  }
});

async function loadScoreTypes() {
  const snapshot = await getDocs(collection(db, "scoreTypes"));

  allScoreTypes = [];
  scoreTypesList.innerHTML = "";
  pointsType.innerHTML = `<option value="">Selecionar manualmente</option>`;

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

responsibleForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  showLoading("Salvando responsável...", "Registrando responsável.");

  try {
    await addDoc(collection(db, "responsibles"), {
      name: responsibleName.value,
      createdAt: Timestamp.now()
    });

    responsibleForm.reset();
    await loadResponsibles();

    showMessage("Responsável salvo", "O responsável foi cadastrado.");
  } catch (error) {
    console.error(error);
    showMessage("Erro ao salvar", "Não foi possível salvar o responsável.");
  } finally {
    hideLoading();
  }
});

responsiblesList.addEventListener("click", async (event) => {
  const button = event.target.closest("button");

  if (!button) return;

  const confirmed = await showConfirm(
    "Excluir responsável",
    "Deseja excluir este responsável?"
  );

  if (!confirmed) return;

  showLoading("Excluindo responsável...", "Removendo responsável.");

  try {
    await deleteDoc(doc(db, "responsibles", button.dataset.id));
    await loadResponsibles();

    showMessage("Responsável excluído", "O responsável foi removido.");
  } catch (error) {
    console.error(error);
    showMessage("Erro ao excluir", "Não foi possível excluir o responsável.");
  } finally {
    hideLoading();
  }
});

async function loadResponsibles() {
  const snapshot = await getDocs(collection(db, "responsibles"));

  allResponsibles = [];
  responsiblesList.innerHTML = "";
  pointsResponsible.innerHTML = `<option value="">Selecione</option>`;

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

/* =========================================================
   BACKUP
========================================================= */

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

  showMessage("Backup exportado", "O arquivo JSON do backup foi gerado.");
});

importBackupInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];

  if (!file) return;

  const confirmed = await showConfirm(
    "Importar backup",
    "Importar backup adicionará os dados ao Firebase e pode duplicar registros. Continuar?"
  );

  if (!confirmed) return;

  showLoading("Importando backup...", "Esse processo pode demorar alguns segundos.");

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

    showMessage("Backup importado", "Os dados foram importados com sucesso.");
  } catch (error) {
    console.error(error);
    backupMessage.textContent = "Erro ao importar backup.";
    showMessage("Erro ao importar", "Não foi possível importar o backup.");
  } finally {
    hideLoading();
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

/* =========================================================
   RELATÓRIOS
========================================================= */

reportForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const type = reportType.value;

  if (type === "members") generateMembersReport();
  if (type === "ranking-general") generateGeneralRankingReport();
  if (type === "points") generatePointsReport();
  if (type === "activities") generateActivitiesReport();
  if (type === "texts") generateTextsReport();

  copyReportBtn.classList.remove("hidden");
});

copyReportBtn.addEventListener("click", async () => {
  if (!currentReportCopyText) {
    showMessage("Nenhum relatório", "Gere um relatório primeiro.");
    return;
  }

  await navigator.clipboard.writeText(currentReportCopyText);
  showMessage("Relatório copiado", "O relatório foi copiado para a área de transferência.");
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
  const rows = allMembers.map((member) => ({
    name: member.name || "",
    user: member.wattpad || member.user || "",
    points: Number(member.points || 0),
    reason: member.status || ""
  }));

  currentReportCopyText = rows
    .map((row) => `${row.name} - ${row.user} - ${row.points} - ${row.reason}`)
    .join("\n");

  reportArea.innerHTML = `
    ${createReportHeader("Relatório de membros")}

    <p class="report-subtitle">Total de membros cadastrados: ${allMembers.length}</p>

    <table class="report-table">
      <thead>
        <tr>
          <th>Nome</th>
          <th>User</th>
          <th>Pontos</th>
          <th>Status</th>
        </tr>
      </thead>

      <tbody>
        ${rows.map((row) => `
          <tr>
            <td>${escapeHTML(row.name)}</td>
            <td>${escapeHTML(row.user)}</td>
            <td>${row.points}</td>
            <td>${escapeHTML(row.reason)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function generateGeneralRankingReport() {
  const ranking = [...allMembers]
    .sort((a, b) => Number(b.points || 0) - Number(a.points || 0));

  const rows = ranking.map((member) => ({
    name: member.name || "",
    user: member.wattpad || member.user || "",
    points: Number(member.points || 0),
    reason: "Ranking geral"
  }));

  currentReportCopyText = rows
    .map((row) => `${row.name} - ${row.user} - ${row.points} - ${row.reason}`)
    .join("\n");

  reportArea.innerHTML = `
    ${createReportHeader("Ranking geral acumulado")}

    <table class="report-table">
      <thead>
        <tr>
          <th>Posição</th>
          <th>Nome</th>
          <th>User</th>
          <th>Pontos</th>
        </tr>
      </thead>

      <tbody>
        ${rows.map((row, index) => `
          <tr>
            <td>#${index + 1}</td>
            <td>${escapeHTML(row.name)}</td>
            <td>${escapeHTML(row.user)}</td>
            <td>${row.points}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function generatePointsReport() {
  const points = getFilteredPointsByReportDate();

  const rows = points.map((point) => ({
    name: point.memberName || "",
    user: point.memberUser || "",
    points: Number(point.value || 0),
    reason: point.reason || ""
  }));

  currentReportCopyText = rows
    .map((row) => `${row.name} - ${row.user} - ${row.points} - ${row.reason}`)
    .join("\n");

  reportArea.innerHTML = `
    ${createReportHeader("Histórico de pontuação")}

    <p class="report-subtitle">Total de registros: ${points.length}</p>

    <table class="report-table">
      <thead>
        <tr>
          <th>Data</th>
          <th>Nome</th>
          <th>User</th>
          <th>Pontos</th>
          <th>Motivo</th>
        </tr>
      </thead>

      <tbody>
        ${points.map((point, index) => `
          <tr>
            <td>${formatDate(point.date)}</td>
            <td>${escapeHTML(rows[index].name)}</td>
            <td>${escapeHTML(rows[index].user)}</td>
            <td>${rows[index].points}</td>
            <td>${escapeHTML(rows[index].reason)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function generateActivitiesReport() {
  const activities = getFilteredActivitiesByReportDate();

  const rows = activities.map((activity) => ({
    name: activity.title || "",
    user: activity.status || "",
    points: Number(activity.points || 0),
    reason: `${(activity.deliveries || []).length} entregas`
  }));

  currentReportCopyText = rows
    .map((row) => `${row.name} - ${row.user} - ${row.points} - ${row.reason}`)
    .join("\n");

  reportArea.innerHTML = `
    ${createReportHeader("Relatório de atividades")}

    <p class="report-subtitle">Total de atividades: ${activities.length}</p>

    <table class="report-table">
      <thead>
        <tr>
          <th>Atividade</th>
          <th>Status</th>
          <th>Pontos</th>
          <th>Entregas</th>
        </tr>
      </thead>

      <tbody>
        ${rows.map((row) => `
          <tr>
            <td>${escapeHTML(row.name)}</td>
            <td>${escapeHTML(row.user)}</td>
            <td>${row.points}</td>
            <td>${escapeHTML(row.reason)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function generateTextsReport() {
  const rows = allTexts.map((text) => ({
    name: text.memberName || "",
    user: text.title || "",
    points: 0,
    reason: text.status || ""
  }));

  currentReportCopyText = rows
    .map((row) => `${row.name} - ${row.user} - ${row.points} - ${row.reason}`)
    .join("\n");

  reportArea.innerHTML = `
    ${createReportHeader("Relatório de textos")}

    <p class="report-subtitle">Total de textos cadastrados: ${allTexts.length}</p>

    <table class="report-table">
      <thead>
        <tr>
          <th>Autor</th>
          <th>Título</th>
          <th>Status</th>
        </tr>
      </thead>

      <tbody>
        ${rows.map((row) => `
          <tr>
            <td>${escapeHTML(row.name)}</td>
            <td>${escapeHTML(row.user)}</td>
            <td>${escapeHTML(row.reason)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function createReportHeader(title) {
  return `
    <div class="report-header">
      <div>
        <h2>${escapeHTML(title)}</h2>
        <p>Ascensão Lunar • Gerado em ${new Date().toLocaleString("pt-BR")}</p>
      </div>
    </div>
  `;
}

/* =========================================================
   HTML DINÂMICO
========================================================= */

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
    <div class="profile-hero">
      <div class="profile-hero-top">
        <div class="profile-title-block">
          <div class="profile-avatar">🌙</div>

          <div>
            <div class="profile-name">${escapeHTML(member.name || "Sem nome")}</div>
            <div class="profile-user">${escapeHTML(member.wattpad || "Sem Wattpad")}</div>
          </div>
        </div>

        <div class="profile-score-box">
          <strong>${Number(member.points || 0)}</strong>
          <span>pontos</span>
        </div>
      </div>

      <div class="badges-row">
        <span class="badge ${getStatusClass(member.status)}">${escapeHTML(member.status || "Novo")}</span>
        <span class="badge">${escapeHTML(member.writingGenre || "Sem gênero")}</span>
      </div>

      <div class="profile-info-grid">
        <div class="profile-info-card">
          <span>Telefone</span>
          <strong>${escapeHTML(member.phone || "Não informado")}</strong>
        </div>

        <div class="profile-info-card">
          <span>Idade</span>
          <strong>${escapeHTML(member.age || "Não informada")}</strong>
        </div>

        <div class="profile-info-card">
          <span>Obra concluída</span>
          <strong>${escapeHTML(member.completedWork || "Não informado")}</strong>
        </div>
      </div>
    </div>

    <div class="profile-section-card">
      <h3>Dúvida ou insegurança inicial</h3>
      <p class="hint">${escapeHTML(member.doubts || "Nenhuma informação registrada.")}</p>
    </div>

    <div class="profile-section-card">
      <h3>Histórico de pontos</h3>

      <div class="list compact-list">
        ${
          memberPoints.length
            ? memberPoints.map(createPointHistoryHTML).join("")
            : `<div class="empty-state">Nenhum ponto lançado para este membro.</div>`
        }
      </div>
    </div>

    <div class="profile-section-card">
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

/* =========================================================
   PARSER
========================================================= */

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

      if (match) return match[1].trim();
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

      if (match && match[1].trim()) return match[1].trim();
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

/* =========================================================
   AUXILIARES
========================================================= */

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