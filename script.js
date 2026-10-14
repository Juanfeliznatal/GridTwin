/* ==========================================================================
   VARIÁVEIS DE ESTADO GLOBAL E DOM
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    const bgMusic = document.getElementById('bg-music');
    const rainThunder = document.getElementById('rain-thunder');
    const lightningFlash = document.getElementById('lightning-flash');
    const startSound = document.getElementById('start-sound');
    const selectSound = document.getElementById('select-sound');

    // Inicia a música assim que o jogador clicar em qualquer lugar da página pela primeira vez
    document.body.addEventListener('click', () => {
        if (bgMusic) {
            bgMusic.volume = 0.3;
            bgMusic.play().catch(erro => {
                console.log("O navegador bloqueou a reprodução automática:", erro);
            });
        }
    }, { once: true });
    
    // DOM: Botões de navegação
    const btnStartMenu = document.getElementById('btn-start');
    const btnStartStorm = document.getElementById('btn-start-storm');
    const btnRestart = document.getElementById('btn-restart');
    const btnMenu = document.getElementById('btn-menu');

    // Efeito sonoro de clique no botão "Iniciar" (Tela 1)
    if (btnStartMenu) {
        btnStartMenu.addEventListener('click', () => {
            if (startSound) {
                startSound.volume = 0.4;
                startSound.currentTime = 0; 
                startSound.play();
            }
        });
    }

    // Estado do Jogo (Tela 2)
    let currentScreenId = 'screen-menu';
    const MAX_BUDGET = 8;
    let currentBudget = MAX_BUDGET;
    
    window.zoneLevels = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    window.selectedDifficulty = 'medium'; 
    const upgradeCosts = { 1: 1, 2: 1 }; 

    /* ==========================================================================
       1. CONTROLE DE NAVEGAÇÃO SPA
       ========================================================================== */
    window.showScreen = function(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.remove('hidden');
            currentScreenId = screenId;
        }

        if (screenId === 'screen-result') {
            renderResultScreen();
        }
    };

    /* ==========================================================================
       2. CONTROLE DE ÁUDIO E EFEITOS HERDADOS
       ========================================================================== */
    let isAudioAvailable = true;
    if (bgMusic) {
        bgMusic.volume = 0.4;
        bgMusic.addEventListener('error', () => {
            isAudioAvailable = false;
        });
    }

    const startAudio = () => {
        if (bgMusic && isAudioAvailable && bgMusic.paused) {
            bgMusic.play().catch(() => console.log("Aguardando interação..."));
        }
        document.removeEventListener('click', startAudio);
        document.removeEventListener('keydown', startAudio);
    };
    document.addEventListener('click', startAudio);
    document.addEventListener('keydown', startAudio);

    function triggerLightning() {
        if (!lightningFlash) return;

        const isPrepScreen = currentScreenId === 'screen-preparation';
        
        lightningFlash.style.setProperty('--flash-max-opacity', isPrepScreen ? '0.3' : '1');
        lightningFlash.classList.add('active');
        
        const flashDuration = Math.random() * (isPrepScreen ? 60 : 100) + 50;

        setTimeout(() => {
            lightningFlash.classList.remove('active');
        }, flashDuration);

        if (Math.random() > 0.6) {
            setTimeout(() => {
                lightningFlash.classList.add('active');
                setTimeout(() => {
                    lightningFlash.classList.remove('active');
                }, 40);
            }, flashDuration + 80);
        }

        const nextLightningIn = isPrepScreen 
            ? Math.random() * 5000 + 15000 
            : Math.random() * 7000 + 3000;
            
        setTimeout(triggerLightning, nextLightningIn);
    }
    setTimeout(triggerLightning, 2000);

    /* ==========================================================================
       3. LÓGICA DA TELA 2: SISTEMA DE ORÇAMENTO E SENSORES
       ========================================================================== */
    function updateBudgetDisplay() {
        const budgetRemainingEl = document.getElementById('budget-remaining');
        if (budgetRemainingEl) {
            budgetRemainingEl.textContent = currentBudget;
        }
    }

    function renderZoneCards() {
        for (let zoneId = 1; zoneId <= 6; zoneId++) {
            const level = window.zoneLevels[zoneId];
            const card = document.querySelector(`.zone-card[data-zone-id="${zoneId}"]`);
            
            if (!card) continue;

            card.setAttribute('data-level', level);
            const levelValueEl = card.querySelector('.level-value');
            if (levelValueEl) {
                levelValueEl.textContent = level;
            }

            const btnIncrease = card.querySelector('.btn-increase');
            const btnDecrease = card.querySelector('.btn-decrease');

            const costToNext = upgradeCosts[level + 1];
            
            if (btnIncrease) btnIncrease.disabled = (level >= 2) || (currentBudget < costToNext);
            if (btnDecrease) btnDecrease.disabled = (level <= 0);

            const indicator = card.querySelector('.zone-indicator');
            if (indicator) {
                if (level === 0) {
                    indicator.style.opacity = '0.3';
                    indicator.style.border = '1px solid var(--border-color, #475569)';
                } else if (level === 1) {
                    indicator.style.opacity = '0.7';
                    indicator.style.border = '1px solid #38bdf8';
                } else if (level === 2) {
                    indicator.style.opacity = '1';
                    indicator.style.border = '1px solid #5eead4';
                }
            }
        }
    }

    function updateSidebarStatus() {
        const listItems = document.querySelectorAll('.sidebar-status-item');
        listItems.forEach(item => {
            const zoneId = item.getAttribute('data-zone-id');
            const level = window.zoneLevels[zoneId];
            
            const zoneNames = {
                1: "Zona 1 — Centro",
                2: "Zona 2 — Porto",
                3: "Zona 3 — Distrito Industrial",
                4: "Zona 4 — Residencial Norte",
                5: "Zona 5 — Hospital",
                6: "Zona 6 — Aeroporto"
            };
            
            item.classList.remove('level-1', 'level-2');

            if (level === 0) {
                item.textContent = `${zoneNames[zoneId]}: SEM SENSOR — previsão indisponível`;
            } else if (level === 1) {
                item.textContent = `${zoneNames[zoneId]}: SENSOR NÍVEL 1 — telemetria básica ativa`;
                item.classList.add('level-1');
            } else if (level === 2) {
                item.textContent = `${zoneNames[zoneId]}: SENSOR NÍVEL 2 — monitoramento total em tempo real`;
                item.classList.add('level-2');
            }
        });
    }

    function allocateSensor(zoneId) {
        const currentLevel = window.zoneLevels[zoneId];
        if (currentLevel >= 2) return;
        
        const cost = upgradeCosts[currentLevel + 1];
        if (currentBudget >= cost) {
            currentBudget -= cost;
            window.zoneLevels[zoneId]++;
            
            updateBudgetDisplay();
            renderZoneCards();
            updateSidebarStatus();
        }
    }

    function deallocateSensor(zoneId) {
        const currentLevel = window.zoneLevels[zoneId];
        if (currentLevel <= 0) return;
        
        const refund = upgradeCosts[currentLevel];
        currentBudget += refund;
        window.zoneLevels[zoneId]--;
        
        updateBudgetDisplay();
        renderZoneCards();
        updateSidebarStatus();
    }

    function playSelectSound() {
        if (selectSound) {
            selectSound.volume = 0.4;
            selectSound.currentTime = 0;
            selectSound.play().catch(erro => console.log("Erro no som:", erro));
        }
    }

    document.querySelectorAll('.btn-increase').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const zoneId = e.currentTarget.getAttribute('data-zone-id');
            allocateSensor(zoneId);
            playSelectSound();
        });
    });

    document.querySelectorAll('.btn-decrease').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const zoneId = e.currentTarget.getAttribute('data-zone-id');
            deallocateSensor(zoneId);
            playSelectSound();
        });
    });

    document.querySelectorAll('.btn-diff').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetBtn = e.currentTarget;
            document.querySelectorAll('.btn-diff').forEach(b => b.classList.remove('active'));
            targetBtn.classList.add('active');
            window.selectedDifficulty = targetBtn.getAttribute('data-diff') || 'medium';
        });
    });

    /* ==========================================================================
       4. INTERAÇÕES DE TRANSIÇÃO E BOTÕES
       ========================================================================== */
    if (btnStartMenu) {
        btnStartMenu.addEventListener('click', () => {
            btnStartMenu.style.transform = 'scale(0.95)';
            setTimeout(() => {
                btnStartMenu.style.transform = 'scale(1)';
                window.showScreen('screen-preparation');
            }, 150);
        });
    }

    let warningActive = false;
    if (btnStartStorm) {
        btnStartStorm.addEventListener('click', () => {
            btnStartStorm.style.transform = 'scale(0.95)';
            
            setTimeout(() => {
                btnStartStorm.style.transform = 'scale(1)';
                
                const warningEl = document.getElementById('budget-warning');
                const unusedBudgetEl = document.getElementById('unused-budget');
                
                if (currentBudget > 0 && !warningActive) {
                    warningActive = true;
                    if (unusedBudgetEl) unusedBudgetEl.textContent = currentBudget;
                    if (warningEl) warningEl.classList.remove('hidden');
                    
                    setTimeout(() => {
                        warningActive = false;
                        if (warningEl) warningEl.classList.add('hidden');
                    }, 2500);
                } else {
                    if (warningEl) warningEl.classList.add('hidden');
                    
                    if (rainThunder) {
                        rainThunder.volume = 0.2;
                        rainThunder.play().catch(erro => console.log("Erro ao tocar a chuva:", erro));
                    }

                    window.showScreen('screen-game');
                    if (typeof initScreen3 === 'function') {
                        initScreen3();
                    }
                }
            }, 150);
        });
    }

    if (btnRestart) {
        btnRestart.addEventListener('click', () => {
            // Mantém o saldo e os sensores da partida anterior ao tentar novamente.
            renderZoneCards();
            updateSidebarStatus();
            updateBudgetDisplay();
            window.showScreen('screen-preparation');
            
            if (bgMusic) {
                bgMusic.currentTime = 0;
                bgMusic.play().catch(e => console.log(e));
            }
        });
    }

    if (btnMenu) {
        btnMenu.addEventListener('click', () => {
            window.showScreen('screen-menu');

            if (bgMusic) {
                bgMusic.currentTime = 0;
                bgMusic.play().catch(e => console.log(e));
            }
            if (rainThunder) rainThunder.pause();
        });
    }

    renderZoneCards();
    updateSidebarStatus();
    updateBudgetDisplay();
});

