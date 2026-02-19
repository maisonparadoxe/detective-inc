/* ══════════════════════════════════════════════
   DATA LOADING
══════════════════════════════════════════════ */
let ALL_CRIMES = [];
let ALL_DETECTIVES = [];
let ALL_BONUS = [];
let EVENTS = [];
let HIRE_CANDIDATES = [];

async function loadGameData() {
  console.log('🔄 Début du chargement des données...');
  try {
    console.log('📂 Chargement des fichiers JSON...');
    const [crimes, detectives, bonus, events, hire] = await Promise.all([
      fetch('data/crimes.json').then(r => {
        console.log('✓ crimes.json chargé');
        return r.json();
      }),
      fetch('data/detectives.json').then(r => {
        console.log('✓ detectives.json chargé');
        return r.json();
      }),
      fetch('data/bonus.json').then(r => {
        console.log('✓ bonus.json chargé');
        return r.json();
      }),
      fetch('data/events.json').then(r => {
        console.log('✓ events.json chargé');
        return r.json();
      }),
      fetch('data/hire.json').then(r => {
        console.log('✓ hire.json chargé');
        return r.json();
      })
    ]);
    
    ALL_CRIMES = crimes;
    ALL_DETECTIVES = detectives;
    ALL_BONUS = bonus;
    EVENTS = events;
    HIRE_CANDIDATES = hire;
    
    console.log('✅ Données chargées:', {
      crimes: ALL_CRIMES.length,
      detectives: ALL_DETECTIVES.length,
      bonus: ALL_BONUS.length,
      events: EVENTS.length,
      candidats: HIRE_CANDIDATES.length
    });
    
    return true;
  } catch (error) {
    console.error('❌ Erreur de chargement des données:', error);
    alert('⚠️ ERREUR DE CHARGEMENT\n\nLe jeu ne peut pas charger les fichiers JSON.\n\nVous devez utiliser un serveur web local !\n\nOuvrez la console (F12) pour plus de détails.\n\nSolution : python -m http.server 8000');
    return false;
  }
}

/* ══════════════════════════════════════════════
   START SCREEN
══════════════════════════════════════════════ */
async function startGame() {
  console.log('🎮 Bouton "Commencer à Jouer" cliqué !');
  const loaded = await loadGameData();
  if (loaded) {
    console.log('🎯 Données chargées avec succès, lancement du jeu...');
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game').style.display = 'grid';
    initGame();
  } else {
    console.error('❌ Échec du chargement des données');
  }
}

/* ══════════════════════════════════════════════
   GAME STATE
══════════════════════════════════════════════ */
let G = {};

function initGame() {
  document.getElementById('gameover').classList.remove('active');
  document.getElementById('game').style.display = 'flex';
  G = {
    day: 1,
    money: 800,
    reputation: 50,
    detectives: [
      {...ALL_DETECTIVES[0], indisponible:0},
      {...ALL_DETECTIVES[2], indisponible:0},
      {...ALL_DETECTIVES[3], indisponible:0},
    ],
    crimes: [],
    bonusCards: [],
    assignments: {},
    phase: 'morning',
    event: null,
    results: [],
    totalDays: 0,
    totalResolved: 0,
    globalModifier: 0,
    dangerModifier: 0,
    selectedCrime: null,
    selectedDet: null,
    selectedBonus: null,
  };
  startMorning();
}

/* ══════════════════════════════════════════════
   PHASES
══════════════════════════════════════════════ */
function startMorning() {
  G.phase = 'morning';
  G.selectedCrime = null;
  G.selectedDet = null;
  G.selectedBonus = null;
  G.assignments = {};
  G.globalModifier = 0;
  G.dangerModifier = 0;
  G.results = [];

  // Pick event
  G.event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
  applyEventStart(G.event);

  // Pick 3 crimes
  const pool = [...ALL_CRIMES].sort(() => Math.random()-0.5);
  G.crimes = pool.slice(0,3);
  if (G.event.effet === 'extra-crime') {
    G.crimes.push(pool[3]);
  }

  // Pick 2 bonus cards
  const bpool = [...ALL_BONUS].sort(() => Math.random()-0.5);
  G.bonusCards = bpool.slice(0,2);

  renderMorning();
  updateUI();
}

