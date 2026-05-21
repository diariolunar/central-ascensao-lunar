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

const loginForm = $("loginForm");
const loginMessage = $("loginMessage");
const loginScreen = $("loginScreen");
const mainApp = $("mainApp");
const menuButtons = document.querySelectorAll(".menu-btn");
const pages = document.querySelectorAll(".page");
const pageTitle = $("pageTitle");
const pageSubtitle = $("pageSubtitle");

const totalMembers = $("totalMembers");
const totalPoints = $("totalPoints");
const openActivities = $("openActivities");
const totalTexts = $("totalTexts");
const dashboardTopMember = $("dashboardTopMember");
const dashboardPendingActivities = $("dashboardPendingActivities");
const dashboardPendingTexts = $("dashboardPendingTexts");

const memberForm = $("memberForm");
const memberSheet = $("memberSheet");
const memberPreview = $("memberPreview");
const savePreviewMemberBtn = $("savePreviewMemberBtn");
const clearPreviewBtn = $("clearPreviewBtn");
const memberSearch = $("memberSearch");
const memberStatusFilter = $("memberStatusFilter");
const membersList = $("membersList");
const membersCount = $("membersCount");

const memberProfileContent = $("memberProfileContent");
const internalNotesForm = $("internalNotesForm");
const internalNotesMemberId = $("internalNotesMemberId");
const internalNotesText = $("internalNotesText");

const pointsForm = $("pointsForm");
const pointsMember = $("pointsMember");
const pointsType = $("pointsType");
const pointsHistory = $("pointsHistory");
const latestMovements = $("latestMovements");

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

const logoutBtn = $("logoutBtn");

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

menuButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showPage(button.dataset.page, button.dataset.title, button.dataset.subtitle);
  });
});

async function loadAllData() {
  await loadMembers();
  await loadPoints();
  await loadActivities();
  await loadTexts();
  await loadScoreTypes();
  await loadResponsibles();
  updateDashboard();
}

/* MEMBROS */

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
        rawSheet: memberSheet.value.trim()
      });

      editingMemberId = null;
      savePreviewMemberBtn.textContent = "Salvar membro";
    } else {
      await addDoc(collection(db, "members"), {
        ...memberData,
        points: 0,
        rawSheet: memberSheet.value.trim(),
        internalNotes: "",
        createdAt: Timestamp.now()
      });
    }

    memberForm.reset();
    resetPreview();
    await loadMembers();
    updateDashboard();

    showPage("membersPage", "Membros", "Cards e controle dos autores cadastrados.");
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

  const memberId = button.dataset.id;
  const action = button.dataset.action;
  const member = allMembers.find((item) => item.id === memberId);

  if (!member) return;

  if (action === "view") {
    openMemberProfile(member);
  }

  if (action === "quick-points") {
    showPage("pointsPage", "Pontuações", "Adicione ou retire pontos dos membros.");
    pointsMember.value = memberId;
    $("pointsValue").focus();
  }

  if (action === "edit") {
    editingMemberId = memberId;
    memberSheet.value = member.rawSheet || formatMemberDetails(member);
    pendingMember = normalizeOldMember(member);
    memberPreview.innerHTML = createParsedMemberFormHTML(pendingMember);
    savePreviewMemberBtn.textContent = "Salvar alterações";
    savePreviewMemberBtn.classList.remove("hidden");
    showPage("registerMemberPage", "Editar membro", "Altere os campos e salve as mudanças.");
  }

  if (action === "delete") {
    if (!confirm(`Excluir ${member.name}?`)) return;

    await deleteDoc(doc(db, "members", memberId));
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
  if (updatedMember) openMemberProfile(updatedMember);

  alert("Observações salvas.");
});

