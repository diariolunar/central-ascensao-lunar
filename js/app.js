/*
  CENTRAL ASCENSÃO LUNAR
  Arquivo: js/app.js

  Este arquivo controla:
  - login
  - navegação
  - membros
  - pontuações
  - ranking
  - atividades
  - textos
*/

/* Importa Firebase */
import {
  auth,
  db,

  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,

  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp

} from "./firebase.js";

/* =========================
   ELEMENTOS DO HTML
========================= */

/* Login */
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

/* Telas */
const loginScreen = document.getElementById("loginScreen");
const mainApp = document.getElementById("mainApp");

/* Navegação */
const menuButtons = document.querySelectorAll(".menu-btn");
const pages = document.querySelectorAll(".page");

/* Dashboard */
const totalMembers = document.getElementById("totalMembers");
const totalPoints = document.getElementById("totalPoints");
const openActivities = document.getElementById("openActivities");
const totalTexts = document.getElementById("totalTexts");

/* Membros */
const memberForm = document.getElementById("memberForm");
const memberSheet = document.getElementById("memberSheet");
const membersList = document.getElementById("membersList");
const membersCount = document.getElementById("membersCount");

/* Pontos */
const pointsForm = document.getElementById("pointsForm");
const pointsMember = document.getElementById("pointsMember");
const pointsHistory = document.getElementById("pointsHistory");

/* Ranking */
const rankingForm = document.getElementById("rankingForm");
const rankingList = document.getElementById("rankingList");

/* Atividades */
const activityForm = document.getElementById("activityForm");
const activitiesList = document.getElementById("activitiesList");

/* Textos */
const textForm = document.getElementById("textForm");
const textMember = document.getElementById("textMember");
const textsList = document.getElementById("textsList");

/* Logout */
const logoutBtn = document.getElementById("logoutBtn");

/* =========================
   LOGIN
========================= */

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);

    loginMessage.textContent = "";

  } catch (error) {
    console.error(error);

    loginMessage.textContent =
      "Erro ao entrar. Verifique e-mail e senha.";
  }
});

/* =========================
   OBSERVA LOGIN
========================= */

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

/* =========================
   LOGOUT
========================= */

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

/* =========================
   NAVEGAÇÃO
========================= */

menuButtons.forEach((button) => {

  button.addEventListener("click", () => {

    /* Remove ativo */
    menuButtons.forEach(btn => btn.classList.remove("active"));

    /* Ativa botão atual */
    button.classList.add("active");

    /* Esconde páginas */
    pages.forEach(page => {
      page.classList.remove("active-page");
    });

    /* Mostra página clicada */
    const target = button.dataset.page;

    document
      .getElementById(target)
      .classList.add("active-page");
  });
});

/* =========================
   CADASTRAR MEMBRO
========================= */

memberForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  const text = memberSheet.value;

  /*
    Tenta identificar campos automaticamente
  */

  const name =
    extractField(text, "Nome") || "Sem nome";

  const user =
    extractField(text, "User") || "Sem user";

  const work =
    extractField(text, "Obra") || "Não informado";

  const genre =
    extractField(text, "Gênero") || "Não informado";

  const member = {

    name,
    user,
    work,
    genre,

    points: 0,

    createdAt: Timestamp.now()
  };

  try {

    await addDoc(
      collection(db, "members"),
      member
    );

    memberForm.reset();

    loadMembers();

  } catch (error) {

    console.error(error);

    alert("Erro ao cadastrar membro.");
  }
});

/* =========================
   CARREGAR MEMBROS
========================= */

