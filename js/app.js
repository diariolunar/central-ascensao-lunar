/*
  CENTRAL ASCENSÃO LUNAR
  Arquivo: js/app.js
*/

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
  query,
  orderBy,
  Timestamp

} from "./firebase.js";

/* ELEMENTOS */
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

const loginScreen = document.getElementById("loginScreen");
const mainApp = document.getElementById("mainApp");

const menuButtons = document.querySelectorAll(".menu-btn");
const pages = document.querySelectorAll(".page");

const totalMembers = document.getElementById("totalMembers");
const totalPoints = document.getElementById("totalPoints");
const openActivities = document.getElementById("openActivities");
const totalTexts = document.getElementById("totalTexts");

const memberForm = document.getElementById("memberForm");
const memberSheet = document.getElementById("memberSheet");
const membersList = document.getElementById("membersList");
const membersCount = document.getElementById("membersCount");

const pointsForm = document.getElementById("pointsForm");
const pointsMember = document.getElementById("pointsMember");
const pointsHistory = document.getElementById("pointsHistory");

const rankingForm = document.getElementById("rankingForm");
const rankingList = document.getElementById("rankingList");

const activityForm = document.getElementById("activityForm");
const activitiesList = document.getElementById("activitiesList");

const textForm = document.getElementById("textForm");
const textMember = document.getElementById("textMember");
const textsList = document.getElementById("textsList");

const logoutBtn = document.getElementById("logoutBtn");

/* LOGIN */
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginMessage.textContent = "";
  } catch (error) {
    console.error(error);
    loginMessage.textContent = "Erro ao entrar. Verifique e-mail e senha.";
  }
});

/* OBSERVA LOGIN */
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

/* SAIR */
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

/* NAVEGAÇÃO */
menuButtons.forEach((button) => {
  button.addEventListener("click", () => {
    menuButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    pages.forEach((page) => page.classList.remove("active-page"));

    const target = button.dataset.page;
    document.getElementById(target).classList.add("active-page");
  });
});

/* CADASTRAR MEMBRO */
memberForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const text = memberSheet.value;

  const name = extractField(text, "Nome") || "Sem nome";
  const user = extractField(text, "User") || "Sem user";
  const work = extractField(text, "Obra") || "Não informado";
  const genre = extractField(text, "Gênero") || "Não informado";

  const member = {
    name,
    user,
    work,
    genre,
    points: 0,
    createdAt: Timestamp.now()
  };

  try {
    await addDoc(collection(db, "members"), member);

    memberForm.reset();
    loadMembers();
  } catch (error) {
    console.error(error);
    alert("Erro ao cadastrar membro.");
  }
});

/* CARREGAR MEMBROS */
async function loadMembers() {
  const q = query(collection(db, "members"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  membersList.innerHTML = "";
  pointsMember.innerHTML = `<option value="">Selecione um membro</option>`;
  textMember.innerHTML = `<option value="">Selecione um membro</option>`;

  let total = 0;

  snapshot.forEach((docItem) => {
    const member = docItem.data();
    total++;

    pointsMember.innerHTML += `
      <option value="${docItem.id}">
        ${member.name}
      </option>
    `;

    textMember.innerHTML += `
      <option value="${docItem.id}">
        ${member.name}
      </option>
    `;

    membersList.innerHTML += `
      <article class="member-card">
        <div class="member-top">
          <div>
            <h3>${member.name}</h3>
            <p>${member.user}</p>
          </div>

          <div class="member-points">
            ${member.points || 0}
          </div>
        </div>

        <span class="badge">${member.genre}</span>

        <p style="margin-top:14px;">
          <strong>Obra:</strong> ${member.work}
        </p>
      </article>
    `;
  });

  if (total === 0) {
    membersList.innerHTML = `
      <div class="empty-state">
        Nenhum membro cadastrado ainda.
      </div>
    `;
  }

  membersCount.textContent = `${total} membros`;
  totalMembers.textContent = total;
}

/* LANÇAR PONTOS */
pointsForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const memberId = pointsMember.value;
  const value = Number(document.getElementById("pointsValue").value);
  const reason = document.getElementById("pointsReason").value;
  const date = document.getElementById("pointsDate").value;

  const point = {
    memberId,
    value,
    reason,
    date,
    createdAt: Timestamp.now()
  };

  try {
    await addDoc(collection(db, "points"), point);

    const membersSnapshot = await getDocs(collection(db, "members"));

    let currentMember = null;

    membersSnapshot.forEach((docItem) => {
      if (docItem.id === memberId) {
        currentMember = {
          id: docItem.id,
          ...docItem.data()
        };
      }
    });

    if (currentMember) {
      const memberRef = doc(db, "members", currentMember.id);

      await updateDoc(memberRef, {
        points: Number(currentMember.points || 0) + value
      });
    }

    pointsForm.reset();

    loadPoints();
    loadMembers();
  } catch (error) {
    console.error(error);
    alert("Erro ao lançar pontos.");
  }
});