/* ======================================================================
   TELA 3 — TEMPESTADE (GAMEPLAY)
   ====================================================================== */

if (typeof window.zoneLevels === 'undefined') {
  window.zoneLevels = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
}

window.selectedDifficulty = window.selectedDifficulty || 'medium';

// Configurações dos Modos com Sistema de Pontuação e Penalidades Escalonados
const DIFFICULTY_SETTINGS = {
  easy: {
    growthPhases: [1.0, 1.78, 2.10],
    growthIntervalMs: 1700,
    cutCooldownMs: 2500,
    gracePeriodSec: 12,
    shieldCriticalBonusSec: 5,
    cutReduction: 15,
    generatorCooldownMs: 9000,
    generatorReduction: 52,
    surgeIntervalSec: 10,
    surgeImpact: 38,
    blackoutPenalty: 50,    // Penalidade por blackout no Fácil
    scoreMultiplier: 1.0    // Multiplicador do Fácil
  },
  medium: {
    // Médio: crescimento moderadamente elevado em cada fase; recargas e surtos preservados.
    growthPhases: [2.1, 3.1, 3.8],
    growthIntervalMs: 1500,
    cutCooldownMs: 1500,
    gracePeriodSec: 8,
    shieldCriticalBonusSec: 4,
    cutReduction: 17,
    generatorCooldownMs: 8000,
    generatorReduction: 50,
    surgeIntervalSec: 11,
    surgeImpact: 40,
    blackoutPenalty: 100,   // Penalidade por blackout no Médio
    scoreMultiplier: 1.25   // Multiplicador do Médio
  },
  hard: {
    // Difícil: crescimento moderadamente maior nas três fases.
    // Intervalos, recargas e demais regras permanecem inalterados.
    growthPhases: [2.9, 3.9, 4.6],
    growthIntervalMs: 1000,
    cutCooldownMs: 1500,
    gracePeriodSec: 5,
    shieldCriticalBonusSec: 3,
    cutReduction: 20,
    generatorCooldownMs: 6000,
    generatorReduction: 48,
    surgeIntervalSec: 13,
    surgeImpact: 42,
    blackoutPenalty: 150,   // Penalidade por blackout no Difícil
    scoreMultiplier: 1.5    // Multiplicador do Difícil
  }
};

const DIFFICULTY_LABELS = {
  easy: 'Fácil',
  medium: 'Médio',
  hard: 'Difícil'
};

const ZONE_NAMES = {
  1: "Zona 1 — Centro",
  2: "Zona 2 — Porto",
  3: "Zona 3 — Distrito Industrial",
  4: "Zona 4 — Residencial Norte",
  5: "Zona 5 — Hospital",
  6: "Zona 6 — Aeroporto"
};

// Topologia simplificada da rede: conexões físicas entre setores.
const GRID_CONNECTIONS = Object.freeze({
  1: [2, 4, 5], 2: [1, 3, 6], 3: [2, 6],
  4: [1, 5], 5: [1, 4, 6], 6: [2, 3, 5]
});
// Frente climática determinística por partida. O jogador pode antecipar o percurso.
const STORM_ROUTE = [2, 3, 6, 5, 4, 1];
const STORM_STEP_SECONDS = 18;
const STORM_IMPACT = {easy: 7, medium: 8, hard: 11};
function stormTargetAfter(secondsAhead = 0) {
  const elapsed = Math.max(0, 120 - gameState.timeRemaining + secondsAhead);
  return STORM_ROUTE[Math.floor(elapsed / STORM_STEP_SECONDS) % STORM_ROUTE.length];
}
function stormSecondsToMove() {
  const elapsed = Math.max(0, 120 - gameState.timeRemaining);
  return STORM_STEP_SECONDS - (elapsed % STORM_STEP_SECONDS);
}
function advanceStorm() {
  const previous = gameState.stormZone;
  const current = stormTargetAfter();
  if (previous === current) return;
  gameState.stormZone = current;
  if (gameState.status[current] !== 'blackout' && gameState.status[current] !== 'critical' && !gameState.emergencyOverloads[current]) {
    gameState.loads[current] = Math.min(100, gameState.loads[current] + (STORM_IMPACT[gameState.difficulty] || 9));
  }
  logEvent(`🌩 FRENTE CLIMÁTICA: ${ZONE_NAMES[current]} sob chuva intensa e descargas elétricas. Próximo deslocamento em ${STORM_STEP_SECONDS}s.`, 'event-lightning');
}
function updateStormUI() {
  const box = document.getElementById('storm-monitor');
  if (!box) return;
  const active = gameState.stormZone || stormTargetAfter();
  const upcoming = STORM_ROUTE[(STORM_ROUTE.indexOf(active) + 1) % STORM_ROUTE.length];
  const seconds = stormSecondsToMove();
  box.replaceChildren();
  const title = document.createElement('strong');
  title.textContent = `🌩 FRENTE ATIVA · ${ZONE_NAMES[active]}`;
  const next = document.createElement('span');
  next.textContent = `Próximo setor: ${ZONE_NAMES[upcoming]} em ${seconds}s`;
  box.append(title, next);
  document.querySelectorAll('.game-zone-card').forEach(card => {
    const z = Number(card.dataset.zoneId);
    card.classList.toggle('storm-active-zone', z === active && gameState.status[z] !== 'blackout');
    card.classList.toggle('storm-next-zone', z === upcoming && gameState.status[z] !== 'blackout');
  });
}

// A topologia física permanece para cascatas; o redirecionamento pode ocorrer entre quaisquer zonas operacionais.
const REDIRECT_AMOUNT = 15;
const CASCADE_LOAD = 24;

function areGridNeighbors(a, b) {
  return (GRID_CONNECTIONS[a] || []).includes(b);
}

// Cada blackout redistribui parte da demanda uma única vez.
// A sobrecarga recebida entra na avaliação normal de risco no próximo tick.
function propagateGridBlackout(origin) {
  const neighbors = GRID_CONNECTIONS[origin].filter(z => areGridNeighbors(origin,z) && gameState.status[z] !== 'blackout');
  if (!neighbors.length) {
    logEvent(`🔌 Rede isolada: ${ZONE_NAMES[origin]} não possui setores ativos conectados.`, 'event-info');
    return;
  }
  const share = Math.round(CASCADE_LOAD / neighbors.length);
  neighbors.forEach(z => { if(!gameState.emergencyOverloads[z] && gameState.status[z] !== 'critical') gameState.loads[z] = Math.min(100, gameState.loads[z] + share); });
  logEvent(`🔗 EFEITO CASCATA: falha em ${ZONE_NAMES[origin]} transferiu +${share} de demanda para ${neighbors.map(z => ZONE_NAMES[z]).join(', ')}.`);
}

const gameState = {
  timeRemaining: 120,
  score: 0,
  blackoutCount: 0,
  difficulty: 'medium',
  config: DIFFICULTY_SETTINGS.medium,
  isAttentionBusy: false,
  pendingAction: null,
  selectedOriginId: null,
  preventiveActionsCount: 0,
  totalActionsCount: 0,
  initialLoads: {},
  loads: {},
  status: {},
  graceSecondsLeft: {},
  blackoutSecondsLeft: {},
  cutCooldowns: {},
  globalGeneratorCooldownUntil: 0, 
  sensorFailures: {},
  sensorOffsets: {}, 
  gameInterval: null,
  growthIntervalTimer: null,
  eventTimeout: null,
  generatorProtectionUntil: {},
  emergencyOverloads: {},
  criticalShieldUsed: {},
  servicePenalty: 0,
  selectedTelemetryZone: null,
  stormZone: 2,
  isGameOver: false,
  overloadTimers: {},
  lastSurgeElapsed: -999,
  nextSurge: null,
  lastSurgeZone: null,
  surgeCount: 0,
  dispatchMission: null,
  dispatchNextCheck: 105,
  shieldUntil: {}, shieldCooldownUntil: 0, repairUntil: {}, repairCooldownUntil: 0,
  maintenanceKits: 3,
  repairKitsSpent: {},
  topologyVisible: false
};