async function loadMembers() {

  const q = query(
    collection(db, "members"),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  membersList.innerHTML = "";

  pointsMember.innerHTML =
    `<option value="">Selecione um membro</option>`;

  textMember.innerHTML =
    `<option value="">Selecione um membro</option>`;

  let total = 0;

  snapshot.forEach((docItem) => {

    const member = docItem.data();

    total++;

    /* Adiciona nos selects */
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

    /* Card */
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

        <span class="badge">
          ${member.genre}
        </span>

        <p style="margin-top:14px;">
          <strong>Obra:</strong>
          ${member.work}
        </p>

      </article>
    `;
  });

  membersCount.textContent =
    `${total} membros`;

  totalMembers.textContent = total;
}

/* =========================
   PONTUAÇÃO
========================= */

pointsForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  const memberId = pointsMember.value;

  const value =
    Number(document.getElementById("pointsValue").value);

  const reason =
    document.getElementById("pointsReason").value;

  const date =
    document.getElementById("pointsDate").value;

  const point = {

    memberId,
    value,
    reason,
    date,

    createdAt: Timestamp.now()
  };

  try {

    await addDoc(
      collection(db, "points"),
      point
    );

    pointsForm.reset();

    loadPoints();

  } catch (error) {

    console.error(error);

    alert("Erro ao lançar pontos.");
  }
});

/* =========================
   CARREGAR PONTOS
========================= */

async function loadPoints() {

  const q = query(
    collection(db, "points"),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  pointsHistory.innerHTML = "";

  let total = 0;

  snapshot.forEach((docItem) => {

    const item = docItem.data();

    total += item.value;

    const className =
      item.value >= 0
      ? "points-positive"
      : "points-negative";

    pointsHistory.innerHTML += `
      <div class="history-item">

        <strong class="${className}">
          ${item.value > 0 ? "+" : ""}
          ${item.value} pontos
        </strong>

        <p>
          ${item.reason}
        </p>

        <p>
          ${item.date}
        </p>

      </div>
    `;
  });

  totalPoints.textContent = total;
}

/* =========================
   RANKING
========================= */

rankingForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  const start =
    document.getElementById("rankingStart").value;

  const end =
    document.getElementById("rankingEnd").value;

  const snapshot = await getDocs(
    collection(db, "points")
  );

  const ranking = {};

  snapshot.forEach((docItem) => {

    const item = docItem.data();

    if (
      item.date >= start &&
      item.date <= end
    ) {

      if (!ranking[item.memberId]) {
        ranking[item.memberId] = 0;
      }

      ranking[item.memberId] += item.value;
    }
  });

  const membersSnapshot = await getDocs(
    collection(db, "members")
  );

  const membersMap = {};

  membersSnapshot.forEach((docItem) => {

    membersMap[docItem.id] =
      docItem.data();
  });

  const finalRanking = Object.entries(ranking)
    .map(([memberId, points]) => {

      return {
        name: membersMap[memberId]?.name || "Membro",
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
        </div>

        <div class="ranking-points">
          ${item.points}
        </div>

      </div>
    `;
  });
});

/* =========================
   ATIVIDADES
========================= */

activityForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  const activity = {

    title:
      document.getElementById("activityTitle").value,

    description:
      document.getElementById("activityDescription").value,

    deadline:
      document.getElementById("activityDeadline").value,

    points:
      Number(document.getElementById("activityPoints").value),

    createdAt: Timestamp.now()
  };

  try {

    await addDoc(
      collection(db, "activities"),
      activity
    );

    activityForm.reset();

    loadActivities();

  } catch (error) {

    console.error(error);

    alert("Erro ao criar atividade.");
  }
});

/* =========================
   CARREGAR ATIVIDADES
========================= */

async function loadActivities() {

  const q = query(
    collection(db, "activities"),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  activitiesList.innerHTML = "";

  let total = 0;

  snapshot.forEach((docItem) => {

    const activity = docItem.data();

    total++;

    activitiesList.innerHTML += `
      <div class="activity-item">

        <strong>
          ${activity.title}
        </strong>

        <p>
          ${activity.description}
        </p>

        <p>
          Prazo: ${activity.deadline || "Sem prazo"}
        </p>

        <p>
          ${activity.points || 0} pontos
        </p>

      </div>
    `;
  });

  openActivities.textContent = total;
}

/* =========================
   TEXTOS
========================= */

textForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  const text = {

    memberId: textMember.value,

    title:
      document.getElementById("textTitle").value,

    type:
      document.getElementById("textType").value,

    content:
      document.getElementById("textContent").value,

    status:
      document.getElementById("textStatus").value,

    createdAt: Timestamp.now()
  };

  try {

    await addDoc(
      collection(db, "texts"),
      text
    );

    textForm.reset();

    loadTexts();

  } catch (error) {

    console.error(error);

    alert("Erro ao cadastrar texto.");
  }
});

/* =========================
   CARREGAR TEXTOS
========================= */

async function loadTexts() {

  const q = query(
    collection(db, "texts"),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  textsList.innerHTML = "";

  let total = 0;

  snapshot.forEach((docItem) => {

    const text = docItem.data();

    total++;

    textsList.innerHTML += `
      <div class="text-item">

        <strong>
          ${text.title}
        </strong>

        <p>
          ${text.type}
        </p>

        <p>
          Status:
          ${text.status}
        </p>

      </div>
    `;
  });

  totalTexts.textContent = total;
}

/* =========================
   FUNÇÃO AUXILIAR
========================= */

/*
  Extrai campos da ficha colada.

  Exemplo:
  Nome: Mayke

  Retorna:
  Mayke
*/

function extractField(text, field) {

  const regex =
    new RegExp(`${field}:\\s*(.*)`, "i");

  const match = text.match(regex);

  return match
    ? match[1].trim()
    : "";
}