/* CARREGAR PONTOS */
async function loadPoints() {
  const q = query(collection(db, "points"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  pointsHistory.innerHTML = "";

  let total = 0;

  snapshot.forEach((docItem) => {
    const item = docItem.data();

    total += Number(item.value || 0);

    const className =
      item.value >= 0 ? "points-positive" : "points-negative";

    pointsHistory.innerHTML += `
      <div class="history-item">
        <strong class="${className}">
          ${item.value > 0 ? "+" : ""}${item.value} pontos
        </strong>

        <p>${item.reason}</p>
        <p>${item.date}</p>
      </div>
    `;
  });

  if (snapshot.empty) {
    pointsHistory.innerHTML = `
      <div class="empty-state">
        Nenhum ponto lançado ainda.
      </div>
    `;
  }

  totalPoints.textContent = total;
}

/* RANKING */
rankingForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const start = document.getElementById("rankingStart").value;
  const end = document.getElementById("rankingEnd").value;

  const pointsSnapshot = await getDocs(collection(db, "points"));
  const membersSnapshot = await getDocs(collection(db, "members"));

  const ranking = {};
  const membersMap = {};

  membersSnapshot.forEach((docItem) => {
    membersMap[docItem.id] = docItem.data();
  });

  pointsSnapshot.forEach((docItem) => {
    const item = docItem.data();

    if (item.date >= start && item.date <= end) {
      if (!ranking[item.memberId]) {
        ranking[item.memberId] = 0;
      }

      ranking[item.memberId] += Number(item.value || 0);
    }
  });

  const finalRanking = Object.entries(ranking)
    .map(([memberId, points]) => {
      return {
        name: membersMap[memberId]?.name || "Membro",
        user: membersMap[memberId]?.user || "",
        points
      };
    })
    .sort((a, b) => b.points - a.points);

  rankingList.innerHTML = "";

  if (finalRanking.length === 0) {
    rankingList.innerHTML = `
      <div class="empty-state">
        Nenhum ponto encontrado nesse período.
      </div>
    `;
    return;
  }

  finalRanking.forEach((item, index) => {
    rankingList.innerHTML += `
      <div class="ranking-item">
        <div class="ranking-position">
          #${index + 1}
        </div>

        <div>
          <strong>${item.name}</strong>
          <p>${item.user}</p>
        </div>

        <div class="ranking-points">
          ${item.points}
        </div>
      </div>
    `;
  });
});

/* CRIAR ATIVIDADE */
activityForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const activity = {
    title: document.getElementById("activityTitle").value,
    description: document.getElementById("activityDescription").value,
    deadline: document.getElementById("activityDeadline").value,
    points: Number(document.getElementById("activityPoints").value),
    createdAt: Timestamp.now()
  };

  try {
    await addDoc(collection(db, "activities"), activity);

    activityForm.reset();
    loadActivities();
  } catch (error) {
    console.error(error);
    alert("Erro ao criar atividade.");
  }
});

/* CARREGAR ATIVIDADES */
async function loadActivities() {
  const q = query(collection(db, "activities"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  activitiesList.innerHTML = "";

  let total = 0;

  snapshot.forEach((docItem) => {
    const activity = docItem.data();
    total++;

    activitiesList.innerHTML += `
      <div class="activity-item">
        <strong>${activity.title}</strong>

        <p>${activity.description}</p>
        <p>Prazo: ${activity.deadline || "Sem prazo"}</p>
        <p>${activity.points || 0} pontos</p>
      </div>
    `;
  });

  if (total === 0) {
    activitiesList.innerHTML = `
      <div class="empty-state">
        Nenhuma atividade cadastrada ainda.
      </div>
    `;
  }

  openActivities.textContent = total;
}

/* CADASTRAR TEXTO */
textForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const text = {
    memberId: textMember.value,
    title: document.getElementById("textTitle").value,
    type: document.getElementById("textType").value,
    content: document.getElementById("textContent").value,
    status: document.getElementById("textStatus").value,
    createdAt: Timestamp.now()
  };

  try {
    await addDoc(collection(db, "texts"), text);

    textForm.reset();
    loadTexts();
  } catch (error) {
    console.error(error);
    alert("Erro ao cadastrar texto.");
  }
});

/* CARREGAR TEXTOS */
async function loadTexts() {
  const q = query(collection(db, "texts"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  textsList.innerHTML = "";

  let total = 0;

  snapshot.forEach((docItem) => {
    const text = docItem.data();
    total++;

    textsList.innerHTML += `
      <div class="text-item">
        <strong>${text.title}</strong>

        <p>${text.type}</p>
        <p>Status: ${text.status}</p>
      </div>
    `;
  });

  if (total === 0) {
    textsList.innerHTML = `
      <div class="empty-state">
        Nenhum texto cadastrado ainda.
      </div>
    `;
  }

  totalTexts.textContent = total;
}

/* EXTRAIR CAMPO DA FICHA */
function extractField(text, field) {
  const regex = new RegExp(`${field}:\\s*(.*)`, "i");
  const match = text.match(regex);

  return match ? match[1].trim() : "";
}
