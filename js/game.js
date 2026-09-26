// ============================================
// Ashen Citadel - Core Game Prototype v0.3
// Added: Save / Load (LocalStorage) + Auto-save
// ============================================

const Game = {
  resources: {
    wood: 120,
    stone: 80,
    food: 150,
    coal: 60,
    iron: 20,
    crystal: 8
  },

  heat: 100,
  heatMax: 100,
  heatProduction: 2.2,
  heatConsumption: 1.1,

  buildings: {
    citadel:  { level: 1, name: "دژ مرکزی",   desc: "قلب دژ و منبع اصلی گرما", baseCost: { wood: 50, stone: 30, coal: 20 } },
    woodcamp: { level: 1, name: "اردوگاه چوب", desc: "تولید چوب",             baseCost: { wood: 30, stone: 15 } },
    farm:     { level: 1, name: "مزرعه",      desc: "تولید غذا",             baseCost: { wood: 25, stone: 10 } },
    coalpit:  { level: 0, name: "کوره زغال",  desc: "تولید زغال برای گرما",  baseCost: { wood: 40, stone: 25 } },
    barracks: { level: 0, name: "اردوگاه نیرو", desc: "تربیت سرباز",         baseCost: { wood: 60, stone: 40, iron: 10 } }
  },

  production: {
    wood: 3.2,
    stone: 1.6,
    food: 4.2,
    coal: 0.9,
    iron: 0.35
  },

  heroes: [
    { id: "kaveh", name: "کاوه آهنین", role: "Vanguard", roleFa: "محافظ", level: 1, stars: 1, hp: 420, atk: 35, def: 55, skill: "سپر فولادی", owned: true, description: "تانک خط مقدم با دفاع بالا" },
    { id: "arash", name: "آرش آتشین", role: "Destroyer", roleFa: "نابودگر", level: 1, stars: 1, hp: 280, atk: 78, def: 22, skill: "تیر آتشین", owned: true, description: "تیرانداز با آسیب ناحیه‌ای" },
    { id: "anahita", name: "آناهیتا", role: "Support", roleFa: "پشتیبان", level: 1, stars: 1, hp: 310, atk: 28, def: 30, skill: "چشمه حیات", owned: false, description: "درمانگر قدرتمند (با کریستال باز می‌شود)" },
    { id: "rostam", name: "رستم سایه", role: "Destroyer", roleFa: "نابودگر", level: 1, stars: 2, hp: 300, atk: 95, def: 28, skill: "ضربه سایه‌ای", owned: false, description: "قاتل تک‌هدف با آسیب بحرانی" }
  ],

  selectedBuilding: null,
  inDefense: false,
  gameStarted: false,
  defenseWave: 1,
  defenseEnemies: [],
  defenseHeroes: [],
  defenseRunning: false,
  _loadedFromSave: false,

  canvas: null,
  ctx: null,
  defenseCanvas: null,
  defenseCtx: null,

  init() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.defenseCanvas = document.getElementById('defense-canvas');
    this.defenseCtx = this.defenseCanvas.getContext('2d');

    this.bindEvents();

    const hasSave = this.loadGame();
    if (hasSave) {
      document.getElementById('btn-start-game').textContent = 'ادامه بازی';
      document.querySelector('.start-content p').textContent = 'پیشرفت قبلی شما ذخیره شده است.';
    }

    this.updateUI();
    this.drawBase();
    this.renderHeroList();

    setInterval(() => this.tick(), 1000);
    setInterval(() => {
      if (this.gameStarted) this.saveGame(true);
    }, 15000);
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
    this.canvas.addEventListener('click', (e) => this.onCanvasClick(e));
  },

  startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    this.gameStarted = true;
    if (this._loadedFromSave) {
      this.notify("خوش برگشتی، فرمانده!");
    } else {
      this.notify("به دژ خاکستر خوش آمدی، فرمانده!");
      setTimeout(() => this.notify("دژ را گرم نگه دار و مردم را نجات بده."), 1200);
    }
    this.saveGame(true);
  },

  saveGame(silent = false) {
    try {
      const data = {
        version: 3,
        resources: this.resources,
        heat: this.heat,
        heatMax: this.heatMax,
        heatProduction: this.heatProduction,
        heatConsumption: this.heatConsumption,
        buildings: {},
        production: this.production,
        heroes: this.heroes.map(h => ({ id: h.id, level: h.level, stars: h.stars, owned: h.owned, hp: h.hp, atk: h.atk, def: h.def })),
        defenseWave: this.defenseWave,
        savedAt: Date.now()
      };
      for (let key in this.buildings) {
        data.buildings[key] = { level: this.buildings[key].level };
      }
      localStorage.setItem('ashen_citadel_save', JSON.stringify(data));
      if (!silent) this.notify("بازی ذخیره شد.");
    } catch (e) {
      console.warn('Save failed', e);
    }
  },

  loadGame() {
    try {
      const raw = localStorage.getItem('ashen_citadel_save');
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || data.version < 2) return false;

      this.resources = { ...this.resources, ...data.resources };
      this.heat = data.heat ?? this.heat;
      this.heatMax = data.heatMax ?? this.heatMax;
      this.heatProduction = data.heatProduction ?? this.heatProduction;
      this.heatConsumption = data.heatConsumption ?? this.heatConsumption;
      this.production = { ...this.production, ...data.production };
      this.defenseWave = data.defenseWave || 1;

      if (data.buildings) {
        for (let key in data.buildings) {
          if (this.buildings[key]) this.buildings[key].level = data.buildings[key].level;
        }
      }
      if (data.heroes) {
        data.heroes.forEach(saved => {
          const h = this.heroes.find(x => x.id === saved.id);
          if (h) {
            h.owned = saved.owned;
            h.level = saved.level || 1;
            h.stars = saved.stars || 1;
            h.hp = saved.hp || h.hp;
            h.atk = saved.atk || h.atk;
            h.def = saved.def || h.def;
          }
        });
      }
      this._loadedFromSave = true;
      return true;
    } catch (e) {
      console.warn('Load failed', e);
      return false;
    }
  },

  resetGame() {
    localStorage.removeItem('ashen_citadel_save');
    location.reload();
  },

  tick() {
    if (!this.gameStarted || this.inDefense) return;
    for (let key in this.production) this.resources[key] += this.production[key];
    this.heat += this.heatProduction - this.heatConsumption;
    this.heat = Math.max(0, Math.min(this.heatMax, this.heat));
    if (this.heat < 30) {
      this.production.wood = Math.max(1, this.production.wood * 0.985);
      this.production.food = Math.max(1.5, this.production.food * 0.985);
    }
    this.updateUI();
    this.drawBase();
  },

  updateUI() {
    document.querySelector('#res-wood span').textContent = Math.floor(this.resources.wood);
    document.querySelector('#res-stone span').textContent = Math.floor(this.resources.stone);
    document.querySelector('#res-food span').textContent = Math.floor(this.resources.food);
    document.querySelector('#res-coal span').textContent = Math.floor(this.resources.coal);
    document.querySelector('#res-iron span').textContent = Math.floor(this.resources.iron);
    document.querySelector('#res-crystal span').textContent = Math.floor(this.resources.crystal);
    const heatPercent = (this.heat / this.heatMax) * 100;
    document.getElementById('heat-fill').style.width = heatPercent + '%';
    document.getElementById('heat-value').textContent = Math.floor(heatPercent) + '%';
    const fill = document.getElementById('heat-fill');
    if (heatPercent > 60) fill.style.background = 'linear-gradient(90deg, #ff4400, #ffaa00)';
    else if (heatPercent > 30) fill.style.background = 'linear-gradient(90deg, #ff6600, #ffcc00)';
    else fill.style.background = 'linear-gradient(90deg, #aa2200, #ff4400)';
  },

  notify(text) {
    const el = document.getElementById('notification');
    el.textContent = text;
    el.classList.remove('hidden');
    clearTimeout(this._notifyTimer);
    this._notifyTimer = setTimeout(() => el.classList.add('hidden'), 2600);
  },

  drawBase() {
    const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1a2535'; ctx.fillRect(0, h - 80, w, 80);
    ctx.fillStyle = 'rgba(200,220,255,0.15)';
    for (let i = 0; i < 12; i++) {
      const sx = (Date.now() / 40 + i * 37) % w;
      const sy = (Date.now() / 25 + i * 53) % (h - 80);
      ctx.fillRect(sx, sy, 2, 2);
    }
    this.drawBuilding(w / 2, h - 180, 70, 110, '#3a4a5a', '#5a7a9a', this.buildings.citadel.level);
    this.drawBuilding(80, h - 130, 50, 60, '#2a3a2a', '#4a6a4a', this.buildings.woodcamp.level);
    this.drawBuilding(w - 80, h - 130, 50, 55, '#3a3a2a', '#6a6a3a', this.buildings.farm.level);
    if (this.buildings.coalpit.level > 0) this.drawBuilding(130, h - 90, 40, 45, '#2a2a2a', '#4a3a2a', this.buildings.coalpit.level);
    if (this.buildings.barracks.level > 0) this.drawBuilding(w - 130, h - 90, 45, 50, '#2a2a3a', '#4a4a6a', this.buildings.barracks.level);
    if (this.heat > 15) {
      const glow = 0.12 + this.heat / 450;
      ctx.beginPath(); ctx.arc(w / 2, h - 200, 22 + this.heat / 9, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 110, 30, ${glow})`; ctx.fill();
    }
    ctx.fillStyle = '#6a8aaa'; ctx.font = '12px Tahoma'; ctx.textAlign = 'center';
    ctx.fillText('دژ خاکستر - سطح ' + this.buildings.citadel.level, w / 2, 24);
  },

  drawBuilding(x, y, width, height, color, topColor, level) {
    const ctx = this.ctx;
    ctx.fillStyle = color; ctx.fillRect(x - width / 2, y - height, width, height);
    ctx.fillStyle = topColor;
    ctx.beginPath(); ctx.moveTo(x - width / 2 - 5, y - height); ctx.lineTo(x, y - height - 20); ctx.lineTo(x + width / 2 + 5, y - height); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#0a1525'; ctx.beginPath(); ctx.arc(x, y - height - 28, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#88ccff'; ctx.font = 'bold 11px Tahoma'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(level, x, y - height - 28);
  },

  onCanvasClick(e) {
    if (this.inDefense) return;
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width, scaleY = this.canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX, y = (e.clientY - rect.top) * scaleY;
    const w = this.canvas.width, h = this.canvas.height;
    if (Math.abs(x - w / 2) < 40 && y > h - 290 && y < h - 70) this.openBuildingPanel('citadel');
    else if (Math.abs(x - 80) < 30 && y > h - 190 && y < h - 70) this.openBuildingPanel('woodcamp');
    else if (Math.abs(x - (w - 80)) < 30 && y > h - 190 && y < h - 70) this.openBuildingPanel('farm');
    else if (this.buildings.coalpit.level > 0 && Math.abs(x - 130) < 25 && y > h - 140 && y < h - 50) this.openBuildingPanel('coalpit');
    else if (this.buildings.barracks.level > 0 && Math.abs(x - (w - 130)) < 25 && y > h - 140 && y < h - 50) this.openBuildingPanel('barracks');
  },

  openBuildingPanel(key) {
    this.selectedBuilding = key;
    const b = this.buildings[key], cost = this.getUpgradeCost(key);
    document.getElementById('building-title').textContent = b.name;
    document.getElementById('building-desc').textContent = b.desc;
    document.getElementById('building-level').textContent = 'سطح فعلی: ' + b.level;
    let costText = 'هزینه ارتقاء: ';
    for (let r in cost) costText += `${r}: ${cost[r]}  `;
    document.getElementById('building-cost').textContent = costText;
    document.getElementById('building-panel').classList.remove('hidden');
  },

  closePanel() { document.getElementById('building-panel').classList.add('hidden'); this.selectedBuilding = null; },

  getUpgradeCost(key) {
    const b = this.buildings[key], cost = {};
    for (let r in b.baseCost) cost[r] = Math.floor(b.baseCost[r] * Math.pow(1.48, b.level));
    return cost;
  },

  upgradeBuilding() {
    if (!this.selectedBuilding) return;
    const key = this.selectedBuilding, cost = this.getUpgradeCost(key);
    for (let r in cost) if (this.resources[r] < cost[r]) { this.notify('منابع کافی نیست!'); return; }
    for (let r in cost) this.resources[r] -= cost[r];
    this.buildings[key].level++;
    if (key === 'citadel') { this.heatMax += 18; this.heatProduction += 0.9; this.heat = Math.min(this.heat + 25, this.heatMax); }
    if (key === 'woodcamp') this.production.wood += 1.6;
    if (key === 'farm') this.production.food += 2.1;
    if (key === 'coalpit') { this.production.coal += 1.3; this.heatProduction += 0.55; }
    if (key === 'citadel' && this.buildings.citadel.level === 2 && this.buildings.coalpit.level === 0) { this.buildings.coalpit.level = 1; this.notify('کوره زغال ساخته شد!'); }
    if (key === 'citadel' && this.buildings.citadel.level === 3 && this.buildings.barracks.level === 0) { this.buildings.barracks.level = 1; this.notify('اردوگاه نیرو باز شد!'); }
    this.notify(this.buildings[key].name + ' به سطح ' + this.buildings[key].level + ' ارتقا یافت!');
    this.closePanel(); this.updateUI(); this.drawBase(); this.saveGame(true);
  },

  toggleHeroPanel(show) {
    const panel = document.getElementById('hero-panel');
    if (show === false) { panel.classList.add('hidden'); return; }
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) this.renderHeroList();
  },

  renderHeroList() {
    const list = document.getElementById('hero-list');
    list.innerHTML = '';
    this.heroes.forEach(h => {
      const card = document.createElement('div');
      card.className = 'hero-card' + (h.owned ? '' : ' locked');
      card.innerHTML = `
        <div class="hero-name">${h.name}</div>
        <div class="hero-role">${h.roleFa} • سطح ${h.level} • ${'★'.repeat(h.stars)}</div>
        <div class="hero-stats">HP ${h.hp} | ATK ${h.atk} | DEF ${h.def}</div>
        <div class="hero-skill">${h.skill}</div>
        ${h.owned ? '<button class="btn small" disabled>در اختیار</button>' : `<button class="btn primary small" onclick="Game.unlockHero('${h.id}')">باز کردن (۸ کریستال)</button>`}
      `;
      list.appendChild(card);
    });
  },

  unlockHero(id) {
    const hero = this.heroes.find(h => h.id === id);
    if (!hero || hero.owned) return;
    if (this.resources.crystal < 8) { this.notify('کریستال کافی نیست!'); return; }
    this.resources.crystal -= 8; hero.owned = true;
    this.notify(hero.name + ' به جمع قهرمانان پیوست!');
    this.updateUI(); this.renderHeroList(); this.saveGame(true);
  },

  openDefense() {
    document.getElementById('defense-overlay').classList.remove('hidden');
    this.inDefense = true;
    document.getElementById('wave-info').textContent = 'موج ' + this.defenseWave;
    document.getElementById('btn-start-defense').style.display = 'inline-block';
  },

  closeDefense() {
    this.defenseRunning = false;
    document.getElementById('defense-overlay').classList.add('hidden');
    this.inDefense = false; this.drawBase();
  },

  startDefenseWave() {
    if (this.defenseRunning) return;
    this.defenseRunning = true;
    document.getElementById('btn-start-defense').style.display = 'none';
    const owned = this.heroes.filter(h => h.owned);
    this.defenseHeroes = owned.map((h, i) => ({ ...h, x: 60 + i * 90, y: 320, currentHp: h.hp }));
    this.defenseEnemies = [];
    const count = 3 + this.defenseWave;
    for (let i = 0; i < count; i++) {
      this.defenseEnemies.push({ x: 40 + Math.random() * 280, y: -20 - i * 35, hp: 60 + this.defenseWave * 25, maxHp: 60 + this.defenseWave * 25, speed: 0.6 + Math.random() * 0.4 });
    }
    this.notify('موج ' + this.defenseWave + ' شروع شد!');
    this.defenseLoop();
  },

  defenseLoop() {
    if (!this.defenseRunning) return;
    const ctx = this.defenseCtx, w = this.defenseCanvas.width, h = this.defenseCanvas.height;
    ctx.fillStyle = '#0a1220'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#2a3a4a'; ctx.beginPath(); ctx.moveTo(0, 340); ctx.lineTo(w, 340); ctx.stroke();

    let enemiesAlive = false;
    this.defenseEnemies.forEach(e => {
      if (e.hp <= 0) return; enemiesAlive = true; e.y += e.speed;
      this.defenseHeroes.forEach(hero => {
        if (hero.currentHp > 0 && Math.abs(e.x - hero.x) < 40 && e.y > hero.y - 30) {
          hero.currentHp -= 0.4; e.hp -= hero.atk * 0.04;
        }
      });
      ctx.fillStyle = '#aa3333'; ctx.beginPath(); ctx.arc(e.x, e.y, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#333'; ctx.fillRect(e.x - 15, e.y - 24, 30, 5);
      ctx.fillStyle = '#ff4444'; ctx.fillRect(e.x - 15, e.y - 24, 30 * (e.hp / e.maxHp), 5);
    });

    let heroesAlive = false;
    this.defenseHeroes.forEach(hero => {
      if (hero.currentHp <= 0) return; heroesAlive = true;
      ctx.fillStyle = hero.role === 'Vanguard' ? '#4488cc' : hero.role === 'Destroyer' ? '#cc6644' : '#44aa66';
      ctx.beginPath(); ctx.arc(hero.x, hero.y, 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#eee'; ctx.font = '10px Tahoma'; ctx.textAlign = 'center';
      ctx.fillText(hero.name.substring(0, 4), hero.x, hero.y + 28);
      ctx.fillStyle = '#333'; ctx.fillRect(hero.x - 18, hero.y - 28, 36, 5);
      ctx.fillStyle = '#44ff66'; ctx.fillRect(hero.x - 18, hero.y - 28, 36 * (hero.currentHp / hero.hp), 5);
    });

    if (!enemiesAlive) {
      this.defenseRunning = false;
      this.resources.wood += 35 + this.defenseWave * 15;
      this.resources.stone += 20 + this.defenseWave * 10;
      this.resources.crystal += 1 + Math.floor(this.defenseWave / 2);
      this.defenseWave++;
      document.getElementById('wave-info').textContent = 'موج ' + this.defenseWave;
      this.notify('پیروزی! موج بعدی آماده است.');
      this.updateUI(); this.saveGame(true);
      document.getElementById('btn-start-defense').style.display = 'inline-block';
      return;
    }
    if (!heroesAlive || this.defenseEnemies.some(e => e.y > 360)) {
      this.defenseRunning = false;
      this.heat = Math.max(10, this.heat - 12);
      this.resources.food = Math.max(0, this.resources.food - 25);
      this.notify('دژ آسیب دید... گرما و غذا کاهش یافت.');
      this.updateUI(); this.saveGame(true);
      document.getElementById('btn-start-defense').style.display = 'inline-block';
      return;
    }
    requestAnimationFrame(() => this.defenseLoop());
  }
};

window.addEventListener('load', () => Game.init());
