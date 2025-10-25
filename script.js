const ADMIN_IP = '91.168.121.246'; 
const STORAGE_KEY = 'Fahim:v2';

const page = document.body.dataset.page || 'public';
const isAdminPage = page === 'admin';

const avatarPublic = document.getElementById('avatarPublic');
const publicName = document.getElementById('publicName');
const publicBio = document.getElementById('publicBio');
const publicLinks = document.getElementById('publicLinks');
const sharePublic = document.getElementById('sharePublic');

const adminLock = document.getElementById('adminLock');
const adminUI = document.getElementById('adminUI');
const adminName = document.getElementById('adminName');
const adminBio = document.getElementById('adminBio');
const adminAvatar = document.getElementById('adminAvatar');
const newTitle = document.getElementById('newTitle');
const newUrl = document.getElementById('newUrl');
const addBtn = document.getElementById('addBtn');
const editorList = document.getElementById('editorList');
const saveBtn = document.getElementById('saveBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const resetBtn = document.getElementById('resetBtn');
const previewBox = document.getElementById('previewBox');

// Valeurs par défaut
let state = {
  name: 'Ton Nom',
  bio: 'Ta bio courte...',
  avatar: '',
  links: []
};

// Charge les données depuis le navigateur sans jamais réinitialiser inutilement
async function loadState() {
  try {
    // Essaie d'abord de charger depuis localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      state = JSON.parse(stored);
      renderAll();
      return;
    }

    // Sinon charge depuis data.json
    const response = await fetch('data.json');
    if (response.ok) {
      state = await response.json();
      saveState(); // Sauvegarde en localStorage pour la prochaine fois
      renderAll();
    }
  } catch(e) {
    console.warn('Load failed', e);
  }
}

// Sauvegarde les données dans le navigateur
function saveState(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    renderAll();
  }catch(e){ 
    console.warn('Save failed', e); 
  }
}

// Fonction pour la page publique
function renderPublic(){
  if(!publicName) return;
  publicName.textContent = state.name || '—';
  publicBio.textContent = state.bio || '';
  avatarPublic.style.backgroundImage = state.avatar ? `url(${state.avatar})` : '';
  avatarPublic.style.backgroundSize = 'cover';

  publicLinks.innerHTML = '';
  state.links.forEach(l => {
    const el = document.createElement('a');
    el.className = 'link-card';
    el.href = l.url;
    el.target = '_blank';
    el.rel = 'noopener';
    el.innerHTML = `
      <div class="link-ico">🔗</div>
      <div style="flex:1">
        <div class="link-title">${escapeHtml(l.title)}</div>
        <div class="link-desc">${escapeHtml(l.desc||'')}</div>
      </div>
      <div class="small muted">→</div>
    `;
    publicLinks.appendChild(el);
  });
}

// Fonction pour la page admin
function renderAdmin(){
  if(!isAdminPage || !adminUI) return;
  adminName.value = state.name;
  adminBio.value = state.bio;
  adminAvatar.value = state.avatar;

  editorList.innerHTML = '';
  state.links.forEach((l, i)=>{
    const row = document.createElement('div');
    row.className = 'editor-item';
    row.innerHTML = `
      <input class="ed-title" value="${escapeHtml(l.title)}" />
      <input class="ed-url" value="${escapeHtml(l.url)}" />
      <input class="ed-desc" value="${escapeHtml(l.desc||'')}" />
      <button class="small-btn del">Suppr</button>
    `;
    const titleInput = row.querySelector('.ed-title');
    const urlInput = row.querySelector('.ed-url');
    const descInput = row.querySelector('.ed-desc');
    const delBtn = row.querySelector('.del');

    titleInput.addEventListener('input', ()=> { state.links[i].title = titleInput.value; saveState(); });
    urlInput.addEventListener('input', ()=> { state.links[i].url = urlInput.value; saveState(); });
    descInput.addEventListener('input', ()=> { state.links[i].desc = descInput.value; saveState(); });
    delBtn.addEventListener('click', ()=> { state.links.splice(i,1); saveState(); });

    editorList.appendChild(row);
  });

  if(previewBox){
    previewBox.innerHTML = `
      <div style="padding:12px;border-radius:10px;background:rgba(255,255,255,0.02)">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <div style="width:48px;height:48px;border-radius:10px;background:${state.avatar?`url(${state.avatar}) center/cover`:`linear-gradient(90deg, ${getAccent()}, ${getAccentB()})`}"></div>
          <div>
            <div style="font-weight:700">${escapeHtml(state.name)}</div>
            <div class="muted small">${escapeHtml(state.bio)}</div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${state.links.map(l=>`<div style="padding:8px;border-radius:8px;background:rgba(255,255,255,0.02)">${escapeHtml(l.title)}</div>`).join('')}
        </div>
      </div>
    `;
  }
}

