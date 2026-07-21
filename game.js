(function () {
  "use strict";
 
  const sprites = {
    player: new Image(),
    enemy: new Image(),
    arrow: new Image(),
    background: new Image()
  };
 
  sprites.player.src = "src/assets/GandalfHardcore Archer/GandalfHardcore Archer sheet.png";
  sprites.arrow.src = "src/assets/GandalfHardcore Archer/arrow.png";
  sprites.background.src = "src/assets/Background by GPT 5.5.png";
 
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.imageSmoothingEnabled = false;
  const inventoryEl = document.getElementById("inventory");
  const startScreen = document.getElementById("startScreen");
  const gameOverEl = document.getElementById("gameOver");
  const finalStatsEl = document.getElementById("finalStats");
  const DEBUG = false;
 
function loadEntityAnimation(path,frames){

    const animation = [];

    for(let i=1;i<=frames;i++){

        const image = new Image();

        image.src = `${path}/image_${i}.png`;

        animation.push(image);

    }

    return animation;

}

const enemyTypes = {

    mushroom:{

        stats:{

            hp:32,
            damage:10,
            speed:92,
            value:2,

            attackCooldown:0.78,
            jumpCooldown:0.70,
            attackReach:34

        },

        size:{

            width:38,
            height:48,
            spriteSize:64,
            drawSize:64

        },

        spawn:{

            minTime:0,

            weight(elapsedTime){

                if(elapsedTime < 40){

                    return 100;

                }

                if(elapsedTime < 120){

                    return 75;

                }

                if(elapsedTime < 240){

                    return 50;

                }

                return 30;

            }

        },

        sprites:{

            run:loadEntityAnimation(

                "src/assets/Mushroom/Run",

                8

            ),

            attack:loadEntityAnimation(

                "src/assets/Mushroom/Attack",

                8

            ),

            takeHit:loadEntityAnimation(

                "src/assets/Mushroom/Take_Hit",

                4

            ),

            death:loadEntityAnimation(

                "src/assets/Mushroom/Death",

                4

            ),

            jump:null

        }

    },


    weaselFisherman:{

        stats:{

            hp:64,
            damage:15,
            speed:105,
            value:4,

            attackCooldown:0.65,
            jumpCooldown:0.60,
            attackReach:40

        },

        size:{

            width:42,
            height:54,
            spriteSize:160,
            drawSize:160,
            drawOffsetY:50

        },

        spawn:{

            minTime:40,

            weight(elapsedTime){

                if(elapsedTime < 40){

                    return 0;

                }

                if(elapsedTime < 120){

                    return 25;

                }

                if(elapsedTime < 240){

                    return 50;

                }

                return 70;

            }

        },

        sprites:{

            run:loadEntityAnimation(

                "src/assets/Weasel_Fisherman/Run",

                8

            ),

            attack:loadEntityAnimation(

                "src/assets/Weasel_Fisherman/Attack",

                7

            ),

            takeHit:loadEntityAnimation(

                "src/assets/Weasel_Fisherman/Take_Hit",

                4

            ),

            death:loadEntityAnimation(

                "src/assets/Weasel_Fisherman/Death",

                10

            ),

            jump:loadEntityAnimation(

                "src/assets/Weasel_Fisherman/Jump",

                6

            )

        }

    }

};
 
  const ui = {
    potionCount: document.getElementById("potionCount"),
    bowLevel: document.getElementById("bowLevel"),
    armorLevel: document.getElementById("armorLevel"),
    orbCount: document.getElementById("orbCount"),
 
    usePotion: document.getElementById("usePotion"),
    buyPotion: document.getElementById("buyPotion"),
 
    upgradeBow: document.getElementById("upgradeBow"),
    upgradeArmor: document.getElementById("upgradeArmor"),
 
    closeInventory: document.getElementById("closeInventory"),
    startGame: document.getElementById("startGame"),
    restartGame: document.getElementById("restartGame")
  };
 
  const keys = Object.create(null);
  const PLAYER_JUMP_SPEED = Math.round(860 * Math.sqrt(1.15));
  const ENEMY_JUMP_SPEED = 1000;
  const SPRITE_SIZE = 64;
  const HALF_SIZE = SPRITE_SIZE/2;
 
  const world = {
    width:canvas.width,
    height:canvas.height,
 
    viewWidth:canvas.width,
    viewHeight:canvas.height,
    cameraX: 0,
    cameraY: 0,
    gravity: 2200,
    floor: 635,
    paused: true,
    running: false,
    gameOver: false,
    elapsed: 0,
    spawnTimer: 0,
    potionTimer: 0,
    shake: 0,
    platforms:[
 
    //CHÃO
 
    {
        x:-100,
        y:614,
        w:1900,
        h:20
    },
 
 
    //PLATAFORMA ESQUERDA
 
    {
        x:180,
        y:425,
        w:320,
        h:20
    },
 
 
    //PLATAFORMA SUPERIOR
 
    {
        x:480,
        y:285,
        w:325,
        h:20
    },
 
 
    //PLATAFORMA DIREITA
 
    {
        x:780,
        y:427,
        w:315,
        h:20
    }
 
    ]
  };
 
  const state = {
    player: null,
    enemies: [],
    arrows: [],
    orbs: [],
    potions: [],
    particles: [],
    kills: 0,
    best: Number(localStorage.getItem("forjaRubraBest") || 0)
  }
  
  const playerSprites = {
    idle:    loadEntityAnimation("src/assets/GandalfHardcore Archer/standard_skin/Idle", 5),
    run:     loadEntityAnimation("src/assets/GandalfHardcore Archer/standard_skin/Run", 8),
    attack:  loadEntityAnimation("src/assets/GandalfHardcore Archer/standard_skin/Attack", 11),
    takeHit: loadEntityAnimation("src/assets/GandalfHardcore Archer/standard_skin/Take_Hit", 5),
    death:   loadEntityAnimation("src/assets/GandalfHardcore Archer/standard_skin/Death", 6),
    jump:    null // ou carregar uma pasta "Jump" se existir, senão cai no fallback abaixo
};
 
  function makePlayer() {
    return {
      x: 192,
      y: 470,
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
      animationFinished: false,
      frame:0,
      frameTimer:0,
      attackCooldown:0,
      attackTime:0,
      hurtTime:0,
 
      arrowFired:false,
      frame:0,
      frameTimer:0
    };
  }
 
  function resetGame() {
    state.player = makePlayer();
    state.enemies = [];
    state.arrows = [];
    state.orbs = [];
    state.potions = [];
    state.particles = [];
    state.kills = 0;
    world.elapsed = 0;
    world.spawnTimer = 1.2;
    world.shake = 0;
    world.cameraX = 0;
    world.cameraY = 0;
    world.paused = false;
    world.running = true;
    world.gameOver = false;
    startScreen.classList.add("hidden");
    gameOverEl.classList.add("hidden");
    inventoryEl.classList.add("hidden");
    updateInventory();
  }
 
  function upgradeCost(level) {
    return 6 + level * 4;
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
    const verticalGap = enemy.y + enemy.h - (player.y + player.h);
    if (verticalGap < 48 || verticalGap > 230) return false;
    const horizontalGap = Math.abs(player.x + player.w / 2 - (enemy.x + enemy.w / 2));
    if (horizontalGap < 320) return true;
 
    for (const platform of world.platforms) {
      const playerOnPlatform = player.x + player.w > platform.x &&
        player.x < platform.x + platform.w &&
        Math.abs(player.y + player.h - platform.y) < 18;
      const enemyNearPlatform = enemy.x + enemy.w > platform.x - 70 &&
        enemy.x < platform.x + platform.w + 70;
      if (playerOnPlatform && enemyNearPlatform) return true;
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

function chooseEnemyType(){

    const elapsedTime =

    world.elapsed;


    const availableEnemies = [];


    for(const type in enemyTypes){

        const enemy =

        enemyTypes[type];


        if(

            elapsedTime >=

            enemy.spawn.minTime

        ){

            const weight =

            enemy.spawn.weight(

                elapsedTime

            );


            if(weight > 0){

                availableEnemies.push({

                    type,

                    weight

                });

            }

        }

    }


    let totalWeight = 0;


    for(const enemy of availableEnemies){

        totalWeight +=

        enemy.weight;

    }


    let random =

    Math.random()*totalWeight;


    for(const enemy of availableEnemies){

        random -= enemy.weight;


        if(random <= 0){

            return enemy.type;

        }

    }


    return "mushroom";

}
 
  function spawnEnemy(){

    const type = chooseEnemyType();

    const data = enemyTypes[type];

    const side =
    Math.random() > 0.5 ? 1 : -1;

    const spawnOffset = 40;

    const enemyWidth =
    data.size.width;

    const enemyHeight =
    data.size.height;

    const enemy = {

        type:type,

        w:enemyWidth,

        h:enemyHeight,

        x:

        side > 0 ?

        world.width + spawnOffset :

        -enemyWidth - spawnOffset,

        y:

        world.platforms[0].y -

        enemyHeight,

        vx:0,

        vy:0,

        hp:data.stats.hp,

        maxHp:data.stats.hp,

        damage:data.stats.damage,

        speed:data.stats.speed,

        value:data.stats.value,

        facing:

        side > 0 ? -1 : 1,

        attackTimer:0,

        attacking:false,

        attackHit:false,

        dead:false,

        deathHold:0,

        hurtTime:0,

        grounded:false,

        jumpCooldown:0,

        attackCooldown:

        data.stats.attackCooldown,

        baseJumpCooldown:

        data.stats.jumpCooldown,

        attackReach:

        data.stats.attackReach,

        animation:"run",

        frame:0,

        frameTimer:0,

        animationFinished:false,

        sprites:data.sprites,

        spriteSize:
        data.size.spriteSize,

        drawSize:
        data.size.drawSize,

        drawOffsetY: data.size.drawOffsetY || 0,

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
 
//  function addParticles(x, y, color, count) {
//    if (state.particles.length > 150) return;
//    for (let i = 0; i < count; i += 1) {
//      state.particles.push({
//        x,
//        y,
//        vx: (Math.random() - 0.5) * 360,
//       vy: -80 - Math.random() * 240,
//        r: 2 + Math.random() * 3,
//        color,
//        life: 0.45 + Math.random() * 0.5
//      });
//    }
//  }
 
  function removeAt(array, i) {
    array[i] = array[array.length - 1];
    array.pop();
  }
 
  function moveWithPlatforms(entity, dt) {
 
    entity.x += entity.vx*dt;
 
    // apenas o jogador fica preso no mapa
    if(entity === state.player){
 
        entity.x = clamp(
            entity.x,
            18,
            world.width - entity.w -18
        );
 
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
 
    if(!player || world.paused || world.gameOver)
        return;
 
    if(player.attackCooldown > 0)
        return;
 
    player.attackCooldown = 0.42;
    player.attackTime = 0.40;
 
    player.animation = "Attack";
 
    player.frame = 0;
    player.frameTimer = 0;
 
    player.arrowFired = false;
 
}
 
  function fireArrow(){
 
    const player = state.player;
 
    state.arrows.push({
 
        x: player.facing > 0 ?
            player.x + player.w + 2 :
            player.x - 30,
 
        y: player.y + 13,
 
        w:30,
        h:6,
 
        vx: player.facing*820,
 
        damage:22 + player.bow*9,
 
        life:1.15,
 
        facing:player.facing
 
    });
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
        player.hp = 0;
        player.dead = true;
        player.vx = 0;
    }
    }
  
  function usePotion() {
    const player = state.player;
    if (!player || player.potions <= 0 || player.hp >= player.maxHp) return;
    player.potions -= 1;
    player.hp = Math.min(player.maxHp, player.hp + 55);
    addParticles(player.x + player.w / 2, player.y + 20, "#75d16f", 16);
    updateInventory();
}  
 
  function buyPotion() {
 
    const player = state.player;
    const potionCost = 20;
 
    if (!player) return;
 
    if (player.orbs < potionCost)
        return;
 
    player.orbs -= potionCost;
    player.potions += 1;
 
    updateInventory();
 
}
 
  function tryUpgrade(kind) {
    const player = state.player;
    if (!player) return;
    const level = player[kind];
    const cost = upgradeCost(level);
    if (player.orbs < cost) return;
    player.orbs -= cost;
    player[kind] += 1;
    if (kind === "armor") {
      player.maxHp += 10;
      player.hp = Math.min(player.maxHp, player.hp + 10);
    }
    updateInventory();
  }
 
  function toggleInventory(forceOpen) {
    if (!world.running || world.gameOver) return;
    const open = forceOpen === undefined ? inventoryEl.classList.contains("hidden") : forceOpen;
    inventoryEl.classList.toggle("hidden", !open);
    world.paused = open;
    updateInventory();
  }
 
  function updateInventory() {
    const player = state.player || makePlayer();
    ui.potionCount.textContent = player.potions + (player.potions === 1 ? " disponivel" : " disponiveis");
    ui.bowLevel.textContent = "Nivel " + player.bow + " | dano +" + player.bow * 9;
    ui.armorLevel.textContent = "Nivel " + player.armor + " | vida " + player.maxHp;
    ui.orbCount.textContent = player.orbs + (player.orbs === 1 ? " orbe" : " orbes");
    ui.upgradeBow.textContent = "Aprimorar (" + upgradeCost(player.bow) + " orbes)";
    ui.upgradeArmor.textContent = "Aprimorar (" + upgradeCost(player.armor) + " orbes)";
    ui.usePotion.disabled = player.potions <= 0 || player.hp >= player.maxHp;
    ui.upgradeBow.disabled = player.orbs < upgradeCost(player.bow);
    ui.upgradeArmor.disabled = player.orbs < upgradeCost(player.armor);
    ui.buyPotion.disabled = player.orbs < 20;
}
 
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
        const speed = 305;

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
        player.grounded = false;
        player.coyote = 0;
        }

        player.jumpHeld = jump;
    } else {
        player.vx = 0;
    }

    player.vy += world.gravity * dt;
    moveWithPlatforms(player, dt);

    //-------------------
    // definição da animação
    //-------------------
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

    //-------------------
    // atualização dos frames
    //-------------------
    const frameDuration =
        player.animation === "attack" ? 0.036 :
        player.animation === "death" ? 0.40 :
        0.12;

    player.frameTimer += dt;

    if (
        player.animation === "attack" &&
        player.attackTime <= 0.08 &&
        !player.arrowFired
    ) {
        fireArrow();
        player.arrowFired = true;
    }

    if (player.frameTimer > frameDuration) {
        player.frame++;

        const maxFrames = playerSprites[player.animation].length;

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
 
  function changeEnemyAnimation(
 
    enemy,
 
    newAnimation
 
){
 
    if(
 
        enemy.animation ===
 
        newAnimation
 
    ){
 
        return;
 
    }
 
 
    enemy.animation =
 
    newAnimation;
 
 
    enemy.frame = 0;
 
    enemy.frameTimer = 0;
 
    enemy.animationFinished = false;
 
}
 
  function updateEnemies(dt) {
 
      const player = state.player;
 
      //------------------
      // IA, FISICA E ESTADO DE MORTE
      //------------------
 
      for(const enemy of state.enemies){
 
          if(enemy.hp <= 0 && !enemy.dead){
 
              enemy.dead = true;
              enemy.vx = 0;
              enemy.vy = 0;
              enemy.deathHold = 0.5;
              enemy.orbsDropped = false;
 
          }
 
          if(enemy.dead)
              continue;
 
 
          enemy.attackTimer =
          Math.max(0,enemy.attackTimer-dt);
 
          enemy.jumpCooldown =
          Math.max(0,enemy.jumpCooldown-dt);
 
          enemy.hurtTime =
          Math.max(0,enemy.hurtTime-dt);
 
 
          //------------------
          // IA do inimigo
          //------------------
 
          const dx =
              player.x + player.w/2 -
              (enemy.x + enemy.w/2);

              const verticalGapToPlayer =
              enemy.y + enemy.h - (player.y + player.h);

              let targetDx = dx;

              // já está comprometido com uma direção: só libera quando o Y mudar
              if(enemy.edgeSeekDir !== undefined){

                  if(Math.abs(enemy.y - enemy.edgeSeekY) > 1){

                      // caiu de verdade: libera o compromisso
                      enemy.edgeSeekDir = undefined;
                      enemy.edgeSeekY = undefined;

                      targetDx = dx;

                  }
                  else{

                      // ainda na mesma altura: mantém a direção comprometida
                      targetDx = enemy.edgeSeekDir;

                  }

              }
              // ainda não comprometido: verifica se precisa se comprometer agora
              else if(verticalGapToPlayer < -40 && enemy.grounded){

                  const platform = getPlatformUnder(enemy);

                  if(platform){

                      const distToLeftEdge = enemy.x - platform.x;
                      const distToRightEdge = (platform.x + platform.w) - (enemy.x + enemy.w);

                      enemy.edgeSeekDir = distToLeftEdge < distToRightEdge ? -1 : 1;
                      enemy.edgeSeekY = enemy.y;

                      targetDx = enemy.edgeSeekDir;

                  }

              }

              if(Math.abs(targetDx) > 6){
                  enemy.facing = Math.sign(targetDx);
              }

              enemy.vx =
              enemy.facing*enemy.speed;
 
 
          if(
 
              enemy.attackTimer <= 0 &&
 
              rectsOverlap(
                  player,
                  enemyAttackBox(enemy)
              )
 
          ){
 
              enemy.attackTimer =
              enemy.attackCooldown;
 
              enemy.attacking = true;
 
              enemy.attackHit = false;
 
          }
 
 
          if(
 
              enemy.grounded &&
 
              enemy.jumpCooldown <= 0 &&
 
              shouldEnemyJump(enemy,player)
 
          ){
 
              enemy.vy =
              -ENEMY_JUMP_SPEED;
 
              enemy.grounded = false;
 
              enemy.jumpCooldown =
              enemy.baseJumpCooldown;
 
          }
 
 
          enemy.vy +=
          world.gravity*dt;
 
          moveWithPlatforms(
              enemy,
              dt
          );
 
      }
 
 
      //------------------
      // ANIMAÇÕES
      //------------------
 
      for(const enemy of state.enemies){
 
          if(enemy.dead){

              changeEnemyAnimation(

                  enemy,

                  "death"

              );

          }


          else if(enemy.hurtTime > 0){

              changeEnemyAnimation(

                  enemy,

                  "takeHit"

              );

          }


          else if(enemy.attacking){

              changeEnemyAnimation(

                  enemy,

                  "attack"

              );

          }


          else if(!enemy.grounded){

              if(enemy.sprites.jump){

                  changeEnemyAnimation(

                      enemy,

                      "jump"

                  );

              }

              else{

                  changeEnemyAnimation(

                      enemy,

                      "run"

                  );

              }

          }


          else{

              changeEnemyAnimation(

                  enemy,

                  "run"

              );

          }
 
 
          const frameDuration =
 
          enemy.animation === "attack"
          ? 0.055
          : enemy.animation === "death"
          ? 0.15
          : 0.12;
 
 
          enemy.frameTimer += dt;
 
 
          if(enemy.frameTimer > frameDuration){
 
              enemy.frame++;
 
              const maxFrames =
 
              enemy.sprites[
                  enemy.animation
              ].length;
 
 
              if(
 
                  enemy.animation === "attack" &&
 
                  !enemy.attackHit &&
 
                  enemy.frame >= maxFrames - 2
 
              ){
 
                  enemy.attackHit = true;
 
                  if(
 
                      rectsOverlap(
                          player,
                          enemyAttackBox(enemy)
                      )
 
                  ){
 
                      hurtPlayer(enemy.damage);
 
                  }
 
              }
 
              if(
                  enemy.animation === "death" &&
                  !enemy.orbsDropped &&
                  enemy.frame >= 1
              ){
                  enemy.orbsDropped = true;
                  dropOrbs(enemy);
              }

              if(enemy.frame >= maxFrames){
 
 
                  if(
 
                      enemy.animation === "takeHit" ||
                      enemy.animation === "attack" ||
                      enemy.animation === "death"
 
                  ){
 
                      enemy.animationFinished = true;
 
                      enemy.frame =
 
                      maxFrames-1;

                      if(enemy.animation === "attack"){
                          enemy.attacking = false;
                          }
 
                  }
 
                  else{
 
                      enemy.frame = 0;
 
                      enemy.animationFinished = true;
 
                  }
 
              }
 
 
              enemy.frameTimer = 0;
 
          }
 
      }
 
 
    //------------------
    // MORTE (remoção apos animação)
    //------------------
 
    for(let i=state.enemies.length-1;
        i>=0;
        i--){
 
        const enemy =
        state.enemies[i];
 
 
        if(enemy.dead && enemy.animationFinished){
 
            enemy.deathHold -= dt;
 
            if(enemy.deathHold <= 0){
 
                state.enemies.splice(i,1);
 
                state.kills += 1;
 
            }
 
        }
 
    }
 
}
 
  function updateArrows(dt) {
    for (const arrow of state.arrows) {
      arrow.life -= dt;
      arrow.x += arrow.vx * dt;
    }
 
    for (let i = state.arrows.length - 1; i >= 0; i -= 1) {
      const arrow = state.arrows[i];
      let remove = arrow.life <= 0 || arrow.x < -80 || arrow.x > world.width + 80;
      if (!remove) {
        for (const enemy of state.enemies) {
          if (enemy.hp <= 0) continue;
          if (rectsOverlap(arrow, enemy)) {
            enemy.hp -= arrow.damage;
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
        removeAt(state.orbs, i);
      }
    }
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
    world.elapsed += dt;
    world.spawnTimer -= dt;
    world.shake = Math.max(0, world.shake - dt);

    const minutes = world.elapsed / 60;
    const spawnRate = Math.max(0.68, 2.1 - minutes * 0.2);
    const maxEnemies = Math.min(18, 5 + Math.floor(minutes * 3));
    if (world.spawnTimer <= 0 && state.enemies.length < maxEnemies) {
        spawnEnemy();
        world.spawnTimer = spawnRate;
    }

    updatePlayer(dt);
    updateArrows(dt);
    updateEnemies(dt);
    updateCamera();
    updateDrops(dt);
    updateParticles(dt);

    if (state.player.dead && state.player.animationFinished) {
        finishGame();
    }
    }
 
  function drawBackground() {
    ctx.drawImage(sprites.background, 0, 0, world.width, world.height);
  }
 
  function drawPlatforms(){
 
    if(!DEBUG)
        return;
 
    ctx.strokeStyle = "red";
 
    for(const p of world.platforms){
 
        ctx.strokeRect(
 
            p.x,
            p.y,
            p.w,
            p.h
 
        );
 
    }
 
}
 
    function drawPlayer(player) {
        const sprite = playerSprites[player.animation][player.frame];
        if (!sprite) return;

        ctx.save();
        if (player.hurtTime > 0 && Math.floor(player.hurtTime * 24) % 2 === 0) ctx.globalAlpha = 0.55;
        ctx.translate(player.x + player.w / 2, player.y + player.h);
        ctx.scale(player.facing, 1);
        const drawSize = 96;
        ctx.drawImage(sprite, -drawSize / 2, -drawSize, drawSize, drawSize);
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
 
      const animation =

          enemy.sprites[
              enemy.animation
          ];


          if(!animation){

              return;

          }


          const sprite =

          animation[
              enemy.frame
          ];
 
 
      const size = enemy.drawSize;
 
 
      if(DEBUG){
 
        ctx.strokeStyle = "red";
 
        ctx.strokeRect(
 
            enemy.x,
            enemy.y,
 
            enemy.w,
            enemy.h
 
        );
 
}
 
 
      ctx.save();
 
      if(enemy.dead){
 
          ctx.globalAlpha =
 
          clamp(
 
              (enemy.deathHold || 0) / 0.5,
 
              0,
 
              1
 
          );
 
      }
 
 
      ctx.translate(
 
          enemy.x + enemy.w/2,
 
          enemy.y + enemy.h + (enemy.drawOffsetY || 0)
 
      );
 
      ctx.scale(
 
        enemy.facing,
 
          1
 
      );
 
      ctx.drawImage(
 
          sprite,
 
          -size/2,
 
          -size,
 
          size,
 
          size
 
      );
 
 
      ctx.restore();
 
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
    ctx.fillText("Endless Dungeon", 38, 48);
    drawBar(38, 62, 230, 16, player.hp / player.maxHp, "#32CD32");
    ctx.fillStyle = "#f4efe6";
    ctx.font = "14px Segoe UI, Arial";
    ctx.fillText(Math.ceil(player.hp) + "/" + player.maxHp, 278, 75);
    ctx.fillText("Orbes: " + player.orbs + "   Frascos: " + player.potions, 38, 101);
 
    const t = Math.floor(world.elapsed);
    const min = String(Math.floor(t / 60)).padStart(2, "0");
    const sec = String(t % 60).padStart(2, "0");
    ctx.fillStyle = "rgba(0,0,0,0.42)";
    ctx.fillRect(1070, 20, 188, 76);
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.strokeRect(1070, 20, 188, 76);
    ctx.fillStyle = "#f4efe6";
    ctx.font = "700 22px Segoe UI, Arial";
    ctx.fillText(min + ":" + sec, 1104, 52);
    ctx.font = "14px Segoe UI, Arial";
    ctx.fillText("Abates: " + state.kills, 1104, 78);
 
    ctx.fillStyle = "rgba(0,0,0,0.44)";
    ctx.fillRect(398, 20, 466, 36);
    ctx.fillStyle = "#d8d2c8";
    ctx.font = "14px Segoe UI, Arial";
    ctx.fillText("A/D mover  |  W/Space pular  |  J disparar  |  I inventario", 418, 43);
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
  }
 
  function finishGame() {
    world.gameOver = true;
    world.paused = true;
    const survived = Math.floor(world.elapsed);
    if (survived > state.best) {
      state.best = survived;
      localStorage.setItem("forjaRubraBest", String(survived));
    }
    const min = Math.floor(survived / 60);
    const sec = String(survived % 60).padStart(2, "0");
    finalStatsEl.textContent = "Voce sobreviveu " + min + ":" + sec + " e derrotou " + state.kills + " monstros";
    gameOverEl.classList.remove("hidden");
  }
 
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
 
  window.addEventListener("keydown", function (event) {
    keys[event.code] = true;
    if (event.code === "KeyJ" || event.code === "ControlLeft") attack();
    if (event.code === "KeyI" || event.code === "Escape") toggleInventory();
    if (event.code === "Digit1") usePotion();
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].indexOf(event.code) >= 0) event.preventDefault();
  });
 
  window.addEventListener("keyup", function (event) {
    keys[event.code] = false;
  });
 
  canvas.addEventListener("pointerdown", attack);
  ui.usePotion.addEventListener("click", usePotion);
  ui.buyPotion.addEventListener("click", buyPotion);
  ui.upgradeBow.addEventListener("click", function () { tryUpgrade("bow"); });
  ui.upgradeArmor.addEventListener("click", function () { tryUpgrade("armor"); });
  ui.closeInventory.addEventListener("click", function () { toggleInventory(false); });
  ui.startGame.addEventListener("click", resetGame);
  ui.restartGame.addEventListener("click", resetGame);
 
  updateInventory();
  draw();
  requestAnimationFrame(loop);
}());