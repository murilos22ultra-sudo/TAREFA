let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let checklistTemp = [];
let editId = null;

// Elementos
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

/* Modal */
function openModal(task=null){
  editId = task?task.id:null;
  titleInput.value = task?.title||"";
  descInput.value = task?.desc||"";
  dateInput.value = task?.date||"";
  priorityInput.value = task?.priority||"Média";
  checklistTemp = task? [...task.checklist ]:[];
  renderTempChecks();
  modal.classList.remove("hidden");
}
function closeModal(){
  modal.classList.add("hidden");
  checklistTemp=[];
  checkPreview.innerHTML="";
}

/* Checklist no modal */
function addCheck(){
  if(!checkInput.value.trim()) return;
  checklistTemp.push({text:checkInput.value,done:false});
  checkInput.value="";
  renderTempChecks();
}
function renderTempChecks(){
  checkPreview.innerHTML="";
  checklistTemp.forEach(i=>{
    const div=document.createElement("div");
    div.textContent="• "+i.text;
    checkPreview.appendChild(div);
  });
}

/* Salvar */
function saveTask(){
  if(!titleInput.value.trim()) return alert("Título obrigatório");

  if(editId){
    Object.assign(tasks.find(t=>t.id===editId),{
      title:titleInput.value,
      desc:descInput.value,
      date:dateInput.value,
      priority:priorityInput.value,
      checklist:[...checklistTemp]
    });
  }else{
    tasks.push({
      id:Date.now(),
      title:titleInput.value,
      desc:descInput.value,
      date:dateInput.value,
      priority:priorityInput.value,
      checklist:[...checklistTemp],
      status:"A Fazer"
    });
  }
  persist();
  closeModal();
}

/* Util */
function statusClass(s){
  if(s==="A Fazer") return "red";
  if(s==="Em Progresso") return "yellow";
  if(s==="Concluído") return "green";
  return "red";
}
function formatDate(d){
  const [y,m,dd]=d.split("-");
  return `${dd}/${m}/${y}`;
}

/* Render */
function render(){
  document.querySelectorAll(".card").forEach(c=>c.remove());

  tasks.forEach(task=>{
    const col=document.querySelector(`[data-status="${task.status}"]`);
    const card=document.createElement("div");
    card.className="card "+statusClass(task.status);

    card.innerHTML=`
      <div class="card-header" draggable="true">
        <span class="card-title">${task.title}</span>
        <span class="badge ${task.priority}">${task.priority}</span>
      </div>

      ${task.desc?`<div class="card-desc">${task.desc}</div>`:""}
      ${task.date?`<div class="card-date normal">📅 ${formatDate(task.date)}</div>`:""}

      <div class="details">▶ Detalhes</div>
      <div class="detail-box hidden"></div>
    `;

    /* Drag */
    card.querySelector(".card-header").addEventListener("dragstart",e=>{
      e.dataTransfer.setData("id",task.id);
    });

    /* Checklist nos detalhes */
    const box=card.querySelector(".detail-box");
    task.checklist.forEach(i=>{
      const lbl=document.createElement("label");
      lbl.className="check";
      const cb=document.createElement("input");
      cb.type="checkbox";
      cb.checked=i.done;
      cb.onchange=()=>{i.done=cb.checked;persist();};
      lbl.append(cb," "+i.text);
      box.appendChild(lbl);
    });

    /* Ações */
    const act=document.createElement("div");
    act.className="actions";
    act.innerHTML=`
      <button class="btn blue">Editar</button>
      <button class="btn red">Excluir</button>
    `;
    act.children[0].onclick=()=>openModal(task);
    act.children[1].onclick=()=>{if(confirm("Excluir?")){tasks=tasks.filter(t=>t.id!==task.id);persist();}};
    box.appendChild(act);

    card.querySelector(".details").onclick=()=>box.classList.toggle("hidden");
    col.appendChild(card);
  });
}

/* Drag & Drop colunas */
document.querySelectorAll(".coluna").forEach(col=>{
  col.ondragover=e=>e.preventDefault();
  col.ondrop=e=>{
    const id=e.dataTransfer.getData("id");
    const t=tasks.find(x=>x.id==id);
    t.status=col.dataset.status;
    persist();
  };
});

/* Persist */
function persist(){
  localStorage.setItem("tasks",JSON.stringify(tasks));
  render();
}

/* Export */
function exportCSV(){
  let csv="Status;Título;Descrição\n";
  tasks.forEach(t=>{
    csv+=`${t.status};"${t.title}";"${t.desc||""}"\n`;
  });
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([csv]));
  a.download="tarefas.csv";
  a.click();
}

render();
``