function applyEventStart(ev) {
  if (ev.effet.startsWith('rep+')) {
    const val = parseInt(ev.effet.replace('rep+',''));
    G.reputation = Math.min(100, G.reputation + val);
  }
  else if (ev.effet.startsWith('rep-')) {
    const val = parseInt(ev.effet.replace('rep-',''));
    G.reputation = Math.max(0, G.reputation - val);
  }
  else if (ev.effet.startsWith('money+')) {
    const val = parseInt(ev.effet.replace('money+',''));
    G.money += val;
  }
  else if (ev.effet.startsWith('global-')) {
    const val = parseInt(ev.effet.replace('global-',''));
    G.globalModifier = -val;
  }
  else if (ev.effet.startsWith('danger+')) {
    const val = parseInt(ev.effet.replace('danger+',''));
    G.dangerModifier = val;
  }
  else if (ev.effet === 'suspend-corrupt') {
    G.detectives.filter(d=>d.corrompu).forEach(d=>d.indisponible=1);
  }
}

function renderMorning() {
  const main = document.getElementById('main');
  let html = `<div class="phase-header t-heading">Aube — Jour ${G.day}</div>`;
  
  html += `<div class="card" style="margin-bottom:16px;">
    <div class="event-tag">${G.event.titre}</div>
    <div style="color:var(--text-secondary);font-size:0.85rem;margin-top:4px;">${G.event.desc}</div>
  </div>`;

  html += `<div class="t-label" style="margin-bottom:8px;">Nouvelles Affaires</div>`;
  html += `<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px;">`;
  G.crimes.forEach(c=>{
    html += `<div class="crime-card">
      <div class="crime-title">${c.titre}</div>
      <div class="crime-tag ${c.tag.toLowerCase()}">${c.tag}</div>
      <div class="crime-desc">${c.desc}</div>
      ${renderStatPipsForCrime(c)}
      <div class="crime-reward">
        <span class="t-label">Récompense</span>
        <span class="t-mono" style="color:var(--accent);">${c.recompense}€</span>
      </div>
      <div class="crime-time">
        <span class="t-label">Durée</span>
        <span class="t-mono">${c.temps} jour${c.temps>1?'s':''}</span>
      </div>
    </div>`;
  });
  html += `</div>`;

  html += `<div class="t-label" style="margin-bottom:8px;">Cartes Bonus Disponibles</div>`;
  html += `<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px;">`;
  G.bonusCards.forEach(b=>{
    html += `<div class="bonus-card">
      <div style="font-size:0.9rem;margin-bottom:4px;font-weight:500;">${b.titre}</div>
      <div style="font-size:0.8rem;color:var(--text-secondary);">${b.effet}</div>
      ${b.negatif ? `<div style="font-size:0.75rem;color:var(--danger);margin-top:6px;">${b.negatif}</div>` : ''}
    </div>`;
  });
  html += `</div>`;

  main.innerHTML = html;
  document.getElementById('btn-action').textContent = 'Passer à l\'Assignation';
  document.getElementById('btn-action').onclick = startAssignment;
  addLog(`📅 Jour ${G.day} — ${G.event.titre}`, 'system');
}

function startAssignment() {
  G.phase = 'assign';
  renderAssignment();
  updateUI();
}