function initScreen3() {
  gameState.difficulty = window.selectedDifficulty || 'medium';
  gameState.config = DIFFICULTY_SETTINGS[gameState.difficulty] || DIFFICULTY_SETTINGS.medium;

  gameState.timeRemaining = 120;
  gameState.score = 0;
  gameState.blackoutCount = 0;
  gameState.isAttentionBusy = false;
  gameState.pendingAction = null;
  gameState.selectedOriginId = null;
  gameState.preventiveActionsCount = 0;
  gameState.totalActionsCount = 0;
  gameState.cutCooldowns = {};
  gameState.globalGeneratorCooldownUntil = 0;
  
  gameState.sensorFailures = {};
  gameState.sensorOffsets = {};
  gameState.generatorProtectionUntil = {};
  gameState.emergencyOverloads = {};
  gameState.criticalShieldUsed = {};
  gameState.servicePenalty = 0;
  gameState.selectedTelemetryZone = null;
  gameState.stormZone = STORM_ROUTE[0];
  gameState.isGameOver = false;

  gameState.dispatchMission = null;
  gameState.dispatchNextCheck = 105;
  const dispatchBox = document.getElementById('dispatch-mission');
  if (dispatchBox) dispatchBox.classList.add('hidden');

  gameState.overloadTimers = {};
  gameState.lastSurgeElapsed = -999;
  gameState.lastSurgeZone = null;
  gameState.surgeCount = 0;
  gameState.nextSurge = null;
  gameState.shieldUntil = {}; gameState.shieldCooldownUntil = 0;
  gameState.repairUntil = {}; gameState.repairCooldownUntil = 0;
  gameState.maintenanceKits = 3; gameState.repairKitsSpent = {};
  gameState.topologyVisible = false;
  const operations = document.getElementById('network-operations');
  if (operations) operations.classList.remove('hidden');

  for (let z = 1; z <= 6; z++) {
    const initial = Math.floor(Math.random() * 16) + 15;
    gameState.initialLoads[z] = initial;
    gameState.loads[z] = initial;
    gameState.status[z] = 'calm';
    gameState.graceSecondsLeft[z] = 0;
    gameState.emergencyOverloads[z] = false;
    gameState.criticalShieldUsed[z] = false;
    gameState.blackoutSecondsLeft[z] = 0;
    gameState.sensorFailures[z] = 0;
    gameState.sensorOffsets[z] = 0;

    gameState.overloadTimers[z] = 999;
  }

  scheduleGridSurge(true);
  document.getElementById('time-remaining').textContent = gameState.timeRemaining;
  document.getElementById('score-value').textContent = gameState.score;
  document.getElementById('blackout-count').textContent = '0';

  const eventsFeed = document.getElementById('events-feed');
  if (eventsFeed) eventsFeed.innerHTML = '';
  
  const eventCount = document.getElementById('event-count');
  if (eventCount) eventCount.textContent = '0';
  const eventsDetails = document.querySelector('#screen-game .events-details');
  if (eventsDetails) eventsDetails.open = false;

  const diffLabel = DIFFICULTY_LABELS[gameState.difficulty];
  logEvent(`⚡ Tempestade iniciada (Modo: ${diffLabel})! Monitoramento do Gêmeo Digital ativo.`);

  setupGameEventListeners();

  if (gameState.gameInterval) clearInterval(gameState.gameInterval);
  gameState.gameInterval = setInterval(gameTick, 1000);

  if (gameState.growthIntervalTimer) clearInterval(gameState.growthIntervalTimer);
  if (gameState.difficulty === 'medium') {
    // Apenas no Médio: +2,1/1,5s (0–20s), +3,1/s (20–80s), +4,1/s (80–120s).
    // Um relógio de 500ms mantém os períodos exatos sem alterar os outros modos.
    gameState.mediumGrowthAccumulatedMs = 0;
    gameState.growthIntervalTimer = setInterval(() => {
      if (gameState.isGameOver) return;
      gameState.mediumGrowthAccumulatedMs += 500;
      const intervalMs = (120 - gameState.timeRemaining) < 20 ? 1500 : 1000;
      if (gameState.mediumGrowthAccumulatedMs >= intervalMs) {
        gameState.mediumGrowthAccumulatedMs -= intervalMs;
        applyGrowth();
      }
    }, 500);
  } else {
    gameState.growthIntervalTimer = setInterval(applyGrowth, gameState.config.growthIntervalMs);
  }

  scheduleNextRandomEvent();
  logEvent(`🌩 Frente climática detectada: ${ZONE_NAMES[gameState.stormZone]}. A telemetria automática antecipa surtos nas zonas com sensores operacionais.`);
  updateGameUI();
}

function getCurrentPhase() {
  const elapsed = 120 - gameState.timeRemaining;
  const growths = gameState.config.growthPhases;

  // Médio: 0–20s de adaptação e 100s de pressão crescente, sem afetar
  // o relógio global dos surtos nem os cooldowns dos equipamentos.
  if (gameState.difficulty === 'medium') {
    // Preserva os intervalos dos eventos; o crescimento muda aos 20s e 80s.
    const eventMin = elapsed <= 50 ? 20 : elapsed <= 100 ? 10 : 12;
    const eventMax = elapsed <= 50 ? 30 : elapsed <= 100 ? 18 : 19;
    if (elapsed < 20) return { phase: 1, name: "Adaptação", growth: growths[0], minEvent: eventMin, maxEvent: eventMax };
    if (elapsed < 80) return { phase: 2, name: "Intensificação", growth: growths[1], minEvent: eventMin, maxEvent: eventMax };
    return { phase: 3, name: "Pressão Máxima", growth: growths[2], minEvent: eventMin, maxEvent: eventMax };
  }

  // Difícil: pressão alta desde o início e intensificação aos 20s e 80s.
  if (gameState.difficulty === 'hard') {
    if (elapsed < 20) return { phase: 1, name: "Pressão Alta", growth: growths[0], minEvent: 20, maxEvent: 30 };
    if (elapsed < 80) return { phase: 2, name: "Intensificação", growth: growths[1], minEvent: 10, maxEvent: 18 };
    return { phase: 3, name: "Pressão Máxima", growth: growths[2], minEvent: 9, maxEvent: 15 };
  }

  // Fácil preservado exatamente como na versão 2.9.
  if (elapsed < 40) return { phase: 1, name: "Calmaria", growth: growths[0], minEvent: 20, maxEvent: 30 };
  if (elapsed < 85) return { phase: 2, name: "Intensificação", growth: growths[1], minEvent: 14, maxEvent: 22 };
  return { phase: 3, name: "Olho da Tempestade", growth: growths[2], minEvent: 16, maxEvent: 24 };
}

// Função de crescimento de carga
function applyGrowth() {
  if (gameState.isGameOver) return;
  const currentPhase = getCurrentPhase();

  for (let z = 1; z <= 6; z++) {
    if (gameState.status[z] !== 'blackout') {
      let growthAmount = currentPhase.growth;

      // Difícil: oscilação em torno da fase (mais intensa, mas administrável).
      if (gameState.difficulty === 'hard') {
        growthAmount *= 0.8 + Math.random() * 0.4;
      }

      // Setor sob a frente climática cresce mais rápido enquanto ela permanece.
      if (gameState.stormZone === z) growthAmount += gameState.difficulty === 'hard' ? 1.6 : 1.0;
      if (Date.now() < (gameState.shieldUntil[z] || 0)) growthAmount *= 0.25; // Blindagem desacelera em 75%, mas nunca reduz a carga atual.
      // O crescimento natural também pode atingir 100 e iniciar a janela crítica.
      // O surto programado permanece um evento distinto, que leva a 100 instantaneamente.
      if (!gameState.emergencyOverloads[z] && gameState.status[z] !== 'critical' && gameState.loads[z] < 100) {
        gameState.loads[z] = Math.min(100, gameState.loads[z] + growthAmount);
        gameState.status[z] = gameState.loads[z] >= 70 ? 'alert' : 'calm';
      }

    }
  }
  updateGameUI();
}

// Central de despacho: desafios emergentes opcionais baseados em leituras reais.
// Não exige novos botões, não aumenta carga e não aplica penalidade por falha.
function updateDispatchMission() {
  const panel = document.getElementById('dispatch-mission');
  const caption = document.getElementById('dispatch-mission-desc');
  const countdown = document.getElementById('dispatch-mission-time');
  if (!panel || !caption || !countdown || gameState.isGameOver) return;

  let mission = gameState.dispatchMission;
  if (mission) {
    const z = mission.zone;
    if (gameState.status[z] === 'blackout') {
      logEvent(`📻 Despacho encerrado: ${ZONE_NAMES[z]} entrou em blackout.`, 'event-info');
      gameState.dispatchMission = null;
      gameState.dispatchNextCheck = gameState.timeRemaining - 23;
      mission = null;
    } else if (gameState.loads[z] < 70) {
      addScore(25);
      logEvent(`📻 MISSÃO CONCLUÍDA: ${ZONE_NAMES[z]} estabilizada! Bônus de +25 pontos.`, 'event-info');
      gameState.dispatchMission = null;
      gameState.dispatchNextCheck = gameState.timeRemaining - 26;
      mission = null;
    } else if (gameState.timeRemaining <= mission.deadline) {
      logEvent(`📻 Despacho expirado: ${ZONE_NAMES[z]} segue sob pressão (sem penalidade).`, 'event-info');
      gameState.dispatchMission = null;
      gameState.dispatchNextCheck = gameState.timeRemaining - 23;
      mission = null;
    }
  }

  // Só oferece nova missão após 15s iniciais, com folga de pelo menos 16s
  // antes do fim da partida. Zonas não monitoradas não revelam carga oculta.
  if (!mission && gameState.timeRemaining <= gameState.dispatchNextCheck && gameState.timeRemaining >= 18) {
    const atRisk = [1,2,3,4,5,6].filter(z =>
      gameState.status[z] !== 'blackout' &&
      (window.zoneLevels[z] || 0) > 0 &&
      gameState.sensorFailures[z] <= 0 &&
      gameState.loads[z] >= 80
    ).sort((a,b) => gameState.loads[b] - gameState.loads[a]);
    if (atRisk.length) {
      const z = atRisk[0];
      mission = {zone:z,deadline:Math.max(0,gameState.timeRemaining-16)};
      gameState.dispatchMission = mission;
      logEvent(`📻 DESPACHO: estabilize ${ZONE_NAMES[z]} abaixo de 70 em 16s para ganhar 25 pontos. Missão opcional.`, 'event-info');
    } else {
      gameState.dispatchNextCheck = gameState.timeRemaining - 5;
    }
  }

  if (!mission) {
    panel.classList.add('hidden');
    return;
  }
  const secondsLeft = Math.max(0, gameState.timeRemaining - mission.deadline);
  caption.textContent = `Estabilize ${ZONE_NAMES[mission.zone]} abaixo de 70 de carga · bônus +25 · sem penalidade.`;
  countdown.textContent = `${secondsLeft}s`;
  panel.classList.remove('hidden');
}

