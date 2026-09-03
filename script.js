document.addEventListener("DOMContentLoaded", () => {
  let tasks = readStorage("tasks");
  let reminders = readStorage("reminders");
  let checklistTemp = [];
  let editId = null;

  const modal = document.getElementById("modal");
  const titleInput = document.getElementById("taskTitle");
  const descInput = document.getElementById("taskDesc");
  const dateInput = document.getElementById("taskDate");
  const priorityInput = document.getElementById("taskPriority");
  const checkInput = document.getElementById("checkInput");
  const checkPreview = document.getElementById("checkPreview");

  const modalLembrete = document.getElementById("modalLembrete");
  const lembreteTitulo = document.getElementById("lembreteTitulo");
  const lembreteData = document.getElementById("lembreteData");
  const lembreteHora = document.getElementById("lembreteHora");
  const listaLembretes = document.getElementById("listaLembretes");
  const reminderCount = document.getElementById("reminderCount");

  document.getElementById("btnNovo").addEventListener("click", () => openModal());
  document.getElementById("cancel").addEventListener("click", closeModal);
  document.getElementById("addCheck").addEventListener("click", addCheck);
  document.getElementById("save").addEventListener("click", saveTask);
  document.getElementById("btnExport").addEventListener("click", exportCSV);

  document.getElementById("btnNovoLembrete").addEventListener("click", openReminderModal);
  document.getElementById("cancelarLembrete").addEventListener("click", closeReminderModal);
  document.getElementById("salvarLembrete").addEventListener("click", saveReminder);

  function readStorage(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return Array.isArray(value) ? value : [];
    } catch (error) {
      console.error(`Erro ao ler ${key}:`, error);
      return [];
    }
  }

  function openModal(task = null) {
    editId = task ? task.id : null;
    titleInput.value = task?.title || "";
    descInput.value = task?.desc || "";
    dateInput.value = task?.date || "";
    priorityInput.value = task?.priority || "Média";
    checklistTemp = task ? task.checklist.map(item => ({ ...item })) : [];
    renderTempChecks();
    modal.classList.remove("hidden");
    titleInput.focus();
  }

  function closeModal() {
    modal.classList.add("hidden");
    editId = null;
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
    checkInput.focus();
  }

  function renderTempChecks() {
    checkPreview.innerHTML = "";
    checklistTemp.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "check";

      const text = document.createElement("span");
      text.textContent = `• ${item.text}`;

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "btn red";
      remove.textContent = "Remover";
      remove.addEventListener("click", () => {
        checklistTemp.splice(index, 1);
        renderTempChecks();
      });

      row.append(text, remove);
      checkPreview.appendChild(row);
    });
  }

  function saveTask() {
    const title = titleInput.value.trim();
    if (!title) {
      alert("Título obrigatório");
      titleInput.focus();
      return;
    }

    const data = {
      title,
      desc: descInput.value.trim(),
      date: dateInput.value,
      priority: priorityInput.value,
      checklist: checklistTemp.map(item => ({ ...item }))
    };

    if (editId !== null) {
      const task = tasks.find(item => item.id === editId);
      if (task) Object.assign(task, data);
    } else {
      tasks.push({ id: Date.now(), ...data, status: "A Fazer" });
    }

    persistTasks();
    closeModal();
  }

  function statusClass(status) {
    if (status === "A Fazer") return "red";
    if (status === "Em Progresso") return "yellow";
    return "green";
  }

  function progress(task) {
    if (!task.checklist || task.checklist.length === 0) return 0;
    const completed = task.checklist.filter(item => item.done).length;
    return Math.round((completed / task.checklist.length) * 100);
  }

  function formatDate(date) {
    if (!date) return "";
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  }

  function renderTasks() {
    document.querySelectorAll(".card").forEach(card => card.remove());

    tasks.forEach(task => {
      if (!Array.isArray(task.checklist)) task.checklist = [];
      if (!task.status) task.status = "A Fazer";

      const column = document.querySelector(`[data-status="${task.status}"]`);
      if (!column) return;

      const percentage = progress(task);
      const card = document.createElement("div");
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
      header.addEventListener("dragstart", event => {
        event.dataTransfer.setData("text/plain", String(task.id));
      });

      card.appendChild(header);

      if (task.desc) {
        const description = document.createElement("div");
        description.className = "card-desc";
        description.textContent = task.desc;
        card.appendChild(description);
      }

      if (task.date) {
        const date = document.createElement("div");
        date.className = "card-date";
        date.textContent = `📅 ${formatDate(task.date)}`;
        card.appendChild(date);
      }

      if (task.checklist.length > 0) {
        const wrapper = document.createElement("div");
        wrapper.className = "progress-wrapper";

        const bar = document.createElement("div");
        bar.className = "progress-bar";

        const fill = document.createElement("div");
        fill.className = "progress-fill";
        fill.style.width = `${percentage}%`;

        const progressText = document.createElement("div");
        progressText.className = "progress-text";
        progressText.textContent = `${percentage}% concluído`;

        bar.appendChild(fill);
        wrapper.append(bar, progressText);
        card.appendChild(wrapper);
      }

      const details = document.createElement("div");
      details.className = "details";
      details.textContent = "▶ Detalhes";

      const detailBox = document.createElement("div");
      detailBox.className = "detail-box hidden";

      task.checklist.forEach(item => {
        const label = document.createElement("label");
        label.className = "check";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = Boolean(item.done);
        checkbox.addEventListener("change", () => {
          item.done = checkbox.checked;
          persistTasks();
        });

        const text = document.createElement("span");
        text.textContent = item.text;
        label.append(checkbox, text);
        detailBox.appendChild(label);
      });

      const actions = document.createElement("div");
      actions.className = "actions";

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "btn blue";
      editButton.textContent = "Editar";
      editButton.addEventListener("click", () => openModal(task));

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "btn red";
      deleteButton.textContent = "Excluir";
      deleteButton.addEventListener("click", () => {
        tasks = tasks.filter(item => item.id !== task.id);
        persistTasks();
      });

      actions.append(editButton, deleteButton);
      detailBox.appendChild(actions);

      details.addEventListener("click", () => {
        detailBox.classList.toggle("hidden");
        details.textContent = detailBox.classList.contains("hidden")
          ? "▶ Detalhes"
          : "▼ Detalhes";
      });

      card.append(details, detailBox);
      column.appendChild(card);
    });

    document.querySelectorAll(".coluna").forEach(column => {
      const total = tasks.filter(task => task.status === column.dataset.status).length;
      column.querySelector("h2").textContent = `${column.dataset.status} (${total})`;
    });
  }

  function persistTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
    renderTasks();
  }

  function openReminderModal() {
    modalLembrete.classList.remove("hidden");
    lembreteTitulo.focus();
  }

  function closeReminderModal() {
    modalLembrete.classList.add("hidden");
    lembreteTitulo.value = "";
    lembreteData.value = "";
    lembreteHora.value = "";
  }

  function saveReminder() {
    const title = lembreteTitulo.value.trim();
    if (!title) {
      alert("Digite o lembrete.");
      lembreteTitulo.focus();
      return;
    }

    reminders.push({
      id: Date.now(),
      title,
      date: lembreteData.value,
      time: lembreteHora.value
    });

    persistReminders();
    closeReminderModal();
  }

  function renderReminders() {
    listaLembretes.innerHTML = "";
    reminderCount.textContent = `(${reminders.length})`;

    if (reminders.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-message";
      empty.textContent = "Nenhum lembrete cadastrado.";
      listaLembretes.appendChild(empty);
      return;
    }

    reminders.forEach(reminder => {
      const item = document.createElement("div");
      item.className = "lembrete-item";

      const info = document.createElement("div");
      info.className = "lembrete-info";

      const title = document.createElement("strong");
      title.textContent = reminder.title;
      info.appendChild(title);

      const dateTimeParts = [];
      if (reminder.date) dateTimeParts.push(formatDate(reminder.date));
      if (reminder.time) dateTimeParts.push(reminder.time);

      if (dateTimeParts.length > 0) {
        const dateTime = document.createElement("span");
        dateTime.className = "lembrete-data";
        dateTime.textContent = dateTimeParts.join(" às ");
        info.appendChild(dateTime);
      }

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "btn red excluir-lembrete";
      deleteButton.textContent = "Excluir";
      deleteButton.addEventListener("click", () => {
        reminders = reminders.filter(item => item.id !== reminder.id);
        persistReminders();
      });

      item.append(info, deleteButton);
      listaLembretes.appendChild(item);
    });
  }

  function persistReminders() {
    localStorage.setItem("reminders", JSON.stringify(reminders));
    renderReminders();
  }

  function exportCSV() {
    const lines = ["Status;Título;Descrição;Prazo;Prioridade;Checklist;Progresso"];

    tasks.forEach(task => {
      const checklist = (task.checklist || [])
        .map(item => `${item.done ? "☑" : "☐"} ${item.text}`)
        .join(" | ");

      lines.push([
        task.status,
        task.title,
        task.desc || "",
        formatDate(task.date),
        task.priority,
        checklist,
        `${progress(task)}%`
      ].map(csvField).join(";"));
    });

    const csv = "\uFEFF" + lines.join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "tarefas_kanban.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function csvField(value) {
    return `"${String(value ?? "").replaceAll('"', '""')}"`;
  }

  document.querySelectorAll(".coluna").forEach(column => {
    column.addEventListener("dragover", event => event.preventDefault());
    column.addEventListener("drop", event => {
      event.preventDefault();
      const id = Number(event.dataTransfer.getData("text/plain"));
      const task = tasks.find(item => item.id === id);
      if (!task) return;
      task.status = column.dataset.status;
      persistTasks();
    });
  });

  modal.addEventListener("click", event => {
    if (event.target === modal) closeModal();
  });

  modalLembrete.addEventListener("click", event => {
    if (event.target === modalLembrete) closeReminderModal();
  });

  renderTasks();
  renderReminders();
});