function renderAssignment() {
  const main = document.getElementById('main');
  let html = `<div class="phase-header t-heading">Assignation — Jour ${G.day}</div>`;
  
  html += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;margin-bottom:20px;">`;
  G.crimes.forEach(c=>{
    const assigned = G.assignments[c.id];
    const isSelected = G.selectedCrime === c.id;
    html += `<div class="crime-card ${assigned?'assigned':''} ${isSelected?'selected':''}" onclick="selectCrime(${c.id})">
      <div class="crime-title">${c.titre}</div>
      <div class="crime-tag ${c.tag.toLowerCase()}">${c.tag}</div>
      <div class="crime-desc">${c.desc}</div>
      ${renderStatPipsForCrime(c)}
      ${assigned ? `<div class="assigned-badge">
        ${G.detectives.find(d=>d.id===assigned.detId).nom}
        ${assigned.bonusId ? `+ ${G.bonusCards.find(b=>b.id===assigned.bonusId).titre}` : ''}
      </div>` : ''}
    </div>`;
  });
  html += `</div>`;

  html += `<div class="t-label" style="margin-bottom:8px;">Détectives Disponibles</div>`;
  html += `<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px;">`;
  G.detectives.filter(d=>d.indisponible===0).forEach(d=>{
    const alreadyUsed = Object.values(G.assignments).some(a=>a.detId===d.id);
    const isSelected = G.selectedDet === d.id;
    html += `<div class="det-card ${alreadyUsed?'disabled':''} ${isSelected?'selected':''}" onclick="selectDetective(${d.id})">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px;">
        <span class="t-heading" style="font-size:0.95rem;">${d.nom}</span>
        <span class="t-label">${d.age} ans</span>
      </div>
      ${renderStatPips(d)}
      <div class="det-traits">${renderTraits(d.traits)}</div>
      ${alreadyUsed ? `<div class="t-label" style="margin-top:8px;color:var(--text-muted);">Déjà assigné</div>` : ''}
    </div>`;
  });
  html += `</div>`;

  html += `<div class="t-label" style="margin-bottom:8px;">Cartes Bonus</div>`;
  html += `<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px;">`;
  G.bonusCards.forEach(b=>{
    const alreadyUsed = Object.values(G.assignments).some(a=>a.bonusId===b.id);
    const isSelected = G.selectedBonus === b.id;
    html += `<div class="bonus-card ${alreadyUsed?'disabled':''} ${isSelected?'selected':''}" onclick="selectBonus(${b.id})">
      <div style="font-size:0.9rem;margin-bottom:4px;font-weight:500;">${b.titre}</div>
      <div style="font-size:0.8rem;color:var(--text-secondary);">${b.effet}</div>
      ${b.negatif ? `<div style="font-size:0.75rem;color:var(--danger);margin-top:6px;">${b.negatif}</div>` : ''}
      ${alreadyUsed ? `<div class="t-label" style="margin-top:8px;color:var(--text-muted);">Déjà utilisée</div>` : ''}
    </div>`;
  });
  html += `</div>`;

  if (G.selectedCrime && G.selectedDet) {
    html += `<button class="btn primary" onclick="assignCrime()">✓ Assigner ${G.detectives.find(d=>d.id===G.selectedDet).nom} à cette affaire</button>`;
  }

  main.innerHTML = html;
  document.getElementById('btn-action').textContent = 'Valider les Assignations';
  document.getElementById('btn-action').onclick = validateAssignments;
}

function selectCrime(id) {
  if (G.assignments[id]) return;
  G.selectedCrime = id;
  renderAssignment();
}

function selectDetective(id) {
  const alreadyUsed = Object.values(G.assignments).some(a=>a.detId===id);
  if (alreadyUsed) return;
  G.selectedDet = id;
  renderAssignment();
}

function selectBonus(id) {
  const alreadyUsed = Object.values(G.assignments).some(a=>a.bonusId===id);
  if (alreadyUsed) return;
  G.selectedBonus = id;
  renderAssignment();
}

function assignCrime() {
  if (!G.selectedCrime || !G.selectedDet) return;
  G.assignments[G.selectedCrime] = {
    detId: G.selectedDet,
    bonusId: G.selectedBonus
  };
  const det = G.detectives.find(d=>d.id===G.selectedDet);
  const crime = G.crimes.find(c=>c.id===G.selectedCrime);
  addLog(`${det.nom} assigné à ${crime.titre}${G.selectedBonus ? ' + bonus' : ''}`, 'system');
  G.selectedCrime = null;
  G.selectedDet = null;
  G.selectedBonus = null;
  renderAssignment();
}