async function loadMembers() {
  const q = query(collection(db, "members"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  allMembers = [];
  pointsMember.innerHTML = `<option value="">Selecione um membro</option>`;
  textMember.innerHTML = `<option value="">Selecione um membro</option>`;

  snapshot.forEach((docItem) => {
    const member = { id: docItem.id, ...docItem.data() };
    allMembers.push(member);

    pointsMember.innerHTML += `<option value="${member.id}">${escapeHTML(member.name)}</option>`;
    textMember.innerHTML += `<option value="${member.id}">${escapeHTML(member.name)}</option>`;
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
      ${member.phone || ""}
      ${member.age || ""}
      ${member.writingGenre || ""}
      ${member.completedWork || ""}
      ${member.status || ""}
    `.toLowerCase();

    return searchableText.includes(searchTerm) && (!statusFilter || member.status === statusFilter);
  });

  membersList.innerHTML = filteredMembers.length
    ? filteredMembers.map((member) => createMemberCardHTML(member, false)).join("")
    : `<div class="empty-state">Nenhum membro encontrado.</div>`;

  membersCount.textContent = `${filteredMembers.length} membros`;
}

function openMemberProfile(member) {
  memberProfileContent.innerHTML = createMemberProfileHTML(member);
  internalNotesMemberId.value = member.id;
  internalNotesText.value = member.internalNotes || "";

  showPage("memberProfilePage", "Perfil do membro", "Informações completas e observações internas.");
}

/* PONTUAÇÕES */

pointsType.addEventListener("change", () => {
  const selected = allScoreTypes.find((type) => type.id === pointsType.value);

  if (selected) {
    $("pointsValue").value = selected.value;
    $("pointsReason").value = selected.name;
  }
});

pointsForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const memberId = pointsMember.value;
  const value = Number($("pointsValue").value);
  const selectedMember = allMembers.find((member) => member.id === memberId);

  if (!selectedMember) {
    alert("Selecione um membro válido.");
    return;
  }

  await addPointToMember({
    member: selectedMember,
    value,
    reason: $("pointsReason").value,
    date: $("pointsDate").value,
    responsible: $("pointsResponsible").value,
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
  let count = 0;

  snapshot.forEach((docItem) => {
    const item = { id: docItem.id, ...docItem.data() };
    allPoints.push(item);

    total += Number(item.value || 0);
    count++;

    const html = createPointHistoryHTML(item);
    pointsHistory.innerHTML += html;

    if (count <= 5) latestMovements.innerHTML += html;
  });

  if (snapshot.empty) {
    pointsHistory.innerHTML = `<div class="empty-state">Nenhum ponto lançado ainda.</div>`;
    latestMovements.innerHTML = `<div class="empty-state">Nenhuma movimentação registrada ainda.</div>`;
  }

  totalPoints.textContent = total;
}

/* RANKINGS */

rankingForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const start = $("rankingStart").value;
  const end = $("rankingEnd").value;

  const ranking = {};

  allPoints.forEach((item) => {
    if (item.date >= start && item.date <= end) {
      ranking[item.memberId] = Number(ranking[item.memberId] || 0) + Number(item.value || 0);
    }
  });

  const finalRanking = Object.entries(ranking)
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

/* ATIVIDADES */

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

  if (editingActivityId) {
    const oldActivity = allActivities.find((item) => item.id === editingActivityId);

    await updateDoc(doc(db, "activities", editingActivityId), {
      ...activity,
      deliveredBy: oldActivity?.deliveredBy || [],
      winners: oldActivity?.winners || [],
      deliveryPointsGiven: oldActivity?.deliveryPointsGiven || [],
      winnerPointsGiven: oldActivity?.winnerPointsGiven || []
    });

    editingActivityId = null;
  } else {
    await addDoc(collection(db, "activities"), activity);
  }

  activityForm.reset();
  $("activityStatus").value = "Aberta";

  await loadActivities();
  updateDashboard();
});

activitiesList.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const activityId = button.dataset.id;
  const memberId = button.dataset.member;
  const action = button.dataset.action;
  const activity = allActivities.find((item) => item.id === activityId);

  if (!activity) return;

  if (action === "toggle-delivery") {
    const deliveredBy = [...(activity.deliveredBy || [])];

    if (deliveredBy.includes(memberId)) deliveredBy.splice(deliveredBy.indexOf(memberId), 1);
    else deliveredBy.push(memberId);

    await updateDoc(doc(db, "activities", activityId), { deliveredBy });
    await loadActivities();
  }

  if (action === "toggle-winner") {
    const winners = [...(activity.winners || [])];

    if (winners.includes(memberId)) winners.splice(winners.indexOf(memberId), 1);
    else winners.push(memberId);

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
    editingActivityId = activityId;
    $("activityTitle").value = activity.title || "";
    $("activityDescription").value = activity.description || "";
    $("activityDeadline").value = activity.deadline || "";
    $("activityPoints").value = activity.points || "";
    $("activityWinnerPoints").value = activity.winnerPoints || "";
    $("activityStatus").value = activity.status || "Aberta";
  }

  if (action === "delete-activity") {
    if (!confirm(`Excluir atividade "${activity.title}"?`)) return;

    await deleteDoc(doc(db, "activities", activityId));
    await loadActivities();
    updateDashboard();
  }
});

async function giveActivityPoints(activity, type) {
  const today = new Date().toISOString().slice(0, 10);

  const targetIds = type === "delivery" ? activity.deliveredBy || [] : activity.winners || [];
  const alreadyGiven = type === "delivery" ? activity.deliveryPointsGiven || [] : activity.winnerPointsGiven || [];
  const value = type === "delivery" ? Number(activity.points || 0) : Number(activity.winnerPoints || 0);

  if (!value) {
    alert("Essa atividade não tem pontos configurados para essa ação.");
    return;
  }

  const pendingIds = targetIds.filter((id) => !alreadyGiven.includes(id));

  if (pendingIds.length === 0) {
    alert("Nenhuma pontuação pendente para lançar.");
    return;
  }

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
        responsible: "Sistema",
        origin: type === "delivery" ? "activity-delivery" : "activity-winner"
      });
    }
  }

  const updatePayload = {};

  if (type === "delivery") {
    updatePayload.deliveryPointsGiven = [...alreadyGiven, ...pendingIds];
  } else {
    updatePayload.winnerPointsGiven = [...alreadyGiven, ...pendingIds];
  }

  await updateDoc(doc(db, "activities", activity.id), updatePayload);

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
    const activity = { id: docItem.id, ...docItem.data() };
    allActivities.push(activity);

    if (activity.status === "Aberta") totalOpen++;
    activitiesList.innerHTML += createActivityHTML(activity);
  });

  if (allActivities.length === 0) {
    activitiesList.innerHTML = `<div class="empty-state">Nenhuma atividade cadastrada ainda.</div>`;
  }

  openActivities.textContent = totalOpen;
}

/* TEXTOS */

textForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const selectedMember = allMembers.find((member) => member.id === textMember.value);

  const text = {
    memberId: textMember.value,
    memberName: selectedMember?.name || "",
    title: $("textTitle").value,
    type: $("textType").value,
    content: $("textContent").value,
    status: $("textStatus").value,
    createdAt: Timestamp.now()
  };

  if (editingTextId) {
    await updateDoc(doc(db, "texts", editingTextId), text);
    editingTextId = null;
  } else {
    await addDoc(collection(db, "texts"), text);
  }

  textForm.reset();
  await loadTexts();
  updateDashboard();
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
      $("textTitle").value = text.title || "";
      $("textType").value = text.type || "Outro";
      $("textContent").value = text.content || "";
      $("textStatus").value = text.status || "Pendente";
    }

    if (action === "delete-text") {
      if (!confirm(`Excluir texto "${text.title}"?`)) return;

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

    if (text) renderTextViewer(text);
  }
});

async function loadTexts() {
  const q = query(collection(db, "texts"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  allTexts = [];
  textsList.innerHTML = "";

  snapshot.forEach((docItem) => {
    const text = { id: docItem.id, ...docItem.data() };
    allTexts.push(text);
    textsList.innerHTML += createTextItemHTML(text);
  });

  if (allTexts.length === 0) {
    textsList.innerHTML = `<div class="empty-state">Nenhum texto cadastrado ainda.</div>`;
  }

  totalTexts.textContent = allTexts.length;
}

/* CONFIGURAÇÕES */

scoreTypeForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  await addDoc(collection(db, "scoreTypes"), {
    name: $("scoreTypeName").value,
    value: Number($("scoreTypeValue").value || 0),
    createdAt: Timestamp.now()
  });

  scoreTypeForm.reset();
  await loadScoreTypes();
});

responsibleForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  await addDoc(collection(db, "responsibles"), {
    name: $("responsibleName").value,
    createdAt: Timestamp.now()
  });

  responsibleForm.reset();
  await loadResponsibles();
});

scoreTypesList.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  await deleteDoc(doc(db, "scoreTypes", button.dataset.id));
  await loadScoreTypes();
});

responsiblesList.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  await deleteDoc(doc(db, "responsibles", button.dataset.id));
  await loadResponsibles();
});

async function loadScoreTypes() {
  const snapshot = await getDocs(collection(db, "scoreTypes"));

  allScoreTypes = [];
  scoreTypesList.innerHTML = "";
  pointsType.innerHTML = `<option value="">Selecionar tipo manualmente</option>`;

  snapshot.forEach((docItem) => {
    const type = { id: docItem.id, ...docItem.data() };
    allScoreTypes.push(type);

    pointsType.innerHTML += `<option value="${type.id}">${escapeHTML(type.name)} — ${Number(type.value || 0)} pts</option>`;

    scoreTypesList.innerHTML += `
      <div class="settings-item">
        <span>${escapeHTML(type.name)} — ${Number(type.value || 0)} pts</span>
        <button class="btn btn-danger btn-small" data-id="${type.id}">Excluir</button>
      </div>
    `;
  });

  if (allScoreTypes.length === 0) {
    scoreTypesList.innerHTML = `<div class="empty-state">Nenhum tipo cadastrado ainda.</div>`;
  }
}

async function loadResponsibles() {
  const snapshot = await getDocs(collection(db, "responsibles"));

  allResponsibles = [];
  responsiblesList.innerHTML = "";

  snapshot.forEach((docItem) => {
    const responsible = { id: docItem.id, ...docItem.data() };
    allResponsibles.push(responsible);

    responsiblesList.innerHTML += `
      <div class="settings-item">
        <span>${escapeHTML(responsible.name)}</span>
        <button class="btn btn-danger btn-small" data-id="${responsible.id}">Excluir</button>
      </div>
    `;
  });

  if (allResponsibles.length === 0) {
    responsiblesList.innerHTML = `<div class="empty-state">Nenhum responsável cadastrado ainda.</div>`;
  }
}

/* BACKUP */

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

  if (!confirm("Importar backup vai adicionar os dados do arquivo ao Firebase. Continuar?")) {
    return;
  }

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

/* HTML */

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

function createMemberCardHTML(member, isPreview) {
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

      ${
        isPreview ? "" : `
          <div class="member-actions">
            <button class="btn btn-blue btn-small" data-action="view" data-id="${member.id}">Perfil</button>
            <button class="btn btn-primary btn-small" data-action="quick-points" data-id="${member.id}">Pontuar</button>
            <button class="btn btn-secondary btn-small" data-action="edit" data-id="${member.id}">Editar</button>
            <button class="btn btn-danger btn-small" data-action="delete" data-id="${member.id}">Excluir</button>
          </div>
        `
      }
    </article>
  `;
}

function createMemberProfileHTML(member) {
  const memberPoints = allPoints.filter((point) => point.memberId === member.id);
  const memberTexts = allTexts.filter((text) => text.memberId === member.id);

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

function createPointHistoryHTML(item) {
  const className = Number(item.value || 0) >= 0 ? "points-positive" : "points-negative";
  const signal = Number(item.value || 0) > 0 ? "+" : "";

  return `
    <div class="history-item">
      <strong class="${className}">${signal}${Number(item.value || 0)} pontos</strong>
      <p><strong>Membro:</strong> ${escapeHTML(item.memberName || "Não informado")} ${item.memberUser ? `— ${escapeHTML(item.memberUser)}` : ""}</p>
      <p><strong>Motivo:</strong> ${escapeHTML(item.reason || "Sem motivo")}</p>
      <p><strong>Data:</strong> ${escapeHTML(item.date || "Sem data")}</p>
      <p><strong>Responsável:</strong> ${escapeHTML(item.responsible || "Não informado")}</p>
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
          ${winner ? "Vencedor" : "Vencedor"}
        </button>

        <span class="badge ${deliveryPaid || winnerPaid ? "green" : ""}">
          ${deliveryPaid || winnerPaid ? "Pontuado" : "Sem pontos"}
        </span>
      </div>
    `;
  }).join("");

  return `
    <div class="activity-item">
      <strong>${escapeHTML(activity.title)}</strong>
      <p>${escapeHTML(activity.description || "Sem descrição.")}</p>
      <p>Prazo: ${escapeHTML(activity.deadline || "Sem prazo")}</p>
      <p>Pontos por entrega: ${Number(activity.points || 0)}</p>
      <p>Pontos extras para vencedor: ${Number(activity.winnerPoints || 0)}</p>
      <p>Status: ${escapeHTML(activity.status || "Aberta")}</p>

      <div class="item-actions">
        <button class="btn btn-primary btn-small" data-action="give-delivery-points" data-id="${activity.id}">Pontuar entregas</button>
        <button class="btn btn-primary btn-small" data-action="give-winner-points" data-id="${activity.id}">Pontuar vencedores</button>
        <button class="btn btn-secondary btn-small" data-action="edit-activity" data-id="${activity.id}">Editar</button>
        <button class="btn btn-danger btn-small" data-action="delete-activity" data-id="${activity.id}">Excluir</button>
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
      <strong>${escapeHTML(text.title)}</strong>
      <p>Autor: ${escapeHTML(text.memberName || "Não informado")}</p>
      <p>Tipo: ${escapeHTML(text.type)}</p>
      <p>Status: ${escapeHTML(text.status)}</p>

      <div class="item-actions">
        <button class="btn btn-secondary btn-small" data-action="edit-text" data-id="${text.id}">Editar</button>
        <button class="btn btn-danger btn-small" data-action="delete-text" data-id="${text.id}">Excluir</button>
      </div>
    </div>
  `;
}

function renderTextViewer(text) {
  textViewer.innerHTML = `
    <div class="viewer-title">${escapeHTML(text.title)}</div>
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

function renderRanking(finalRanking, podiumContainer, listContainer) {
  podiumContainer.innerHTML = "";
  listContainer.innerHTML = "";

  if (finalRanking.length === 0) {
    podiumContainer.innerHTML = `<div class="empty-state">Nenhum ponto encontrado nesse período.</div>`;
    listContainer.innerHTML = `<div class="empty-state">Nenhum ponto encontrado nesse período.</div>`;
    return;
  }

  finalRanking.slice(0, 3).forEach((item, index) => {
    const medals = ["🥇", "🥈", "🥉"];

    podiumContainer.innerHTML += `
      <article class="podium-card">
        <div class="podium-medal">${medals[index]}</div>
        <div class="podium-position">${index + 1}º lugar</div>
        <div class="podium-name">${escapeHTML(item.name)}</div>
        <p>${escapeHTML(item.user || "Sem user")}</p>
        <div class="podium-points">${item.points}</div>
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
        <p>${escapeHTML(item.user)}</p>
        ${item.work ? `<p>${escapeHTML(item.work)}</p>` : ""}
      </div>
      <div class="ranking-points">${item.points}</div>
    </div>
  `;
}

/* PARSER E HELPERS */

function parseMemberSheet(text) {
  return {
    name: getValueAfterLabel(text, ["Nome"]),
    wattpad: getValueAfterLabel(text, ["User do Wattpad", "Wattpad"]),
    age: getValueAfterLabel(text, ["Idade"]),
    writingGenre: getValueAfterLabel(text, ["Gênero que mais escreve", "Genero que mais escreve"]),
    hasCompletedWork: getValueAfterQuestion(text, ["Tem alguma obra concluída?", "Tem alguma obra concluida?"]),
    completedWork: getValueAfterQuestion(text, ["Se sim, qual?"]),
    doubts: getValueAfterQuestion(text, ["Tem alguma dúvida, insegurança ou algo que gostaria de falar antes de entrar oficialmente no projeto?", "Tem alguma duvida, inseguranca ou algo que gostaria de falar antes de entrar oficialmente no projeto?"]),
    phone: "",
    status: "Novo"
  };
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

function showPage(pageId, title, subtitle) {
  pages.forEach((page) => page.classList.remove("active-page"));
  $(pageId).classList.add("active-page");

  menuButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.page === pageId);
  });

  pageTitle.textContent = title || "Central Ascensão Lunar";
  pageSubtitle.textContent = subtitle || "";
}

function resetPreview() {
  pendingMember = null;
  memberPreview.innerHTML = `<div class="empty-state">Os campos reconhecidos aparecerão aqui. Você poderá corrigir antes de salvar.</div>`;
  savePreviewMemberBtn.classList.add("hidden");
}

function updateDashboard() {
  const sortedMembers = [...allMembers].sort((a, b) => Number(b.points || 0) - Number(a.points || 0));
  const pendingTexts = allTexts.filter((text) => text.status === "Pendente").length;
  const pendingActivities = allActivities.filter((activity) => activity.status === "Aberta").length;

  dashboardTopMember.textContent = sortedMembers[0]
    ? `${sortedMembers[0].name} (${Number(sortedMembers[0].points || 0)} pts)`
    : "Sem dados";

  dashboardPendingTexts.textContent = pendingTexts;
  dashboardPendingActivities.textContent = pendingActivities;
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