// v2.4: um único relógio global de surtos. O alvo é definido ANTES do aviso.
// A próxima ocorrência respeita o tempo de resposta necessário para recarregar o gerador.
function gridElapsed() { return 120 - gameState.timeRemaining; }
function secondsToGridSurge() {
  return gameState.nextSurge ? Math.max(0, gameState.nextSurge.at - gridElapsed()) : Infinity;
}
function selectUpcomingSurgeZone() {
  const candidates = [1,2,3,4,5,6].filter(z => gameState.status[z] !== 'blackout');
  if (!candidates.length) return null;
  // Mantém variedade e torna as previsões valiosas, sem limitar os riscos à zona mais carregada.
  const ranked = candidates.map(z => ({z, priority:
    gameState.loads[z] + (stormTargetAfter(gameState.config.surgeIntervalSec) === z ? 10 : 0)
    + (Math.random() * 12) - (z === gameState.lastSurgeZone ? 32 : 0)
  })).sort((a,b) => b.priority - a.priority);
  return ranked[Math.floor(Math.random() * Math.min(2,ranked.length))].z;
}
function scheduleGridSurge(first=false) {
  const z = selectUpcomingSurgeZone();
  if (z === null) {gameState.nextSurge=null;return;}
  const interval = gameState.config.surgeIntervalSec;
  gameState.nextSurge = {zone:z,at:gridElapsed()+(first ? interval+4 : interval),impact:gameState.config.surgeImpact};
  updateVirtualSurgeClocks();
}
function updateVirtualSurgeClocks() {
  for (let z=1;z<=6;z++) gameState.overloadTimers[z] =
    gameState.nextSurge && gameState.nextSurge.zone===z ? secondsToGridSurge() : 999;
}
function fireScheduledSurge() {
  const event = gameState.nextSurge;
  if (!event || gridElapsed() < event.at) return;
  const z = event.zone;
  gameState.lastSurgeElapsed = gridElapsed();
  gameState.lastSurgeZone = z;
  gameState.surgeCount++;
  if (gameState.status[z] !== 'blackout') {
    if (Date.now() < (gameState.generatorProtectionUntil[z] || 0)) {
      // Usar o gerador preventivamente também funciona quando a proteção
      // cobre o instante exato do impacto.
      logEvent(`🛡 ${ZONE_NAMES[z]} absorveu o surto com o gerador já ativo!`, 'event-info');
      addScore(20);
    } else {
      // Pulso instantâneo: nenhuma quantidade de corte, desvio ou blindagem
      // impede a emergência. O gerador é a única recuperação possível.
      gameState.loads[z] = 100;
      gameState.status[z] = 'critical';
      gameState.emergencyOverloads[z] = true;
      gameState.criticalShieldUsed[z] = false;
      // O gameTick ainda processará a zona neste mesmo segundo.
      gameState.graceSecondsLeft[z] = gameState.config.gracePeriodSec + 1;
      const sound = document.getElementById('overload-sound');
      if (sound) { sound.volume = 0.8; sound.currentTime = 0; sound.play().catch(() => {}); }
      logEvent(`🚨 SOBRECARGA INSTANTÂNEA: ${ZONE_NAMES[z]} chegou a 100%! Use GERADOR ou REDIRECIONAMENTO para evitar o blackout. ${gameState.config.gracePeriodSec}s para agir.`, 'event-lightning');
    }
  } else {
    logEvent(`ℹ Surto passou por ${ZONE_NAMES[z]}, já desconectada.`, 'event-info');
  }
  scheduleGridSurge();
}
function forecastUpcomingSurge(zone) {
  if (!monitoredZone(zone) || !gameState.nextSurge || gameState.nextSurge.zone !== zone || gameState.status[zone] === 'blackout') return null;
  const actual = secondsToGridSurge();
  const sensor = window.zoneLevels[zone] || 0;
  const seconds = Math.max(1, actual + (sensor === 1 ? (gameState.sensorOffsets[zone] || 0) : 0));
  const absorbed = Date.now() + actual * 1000 < (gameState.generatorProtectionUntil[zone] || 0);
  return { seconds, exact: sensor >= 2, overload: !absorbed, protected: absorbed, actual };
}

function gameTick() {
  if (gameState.isGameOver) return;

  gameState.timeRemaining--;
  advanceStorm();
  fireScheduledSurge();
  updateVirtualSurgeClocks();
  document.getElementById('time-remaining').textContent = gameState.timeRemaining;

  for (let z = 1; z <= 6; z++) {
    if (gameState.repairUntil[z] && Date.now() >= gameState.repairUntil[z]) {
      gameState.repairUntil[z] = 0;
      if (gameState.status[z] === 'blackout') {
        gameState.loads[z] = 48;
        gameState.status[z] = 'calm';
        gameState.graceSecondsLeft[z] = 0;
        gameState.emergencyOverloads[z] = false;
        gameState.criticalShieldUsed[z] = false;
        gameState.overloadTimers[z] = Math.max(20, gameState.overloadTimers[z]);
        delete gameState.repairKitsSpent[z];
        logEvent(`🔧 Equipe concluiu reparo da ${ZONE_NAMES[z]}: fornecimento restaurado a 48.`);
      }
    }
    if (gameState.timeRemaining % 2 === 0) {
        gameState.sensorOffsets[z] = Math.floor(Math.random() * 7) - 3;
    }

    if (gameState.status[z] === 'blackout') {
      // Zona permanece apagada
    } else {
      // O surto global é processado uma vez por segundo, fora deste laço.

      if (gameState.loads[z] >= 100) {
        gameState.loads[z] = 100; // valor físico capado: nunca acumular além do limite
        if (gameState.status[z] !== 'critical') {
          gameState.status[z] = 'critical';
          gameState.graceSecondsLeft[z] = gameState.config.gracePeriodSec;
          gameState.criticalShieldUsed[z] = false;
          logEvent(`⚠ ALERTA CRÍTICO: ${ZONE_NAMES[z]} atingiu 100 de carga! Janela de tolerância: ${gameState.config.gracePeriodSec}s.`);

          const alertSound = document.getElementById('alert-sound');
          if (alertSound) {
              alertSound.volume = 0.8;
              alertSound.currentTime = 0;
              alertSound.play().catch(erro => console.log(erro));
          }

        } else {
          gameState.graceSecondsLeft[z]--;
          if (gameState.graceSecondsLeft[z] <= 0) {
            gameState.status[z] = 'blackout';
            gameState.emergencyOverloads[z] = false;
            gameState.criticalShieldUsed[z] = false;
            propagateGridBlackout(z);

            const blackoutSound = document.getElementById('blackout-sound');
            if (blackoutSound) {
                blackoutSound.volume = 0.6;
                blackoutSound.currentTime = 0;
                blackoutSound.play().catch(erro => console.log(erro));
            }

            gameState.blackoutSecondsLeft[z] = 15;
            
            // Penalidade de blackout personalizada pela dificuldade
            const blackoutPenalty = (gameState.config && gameState.config.blackoutPenalty) ? gameState.config.blackoutPenalty : 100;
            addScore(-blackoutPenalty);
            logEvent(`💥 BLACKOUT: ${ZONE_NAMES[z]} apagou! (-${blackoutPenalty} pts)`);
          }
        }
      } else if (gameState.loads[z] >= 70) {
        gameState.status[z] = 'alert';
      } else {
        gameState.status[z] = 'calm';
      }
    }

    if (gameState.sensorFailures[z] > 0) {
      gameState.sensorFailures[z]--;
    }
  }


  let currentBlackouts = 0;
  for (let z = 1; z <= 6; z++) {
    if (gameState.status[z] === 'blackout') currentBlackouts++;
  }
  gameState.blackoutCount = currentBlackouts;

  const blackoutCounterEl = document.getElementById('blackout-count');
  if (blackoutCounterEl) {
    blackoutCounterEl.textContent = currentBlackouts;
    const parentCounter = blackoutCounterEl.closest('.game-blackout-counter');
    if (parentCounter) {
      if (currentBlackouts >= 2) {
        parentCounter.classList.add('danger');
      } else {
        parentCounter.classList.remove('danger');
      }
    }
  }

  if (currentBlackouts >= 3) {
    endGame(false);
    return;
  }

  if (gameState.timeRemaining <= 0) {
    endGame(true);
    return;
  }

  updateGameUI();
}

function updateGameUI() {
  updateDispatchMission();
  const now = Date.now();
  const isGlobalGeneratorOnCooldown = gameState.globalGeneratorCooldownUntil > now;

  for (let z = 1; z <= 6; z++) {
    const card = document.querySelector(`.game-zone-card[data-zone-id="${z}"]`);
    if (!card) continue;

    const currentLoad = Math.min(100, Math.max(0, gameState.loads[z]));
    const currentStatus = gameState.status[z];
    const sensorLevel = window.zoneLevels[z] || 0;
    const isBlind = ((sensorLevel === 0) || (gameState.sensorFailures[z] > 0)) && (currentLoad < 100);

    let statusVisual = currentStatus;
    
    if (currentStatus === 'critical' && gameState.graceSecondsLeft[z] <= (gameState.config.gracePeriodSec / 2)) {
        statusVisual = 'critical-danger';
    }
    
    card.setAttribute('data-status', statusVisual);
    card.classList.toggle('instant-overload', !!gameState.emergencyOverloads[z]);
    card.setAttribute('data-sensor-level', sensorLevel);

    const fillBar = card.querySelector('.zone-load-fill');
    if (fillBar) {
        fillBar.style.width = isBlind ? '0%' : `${currentLoad}%`;
    }

    const loadValLabel = card.querySelector('.load-value');
    if (loadValLabel) {
      loadValLabel.textContent = isBlind ? "??" : Math.round(currentLoad); 
    }

    const btnCut = card.querySelector('.btn-cut');
    const btnGen = card.querySelector('.btn-generator');

    const cutOnCooldown = gameState.cutCooldowns[z] && gameState.cutCooldowns[z] > now;

    if (btnCut) {
      if (cutOnCooldown) {
        btnCut.disabled = true;
        btnCut.classList.add('on-cooldown');
        const remaining = Math.max(1, Math.ceil((gameState.cutCooldowns[z] - now)/1000));
        btnCut.textContent = `✂ ${remaining}s`;
        btnCut.title = `Corte de carga disponível em ${remaining}s`;
      } else {
        btnCut.disabled = gameState.isAttentionBusy || currentStatus === 'blackout';
        btnCut.classList.remove('on-cooldown');
        btnCut.textContent = '✂';
        btnCut.title = `Cortar ${gameState.config.cutReduction} de carga nesta zona`;
      }
    }

    if (btnGen) {
      if (isGlobalGeneratorOnCooldown) {
        btnGen.disabled = true;
        btnGen.classList.add('on-cooldown');
        const remaining = Math.max(1, Math.ceil((gameState.globalGeneratorCooldownUntil - now)/1000));
        btnGen.textContent = `⚡ ${remaining}s`;
        btnGen.title = `Gerador disponível em ${remaining}s (recarga compartilhada)`;
      } else {
        btnGen.disabled = gameState.isAttentionBusy || currentStatus === 'blackout';
        btnGen.classList.remove('on-cooldown');
        btnGen.textContent = '⚡';
        btnGen.title = `Gerador: reduz ${gameState.config.generatorReduction} de carga e protege por 9 segundos (recarga global)`;
      }
    }

    if (btnCut && currentStatus === 'critical') {
      btnCut.disabled = true;
      btnCut.title = 'Sobrecarga em 100%: use gerador ou redirecione 15 para qualquer zona ativa com capacidade.';
    }
    const predEl = card.querySelector('.zone-prediction');
    if (predEl) {
      // Telemetria contínua: sem botão, janela de uso ou recarga.
      // Sensores ausentes ou temporariamente danificados não revelam previsões.
      const forecast = forecastUpcomingSurge(z);
      predEl.classList.remove('exact-prediction', 'scan-risk-visible', 'scan-risk-critical');
      if(currentStatus==='blackout') {
        predEl.textContent='SEM ENERGIA';predEl.title='';
      } else if(currentStatus==='critical') {
        predEl.textContent=`🚨 100% · RECUPERE EM ${Math.ceil(gameState.graceSecondsLeft[z])}s`;
        predEl.classList.add('scan-risk-critical');
        predEl.title='Carga em 100%: use gerador ou redirecione 15 para uma zona com espaço. Blindagem acrescenta tempo uma vez por crise.';
      } else if(forecast) {
        predEl.textContent=forecast.protected ? `🛡 SURTO ABSORVIDO ${forecast.seconds}s` : `🚨 SOBRECARGA ${forecast.exact?'EM':'≈'} ${forecast.seconds}s`;
        predEl.classList.add('scan-risk-visible');
        if(forecast.overload)predEl.classList.add('scan-risk-critical');
        if(forecast.exact)predEl.classList.add('exact-prediction');
        predEl.title=`${forecast.exact?'Contagem precisa (sensor N2)':'Tempo estimado ±3s (sensor N1)'}. Surto instantâneo leva a 100%; gerador ou redirecionamento podem recuperar a zona. Gerador pré-ativado pode absorver o evento.`;
      } else {predEl.textContent='';predEl.title='';}

    }
  }

  const btnRedirect = document.getElementById('btn-redirect');
  refreshRedirectGuidance();
  if (btnRedirect) btnRedirect.disabled = gameState.isAttentionBusy || gameState.isGameOver;

  updateTelemetryUI();
  updateStormUI();
  updateTacticalUI();
}

