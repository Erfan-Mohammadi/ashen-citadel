// ============================================
// Ashen Citadel - Core Game Prototype
// ============================================

const Game = {
  // ---------- State ----------
  resources: {
    wood: 120,
    stone: 80,
    food: 150,
    coal: 60,
    iron: 20,
    crystal: 5
  },

  heat: 100,
  heatMax: 100,
  heatProduction: 2,
  heatConsumption: 1.2,

  buildings: {
    citadel: { level: 1, name: "دژ مرکزی", desc: "قلب دژ و منبع اصلی گرما", baseCost: { wood: 50, stone: 30, coal: 20 } },
    woodcamp: { level: 1, name: "اردوگاه چوب", desc: "تولید چوب", baseCost: { wood: 30, stone: 15 } },
    farm: { level: 1, name: "مزرعه", desc: "تولید غذا", baseCost: { wood: 25, stone: 10 } },
    coalpit: { level: 0, name: "کوره زغال", desc: "تولید زغال برای گرما", baseCost: { wood: 40, stone: 25 } },
    barracks: { level: 0, name: "اردوگاه نیرو", desc: "تربیت سرباز", baseCost: { wood: 60, stone: 40, iron: 10 } }
  },

  production: {
    wood: 3,
    stone: 1.5,
    food: 4,
    coal: 0.8,
    iron: 0.3
  },

  selectedBuilding: null,
  inDefense: false,
  gameStarted: false,

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
    this.updateUI();
    this.drawBase();

    setInterval(() => this.tick(), 1000);
  },

  bindEvents() {
    document.getElementById('btn-start-game').addEventListener('click', () => this.startGame());
    document.getElementById('btn-close-panel').addEventListener('click', () => this.closePanel());
    document.getElementById('btn-upgrade').addEventListener('click', () => this.upgradeBuilding());
    document.getElementById('btn-defend').addEventListener('click', () => this.openDefense());
    document.getElementById('btn-exit-defense').addEventListener('click', () => this.closeDefense());
    document.getElementById('btn-start-defense').addEventListener('click', () => this.startDefenseWave());
    this.canvas.addEventListener('click', (e) => this.onCanvasClick(e));
  },

  startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    this.gameStarted = true;
    this.notify("به دژ خاکستر خوش آمدی، فرمانده!");
    this.notify("دژ را گرم نگه دار و مردم را نجات بده.");
  },

  tick() {
    if (!this.gameStarted || this.inDefense) return;

    for (let key in this.production) {
      this.resources[key] += this.production[key];
    }

    this.heat += this.heatProduction - this.heatConsumption;
    this.heat = Math.max(0, Math.min(this.heatMax, this.heat));

    if (this.heat < 30) {
      this.production.wood *= 0.98;
      this.production.food *= 0.98;
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
    if (heatPercent > 60) {
      fill.style.background = 'linear-gradient(90deg, #ff4400, #ffaa00)';
    } else if (heatPercent > 30) {
      fill.style.background = 'linear-gradient(90deg, #ff6600, #ffcc00)';
    } else {
      fill.style.background = 'linear-gradient(90deg, #aa2200, #ff4400)';
    }
  },

  notify(text) {
    const el = document.getElementById('notification');
    el.textContent = text;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 2500);
  },

  drawBase() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = '#0b1220';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#1a2535';
    ctx.fillRect(0, h - 80, w, 80);

    this.drawBuilding(w / 2, h - 180, 70, 110, '#3a4a5a', '#5a7a9a', this.buildings.citadel.level);
    this.drawBuilding(80, h - 130, 50, 60, '#2a3a2a', '#4a6a4a', this.buildings.woodcamp.level);
    this.drawBuilding(w - 80, h - 130, 50, 55, '#3a3a2a', '#6a6a3a', this.buildings.farm.level);

    if (this.buildings.coalpit.level > 0) {
      this.drawBuilding(130, h - 90, 40, 45, '#2a2a2a', '#4a3a2a', this.buildings.coalpit.level);
    }
    if (this.buildings.barracks.level > 0) {
      this.drawBuilding(w - 130, h - 90, 45, 50, '#2a2a3a', '#4a4a6a', this.buildings.barracks.level);
    }

    if (this.heat > 20) {
      ctx.beginPath();
      ctx.arc(w / 2, h - 200, 25 + (this.heat / 10), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 120, 40, ${0.15 + this.heat / 400})`;
      ctx.fill();
    }

    ctx.fillStyle = '#6a8aaa';
    ctx.font = '12px Tahoma';
    ctx.textAlign = 'center';
    ctx.fillText('دژ خاکستر - سطح ' + this.buildings.citadel.level, w / 2, 24);
  },

  drawBuilding(x, y, width, height, color, topColor, level) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.fillRect(x - width / 2, y - height, width, height);

    ctx.fillStyle = topColor;
    ctx.beginPath();
    ctx.moveTo(x - width / 2 - 5, y - height);
    ctx.lineTo(x, y - height - 20);
    ctx.lineTo(x + width / 2 + 5, y - height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#0a1525';
    ctx.beginPath();
    ctx.arc(x, y - height - 28, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#88ccff';
    ctx.font = 'bold 11px Tahoma';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(level, x, y - height - 28);
  },

  onCanvasClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const w = this.canvas.width;
    const h = this.canvas.height;

    if (Math.abs(x - w / 2) < 40 && y > h - 290 && y < h - 70) {
      this.openBuildingPanel('citadel');
    } else if (Math.abs(x - 80) < 30 && y > h - 190 && y < h - 70) {
      this.openBuildingPanel('woodcamp');
    } else if (Math.abs(x - (w - 80)) < 30 && y > h - 190 && y < h - 70) {
      this.openBuildingPanel('farm');
    } else if (this.buildings.coalpit.level > 0 && Math.abs(x - 130) < 25 && y > h - 140 && y < h - 50) {
      this.openBuildingPanel('coalpit');
    } else if (this.buildings.barracks.level > 0 && Math.abs(x - (w - 130)) < 25 && y > h - 140 && y < h - 50) {
      this.openBuildingPanel('barracks');
    }
  },

  openBuildingPanel(key) {
    this.selectedBuilding = key;
    const b = this.buildings[key];
    const cost = this.getUpgradeCost(key);

    document.getElementById('building-title').textContent = b.name;
    document.getElementById('building-desc').textContent = b.desc;
    document.getElementById('building-level').textContent = 'سطح فعلی: ' + b.level;

    let costText = 'هزینه ارتقاء: ';
    for (let r in cost) {
      costText += `${r}: ${cost[r]}  `;
    }
    document.getElementById('building-cost').textContent = costText;
    document.getElementById('building-panel').classList.remove('hidden');
  },

  closePanel() {
    document.getElementById('building-panel').classList.add('hidden');
    this.selectedBuilding = null;
  },

  getUpgradeCost(key) {
    const b = this.buildings[key];
    const cost = {};
    for (let r in b.baseCost) {
      cost[r] = Math.floor(b.baseCost[r] * Math.pow(1.45, b.level));
    }
    return cost;
  },

  upgradeBuilding() {
    if (!this.selectedBuilding) return;
    const key = this.selectedBuilding;
    const cost = this.getUpgradeCost(key);

    for (let r in cost) {
      if (this.resources[r] < cost[r]) {
        this.notify('منابع کافی نیست!');
        return;
      }
    }

    for (let r in cost) {
      this.resources[r] -= cost[r];
    }

    this.buildings[key].level++;

    if (key === 'citadel') {
      this.heatMax += 15;
      this.heatProduction += 0.8;
      this.heat = Math.min(this.heat + 20, this.heatMax);
    }
    if (key === 'woodcamp') this.production.wood += 1.5;
    if (key === 'farm') this.production.food += 2;
    if (key === 'coalpit') {
      this.production.coal += 1.2;
      this.heatProduction += 0.5;
    }

    if (key === 'citadel' && this.buildings.citadel.level === 2 && this.buildings.coalpit.level === 0) {
      this.buildings.coalpit.level = 1;
      this.notify('کوره زغال ساخته شد!');
    }
    if (key === 'citadel' && this.buildings.citadel.level === 3 && this.buildings.barracks.level === 0) {
      this.buildings.barracks.level = 1;
      this.notify('اردوگاه نیرو باز شد!');
    }

    this.notify(this.buildings[key].name + ' به سطح ' + this.buildings[key].level + ' ارتقا یافت!');
    this.closePanel();
    this.updateUI();
    this.drawBase();
  },

  openDefense() {
    document.getElementById('defense-overlay').classList.remove('hidden');
    this.inDefense = true;
  },

  closeDefense() {
    document.getElementById('defense-overlay').classList.add('hidden');
    this.inDefense = false;
    this.drawBase();
  },

  startDefenseWave() {
    this.notify('موج دشمن شروع شد!');
    setTimeout(() => {
      const success = Math.random() > 0.25;
      if (success) {
        this.resources.wood += 40;
        this.resources.stone += 25;
        this.resources.crystal += 2;
        this.notify('پیروزی! منابع غنیمت گرفته شد.');
      } else {
        this.heat -= 15;
        this.resources.food -= 20;
        this.notify('دژ آسیب دید... گرما کاهش یافت.');
      }
      this.updateUI();
      this.closeDefense();
    }, 1800);
  }
};

window.addEventListener('load', () => Game.init());