function validateAssignments() {
  const assignedCount = Object.keys(G.assignments).length;
  if (assignedCount === 0) {
    addLog('Aucune affaire assignée. Passez directement au soir.', 'system');
    startEvening();
    return;
  }
  startResolution();
}

function startResolution() {
  G.phase = 'resolve';
  G.results = [];
  
  Object.keys(G.assignments).forEach(crimeId => {
    const crime = G.crimes.find(c=>c.id==crimeId);
    const assignment = G.assignments[crimeId];
    const det = G.detectives.find(d=>d.id===assignment.detId);
    const bonus = assignment.bonusId ? G.bonusCards.find(b=>b.id===assignment.bonusId) : null;
    
    const result = resolveCrime(crime, det, bonus);
    G.results.push(result);
    
    if (result.success) {
      G.money += result.reward;
      G.reputation = Math.min(100, G.reputation + result.repGain);
      G.totalResolved++;
      addLog(`✓ ${crime.titre} — ${det.nom} réussit. +${result.reward}€, +${result.repGain} rép.`, 'success');
    } else {
      G.money -= 50;
      G.reputation = Math.max(0, G.reputation - result.repLoss);
      addLog(`✗ ${crime.titre} — ${det.nom} échoue. -50€, -${result.repLoss} rép.`, 'failure');
    }
    
    if (result.injured) {
      det.indisponible = 2;
      addLog(`${det.nom} est blessé et indisponible 2 jours.`, 'failure');
    } else {
      det.indisponible = crime.temps;
    }
  });
  
  renderResolution();
  updateUI();
}

function resolveCrime(crime, det, bonus) {
  const typeMap = { action:'action', reflexion:'reflexion', danger:'danger' };
  const crimeType = crime.type;
  
  let baseChance = (det[crimeType] / (crime[crimeType] + 3)) * 100;
  baseChance = Math.max(15, Math.min(85, baseChance));
  
  let finalChance = baseChance;
  
  // Traits
  det.traits.forEach(t => {
    if (t.effet === crimeType && t.bonus) finalChance += t.bonus;
    if (t.effet === 'all' && t.bonus) finalChance += t.bonus;
  });
  
  // Reputation
  if (G.reputation > 70) finalChance += 5;
  if (G.reputation < 30) finalChance -= 5;
  
  // Event modifiers
  finalChance += G.globalModifier;
  if (crimeType === 'danger') finalChance -= G.dangerModifier * 5;
  
  // Bonus card
  if (bonus) {
    if (bonus.aleatoire) {
      const rnd = Math.random();
      if (rnd < 0.5) finalChance += 15;
      else finalChance -= 15;
    } else {
      if (bonus.type && bonus.type === crimeType) finalChance += bonus.bonus;
      else if (bonus.type && bonus.type === crime.tag.toLowerCase()) finalChance += bonus.bonus;
      else if (!bonus.type) finalChance += bonus.bonus || 0;
    }
  }
  
  finalChance = Math.max(5, Math.min(95, finalChance));
  
  const roll = Math.random() * 100;
  const success = roll <= finalChance;
  
  let reward = crime.recompense;
  if (success && det.corrompu) reward = Math.floor(reward * 0.8);
  
  let repGain = 8;
  let repLoss = 8;
  if (bonus && bonus.repMalus && !success) repLoss *= bonus.repMalus;
  if (bonus && bonus.protectRep && !success) repLoss = 0;
  
  let injured = false;
  if (!success && crimeType === 'danger' && Math.random() < 0.4) {
    if (!bonus || !bonus.protectDet) injured = true;
  }
  
  return {
    crime,
    det,
    bonus,
    success,
    reward: success ? reward : 0,
    repGain: success ? repGain : 0,
    repLoss: success ? 0 : repLoss,
    injured,
    finalChance
  };
}

