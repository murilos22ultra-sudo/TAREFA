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
// CHECKLIST (MODAL)
// ================================
function addCheck() {
  if (!checkInput.value.trim()) return;

  checklistTemp.push({
    text: checkInput.value,
    done: false
  });

  checkInput.value = "";
  renderTempChecks();
}

function renderTempChecks() {
  checkPreview.innerHTML = "";
  checklistTemp.forEach(item => {
    const div = document.createElement("div");
    div.textContent = "• " + item.text;
    div.style.fontSize = "13px";
    checkPreview.appendChild(div);
  });
}

// ================================
// SALVAR TAREFA
// ================================
function saveTask() {
  if (!titleInput.value.trim()) {
    alert("Título é obrigatório");
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  if (dateInput.value && dateInput.value < today) {
    alert("A data não pode ser no passado");
    return;
  }

  if (editId) {
    const t = tasks.find(x => x.id === editId);
    t.title = titleInput.value;
    t.desc = descInput.value;
    t.date = dateInput.value;
    t.priority = priorityInput.value;
    t.checklist = checklistTemp;
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
// PROGRESSO
// ================================
function getProgress(task) {
  if (!task.checklist.length) return 0;
  return Math.round(
    (task.checklist.filter(i => i.done).length / task.checklist.length) * 100
  );
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
    card.className =
      "card " + (progress === 100 ? "green" : progress > 0 ? "yellow" : "red");

    // ✅ DESCRIÇÃO INSERIDA AQUI
    card.innerHTML = `
      <div class="card-header">
        <span class="card-title">${task.title}</span>
        <span class="badge ${task.priority}">${task.priority}</span>
      </div>

      ${
        task.desc
          ? `<div class="card-desc">${task.desc}</div>`
          : ""
      }

      <div class="details">▶ Detalhes</div>

      <div class="detail-box hidden">
        <div class="progress-text">${progress}%</div>
        <div class="bar">
          <div style="width:${progress}%"></div>
        </div>
      </div>
    `;

    const detailBox = card.querySelector(".detail-box");

    // Checklist dentro dos detalhes
    task.checklist.forEach(item => {
      const label = document.createElement("label");
      label.className = "check";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = item.done;
      checkbox.onchange = () => {
        item.done = checkbox.checked;
        persist();
      };

      label.append(checkbox, item.text);
      detailBox.appendChild(label);
    });

    // Ações
    const actions = document.createElement("div");
    actions.className = "actions";
    actions.innerHTML = `
      <button class="btn blue">Editar</button>
      <button class="btn red">Excluir</button>
    `;

    actions.children[0].onclick = () => openModal(task);
    actions.children[1].onclick = () => {
      if (confirm("Deseja excluir esta tarefa?")) {
        tasks = tasks.filter(t => t.id !== task.id);
        persist();
      }
    };

    detailBox.appendChild(actions);

    // Toggle detalhes
    card.querySelector(".details").onclick = () => {
      detailBox.classList.toggle("hidden");
    };

    column.appendChild(card);
  });
}

// ================================
// DRAG & DROP
// ================================
document.querySelectorAll(".coluna").forEach(col => {
  col.ondragover = e => e.preventDefault();
  col.ondrop = e => {
    const id = e.dataTransfer.getData("id");
    const t = tasks.find(x => x.id == id);
    t.status = col.dataset.status;
    persist();
  };
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
  let csv = "Status;Título;Descrição;Prioridade;Progresso\n";

  tasks.forEach(t => {
    const p = getProgress(t);
    csv += `${t.status};"${t.title}";"${t.desc || ""}";${t.priority};${p}%\n`;
  });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv]));
  a.download = "tarefas.csv";
  a.click();
}

// ================================
// INICIALIZA
// ================================
render();
