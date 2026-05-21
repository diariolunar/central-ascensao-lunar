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

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const loginScreen = document.getElementById("loginScreen");
const mainApp = document.getElementById("mainApp");

const menuButtons = document.querySelectorAll(".menu-btn");
const pages = document.querySelectorAll(".page");
const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");

const totalMembers = document.getElementById("totalMembers");
const totalPoints = document.getElementById("totalPoints");
const openActivities = document.getElementById("openActivities");
const totalTexts = document.getElementById("totalTexts");

const memberForm = document.getElementById("memberForm");
const memberSheet = document.getElementById("memberSheet");
const memberPreview = document.getElementById("memberPreview");
const savePreviewMemberBtn = document.getElementById("savePreviewMemberBtn");
const clearPreviewBtn = document.getElementById("clearPreviewBtn");
const memberSearch = document.getElementById("memberSearch");
const memberStatusFilter = document.getElementById("memberStatusFilter");
const membersList = document.getElementById("membersList");
const membersCount = document.getElementById("membersCount");

const pointsForm = document.getElementById("pointsForm");
const pointsMember = document.getElementById("pointsMember");
const pointsHistory = document.getElementById("pointsHistory");
const latestMovements = document.getElementById("latestMovements");

const rankingForm = document.getElementById("rankingForm");
const rankingTopThree = document.getElementById("rankingTopThree");
const rankingList = document.getElementById("rankingList");

const activityForm = document.getElementById("activityForm");
const activitiesList = document.getElementById("activitiesList");

const textForm = document.getElementById("textForm");
const textMember = document.getElementById("textMember");
const textsList = document.getElementById("textsList");
const textViewer = document.getElementById("textViewer");

const logoutBtn = document.getElementById("logoutBtn");

let allMembers = [];
let allActivities = [];
let allTexts = [];
let pendingMember = null;
let editingMemberId = null;
let editingActivityId = null;
let editingTextId = null;

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await signInWithEmailAndPassword(
      auth,
      document.getElementById("loginEmail").value,
      document.getElementById("loginPassword").value
    );

    loginMessage.textContent = "";
  } catch (error) {
    console.error(error);
    loginMessage.textContent = "Erro ao entrar. Verifique e-mail e senha.";
  }
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginScreen.classList.add("hidden");
    mainApp.classList.remove("hidden");

    loadMembers();
    loadPoints();
    loadActivities();
    loadTexts();
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
        createdAt: Timestamp.now()
      });
    }

    memberForm.reset();
    resetPreview();
    await loadMembers();

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

  if (action === "view") alert(formatMemberDetails(member));

  if (action === "quick-points") {
    showPage("pointsPage", "Pontuações", "Adicione ou retire pontos dos membros.");
    pointsMember.value = memberId;
    document.getElementById("pointsValue").focus();
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
  }
});

pointsForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const memberId = pointsMember.value;
  const value = Number(document.getElementById("pointsValue").value);
  const selectedMember = allMembers.find((member) => member.id === memberId);

  if (!selectedMember) {
    alert("Selecione um membro válido.");
    return;
  }

  const point = {
    memberId,
    memberName: selectedMember.name,
    memberUser: selectedMember.wattpad || selectedMember.user || "",
    value,
    reason: document.getElementById("pointsReason").value,
    date: document.getElementById("pointsDate").value,
    responsible: document.getElementById("pointsResponsible").value,
    createdAt: Timestamp.now()
  };

  await addDoc(collection(db, "points"), point);

  await updateDoc(doc(db, "members", memberId), {
    points: Number(selectedMember.points || 0) + value
  });

  pointsForm.reset();
  await loadMembers();
  await loadPoints();
});

rankingForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const start = document.getElementById("rankingStart").value;
  const end = document.getElementById("rankingEnd").value;

  const pointsSnapshot = await getDocs(collection(db, "points"));
  const ranking = {};

  pointsSnapshot.forEach((docItem) => {
    const item = docItem.data();

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

  renderRanking(finalRanking);
});

activityForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const activity = {
    title: document.getElementById("activityTitle").value,
    description: document.getElementById("activityDescription").value,
    deadline: document.getElementById("activityDeadline").value,
    points: Number(document.getElementById("activityPoints").value || 0),
    status: document.getElementById("activityStatus").value,
    deliveredBy: [],
    winners: [],
    createdAt: Timestamp.now()
  };

  if (editingActivityId) {
    await updateDoc(doc(db, "activities", editingActivityId), activity);
    editingActivityId = null;
  } else {
    await addDoc(collection(db, "activities"), activity);
  }

  activityForm.reset();
  document.getElementById("activityStatus").value = "Aberta";
  await loadActivities();
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

  if (action === "edit-activity") {
    editingActivityId = activityId;
    document.getElementById("activityTitle").value = activity.title || "";
    document.getElementById("activityDescription").value = activity.description || "";
    document.getElementById("activityDeadline").value = activity.deadline || "";
    document.getElementById("activityPoints").value = activity.points || "";
    document.getElementById("activityStatus").value = activity.status || "Aberta";
  }

  if (action === "delete-activity") {
    if (!confirm(`Excluir atividade "${activity.title}"?`)) return;

    await deleteDoc(doc(db, "activities", activityId));
    await loadActivities();
  }
});

textForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const selectedMember = allMembers.find((member) => member.id === textMember.value);

  const text = {
    memberId: textMember.value,
    memberName: selectedMember?.name || "",
    title: document.getElementById("textTitle").value,
    type: document.getElementById("textType").value,
    content: document.getElementById("textContent").value,
    status: document.getElementById("textStatus").value,
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
      document.getElementById("textTitle").value = text.title || "";
      document.getElementById("textType").value = text.type || "Outro";
      document.getElementById("textContent").value = text.content || "";
      document.getElementById("textStatus").value = text.status || "Pendente";
    }

    if (action === "delete-text") {
      if (!confirm(`Excluir texto "${text.title}"?`)) return;

      await deleteDoc(doc(db, "texts", textId));
      await loadTexts();
      resetTextViewer();
    }

    return;
  }

  if (item) {
    const textId = item.dataset.id;
    const text = allTexts.find((entry) => entry.id === textId);

    if (text) renderTextViewer(text);
  }
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

async function loadPoints() {
  const q = query(collection(db, "points"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  pointsHistory.innerHTML = "";
  latestMovements.innerHTML = "";

  let total = 0;
  let count = 0;

  snapshot.forEach((docItem) => {
    const item = docItem.data();
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

function getMemberDataFromParsedFields() {
  const name = document.getElementById("parsedName").value.trim();
  const wattpad = document.getElementById("parsedWattpad").value.trim();
  const phone = document.getElementById("parsedPhone").value.trim();
  const age = document.getElementById("parsedAge").value.trim();
  const writingGenre = document.getElementById("parsedWritingGenre").value.trim();
  const hasCompletedWork = document.getElementById("parsedHasCompletedWork").value.trim();
  const completedWork = document.getElementById("parsedCompletedWork").value.trim();
  const doubts = document.getElementById("parsedDoubts").value.trim();
  const status = document.getElementById("parsedStatus").value;

  return {
    name,
    wattpad,
    phone,
    age,
    writingGenre,
    hasCompletedWork,
    completedWork,
    doubts,
    status,

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
        <span class="badge">${escapeHTML(member.status || "Novo")}</span>
        <span class="badge">${escapeHTML(member.writingGenre || member.genre || "Sem gênero")}</span>
      </div>

      <div class="member-meta">
        <div><strong>Telefone:</strong> ${escapeHTML(member.phone || "Não informado")}</div>
        <div><strong>Idade:</strong> ${escapeHTML(member.age || "Não informada")}</div>
        <div><strong>Obra concluída?</strong> ${escapeHTML(member.hasCompletedWork || "Não informado")}</div>
        <div><strong>Qual obra:</strong> ${escapeHTML(member.completedWork || "Não informado")}</div>
        <div><strong>Dúvida/Insegurança:</strong> ${escapeHTML(member.doubts || "Nenhuma")}</div>
      </div>

      ${
        isPreview ? "" : `
          <div class="member-actions">
            <button class="btn btn-secondary btn-small" data-action="view" data-id="${member.id}">Ver</button>
            <button class="btn btn-primary btn-small" data-action="quick-points" data-id="${member.id}">Pontuar</button>
            <button class="btn btn-secondary btn-small" data-action="edit" data-id="${member.id}">Editar</button>
            <button class="btn btn-danger btn-small" data-action="delete" data-id="${member.id}">Excluir</button>
          </div>
        `
      }
    </article>
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

  const membersChecklist = allMembers.map((member) => {
    const delivered = deliveredBy.includes(member.id);
    const winner = winners.includes(member.id);

    return `
      <div class="activity-member-row">
        <span>${escapeHTML(member.name)}</span>

        <button class="btn ${delivered ? "btn-primary" : "btn-secondary"} btn-small" data-action="toggle-delivery" data-id="${activity.id}" data-member="${member.id}">
          ${delivered ? "Entregou" : "Pendente"}
        </button>

        <button class="btn ${winner ? "btn-primary" : "btn-secondary"} btn-small" data-action="toggle-winner" data-id="${activity.id}" data-member="${member.id}">
          ${winner ? "Vencedor" : "Marcar vencedor"}
        </button>
      </div>
    `;
  }).join("");

  return `
    <div class="activity-item">
      <strong>${escapeHTML(activity.title)}</strong>
      <p>${escapeHTML(activity.description || "Sem descrição.")}</p>
      <p>Prazo: ${escapeHTML(activity.deadline || "Sem prazo")}</p>
      <p>Pontos: ${Number(activity.points || 0)}</p>
      <p>Status: ${escapeHTML(activity.status || "Aberta")}</p>

      <div class="item-actions">
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

function renderRanking(finalRanking) {
  rankingTopThree.innerHTML = "";
  rankingList.innerHTML = "";

  if (finalRanking.length === 0) {
    rankingTopThree.innerHTML = `<div class="empty-state">Nenhum ponto encontrado nesse período.</div>`;
    rankingList.innerHTML = `<div class="empty-state">Nenhum ponto encontrado nesse período.</div>`;
    return;
  }

  finalRanking.slice(0, 3).forEach((item, index) => {
    const medals = ["🥇", "🥈", "🥉"];

    rankingTopThree.innerHTML += `
      <article class="podium-card">
        <div class="podium-medal">${medals[index]}</div>
        <div class="podium-position">${index + 1}º lugar</div>
        <div class="podium-name">${escapeHTML(item.name)}</div>
        <p>${escapeHTML(item.user || "Sem user")}</p>
        <div class="podium-points">${item.points}</div>
        <p>pontos na quinzena</p>
      </article>
    `;
  });

  finalRanking.forEach((item, index) => {
    rankingList.innerHTML += `
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
  });
}

function getValueAfterLabel(text, labels) {
  const lines = text.split(/\r?\n/);

  for (const label of labels) {
    for (const line of lines) {
      const cleaned = cleanLine(line);
      const escapedLabel = escapeRegExp(label);

      const regex = new RegExp(`${escapedLabel}\\s*:?\\s*(.+)$`, "i");
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
      const escapedLabel = escapeRegExp(label);

      const regex = new RegExp(`${escapedLabel}\\s*:?\\s*(.*)$`, "i");
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
  document.getElementById(pageId).classList.add("active-page");

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