function renderResolution() {
  const main = document.getElementById('main');
  let html = `<div class="phase-header t-heading">Résolution — Jour ${G.day}</div>`;
  
  html += `<div style="display:flex;flex-direction:column;gap:12px;margin-bottom:20px;">`;
  G.results.forEach(r => {
    html += `<div class="card">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;">
        <div class="t-heading" style="font-size:1rem;">${r.crime.titre}</div>
        <span class="crime-tag ${r.crime.tag.toLowerCase()}">${r.crime.tag}</span>
      </div>
      <div class="t-label" style="margin-bottom:4px;">${r.det.nom}${r.bonus ? ` + ${r.bonus.titre}` : ''}</div>
      <div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:12px;">${r.crime.histoire}</div>
      <div class="result-badge ${r.success?'success':'failure'}">
        ${r.success ? '✓ Succès' : '✗ Échec'} — ${Math.round(r.finalChance)}% de chances
      </div>
      <div style="font-style:italic;color:var(--text-muted);font-size:0.85rem;margin-top:8px;">
        ${r.success ? r.crime.fins.succes : r.crime.fins.echec}
      </div>
      ${r.injured ? `<div class="t-label" style="margin-top:8px;color:var(--danger);">⚠️ ${r.det.nom} est blessé</div>` : ''}
    </div>`;
  });
  html += `</div>`;
  
  main.innerHTML = html;
  document.getElementById('btn-action').textContent = 'Passer au Soir';
  document.getElementById('btn-action').onclick = startEvening;
}

function startEvening() {
  G.phase = 'evening';
  
  // Decrease availability
  G.detectives.forEach(d => {
    if (d.indisponible > 0) d.indisponible--;
  });
  
  // Salaries
  let salaryTotal = 0;
  G.detectives.forEach(d => {
    salaryTotal += d.salaire;
  });
  
  const rent = 100;
  const totalCosts = salaryTotal + rent;
  G.money -= totalCosts;
  
  addLog(`💰 Salaires: -${salaryTotal}€, Loyer: -${rent}€`, 'system');
  
  // Age every 5 days
  if (G.day % 5 === 0) {
    G.detectives.forEach(d => {
      d.age++;
      if (d.age >= 50 && Math.random() < 0.3) {
        d.action = Math.max(1, d.action - 1);
      }
    });
    addLog('⏳ Vos détectives vieillissent...', 'system');
  }
  
  renderEvening();
  updateUI();
  
  // Check game over
  const availableDets = G.detectives.filter(d=>d.indisponible===0).length;
  if (G.money <= 0 && availableDets === 0) {
    gameOver('Vos fonds sont épuisés et aucun enquêteur n\'est disponible.');
    return;
  }
  if (G.reputation <= 0) {
    gameOver('Votre réputation est tombée à zéro. L\'agence est discréditée.');
    return;
  }
  
  G.totalDays++;
}

function renderEvening() {
  const main = document.getElementById('main');
  let html = `<div class="phase-header t-heading">Soir — Jour ${G.day}</div>`;
  
  html += `<div class="card" style="margin-bottom:16px;">
    <div class="t-heading" style="font-size:1rem;margin-bottom:12px;">Bilan de la journée</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div>
        <div class="t-label">Argent</div>
        <div class="t-mono" style="font-size:1.2rem;color:${G.money>300?'var(--accent)':G.money>100?'var(--warn)':'var(--danger)'};">${G.money}€</div>
      </div>
      <div>
        <div class="t-label">Réputation</div>
        <div class="t-mono" style="font-size:1.2rem;">${G.reputation}/100</div>
      </div>
    </div>
  </div>`;
  
  html += `<div class="t-label" style="margin-bottom:8px;">État de l'équipe</div>`;
  html += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin-bottom:20px;">`;
  G.detectives.forEach(d => {
    html += `<div class="det-card ${d.indisponible>0?'disabled':''}">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px;">
        <span class="t-heading" style="font-size:0.95rem;">${d.nom}</span>
        <span class="t-label">${d.age} ans</span>
      </div>
      ${renderStatPips(d)}
      <div class="det-traits">${renderTraits(d.traits)}</div>
      ${d.indisponible > 0 ? `<div class="t-label" style="margin-top:8px;color:var(--danger);">Indisponible ${d.indisponible} jour${d.indisponible>1?'s':''}</div>` : ''}
    </div>`;
  });
  html += `</div>`;
  
  main.innerHTML = html;
  document.getElementById('btn-action').textContent = 'Jour Suivant';
  document.getElementById('btn-action').onclick = nextDay;
}

