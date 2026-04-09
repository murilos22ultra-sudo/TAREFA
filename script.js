let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let checklistTemp = [];
let editId = null;

const modal = document.getElementById("modal");
const titleInput = document.getElementById("taskTitle");
const descInput = document.getElementById("taskDesc");
const dateInput = document.getElementById("taskDate");
const priorityInput = document.getElementById("taskPriority");
const checkInput = document.getElementById("checkInput");
const checkPreview = document.getElementById("checkPreview");

document.getElementById("btnNovo").onclick = () => openModal();
document.getElementById("cancel").onclick = () => closeModal();
document.getElementById("addCheck").onclick = () => addCheck();
document.getElementById("save").onclick = () => saveTask();
document.getElementById("btnExport").onclick = () => exportCSV();

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
}

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

function saveTask() {
  if (!titleInput.value.trim()) return alert("Título é obrigatório");

  if (editId) {
    const t = tasks.find(x => x.id === editId);
    Object.assign(t, {
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

function progress(t) {
  return t.checklist.length
    ? Math.round(t.checklist.filter(c => c.done).length / t.checklist.length * 100)
    : 0;
}

function render() {
  document.querySelectorAll(".card").forEach(c => c.remove());

  tasks.forEach(t => {
    const p = progress(t);
    const col = document.querySelector(`[data-status="${t.status}"]`);

    const card = document.createElement("div");
    card.className = "card " + (p === 100 ? "green" : p > 0 ? "yellow" : "red");

    card.innerHTML = `
      <div class="card-header">
        <span class="card-title">${t.title}</span>
        <span class="badge ${t.priority}">${t.priority}</span>
      </div>
      <div class="card-desc">${t.desc || ""}</div>
      <div class="details">▶ Detalhes</div>
      <div class="detail-box hidden"></div>
    `;

    const box = card.querySelector(".detail-box");

    t.checklist.forEach(c => {
      const l = document.createElement("label");
      l.className = "check";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = c.done;
      cb.onchange = () => { c.done = cb.checked; persist(); };
      l.append(cb, c.text);
      box.appendChild(l);
    });

    const actions = document.createElement("div");
    actions.innerHTML = `
      <button class="btn blue">Editar</button>
      <button class="btn red">Excluir</button>
    `;
    actions.children[0].onclick = () => openModal(t);
    actions.children[1].onclick = () => {
      if (confirm("Excluir tarefa?")) {
        tasks = tasks.filter(x => x.id !== t.id);
        persist();
      }
    };

    box.appendChild(actions);

    card.querySelector(".details").onclick = () =>
      box.classList.toggle("hidden");

    col.appendChild(card);
  });
}

function persist() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  render();
}

function exportCSV() {
  let csv = "Status;Título;Descrição;Prioridade\n";
  tasks.forEach(t => {
    csv += `${t.status};"${t.title}";"${t.desc || ""}";${t.priority}\n`;
  });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv]));
  a.download = "tarefas.csv";
  a.click();
}

render();
