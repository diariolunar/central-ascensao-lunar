/* =========================================================
   CENTRAL ASCENSÃO LUNAR
   SISTEMA DE ATIVIDADES - NOVA VERSÃO
========================================================= */

/* =========================================================
   STORAGE
========================================================= */

let activities =
  JSON.parse(localStorage.getItem("ascensao_activities")) || [];

let members =
  JSON.parse(localStorage.getItem("ascensao_members")) || [];

let pointsHistory =
  JSON.parse(localStorage.getItem("ascensao_points_history")) || [];

let currentActivityId = null;

/* =========================================================
   ELEMENTOS
========================================================= */

const activitiesList = document.getElementById("activitiesList");

const activityDetailContent = document.getElementById(
  "activityDetailContent"
);

const activityForm = document.getElementById("activityForm");

const activityDeliveryForm = document.getElementById(
  "activityDeliveryForm"
);

const deliveryMember = document.getElementById("deliveryMember");

const deliveryText = document.getElementById("deliveryText");

const deliveryActivityId = document.getElementById(
  "deliveryActivityId"
);

const editingDeliveryId = document.getElementById(
  "editingDeliveryId"
);

const activityWinnerForm = document.getElementById(
  "activityWinnerForm"
);

const activityWinnerSelect = document.getElementById(
  "activityWinnerSelect"
);

const winnerActivityId = document.getElementById(
  "winnerActivityId"
);

const completeActivityBtn = document.getElementById(
  "completeActivityBtn"
);

const backToActivitiesBtn = document.getElementById(
  "backToActivitiesBtn"
);

const deliveryTextModal = document.getElementById(
  "deliveryTextModal"
);

const deliveryModalTitle = document.getElementById(
  "deliveryModalTitle"
);

const deliveryModalSubtitle = document.getElementById(
  "deliveryModalSubtitle"
);

const deliveryModalContent = document.getElementById(
  "deliveryModalContent"
);

/* =========================================================
   SAVE
========================================================= */

function saveActivities() {
  localStorage.setItem(
    "ascensao_activities",
    JSON.stringify(activities)
  );
}

function saveMembers() {
  localStorage.setItem(
    "ascensao_members",
    JSON.stringify(members)
  );
}

function savePointsHistory() {
  localStorage.setItem(
    "ascensao_points_history",
    JSON.stringify(pointsHistory)
  );
}

/* =========================================================
   PAGE
========================================================= */

function openPage(pageId) {
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("active-page");
  });

  document.getElementById(pageId)?.classList.add("active-page");
}

/* =========================================================
   RENDER LISTA
========================================================= */

function renderActivities() {
  if (!activitiesList) return;

  if (!activities.length) {
    activitiesList.innerHTML = `
      <div class="empty-state">
        Nenhuma atividade cadastrada ainda.
      </div>
    `;
    return;
  }

  activitiesList.innerHTML = "";

  activities
    .slice()
    .reverse()
    .forEach((activity) => {
      const card = document.createElement("div");

      card.className = "activity-simple-card";

      card.innerHTML = `
        <div class="activity-simple-top">
          <div>
            <h3 class="activity-simple-title">
              ${activity.title}
            </h3>

            <p class="activity-simple-description">
              ${activity.description || "Sem descrição."}
            </p>

            <div class="activity-simple-meta">
              <span class="activity-simple-pill">
                Status: ${activity.status}
              </span>

              <span class="activity-simple-pill">
                Entregas: ${
                  activity.deliveries?.length || 0
                }
              </span>

              <span class="activity-simple-pill">
                Prazo: ${
                  activity.deadline || "Não definido"
                }
              </span>
            </div>
          </div>

          <button class="btn btn-primary activity-open-btn">
            Abrir
          </button>
        </div>
      `;

      card.addEventListener("click", () => {
        openActivity(activity.id);
      });

      activitiesList.appendChild(card);
    });
}

/* =========================================================
   ABRIR ATIVIDADE
========================================================= */

function openActivity(activityId) {
  currentActivityId = activityId;

  const activity = activities.find(
    (a) => a.id === activityId
  );

  if (!activity) return;

  openPage("activityDetailPage");

  renderActivityDetail(activity);

  renderWinnerSelect(activity);

  renderDeliveryMembers();

  deliveryActivityId.value = activity.id;

  winnerActivityId.value = activity.id;
}

/* =========================================================
   RENDER DETALHE
========================================================= */

