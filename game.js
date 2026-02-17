/* ══════════════════════════════════════════════
   DATA LOADING
══════════════════════════════════════════════ */
let ALL_CRIMES = [];
let ALL_DETECTIVES = [];
let ALL_BONUS = [];
let EVENTS = [];
let HIRE_CANDIDATES = [];

async function loadGameData() {
  try {
    const [crimes, detectives, bonus, events, hire] = await Promise.all([
      fetch('data/crimes.json').then(r => r.json()),
      fetch('data/detectives.json').then(r => r.json()),
      fetch('data/bonus.json').then(r => r.json()),
      fetch('data/events.json').then(r => r.json()),
      fetch('data/hire.json').then(r => r.json())
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
    alert('Erreur de chargement du jeu. Vérifiez que tous les fichiers JSON sont présents dans le dossier data/');
    return false;
  }
}

/* ══════════════════════════════════════════════
   START SCREEN
══════════════════════════════════════════════ */
async function startGame() {
  const loaded = await loadGameData();
  if (loaded) {
    document.getElementById('start-screen').classList.add('hidden');
    initGame();
  }
}

/* ══════════════════════════════════════════════
   GAME STATE
══════════════════════════════════════════════ */
let G = {};

function initGame() {
  document.getElementById('gameover').classList.remove('active');
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
  { id:4, nom:"Margot Sérane", age:26, action:5, reflexion:2, danger:2, salaire:90, corrompu:false, malade:false, traits:[
    {nom:"Impétueuse", effet:"action", bonus:5, tooltip:"+5% sur crimes d'Action", type:"positive"},
    {nom:"Rapide", effet:"speed", tooltip:"Narratif - agit vite", type:"neutral"}
  ], bio:"Ancienne championne d'athlétisme. S'ennuie vite, agit d'abord." },
  { id:5, nom:"Théodore Vane", age:44, action:1, reflexion:4, danger:4, salaire:120, corrompu:false, malade:false, traits:[
    {nom:"Téméraire", effet:"danger", bonus:5, tooltip:"+5% sur crimes Dangereux", type:"positive"},
    {nom:"Intuitif", effet:"intuition", tooltip:"Narratif - flair naturel", type:"neutral"}
  ], bio:"Passé trouble dans les milieux souterrains. Connaît tout le monde, rien ne l'effraie." },
  { id:6, nom:"Irma Duval", age:38, action:3, reflexion:4, danger:2, salaire:115, corrompu:false, malade:false, traits:[
    {nom:"Méthodique", effet:"reflexion", bonus:5, tooltip:"+5% sur crimes de Réflexion", type:"positive"},
    {nom:"Discrète", effet:"discretion", tooltip:"Narratif - passe inaperçue", type:"neutral"}
  ], bio:"Ancienne journaliste d'investigation. Pose les bonnes questions." },
  { id:7, nom:"Lucien Faux", age:31, action:4, reflexion:2, danger:3, salaire:95, corrompu:true, malade:false, traits:[
    {nom:"Efficace", effet:"action", bonus:5, tooltip:"+5% sur crimes d'Action", type:"positive"},
    {nom:"Corrompu", effet:"corrupt", tooltip:"Prélève 20% des gains", type:"corrupt"}
  ], bio:"Les résultats sont là. Mais il garde toujours quelque chose pour lui." },
  { id:8, nom:"Octave Brun", age:61, action:1, reflexion:5, danger:1, salaire:105, corrompu:false, malade:true, traits:[
    {nom:"Brillant", effet:"reflexion", bonus:5, tooltip:"+5% sur crimes de Réflexion", type:"positive"},
    {nom:"Fragile", effet:"injury_risk", tooltip:"Plus de risques de blessure", type:"negative"},
    {nom:"Malade", effet:"sick", tooltip:"-1 Action permanent", type:"sick"}
  ], bio:"Le meilleur analyste de la ville. Sa santé ne tient qu'à un fil." },
];

const ALL_BONUS = [
  { id:1, titre:"Dossier Complet", effet:"+25% de chance de succès", bonus:25, negatif:null },
  { id:2, titre:"Contact Police", effet:"Réduit le danger de 1 point", bonus:0, dangerMod:-1, negatif:null },
  { id:3, titre:"Témoin Inattendu", effet:"Effet aléatoire — peut aider ou nuire", bonus:0, aleatoire:true, negatif:"Peut réduire les chances de succès de 15%" },
  { id:4, titre:"Indic de Confiance", effet:"+20% succès sur crimes de réflexion", bonus:20, type:"reflexion", negatif:null },
  { id:5, titre:"Couverture Officielle", effet:"Annule les pertes de réputation en cas d'échec", bonus:0, protectRep:true, negatif:null },
  { id:6, titre:"Pression Médiatique", effet:"+30% succès, mais double la perte de réputation si échec", bonus:30, repMalus:2, negatif:"Double la perte de réputation en cas d'échec" },
  { id:7, titre:"Archive Occulte", effet:"+35% sur crimes fantastiques", bonus:35, type:"fantastique", negatif:null },
  { id:8, titre:"Filet de Sécurité", effet:"L'enquêteur ne peut pas être blessé", bonus:0, protectDet:true, negatif:null },
];

const EVENTS = [
  { id:1, titre:"Grève des policiers", desc:"Les forces de l'ordre sont inopérantes. Les crimes de type Danger sont plus risqués aujourd'hui.", effet:"danger+1" },
  { id:2, titre:"Presse favorable", desc:"Un article vous présente sous un jour flatteur. Bonus de réputation.", effet:"rep+5" },
  { id:3, titre:"Pluie torrentielle", desc:"Les déplacements sont difficiles. Taux de succès réduit de 10% pour tous.", effet:"global-10" },
  { id:4, titre:"Client mystérieux", desc:"Un inconnu laisse une enveloppe contenant 200€ et aucune explication.", effet:"money+200" },
  { id:5, titre:"Inspection des Mœurs", desc:"Des agents scrutent vos activités. Un enquêteur corrompu est suspendu ce jour.", effet:"suspend-corrupt" },
  { id:6, titre:"Nuit de brouillard", desc:"La ville est paralysée. Un crime supplémentaire aléatoire s'ajoute au plateau.", effet:"extra-crime" },
  { id:7, titre:"Rumeurs de couloirs", desc:"On parle de votre agence en mauvais termes. -5 réputation.", effet:"rep-5" },
  { id:8, titre:"Calme plat", desc:"Rien de particulier aujourd'hui. Journée normale.", effet:"none" },
];

const HIRE_CANDIDATES = [
  { id:10, nom:"Bastien Crue", age:24, action:3, reflexion:2, danger:3, salaire:80, corrompu:false, malade:false, traits:[
    {nom:"Novice", effet:"novice", tooltip:"Narratif - débutant", type:"neutral"},
    {nom:"Courageux", effet:"danger", bonus:3, tooltip:"+3% sur crimes Dangereux", type:"positive"}
  ], bio:"Tout juste sorti de l'académie. Motivé, inexpérimenté.", cout:150 },
  { id:11, nom:"Simone Ader", age:41, action:2, reflexion:5, danger:2, salaire:125, corrompu:false, malade:false, traits:[
    {nom:"Experte", effet:"reflexion", bonus:5, tooltip:"+5% sur crimes de Réflexion", type:"positive"},
    {nom:"Chère", effet:"expensive", tooltip:"Salaire élevé", type:"neutral"}
  ], bio:"Spécialiste des affaires complexes. Prix en conséquence.", cout:300 },
  { id:12, nom:"Jules Marchand", age:34, action:4, reflexion:3, danger:1, salaire:100, corrompu:false, malade:false, traits:[
    {nom:"Action", effet:"action", bonus:5, tooltip:"+5% sur crimes d'Action", type:"positive"},
    {nom:"Équilibré", effet:"all", bonus:2, tooltip:"+2% sur tous les crimes", type:"positive"}
  ], bio:"Ancien boxeur reconverti. Préfère les résultats directs.", cout:200 },
  { id:13, nom:"Nora Stein", age:38, action:2, reflexion:4, danger:4, salaire:115, corrompu:false, malade:false, traits:[
    {nom:"Téméraire", effet:"danger", bonus:5, tooltip:"+5% sur crimes Dangereux", type:"positive"},
    {nom:"Analytique", effet:"reflexion", bonus:3, tooltip:"+3% sur crimes de Réflexion", type:"positive"}
  ], bio:"Passée par plusieurs agences. Sait gérer le risque.", cout:250 },
];

/* ══════════════════════════════════════════════
   ÉTAT
══════════════════════════════════════════════ */
let G = {};

function initGame() {
  document.getElementById('gameover').classList.remove('active');
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
    assignments: {},   // crimeId -> { detId, bonusId }
    phase: 'morning',  // morning | assign | resolve | evening
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
  G.bonusCards = bpool.slice(0,2).map(b => ({...b, used:false}));

  // Age detectives every 5 days
  if (G.day % 5 === 0) {
    G.detectives.forEach(d => {
      d.age++;
      if (d.age > 55) d.action = Math.max(1, d.action-1);
      if (d.age > 50) d.reflexion = Math.min(5, d.reflexion+1);
    });
  }

  // Check available detectives
  G.detectives.forEach(d => {
    if (d.indisponible > 0) d.indisponible--;
  });

  updateUI();
  renderMorning();
}

function applyEventStart(ev) {
  switch(ev.effet) {
    case 'rep+5': G.reputation = Math.min(100, G.reputation+5); addLog(`${ev.titre} — +5 réputation.`, 'event'); break;
    case 'rep-5': G.reputation = Math.max(0, G.reputation-5); addLog(`${ev.titre} — -5 réputation.`, 'event'); break;
    case 'money+200': G.money += 200; addLog(`${ev.titre} — +200€ trouvés.`, 'event'); break;
    case 'global-10': G.globalModifier = -10; addLog(`${ev.titre} — -10% succès aujourd'hui.`, 'event'); break;
    case 'danger+1': G.dangerModifier = 1; addLog(`${ev.titre} — Danger accru.`, 'event'); break;
    case 'suspend-corrupt':
      G.detectives.forEach(d => { if(d.corrompu && d.indisponible===0) { d.indisponible=1; addLog(`${d.nom} suspendu(e) par l'Inspection.`,'event'); } });
      break;
    default: addLog(`${ev.titre}.`, 'event');
  }
}

function startAssign() {
  G.phase = 'assign';
  updateUI();
  renderAssign();
}

function resolveAll() {
  G.phase = 'resolve';
  G.results = [];

  // Resolve assigned crimes
  G.crimes.forEach(crime => {
    const asgn = G.assignments[crime.id];
    if (!asgn) {
      G.results.push({ crime, outcome:'ignored', money:0, repDelta:-3, story:null });
      G.reputation = Math.max(0, G.reputation - 3);
      return;
    }
    const det = G.detectives.find(d => d.id === asgn.detId);
    const bonus = asgn.bonusId ? G.bonusCards.find(b => b.id === asgn.bonusId) : null;

    // Compute success chance
    let chance = computeChance(crime, det, bonus);
    const roll = Math.random() * 100;
    const success = roll < chance;

    let money = 0;
    let repDelta = 0;

    if (success) {
      money = crime.recompense;
      // Corrupt detective skims
      if (det.corrompu) {
        const skim = Math.floor(money * 0.2);
        money -= skim;
        addLog(`${det.nom} a prélevé ${skim}€ au passage.`, 'failure');
      }
      repDelta = 5;
      G.money += money;
      G.reputation = Math.min(100, G.reputation + repDelta);
      G.totalResolved++;
      addLog(`${crime.titre} — Résolu par ${det.nom}. +${money}€`, 'success');
    } else {
      money = -50;
      repDelta = bonus && bonus.protectRep ? 0 : -8;
      
      // Check for "Expérimenté" trait (rep_protect)
      const hasRepProtect = det.traits && det.traits.some(t => t.effet === 'rep_protect');
      if (hasRepProtect && repDelta < 0) {
        repDelta = Math.floor(repDelta / 2);
        addLog(`${det.nom} limite les dégâts de réputation grâce à son expérience.`, 'system');
      }
      
      if (G.reputation < 30) repDelta = Math.max(repDelta, -4); // bad rep attire moins d'attention
      G.money = Math.max(0, G.money + money);
      G.reputation = Math.max(0, G.reputation + repDelta);
      
      // Random: detective hurt on high danger
      let injuryChance = 0.3;
      const hasInjuryRisk = det.traits && det.traits.some(t => t.effet === 'injury_risk');
      if (hasInjuryRisk) injuryChance = 0.5; // Fragile detectives get hurt more easily
      
      if (crime.danger >= 4 && Math.random() < injuryChance && !(bonus && bonus.protectDet)) {
        det.indisponible = 2;
        addLog(`${det.nom} blessé(e) — indisponible 2 jours.`, 'failure');
      }
      addLog(`${crime.titre} — Échec. ${money}€ de pénalité.`, 'failure');
    }

    G.results.push({ crime, det, bonus, outcome: success?'success':'failure', money, repDelta, story: success ? crime.fins.succes : crime.fins.echec });
  });

  G.totalDays++;
  updateUI();
  renderResults();
}

function computeChance(crime, det, bonus) {
  // Base: weighted competence vs difficulty
  const mainStat = crime.type === 'action' ? det.action : crime.type === 'reflexion' ? det.reflexion : det.danger;
  const difficulty = crime.type === 'action' ? crime.action : crime.type === 'reflexion' ? crime.reflexion : crime.danger;
  let chance = 30 + (mainStat / difficulty) * 50;

  // Apply detective trait bonuses
  if (det.traits && Array.isArray(det.traits)) {
    det.traits.forEach(trait => {
      if (trait.bonus) {
        // Type-specific bonuses
        if (trait.effet === 'action' && crime.type === 'action') chance += trait.bonus;
        else if (trait.effet === 'reflexion' && crime.type === 'reflexion') chance += trait.bonus;
        else if (trait.effet === 'danger' && crime.type === 'danger') chance += trait.bonus;
        else if (trait.effet === 'all') chance += trait.bonus;
      }
      if (trait.malus) {
        // Type-specific maluses
        if (trait.effet === 'danger_malus' && crime.type === 'danger') chance -= trait.malus;
      }
    });
  }

  // Bonus card
  if (bonus) {
    if (bonus.aleatoire) { chance += (Math.random() > 0.5 ? 20 : -15); }
    else if (bonus.type && bonus.type === crime.tag.toLowerCase()) { chance += bonus.bonus; }
    else if (!bonus.type) { chance += bonus.bonus || 0; }
    if (bonus.dangerMod) { chance += bonus.dangerMod * 8; }
  }

  // Global modifier
  chance += G.globalModifier;

  // Danger modifier from event
  if (crime.type === 'danger') chance -= G.dangerModifier * 10;

  // Reputation influence
  if (G.reputation > 70) chance += 5;
  if (G.reputation < 30) chance -= 5;

  return Math.min(95, Math.max(10, chance));
}

function startEvening() {
  G.phase = 'evening';

  // Pay salaries
  let totalSalary = 0;
  G.detectives.forEach(d => { totalSalary += d.salaire; });
  const rent = 100;
  const expenses = totalSalary + rent;
  G.money = Math.max(0, G.money - expenses);
  addLog(`Frais du jour — salaires ${totalSalary}€ + loyer ${rent}€ = -${expenses}€.`, 'system');

  // Sick detective random
  G.detectives.forEach(d => {
    if (!d.malade && Math.random() < 0.05) {
      d.malade = true;
      d.action = Math.max(1, d.action - 1);
      addLog(`${d.nom} tombe malade. -1 Action.`, 'failure');
    }
  });

  // Check game over
  if (G.money <= 0 && G.detectives.filter(d=>d.indisponible===0).length === 0) {
    gameOver("L'agence n'a plus de fonds ni de détectives disponibles.");
    return;
  }
  if (G.reputation <= 0) {
    gameOver("Votre réputation est anéantie. Plus personne ne vous fait confiance.");
    return;
  }

  G.day++;
  updateUI();
  renderEvening(totalSalary, rent);
}

/* ══════════════════════════════════════════════
   RENDER
══════════════════════════════════════════════ */
function renderMorning() {
  const main = document.getElementById('main');
  let html = `<div class="phase-header"><div class="phase-title t-title">Jour ${G.day} — Aube</div><div class="phase-sub">Nouvelles affaires reçues. Préparez vos enquêteurs.</div></div>`;

  // Event
  if (G.event && G.event.effet !== 'none') {
    html += `<div class="event-banner"><div class="event-title">${G.event.titre}</div><div class="event-desc">${G.event.desc}</div></div>`;
  }

  // Crimes
  html += `<div class="section-label">Affaires du jour</div>`;
  html += `<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:24px;">`;
  G.crimes.forEach(c => {
    html += renderCrimeCard(c, false);
  });
  html += `</div>`;

  // Bonus cards
  html += `<div class="section-label">Cartes bonus disponibles</div>`;
  html += `<div class="grid-2" style="margin-bottom:24px;">`;
  G.bonusCards.forEach(b => {
    html += `<div class="bonus-card"><div class="bonus-title t-heading">${b.titre}</div><div class="bonus-effect">${b.effet}</div>${b.negatif?`<div class="bonus-neg">${b.negatif}</div>`:''}</div>`;
  });
  html += `</div>`;

  main.innerHTML = html;
  document.getElementById('btn-action').textContent = 'Assigner les enquêteurs →';
  document.getElementById('btn-action').onclick = startAssign;
}

function renderAssign() {
  const main = document.getElementById('main');
  let html = `<div class="phase-header"><div class="phase-title t-title">Assignation</div><div class="phase-sub">Sélectionnez un crime, puis un enquêteur, puis une carte bonus optionnelle.</div></div>`;

  // Crimes
  html += `<div class="section-label">Affaires — cliquez pour sélectionner</div>`;
  html += `<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:24px;">`;
  G.crimes.forEach(c => {
    const asgn = G.assignments[c.id];
    const det = asgn ? G.detectives.find(d=>d.id===asgn.detId) : null;
    let cls = '';
    if (G.selectedCrime && G.selectedCrime.id === c.id) cls = 'selected';
    else if (asgn) cls = 'assigned';
    html += renderCrimeCard(c, true, cls, det);
  });
  html += `</div>`;

  // Detectives
  html += `<div class="section-label">Enquêteurs disponibles</div>`;
  html += `<div class="grid-2" style="margin-bottom:20px;">`;
  const availDetIds = new Set(Object.values(G.assignments).map(a=>a.detId));
  G.detectives.forEach((d,i) => {
    const unavail = d.indisponible > 0 || availDetIds.has(d.id);
    let cls = unavail ? 'unavailable' : '';
    if (G.selectedDet && G.selectedDet.id === d.id) cls = 'selected';
    if (d.corrompu) cls += ' corrupt';
    
    // Render traits with tooltips
    const traitsHtml = d.traits.map(t => {
      const traitClass = t.type === 'corrupt' ? 'corrupt' : t.type === 'sick' ? 'sick' : t.type === 'positive' ? 'positive' : '';
      return `<span class="trait ${traitClass}" data-tooltip="${t.tooltip}">${t.nom}</span>`;
    }).join('');
    
    html += `<div class="detective-card ${cls}" style="animation-delay:${i*50}ms" onclick="selectDet(${d.id})">
      <div class="det-header"><span class="det-name t-heading">${d.nom}</span><span class="det-age">${d.age} ans</span></div>
      ${renderStatPips(d)}
      <div class="det-traits">${traitsHtml}</div>
      <div class="salary-label t-label" style="margin-top:8px;">${d.salaire}€/jour</div>
      ${unavail && d.indisponible>0?`<div class="det-status unavail">Indisponible — ${d.indisponible}j</div>`:''}
    </div>`;
  });
  html += `</div>`;

  // Bonus
  html += `<div class="section-label">Carte bonus — optionnel</div>`;
  html += `<div class="grid-2" style="margin-bottom:20px;">`;
  G.bonusCards.forEach(b => {
    const usedInAsgn = Object.values(G.assignments).find(a=>a.bonusId===b.id);
    let cls = b.used || usedInAsgn ? 'used' : '';
    if (G.selectedBonus && G.selectedBonus.id === b.id) cls = 'selected';
    html += `<div class="bonus-card ${cls}" onclick="selectBonus(${b.id})"><div class="bonus-title t-heading">${b.titre}</div><div class="bonus-effect">${b.effet}</div>${b.negatif?`<div class="bonus-neg">${b.negatif}</div>`:''}</div>`;
  });
  html += `</div>`;

  // Assign button - MORE VISIBLE
  if (G.selectedCrime && G.selectedDet) {
    html += `<div style="margin-bottom:20px;text-align:center;"><button class="btn assign-cta" onclick="assignSelected()">→ Assigner ${G.selectedDet.nom} à "${G.selectedCrime.titre}" ←</button></div>`;
  }

  main.innerHTML = html;

  const canResolve = Object.keys(G.assignments).length > 0;
  document.getElementById('btn-action').textContent = canResolve ? 'Lancer les enquêtes →' : 'Passer (ignorer tout)';
  document.getElementById('btn-action').onclick = resolveAll;
}

function renderCrimeCard(c, clickable, extraCls='', assignedDet=null) {
  const onclick = clickable && !assignedDet ? `onclick="selectCrime(${c.id})"` : '';
  const isFantastique = c.tag === 'Fantastique';
  return `<div class="crime-card ${extraCls}" ${onclick} style="animation-delay:${c.id*40}ms">
    <span class="crime-tag ${isFantastique?'fantastique':''}">${c.tag}</span>
    <div class="crime-header">
      <span class="crime-title t-heading">${c.titre}</span>
      <span class="crime-reward">${c.recompense}€</span>
    </div>
    <div class="crime-desc">${c.desc}</div>
    <div class="crime-stats">
      <div class="stat-pip"><span class="pip-label">Action</span><div class="pips">${renderPips(c.action,'action')}</div></div>
      <div class="stat-pip"><span class="pip-label">Réflexion</span><div class="pips">${renderPips(c.reflexion,'reflexion')}</div></div>
      <div class="stat-pip"><span class="pip-label">Danger</span><div class="pips">${renderPips(c.danger,'danger')}</div></div>
    </div>
    ${assignedDet?`<div class="assigned-label">↳ ${assignedDet.nom}</div>`:''}
  </div>`;
}

function renderPips(val, type) {
  let html='';
  for(let i=1;i<=5;i++) html+=`<div class="pip ${i<=val?'on':''} ${type}"></div>`;
  return html;
}

function renderStatPips(d) {
  return `<div class="crime-stats" style="margin-top:6px;">
    <div class="stat-pip"><span class="pip-label">Act</span><div class="pips">${renderPips(d.action,'action')}</div></div>
    <div class="stat-pip"><span class="pip-label">Réf</span><div class="pips">${renderPips(d.reflexion,'reflexion')}</div></div>
    <div class="stat-pip"><span class="pip-label">Dng</span><div class="pips">${renderPips(d.danger,'danger')}</div></div>
  </div>`;
}

function renderResults() {
  const main = document.getElementById('main');
  let html = `<div class="phase-header"><div class="phase-title t-title">Résultats</div><div class="phase-sub">Bilan de la journée d'enquête.</div></div>`;

  html += `<div style="display:flex;flex-direction:column;gap:1px;margin-bottom:24px;">`;
  G.results.forEach(r => {
    const cls = r.outcome==='success'?'s':r.outcome==='ignored'?'i':'f';
    const moneyStr = r.money >= 0 ? `+${r.money}€` : `${r.money}€`;
    const moneyCls = r.money >= 0 ? 'pos' : 'neg';
    html += `<div class="result-row">
      <span class="result-crime t-heading">${r.crime.titre}</span>
      <span class="result-outcome ${cls}">${r.outcome==='success'?'Résolu':r.outcome==='ignored'?'Ignoré':'Échec'}</span>
      <span class="result-money ${moneyCls}">${moneyStr}</span>
    </div>`;
  });
  html += `</div>`;

  // Stories
  html += `<div class="section-label">Récits</div>`;
  G.results.filter(r=>r.story).forEach(r => {
    html += `<div class="modal-result ${r.outcome}" style="margin-bottom:8px;">
      <div class="result-label ${r.outcome}">${r.crime.titre} — ${r.outcome==='success'?'Résolu':'Échec'}</div>
      <div class="result-text">${r.story}</div>
    </div>`;
  });

  main.innerHTML = html;
  document.getElementById('btn-action').textContent = 'Fin de journée →';
  document.getElementById('btn-action').onclick = startEvening;
}

function renderEvening(salaries, rent) {
  const main = document.getElementById('main');
  let html = `<div class="phase-header"><div class="phase-title t-title">Fin de Journée</div><div class="phase-sub">Bilan financier et état de l'agence.</div></div>`;

  html += `<div class="card" style="margin-bottom:12px;">
    <div class="section-label">Finances</div>
    <div class="result-row"><span>Salaires versés</span><span class="result-money neg">-${salaries}€</span></div>
    <div class="result-row"><span>Loyer</span><span class="result-money neg">-${rent}€</span></div>
    <div class="result-row"><span>Solde restant</span><span class="result-money ${G.money>200?'pos':G.money>0?'':''}">${G.money}€</span></div>
  </div>`;

  html += `<div class="card" style="margin-bottom:12px;">
    <div class="section-label">État des enquêteurs</div>`;
  G.detectives.forEach(d => {
    html += `<div class="result-row">
      <span class="t-heading" style="font-size:0.95rem;">${d.nom}</span>
      <span class="t-mono" style="color:var(--text-muted);">${d.age} ans</span>
      <span class="t-label">${d.indisponible>0?`Indisponible ${d.indisponible}j`:d.malade?'Malade':'Disponible'}</span>
    </div>`;
  });
  html += `</div>`;

  main.innerHTML = html;
  document.getElementById('btn-action').textContent = `Jour ${G.day} →`;
  document.getElementById('btn-action').onclick = startMorning;
}

/* ══════════════════════════════════════════════
   INTERACTIONS
══════════════════════════════════════════════ */
function selectCrime(id) {
  if (G.phase !== 'assign') return;
  const crime = G.crimes.find(c=>c.id===id);
  if (G.assignments[id]) return;
  G.selectedCrime = (G.selectedCrime && G.selectedCrime.id===id) ? null : crime;
  tryAutoAssign();
  renderAssign();
}

function selectDet(id) {
  if (G.phase !== 'assign') return;
  const det = G.detectives.find(d=>d.id===id);
  if (det.indisponible > 0) return;
  const usedDetIds = new Set(Object.values(G.assignments).map(a=>a.detId));
  if (usedDetIds.has(id)) return;
  G.selectedDet = (G.selectedDet && G.selectedDet.id===id) ? null : det;
  tryAutoAssign();
  renderAssign();
}

function selectBonus(id) {
  if (G.phase !== 'assign') return;
  const bonus = G.bonusCards.find(b=>b.id===id);
  const usedInAsgn = Object.values(G.assignments).find(a=>a.bonusId===id);
  if (usedInAsgn) return;
  G.selectedBonus = (G.selectedBonus && G.selectedBonus.id===id) ? null : bonus;
  renderAssign();
}

function tryAutoAssign() {
  if (G.selectedCrime && G.selectedDet) {
    // highlight only, don't auto-assign
  }
}

function assignSelected() {
  if (!G.selectedCrime || !G.selectedDet) return;
  G.assignments[G.selectedCrime.id] = {
    detId: G.selectedDet.id,
    bonusId: G.selectedBonus ? G.selectedBonus.id : null,
  };
  addLog(`${G.selectedDet.nom} assigné(e) à "${G.selectedCrime.titre}".`, 'system');
  G.selectedCrime = null;
  G.selectedDet = null;
  G.selectedBonus = null;
  renderAssign();
}

/* ══════════════════════════════════════════════
   HIRE
══════════════════════════════════════════════ */
function openHireModal() {
  const content = document.getElementById('modal-content');
  let html = `<div class="modal-title t-title">Recruter</div><div class="modal-label">Candidats disponibles</div>`;
  const alreadyHiredIds = new Set(G.detectives.map(d=>d.id));

  HIRE_CANDIDATES.filter(c=>!alreadyHiredIds.has(c.id)).forEach(c => {
    const traitsHtml = c.traits.map(t => {
      const traitClass = t.type === 'corrupt' ? 'corrupt' : t.type === 'sick' ? 'sick' : t.type === 'positive' ? 'positive' : '';
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
  document.getElementById('ui-rep').className = `stat-val ${G.reputation>60?'good':G.reputation>30?'':' danger'}`;
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