function nextDay() {
  G.day++;
  startMorning();
}

/* ══════════════════════════════════════════════
   RENDERING HELPERS
══════════════════════════════════════════════ */
function renderStatPips(det) {
  const stats = [
    {label:'Action', val:det.action, color:'#c8b896'},
    {label:'Réflexion', val:det.reflexion, color:'#7a9ab5'},
    {label:'Danger', val:det.danger, color:'#8b3a3a'}
  ];
  let html = '<div class="stat-pips">';
  stats.forEach(s => {
    html += `<div class="pip-row">
      <span class="pip-label">${s.label}</span>
      <div class="pips">`;
    for(let i=0; i<5; i++) {
      html += `<div class="pip ${i<s.val?'filled':''}" style="--pip-color:${s.color}"></div>`;
    }
    html += `</div></div>`;
  });
  html += '</div>';
  return html;
}

function renderStatPipsForCrime(crime) {
  const stats = [
    {label:'Action', val:crime.action, color:'#c8b896'},
    {label:'Réflexion', val:crime.reflexion, color:'#7a9ab5'},
    {label:'Danger', val:crime.danger, color:'#8b3a3a'}
  ];
  let html = '<div class="stat-pips">';
  stats.forEach(s => {
    html += `<div class="pip-row">
      <span class="pip-label">${s.label}</span>
      <div class="pips">`;
    for(let i=0; i<5; i++) {
      html += `<div class="pip ${i<s.val?'filled':''}" style="--pip-color:${s.color}"></div>`;
    }
    html += `</div></div>`;
  });
  html += '</div>';
  return html;
}

function renderTraits(traits) {
  return traits.map(t => {
    const typeClass = t.type === 'positive' ? 'positive' : 
                     t.type === 'negative' ? 'negative' : 
                     t.type === 'corrupt' ? 'corrupt' : 
                     t.type === 'sick' ? 'sick' : 'neutral';
    return `<span class="trait ${typeClass}" data-tooltip="${t.tooltip}">${t.nom}</span>`;
  }).join('');
}

/* ══════════════════════════════════════════════
   MODALS
══════════════════════════════════════════════ */
function openHireModal() {
  const content = document.getElementById('modal-content');
  const alreadyHiredIds = new Set(G.detectives.map(d=>d.id));
  
  let html = `<div class="modal-title t-title">Recruter un Détective</div>
    <div class="modal-label">Candidats Disponibles</div>`;
  
  HIRE_CANDIDATES.filter(c=>!alreadyHiredIds.has(c.id)).forEach(c => {
    const traitsHtml = c.traits.map(t => {
      const traitClass = t.type === 'positive' ? 'positive' : 
                        t.type === 'negative' ? 'negative' : 
                        t.type === 'corrupt' ? 'corrupt' : 
                        t.type === 'sick' ? 'sick' : 'neutral';
      return `<span class="trait ${traitClass}" data-tooltip="${t.tooltip}">${t.nom}</span>`;
    }).join('');
    
    html += `<div class="hire-option" onclick="hireDetective(${c.id})">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;">
        <span class="t-heading" style="font-size:1rem;">${c.nom}</span>
        <span class="t-mono" style="color:var(--accent);">${c.cout}€</span>
      </div>
      <div style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:8px;">${c.bio}</div>
      ${renderStatPips(c)}
      <div class="det-traits" style="margin-top:8px;">${traitsHtml}</div>
      <div class="salary-label t-label" style="margin-top:8px;">${c.salaire}€/jour</div>
    </div>`;
  });

  if (HIRE_CANDIDATES.filter(c=>!alreadyHiredIds.has(c.id)).length === 0) {
    html += `<p style="color:var(--text-muted);font-size:0.85rem;">Aucun candidat disponible pour le moment.</p>`;
  }

  html += `<div style="margin-top:20px;"><button class="btn small" onclick="closeModal()">Fermer</button></div>`;
  content.innerHTML = html;
  document.getElementById('overlay').classList.add('active');
}