// Fonctions utilitaires
function escapeHtml(s=''){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }
function getAccent(){ return '#7c3aed'; }
function getAccentB(){ return '#06b6d4'; }

// Ajouter un lien
function addLink(){
  const t = (newTitle && newTitle.value || '').trim();
  const u = (newUrl && newUrl.value || '').trim();
  if(!t || !u) return alert('Titre et URL requis');
  state.links.unshift({ title: t, url: u, desc: '' });
  newTitle.value=''; newUrl.value='';
  saveState();
}

// Export / import JSON
function exportJSON(){
  const blob = new Blob([JSON.stringify(state, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'Fahim-export.json';
  a.click(); URL.revokeObjectURL(url);
}

function importJSON(){
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = ()=> {
    const f = input.files[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = e => {
      try{
        const parsed = JSON.parse(e.target.result);
        if(parsed && typeof parsed === 'object'){
          state = parsed;
          saveState();
          alert('Import OK');
        } else alert('JSON invalide');
      }catch(err){ alert('Erreur lors de l\'import : ' + err.message); }
    };
    reader.readAsText(f);
  };
  input.click();
}

// Réinitialiser toutes les données
function resetAll(){
  if(!confirm('Supprimer toutes les données locales ?')) return;
  localStorage.removeItem(STORAGE_KEY);
  state = { name:'Ton Nom', bio:'Ta bio courte...', avatar:'', links:[] };
  saveState();
}

// Partage
if(sharePublic) sharePublic.addEventListener('click', async ()=>{
  const url = location.href;
  if(navigator.share){ 
    try{ await navigator.share({ title: state.name || 'Ma page', text: state.bio||'', url }); }catch(e){}
  } else { 
    await navigator.clipboard.writeText(url); 
    alert('URL copiée'); 
  }
});

// Admin events
if(isAdminPage){
  if(addBtn) addBtn.addEventListener('click', addLink);
  if(saveBtn) saveBtn.addEventListener('click', saveState);
  if(exportBtn) exportBtn.addEventListener('click', exportJSON);
  if(importBtn) importBtn.addEventListener('click', importJSON);
  if(resetBtn) resetBtn.addEventListener('click', resetAll);
  if(adminName) adminName.addEventListener('input', ()=> { state.name = adminName.value; saveState(); });
  if(adminBio) adminBio.addEventListener('input', ()=> { state.bio = adminBio.value; saveState(); });
  if(adminAvatar) adminAvatar.addEventListener('input', ()=> { state.avatar = adminAvatar.value; saveState(); });
}

// Charge et affiche tout
(async () => {
  await loadState();
  renderAll();
})();

// Vérification IP pour admin
if(isAdminPage){
  detectAdminIP().then(isAdmin=>{
    if(isAdmin){
      adminLock.style.display = 'none';
      adminUI.hidden = false;
      renderAdmin();
    } else {
      adminLock.textContent = 'Accès refusé — votre IP n\'est pas autorisée.';
      adminUI.hidden = true;
    }
  }).catch(err=>{
    adminLock.textContent = 'Impossible de vérifier l\'IP (service bloqué). L\'admin est masqué.';
    adminUI.hidden = true;
    console.warn('IP detect error', err);
  });
}

function renderAll(){ renderPublic(); renderAdmin(); }

async function detectAdminIP(){
  try{
    const res = await fetch('https://api.ipify.org?format=json', {cache:'no-store'});
    if(!res.ok) throw new Error('no network');
    const js = await res.json();
    const ip = js && js.ip;
    return ip === ADMIN_IP;
  }catch(e){
    throw e;
  }
}
