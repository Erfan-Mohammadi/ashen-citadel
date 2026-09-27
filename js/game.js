// Ashen Citadel v0.8 — Mobile + Missions + Balance
const Game = {
  resources: { wood: 150, stone: 100, food: 180, coal: 70, iron: 25, crystal: 10 },
  heat: 100, heatMax: 100, heatProduction: 2.4, heatConsumption: 1.0,
  buildings: {
    citadel:  { level: 1, name: "دژ مرکزی", desc: "قلب دژ و منبع اصلی گرما", baseCost: { wood: 45, stone: 25, coal: 15 } },
    woodcamp: { level: 1, name: "اردوگاه چوب", desc: "تولید چوب", baseCost: { wood: 25, stone: 12 } },
    farm:     { level: 1, name: "مزرعه", desc: "تولید غذا", baseCost: { wood: 20, stone: 8 } },
    coalpit:  { level: 0, name: "کوره زغال", desc: "تولید زغال برای گرما", baseCost: { wood: 35, stone: 20 } },
    barracks: { level: 0, name: "اردوگاه نیرو", desc: "تربیت سرباز", baseCost: { wood: 50, stone: 35, iron: 8 } }
  },
  production: { wood: 3.5, stone: 1.8, food: 4.5, coal: 1.0, iron: 0.4 },
  heroes: [
    { id: "kaveh", name: "کاوه آهنین", role: "Vanguard", roleFa: "محافظ", level: 1, stars: 1, hp: 420, atk: 35, def: 55, skill: "سپر فولادی", owned: true },
    { id: "arash", name: "آرش آتشین", role: "Destroyer", roleFa: "نابودگر", level: 1, stars: 1, hp: 280, atk: 78, def: 22, skill: "تیر آتشین", owned: true },
    { id: "anahita", name: "آناهیتا", role: "Support", roleFa: "پشتیبان", level: 1, stars: 1, hp: 310, atk: 28, def: 30, skill: "چشمه حیات", owned: false },
    { id: "rostam", name: "رستم سایه", role: "Destroyer", roleFa: "نابودگر", level: 1, stars: 2, hp: 300, atk: 95, def: 28, skill: "ضربه سایه‌ای", owned: false }
  ],
  selectedBuilding: null, inDefense: false, gameStarted: false,
  defenseWave: 1, defenseEnemies: [], defenseHeroes: [], defenseRunning: false,
  _loadedFromSave: false, tutorialStep: 0, tutorialDone: false,
  missions: [], missionDay: null,
  canvas: null, ctx: null, defenseCanvas: null, defenseCtx: null,
  tutorialSteps: [
    { text: "جهان یخ زده است. نوار نارنجی بالای صفحه گرمای دژ را نشان می‌دهد — همیشه آن را بالا نگه دار." },
    { text: "روی ساختمان‌ها کلیک کن و ارتقا بده. با ارتقا، تولید و گرما بیشتر می‌شود." },
    { text: "دکمه قهرمان را بزن. می‌توانی قهرمان باز کنی و سطح یا ستاره بالا ببری." },
    { text: "دکمه دفاع را بزن. قهرمانان با دشمنان می‌جنگند. پیروزی منابع می‌دهد." },
    { text: "دکمه مأموریت را بزن تا پاداش روزانه بگیری. بازی خودکار ذخیره می‌شود. شروع کن!" }
  ],

  init() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.defenseCanvas = document.getElementById('defense-canvas');
    this.defenseCtx = this.defenseCanvas.getContext('2d');
    this.bindEvents();
    if (this.loadGame()) {
      document.getElementById('btn-start-game').textContent = 'ادامه بازی';
      document.querySelector('.start-content p').textContent = 'پیشرفت قبلی شما ذخیره شده است.';
    }
    this.initMissions();
    this.updateUI(); this.drawBase(); this.renderHeroList();
    setInterval(() => this.tick(), 1000);
    setInterval(() => { if (this.gameStarted) this.saveGame(true); }, 15000);
  },
  bindEvents() {
    document.getElementById('btn-start-game').addEventListener('click', () => this.startGame());
    document.getElementById('btn-close-panel').addEventListener('click', () => this.closePanel());
    document.getElementById('btn-upgrade').addEventListener('click', () => this.upgradeBuilding());
    document.getElementById('btn-defend').addEventListener('click', () => this.openDefense());
    document.getElementById('btn-exit-defense').addEventListener('click', () => this.closeDefense());
    document.getElementById('btn-start-defense').addEventListener('click', () => this.startDefenseWave());
    document.getElementById('btn-heroes').addEventListener('click', () => this.toggleHeroPanel());
    document.getElementById('btn-close-heroes').addEventListener('click', () => this.toggleHeroPanel(false));
    document.getElementById('btn-tutorial-next').addEventListener('click', () => this.tutorialNext());
    document.getElementById('btn-tutorial-skip').addEventListener('click', () => this.tutorialSkip());
    document.getElementById('btn-map').addEventListener('click', () => this.toggleMissionPanel());
    document.getElementById('btn-close-missions').addEventListener('click', () => this.toggleMissionPanel(false));
    this.canvas.addEventListener('click', (e) => this.onCanvasClick(e));
  },
  startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    this.gameStarted = true;
    if (this._loadedFromSave) this.notify('خوش برگشتی، فرمانده!');
    else {
      this.notify('به دژ خاکستر خوش آمدی، فرمانده!');
      setTimeout(() => { if (!this.tutorialDone) this.startTutorial(); }, 800);
    }
    this.saveGame(true);
  },
  startTutorial() { this.tutorialStep = 0; this.showTutorialStep(); },
  showTutorialStep() {
    if (this.tutorialStep >= this.tutorialSteps.length) { this.tutorialFinish(); return; }
    document.getElementById('tutorial-step').textContent = (this.tutorialStep+1)+' / '+this.tutorialSteps.length;
    document.getElementById('tutorial-text').textContent = this.tutorialSteps[this.tutorialStep].text;
    document.getElementById('btn-tutorial-next').textContent = this.tutorialStep === this.tutorialSteps.length-1 ? 'شروع کن' : 'بعدی';
    document.getElementById('tutorial-overlay').classList.remove('hidden');
  },
  tutorialNext() { this.tutorialStep++; if (this.tutorialStep >= this.tutorialSteps.length) this.tutorialFinish(); else this.showTutorialStep(); },
  tutorialSkip() { this.tutorialFinish(); },
  tutorialFinish() {
    document.getElementById('tutorial-overlay').classList.add('hidden');
    this.tutorialDone = true; this.notify('آماده‌ای، فرمانده!'); this.saveGame(true);
  },

  getTodayKey() { const d=new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); },
  defaultMissions() {
    return [
      { id:'upgrade', title:'ارتقای ساختمان', desc:'یک ساختمان را ارتقا بده', target:1, progress:0, reward:{wood:60,crystal:2}, claimed:false },
      { id:'defend', title:'دفاع موفق', desc:'یک موج دفاع را ببر', target:1, progress:0, reward:{stone:50,crystal:2}, claimed:false },
      { id:'collect', title:'جمع‌آوری غذا', desc:'۴۰۰ غذا جمع کن', target:400, progress:0, reward:{food:120,iron:15}, claimed:false },
      { id:'hero', title:'تقویت قهرمان', desc:'سطح یا ستاره قهرمان را بالا ببر', target:1, progress:0, reward:{crystal:3}, claimed:false }
    ];
  },
  initMissions() {
    const today=this.getTodayKey();
    if (this.missionDay!==today || !this.missions || !this.missions.length) {
      this.missions=this.defaultMissions(); this.missionDay=today;
    }
  },
  trackMission(id, amount=1) {
    if (!this.missions) return;
    const m=this.missions.find(x=>x.id===id);
    if (!m || m.claimed) return;
    m.progress=Math.min(m.target, m.progress+amount);
    if (m.progress>=m.target && !m._notified) { m._notified=true; this.notify('مأموریت کامل شد: '+m.title); }
  },
  toggleMissionPanel(show) {
    const panel=document.getElementById('mission-panel');
    if (show===false) { panel.classList.add('hidden'); return; }
    this.initMissions(); panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) this.renderMissions();
  },
  renderMissions() {
    const list=document.getElementById('mission-list'); list.innerHTML='';
    this.missions.forEach(m=>{
      const done=m.progress>=m.target;
      const card=document.createElement('div');
      card.className='mission-card'+(m.claimed?' claimed':done?' done':'');
      let rewardText=''; for (let r in m.reward) rewardText+=r+': '+m.reward[r]+'  ';
      let btn=m.claimed?'<button class="btn small" disabled>دریافت شد</button>':done?`<button class="btn primary small" onclick="Game.claimMission('${m.id}')">دریافت پاداش</button>`:`<button class="btn small" disabled>${Math.floor(m.progress)}/${m.target}</button>`;
      card.innerHTML=`<div class="mission-title">${m.title}</div><div class="mission-progress">${m.desc} — ${Math.min(Math.floor(m.progress),m.target)}/${m.target}</div><div class="mission-reward">پاداش: ${rewardText}</div>${btn}`;
      list.appendChild(card);
    });
  },
  claimMission(id) {
    const m=this.missions.find(x=>x.id===id);
    if (!m||m.claimed||m.progress<m.target) return;
    for (let r in m.reward) this.resources[r]=(this.resources[r]||0)+m.reward[r];
    m.claimed=true; this.notify('پاداش مأموریت دریافت شد!'); this.updateUI(); this.renderMissions(); this.saveGame(true);
  },

  saveGame(silent=false) {
    try {
      const data = { version: 8, resources: this.resources, heat: this.heat, heatMax: this.heatMax,
        heatProduction: this.heatProduction, heatConsumption: this.heatConsumption,
        buildings: {}, production: this.production, tutorialDone: this.tutorialDone,
        heroes: this.heroes.map(h => ({ id:h.id, level:h.level, stars:h.stars, owned:h.owned, hp:h.hp, atk:h.atk, def:h.def })),
        defenseWave: this.defenseWave, missions: this.missions, missionDay: this.missionDay, savedAt: Date.now() };
      for (let k in this.buildings) data.buildings[k] = { level: this.buildings[k].level };
      localStorage.setItem('ashen_citadel_save', JSON.stringify(data));
      if (!silent) this.notify('بازی ذخیره شد.');
    } catch(e) {}
  },
  loadGame() {
    try {
      const raw = localStorage.getItem('ashen_citadel_save'); if (!raw) return false;
      const data = JSON.parse(raw); if (!data || data.version < 2) return false;
      this.resources = {...this.resources, ...data.resources};
      this.heat = data.heat ?? this.heat; this.heatMax = data.heatMax ?? this.heatMax;
      this.heatProduction = data.heatProduction ?? this.heatProduction;
      this.heatConsumption = data.heatConsumption ?? this.heatConsumption;
      this.production = {...this.production, ...data.production};
      this.defenseWave = data.defenseWave || 1; this.tutorialDone = !!data.tutorialDone;
      if (data.missions && data.missionDay === this.getTodayKey()) {
        this.missions = data.missions; this.missionDay = data.missionDay;
      }
      if (data.buildings) for (let k in data.buildings) if (this.buildings[k]) this.buildings[k].level = data.buildings[k].level;
      if (data.heroes) data.heroes.forEach(s => { const h = this.heroes.find(x => x.id===s.id);
        if (h) { h.owned=s.owned; h.level=s.level||1; h.stars=s.stars||1; h.hp=s.hp||h.hp; h.atk=s.atk||h.atk; h.def=s.def||h.def; }});
      this._loadedFromSave = true; return true;
    } catch(e) { return false; }
  },
  resetGame() { localStorage.removeItem('ashen_citadel_save'); location.reload(); },

  tick() {
    if (!this.gameStarted || this.inDefense) return;
    for (let k in this.production) this.resources[k] += this.production[k];
    if (this.production.food) this.trackMission('collect', this.production.food);
    this.heat += this.heatProduction - this.heatConsumption;
    this.heat = Math.max(0, Math.min(this.heatMax, this.heat));
    if (this.heat < 30) {
      this.production.wood = Math.max(1, this.production.wood*0.99);
      this.production.food = Math.max(1.5, this.production.food*0.99);
    }
    this.updateUI(); this.drawBase();
  },
  updateUI() {
    ['wood','stone','food','coal','iron','crystal'].forEach(r => {
      const el = document.querySelector('#res-'+r+' span');
      if (el) el.textContent = Math.floor(this.resources[r]);
    });
    const p = (this.heat/this.heatMax)*100;
    document.getElementById('heat-fill').style.width = p+'%';
    document.getElementById('heat-value').textContent = Math.floor(p)+'%';
    document.getElementById('heat-fill').style.background = p>60 ? 'linear-gradient(90deg,#e84a00,#ffb020)' : p>30 ? 'linear-gradient(90deg,#ff6600,#ffcc00)' : 'linear-gradient(90deg,#aa2200,#ff4400)';
  },
  notify(text) {
    const el = document.getElementById('notification'); el.textContent = text; el.classList.remove('hidden');
    clearTimeout(this._notifyTimer); this._notifyTimer = setTimeout(() => el.classList.add('hidden'), 2600);
  },

  drawBase() {
    const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height, t = Date.now();
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#0a1528'); sky.addColorStop(0.6, '#0d1a2e'); sky.addColorStop(1, '#152030');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#121c2c';
    ctx.beginPath(); ctx.moveTo(0,h-100); ctx.lineTo(60,h-160); ctx.lineTo(140,h-110); ctx.lineTo(220,h-180);
    ctx.lineTo(300,h-120); ctx.lineTo(w,h-150); ctx.lineTo(w,h); ctx.lineTo(0,h); ctx.fill();
    ctx.fillStyle = '#1e2a3a'; ctx.fillRect(0, h-75, w, 75);
    ctx.fillStyle = 'rgba(220,235,255,0.35)';
    for (let i = 0; i < 18; i++) {
      const sx = (t/35+i*41)%w, sy = (t/22+i*59)%(h-70);
      ctx.beginPath(); ctx.arc(sx, sy, 1+(i%3), 0, Math.PI*2); ctx.fill();
    }
    this.drawBuildingTyped('citadel', w/2, h-175, this.buildings.citadel.level);
    this.drawBuildingTyped('woodcamp', 78, h-125, this.buildings.woodcamp.level);
    this.drawBuildingTyped('farm', w-78, h-125, this.buildings.farm.level);
    if (this.buildings.coalpit.level > 0) this.drawBuildingTyped('coalpit', 130, h-95, this.buildings.coalpit.level);
    if (this.buildings.barracks.level > 0) this.drawBuildingTyped('barracks', w-130, h-95, this.buildings.barracks.level);
    if (this.heat > 15) {
      const pulse = 0.5+0.5*Math.sin(t/200);
      const glow = 0.1+this.heat/500+pulse*0.06, r = 20+this.heat/10+pulse*4;
      const g = ctx.createRadialGradient(w/2, h-195, 2, w/2, h-195, r);
      g.addColorStop(0, `rgba(255,180,60,${glow+0.15})`); g.addColorStop(0.5, `rgba(255,100,20,${glow})`); g.addColorStop(1, 'rgba(255,60,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(w/2, h-195, r, 0, Math.PI*2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(w/2-90, 8, 180, 22);
    ctx.fillStyle = '#7a9aba'; ctx.font = '12px Tahoma'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('دژ خاکستر — سطح '+this.buildings.citadel.level, w/2, 19);
  },
  drawBuildingTyped(type, x, y, level) {
    const ctx = this.ctx;
    const styles = {
      citadel: { w:72, h:115, body:'#3a4a5a', roof:'#5a7a9a', accent:'#88aacc' },
      woodcamp: { w:52, h:62, body:'#2a3a28', roof:'#4a6a3a', accent:'#6a8a5a' },
      farm: { w:52, h:58, body:'#3a3a28', roof:'#6a6a3a', accent:'#8a8a4a' },
      coalpit: { w:42, h:48, body:'#2a2a2a', roof:'#4a3a2a', accent:'#6a4a2a' },
      barracks: { w:48, h:52, body:'#2a2a3a', roof:'#4a4a6a', accent:'#6a6a8a' }
    };
    const s = styles[type]||styles.citadel, bw=s.w, bh=s.h;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x, y+4, bw/2+4, 6, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = s.body; ctx.fillRect(x-bw/2, y-bh, bw, bh);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x+bw/2-6, y-bh, 6, bh);
    ctx.fillStyle = s.roof; ctx.beginPath(); ctx.moveTo(x-bw/2-6, y-bh); ctx.lineTo(x, y-bh-22); ctx.lineTo(x+bw/2+6, y-bh); ctx.closePath(); ctx.fill();
    ctx.fillStyle = this.heat>40 ? '#ffcc66' : '#334455';
    const winCount = type==='citadel'?3:2;
    for (let i=0;i<winCount;i++) { const wx=x-(winCount-1)*10+i*20; ctx.fillRect(wx-5, y-bh+18, 10, 12); }
    ctx.fillStyle = '#1a1520'; ctx.fillRect(x-8, y-28, 16, 28);
    ctx.fillStyle = s.accent; ctx.beginPath(); ctx.arc(x+4, y-14, 2, 0, Math.PI*2); ctx.fill();
    if (type==='citadel'||type==='coalpit') {
      ctx.fillStyle = '#2a2a32'; ctx.fillRect(x+bw/2-18, y-bh-18, 10, 20);
    }
    if (type==='woodcamp') { ctx.fillStyle='#3a2a1a'; ctx.fillRect(x-bw/2-12, y-14, 10, 14); }
    ctx.fillStyle = '#0a1525'; ctx.beginPath(); ctx.arc(x, y-bh-30, 11, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = s.accent; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#a0d0ff'; ctx.font = 'bold 11px Tahoma'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(level, x, y-bh-30);
  },
  onCanvasClick(e) {
    if (this.inDefense) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX-rect.left)*(this.canvas.width/rect.width), y = (e.clientY-rect.top)*(this.canvas.height/rect.height);
    const w = this.canvas.width, h = this.canvas.height;
    if (Math.abs(x-w/2)<40&&y>h-290&&y<h-70) this.openBuildingPanel('citadel');
    else if (Math.abs(x-80)<30&&y>h-190&&y<h-70) this.openBuildingPanel('woodcamp');
    else if (Math.abs(x-(w-80))<30&&y>h-190&&y<h-70) this.openBuildingPanel('farm');
    else if (this.buildings.coalpit.level>0&&Math.abs(x-130)<25&&y>h-140&&y<h-50) this.openBuildingPanel('coalpit');
    else if (this.buildings.barracks.level>0&&Math.abs(x-(w-130))<25&&y>h-140&&y<h-50) this.openBuildingPanel('barracks');
  },
  openBuildingPanel(key) {
    this.selectedBuilding = key; const b = this.buildings[key], cost = this.getUpgradeCost(key);
    document.getElementById('building-title').textContent = b.name;
    document.getElementById('building-desc').textContent = b.desc;
    document.getElementById('building-level').textContent = 'سطح فعلی: '+b.level;
    let t = 'هزینه ارتقاء: '; for (let r in cost) t += r+': '+cost[r]+'  ';
    document.getElementById('building-cost').textContent = t;
    document.getElementById('building-panel').classList.remove('hidden');
  },
  closePanel() { document.getElementById('building-panel').classList.add('hidden'); this.selectedBuilding = null; },
  getUpgradeCost(key) { const b=this.buildings[key],c={}; for(let r in b.baseCost)c[r]=Math.floor(b.baseCost[r]*Math.pow(1.42,b.level)); return c; },
  upgradeBuilding() {
    if (!this.selectedBuilding) return;
    const key = this.selectedBuilding, cost = this.getUpgradeCost(key);
    for (let r in cost) if (this.resources[r]<cost[r]) { this.notify('منابع کافی نیست!'); return; }
    for (let r in cost) this.resources[r]-=cost[r]; this.buildings[key].level++;
    this.trackMission('upgrade');
    if (key==='citadel') { this.heatMax+=18; this.heatProduction+=0.9; this.heat=Math.min(this.heat+25,this.heatMax); }
    if (key==='woodcamp') this.production.wood+=1.6;
    if (key==='farm') this.production.food+=2.1;
    if (key==='coalpit') { this.production.coal+=1.3; this.heatProduction+=0.55; }
    if (key==='citadel'&&this.buildings.citadel.level===2&&this.buildings.coalpit.level===0) { this.buildings.coalpit.level=1; this.notify('کوره زغال ساخته شد!'); }
    if (key==='citadel'&&this.buildings.citadel.level===3&&this.buildings.barracks.level===0) { this.buildings.barracks.level=1; this.notify('اردوگاه نیرو باز شد!'); }
    this.notify(this.buildings[key].name+' به سطح '+this.buildings[key].level+' ارتقا یافت!');
    this.closePanel(); this.updateUI(); this.drawBase(); this.saveGame(true);
  },

  toggleHeroPanel(show) {
    const panel = document.getElementById('hero-panel');
    if (show===false) { panel.classList.add('hidden'); return; }
    panel.classList.toggle('hidden'); if (!panel.classList.contains('hidden')) this.renderHeroList();
  },
  getHeroLevelCost(hero) { const lv=hero.level; return { food:Math.floor(35*Math.pow(1.32,lv-1)), iron:Math.floor(6*Math.pow(1.35,lv-1)), crystal:lv>=5?Math.floor(1+(lv-4)*0.4):0 }; },
  getHeroStarCost(hero) { const s=hero.stars; return { crystal:4+s*3, iron:25*s, food:70*s }; },
  renderHeroList() {
    const list = document.getElementById('hero-list'); list.innerHTML = '';
    this.heroes.forEach(h => {
      const card = document.createElement('div');
      card.className = 'hero-card'+(h.owned?'':' locked');
      if (!h.owned) {
        card.innerHTML = `<div class="hero-name">${h.name}</div><div class="hero-role">${h.roleFa} • ${'★'.repeat(h.stars)}</div><div class="hero-stats">HP ${h.hp} | ATK ${h.atk} | DEF ${h.def}</div><div class="hero-skill">${h.skill}</div><button class="btn primary small" onclick="Game.unlockHero('${h.id}')">باز کردن (۶ کریستال)</button>`;
      } else {
        const lvC=this.getHeroLevelCost(h), stC=this.getHeroStarCost(h);
        let lvT='غذا '+lvC.food+(lvC.iron?' • آهن '+lvC.iron:'')+(lvC.crystal?' • 💎 '+lvC.crystal:'');
        let stT='💎 '+stC.crystal+' • آهن '+stC.iron+' • غذا '+stC.food;
        card.innerHTML = `<div class="hero-name">${h.name}</div><div class="hero-role">${h.roleFa} • سطح ${h.level} • ${'★'.repeat(h.stars)}${'☆'.repeat(6-h.stars)}</div><div class="hero-stats">HP ${h.hp} | ATK ${h.atk} | DEF ${h.def}</div><div class="hero-skill">${h.skill}</div><div class="hero-actions">${h.level<20?`<button class="btn primary small" onclick="Game.levelUpHero('${h.id}')">ارتقای سطح (${lvT})</button>`:'<button class="btn small" disabled>سطح حداکثر</button>'}${h.stars<6?`<button class="btn small" onclick="Game.starUpHero('${h.id}')">ستاره (${stT})</button>`:'<button class="btn small" disabled>ستاره حداکثر</button>'}</div>`;
      }
      list.appendChild(card);
    });
  },
  unlockHero(id) {
    const hero = this.heroes.find(h=>h.id===id); if (!hero||hero.owned) return;
    if (this.resources.crystal<6) { this.notify('کریستال کافی نیست!'); return; }
    this.resources.crystal-=6; hero.owned=true; this.notify(hero.name+' به جمع قهرمانان پیوست!'); this.updateUI(); this.renderHeroList(); this.saveGame(true);
  },
  levelUpHero(id) {
    const hero = this.heroes.find(h=>h.id===id); if (!hero||!hero.owned||hero.level>=20) return;
    const cost = this.getHeroLevelCost(hero);
    if (this.resources.food<cost.food||this.resources.iron<cost.iron||this.resources.crystal<(cost.crystal||0)) { this.notify('منابع کافی نیست!'); return; }
    this.resources.food-=cost.food; this.resources.iron-=cost.iron; if (cost.crystal) this.resources.crystal-=cost.crystal;
    hero.level++; const g=1+hero.stars*0.03;
    hero.hp=Math.floor(hero.hp*(1.08+g*0.02)); hero.atk=Math.floor(hero.atk*(1.07+g*0.02)); hero.def=Math.floor(hero.def*(1.06+g*0.02));
    this.trackMission('hero'); this.notify(hero.name+' به سطح '+hero.level+' رسید!'); this.updateUI(); this.renderHeroList(); this.saveGame(true);
  },
  starUpHero(id) {
    const hero = this.heroes.find(h=>h.id===id); if (!hero||!hero.owned||hero.stars>=6) return;
    const cost = this.getHeroStarCost(hero);
    if (this.resources.crystal<cost.crystal||this.resources.iron<cost.iron||this.resources.food<cost.food) { this.notify('منابع کافی نیست!'); return; }
    this.resources.crystal-=cost.crystal; this.resources.iron-=cost.iron; this.resources.food-=cost.food;
    hero.stars++; hero.hp=Math.floor(hero.hp*1.18); hero.atk=Math.floor(hero.atk*1.15); hero.def=Math.floor(hero.def*1.12);
    this.trackMission('hero'); this.notify(hero.name+' به '+hero.stars+' ستاره رسید! ⭐'); this.updateUI(); this.renderHeroList(); this.saveGame(true);
  },

  openDefense() {
    document.getElementById('defense-overlay').classList.remove('hidden'); this.inDefense=true;
    document.getElementById('wave-info').textContent='موج '+this.defenseWave;
    document.getElementById('btn-start-defense').style.display='inline-block';
  },
  closeDefense() { this.defenseRunning=false; document.getElementById('defense-overlay').classList.add('hidden'); this.inDefense=false; this.drawBase(); },
  startDefenseWave() {
    if (this.defenseRunning) return; this.defenseRunning=true; document.getElementById('btn-start-defense').style.display='none';
    const owned = this.heroes.filter(h=>h.owned);
    this.defenseHeroes = owned.map((h,i)=>({...h, x:60+i*90, y:320, currentHp:h.hp}));
    this.defenseEnemies = [];
    for (let i=0;i<2+this.defenseWave;i++) this.defenseEnemies.push({ x:40+Math.random()*280, y:-20-i*40, hp:50+this.defenseWave*20, maxHp:50+this.defenseWave*20, speed:0.5+Math.random()*0.35 });
    this.notify('موج '+this.defenseWave+' شروع شد!'); this.defenseLoop();
  },
  defenseLoop() {
    if (!this.defenseRunning) return;
    const ctx = this.defenseCtx, w = this.defenseCanvas.width, h = this.defenseCanvas.height, t = Date.now();
    const bg = ctx.createLinearGradient(0,0,0,h); bg.addColorStop(0,'#0a1220'); bg.addColorStop(1,'#121c2c');
    ctx.fillStyle = bg; ctx.fillRect(0,0,w,h);
    ctx.fillStyle = '#1a2535'; ctx.fillRect(0,340,w,h-340);
    ctx.strokeStyle = '#3a4a5a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0,340); ctx.lineTo(w,340); ctx.stroke();
    let enemiesAlive = false;
    this.defenseEnemies.forEach(e => {
      if (e.hp<=0) return; enemiesAlive=true; e.y+=e.speed;
      this.defenseHeroes.forEach(hero => { if (hero.currentHp>0&&Math.abs(e.x-hero.x)<42&&e.y>hero.y-35) { hero.currentHp-=0.35; e.hp-=hero.atk*0.045; }});
      ctx.fillStyle='#6a2030'; ctx.beginPath(); ctx.arc(e.x,e.y,13,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#4a1520'; ctx.beginPath(); ctx.arc(e.x,e.y-6,10,Math.PI,0); ctx.fill();
      ctx.fillStyle='#ff4444'; ctx.fillRect(e.x-5,e.y-4,3,3); ctx.fillRect(e.x+2,e.y-4,3,3);
      ctx.fillStyle='#222'; ctx.fillRect(e.x-16,e.y-26,32,5); ctx.fillStyle='#ff3344'; ctx.fillRect(e.x-16,e.y-26,32*Math.max(0,e.hp/e.maxHp),5);
    });
    let heroesAlive = false;
    this.defenseHeroes.forEach(hero => {
      if (hero.currentHp<=0) return; heroesAlive=true;
      const col = hero.role==='Vanguard'?'#3a7acc':hero.role==='Destroyer'?'#cc5533':'#33aa55';
      ctx.fillStyle=col; ctx.beginPath(); ctx.arc(hero.x,hero.y,15,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#fff'; ctx.font='bold 10px Tahoma'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(hero.role==='Vanguard'?'🛡':hero.role==='Destroyer'?'⚔':'✚', hero.x, hero.y);
      ctx.fillStyle='#c0d0e0'; ctx.font='10px Tahoma'; ctx.fillText(hero.name.substring(0,5), hero.x, hero.y+28);
      ctx.fillStyle='#222'; ctx.fillRect(hero.x-18,hero.y-30,36,5); ctx.fillStyle='#44ee66'; ctx.fillRect(hero.x-18,hero.y-30,36*Math.max(0,hero.currentHp/hero.hp),5);
    });
    if (!enemiesAlive) {
      this.defenseRunning=false;
      this.resources.wood+=40+this.defenseWave*18; this.resources.stone+=25+this.defenseWave*12;
      this.resources.crystal+=1+Math.floor(this.defenseWave/2); this.defenseWave++;
      document.getElementById('wave-info').textContent='موج '+this.defenseWave;
      this.trackMission('defend'); this.notify('پیروزی!'); this.updateUI(); this.saveGame(true);
      document.getElementById('btn-start-defense').style.display='inline-block'; return;
    }
    if (!heroesAlive||this.defenseEnemies.some(e=>e.y>360)) {
      this.defenseRunning=false; this.heat=Math.max(15,this.heat-10); this.resources.food=Math.max(0,this.resources.food-20);
      this.notify('دژ آسیب دید...'); this.updateUI(); this.saveGame(true);
      document.getElementById('btn-start-defense').style.display='inline-block'; return;
    }
    requestAnimationFrame(()=>this.defenseLoop());
  }
};
window.addEventListener('load', () => Game.init());