function addPredictionSidebar(zoneId, text, isExact = false) {
  const list = document.getElementById('predictions-list');
  if (!list) return;

  const li = document.createElement('li');
  li.style.color = isExact ? '#5eead4' : '#facc15';
  li.textContent = `${ZONE_NAMES[zoneId]}: ${text}`;
  list.appendChild(li);
}

function triggerAttentionCooldown(durationMs = 2000) {
  gameState.isAttentionBusy = true;
  const cooldownContainer = document.getElementById('attention-cooldown');
  const cooldownFill = cooldownContainer ? cooldownContainer.querySelector('.attention-cooldown-fill') : null;

  if (cooldownContainer && cooldownFill) {
    cooldownContainer.classList.remove('hidden');
    cooldownFill.style.width = '0%';
    cooldownFill.style.transition = 'none';

    setTimeout(() => {
      cooldownFill.style.transition = `width ${durationMs}ms linear`;
      cooldownFill.style.width = '100%';
    }, 20);

    setTimeout(() => {
      gameState.isAttentionBusy = false;
      cooldownContainer.classList.add('hidden');
      updateGameUI();
    }, durationMs);
  } else {
    setTimeout(() => {
      gameState.isAttentionBusy = false;
      updateGameUI();
    }, durationMs);
  }
}

// Sistema de Ajuste de Pontuação por Nível de Dificuldade
function addScore(points) {
  let adjustedPoints = points;

  if (points > 0) {
    const diffWeight = (gameState.config && gameState.config.scoreMultiplier) 
      ? gameState.config.scoreMultiplier 
      : (gameState.difficulty === 'hard' ? 1.5 : (gameState.difficulty === 'medium' ? 1.25 : 1.0));
      
    adjustedPoints = Math.round(points * diffWeight);
  }

  gameState.score += adjustedPoints;

  if (gameState.score < 0) {
    gameState.score = 0;
  }

  const scoreValueEl = document.getElementById('score-value');
  if (scoreValueEl) {
    scoreValueEl.textContent = gameState.score;
  }
}

function logEvent(msg, type = '') {
  const feed = document.getElementById('events-feed');
  if (!feed) return;

  const li = document.createElement('li');
  if (type) li.classList.add(type);
  li.textContent = `[${120 - gameState.timeRemaining}s] ${msg}`;

  feed.insertBefore(li, feed.firstChild);
  const eventCount = document.getElementById('event-count');
  if (eventCount) eventCount.textContent = String(feed.children.length);
  // Guardamos somente os acontecimentos recentes para manter o painel fluido.
  while (feed.children.length > 30) feed.lastElementChild.remove();
}

function scheduleNextRandomEvent() {
  if (gameState.isGameOver) return;

  const currentPhase = getCurrentPhase();
  const delaySec = Math.floor(Math.random() * (currentPhase.maxEvent - currentPhase.minEvent + 1)) + currentPhase.minEvent;

  gameState.eventTimeout = setTimeout(() => {
    executeRandomEvent();
    scheduleNextRandomEvent();
  }, delaySec * 1000);
}

function executeRandomEvent() {
  if (gameState.isGameOver) return;

  const isLightning = Math.random() < 0.6;

  if (isLightning) {
    const weights = [];
    for (let z = 1; z <= 6; z++) {
      if (gameState.status[z] !== 'blackout') {
        const weight = (window.zoneLevels[z] || 0) === 0 ? 2 : 1;
        for (let w = 0; w < weight; w++) weights.push(z);
      }
    }

    if (weights.length > 0) {
      // A tempestade concentra a atividade elétrica: 70% dos raios atingem
      // sua zona ativa; os outros 30% podem atingir outras regiões da rede.
      // Se a zona da frente estiver apagada, sorteia apenas zonas operacionais.
      const stormZone = gameState.stormZone;
      const stormIsAvailable = gameState.status[stormZone] !== 'blackout';
      const otherZones = weights.filter(z => z !== stormZone);
      let targetZone;
      if (stormIsAvailable && (otherZones.length === 0 || Math.random() < 0.70)) {
        targetZone = stormZone;
      } else {
        const candidates = otherZones.length > 0 ? otherZones : weights;
        targetZone = candidates[Math.floor(Math.random() * candidates.length)];
      }
      if (!gameState.emergencyOverloads[targetZone] && gameState.status[targetZone] !== 'critical') gameState.loads[targetZone] = Math.min(100, gameState.loads[targetZone] + 30);

      const shockSound = document.getElementById('shock-sound');
      if (shockSound) {
          shockSound.volume = 0.4; 
          shockSound.currentTime = 0;
          shockSound.play().catch(erro => console.log(erro));
      }

      logEvent(`⚡ RAIO! Atingiu a ${ZONE_NAMES[targetZone]} (+30 de carga)!`, 'event-lightning');
      updateGameUI();
    }
  } else {
    const eligibleZones = [];
    for (let z = 1; z <= 6; z++) {
      if (gameState.status[z] !== 'blackout' && (window.zoneLevels[z] || 0) > 0 && gameState.sensorFailures[z] <= 0) {
        eligibleZones.push(z);
      }
    }

    if (eligibleZones.length > 0) {
      const targetZone = eligibleZones[Math.floor(Math.random() * eligibleZones.length)];
      gameState.sensorFailures[targetZone] = 8;

      const sensorFailuresSound = document.getElementById('sensor_failures-sound');
      if (sensorFailuresSound) {
          sensorFailuresSound.volume = 0.4;
          sensorFailuresSound.currentTime = 0;
          sensorFailuresSound.play().catch(erro => console.log(erro));
      }

      logEvent(`⚠ FALHA DE SENSOR: Sinal perdido na ${ZONE_NAMES[targetZone]} por 8s!`, 'event-sensor');
      updateGameUI();
    }
  }
}

/* ======================================================================
   TELEMETRIA CONTÍNUA
   A previsão usa os sensores instalados e o relógio real dos surtos.
   ====================================================================== */
