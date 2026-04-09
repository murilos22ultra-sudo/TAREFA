let checklistTemp = [];
let tarefas = JSON.parse(localStorage.getItem("tarefas")) || [];

function abrirModal() {
  document.getElementById("modal").classList.remove("hidden");
}

function fecharModal() {
  document.getElementById("modal").classList.add("hidden");
}

/* CHECKLIST */
function addChecklist() {
  const input = document.getElementById("check-item");
  if (!input.value) return;

  checklistTemp.push({ texto: input.value, ok: false });
  input.value = "";
  renderChecklistTemp();
}

function renderChecklistTemp() {
  const ul = document.getElementById("lista-checklist");
  ul.innerHTML = "";

  checklistTemp.forEach(i => {
    const li = document.createElement("li");
    li.textContent = i.texto;
    ul.appendChild(li);
  });
}

/* TAREFA */
function criarTarefa() {
  const titulo = document.getElementById("titulo").value;
  const prioridade = document.getElementById("prioridade").value;
  if (!titulo) return;

  tarefas.push({
    titulo,
    prioridade,
    checklist: checklistTemp,
    status: "A Fazer"
  });

  checklistTemp = [];
  document.getElementById("titulo").value = "";
  renderChecklistTemp();
  salvar();
  fecharModal();
}

function salvar() {
  localStorage.setItem("tarefas", JSON.stringify(tarefas));
  render();
}

function render() {
  document.querySelectorAll(".cards").forEach(c => c.innerHTML = "");

  tarefas.forEach(t => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<strong>${t.titulo}</strong>`;

    document
      .querySelector(`[data-status="${t.status}"] .cards`)
      .appendChild(card);
  });
}

render();
``
