(function () {
  "use strict";

  const sounds = {
    run: new Audio("src/assets/sfx/run.ogg"),
    takeHit: new Audio("src/assets/sfx/takeHit.ogg"),
    jump: new Audio("src/assets/sfx/jump.ogg"),
    heal: new Audio("src/assets/sfx/heal.ogg"),
    death: new Audio("src/assets/sfx/death.ogg"),
    attack: new Audio("src/assets/sfx/shoot.mp3"),
    mushroom_takeHit: new Audio("src/assets/sfx/mushroom_hurt.ogg"),
    weasel_takeHit: new Audio("src/assets/sfx/weasel_hurt.ogg"),
    goblin_takeHit: new Audio("src/assets/sfx/goblin_hurt.ogg"),
    flying_eye_takeHit: new Audio("src/assets/sfx/flying_eye_hurt.ogg"),
  };

  let sfxEnabled = true;
  const POOL_SIZE = 8; 
  const audioPools = new Map();

  function playSfx(sound) {
    if (!sfxEnabled) return;
    const key = sound.src;

    if (!audioPools.has(key)) {
      const pool = Array.from({ length: POOL_SIZE }, () => sound.cloneNode());
      audioPools.set(key, { pool, index: 0 });
    }

    const audioData = audioPools.get(key);
    const s = audioData.pool[audioData.index];
    audioData.index = (audioData.index + 1) % POOL_SIZE;

    s.currentTime = 0;
    s.volume = sound.volume;
    s.play().catch(() => {});
  }

  sounds.run.volume = 0.3;
  sounds.takeHit.volume = 0.7;
  sounds.jump.volume = 1;
  sounds.heal.volume = 0.22;
  sounds.death.volume = 0.25;
  sounds.attack.volume = 0.7;
  sounds.mushroom_takeHit.volume = 0.3;
  sounds.weasel_takeHit.volume = 0.3;
  sounds.goblin_takeHit.volume = 0.3;
  sounds.flying_eye_takeHit.volume = 0.3;

  const menuMusic = new Audio("src/assets/sfx/menu_theme.mp3");
  menuMusic.loop = true;
  menuMusic.volume = 0;

  let menuMusicStarted = false;

  function startMenuIntro() {
    if (musicEnabled) {
        menuMusic.volume = 0;
        menuMusic.play();
    }

    triggerSceneTransition({
        duration: 1500,
        onBlackout: () => {
            document.getElementById("introScreen").classList.add("hidden");
            document.getElementById("startScreen").classList.remove("hidden");
        },
        onComplete: () => {
            if (musicEnabled) {
                menuMusic.volume = 0.5;
            }
        }
    });
  }

  function stopMenuMusic() {
    menuMusic.pause();
  }

  function resumeMenuMusic() {
      if (menuMusicStarted && musicEnabled) {
          menuMusic.currentTime = 0;
          menuMusic.play();
      }
  }

  function playMatchMusic(mode) {
    if (!musicEnabled) return;
    const track = matchMusic[mode];
    if (!track) return;

    currentMatchMusic = track;
    track.currentTime = 0;
    track.play();
  }

  function stopMatchMusic() {
    if (currentMatchMusic) {
      currentMatchMusic.pause();
      currentMatchMusic = null;
    }
  }

  const matchMusic = {
    survival: new Audio("src/assets/sfx/survival_theme.ogg"),
    duel: new Audio("src/assets/sfx/duel_theme.mp3"),
  };

  matchMusic.survival.loop = true;
  matchMusic.duel.loop = true;
  matchMusic.survival.volume = 0.5;
  matchMusic.duel.volume = 0.5;

  let currentMatchMusic = null;
  let isTransitioning = false;

  function triggerSceneTransition(options) {
    const { onBlackout, onComplete, duration = 2000 } = options;
    if (isTransitioning) return;
    isTransitioning = true;

    const overlay = document.getElementById("screenTransitionOverlay");
    overlay.classList.remove("hidden");

    void overlay.offsetWidth;
    overlay.classList.add("active");

    const activeAudio = currentMatchMusic || (menuMusicStarted ? menuMusic : null);
    const initialVolume = activeAudio ? activeAudio.volume : 0;
    const startTime = performance.now();

    const fadeInterval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (activeAudio) {
        activeAudio.volume = Math.max(0, initialVolume * (1 - progress));
      }

      if (progress >= 1) {
        clearInterval(fadeInterval);

        if (onBlackout) onBlackout();

        overlay.classList.remove("active");

        const newAudio = currentMatchMusic || (menuMusicStarted ? menuMusic : null);
        const targetVolume = world.running ? 0.2 : 0.5;
        const fadeInStart = performance.now();

        if (newAudio) newAudio.volume = 0;

        const fadeInInterval = setInterval(() => {
          const inElapsed = performance.now() - fadeInStart;
          const inProgress = Math.min(inElapsed / duration, 1);

          if (newAudio) {
            newAudio.volume = targetVolume * inProgress;
          }

          if (inProgress >= 1) {
            clearInterval(fadeInInterval);
            overlay.classList.add("hidden");
            isTransitioning = false;
            if (onComplete) onComplete();
          }
        }, 30);
      }
    }, 30);
  }

  const sprites = {
    player: new Image(),
    enemy: new Image(),
    arrow: new Image(),
    background: new Image()
  };
 
  sprites.arrow.src = "src/assets/GandalfHardcore Archer/arrow.png";
  sprites.background.src = "src/assets/Background by GPT 5.5.png";
 
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.imageSmoothingEnabled = false;
  const pauseScreen = document.getElementById("pauseScreen");
  const startScreen = document.getElementById("startScreen");
  const gameOverOverlay = document.getElementById("gameOverOverlay");
  const gameOverModal = document.getElementById("gameOverModal");
  const finalStatsEl = document.getElementById("finalStats");

  let musicEnabled = true;

  const musicToggle = document.getElementById("musicToggle");
  const sfxToggle = document.getElementById("sfxToggle");

  musicToggle.addEventListener("change", () => {
      musicEnabled = musicToggle.checked;
      if (!musicEnabled) {
          menuMusic.pause();
      } else {
          menuMusic.currentTime = 0;
          menuMusic.play();
      }
  });

  sfxToggle.addEventListener("change", () => {
      sfxEnabled = sfxToggle.checked;
  });

  const DEBUG = false;

  function loadEntityAnimation(path, frames){
      const sheet = {
          image: new Image(),
          frameCount: frames,
          frameWidth: 0,
          frameHeight: 0,
          ready: false
      };

      sheet.image.onload = () => {
          sheet.frameWidth = sheet.image.naturalWidth / frames;
          sheet.frameHeight = sheet.image.naturalHeight;
          sheet.ready = true;
      };

      sheet.image.src = `${path}.png`;
      return sheet;
  }

  // Tabela de inimigos com probabilidade (weight) variando conforme o avanço das Hordas
  const enemyTypes = {
      mushroom:{
          takeHitSound:"mushroom_takeHit",
          stats:{ hp:32, damage:10, speed:92, value:1, attackCooldown:0.78, jumpCooldown:0.70, attackReach:34 },
          size:{ width:38, height:48, spriteSize:64, drawSize:64 },
          spawn:{
              minWave: 1,
              weight(wave){
                  return Math.max(15, 100 - (wave - 1) * 12);
              }
          },
          sprites:{
              run:loadEntityAnimation("src/assets/enemies/Mushroom/Run", 8),
              attack:loadEntityAnimation("src/assets/enemies/Mushroom/Attack", 8),
              takeHit:loadEntityAnimation("src/assets/enemies/Mushroom/Take_Hit", 4),
              death:loadEntityAnimation("src/assets/enemies/Mushroom/Death", 4),
              jump:null
          }
      },

      goblin:{
          takeHitSound:"goblin_takeHit",
          stats:{ hp:35, damage:25, speed:135, value:1, attackCooldown:0.60, jumpCooldown:0.70, attackReach:30 },
          size:{ width:38, height:48, spriteSize:64, drawSize:256, drawOffsetY:83 },
          spawn:{
              minWave: 1,
              weight(wave){
                  return Math.min(85, 20 + (wave - 1) * 15);
              }
          },
          sprites:{
              run:loadEntityAnimation("src/assets/enemies/Goblin/Run", 8),
              attack:loadEntityAnimation("src/assets/enemies/Goblin/Attack", 8),
              takeHit:loadEntityAnimation("src/assets/enemies/Goblin/Take_Hit", 4),
              death:loadEntityAnimation("src/assets/enemies/Goblin/Death", 4),
              jump:null
          }
      },

      flying_eye:{
          takeHitSound:"flying_eye_takeHit",
          flying:true,
          stats:{ hp:40, damage:20, speed:95, value:3, attackCooldown:0.78, attackReach:34 },
          size:{ width:38, height:48, spriteSize:64, drawSize:256, drawOffsetY:100 },
          spawn:{
              minWave: 2,
              weight(wave){
                  if (wave < 2) return 0;
                  return Math.min(75, 30 + (wave - 2) * 12);
              }
          },
          sprites:{
              run:loadEntityAnimation("src/assets/enemies/Flying_eye/Flight", 8),
              attack:loadEntityAnimation("src/assets/enemies/Flying_eye/Attack", 8),
              takeHit:loadEntityAnimation("src/assets/enemies/Flying_eye/Take_Hit", 4),
              death:loadEntityAnimation("src/assets/enemies/Flying_eye/Death", 4),
              jump:null
          }
      },

      weaselFisherman:{
          takeHitSound:"weasel_takeHit",
          stats:{ hp:64, damage:15, speed:105, value:2, attackCooldown:0.65, jumpCooldown:0.60, attackReach:40 },
          size:{ width:42, height:54, spriteSize:160, drawSize:160, drawOffsetY:50 },
          spawn:{
              minWave: 3,
              weight(wave){
                  if (wave < 3) return 0;
                  return Math.min(100, 35 + (wave - 3) * 15);
              }
          },
          sprites:{
              run:loadEntityAnimation("src/assets/enemies/Weasel_Fisherman/Run", 8),
              attack:loadEntityAnimation("src/assets/enemies/Weasel_Fisherman/Attack", 7),
              takeHit:loadEntityAnimation("src/assets/enemies/Weasel_Fisherman/Take_Hit", 4),
              death:loadEntityAnimation("src/assets/enemies/Weasel_Fisherman/Death", 10),
              jump:loadEntityAnimation("src/assets/enemies/Weasel_Fisherman/Jump", 6)
          }
      }
  };
 
  const ui = {
    startGame: document.getElementById("startGame"),
    duelMode: document.getElementById("duelMode"),
    restartGame: document.getElementById("restartGame"),
    backToMenu: document.getElementById("backToMenu"),
    gameOverTitle: document.getElementById("gameOverTitle"),
    finalStats: document.getElementById("finalStats"),
    startScreen: document.getElementById("startScreen"),
  };
 
  const keys = Object.create(null);
  const PLAYER_JUMP_SPEED = Math.round(860 * Math.sqrt(1.15));
  const ENEMY_JUMP_SPEED = 1000;

  const world = {
    width:canvas.width,
    height:canvas.height,
    viewWidth:canvas.width,
    viewHeight:canvas.height,
    cameraX: 0,
    cameraY: 0,
    gravity: 2200,
    floor: 635,
    mode: "survival",
    countdown: 0,
    paused: true,
    running: false,
    gameOver: false,
    elapsed: 0,
    spawnTimer: 0,
    potionTimer: 0,
    shake: 0,
    platforms:[
      { x:-100, y:614, w:1900, h:20 },
      { x:180,  y:425, w:320,  h:20 },
      { x:480,  y:285, w:325,  h:20 },
      { x:780,  y:427, w:315,  h:20 }
    ]
  };
 
  const state = {
    player: null,
    enemies: [],
    arrows: [],
    orbs: [],
    orbsCollected: 0,
    potions: [],
    potionsUsed: 0,
    particles: [],
    kills: 0,
    duelBot: null,
    best: Number(localStorage.getItem("EndlessDungeonBest") || 0),

    // Estado das Hordas
    currentWave: 1,
    wavesDefeated: 0,
    waveState: "START", // "START", "ACTIVE", "COMPLETED"
    waveEnemiesToSpawn: 0,
    waveEnemiesSpawned: 0,
    waveTimer: 0,
    waveBanner: {
      text: "",
      timer: 0,
      duration: 0,
      alpha: 0
    },
    buffBanner: {
      text: "",
      timer: 0,
      duration: 0,
      alpha: 0
    }
  };

  function showWaveMessage(text, duration = 3.0) {
    state.waveBanner.text = text;
    state.waveBanner.duration = duration;
    state.waveBanner.timer = duration;
    state.waveBanner.alpha = 0;
  }

  function updateWaveBanner(dt) {
    const b = state.waveBanner;
    if (b.timer > 0) {
      b.timer -= dt;
      const fadeIn = 0.5;
      const fadeOut = 0.5;
      const elapsed = b.duration - b.timer;

      if (elapsed < fadeIn) {
        b.alpha = elapsed / fadeIn;
      } else if (b.timer < fadeOut) {
        b.alpha = b.timer / fadeOut;
      } else {
        b.alpha = 1;
      }

      if (b.timer <= 0) {
        b.alpha = 0;
        b.text = "";
      }
    }
  }

  function drawWaveBanner() {
    const b = state.waveBanner;
    if (b.alpha <= 0 || !b.text) return;

    ctx.save();
    ctx.globalAlpha = b.alpha;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const centerX = world.width / 2;
    const centerY = world.height / 2 - 20;

    // Fundo semitransparente sutil para leitura perfeita da mensagem
    ctx.fillStyle = "rgba(10, 8, 6, 0.65)";
    ctx.fillRect(centerX - 150, centerY - 40, 300, 80);
    ctx.strokeStyle = "rgba(228, 177, 93, 0.5)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(centerX - 150, centerY - 40, 300, 80);

    ctx.font = "900 32px Georgia, 'Times New Roman', serif";
    ctx.fillStyle = "#f4efe6";
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 8;

    ctx.fillText(b.text, centerX, centerY);
    ctx.restore();
  }

  // Mensagem rápida (toast) exibida quando o jogador ganha um buff.
  // Usa o mesmo esquema de fade do aviso de horda, mas fica posicionada
  // um pouco abaixo dele para que os dois possam aparecer ao mesmo tempo
  // sem se sobrepor (uma horda múltipla de 5 sempre concede um buff).
  function showBuffMessage(text, duration = 2.6) {
    state.buffBanner.text = text;
    state.buffBanner.duration = duration;
    state.buffBanner.timer = duration;
    state.buffBanner.alpha = 0;
  }

  function updateBuffBanner(dt) {
    const b = state.buffBanner;
    if (b.timer > 0) {
      b.timer -= dt;
      const fadeIn = 0.35;
      const fadeOut = 0.5;
      const elapsed = b.duration - b.timer;

      if (elapsed < fadeIn) {
        b.alpha = elapsed / fadeIn;
      } else if (b.timer < fadeOut) {
        b.alpha = b.timer / fadeOut;
      } else {
        b.alpha = 1;
      }

      if (b.timer <= 0) {
        b.alpha = 0;
        b.text = "";
      }
    }
  }

  function drawBuffBanner() {
    const b = state.buffBanner;
    if (b.alpha <= 0 || !b.text) return;

    ctx.save();
    ctx.globalAlpha = b.alpha;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const centerX = world.width / 2;
    const centerY = world.height / 2 + 64;

    ctx.fillStyle = "rgba(10, 8, 6, 0.65)";
    ctx.fillRect(centerX - 170, centerY - 26, 340, 52);
    ctx.strokeStyle = "rgba(114, 198, 111, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(centerX - 170, centerY - 26, 340, 52);

    ctx.font = "700 20px Georgia, 'Times New Roman', serif";
    ctx.fillStyle = "#e4b15d";
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 6;

    ctx.fillText(b.text, centerX, centerY);
    ctx.restore();
  }

  const playerSprites = {
    idle:    loadEntityAnimation("src/assets/GandalfHardcore Archer/standard_skin/Idle", 5),
    run:     loadEntityAnimation("src/assets/GandalfHardcore Archer/standard_skin/Run", 8),
    attack:  loadEntityAnimation("src/assets/GandalfHardcore Archer/standard_skin/Attack", 11),
    takeHit: loadEntityAnimation("src/assets/GandalfHardcore Archer/standard_skin/Take_Hit", 5),
    death:   loadEntityAnimation("src/assets/GandalfHardcore Archer/standard_skin/Death", 6),
    jump:    null
  };

  const botSprites = {
    idle:    loadEntityAnimation("src/assets/GandalfHardcore Archer/black_skin/Idle", 5),
    run:     loadEntityAnimation("src/assets/GandalfHardcore Archer/black_skin/Run", 8),
    attack:  loadEntityAnimation("src/assets/GandalfHardcore Archer/black_skin/Attack", 11),
    takeHit: loadEntityAnimation("src/assets/GandalfHardcore Archer/black_skin/Take_Hit", 5),
    death:   loadEntityAnimation("src/assets/GandalfHardcore Archer/black_skin/Death", 6),
    jump:    null
  };

  const BOT_AI = {
    idealMin: 260,
    idealMax: 520,
    maxEngage: 900,
    aimTolerance: 20,
    potionThreshold: 0.42,
    dodgeChance: 0.5,
    dodgeCooldown: 1.2,
    reactionMin: 0.35,
    reactionMax: 0.6,
    speed: 250
  };
 
  function makePlayer() {
    return {
      x: 192,
      y: 558,
      w: 36,
      h: 56,
      vx: 0,
      vy: 0,
      facing: 1,
      grounded: false,
      coyote: 0,
      hp: 120,
      maxHp: 120,
      potions: 3,
      orbs: 0,
      bow: 1,
      armor: 1,
      attackCooldown: 0,
      attackTime: 0,
      hurtTime: 0,
      animation: "idle",
      dead: false,
      deathTimer: 0,
      animationFinished: false,
      arrowFired: false,
      frame: 0,
      frameTimer: 0,
      speedMultiplier: 1,
      attackMultiplier: 1,
      hasLifeBuff: false,
      hasSpeedBuff: false,
      hasAttackBuff: false
    };
  }

  function makeBot() {
    const w = 36, h = 56;
    return {
      isBot: true,
      type: "bot",
      x: world.width - 92 - w,
      y: world.platforms[0].y - h,
      w: w,
      h: h,
      vx: 0,
      vy: 0,
      facing: -1,
      grounded: false,
      coyote: 0,
      jumpCooldown: 0,
      hp: 120,
      maxHp: 120,
      potions: 3,
      bow: 1,
      armor: 1,
      value: 0,
      attackCooldown: 0,
      attackTime: 0,
      hurtTime: 0,
      arrowFired: false,
      animation: "idle",
      dead: false,
      deathHold: 0,
      animationFinished: false,
      frame: 0,
      frameTimer: 0,
      strafeDir: 1,
      strafeTimer: 0,
      dodgeCooldown: 0,
      reactionTimer: 0,
      sprites: botSprites,
      drawSize: 96,
      drawOffsetY: 0
    };
  }

  function spawnBot() {
    const bot = makeBot();
    state.enemies.push(bot);
    state.duelBot = bot;
  }
 
  function resetGame(mode) {
    stopMenuMusic();
    world.mode = mode || world.mode || "survival";
    playMatchMusic(world.mode);
    state.player = makePlayer();
    state.enemies = [];
    state.arrows = [];
    state.orbs = [];
    state.orbsCollected = 0;
    state.potions = [];
    state.potionsUsed = 0;
    state.particles = [];
    state.kills = 0;
    state.duelBot = null;
    world.elapsed = 0;
    world.spawnTimer = 0.5;
    world.shake = 0;
    world.cameraX = 0;
    world.cameraY = 0;
    world.paused = false;
    world.running = true;
    world.gameOver = false;

    // Configuração inicial das Hordas
    state.currentWave = 1;
    state.wavesDefeated = 0;
    state.waveState = "START";
    state.waveEnemiesToSpawn = 5;
    state.waveEnemiesSpawned = 0;
    state.waveTimer = 1.0;

    if (world.mode === "survival") {
        showWaveMessage("Horda 1", 3.0);
    }

    world.countdown = (world.mode === "duel") ? 3.0 : 0;
    startScreen.classList.add("hidden");
    gameOverOverlay.classList.add("hidden");
    gameOverModal.classList.add("hidden");
    pauseScreen.classList.add("hidden");
    document.body.classList.toggle("duel-mode", world.mode === "duel");

    if (world.mode === "duel") {
      spawnBot();
    }
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
 
  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
 
  function enemyAttackBox(enemy) {
    const reach = enemy.attackReach;
    return {
      x: enemy.facing > 0 ? enemy.x + enemy.w - 4 : enemy.x - reach + 4,
      y: enemy.y + 8,
      w: reach,
      h: enemy.h - 12
    };
  }
 
  function center(entity) {
    return { x: entity.x + entity.w / 2, y: entity.y + entity.h / 2 };
  }
 
  function updateCamera() {
    const player = state.player;
    if (!player) return;
    const targetX = player.x + player.w / 2 - world.viewWidth / 2;
    world.cameraX = clamp(targetX, 0, world.width - world.viewWidth);
    world.cameraY = 0;
  }
 
  function shouldEnemyJump(enemy, player) {
      // Positivo se o jogador estiver acima do inimigo
      const verticalGap = (enemy.y + enemy.h) - (player.y + player.h);
      
      // Jogador no mesmo nível ou abaixo
      if (verticalGap < 48) return false;

      const horizontalGap = Math.abs((player.x + player.w / 2) - (enemy.x + enemy.w / 2));

      // Se estiver no alcance de pulo direto até o jogador
      if (verticalGap <= 230 && horizontalGap < 320) return true;

      // Se o jogador estiver muito alto, pula se houver qualquer plataforma intermediária acima
      for (const platform of world.platforms) {
          const diffY = enemy.y - platform.y;
          const platformAbove = diffY > 40 && diffY < 180;
          const enemyUnderPlatform = (enemy.x + enemy.w > platform.x - 30) && (enemy.x < platform.x + platform.w + 30);

          if (platformAbove && enemyUnderPlatform) {
              return true;
          }
      }

      return false;
  }

  function getPlatformUnder(entity) {
    for (const p of world.platforms) {
        const onPlatform =
            entity.x + entity.w > p.x &&
            entity.x < p.x + p.w &&
            Math.abs(entity.y + entity.h - p.y) < 4;
        if (onPlatform) return p;
    }
    return null;
  }

  // Encontra a próxima plataforma "degrau" que o inimigo deveria usar para
  // se aproximar da altura do jogador, escolhendo sempre o próximo nível
  // acima (não pulando etapas) e, entre as opções desse nível, a mais
  // próxima horizontalmente do inimigo. Retorna null se o inimigo já está
  // no mesmo nível do jogador (ou mais alto) ou se não há nenhuma
  // plataforma intermediária cadastrada nesse trecho.
  function findNextStepPlatform(enemy, player) {
      const currentPlatform = getPlatformUnder(enemy);
      const currentY = currentPlatform ? currentPlatform.y : world.floor;

      const playerPlatform = getPlatformUnder(player);
      const targetY = playerPlatform ? playerPlatform.y : (player.y + player.h);

      // Já está no mesmo nível do jogador (ou mais alto): não precisa subir
      if (targetY >= currentY - 10) return null;

      // Plataformas entre o nível atual do inimigo e o nível do jogador
      const candidates = world.platforms.filter(
          (p) => p !== currentPlatform && p.y < currentY - 10 && p.y >= targetY - 10
      );

      if (!candidates.length) return null;

      // O próximo degrau é o mais baixo (maior y) dentre os que estão acima
      let nextY = -Infinity;
      for (const p of candidates) {
          if (p.y > nextY) nextY = p.y;
      }
      const sameLevel = candidates.filter((p) => Math.abs(p.y - nextY) < 4);

      // Entre as plataformas desse degrau, escolhe a mais próxima do inimigo
      const enemyCenterX = enemy.x + enemy.w / 2;
      let best = null;
      let bestDist = Infinity;
      for (const p of sameLevel) {
          const margin = Math.min(24, p.w / 3);
          const targetX = clamp(enemyCenterX, p.x + margin, p.x + p.w - margin);
          const dist = Math.abs(targetX - enemyCenterX);
          if (dist < bestDist) {
              bestDist = dist;
              best = { platform: p, targetX };
          }
      }
      return best;
  }

  function chooseEnemyType(wave){
      const currentWave = wave || state.currentWave || 1;
      const availableEnemies = [];

      for(const type in enemyTypes){
          const enemy = enemyTypes[type];
          if(currentWave >= (enemy.spawn.minWave || 1)){
              const weight = enemy.spawn.weight(currentWave);
              if(weight > 0){
                  availableEnemies.push({ type, weight });
              }
          }
      }

      let totalWeight = 0;
      for(const enemy of availableEnemies){
          totalWeight += enemy.weight;
      }

      if (totalWeight <= 0) return "mushroom";

      let random = Math.random() * totalWeight;
      for(const enemy of availableEnemies){
          random -= enemy.weight;
          if(random <= 0){
              return enemy.type;
          }
      }

      return "mushroom";
  }
 
  function spawnEnemy(){
    const type = chooseEnemyType(state.currentWave);
    const data = enemyTypes[type];
    const isFlying = !!data.flying;
    const spawnOffset = 40;

    const enemyWidth = data.size.width;
    const enemyHeight = data.size.height;

    let spawnX, spawnY, spawnFacing;

    if(isFlying){
        const edge = Math.floor(Math.random()*3);
        if(edge === 0){
            spawnX = -enemyWidth - spawnOffset;
            spawnY = 40 + Math.random()*(world.floor - enemyHeight - 80);
            spawnFacing = 1;
        } else if(edge === 1){
            spawnX = world.width + spawnOffset;
            spawnY = 40 + Math.random()*(world.floor - enemyHeight - 80);
            spawnFacing = -1;
        } else {
            spawnX = Math.random()*(world.width - enemyWidth);
            spawnY = -enemyHeight - spawnOffset;
            spawnFacing = Math.random() > 0.5 ? 1 : -1;
        }
    } else {
        const side = Math.random() > 0.5 ? 1 : -1;
        spawnX = side > 0 ? world.width + spawnOffset : -enemyWidth - spawnOffset;
        spawnY = world.platforms[0].y - enemyHeight;
        spawnFacing = side > 0 ? -1 : 1;
    }

    const enemy = {
        type: type,
        flying: isFlying,
        w: enemyWidth,
        h: enemyHeight,
        x: spawnX,
        y: spawnY,
        vx: 0,
        vy: 0,
        hp: data.stats.hp,
        maxHp: data.stats.hp,
        damage: data.stats.damage,
        speed: data.stats.speed,
        value: data.stats.value,
        facing: spawnFacing,
        attackTimer: 0,
        attacking: false,
        attackHit: false,
        dead: false,
        deathHold: 0,
        hurtTime: 0,
        grounded: false,
        jumpCooldown: 0,
        attackCooldown: data.stats.attackCooldown,
        baseJumpCooldown: data.stats.jumpCooldown,
        attackReach: data.stats.attackReach,
        animation: "run",
        frame: 0,
        frameTimer: 0,
        animationFinished: false,
        sprites: data.sprites,
        spriteSize: data.size.spriteSize,
        drawSize: data.size.drawSize,
        drawOffsetY: data.size.drawOffsetY || 0,
        takeHitSound: data.takeHitSound,
    };

    state.enemies.push(enemy);
  }
 
  function dropOrbs(enemy) {
    const n = enemy.value;
    for (let i = 0; i < n; i += 1) {
      state.orbs.push({
        x: enemy.x + enemy.w / 2,
        y: enemy.y + enemy.h / 2,
        w: 14,
        h: 14,
        vx: (Math.random() - 0.5) * 260,
        vy: -260 - Math.random() * 130,
        life: 100
      });
    }
  }
 
  function addParticles(x, y, color, count) {
    if (state.particles.length > 150) return;
    for (let i = 0; i < count; i += 1) {
      state.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 360,
        vy: -80 - Math.random() * 240,
        r: 2 + Math.random() * 3,
        color,
        life: 0.45 + Math.random() * 0.5
      });
    }
  }
 
  function removeAt(array, i) {
    array[i] = array[array.length - 1];
    array.pop();
  }
 
  function moveWithPlatforms(entity, dt) {
    entity.x += entity.vx*dt;
    if(entity === state.player || entity.isBot){
        entity.x = clamp(entity.x, 18, world.width - entity.w - 18);
    }

    entity.y += entity.vy*dt;
    entity.grounded = false;
 
    for (const p of world.platforms) {
      const wasAbove = entity.y + entity.h - entity.vy * dt <= p.y + 2;
      if (rectsOverlap(entity, p) && entity.vy >= 0 && wasAbove) {
        entity.y = p.y - entity.h;
        entity.vy = 0;
        entity.grounded = true;
        entity.coyote = 0.12;
      }
    }
 
    if (entity.y > world.height + 80) {
      if (entity === state.player) {
        entity.y = 120;
        entity.vy = 0;
        entity.x = world.width / 2;
        hurtPlayer(18);
      } else {
        entity.hp = 0;
      }
    }
  }
 
  function attack(){
    const player = state.player;
    if (!player || player.dead || world.countdown > 0 || !world.running || world.paused || world.gameOver) {
      return;
    }
 
    if(player.attackCooldown > 0) return;
 
    player.attackCooldown = 0.42;
    player.attackTime = 0.40;
    player.animation = "attack";
    player.frame = 0;
    player.frameTimer = 0;
    player.arrowFired = false;
  }
 
  function fireArrow(){
    const player = state.player;
    state.arrows.push({
        x: player.facing > 0 ? player.x + player.w + 2 : player.x - 30,
        y: player.y + 13,
        w: 30,
        h: 6,
        vx: player.facing * 820,
        damage: (22 + player.bow * 9) * (player.attackMultiplier || 1),
        life: 1.15,
        facing: player.facing,
        owner: "player"
    });
  }

  function fireBotArrow(bot){
    state.arrows.push({
        x: bot.facing > 0 ? bot.x + bot.w + 2 : bot.x - 30,
        y: bot.y + 13,
        w: 30,
        h: 6,
        vx: bot.facing * 820,
        damage: 22 + bot.bow * 9,
        life: 1.15,
        facing: bot.facing,
        owner: "bot"
    });
    playSfx(sounds.attack);
  }
 
  function hurtPlayer(amount) {
    const player = state.player;
    if (!player || player.hurtTime > 0 || player.dead || world.gameOver) return;
    const blocked = Math.max(0, amount - (player.armor - 1) * 3);
    const finalDamage = Math.max(3, blocked);
    player.hp -= finalDamage;
    player.hurtTime = 0.55;
    world.shake = 0.16;

    if (player.hp <= 0) {
        playSfx(sounds.death);
        player.hp = 0;
        player.dead = true;
        player.vx = 0;
        player.deathTimer = 6 * 0.40;
    } else {
        playSfx(sounds.takeHit);
    }
  }
  
  function usePotion() {
    const player = state.player;
    if (!player || player.potions <= 0 || player.hp >= player.maxHp) return;
    player.potions -= 1;
    player.hp = Math.min(player.maxHp, player.hp + 55);
    state.potionsUsed += 1;
    playSfx(sounds.heal);
    addParticles(player.x + player.w / 2, player.y + 20, "#75d16f", 16);
  }  

  // --- Sistema de Buffs (a cada 5 hordas derrotadas) --------------------
  const buffIcons = {
    life: new Image(),
    speed: new Image(),
    attack: new Image()
  };
  buffIcons.life.src = "src/assets/buffs/life_buff.png";
  buffIcons.speed.src = "src/assets/buffs/speed_buff.png";
  buffIcons.attack.src = "src/assets/buffs/attack_buff.png";

  const BUFF_TYPES = [
    { key: "life", message: "+40% de vida" },
    { key: "speed", message: "+20% velocidade de movimento" },
    { key: "attack", message: "+40% de ataque" }
  ];

  function grantRandomBuff() {
    const player = state.player;
    if (!player) return;

    const buff = BUFF_TYPES[Math.floor(Math.random() * BUFF_TYPES.length)];

    if (buff.key === "life") {
        const bonus = player.maxHp * 0.4;
        player.maxHp += bonus;
        player.hp = Math.min(player.maxHp, player.hp + bonus);
        player.hasLifeBuff = true;
    } else if (buff.key === "speed") {
        player.speedMultiplier = (player.speedMultiplier || 1) * 1.2;
        player.hasSpeedBuff = true;
    } else if (buff.key === "attack") {
        player.attackMultiplier = (player.attackMultiplier || 1) * 1.4;
        player.hasAttackBuff = true;
    }

    showBuffMessage(buff.message);
    addParticles(player.x + player.w / 2, player.y + 20, "#e4b15d", 20);
  }
 
  function togglePause(forceOpen) {
    if (!world.running || world.gameOver) return;
    const open = forceOpen === undefined ? pauseScreen.classList.contains("hidden") : forceOpen;
    pauseScreen.classList.toggle("hidden", !open);
    world.paused = open;
  }

  let footstepTimer = 0;

  function updatePlayer(dt) {
      const player = state.player;

      player.attackCooldown = Math.max(0, player.attackCooldown - dt);
      player.attackTime = Math.max(0, player.attackTime - dt);
      player.hurtTime = Math.max(0, player.hurtTime - dt);
      player.coyote = Math.max(0, player.coyote - dt);

      if (!player.dead) {
          const left = keys.ArrowLeft || keys.KeyA;
          const right = keys.ArrowRight || keys.KeyD;
          const jump = keys.ArrowUp || keys.KeyW || keys.Space;
          const speed = 305 * (player.speedMultiplier || 1);

          if (left && !right) {
            player.vx = -speed;
            player.facing = -1;
          } else if (right && !left) {
            player.vx = speed;
            player.facing = 1;
          } else {
            player.vx *= Math.pow(0.0008, dt);
            if (Math.abs(player.vx) < 2) player.vx = 0;
          }

          if (jump && !player.jumpHeld && (player.grounded || player.coyote > 0)) {
            player.vy = -PLAYER_JUMP_SPEED;
            playSfx(sounds.jump);
            player.grounded = false;
            player.coyote = 0;
          }

          player.jumpHeld = jump;

          if (player.grounded && Math.abs(player.vx) > 10) {
              footstepTimer += dt;
              if (footstepTimer >= 0.25) {
                  playSfx(sounds.run);
                  footstepTimer = 0;
              }
          } else {
              footstepTimer = 0;
          }

      } else {
          player.vx = 0;
      }

      player.vy += world.gravity * dt;
      moveWithPlatforms(player, dt);

      const oldAnimation = player.animation;

      if (player.dead) {
          player.animation = "death";
      } else if (player.hurtTime > 0) {
          player.animation = "takeHit";
      } else if (player.attackTime > 0) {
          player.animation = "attack";
      } else if (!player.grounded) {
          player.animation = playerSprites.jump ? "jump" : "run";
      } else if (Math.abs(player.vx) > 10) {
          player.animation = "run";
      } else {
          player.animation = "idle";
      }

      if (oldAnimation !== player.animation) {
          player.frame = 0;
          player.frameTimer = 0;
          player.animationFinished = false;
      }

      const frameDuration =
          player.animation === "attack" ? 0.036 :
          player.animation === "death" ? 0.40 : 0.12;

      player.frameTimer += dt;

      if (player.animation === "attack" && player.attackTime <= 0.08 && !player.arrowFired) {
          fireArrow(); 
          playSfx(sounds.attack);
          player.arrowFired = true;
      }

      if (player.frameTimer > frameDuration) {
          player.frame++;
          const maxFrames = playerSprites[player.animation].frameCount;

          if (player.frame >= maxFrames) {
            if (player.animation === "death" || player.animation === "takeHit") {
                player.frame = maxFrames - 1;
                player.animationFinished = true;
            } else {
                player.frame = 0;
            }
          }
          player.frameTimer = 0;
      }
  }
 
  function changeEnemyAnimation(enemy, newAnimation){
      if(enemy.animation === newAnimation) return;
      enemy.animation = newAnimation;
      enemy.frame = 0;
      enemy.frameTimer = 0;
      enemy.animationFinished = false;
  }
 
  function detectIncomingArrow(bot) {
    for (const arrow of state.arrows) {
      if (arrow.owner === "bot") continue;
      const approaching = (arrow.facing > 0 && arrow.x < bot.x) || (arrow.facing < 0 && arrow.x > bot.x);
      if (!approaching) continue;

      const dist = Math.abs((arrow.x + arrow.w / 2) - (bot.x + bot.w / 2));
      const verticalAligned = Math.abs((arrow.y + arrow.h / 2) - (bot.y + bot.h / 2)) < 40;

      if (verticalAligned && dist < 260) return arrow;
    }
    return null;
  }

  let botFootstepTimer = 0;

  function updateBotAI(bot, dt) {
    const player = state.player;

    bot.attackCooldown = Math.max(0, bot.attackCooldown - dt);
    bot.attackTime = Math.max(0, bot.attackTime - dt);
    bot.hurtTime = Math.max(0, bot.hurtTime - dt);
    bot.coyote = Math.max(0, bot.coyote - dt);
    bot.jumpCooldown = Math.max(0, bot.jumpCooldown - dt);
    bot.reactionTimer = Math.max(0, bot.reactionTimer - dt);
    bot.dodgeCooldown = Math.max(0, bot.dodgeCooldown - dt);

    if (!player || player.dead) {
      bot.vx *= Math.pow(0.0008, dt);
      if (Math.abs(bot.vx) < 2) bot.vx = 0;
      bot.vy += world.gravity * dt;
      moveWithPlatforms(bot, dt);
      advanceBotAnimation(bot, dt);
      return;
    }

    const botCenter = center(bot);
    const playerCenter = center(player);
    const dx = playerCenter.x - botCenter.x;
    const dy = playerCenter.y - botCenter.y;
    const dist = Math.abs(dx);

    bot.facing = dx >= 0 ? 1 : -1;

    let wantJump = false;
    let moveDir = 0;

    const incoming = bot.dodgeCooldown <= 0 ? detectIncomingArrow(bot) : null;

    if (incoming) {
      bot.dodgeCooldown = BOT_AI.dodgeCooldown; 
      if (Math.random() < BOT_AI.dodgeChance) {
        if (bot.grounded || bot.coyote > 0) wantJump = true;
        moveDir = -Math.sign(incoming.facing);
      } else {
        moveDir = dist < BOT_AI.idealMin ? (dx >= 0 ? -1 : 1) : (dx > BOT_AI.idealMax ? (dx >= 0 ? 1 : -1) : 0);
      }
    } else {
      if (dist < BOT_AI.idealMin) {
        moveDir = dx >= 0 ? -1 : 1;
      } else if (dist > BOT_AI.idealMax) {
        moveDir = dx >= 0 ? 1 : -1;
      } else {
        bot.strafeTimer -= dt;
        if (bot.strafeTimer <= 0) {
          bot.strafeDir = Math.random() < 0.5 ? -1 : 1;
          bot.strafeTimer = 0.5 + Math.random() * 0.8;
        }
        moveDir = bot.strafeDir * 0.4;
      }

      if (bot.grounded && bot.jumpCooldown <= 0 && shouldEnemyJump(bot, player)) {
        wantJump = true;
        bot.jumpCooldown = 0.9;
      }
    }

    bot.vx = moveDir * BOT_AI.speed;

    if (bot.grounded && Math.abs(bot.vx) > 10) {
        botFootstepTimer += dt;
        if (botFootstepTimer >= 0.25) {
            playSfx(sounds.run);
            botFootstepTimer = 0;
        }
    } else {
        botFootstepTimer = 0;
    }

    if (wantJump && (bot.grounded || bot.coyote > 0)) {
      bot.vy = -PLAYER_JUMP_SPEED;
      playSfx(sounds.jump);
      bot.grounded = false;
      bot.coyote = 0;
    }

    const aligned = Math.abs(dy) < BOT_AI.aimTolerance;

    if (
      bot.attackCooldown <= 0 &&
      bot.reactionTimer <= 0 &&
      bot.attackTime <= 0 &&
      aligned &&
      dist < BOT_AI.maxEngage
    ) {
      bot.attackCooldown = 0.80 + Math.random() * 0.40;
      bot.attackTime = 0.40;
      bot.animation = "attack";
      bot.frame = 0;
      bot.frameTimer = 0;
      bot.arrowFired = false;
      bot.reactionTimer = BOT_AI.reactionMin + Math.random() * (BOT_AI.reactionMax - BOT_AI.reactionMin);
    }

    if (bot.hp / bot.maxHp < BOT_AI.potionThreshold && bot.potions > 0 && bot.hurtTime <= 0) {
      bot.potions -= 1;
      bot.hp = Math.min(bot.maxHp, bot.hp + 55);
      playSfx(sounds.heal);
      addParticles(bot.x + bot.w / 2, bot.y + 20, "#75d16f", 16);
    }

    bot.vy += world.gravity * dt;
    moveWithPlatforms(bot, dt);
    advanceBotAnimation(bot, dt);
  }

  function advanceBotAnimation(bot, dt) {
    const oldAnimation = bot.animation;

    if (bot.dead) {
      bot.animation = "death";
    } else if (bot.hurtTime > 0) {
      bot.animation = "takeHit";
    } else if (bot.attackTime > 0) {
      bot.animation = "attack";
    } else if (!bot.grounded) {
      bot.animation = bot.sprites.jump ? "jump" : "run";
    } else if (Math.abs(bot.vx) > 10) {
      bot.animation = "run";
    } else {
      bot.animation = "idle";
    }

    if (oldAnimation !== bot.animation) {
      bot.frame = 0;
      bot.frameTimer = 0;
      bot.animationFinished = false;
    }

    const frameDuration =
      bot.animation === "attack" ? 0.036 :
      bot.animation === "death" ? 0.40 : 0.12;

    bot.frameTimer += dt;

    if (bot.animation === "attack" && bot.attackTime <= 0.08 && !bot.arrowFired) {
      fireBotArrow(bot);
      bot.arrowFired = true;
    }

    if (bot.frameTimer > frameDuration) {
      bot.frame++;
      const maxFrames = bot.sprites[bot.animation].frameCount;

      if (bot.frame >= maxFrames) {
        if (bot.animation === "death" || bot.animation === "takeHit") {
          bot.frame = maxFrames - 1;
          bot.animationFinished = true;
        } else {
          bot.frame = 0;
        }
      }
      bot.frameTimer = 0;
    }
  }
 
  function updateEnemies(dt) {
      const player = state.player;

      for(const enemy of state.enemies){
          if(enemy.hp <= 0 && !enemy.dead){
              enemy.dead = true;
              enemy.vx = 0;
              enemy.deathHold = 0.5;
              enemy.orbsDropped = false;
          }

          if(enemy.dead){
              enemy.vy += world.gravity*dt;
              moveWithPlatforms(enemy, dt);
              continue;
          }

          if(enemy.isBot){
              updateBotAI(enemy, dt);
              continue;
          }

          enemy.attackTimer = Math.max(0, enemy.attackTimer-dt);
          enemy.jumpCooldown = Math.max(0, enemy.jumpCooldown-dt);
          enemy.hurtTime = Math.max(0, enemy.hurtTime-dt);

          if(enemy.flying){
              const dxToPlayer = (player.x + player.w/2) - (enemy.x + enemy.w/2);
              const dyToPlayer = (player.y + player.h/2) - (enemy.y + enemy.h/2);
              const distToPlayer = Math.hypot(dxToPlayer, dyToPlayer) || 1;

              enemy.vx = (dxToPlayer/distToPlayer)*enemy.speed;
              enemy.vy = (dyToPlayer/distToPlayer)*enemy.speed;

              if(Math.abs(dxToPlayer) > 6){
                  enemy.facing = Math.sign(dxToPlayer);
              }
          }
      else {
        const playerCenterX = player.x + player.w / 2;
        const enemyCenterX = enemy.x + enemy.w / 2;
        const dx = playerCenterX - enemyCenterX;

        // Altura relativa: positiva quando o jogador está ACIMA do inimigo (menor Y)
        const playerHeightAbove = (enemy.y + enemy.h) - (player.y + player.h);

        let targetDx = dx;

        // --- Histerese de modo vertical -------------------------------
        // Em vez de comparar "playerHeightAbove > limiar" a cada frame
        // (o que faz o inimigo trocar de comportamento — e de direção —
        // toda hora quando a diferença de altura oscila bem em cima do
        // limiar), guardamos o modo atual do inimigo e só trocamos de
        // modo quando a diferença ultrapassa uma margem de saída maior
        // do que a margem de entrada. Isso cria uma "zona morta" que
        // impede o comportamento de ficar alternando (vibrando).
        if (enemy.verticalMode === undefined) enemy.verticalMode = "direct";
        enemy.aiIdle = false;

        if (!enemy.grounded) {
            // No ar, sempre persegue a posição real do jogador.
            enemy.verticalMode = "direct";
        } else if (enemy.verticalMode === "climb") {
            if (playerHeightAbove < 50) enemy.verticalMode = "direct";
        } else if (enemy.verticalMode === "edge") {
            if (playerHeightAbove < 20) enemy.verticalMode = "direct";
        } else if (playerHeightAbove > 80) {
            enemy.verticalMode = "climb";
        } else if (playerHeightAbove > 40) {
            enemy.verticalMode = "edge";
        }

        if (enemy.verticalMode === "climb") {
            // Mira na plataforma-degrau mais próxima entre o nível atual do
            // inimigo e o nível do jogador. Recalcular a cada frame é barato
            // (poucas plataformas) e garante que, assim que o inimigo sobe
            // um nível, ele já passa a mirar automaticamente no próximo.
            const step = findNextStepPlatform(enemy, player);

            if (step) {
                const distToClimbTarget = step.targetX - enemyCenterX;

                if (Math.abs(distToClimbTarget) < 16) {
                    // Já está posicionado sob a plataforma-degrau: fica
                    // parado aqui esperando a janela de pulo (a checagem de
                    // shouldEnemyJump, mais abaixo, cuida de saltar assim
                    // que possível).
                    enemy.aiIdle = true;
                    targetDx = dx;
                } else {
                    targetDx = distToClimbTarget;
                }
            } else {
                // Não há degrau intermediário cadastrado nesse trecho: em
                // vez de ir para uma ponta fixa da sala (o que deixava o
                // inimigo "preso" longe de qualquer plataforma), ele apenas
                // se aproxima horizontalmente do jogador, aumentando a
                // chance de cair dentro do alcance de pulo direto.
                targetDx = dx;
                if (Math.abs(dx) < 20) enemy.aiIdle = true;
            }

            enemy.edgeSeekDir = undefined;
            enemy.edgeSeekY = undefined;
        } else {
            enemy.climbTargetX = undefined;

            if (enemy.verticalMode === "edge") {
                if (enemy.edgeSeekDir === undefined) {
                    const platform = getPlatformUnder(enemy);
                    if (platform) {
                        const distToLeftEdge = enemy.x - platform.x;
                        const distToRightEdge = (platform.x + platform.w) - (enemy.x + enemy.w);
                        enemy.edgeSeekDir = distToLeftEdge < distToRightEdge ? -1 : 1;
                        enemy.edgeSeekY = enemy.y;
                    }
                }

                if (enemy.edgeSeekDir !== undefined) {
                    if (Math.abs(enemy.y - enemy.edgeSeekY) > 1) {
                        enemy.edgeSeekDir = undefined;
                        enemy.edgeSeekY = undefined;
                        targetDx = dx;
                    } else {
                        targetDx = enemy.edgeSeekDir;
                    }
                }
            } else {
                enemy.edgeSeekDir = undefined;
                enemy.edgeSeekY = undefined;
                targetDx = dx;
            }
        }

        // --- Cooldown de troca de direção ------------------------------
        // Mesmo com a histerese acima, a posição do jogador (dx) pode
        // cruzar o zero repetidamente quando os dois estão próximos no
        // eixo X mas em alturas diferentes. Isso fazia o inimigo inverter
        // "facing" a cada frame (vibrar). Agora só aceitamos uma nova
        // direção se ela for consistente por um pequeno intervalo mínimo,
        // exceto na primeiríssima decisão do inimigo.
        enemy.facingChangeCooldown = Math.max(0, (enemy.facingChangeCooldown || 0) - dt);

        const desiredFacing = Math.abs(targetDx) > 6 ? Math.sign(targetDx) : enemy.facing;

        if (desiredFacing !== enemy.facing && enemy.facingChangeCooldown <= 0) {
            enemy.facing = desiredFacing;
            enemy.facingChangeCooldown = 0.18;
        }

        enemy.vx = enemy.aiIdle ? 0 : enemy.facing * enemy.speed;
    }

          if(enemy.attackTimer <= 0 && rectsOverlap(player, enemyAttackBox(enemy))){
              enemy.attackTimer = enemy.attackCooldown;
              enemy.attacking = true;
              enemy.attackHit = false;
          }

          if(!enemy.flying && enemy.grounded && enemy.jumpCooldown <= 0 && shouldEnemyJump(enemy,player)){
              enemy.vy = -ENEMY_JUMP_SPEED;
              enemy.grounded = false;
              enemy.jumpCooldown = enemy.baseJumpCooldown;
          }

          if(enemy.flying){
              enemy.x += enemy.vx*dt;
              enemy.y += enemy.vy*dt;
              enemy.y = clamp(enemy.y, 20, world.floor - enemy.h - 20);
              enemy.grounded = true;
          } else {
              enemy.vy += world.gravity*dt;
              moveWithPlatforms(enemy, dt);
          }
      }

      for(const enemy of state.enemies){
          if(enemy.isBot && !enemy.dead) continue;

          if(enemy.dead){
              changeEnemyAnimation(enemy, "death");
          } else if(enemy.hurtTime > 0){
              changeEnemyAnimation(enemy, "takeHit");
          } else if(enemy.attacking){
              changeEnemyAnimation(enemy, "attack");
          } else if(!enemy.grounded){
              if(enemy.sprites.jump){
                  changeEnemyAnimation(enemy, "jump");
              } else {
                  changeEnemyAnimation(enemy, "run");
              }
          } else {
              changeEnemyAnimation(enemy, "run");
          }

          const frameDuration =
          enemy.animation === "attack" ? 0.055 :
          enemy.animation === "death" ? (enemy.isBot ? 0.40 : 0.15) : 0.12;

          enemy.frameTimer += dt;

          if(enemy.frameTimer > frameDuration){
              enemy.frame++;
              const maxFrames = enemy.sprites[enemy.animation].frameCount;

              if(enemy.animation === "attack" && !enemy.attackHit && enemy.frame >= maxFrames - 2){
                  enemy.attackHit = true;
                  if(rectsOverlap(player, enemyAttackBox(enemy))){
                      hurtPlayer(enemy.damage);
                  }
              }

              if(enemy.animation === "death" && !enemy.orbsDropped && enemy.frame >= 1){
                  enemy.orbsDropped = true;
                  dropOrbs(enemy);
              }

              if(enemy.frame >= maxFrames){
                  if(enemy.animation === "takeHit" || enemy.animation === "attack" || enemy.animation === "death"){
                      enemy.animationFinished = true;
                      enemy.frame = maxFrames-1;
                      if(enemy.animation === "attack"){
                          enemy.attacking = false;
                      }
                  } else {
                      enemy.frame = 0;
                      enemy.animationFinished = true;
                  }
              }
              enemy.frameTimer = 0;
          }
      }

    for(let i=state.enemies.length-1; i>=0; i--){
        const enemy = state.enemies[i];
        if(enemy.dead && enemy.animationFinished){
            enemy.deathHold -= dt;
            if(enemy.deathHold <= 0){
                state.enemies.splice(i,1);
                if(enemy.isBot){
                    state.duelBot = null;
                } else {
                    state.kills += 1;
                }
            }
        }
    }
  }
 
  function updateArrows(dt) {
    for (const arrow of state.arrows) {
      arrow.life -= dt;
      arrow.x += arrow.vx * dt;
    }

    const player = state.player;
    const NONFATAL_TAKEHIT_CHANCE = 0.1;
 
    for (let i = state.arrows.length - 1; i >= 0; i -= 1) {
      const arrow = state.arrows[i];
      let remove = arrow.life <= 0 || arrow.x < -80 || arrow.x > world.width + 80;

      if (!remove && arrow.owner === "bot") {
        if (player && !player.dead && rectsOverlap(arrow, player)) {
          hurtPlayer(arrow.damage);
          remove = true;
        }
      } else if (!remove) {
        for (const enemy of state.enemies) {
          if (enemy.hp <= 0) continue;
          if (rectsOverlap(arrow, enemy)) {
            enemy.hp -= arrow.damage;
            const isFatal = enemy.hp <= 0;

            if (enemy.isBot) {
              if (isFatal) {
                playSfx(sounds.death);
              } else {
                playSfx(sounds.takeHit);
              }
            } else if (isFatal || Math.random() < NONFATAL_TAKEHIT_CHANCE) {
              playSfx(sounds[enemy.takeHitSound] || sounds.takeHit);
            }

            enemy.hurtTime = 0.6;
            enemy.vx += arrow.facing * 220;
            world.shake = 0.06;
            remove = true;
            break;
          }
        }
      }
      if (remove) removeAt(state.arrows, i);
    }
  }
 
  const POTION_ORB_COST = 20;

  function grantPotionsFromOrbs(player) {
    if (!player || world.mode === "duel") return;
    while (player.orbs >= POTION_ORB_COST) {
      player.orbs -= POTION_ORB_COST;
      player.potions += 1;
      addParticles(player.x + player.w / 2, player.y + 10, "#e4b15d", 14);
    }
  }

  function updateDrops(dt) {
    const player = state.player;
    for (const orb of state.orbs) {
      const dx = player.x + player.w / 2 - orb.x;
      const dy = player.y + player.h / 2 - orb.y;
      const d = Math.max(1, Math.hypot(dx, dy));
      if (d < 150) {
        orb.vx += (dx / d) * 900 * dt;
        orb.vy += (dy / d) * 900 * dt;
      } else {
        orb.vy += world.gravity * 0.45 * dt;
      }
      orb.x += orb.vx * dt;
      orb.y += orb.vy * dt;
      orb.vx *= Math.pow(0.08, dt);
      orb.vy *= Math.pow(0.2, dt);
      if (orb.y > world.floor) {
        orb.y = world.floor;
        orb.vy *= -0.35;
      }
    }
 
    for (let i = state.orbs.length - 1; i >= 0; i -= 1) {
      const orb = state.orbs[i];
      if (Math.hypot(player.x + player.w / 2 - orb.x, player.y + player.h / 2 - orb.y) < 34) {
        player.orbs += 1;
        state.orbsCollected++;
        removeAt(state.orbs, i);
      }
    }

    grantPotionsFromOrbs(player);
  }
 
  function updateParticles(dt) {
    for (const p of state.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 520 * dt;
    }
    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      if (state.particles[i].life <= 0) removeAt(state.particles, i);
    }
  }
 
  function update(dt) {
    if (!world.running || world.paused || world.gameOver) return;
    if (world.countdown > 0) {
      world.countdown -= dt;
      if (world.countdown < 0) world.countdown = 0;
      return;
    }

    world.elapsed += dt;
    world.spawnTimer -= dt;
    world.shake = Math.max(0, world.shake - dt);

    updateWaveBanner(dt);
    updateBuffBanner(dt);

    // Lógica do Modo Sobrevivência baseado em Hordas
    if (world.mode === "survival") {
        if (state.waveState === "START") {
            state.waveTimer -= dt;
            if (state.waveTimer <= 0) {
                state.waveState = "ACTIVE";
                world.spawnTimer = 0.5;
            }
        } else if (state.waveState === "ACTIVE") {
            const maxSimultaneous = Math.min(16, 5 + Math.floor(state.currentWave * 0.8));
            const spawnInterval = Math.max(0.5, 1.8 - state.currentWave * 0.08);

            if (state.waveEnemiesSpawned < state.waveEnemiesToSpawn) {
                if (world.spawnTimer <= 0 && state.enemies.length < maxSimultaneous) {
                    spawnEnemy();
                    state.waveEnemiesSpawned++;
                    world.spawnTimer = spawnInterval;
                }
            } else {
                // Horda gerada por completo -> verificar se todos foram derrotados
                if (state.enemies.length === 0) {
                    state.wavesDefeated = state.currentWave;
                    state.waveState = "COMPLETED";
                    state.waveTimer = 3.5; // Tempo de descanso / preparação entre hordas
                    showWaveMessage("Horda derrotada!", 3.0);

                    if (state.wavesDefeated > 0 && state.wavesDefeated % 5 === 0) {
                        grantRandomBuff();
                    }
                }
            }
        } else if (state.waveState === "COMPLETED") {
            state.waveTimer -= dt;
            if (state.waveTimer <= 0) {
                state.currentWave++;
                state.waveEnemiesToSpawn = 5 + Math.floor(state.currentWave * 2.5);
                state.waveEnemiesSpawned = 0;
                state.waveState = "START";
                state.waveTimer = 1.0;
                showWaveMessage(`Horda ${state.currentWave}`, 3.0);
            }
        }
    }

    updatePlayer(dt);
    updateArrows(dt);
    updateEnemies(dt);
    updateCamera();
    updateDrops(dt);
    updateParticles(dt);

    if (world.mode === "duel") {
        if (state.player.dead && state.player.animationFinished) {
            finishGame(false);
        } else if (!state.duelBot && !state.player.dead) {
            finishGame(true);
        }
    } else if (state.player.dead && state.player.animationFinished) {
        finishGame();
    }
  }
 
  function drawBackground() {
    ctx.drawImage(sprites.background, 0, 0, world.width, world.height);
  }
 
  function drawPlatforms(){
    if(!DEBUG) return;
    ctx.strokeStyle = "red";
    for(const p of world.platforms){
        ctx.strokeRect(p.x, p.y, p.w, p.h);
    }
  }
 
  function drawPlayer(player) {
      const anim = playerSprites[player.animation];
      if (!anim || !anim.ready || player.frame >= anim.frameCount) return;

      ctx.save();
      if (player.hurtTime > 0 && Math.floor(player.hurtTime * 24) % 2 === 0) ctx.globalAlpha = 0.55;
      ctx.translate(player.x + player.w / 2, player.y + player.h);
      ctx.scale(player.facing, 1);
      const drawSize = 96;
      ctx.drawImage(
          anim.image,
          anim.frameWidth * player.frame, 0, anim.frameWidth, anim.frameHeight,
          -drawSize / 2, -drawSize, drawSize, drawSize
      );
      ctx.restore();
  }
 
  function drawArrows() {
    for (const arrow of state.arrows) {
      ctx.save();
      ctx.translate(arrow.x + arrow.w / 2, arrow.y + arrow.h / 2);
      ctx.scale(arrow.facing, 1);
      ctx.drawImage(sprites.arrow, -arrow.w / 2, -arrow.h / 2, arrow.w, arrow.h);
      ctx.restore();
    }
  }
 
  function drawEnemy(enemy){
      const animation = enemy.sprites[enemy.animation];
      if(!animation || !animation.ready || enemy.frame >= animation.frameCount) return;

      const size = enemy.drawSize;
 
      if(DEBUG){
        ctx.strokeStyle = "red";
        ctx.strokeRect(enemy.x, enemy.y, enemy.w, enemy.h);
      }
 
      ctx.save();
      if(enemy.dead){
          ctx.globalAlpha = clamp((enemy.deathHold || 0) / 0.5, 0, 1);
      }
 
      ctx.translate(enemy.x + enemy.w/2, enemy.y + enemy.h + (enemy.drawOffsetY || 0));
      ctx.scale(enemy.facing, 1);
      ctx.drawImage(
          animation.image,
          animation.frameWidth * enemy.frame, 0,
          animation.frameWidth, animation.frameHeight,
          -size/2, -size, size, size
      );
      ctx.restore();

      if(enemy.isBot && !enemy.dead){
          const barW = 46;
          const barX = enemy.x + enemy.w/2 - barW/2;
          const barY = enemy.y - 14;
          drawBar(barX, barY, barW, 6, enemy.hp/enemy.maxHp, "#e84242");
      }
  }
 
  function drawDrops() {
    for (const orb of state.orbs) {
      ctx.fillStyle = "rgba(232,66,66,0.28)";
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e84242";
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
 
  function drawParticles() {
    for (const p of state.particles) {
      ctx.globalAlpha = clamp(p.life, 0, 1);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.r, p.r);
    }
    ctx.globalAlpha = 1;
  }

  const POTION_STATE_COUNT = 20;
  const potionStateIcons = [];
  for (let i = 0; i <= POTION_STATE_COUNT; i += 1) {
    const img = new Image();
    img.src = `src/assets/potion_states/potion_${i}.png`;
    potionStateIcons.push(img);
  }
 
  function drawHud() {
    const player = state.player;
    if (!player) return;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.42)";
    ctx.fillRect(22, 20, 370, 104);
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.strokeRect(22, 20, 370, 104);
 
    ctx.fillStyle = "#f4efe6";
    ctx.font = "700 18px Segoe UI, Arial";
    ctx.fillText("Vida: ", 35, 48);
    drawBar(82, 34, 230, 16, player.hp / player.maxHp, "#32CD32");
    ctx.fillStyle = "#f4efe6";
    ctx.font = "16px Times New Roman, Arial";
    ctx.fillText(Math.ceil(player.hp) + "/" + player.maxHp , 320, 48);
    
    const iconX = 38;
    const iconY = 60;
    const iconSize = 64;

    const orbState = clamp(Math.floor(player.orbs), 0, POTION_STATE_COUNT);
    const potionIcon = potionStateIcons[orbState];
    if (potionIcon && potionIcon.complete) {
      ctx.drawImage(potionIcon, iconX, iconY, iconSize, iconSize);
    }

    // Ícones dos buffs ativos, exibidos em fila à direita do ícone de poção
    const buffOrder = [
      { icon: buffIcons.life, active: player.hasLifeBuff },
      { icon: buffIcons.speed, active: player.hasSpeedBuff },
      { icon: buffIcons.attack, active: player.hasAttackBuff }
    ];
    const buffIconSize = 40;
    const buffGap = 10;
    const buffY = iconY + (iconSize - buffIconSize) / 2;
    let buffX = iconX + iconSize + 14;

    for (const b of buffOrder) {
      if (!b.active) continue;
      if (b.icon.complete) {
        ctx.drawImage(b.icon, buffX, buffY, buffIconSize, buffIconSize);
      }
      buffX += buffIconSize + buffGap;
    }

    const textX = iconX;
    ctx.font = "bold 20px Times New Roman, Arial";
    ctx.fillText(player.potions, textX, 96);
 
    const t = Math.floor(world.elapsed);
    const min = String(Math.floor(t / 60)).padStart(2, "0");
    const sec = String(t % 60).padStart(2, "0");
    
    // Painel direito expandido para acomodar a contagem de Hordas
    ctx.fillStyle = "rgba(0,0,0,0.42)";
    ctx.fillRect(1070, 20, 188, 98);
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.strokeRect(1070, 20, 188, 98);

    ctx.fillStyle = "#f4efe6";
    ctx.font = "700 22px Segoe UI, Arial";
    ctx.fillText(min + ":" + sec, 1104, 48);

    ctx.font = "14px Segoe UI, Arial";
    ctx.fillText("Abates: " + state.kills, 1104, 72);

    if (world.mode === "survival") {
        ctx.fillStyle = "#e4b15d";
        ctx.fillText("Horda: " + state.currentWave, 1104, 94);
    }

    ctx.fillStyle = "rgba(0,0,0,0.44)";
    ctx.fillRect(398, 20, 466, 36);
    ctx.fillStyle = "#d8d2c8";
    ctx.font = "14px Segoe UI, Arial";
    ctx.fillText("A/D mover  |  W/Space pular  |  J disparar  |  ESC/P pausar", 418, 43);
    ctx.restore();
  }

  function drawCountdown() {
    if (world.countdown <= 0) return;

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.fillRect(0, 0, world.width, world.height);

    const seconds = Math.ceil(world.countdown);
    const text = seconds > 0 ? String(seconds) : "LUTE!";

    ctx.fillStyle = "#f4efe6";
    ctx.strokeStyle = "#e84242";
    ctx.lineWidth = 6;
    ctx.font = "900 72px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const centerX = world.width / 2;
    const centerY = world.height / 2 - 30;

    ctx.strokeText(text, centerX, centerY);
    ctx.fillText(text, centerX, centerY);

    ctx.font = "700 20px 'Segoe UI', Arial, sans-serif";
    ctx.fillStyle = "#d8d2c8";
    ctx.fillText("PREPARE-SE PARA O DUELO", centerX, centerY + 60);

    ctx.restore();
  }
 
  function drawBar(x, y, w, h, pct, color) {
    ctx.fillStyle = "#111";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w * clamp(pct, 0, 1), h);
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.strokeRect(x, y, w, h);
  }
 
  function draw() {
    ctx.save();
    const s = world.shake > 0 ? world.shake * 20 : 0;
    ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
    drawBackground();
    drawPlatforms();
    drawDrops();
    drawArrows();
    for (const enemy of state.enemies) drawEnemy(enemy);
    if (state.player) drawPlayer(state.player);
    drawParticles();
    ctx.restore();

    drawHud();
    drawWaveBanner();
    drawBuffBanner();
    drawCountdown();
  }
 
  function finishGame(victory) {
    world.gameOver = true;
    world.paused = true;
    pauseScreen.classList.add("hidden");

    if (currentMatchMusic) currentMatchMusic.volume = 0.12;

    gameOverOverlay.classList.remove("hidden");
    gameOverModal.classList.remove("hidden");

    const survived = Math.floor(world.elapsed);

    if (world.mode !== "duel" && survived > state.best) {
      state.best = survived;
      localStorage.setItem("EndlessDungeonBest", String(survived));
    }

    const min = String(Math.floor(survived / 60)).padStart(2, "0");
    const sec = String(survived % 60).padStart(2, "0");

    const titleEl = document.getElementById("gameOverTitle");
    if (titleEl) {
      if (world.mode === "duel") {
        titleEl.textContent = victory ? "Duelo Vencido!" : "Duelo Perdido";
      }
    }

    const statsEl = document.getElementById("finalStats");
    if (statsEl) {
      if (world.mode === "duel") {
        statsEl.innerHTML = victory
          ? `<p>Você derrotou o inimigo em <strong>${min}:${sec}</strong>.</p>`
          : `<p>O guerreiro inimigo venceu o duelo em <strong>${min}:${sec}</strong>.</p>`;
      } else {
        // MODO SOBREVIVÊNCIA COM CONTAGEM DE HORDAS DERROTADAS
        statsEl.innerHTML = `
          <p class="stats-header">Você morreu</p>
          <ul class="stats-list">
            <li><span>Tempo de sobrevivência:</span> <strong>${min}:${sec}</strong></li>
            <li><span>Hordas derrotadas:</span> <strong>${state.wavesDefeated || 0}</strong></li>
            <li><span>Inimigos derrotados:</span> <strong>${state.kills || 0}</strong></li>
            <li><span>Poções usadas:</span> <strong>${state.potionsUsed || 0}</strong></li>
          </ul>
        `;
      }
    }

    const modal = document.querySelector("#gameOverModal");
    if (modal) {
      modal.classList.remove("hidden");
      modal.style.display = "flex";
    }
  }
 
  let last = performance.now();
  const FIXED_DT = 1 / 90;
  let physicsAccumulator = 0;

  function loop(now) {
    const frameTime = Math.min(0.1, (now - last) / 1000);
    last = now;

    physicsAccumulator += frameTime;

    while (physicsAccumulator >= FIXED_DT) {
      update(FIXED_DT);
      physicsAccumulator -= FIXED_DT;
    }

    draw();
    requestAnimationFrame(loop);
  }
 
  window.addEventListener("keydown", function (event) {
    keys[event.code] = true;
    if (event.code === "KeyJ" || event.code === "ControlLeft") attack();
    if (event.code === "KeyP" || event.code === "Escape") togglePause();
    if (event.code === "Digit1") usePotion();
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].indexOf(event.code) >= 0) event.preventDefault();
  });
 
  window.addEventListener("keyup", function (event) {
    keys[event.code] = false;
  });

  function backToMenu() {
    world.running = false;
    world.paused = false;
    world.gameOver = false;

    gameOverOverlay.classList.add("hidden");
    gameOverModal.classList.add("hidden");
    pauseScreen.classList.add("hidden");
    startScreen.classList.remove("hidden");

    document.body.classList.remove("duel-mode");

    stopMatchMusic();
    resumeMenuMusic();
  }
 
  canvas.addEventListener("pointerdown", attack);
  
  ui.startGame.addEventListener("click", function () {
    triggerSceneTransition({
      onBlackout: () => resetGame("survival")
    });
  });

  ui.duelMode.addEventListener("click", function () {
    triggerSceneTransition({
      onBlackout: () => resetGame("duel")
    });
  });

  ui.backToMenu.addEventListener("click", function () {
    triggerSceneTransition({
      onBlackout: () => {
        world.running = false;
        world.paused = true;
        world.gameOver = false;
        gameOverOverlay.classList.add("hidden");
        startScreen.classList.remove("hidden");
        stopMatchMusic();
        resumeMenuMusic();
      }
    });
  });

  ui.restartGame.addEventListener("click", function () {
    triggerSceneTransition({
      onBlackout: () => resetGame(world.mode)
    });
  });

  function startIntro() {
    if (!menuMusicStarted) {
        menuMusicStarted = true;
        startMenuIntro();
    }
    window.removeEventListener("pointerdown", startIntro);
    window.removeEventListener("keydown", startIntro);
  }

  window.addEventListener("pointerdown", startIntro);
  window.addEventListener("keydown", startIntro);

  draw();
  requestAnimationFrame(loop);
}());