function monitoredZone(z) {
  const level = window.zoneLevels[z] || 0;
  return level > 0 && (gameState.sensorFailures[z] || 0) <= 0;
}
function telemetryRisk(z) {
  const status = gameState.status[z];
  if (status === 'blackout') return {key:'blackout', text:'BLACKOUT', weight:10000};
  if (!monitoredZone(z)) return {key:'blind', text:gameState.sensorFailures[z] > 0 ? 'SINAL PERDIDO' : 'SEM SENSOR', weight:-1};
  const load = gameState.loads[z];
  if (load >= 100 || status === 'critical') return {key:'critical', text:'CRÍTICO', weight:2000 + load};
  if (load >= 70) return {key:'alert', text:'ALERTA', weight:1000 + load};
  return {key:'calm', text:'ESTÁVEL', weight:load};
}
function autoTelemetryZone() {
  const candidates = [1,2,3,4,5,6].filter(z => monitoredZone(z) && gameState.status[z] !== 'blackout');
  // Não expõe a carga de áreas sem sensores nem escolhe riscos secretos.
  if (!candidates.length) return gameState.stormZone || 1;
  return candidates.reduce((best, z) => telemetryRisk(z).weight > telemetryRisk(best).weight ? z : best, candidates[0]);
}
function telemetryPrediction(z) {
  const raw = Math.max(0, Math.ceil(gameState.overloadTimers[z] || 0));
  if ((window.zoneLevels[z] || 0) >= 2) return `Surto previsto: ${raw}s`;
  const estimated = Math.max(1, raw + (gameState.sensorOffsets[z] || 0));
  return `Surto estimado: ~${estimated}s`;
}
function scanConnectedZones(zoneId) {
  return (GRID_CONNECTIONS[zoneId] || []).map(z => {
    const name = ZONE_NAMES[z];
    if (gameState.status[z] === 'blackout') return `${name}: desligada`;
    // O scanner não descobre valores secretos de zonas sem sensor ativo.
    if (!monitoredZone(z)) return `${name}: sem leitura`;
    const reading = Math.round(gameState.loads[z]);
    const possible = gameState.status[z] !== 'critical' && gameState.loads[z] + REDIRECT_AMOUNT < 100;
    return `${name}: ${reading}/100${possible ? ' (recebe carga)' : ' (risco alto)'}`;
  }).join(' · ') || 'nenhuma';
}
// Microprojeção do gêmeo digital: apoio à decisão, não previsão de todos os eventos.
// Respeita sensores: sem telemetria operacional, nenhum valor de carga é revelado.
const SCAN_HORIZON_SECONDS = 6;
function projectMonitoredLoad(zoneId, addedLoad = 0) {
  if (!monitoredZone(zoneId)) return null;
  let projected = gameState.loads[zoneId] + addedLoad;
  const interval = gameState.config.growthIntervalMs / 1000;
  // A projeção acompanha a evolução das fases do Médio e do Difícil.
  const phaseGrowth = getCurrentPhase().growth;
  for (let second = 1; second <= SCAN_HORIZON_SECONDS; second++) {
    const weatherZone = stormTargetAfter(second);
    const futureElapsed = 120 - gameState.timeRemaining + second;
    const mediumGrowth = futureElapsed < 20 ? 2.1 : futureElapsed < 80 ? 3.1 : 3.7;
    const hardGrowth = futureElapsed < 20 ? 2.9 : futureElapsed < 80 ? 4.1 : 5.3;
    const stepGrowth = gameState.difficulty === 'medium' ? mediumGrowth : gameState.difficulty === 'hard' ? hardGrowth : phaseGrowth;
    const stepInterval = gameState.difficulty === 'medium' ? (futureElapsed < 20 ? 1.5 : 1) : interval;
    projected += (stepGrowth + (weatherZone === zoneId ? (gameState.difficulty === 'hard' ? 1.6 : 1) : 0)) / stepInterval;
    if (second === stormSecondsToMove() && weatherZone === zoneId && gameState.stormZone !== zoneId) {
      projected += STORM_IMPACT[gameState.difficulty] || 9;
    }
  }
  // Só o sensor N2 conhece a contagem exata de um surto programado.
  const sensor = window.zoneLevels[zoneId] || 0;
  const surgeWithin = (gameState.overloadTimers[zoneId] || 999) <= SCAN_HORIZON_SECONDS;
  if (sensor >= 2 && surgeWithin) {
    const protectedAtSurge = (gameState.generatorProtectionUntil[zoneId] || 0) > Date.now() + (gameState.overloadTimers[zoneId] * 1000);
    projected += protectedAtSurge ? Math.round(gameState.config.surgeImpact * 0.4) : gameState.config.surgeImpact;
  }
  const uncertainSurge = sensor === 1 && (gameState.overloadTimers[zoneId] || 999) <= SCAN_HORIZON_SECONDS + 3;
  return {load: Math.round(projected), uncertainSurge, includedSurge: sensor >= 2 && surgeWithin};
}
function scanAssessment(projection) {
  if (!projection) return {name:'DESCONHECIDO', className:'unknown'};
  if (projection.load >= 90 || projection.uncertainSurge) return {name:'RISCO ALTO', className:'danger'};
  if (projection.load >= 70) return {name:'ATENÇÃO', className:'warning'};
  return {name:'MARGEM BOA', className:'safe'};
}

function updateTelemetryUI() {
  const coverage = document.getElementById('sensor-coverage');
  if (coverage) {
    const available = [1,2,3,4,5,6].filter(monitoredZone).length;
    coverage.textContent = `📡 Sensores operacionais: ${available}/6`;
  }
  const guide = document.getElementById('telemetry-scan-guide');
  if (!guide) return;
  guide.textContent = '📡 TELEMETRIA CONTÍNUA · previsão automática nos cartões com sensores operacionais.';
}

// O redirecionamento representa o despacho de energia pela rede operacional.
// Pode ligar quaisquer duas zonas ATIVAS; a topologia física permanece reservada
// às falhas em cascata. A quantidade enviada é de até 15 unidades.
// Uma sobrecarga instantânea só pode ser encerrada por uma transferência integral
// de 15 unidades, evitando recuperar uma zona crítica com apenas 1 unidade.
function redirectTransferAmount(origin, destination) {
  if (!origin || !destination || origin === destination) return 0;
  if (gameState.status[origin] === 'blackout' || gameState.status[destination] === 'blackout' || gameState.status[destination] === 'critical') return 0;
  const source = Math.max(0, gameState.loads[origin] || 0);
  const freeCapacity = Math.max(0, 99 - (gameState.loads[destination] || 0));
  const amount = Math.floor(Math.min(REDIRECT_AMOUNT, source, freeCapacity));
  if ((gameState.status[origin] === 'critical' || gameState.emergencyOverloads[origin]) && amount < REDIRECT_AMOUNT) return 0;
  return amount >= 1 ? amount : 0;
}
function redirectDestinations(origin) {
  if (!origin || gameState.status[origin] === 'blackout' || gameState.loads[origin] < 1) return [];
  return [1,2,3,4,5,6].filter(z => redirectTransferAmount(origin, z) > 0);
}
function chooseVisibleRedirectRoute(origin) {
  // Sugestão baseada em sensores operacionais; não revela cargas ocultas.
  const candidates = redirectDestinations(origin).filter(z => monitoredZone(z));
  if (!candidates.length) return null;
  return candidates.sort((a,b) => {
    const futureLoad = z => gameState.loads[z] + redirectTransferAmount(origin,z) +
      (gameState.stormZone === z ? 12 : stormTargetAfter(stormSecondsToMove()) === z ? 6 : 0);
    return futureLoad(a) - futureLoad(b);
  })[0];
}
function setRedirectOrigin(z) {
  if (gameState.status[z] === 'blackout' || gameState.loads[z] < 1) return false;
  gameState.selectedOriginId = z;
  gameState.pendingAction = 'redirect-target';
  refreshRedirectGuidance();
  return true;
}
function refreshRedirectGuidance() {
  const originMode = gameState.pendingAction === 'redirect-origin';
  const targetMode = gameState.pendingAction === 'redirect-target';
  const origin = gameState.selectedOriginId;
  const recommendation = targetMode ? chooseVisibleRedirectRoute(origin) : null;
  const hintEl = document.getElementById('selection-hint');
  document.querySelectorAll('.game-zone-card').forEach(card => {
    // Botões internos não devem capturar o clique no cartão durante a seleção.
    // Fora do modo de redirecionamento, recuperam o comportamento original.
    card.querySelectorAll('.btn-action').forEach(btn => {
      btn.style.pointerEvents = (originMode || targetMode) ? 'none' : '';
    });
    const z = Number(card.dataset.zoneId);
    const amount = targetMode ? redirectTransferAmount(origin,z) : 0;
    const possible = targetMode && amount > 0;
    const originEligible = originMode && gameState.status[z] !== 'blackout' && gameState.loads[z] >= 1;
    card.classList.toggle('redirect-origin-choice', !!originEligible);
    card.classList.toggle('selected-target', targetMode && z === origin);
    card.classList.toggle('redirect-possible', !!possible);
    card.classList.toggle('redirect-best', targetMode && z === recommendation);
    card.classList.toggle('redirect-unavailable', targetMode && z !== origin && !possible);
    const note = card.querySelector('.redirect-preview');
    if (note) note.remove();
    if (originEligible || targetMode) {
      const preview = document.createElement('span');
      preview.className = 'redirect-preview';
      if (originEligible) {
        preview.textContent = `↗ ORIGEM · enviar até ${REDIRECT_AMOUNT}`;
      } else if (targetMode && z === origin) {
        preview.textContent = `⬆ ORIGEM · ${Math.round(gameState.loads[z])} → ${Math.round(Math.max(0,gameState.loads[z]-REDIRECT_AMOUNT))}`;
        preview.classList.add('redirect-preview-origin');
      } else if (possible) {
        const after = Math.round(gameState.loads[z] + amount);
        preview.textContent = `${z === recommendation ? '★ SUGERIDA · ' : '✓ DISPONÍVEL · '}+${amount} · ${Math.round(gameState.loads[z])} → ${after}`;
        if (after >= 85) preview.classList.add('redirect-preview-warning');
      } else if (targetMode) {
        preview.classList.add('redirect-preview-unavailable');
        preview.textContent = gameState.status[z] === 'blackout' ? '✕ INDISPONÍVEL · blackout' :
          gameState.status[z] === 'critical' ? '✕ INDISPONÍVEL · crítica' :
          '✕ SEM CAPACIDADE';
      }
      card.appendChild(preview);
    }
  });
  if (hintEl && targetMode && origin) {
    const from = Math.round(gameState.loads[origin]);
    const visible = redirectDestinations(origin).length;
    hintEl.replaceChildren();
    const info=document.createElement('span');
    info.textContent=`↔ ORIGEM ${ZONE_NAMES[origin]} (${from}) · ${visible} destino(s) disponíveis em toda a rede · azul = receber · cinza = indisponível · ESC cancela`;
    hintEl.append(info);
    if (recommendation) {
      const fast=document.createElement('button');
      fast.type='button';
      fast.id='redirect-fast-route';
      fast.className='redirect-fast-route';
      fast.dataset.destination=String(recommendation);
      fast.textContent=`↪ Usar ${ZONE_NAMES[recommendation]} (rota sugerida)`;
      fast.title='Transferir imediatamente para uma zona monitorada com capacidade disponível.';
      hintEl.append(fast);
    }
  } else if (hintEl && originMode) {
    hintEl.textContent='↔ REDIRECIONAMENTO: selecione qualquer zona ativa como origem; depois escolha o destino destacado. ESC cancela.';
  }
}

// Laboratório de gêmeo digital: ações diferentes alteram o mesmo estado da rede.
function updateTacticalUI() {
  const now=Date.now();
  for(const [id,end,normal] of [
    ['btn-fortify',gameState.shieldCooldownUntil,'🛡 Blindar · E'],
    ['btn-repair',gameState.repairCooldownUntil,`🔧 Reparar (${gameState.maintenanceKits}) · T`]]) {
    const button=document.getElementById(id); if(!button)continue;
    const left=Math.max(0,Math.ceil(((end||0)-now)/1000));
    button.disabled=!!left || gameState.isAttentionBusy || gameState.isGameOver;
    button.textContent=left ? `${id==='btn-fortify'?'🛡':'🔧'} ${left}s` : normal;
  }
  const cards=document.querySelectorAll('.game-zone-card');
  cards.forEach(card=>{
    const z=Number(card.dataset.zoneId);
    let flag=card.querySelector('.twin-status-indicator');
    if(!flag){flag=document.createElement('div');flag.className='twin-status-indicator';card.appendChild(flag);}
    const shield=Math.ceil(((gameState.shieldUntil[z]||0)-now)/1000);
    const repair=Math.ceil(((gameState.repairUntil[z]||0)-now)/1000);
    flag.textContent=repair>0?`🔧 REPARO ${repair}s`:shield>0?`🛡 BLINDADO ${shield}s`:'';
    flag.classList.toggle('hidden',!(repair>0||shield>0));
  });

}