function renderActivityDetail(activity) {
  let deliveriesHTML = "";

  if (!activity.deliveries?.length) {
    deliveriesHTML = `
      <div class="empty-state">
        Nenhuma entrega registrada ainda.
      </div>
    `;
  } else {
    deliveriesHTML = `
      <div class="deliveries-list">
        ${activity.deliveries
          .map((delivery) => {
            return `
              <div class="delivery-card">

                <div class="delivery-card-top">
                  <div>
                    <h3 class="delivery-member-name">
                      ${delivery.memberName}
                    </h3>

                    <span class="delivery-member-user">
                      @${delivery.memberUser}
                    </span>
                  </div>

                  <span class="delivery-date">
                    ${delivery.date}
                  </span>
                </div>

                <p class="delivery-preview">
                  ${delivery.text}
                </p>

                <div class="delivery-actions">
                  <button
                    class="btn btn-primary btn-small"
                    onclick="viewDeliveryText('${activity.id}', '${delivery.id}')"
                  >
                    Ver texto
                  </button>

                  <button
                    class="btn btn-secondary btn-small"
                    onclick="editDelivery('${activity.id}', '${delivery.id}')"
                  >
                    Editar
                  </button>

                  <button
                    class="btn btn-danger btn-small"
                    onclick="deleteDelivery('${activity.id}', '${delivery.id}')"
                  >
                    Excluir
                  </button>
                </div>

              </div>
            `;
          })
          .join("")}
      </div>
    `;
  }

  activityDetailContent.innerHTML = `
    <div class="activity-hero">

      <div class="activity-hero-top">
        <div>
          <h1 class="activity-hero-title">
            ${activity.title}
          </h1>

          <p class="activity-hero-description">
            ${activity.description || "Sem descrição."}
          </p>
        </div>

        <div class="activity-status-badge">
          ${activity.status}
        </div>
      </div>

      <div class="activity-info-grid">

        <div class="activity-info-card">
          <span>Prazo</span>
          <strong>
            ${activity.deadline || "Não definido"}
          </strong>
        </div>

        <div class="activity-info-card">
          <span>Pontos</span>
          <strong>
            ${activity.points || 0}
          </strong>
        </div>

        <div class="activity-info-card">
          <span>Bônus vencedor</span>
          <strong>
            ${activity.winnerPoints || 0}
          </strong>
        </div>

        <div class="activity-info-card">
          <span>Total entregas</span>
          <strong>
            ${activity.deliveries?.length || 0}
          </strong>
        </div>

      </div>

      ${
        activity.winner
          ? `
            <div class="winner-highlight">
              <span>Vencedor atual</span>
              <strong>
                ${activity.winner.name}
              </strong>
            </div>
          `
          : ""
      }

    </div>

    <div class="panel">
      <div class="section-title-row">
        <div>
          <h2>Entregas registradas</h2>

          <p class="hint">
            Lista de membros que enviaram a atividade.
          </p>
        </div>
      </div>

      ${deliveriesHTML}
    </div>
  `;
}

/* =========================================================
   MEMBROS ENTREGA
========================================================= */

function renderDeliveryMembers() {
  deliveryMember.innerHTML = `
    <option value="">Selecione um membro</option>
  `;

  members.forEach((member) => {
    deliveryMember.innerHTML += `
      <option value="${member.id}">
        ${member.name}
      </option>
    `;
  });
}

/* =========================================================
   WINNER SELECT
========================================================= */

function renderWinnerSelect(activity) {
  activityWinnerSelect.innerHTML = `
    <option value="">Selecione um vencedor</option>
  `;

  activity.deliveries?.forEach((delivery) => {
    activityWinnerSelect.innerHTML += `
      <option value="${delivery.memberId}">
        ${delivery.memberName}
      </option>
    `;
  });

  if (activity.winner) {
    activityWinnerSelect.value =
      activity.winner.memberId;
  }
}

/* =========================================================
   NOVA ATIVIDADE
========================================================= */

activityForm?.addEventListener("submit", (e) => {
  e.preventDefault();

  const activity = {
    id: crypto.randomUUID(),

    title:
      document.getElementById("activityTitle").value,

    description:
      document.getElementById("activityDescription")
        .value,

    deadline:
      document.getElementById("activityDeadline")
        .value,

    status:
      document.getElementById("activityStatus")
        .value,

    points: Number(
      document.getElementById("activityPoints")
        .value
    ),

    winnerPoints: Number(
      document.getElementById(
        "activityWinnerPoints"
      ).value
    ),

    deliveries: [],

    winner: null,

    createdAt: new Date().toLocaleDateString()
  };

  activities.push(activity);

  saveActivities();

  renderActivities();

  activityForm.reset();
});

/* =========================================================
   REGISTRAR ENTREGA
========================================================= */

