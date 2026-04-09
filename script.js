// ================================
// ESTADO GLOBAL
// ================================
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let checklistTemp = [];
let editId = null;

// ================================
// ELEMENTOS DO MODAL
// ================================
const modal = document.getElementById("modal");
const titleInput = document.getElementById("taskTitle");
const descInput = document.getElementById("taskDesc");
const dateInput = document.getElementById("taskDate");
const priorityInput = document.getElementById("taskPriority");
const checkInput = document.getElementById("checkInput");
const checkPreview = document.getElementById("checkPreview");

// ================================
// BOTÕES
// ================================
document.getElementById("btnNovo").onclick   = () => openModal();
document.getElementById("cancel").onclick    = () => closeModal();
document.getElementById("addCheck").onclick  = () => addCheck();
document.getElementById("save").onclick      = () => saveTask();
document.getElementById("btnExport").onclick = () => exportCSV();

// ================================
// MODAL
// ================================
function openModal(task = null) {
  editId = task ? task.id : null;

  titleInput.value = task?.title || "";
  descInput.value = task?.desc || "";
  dateInput.value = task?.date || "";
  priorityInput.value = task?.priority || "Média";

  checklistTemp = task ? [...task.checklist] : [];
  renderTempChecks();

  modal.classList.remove("hidden");
}

function closeModal() {
  modal.classList.add("hidden");
  checklistTemp = [];
  checkPreview.innerHTML = "";
}

// ================================
// CHECKLIST
// ================================
function addCheck() {
  if (!checkInput.value.trim()) return;
  checklistTemp.push({ text: checkInput.value, done: false });
  checkInput.value = "";
  renderTempChecks();
}

function renderTempChecks() {
  checkPreview.innerHTML = "";
  checklistTemp.forEach(i => {
    const div = document.createElement("div");
    div.textContent = "• " + i.text;
    div.style.fontSize = "13px";
    checkPreview.appendChild(div);
  });
}

// ================================
// SALVAR
// ================================
function saveTask() {
  if (!titleInput.value.trim()) {
    alert("Título é obrigatório");
    return;
  }

  if (editId) {
    Object.assign(tasks.find(t => t.id === editId), {
      title: titleInput.value,
      desc: descInput.value,
      date: dateInput.value,
      priority: priorityInput.value,
      checklist: checklistTemp
    });
  } else {
    tasks.push({
      id: Date.now(),
      title: titleInput.value,
      desc: descInput.value,
      date: dateInput.value,
      priority: priorityInput.value,
      checklist: checklistTemp,
      status: "A Fazer"
    });
  }

  persist();
  closeModal();
}

// ================================
// UTILITÁRIOS
// ================================
function getProgress(task) {
  if (!task.checklist.length) return 0;
  return Math.round(
    (task.checklist.filter(i => i.done).length / task.checklist.length) * 100
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

// ✅ COR DA BARRA PELO STATUS
function statusClass(status) {
  if (status === "A Fazer") return "red";
  if (status === "Em Progresso") return "yellow";
  if (status === "Concluído") return "green";
  return "red";
}

// ================================
// RENDERIZAÇÃO DOS CARDS
// ================================
function render() {
  document.querySelectorAll(".card").forEach(c => c.remove());

  tasks.forEach(task => {
    const column = document.querySelector(
      `[data-status="${task.status}"]`
    );

    const progress = getProgress(task);

    const card = document.createElement("div");
    card.className = `card ${statusClass(task.status)}`;

    // DRAG PELO HEADER
    card.innerHTML = `
      <div class="card-header" draggable="true" data-id="${task.id}">
        <span class="card-title">${task.title}</span>
        <span class="badge ${task.priority}">${task.priority}</span>
      </div>

      ${task.desc ? `<div class="card-desc">${task.desc}</div>` : ""}

      ${task.date ? `<div class="card-date normal">📅 ${formatDate(task.date)}</div>` : ""}

      <div class="details">▶ Detalhes</div>

      <div class="detail-box hidden">
        <div class="progress-text">${progress}%</div>
        <div class="bar"><div style="width:${progress}%"></div></div>
      </div>
    `;

    // DRAG EVENTS
    const header = card.querySelector(".card-header");
    header.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", task.id);
      e.dataTransfer.effectAllowed = "move";
    });

    const detailBox = card.querySelector(".detail-box");

    card.querySelector(".details").onclick = () =>
      detailBox.classList.toggle("hidden");

    // checklist
    task.checklist.forEach(c => {
      const label = document.createElement("label");
      label.className = "check";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = c.done;
      cb.onchange = () => {
        c.done = cb.checked;
        persist();
      };
      label.append(cb, c.text);
      detailBox.appendChild(label);
    });

    // ações
    const actions = document.createElement("div");
    actions.className = "actions";
    actions.innerHTML = `
      <button class="btn blue">Editar</button>
      <button class="btn red">Excluir</button>
    `;
    actions.children[0].onclick = () => openModal(task);
    actions.children[1].onclick = () => {
      if (confirm("Excluir tarefa?")) {
        tasks = tasks.filter(t => t.id !== task.id);
        persist();
      }
    };
    detailBox.appendChild(actions);

    column.appendChild(card);
  });
}

// ================================
// DROP NAS COLUNAS
// ================================
document.querySelectorAll(".coluna").forEach(coluna => {
  coluna.addEventListener("dragover", e => e.preventDefault());

  coluna.addEventListener("drop", e => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const task = tasks.find(t => t.id == id);
    if (!task) return;

    task.status = coluna.dataset.status;
    persist();
  });
});

// ================================
// PERSISTÊNCIA
// ================================
function persist() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  render();
}

// ================================
// EXPORTAR CSV
// ================================
function exportCSV() {
  let csv = "Status;Título;Descrição\n";
  tasks.forEach(t => {
    csv += `${t.status};"${t.title}";"${t.desc || ""}"\n`;
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv]));
  a.download = "tarefas.csv";
  a.click();
}

// ================================
// INIT
// ================================
render();