let isEventListenersSetup = false;
function setupGameEventListeners() {
  if (isEventListenersSetup) return; // Evita registrar atalhos duplicados após reiniciar.

  document.addEventListener('keydown', (e) => {
    // Atalhos exclusivos da partida; não interferem na digitação em campos.
    const gameScreen = document.getElementById('screen-game');
    if (!gameScreen || gameScreen.classList.contains('hidden') || !gameState || gameState.isGameOver) return;
    const focused = e.target;
    if (focused && (focused.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(focused.tagName))) return;
    if (!e.ctrlKey && !e.altKey && !e.metaKey && ['e','t'].includes(e.key.toLowerCase())) {
      if(e.repeat) return;
      const keyButtons = { e: 'btn-fortify', t: 'btn-repair' };
      const actionButton = document.getElementById(keyButtons[e.key.toLowerCase()]);
      if(actionButton && !actionButton.disabled) actionButton.click();
      e.preventDefault(); return;
    }
    if (!e.ctrlKey && !e.altKey && !e.metaKey && (e.key === 'r' || e.key === 'R')) {
      if (e.repeat) return;
      const redirectButton = document.getElementById('btn-redirect');
      if (gameState.pendingAction === 'redirect-origin' || gameState.pendingAction === 'redirect-target') {
        cancelSelectionMode();
        logEvent('ℹ Redirecionamento cancelado pelo teclado.', 'event-info');
      } else if (!gameState.pendingAction && !gameState.isAttentionBusy && redirectButton && !redirectButton.disabled) {
        redirectButton.click(); // Mesmo fluxo usado pelo botão, sem lógica duplicada.
      }
      e.preventDefault();
      return;
    }
    if (e.key === 'Escape' || e.key === 'Esc') {
      if (gameState.pendingAction) {
        cancelSelectionMode();
        logEvent("ℹ Seleção cancelada pelo utilizador.", "event-info");
      }
    }
  });

  const gameSection = document.getElementById('screen-game');
  if (!gameSection) return;

  gameSection.addEventListener('click', (e) => {
    if (gameState.isAttentionBusy || gameState.isGameOver) return;

    const fastRoute=e.target.closest('#redirect-fast-route');
    if (fastRoute && gameState.pendingAction === 'redirect-target') {
      handleZoneSelection(Number(fastRoute.dataset.destination));
      return;
    }
    const actionBtn = e.target.closest('.btn-action');
    const zoneCard = e.target.closest('.game-zone-card');

    // No redirecionamento, todo clique no cartão é uma seleção de zona,
    // mesmo sobre a região dos botões de corte/gerador.
    if (zoneCard && (gameState.pendingAction === 'redirect-origin' || gameState.pendingAction === 'redirect-target')) {
      const zoneId = Number(zoneCard.dataset.zoneId);
      gameState.selectedTelemetryZone = zoneId;
      handleZoneSelection(zoneId);
      updateTelemetryUI();
      return;
    }

    if (actionBtn) {
      const zoneId = parseInt(actionBtn.getAttribute('data-zone-id'), 10);
      const action = actionBtn.getAttribute('data-action');

      if (action === 'cut') {
        executeCutAction(zoneId);
      } else if (action === 'generator') {
        executeGeneratorAction(zoneId);
      }
      return;
    }

    if (e.target.closest('#telemetry-auto-focus')) {
      gameState.selectedTelemetryZone = null;
      updateTelemetryUI();
      return;
    }
    if (zoneCard) {
      const zoneId = parseInt(zoneCard.getAttribute('data-zone-id'), 10);
      gameState.selectedTelemetryZone = zoneId;
      if (gameState.pendingAction) handleZoneSelection(zoneId);
      updateTelemetryUI();

    }
  });

  const fortify = document.getElementById('btn-fortify');
  const repair = document.getElementById('btn-repair');
  if(fortify) fortify.addEventListener('click',()=>{
    if(gameState.pendingAction === 'fortify'){ cancelSelectionMode(); return; }
    startSelectionMode('fortify','🛡 Selecione zona ativa: proteção preventiva ou +tempo em uma emergência de 100%. ESC cancela.');
  });
  if(repair) repair.addEventListener('click',()=>{
    if(gameState.pendingAction === 'repair'){ cancelSelectionMode(); return; }
    startSelectionMode('repair','🔧 Escolha uma zona em BLACKOUT para enviar a equipe (reparo: 8s). ESC cancela.');
  });
  const btnRedirect = document.getElementById('btn-redirect');

  if (btnRedirect) {
    btnRedirect.addEventListener('click', () => {
      if (gameState.isAttentionBusy || gameState.isGameOver) return;
      if (gameState.pendingAction === 'redirect-origin' || gameState.pendingAction === 'redirect-target') {
        cancelSelectionMode(); // Segundo clique no botão cancela e limpa a seleção.
        return;
      }
      // Cada operação começa vazia: origem e destino serão definidos por cliques novos.
      startSelectionMode('redirect-origin', 'Selecione a zona de origem e, depois, a zona de destino. ESC cancela.');
      refreshRedirectGuidance();
    });
  }


  isEventListenersSetup = true;
}

function executeCutAction(zoneId) {
  if (gameState.status[zoneId] === 'critical' || gameState.loads[zoneId] >= 100) {
    logEvent(`🚨 ${ZONE_NAMES[zoneId]} em SOBRECARGA: use gerador!`, 'event-info');
    return;
  }
  const now = Date.now();
  if (gameState.status[zoneId] === 'blackout') return;
  if (gameState.cutCooldowns[zoneId] && gameState.cutCooldowns[zoneId] > now) return;

  const cutSound = document.getElementById('cut-sound');
  if (cutSound) {
      cutSound.volume = 0.4;
      cutSound.currentTime = 0;
      cutSound.play().catch(erro => console.log(erro));
  }

  const currentLoad = gameState.loads[zoneId];
  const wasCritical = gameState.status[zoneId] === 'critical' || currentLoad >= 100;
  const wasRisky = currentLoad >= 70 && !wasCritical;

  gameState.loads[zoneId] = Math.max(0, currentLoad - gameState.config.cutReduction);
  gameState.servicePenalty += 3;
  addScore(-3);
  
  gameState.cutCooldowns[zoneId] = now + gameState.config.cutCooldownMs;

  gameState.totalActionsCount++;
  
  if (wasCritical) {
    addScore(10);
  } else if (wasRisky) {
    addScore(50);
    gameState.preventiveActionsCount++;
  }

  if (wasCritical || wasRisky) {
    logEvent(`✂ Corte de carga executado na ${ZONE_NAMES[zoneId]} (-${gameState.config.cutReduction}).`);
  } else {
    logEvent(`ℹ Corte prematuro na ${ZONE_NAMES[zoneId]} não gerou pontos.`, 'event-info');
  }
  
  updateGameUI();
}


// Blindagem funciona de duas maneiras: preventiva (reduz crescimento)
// ou emergencial (extensão única do prazo, sem reduzir carga).
function executeShieldAction(zoneId) {
  const now = Date.now();
  if (gameState.isGameOver || gameState.status[zoneId] === 'blackout' || now < gameState.shieldCooldownUntil) return false;
  const critical = gameState.status[zoneId] === 'critical' && gameState.loads[zoneId] >= 100;
  if (critical) {
    if (gameState.criticalShieldUsed[zoneId]) {
      logEvent('❌ Esta crise já recebeu o tempo extra da blindagem.', 'event-info');
      return false;
    }
    gameState.graceSecondsLeft[zoneId] += gameState.config.shieldCriticalBonusSec;
    gameState.criticalShieldUsed[zoneId] = true;
    // Sem efeito de queda de carga nem proteção que apague a crise.
    logEvent(`🛡 Blindagem emergencial: ${ZONE_NAMES[zoneId]} ganhou +${gameState.config.shieldCriticalBonusSec}s antes do colapso.`, 'event-info');
  } else {
    gameState.shieldUntil[zoneId] = now + 14000;
    logEvent(`🛡 Blindagem preventiva: ${ZONE_NAMES[zoneId]} protegida contra crescimento por 14s.`, 'event-info');
  }
  gameState.shieldCooldownUntil = now + 24000;
  gameState.totalActionsCount++;
  updateGameUI();
  return true;
}

function executeGeneratorAction(zoneId) {
  const now = Date.now();
  if (gameState.status[zoneId] === 'blackout') return;
  if (gameState.globalGeneratorCooldownUntil > now) return;

  const generatorSound = document.getElementById('generator-sound');
  if (generatorSound) {
      generatorSound.volume = 0.4;
      generatorSound.currentTime = 0;
      generatorSound.play().catch(erro => console.log(erro));
  }
  
  const currentLoad = gameState.loads[zoneId];
  const wasCritical = gameState.status[zoneId] === 'critical' || currentLoad >= 100;
  const wasRisky = currentLoad >= 70 && !wasCritical;

  // Gerador: amortecimento temporário; não elimina toda a demanda nem apaga a previsão.
  gameState.loads[zoneId] = Math.max(0, currentLoad - gameState.config.generatorReduction);
  gameState.emergencyOverloads[zoneId] = false;
  gameState.criticalShieldUsed[zoneId] = false;
  gameState.generatorProtectionUntil[zoneId] = now + 9000;
  if (gameState.loads[zoneId] < 100 && wasCritical) {
    gameState.status[zoneId] = gameState.loads[zoneId] >= 70 ? 'alert' : 'calm';
    gameState.graceSecondsLeft[zoneId] = 0;
  }

  const cooldownMs = gameState.config.generatorCooldownMs || 3000;
  gameState.globalGeneratorCooldownUntil = now + cooldownMs;

  gameState.totalActionsCount++;
  
  if (wasCritical) {
    addScore(10);
  } else if (wasRisky) {
    addScore(50);
    gameState.preventiveActionsCount++;
  }

  logEvent(`⚡ Gerador em ${ZONE_NAMES[zoneId]}: -${gameState.config.generatorReduction} de carga e proteção por 9s. Recarga: ${cooldownMs / 1000}s.`);
  
  updateGameUI();
}

