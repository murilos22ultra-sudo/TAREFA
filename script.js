document.addEventListener("DOMContentLoaded", () => {
  let tasks = readList("tasks");
  let reminders = readList("reminders");
  let checklistTemp = [];
  let editTaskId = null;
  let editReminderId = null;

  const modal = document.getElementById("modal");
  const taskModalTitle = document.getElementById("taskModalTitle");
  const titleInput = document.getElementById("taskTitle");
  const descInput = document.getElementById("taskDesc");
  const dateInput = document.getElementById("taskDate");
  const priorityInput = document.getElementById("taskPriority");
  const checkInput = document.getElementById("checkInput");
  const checkPreview = document.getElementById("checkPreview");

  const modalLembrete = document.getElementById("modalLembrete");
  const reminderModalTitle = document.getElementById("reminderModalTitle");
  const reminderSaveButton = document.getElementById("salvarLembrete");
  const lembreteTitulo = document.getElementById("lembreteTitulo");
  const lembreteData = document.getElementById("lembreteData");
  const lembreteHora = document.getElementById("lembreteHora");
  const listaLembretes = document.getElementById("listaLembretes");
  const reminderCount = document.getElementById("reminderCount");

  document.getElementById("btnNovo").addEventListener("click", () => openTaskModal());
  document.getElementById("cancel").addEventListener("click", closeTaskModal);
  document.getElementById("addCheck").addEventListener("click", addCheck);
  document.getElementById("save").addEventListener("click", saveTask);
  document.getElementById("btnExport").addEventListener("click", exportCSV);
  document.getElementById("btnNovoLembrete").addEventListener("click", () => openReminderModal());
  document.getElementById("cancelarLembrete").addEventListener("click", closeReminderModal);
  reminderSaveButton.addEventListener("click", saveReminder);

  function readList(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return Array.isArray(value) ? value : [];
    } catch (error) {
      console.error(`Erro ao ler ${key}:`, error);
      return [];
    }
  }

  function showModal(element) {
    element.hidden = false;
    element.classList.remove("hidden");
  }

  function hideModal(element) {
    element.hidden = true;
    element.classList.add("hidden");
  }

  function openTaskModal(task = null) {
    editTaskId = task ? task.id : null;
    taskModalTitle.textContent = task ? "Editar atividade" : "Cadastrar atividade";
    titleInput.value = task?.title || "";
    descInput.value = task?.desc || "";
    dateInput.value = task?.date || "";
    priorityInput.value = task?.priority || "Média";
    checklistTemp = Array.isArray(task?.checklist) ? task.checklist.map(item => ({ ...item })) : [];
    renderTempChecks();
    showModal(modal);
    titleInput.focus();
  }

  function closeTaskModal() {
    hideModal(modal);
    editTaskId = null;
    checklistTemp = [];
    checkInput.value = "";
    checkPreview.innerHTML = "";
  }

  function addCheck() {
    const text = checkInput.value.trim();
    if (!text) return;
    checklistTemp.push({ text, done: false });
    checkInput.value = "";
    renderTempChecks();
  }

  function renderTempChecks() {
    checkPreview.innerHTML = "";
    checklistTemp.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "check-preview-item";
      const text = document.createElement("span");
      text.textContent = `• ${item.text}`;
      const remove = makeButton("Remover", "btn red", () => {
        checklistTemp.splice(index, 1);
        renderTempChecks();
      });
      row.append(text, remove);
      checkPreview.appendChild(row);
    });
  }

  function saveTask() {
    const title = titleInput.value.trim();
    if (!title) return alert("Título obrigatório");

    const data = {
      title,
      desc: descInput.value.trim(),
      date: dateInput.value,
      priority: priorityInput.value,
      checklist: checklistTemp.map(item => ({ ...item }))
    };

    if (editTaskId !== null) {
      const task = tasks.find(item => item.id === editTaskId);
      if (task) Object.assign(task, data);
    } else {
      tasks.push({ id: Date.now(), ...data, status: "A Fazer" });
    }

    saveTasks();
    closeTaskModal();
  }

  function renderTasks() {
    document.querySelectorAll(".card").forEach(card => card.remove());

    tasks.forEach(task => {
      task.checklist = Array.isArray(task.checklist) ? task.checklist : [];
      task.status = task.status || "A Fazer";
      const column = document.querySelector(`[data-status="${task.status}"]`);
      if (!column) return;

      const card = document.createElement("article");
      card.className = `card ${statusClass(task.status)}`;

      const header = document.createElement("div");
      header.className = "card-header";
      header.draggable = true;
      const title = document.createElement("span");
      title.className = "card-title";
      title.textContent = task.title;
      const badge = document.createElement("span");
      badge.className = `badge ${task.priority}`;
      badge.textContent = task.priority;
      header.append(title, badge);
      header.addEventListener("dragstart", event => event.dataTransfer.setData("text/plain", String(task.id)));
      card.appendChild(header);

      if (task.desc) card.appendChild(textElement("div", "card-desc", task.desc));
      if (task.date) card.appendChild(textElement("div", "card-date", `📅 ${formatDate(task.date)}`));

      if (task.checklist.length) {
        const percentage = progress(task);
        const wrapper = document.createElement("div");
        wrapper.className = "progress-wrapper";
        const bar = document.createElement("div");
        bar.className = "progress-bar";
        const fill = document.createElement("div");
        fill.className = "progress-fill";
        fill.style.width = `${percentage}%`;
        bar.appendChild(fill);
        wrapper.append(bar, textElement("div", "progress-text", `${percentage}% concluído`));
        card.appendChild(wrapper);
      }

      const details = textElement("div", "details", "▶ Detalhes");
      const box = document.createElement("div");
      box.className = "detail-box hidden";

      task.checklist.forEach(item => {
        const label = document.createElement("label");
        label.className = "check";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = Boolean(item.done);
        checkbox.addEventListener("change", () => {
          item.done = checkbox.checked;
          saveTasks();
        });
        label.append(checkbox, document.createTextNode(item.text));
        box.appendChild(label);
      });

      const actions = document.createElement("div");
      actions.className = "actions";
      actions.append(
        makeButton("Editar", "btn blue", () => openTaskModal(task)),
        makeButton("Excluir", "btn red", () => {
          tasks = tasks.filter(item => item.id !== task.id);
          saveTasks();
        })
      );
      box.appendChild(actions);
      details.addEventListener("click", () => {
        box.classList.toggle("hidden");
        details.textContent = box.classList.contains("hidden") ? "▶ Detalhes" : "▼ Detalhes";
      });
      card.append(details, box);
      column.appendChild(card);
    });

    document.querySelectorAll(".coluna").forEach(column => {
      const total = tasks.filter(task => task.status === column.dataset.status).length;
      column.querySelector("h2").textContent = `${column.dataset.status} (${total})`;
    });
  }

  function openReminderModal(reminder = null) {
    editReminderId = reminder ? reminder.id : null;
    reminderModalTitle.textContent = reminder ? "Editar lembrete" : "Criar lembrete";
    reminderSaveButton.textContent = reminder ? "Salvar alterações" : "Salvar";
    lembreteTitulo.value = reminder?.title || "";
    lembreteData.value = reminder?.date || "";
    lembreteHora.value = reminder?.time || "";
    showModal(modalLembrete);
    lembreteTitulo.focus();
  }

  function closeReminderModal() {
    hideModal(modalLembrete);
    editReminderId = null;
    lembreteTitulo.value = "";
    lembreteData.value = "";
    lembreteHora.value = "";
  }

  function saveReminder() {
    const title = lembreteTitulo.value.trim();
    if (!title) return alert("Digite o lembrete.");

    const data = { title, date: lembreteData.value, time: lembreteHora.value };
    if (editReminderId !== null) {
      const reminder = reminders.find(item => item.id === editReminderId);
      if (reminder) Object.assign(reminder, data);
    } else {
      reminders.push({ id: Date.now(), ...data });
    }
    saveReminders();
    closeReminderModal();
  }

  function renderReminders() {
    listaLembretes.innerHTML = "";
    reminderCount.textContent = `(${reminders.length})`;

    if (!reminders.length) {
      listaLembretes.appendChild(textElement("p", "empty-message", "Nenhum lembrete cadastrado."));
      return;
    }

    reminders.forEach(reminder => {
      const item = document.createElement("article");
      item.className = "lembrete-item";
      const info = document.createElement("div");
      info.className = "lembrete-info";
      info.appendChild(textElement("strong", "", reminder.title));
      const dateTime = [];
      if (reminder.date) dateTime.push(formatDate(reminder.date));
      if (reminder.time) dateTime.push(reminder.time);
      if (dateTime.length) info.appendChild(textElement("span", "lembrete-data", dateTime.join(" às ")));

      const actions = document.createElement("div");
      actions.className = "lembrete-actions";
      actions.append(
        makeButton("Editar", "btn blue", () => openReminderModal(reminder)),
        makeButton("Excluir", "btn red", () => {
          reminders = reminders.filter(item => item.id !== reminder.id);
          saveReminders();
        })
      );
      item.append(info, actions);
      listaLembretes.appendChild(item);
    });
  }

  function textElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    return element;
  }

  function makeButton(text, className, handler) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = text;
    button.addEventListener("click", handler);
    return button;
  }

  function statusClass(status) {
    return status === "A Fazer" ? "red" : status === "Em Progresso" ? "yellow" : "green";
  }

  function progress(task) {
    if (!task.checklist.length) return 0;
    return Math.round(task.checklist.filter(item => item.done).length / task.checklist.length * 100);
  }

  function formatDate(date) {
    if (!date) return "";
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  }

  function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
    renderTasks();
  }

  function saveReminders() {
    localStorage.setItem("reminders", JSON.stringify(reminders));
    renderReminders();
  }

  function csvField(value) {
    return `"${String(value ?? "").replaceAll('"', '""')}"`;
  }

  function exportCSV() {
    const lines = ["Status;Título;Descrição;Prazo;Prioridade;Checklist;Progresso"];
    tasks.forEach(task => {
      const checklist = (task.checklist || []).map(item => `${item.done ? "☑" : "☐"} ${item.text}`).join(" | ");
      lines.push([
        task.status, task.title, task.desc || "", formatDate(task.date),
        task.priority, checklist, `${progress(task)}%`
      ].map(csvField).join(";"));
    });
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tarefas_kanban.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  document.querySelectorAll(".coluna").forEach(column => {
    column.addEventListener("dragover", event => event.preventDefault());
    column.addEventListener("drop", event => {
      event.preventDefault();
      const id = Number(event.dataTransfer.getData("text/plain"));
      const task = tasks.find(item => item.id === id);
      if (!task) return;
      task.status = column.dataset.status;
      saveTasks();
    });
  });

  modal.addEventListener("click", event => { if (event.target === modal) closeTaskModal(); });
  modalLembrete.addEventListener("click", event => { if (event.target === modalLembrete) closeReminderModal(); });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeTaskModal();
      closeReminderModal();
    }
  });

  hideModal(modal);
  hideModal(modalLembrete);
  renderTasks();
  renderReminders();
});
