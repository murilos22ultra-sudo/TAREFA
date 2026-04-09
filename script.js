// ===== ESTADO GLOBAL =====
let checklistTemp = [];
let tarefas = JSON.parse(localStorage.getItem("tarefas")) || [];

// ===== MODAL =====
function abrirModal() {
  document.getElementById("modal").classList.remove("hidden");
}

function fecharModal() {
  document.getElementById("modal").classList.add("hidden");
}

// ===== CHECKLIST NO MODAL =====
function addChecklist() {
  const input = document.getElementById("check-item");
  const texto = input.value.trim();

  if (!texto) return;

  checklistTemp.push({ texto, ok: false });
  input.value = "";
  renderChecklistTemp();
}

function renderChecklistTemp() {
  const ul = document.getElementById("lista-checklist");
  ul.innerHTML = "";

  checklistTemp.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item.texto;
    ul.appendChild(li);
  });
}

// ===== CRIAR TAREFA =====
function criarTarefa() {
  const tituloInput = document.getElementById("titulo");
  const prioridadeSelect = document.getElementById("prioridade");

  const titulo = tituloInput.value.trim();
  const prioridade = prioridadeSelect.value;

  if (!titulo) {
    alert("Digite um título para a tarefa.");
    return;
  }

  tarefas.push({
    titulo,
    prioridade,
    checklist: [...checklistTemp],
    status: "A Fazer"
  });

  // Resetar formulário
  checklistTemp = [];
  tituloInput.value = "";
  document.getElementById("check-item").value = "";
  renderChecklistTemp();

  salvar();
  fecharModal();
}

// ===== SALVAR E RENDERIZAR =====
function salvar() {
  localStorage.setItem("tarefas", JSON.stringify(tarefas));
  render();
}

function render() {
  document.querySelectorAll(".cards").forEach(c => (c.innerHTML = ""));

  tarefas.forEach(tarefa => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <strong>${tarefa.titulo}</strong>
      <div class="detalhes">▶ Detalhes</div>
    `;

    // Badge de prioridade
    const badge = document.createElement("span");
    badge.className = `badge ${tarefa.prioridade}`;
    badge.textContent = tarefa.prioridade;
    card.appendChild(badge);

    document
      .querySelector(\`[data-status="\${tarefa.status}"] .cards\`)
      .appendChild(card);
  });
}

// ===== INICIALIZAÇÃO =====
render();