activityDeliveryForm?.addEventListener(
  "submit",
  (e) => {
    e.preventDefault();

    const activity = activities.find(
      (a) => a.id === deliveryActivityId.value
    );

    if (!activity) return;

    const member = members.find(
      (m) => m.id === deliveryMember.value
    );

    if (!member) return;

    const editingId = editingDeliveryId.value;

    if (editingId) {
      const delivery = activity.deliveries.find(
        (d) => d.id === editingId
      );

      if (delivery) {
        delivery.text = deliveryText.value;
      }

      editingDeliveryId.value = "";

      document.getElementById(
        "saveDeliveryBtn"
      ).textContent = "Registrar entrega";
    } else {
      activity.deliveries.push({
        id: crypto.randomUUID(),

        memberId: member.id,

        memberName: member.name,

        memberUser: member.wattpad || "",

        text: deliveryText.value,

        date: new Date().toLocaleDateString()
      });

      addPointsToMember(
        member.id,
        activity.points,
        `Entrega da atividade: ${activity.title}`
      );
    }

    saveActivities();

    renderActivityDetail(activity);

    renderWinnerSelect(activity);

    activityDeliveryForm.reset();
  }
);

/* =========================================================
   EDITAR ENTREGA
========================================================= */

window.editDelivery = function (
  activityId,
  deliveryId
) {
  const activity = activities.find(
    (a) => a.id === activityId
  );

  if (!activity) return;

  const delivery = activity.deliveries.find(
    (d) => d.id === deliveryId
  );

  if (!delivery) return;

  deliveryMember.value = delivery.memberId;

  deliveryText.value = delivery.text;

  editingDeliveryId.value = delivery.id;

  document.getElementById(
    "saveDeliveryBtn"
  ).textContent = "Salvar edição";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
};

/* =========================================================
   EXCLUIR ENTREGA
========================================================= */

window.deleteDelivery = function (
  activityId,
  deliveryId
) {
  const confirmDelete = confirm(
    "Deseja excluir essa entrega?"
  );

  if (!confirmDelete) return;

  const activity = activities.find(
    (a) => a.id === activityId
  );

  if (!activity) return;

  activity.deliveries =
    activity.deliveries.filter(
      (d) => d.id !== deliveryId
    );

  saveActivities();

  renderActivityDetail(activity);

  renderWinnerSelect(activity);
};

/* =========================================================
   MODAL TEXTO
========================================================= */

window.viewDeliveryText = function (
  activityId,
  deliveryId
) {
  const activity = activities.find(
    (a) => a.id === activityId
  );

  if (!activity) return;

  const delivery = activity.deliveries.find(
    (d) => d.id === deliveryId
  );

  if (!delivery) return;

  deliveryModalTitle.textContent =
    delivery.memberName;

  deliveryModalSubtitle.textContent =
    activity.title;

  deliveryModalContent.textContent =
    delivery.text;

  deliveryTextModal.classList.remove("hidden");
};

/* =========================================================
   FECHAR MODAL
========================================================= */

document
  .querySelectorAll("[data-close-modal]")
  .forEach((button) => {
    button.addEventListener("click", () => {
      const modalId =
        button.dataset.closeModal;

      document
        .getElementById(modalId)
        ?.classList.add("hidden");
    });
  });

/* =========================================================
   VENCEDOR
========================================================= */

activityWinnerForm?.addEventListener(
  "submit",
  (e) => {
    e.preventDefault();

    const activity = activities.find(
      (a) => a.id === winnerActivityId.value
    );

    if (!activity) return;

    const member = members.find(
      (m) =>
        m.id === activityWinnerSelect.value
    );

    if (!member) return;

    activity.winner = {
      memberId: member.id,
      name: member.name
    };

    addPointsToMember(
      member.id,
      activity.winnerPoints,
      `Vencedor da atividade: ${activity.title}`
    );

    saveActivities();

    renderActivityDetail(activity);

    alert("Vencedor definido!");
  }
);

/* =========================================================
   CONCLUIR
========================================================= */

completeActivityBtn?.addEventListener(
  "click",
  () => {
    if (!currentActivityId) return;

    const activity = activities.find(
      (a) => a.id === currentActivityId
    );

    if (!activity) return;

    activity.status = "Encerrada";

    saveActivities();

    renderActivityDetail(activity);

    renderActivities();

    alert("Atividade concluída!");
  }
);

/* =========================================================
   VOLTAR
========================================================= */

backToActivitiesBtn?.addEventListener(
  "click",
  () => {
    openPage("activitiesPage");
  }
);

/* =========================================================
   PONTOS
========================================================= */

function addPointsToMember(
  memberId,
  value,
  reason
) {
  const member = members.find(
    (m) => m.id === memberId
  );

  if (!member) return;

  member.points =
    Number(member.points || 0) +
    Number(value || 0);

  pointsHistory.push({
    id: crypto.randomUUID(),

    memberId,

    memberName: member.name,

    value,

    reason,

    date: new Date().toLocaleDateString()
  });

  saveMembers();

  savePointsHistory();
}

/* =========================================================
   INIT
========================================================= */

renderActivities();