function startSelectionMode(actionType, hintMessage) {
  if (gameState.pendingAction === 'redirect-origin' || gameState.pendingAction === 'redirect-target') {
    cancelSelectionMode(); // Não carregar origem/destino para outro modo de ação.
  }
  gameState.pendingAction = actionType;
  gameState.selectedOriginId = null;

  const hintEl = document.getElementById('selection-hint');
  if (hintEl) {
    hintEl.textContent = hintMessage;
    hintEl.classList.remove('hidden');
  }

  document.querySelectorAll('.game-zone-card').forEach(c => c.classList.remove('selected-target'));
  refreshRedirectGuidance();
}

function handleZoneSelection(zoneId) {
  if (gameState.pendingAction === 'fortify') {
    if(executeShieldAction(zoneId)) cancelSelectionMode();
    return;
  }
  if (gameState.pendingAction === 'repair') {
    if(gameState.status[zoneId] !== 'blackout' || gameState.repairUntil[zoneId]) {logEvent('❌ Reparos só em zonas apagadas e sem equipe ativa.');return;}
    if(gameState.maintenanceKits <= 0){logEvent('❌ Equipes esgotadas. Você dispõe de 3 reparos por partida.');return;}
    if(Object.values(gameState.repairUntil).some(end=>end>Date.now())){logEvent('❌ A equipe de manutenção já está ocupada.');return;}
    gameState.maintenanceKits--; gameState.repairKitsSpent[zoneId] = true;
    gameState.repairUntil[zoneId] = Date.now() + 8000;
    gameState.repairCooldownUntil = Date.now() + 18000;
    gameState.totalActionsCount++;
    addScore(-35);
    logEvent(`🔧 Equipe enviada para ${ZONE_NAMES[zoneId]}: retorno em 8s; ${gameState.maintenanceKits} equipes restantes.`);
    cancelSelectionMode();updateGameUI();return;
  }
  const hintEl = document.getElementById('selection-hint');

  if (gameState.pendingAction === 'redirect-origin') {
    if (gameState.status[zoneId] === 'blackout' || gameState.loads[zoneId] < 1) {
      logEvent('Selecione uma origem energizada, inclusive em sobrecarga, com alguma carga para enviar.', 'event-info');
      return;
    }

    setRedirectOrigin(zoneId);
  } else if (gameState.pendingAction === 'redirect-target') {
    const originId = gameState.selectedOriginId;
    if (zoneId === originId) {
      // Clique novamente na origem permite trocar a origem sem recomeçar.
      gameState.pendingAction = 'redirect-origin';
      gameState.selectedOriginId = null;
      refreshRedirectGuidance();
      return;
    }
    const amount = redirectTransferAmount(originId, zoneId);
    if (!amount) {
      logEvent(`❌ ${ZONE_NAMES[zoneId]} está indisponível ou sem espaço seguro para receber carga. Escolha uma zona azul.`, 'event-info');
      refreshRedirectGuidance();
      return;
    }

    // Revalide a origem no instante da transferência (pode ter sofrido blackout
    // enquanto o jogador escolhia o destino).
    if (gameState.status[originId] === 'blackout' || gameState.loads[originId] < amount) {
      logEvent('❌ Origem indisponível para redirecionamento.', 'event-info');
      cancelSelectionMode();
      return;
    }

    const currentLoad = gameState.loads[originId];
    const wasCritical = gameState.status[originId] === 'critical' || currentLoad >= 100;
    const wasRisky = currentLoad >= 70 && !wasCritical;

    gameState.loads[originId] = Math.max(0, currentLoad - amount);
    gameState.loads[zoneId] += amount; // capacidade segura validada na confirmação

    // Em uma crise instantânea a 100%, só uma transferência integral
    // de 15 unidades pode substituir o gerador.
    if (wasCritical && gameState.loads[originId] < 100) {
      gameState.emergencyOverloads[originId] = false;
      gameState.criticalShieldUsed[originId] = false;
      gameState.graceSecondsLeft[originId] = 0;
      gameState.status[originId] = gameState.loads[originId] >= 70 ? 'alert' : 'calm';
      logEvent(`✅ SOBRECARGA CONTROLADA: ${ZONE_NAMES[originId]} foi aliviada por redirecionamento.`, 'event-info');
    }

    gameState.totalActionsCount++;
    
    if (wasCritical) {
      addScore(10);
    } else if (wasRisky) {
      addScore(50);
      gameState.preventiveActionsCount++;
    }

    logEvent(`↔ Redirecionamento: ${ZONE_NAMES[originId]} (-${amount}) ➔ ${ZONE_NAMES[zoneId]} (+${amount})${wasCritical ? ' · crise encerrada' : ''}.`);
    cancelSelectionMode();
    updateGameUI();
    triggerAttentionCooldown(650); // Apenas 0,65s; redirecionamento precisa ser útil em crises.
  }
}

function cancelSelectionMode() {
  gameState.pendingAction = null;
  gameState.selectedOriginId = null;

  const hintEl = document.getElementById('selection-hint');
  if (hintEl) hintEl.classList.add('hidden');

  document.querySelectorAll('.game-zone-card').forEach(c => c.classList.remove('selected-target'));
  refreshRedirectGuidance();
}

function endGame(isVictory) {
  gameState.isGameOver = true;
  const dispatchBox = document.getElementById('dispatch-mission');
  if (dispatchBox) dispatchBox.classList.add('hidden');
  if (gameState.gameInterval) clearInterval(gameState.gameInterval);
  if (gameState.growthIntervalTimer) clearInterval(gameState.growthIntervalTimer);
  if (gameState.eventTimeout) clearTimeout(gameState.eventTimeout);

  if (!isVictory) { 
      const gameoverSound = document.getElementById('game_over-sound');
      if (gameoverSound) {
          gameoverSound.volume = 0.4;
          gameoverSound.play().catch(erro => console.log(erro));
        }
      
      const bgMusic = document.getElementById('bg-music');
      const rainThunder = document.getElementById('rain-thunder');
    
      if (bgMusic) bgMusic.pause();
      if (rainThunder) rainThunder.pause();
      } 
  else {
      const victorySound = document.getElementById('victory-sound');
      if (victorySound) {
          victorySound.volume = 0.8;
          victorySound.play().catch(erro => console.log(erro));
      }
      
      const rainThunder = document.getElementById('rain-thunder');
      if (rainThunder) rainThunder.pause();
      }

  let bonus = 0;
  if (isVictory && gameState.totalActionsCount > 0) {
    const pct = gameState.preventiveActionsCount / gameState.totalActionsCount;
    const diffBonusWeight = (gameState.config && gameState.config.scoreMultiplier) ? gameState.config.scoreMultiplier : 1.0;
    bonus = Math.round(pct * 200 * diffBonusWeight);
    addScore(bonus);
  }

  logEvent(isVictory 
    ? `🎉 VITÓRIA! Tempestade superada. Bônus de Prevenção: +${bonus} pts!` 
    : `💀 DERROTA! A cidade sofreu um colapso energético total.`
  );

  let efficiencyPct = 0;

  if (gameState.totalActionsCount > 0) {
    const baseRatio = gameState.preventiveActionsCount / gameState.totalActionsCount;
    const diffWeight = gameState.difficulty === 'hard' ? 1.3 : (gameState.difficulty === 'medium' ? 1.15 : 1.0);

    efficiencyPct = Math.min(
      100,
      Math.round(baseRatio * diffWeight * 100)
    );
  }

  window.lastGameResult = {
    victory: isVictory,
    difficulty: gameState.difficulty,
    finalScore: gameState.score,
    bonusPoints: bonus,
    preventivePct: efficiencyPct,
    timeSurvived: 120 - gameState.timeRemaining,
    blackoutsOccurred: gameState.blackoutCount
  };

  if (typeof window.showScreen === 'function') {
    setTimeout(() => {
      window.showScreen('screen-result');
    }, 2000);
  }
}

/* ======================================================================
   TELA 4 — RESULTADOS (DEBRIEFING PEDAGÓGICO)
   ====================================================================== */
function renderResultScreen() {
  const res = window.lastGameResult;
  if (!res) return;

  const resultTitle = document.getElementById('result-title');
  const resultSubtitle = document.getElementById('result-subtitle');
  const scoreVal = document.getElementById('result-score-val');
  const bonusVal = document.getElementById('result-bonus-val');
  const preventivePctVal = document.getElementById('result-preventive-pct');
  const timeSurvivedVal = document.getElementById('result-time-survived');
  const blackoutsVal = document.getElementById('result-blackouts-val');

  if (resultTitle) {
    const diffText = DIFFICULTY_LABELS[res.difficulty] || DIFFICULTY_LABELS.medium;
    resultTitle.textContent = res.victory ? `SOBREVIVÊNCIA ALCANÇADA (${diffText.toUpperCase()})` : `COLAPSO DO SISTEMA (${diffText.toUpperCase()})`;
    resultTitle.style.color = res.victory ? "#5eead4" : "#f59e0b";
  }

  if (resultSubtitle) {
    resultSubtitle.textContent = res.victory 
      ? "A infraestrutura resistiu à tempestade graças às suas decisões estratégicas e antecipação de falhas."
      : "Múltiplas zonas sofreram apagão simultâneo, gerando colapso na rede elétrica da cidade.";
  }

  if (scoreVal) scoreVal.textContent = res.finalScore;
  if (bonusVal) bonusVal.textContent = `+${res.bonusPoints} pts`;
  if (preventivePctVal) preventivePctVal.textContent = `${res.preventivePct}%`;
  if (timeSurvivedVal) timeSurvivedVal.textContent = `${res.timeSurvived}s`;
  if (blackoutsVal) blackoutsVal.textContent = res.blackoutsOccurred;
}