function hireDetective(id) {
  const candidate = HIRE_CANDIDATES.find(c=>c.id===id);
  if (!candidate) return;
  if (G.money < candidate.cout) {
    addLog(`Fonds insuffisants pour recruter ${candidate.nom}.`, 'failure');
    closeModal();
    return;
  }
  G.money -= candidate.cout;
  G.detectives.push({...candidate, indisponible:0});
  addLog(`${candidate.nom} rejoint l'agence. -${candidate.cout}€`, 'success');
  closeModal();
  updateUI();
}

function openRulesModal() {
  const content = document.getElementById('modal-content');
  content.innerHTML = `
    <div class="modal-title t-title">Règles du jeu</div>
    <div class="modal-label">Détectives Inc. — Guide de l'agence</div>

    <div class="modal-result" style="margin-bottom:12px;">
      <div class="result-label" style="color:var(--accent);margin-bottom:8px;">Objectif</div>
      <div class="result-text" style="font-style:normal;color:var(--text-secondary);line-height:1.8;">
        Diriger l'agence Détectives Inc. le plus longtemps possible. Résolvez des affaires, gérez vos enquêteurs et maintenez votre réputation. Le jeu se termine si vos fonds tombent à zéro sans enquêteur disponible, ou si votre réputation atteint 0.
      </div>
    </div>

    <div class="modal-result" style="margin-bottom:12px;">
      <div class="result-label" style="color:var(--accent);margin-bottom:8px;">La journée en 4 phases</div>
      <div class="result-text" style="font-style:normal;color:var(--text-secondary);line-height:1.9;">
        <strong style="color:var(--text-primary);">1. Aube</strong> — 3 affaires aléatoires arrivent, accompagnées d'un événement du jour et de 2 cartes bonus.<br><br>
        <strong style="color:var(--text-primary);">2. Assignation</strong> — Cliquez sur une affaire, puis sur un enquêteur disponible, puis (optionnel) sur une carte bonus. Cliquez "Assigner" pour valider. Répétez pour chaque affaire.<br><br>
        <strong style="color:var(--text-primary);">3. Résolution</strong> — Le jeu calcule les résultats. Chaque affaire réussie rapporte de l'argent et de la réputation. Un échec coûte 50€ et -8 réputation.<br><br>
        <strong style="color:var(--text-primary);">4. Soir</strong> — Salaires et loyer prélevés automatiquement. Bilan de la journée.
      </div>
    </div>

    <div class="modal-result" style="margin-bottom:12px;">
      <div class="result-label" style="color:var(--accent);margin-bottom:8px;">Calcul du succès</div>
      <div class="result-text" style="font-style:normal;color:var(--text-secondary);line-height:1.8;">
        Chaque crime a un type dominant : <span style="color:#c8b896;">Action</span>, <span style="color:#7a9ab5;">Réflexion</span> ou <span style="color:#8b3a3a;">Danger</span>. La compétence de l'enquêteur dans ce domaine est comparée à la difficulté du crime. Les cartes bonus, événements et niveau de réputation modifient le pourcentage final. Le succès n'est jamais garanti — ni impossible.
      </div>
    </div>

    <div class="modal-result" style="margin-bottom:12px;">
      <div class="result-label" style="color:var(--accent);margin-bottom:8px;">Enquêteurs</div>
      <div class="result-text" style="font-style:normal;color:var(--text-secondary);line-height:1.8;">
        Un enquêteur <span style="color:var(--danger);">corrompu</span> prélève 20% des gains à votre insu. Un enquêteur <span style="color:var(--warn-bright);">malade</span> perd 1 point d'Action. Un enquêteur blessé sur une affaire dangereuse est <span style="color:var(--danger);">indisponible</span> 2 jours. Tous vieillissent tous les 5 jours — leur profil évolue avec l'âge.
      </div>
    </div>

    <div class="modal-result" style="margin-bottom:12px;">
      <div class="result-label" style="color:var(--accent);margin-bottom:8px;">Réputation & Finances</div>
      <div class="result-text" style="font-style:normal;color:var(--text-secondary);line-height:1.8;">
        La réputation influence les chances de succès (+5% au-dessus de 70, -5% en dessous de 30). Les salaires et le loyer (100€/jour) sont prélevés chaque soir. Recrutez de nouveaux enquêteurs via le bouton <strong style="color:var(--text-primary);">+ Recruter</strong> — une dépense d'investissement.
      </div>
    </div>

    <div class="modal-result" style="margin-bottom:20px;">
      <div class="result-label" style="color:var(--accent);margin-bottom:8px;">Cartes bonus</div>
      <div class="result-text" style="font-style:normal;color:var(--text-secondary);line-height:1.8;">
        Chaque jour, 2 cartes bonus sont disponibles. Elles peuvent être assignées à une affaire lors de la phase d'assignation. Certaines ont des effets cachés négatifs — lisez-les attentivement. Une carte ne peut être utilisée que sur une seule affaire par jour.
      </div>
    </div>

    <button class="btn small" onclick="closeModal()">Fermer</button>
  `;
  document.getElementById('overlay').classList.add('active');
}

