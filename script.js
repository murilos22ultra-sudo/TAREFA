// ================================
// ESTADO
// ================================
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let checklistTemp = [];
let editId = null;

// ================================
// ELEMENTOS
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
document.getElementById("btnNovo").onclick = () => openModal();
document.getElementById("cancel").onclick = () => closeModal();
document.getElementById("addCheck").onclick = () => addCheck();
document.getElementById("save").onclick = () => saveTask();
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
    alert("Título obrigatório");
    return;
  }

  if (editId) {
    Object.assign(
      tasks.find(t => t.id === editId),
      {
        title: titleInput.value,
        desc: descInput.value,
        date: dateInput.value,
        priority: priorityInput.value,
        checklist: checklistTemp
      }
    );
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
// UTIL
// ================================
function progress(task) {
  if (!task.checklist.length) return 0;
  return Math.round(task.checklist.filter(i => i.done).length / task.checklist.length * 100);
}

function persist() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  render();
}

// ================================
// RENDER + DRAG
// ================================
function render() {
  document.querySelectorAll(".card").forEach(c => c.remove());

  tasks.forEach(task => {
    const col = document.querySelector(`[data-status="${task.status}"]`);
    const p = progress(task);

    const card = document.createElement("div");
    card.className = `card ${p === 100 ? "green" : p > 0 ? "yellow" : "red"}`;

    /* ✅ DRAG FUNCIONAL */
    card.draggable = true;

    card.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", task.id);
      e.dataTransfer.effectAllowed = "move";
      card.classList.add("dragging");
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
    });

    card.innerHTML = `
      <div class="card-header">
        <span class="card-title">${task.title}</span>
        <span class="badge ${task.priority}">${task.priority}</span>
      </div>

      ${task.desc ? `<div class="card-desc">${task.desc}</div>` : ""}

      ${task.date ? `<div class="card-date normal">📅 ${task.date.split("-").reverse().join("/")}</div>` : ""}

      <div class="details">▶ Detalhes</div>

      <div class="detail-box hidden">
        <div>${p}%</div>
        <div class="bar"><div style="width:${p}%"></div></div>
      </div>
    `;

    const box = card.querySelector(".detail-box");

    task.checklist.forEach(c => {
      const l = document.createElement("label");
      l.className = "check";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = c.done;
      cb.onchange = () => {
        c.done = cb.checked;
        persist();
      };
      l.append(cb, c.text);
      box.appendChild(l);
    });

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

    box.appendChild(actions);

    card.querySelector(".details").onclick = () => {
      box.classList.toggle("hidden");
    };

    col.appendChild(card);
  });
}

// ================================
// DROP NAS COLUNAS
// ================================
document.querySelectorAll(".coluna").forEach(col => {
  col.addEventListener("dragover", e => {
    e.preventDefault();
  });

  col.addEventListener("drop", e => {
    e.preventDefault();

    const id = e.dataTransfer.getData("text/plain");
    const task = tasks.find(t => t.id == id);
    if (!task) return;

    task.status = col.dataset.status;
    persist();
  });
});

// ================================
// EXPORT CSV
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
