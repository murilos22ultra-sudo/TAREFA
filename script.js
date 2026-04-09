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

/* CHECKLIST MODAL */
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

/* SALVAR */
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
}

function progress(task) {
  if (!task.checklist.length) return 0;
  return Math.round(
    (task.checklist.filter(c => c.done).length / task.checklist.length) * 100
  );
}

function formatDate(d) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

/* RENDER COMPLETO */
function render() {
  document.querySelectorAll(".card").forEach(c => c.remove());

  // reset contadores
  document.querySelectorAll(".coluna").forEach(col => {
    const title = col.querySelector("h2");
    title.innerHTML = title.textContent.split("(")[0].trim();
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

      <div class="progress-wrapper">
        <div class="progress-bar">
          <div class="progress-fill" style="width:${p}%"></div>
        </div>
        <div class="progress-text">${p}% concluído</div>
      </div>

      <div class="details">▶ Detalhes</div>
      <div class="detail-box hidden"></div>
    `;

    // DRAG
    card.querySelector(".card-header").addEventListener("dragstart", e => {
      e.dataTransfer.setData("id", task.id);
    });

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

  // atualizar contadores
  document.querySelectorAll(".coluna").forEach(col => {
    const status = col.dataset.status;
    const total = tasks.filter(t => t.status === status).length;
    const h2 = col.querySelector("h2");
    h2.innerHTML = `${status} <span class="count">(${total})</span>`;
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

/* EXPORT */
function exportCSV() {
  let csv = "Status;Título;Descrição;Prazo;Prioridade;Checklist;Progresso\n";

  tasks.forEach(task => {

    // Progresso
    const progress = task.checklist.length
      ? Math.round(
          (task.checklist.filter(i => i.done).length / task.checklist.length) * 100
        )
      : 0;

    // Checklist formatado
    const checklistText = task.checklist.length
      ? task.checklist
          .map(i => (i.done ? "☑ " : "☐ ") + i.text)
          .join(" | ")
      : "";

    // Data formatada
    const prazo = task.date
      ? task.date.split("-").reverse().join("/")
      : "";

    csv +=
      `${task.status};` +
      `"${task.title}";` +
      `"${task.desc || ""}";` +
      `"${prazo}";` +
      `${task.priority};` +
      `"${checklistText}";` +
      `${progress}%\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "tarefas_kanban.csv";
  link.click();
}

render();
