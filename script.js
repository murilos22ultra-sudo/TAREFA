let checklistTemp = [];
let tarefas = JSON.parse(localStorage.getItem("tarefas")) || [];

function addChecklistTemp() {
  const texto = document.getElementById("check-item").value;
  if (!texto) return;
  checklistTemp.push({ texto, ok: false });
  document.getElementById("check-item").value = "";
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
}

function progresso(lista) {
  if (lista.length === 0) return 0;
  return Math.round(lista.filter(i => i.ok).length / lista.length * 100);
}

function salvar() {
  localStorage.setItem("tarefas", JSON.stringify(tarefas));
  render();
}

function render() {
  document.querySelectorAll(".cards").forEach(c => c.innerHTML = "");

  tarefas.forEach((t, index) => {
    const pct = progresso(t.checklist);
    const card = document.createElement("div");
    card.className = `card ${pct === 100 ? "green" : pct > 0 ? "yellow" : "red"}`;

    card.innerHTML = `
      <strong>${t.titulo}</strong>
      <div class="progress">Progresso: ${pct}%</div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${pct}%"></div>
      </div>
    `;

    t.checklist.forEach(i => {
      const chk = document.createElement("label");
      chk.className = "check";

      const box = document.createElement("input");
      box.type = "checkbox";
      box.checked = i.ok;
      box.onchange = () => {
        i.ok = box.checked;
        salvar();
      };

      chk.appendChild(box);
      chk.appendChild(document.createTextNode(" " + i.texto));
      card.appendChild(chk);
    });

    const badge = document.createElement("span");
    badge.className = `badge ${t.prioridade}`;
    badge.textContent = t.prioridade;
    card.appendChild(badge);

    document.querySelector(`[data-status="${t.status}"] .cards`).appendChild(card);
  });
}

function exportarCSV() {
  let csv = "Status;Título;Prioridade;Progresso\n";
  tarefas.forEach(t => {
    csv += `${t.status};"${t.titulo}";${t.prioridade};${progresso(t.checklist)}%\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "kanban.csv";
  a.click();
}

render();