function closeModal() {
  document.getElementById('overlay').classList.remove('active');
}

/* ══════════════════════════════════════════════
   UI
══════════════════════════════════════════════ */
function updateUI() {
  document.getElementById('ui-money').textContent = `${G.money}€`;
  document.getElementById('ui-money').className = `stat-val ${G.money>300?'good':G.money>100?'warn':'danger'}`;
  document.getElementById('ui-rep').textContent = G.reputation;
  document.getElementById('ui-rep').className = `stat-val ${G.reputation>60?'good':G.reputation>30?'':'danger'}`;
  document.getElementById('ui-rep-bar').style.width = G.reputation+'%';
  const avail = G.detectives.filter(d=>d.indisponible===0).length;
  const total = G.detectives.length;
  document.getElementById('ui-dets').textContent = `${avail} / ${total}`;
  document.getElementById('ui-day').textContent = `Jour ${G.day}`;
}

function addLog(msg, type='system') {
  const log = document.getElementById('log');
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = msg;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
  // Keep max 30 entries
  while(log.children.length > 30) log.removeChild(log.firstChild);
}

function gameOver(reason) {
  const go = document.getElementById('gameover');
  document.getElementById('go-reason').textContent = reason;
  document.getElementById('go-stats').innerHTML = `
    <div class="result-row"><span class="t-label">Jours tenus</span><span class="t-mono">${G.totalDays}</span></div>
    <div class="result-row"><span class="t-label">Affaires résolues</span><span class="t-mono">${G.totalResolved}</span></div>
    <div class="result-row"><span class="t-label">Réputation finale</span><span class="t-mono">${G.reputation}/100</span></div>
    <div class="result-row"><span class="t-label">Fonds restants</span><span class="t-mono">${G.money}€</span></div>
  `;
  go.classList.add('active');
}

/* Close overlay on background click */
document.getElementById('overlay').addEventListener('click', function(e){
  if(e.target === this) closeModal();
});
