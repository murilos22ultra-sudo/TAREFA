let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let checklistTemp = [];
let editId = null;

/* ELEMENTOS */
const modal = document.getElementById("modal");
const titleInput = document.getElementById("taskTitle");
const descInput = document.getElementById("taskDesc");
const dateInput = document.getElementById("taskDate");
const priorityInput = document.getElementById("taskPriority");
const checkInput = document.getElementById("checkInput");
const checkPreview = document.getElementById("checkPreview");

/* BOTÕES */
document.getElementById("btnNovo").onclick = () => openModal();
document.getElementById("cancel").onclick = () => closeModal();
document.getElementById("addCheck").onclick = () => addCheck();
document.getElementById("save").onclick = () => saveTask();
document.getElementById("btnExport").onclick = () => exportCSV();

/* MODAL */
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

/* CHECKLIST NO MODAL */
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
    checkPreview.appendChild(div);
  });
}

/* SALVAR TAREFA */
function saveTask() {
  if (!titleInput.value.trim()) return alert("Título obrigatório");

  if (editId) {
    Object.assign(tasks.find(t => t.id === editId), {
      title: titleInput.value,
      desc: descInput.value,
      date: dateInput.value,
      priority: priorityInput.value,
      checklist: [...checklistTemp]
    });
  } else {
    tasks.push({
      id: Date.now(),
      title: titleInput.value,
      desc: descInput.value,
      date: dateInput.value,
      priority: priorityInput.value,
      checklist: [...checklistTemp],
      status: "A Fazer"
    });
  }

  persist();
  closeModal();
}

/* UTILITÁRIOS */
function statusClass(status) {
  if (status === "A Fazer") return "red";
  if (status === "Em Progresso") return "yellow";
  if (status === "Concluído") return "green";
  return "red";
}

function progress(task) {
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

/* RENDER */
function render() {
  document.querySelectorAll(".card").forEach(c => c.remove());

  // reset contadores
  document.querySelectorAll(".coluna").forEach(col => {
    col.querySelector("h2").innerHTML = col.dataset.status;
  });

  tasks.forEach(task => {
    const col = document.querySelector(`[data-status="${task.status}"]`);
    const p = progress(task);

    const card = document.createElement("div");
    card.className = "card " + statusClass(task.status);

    card.innerHTML = `
      <div class="card-header" draggable="true">
        <span class="card-title">${task.title}</span>
        <span class="badge ${task.priority}">${task.priority}</span>
      </div>

      ${task.desc ? `<div class="card-desc">${task.desc}</div>` : ""}
      ${task.date ? `<div class="card-date normal">📅 ${formatDate(task.date)}</div>` : ""}

      ${
        task.checklist.length > 0
          ? `
            <div class="progress-wrapper">
              <div class="progress-bar">
                <div class="progress-fill" style="width:${p}%"></div>
              </div>
              <div class="progress-text">${p}% concluído</div>
            </div>
          `
          : ""
      }

      <div class="details">▶ Detalhes</div>
      <div class="detail-box hidden"></div>
    `;

    /* DRAG */
    card.querySelector(".card-header").addEventListener("dragstart", e => {
      e.dataTransfer.setData("id", task.id);
    });

    /* CHECKLIST NOS DETALHES */
    const box = card.querySelector(".detail-box");
    task.checklist.forEach(i => {
      const lbl = document.createElement("label");
      lbl.className = "check";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = i.done;
      cb.onchange = () => {
        i.done = cb.checked;
        persist();
      };
      lbl.append(cb, " " + i.text);
      box.appendChild(lbl);
    });

    /* AÇÕES */
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

    card.querySelector(".details").onclick = () =>
      box.classList.toggle("hidden");

    col.appendChild(card);
  });

  /* CONTADOR POR COLUNA */
  document.querySelectorAll(".coluna").forEach(col => {
    const total = tasks.filter(t => t.status === col.dataset.status).length;
    col.querySelector("h2").innerHTML =
      `${col.dataset.status} <span class="count">(${total})</span>`;
  });
}

/* DRAG & DROP */
document.querySelectorAll(".coluna").forEach(col => {
  col.ondragover = e => e.preventDefault();
  col.ondrop = e => {
    const id = e.dataTransfer.getData("id");
    const task = tasks.find(t => t.id == id);
    task.status = col.dataset.status;
    persist();
  };
});

/* PERSIST */
function persist() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  render();
}

/* EXPORT CSV */
function exportCSV() {
  let csv = "Status;Título;Descrição;Prazo;Prioridade;Checklist;Progresso\n";

  tasks.forEach(task => {
    const prog = progress(task);
    const prazo = task.date ? formatDate(task.date) : "";
    const checklistText = task.checklist
      .map(i => (i.done ? "☑ " : "☐ ") + i.text)
      .join(" | ");

    csv +=
      `${task.status};"${task.title}";"${task.desc || ""}";"${prazo}";` +
      `${task.priority};"${checklistText}";${prog}%\n`;
  });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv]));
  a.download = "tarefas_kanban.csv";
  a.click();
}

render();
