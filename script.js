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
        bgMusic.volume = 0.3;

        bgMusic.play().catch(erro => {
            console.log("O navegador bloqueou a reprodução automática:", erro);
        });
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
    const upgradeCosts = { 1: 1, 2: 2 }; 

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
        selectSound.volume = 0.4; // Ajuste de 0.0 a 1.0 conforme achar melhor
        selectSound.currentTime = 0; // Rebobina o som instantaneamente para não cortar cliques rápidos
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
                    
                    // Efeito Sonoro de Chuva e Trovão ao iniciar o jogo
                    rainThunder.volume = 0.2;
                    rainThunder.play().catch(erro => console.log("Erro ao tocar a chuva:", erro));

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
            currentBudget = MAX_BUDGET;
            for (let z = 1; z <= 6; z++) {
                window.zoneLevels[z] = 0;
            }
            renderZoneCards();
            updateSidebarStatus();
            updateBudgetDisplay();
            window.showScreen('screen-preparation');
        });
    }

    if (btnMenu) {
        btnMenu.addEventListener('click', () => {
            window.showScreen('screen-menu');
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

// Configurações dos Modos (Cortar Carga atualizado para 20%)
const DIFFICULTY_SETTINGS = {
  easy: {
    growthPhases: [2.0, 2.5, 3.0],
    growthIntervalMs: 1000,
    cutCooldownMs: 1000,
    gracePeriodSec: 10,
    cutReduction: 20
  },
  medium: {
    growthPhases: [2.0, 3.0, 4.0], // Ajustado conforme regras: 2%, 3%, 4%
    growthIntervalMs: 1500,
    cutCooldownMs: 1000,
    gracePeriodSec: 6,
    cutReduction: 20
  },
  hard: {
    growthPhases: [4.0, 4.0, 4.0], // Ajustado conforme regras: 4% constante
    growthIntervalMs: 1300,
    cutCooldownMs: 1000,
    gracePeriodSec: 6,
    cutReduction: 20
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
  recalibrations: [],
  gameInterval: null,
  growthIntervalTimer: null, // Novo timer independente para preenchimento exato da barra
  eventTimeout: null,
  telemetryActiveUntil: 0,
  telemetryCooldownUntil: 0,
  isGameOver: false,
  overloadTimers: {}
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
  gameState.recalibrations = [];
  gameState.cutCooldowns = {};
  gameState.globalGeneratorCooldownUntil = 0;
  
  gameState.sensorFailures = {};
  gameState.sensorOffsets = {};
  gameState.telemetryActiveUntil = 0;
  gameState.telemetryCooldownUntil = 0;
  gameState.isGameOver = false;

  gameState.overloadTimers = {};

  for (let z = 1; z <= 6; z++) {
    const initial = Math.floor(Math.random() * 16) + 15;
    gameState.initialLoads[z] = initial;
    gameState.loads[z] = initial;
    gameState.status[z] = 'calm';
    gameState.graceSecondsLeft[z] = 0;
    gameState.blackoutSecondsLeft[z] = 0;
    gameState.sensorFailures[z] = 0;
    gameState.sensorOffsets[z] = 0;

    // Temporizadores iniciais distribuídos para evitar eventos simultâneos
    gameState.overloadTimers[z] = 15 + (z * 15) + Math.floor(Math.random() * 10);
  }

  document.getElementById('time-remaining').textContent = gameState.timeRemaining;
  document.getElementById('score-value').textContent = gameState.score;
  document.getElementById('blackout-count').textContent = '0';

  const eventsFeed = document.getElementById('events-feed');
  if (eventsFeed) eventsFeed.innerHTML = '';
  
  const predictionsList = document.getElementById('predictions-list');
  if (predictionsList) predictionsList.innerHTML = '';

  const diffLabel = DIFFICULTY_LABELS[gameState.difficulty];
  logEvent(`⚡ Tempestade iniciada (Modo: ${diffLabel})! Monitoramento do Gêmeo Digital ativo.`);

  setupGameEventListeners();

  if (gameState.gameInterval) clearInterval(gameState.gameInterval);
  gameState.gameInterval = setInterval(gameTick, 1000);

  // Inicializa o crescimento em intervalo separado para seguir a regra exata de segundos
  if (gameState.growthIntervalTimer) clearInterval(gameState.growthIntervalTimer);
  gameState.growthIntervalTimer = setInterval(applyGrowth, gameState.config.growthIntervalMs);

  scheduleNextRandomEvent();
  updateGameUI();
}

function getCurrentPhase() {
  const elapsed = 120 - gameState.timeRemaining;
  const growths = gameState.config.growthPhases;

  if (gameState.difficulty === 'medium') {
      if (elapsed <= 50) {
          return { phase: 1, name: "Calmaria", growth: growths[0], minEvent: 20, maxEvent: 30 };
      } else if (elapsed <= 100) {
          return { phase: 2, name: "Intensificação", growth: growths[1], minEvent: 10, maxEvent: 18 };
      } else {
          return { phase: 3, name: "Olho da Tempestade", growth: growths[2], minEvent: 5, maxEvent: 10 };
      }
  } else {
      // Hard ou Easy caem nos limiares padrão de fase, porém com seus crescimentos fixados em config
      if (elapsed < 40) return { phase: 1, name: "Calmaria", growth: growths[0], minEvent: 20, maxEvent: 30 };
      else if (elapsed < 85) return { phase: 2, name: "Intensificação", growth: growths[1], minEvent: 10, maxEvent: 18 };
      else return { phase: 3, name: "Olho da Tempestade", growth: growths[2], minEvent: 5, maxEvent: 10 };
  }
}

// Função dedicada de crescimento das barras para garantir a sincronia solicitada de 1.5s / 1.3s
function applyGrowth() {
  if (gameState.isGameOver) return;
  const currentPhase = getCurrentPhase();

  for (let z = 1; z <= 6; z++) {
    if (gameState.status[z] !== 'blackout') {
      gameState.loads[z] += currentPhase.growth;

      // Sincronia de estado imediato para a UI (O tick trata a regressão)
      if (gameState.loads[z] >= 100 && gameState.status[z] !== 'critical') {
        gameState.status[z] = 'critical';
        gameState.graceSecondsLeft[z] = gameState.config.gracePeriodSec;
        logEvent(`⚠ ALERTA CRÍTICO: ${ZONE_NAMES[z]} atingiu 100 de carga! Janela de tolerância: ${gameState.config.gracePeriodSec}s.`);
      } else if (gameState.loads[z] >= 70 && gameState.loads[z] < 100 && gameState.status[z] === 'calm') {
        gameState.status[z] = 'alert';
      }
    }
  }
  updateGameUI();
}

function gameTick() {
  if (gameState.isGameOver) return;

  gameState.timeRemaining--;
  document.getElementById('time-remaining').textContent = gameState.timeRemaining;

  for (let z = 1; z <= 6; z++) {
    if (gameState.timeRemaining % 2 === 0) {
        gameState.sensorOffsets[z] = Math.floor(Math.random() * 7) - 3;
    }

    if (gameState.status[z] === 'blackout') {
      // Regra: uma vez em blackout, a zona permanece apagada
      // até o final da partida.
      // Não deve existir restauração automática da zona.
    } else {
      gameState.overloadTimers[z]--;

      if (gameState.overloadTimers[z] <= 0) {
        gameState.loads[z] += 100;

        // Próximo evento de sobrecarga desta zona terá um intervalo maior
        gameState.overloadTimers[z] = Math.floor(Math.random() * 20) + 40;

        logEvent(
          `⚠ SOBRECARGA: A carga da ${ZONE_NAMES[z]} sofreu um aumento crítico!`,
          'event-lightning'
        );
      }

      if (gameState.loads[z] >= 100) {
        if (gameState.status[z] !== 'critical') {
          gameState.status[z] = 'critical';
          gameState.graceSecondsLeft[z] = gameState.config.gracePeriodSec;
          logEvent(`⚠ ALERTA CRÍTICO: ${ZONE_NAMES[z]} atingiu 100 de carga! Janela de tolerância: ${gameState.config.gracePeriodSec}s.`);
        } else {
          gameState.graceSecondsLeft[z]--;
          if (gameState.graceSecondsLeft[z] <= 0) {
            gameState.status[z] = 'blackout';
            gameState.blackoutSecondsLeft[z] = 15;
            addScore(-30);
            logEvent(`💥 BLACKOUT: ${ZONE_NAMES[z]} apagou! (-30 pts)`);
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

  for (let i = gameState.recalibrations.length - 1; i >= 0; i--) {
    const recal = gameState.recalibrations[i];
    recal.secondsLeft--;
    if (recal.secondsLeft <= 0) {
      window.zoneLevels[recal.target] = Math.min(2, (window.zoneLevels[recal.target] || 0) + 1);
      logEvent(`📡 Recalibração concluída: Sensor ativado na ${ZONE_NAMES[recal.target]}.`);
      gameState.recalibrations.splice(i, 1);
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
  const now = Date.now();
  const isGlobalGeneratorOnCooldown = gameState.globalGeneratorCooldownUntil > now;

  for (let z = 1; z <= 6; z++) {
    const card = document.querySelector(`.game-zone-card[data-zone-id="${z}"]`);
    if (!card) continue;

    const currentLoad = Math.min(100, Math.max(0, gameState.loads[z]));
    const currentStatus = gameState.status[z];
    const sensorLevel = window.zoneLevels[z] || 0;
    const isBlind = sensorLevel === 0;

    card.setAttribute('data-status', currentStatus);
    card.setAttribute('data-sensor-level', sensorLevel);

    const fillBar = card.querySelector('.zone-load-fill');
    if (fillBar) fillBar.style.width = `${currentLoad}%`;

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
      } else {
        btnCut.disabled = gameState.isAttentionBusy || currentStatus === 'blackout';
        btnCut.classList.remove('on-cooldown');
      }
    }

    // O gerador é bloqueado globalmente para TODAS as zonas durante o cooldown de 3s
    if (btnGen) {
      if (isGlobalGeneratorOnCooldown) {
        btnGen.disabled = true;
        btnGen.classList.add('on-cooldown');
      } else {
        btnGen.disabled = gameState.isAttentionBusy || currentStatus === 'blackout';
        btnGen.classList.remove('on-cooldown');
      }
    }

    const predEl = card.querySelector('.zone-prediction');
    if (predEl) {
      predEl.textContent = '';
      predEl.classList.remove('exact-prediction');
    }
  }

  const btnRedirect = document.getElementById('btn-redirect');
  const btnRecalibrate = document.getElementById('btn-recalibrate');
  const btnScanSystem = document.getElementById('btn-scan-system');

  if (btnRedirect) btnRedirect.disabled = gameState.isAttentionBusy;
  if (btnRecalibrate) btnRecalibrate.disabled = gameState.isAttentionBusy;

  if (btnScanSystem) {
    const isTelemetryOnCooldown = gameState.telemetryCooldownUntil && gameState.telemetryCooldownUntil > now;
    if (isTelemetryOnCooldown) {
      const remainingSec = Math.ceil((gameState.telemetryCooldownUntil - now) / 1000);
      btnScanSystem.disabled = true;
      btnScanSystem.textContent = `📡 Telemetria em Recarga (${remainingSec}s)`;
    } else {
      btnScanSystem.disabled = gameState.isAttentionBusy;
      btnScanSystem.textContent = `📡 Escanear Telemetria do Grid`;
    }
  }

  updateTelemetryUI();
}

function addPredictionSidebar(zoneId, text, isExact = false) {
  const list = document.getElementById('predictions-list');
  if (!list) return;

  const li = document.createElement('li');
  li.style.color = isExact ? '#5eead4' : '#facc15';
  li.textContent = `${ZONE_NAMES[zoneId]}: ${text}`;
  list.appendChild(li);
}

function triggerAttentionCooldown() {
  gameState.isAttentionBusy = true;
  const cooldownContainer = document.getElementById('attention-cooldown');
  const cooldownFill = cooldownContainer ? cooldownContainer.querySelector('.attention-cooldown-fill') : null;

  if (cooldownContainer && cooldownFill) {
    cooldownContainer.classList.remove('hidden');
    cooldownFill.style.width = '0%';
    cooldownFill.style.transition = 'none';

    setTimeout(() => {
      cooldownFill.style.transition = 'width 2s linear';
      cooldownFill.style.width = '100%';
    }, 20);

    setTimeout(() => {
      gameState.isAttentionBusy = false;
      cooldownContainer.classList.add('hidden');
      updateGameUI();
    }, 2000);
  } else {
    setTimeout(() => {
      gameState.isAttentionBusy = false;
      updateGameUI();
    }, 2000);
  }
}

function addScore(points) {
  let adjustedPoints = points;

  // A pontuação considera o nível de dificuldade.
  // O modo Difícil recebe um peso maior.
  if (points > 0) {
    const diffWeight = gameState.difficulty === 'hard' ? 1.5 : 1.0;
    adjustedPoints = Math.round(points * diffWeight);
  }

  gameState.score += adjustedPoints;

  // A pontuação nunca pode ficar abaixo de zero.
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
      const targetZone = weights[Math.floor(Math.random() * weights.length)];
      gameState.loads[targetZone] = Math.min(100, gameState.loads[targetZone] + 30);
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
      logEvent(`⚠ FALHA DE SENSOR: Sinal perdido na ${ZONE_NAMES[targetZone]} por 8s!`, 'event-sensor');
      updateGameUI();
    }
  }
}

/* ======================================================================
   SISTEMA DE TELEMETRIA E SCAN
   ====================================================================== */
const TELEMETRY_VISIBLE_TIME = 3700; // 3,7 segundos

function revelarTelemetriaSobrecargas() {
  const now = Date.now();
  if (gameState.isAttentionBusy || gameState.isGameOver) return;
  if (gameState.telemetryCooldownUntil && gameState.telemetryCooldownUntil > now) return;

  // Efeito Sonoro do scanner de telemetria
  const scannerSound = document.getElementById('scanner-sound');
  if (scannerSound) {
      scannerSound.volume = 0.8; // Ajuste o volume se necessário
      scannerSound.currentTime = 0;
      scannerSound.play().catch(erro => console.log(erro));
  }

  // Cooldown de 5 segundos contado a partir da ativação
  gameState.telemetryCooldownUntil = now + 5000;

  logEvent("📡 Varredura de Telemetria ativada pelo Gêmeo Digital.");

  // As informações permanecem visíveis por 3,7 segundos,
  // independentemente do cooldown de 5 segundos
  gameState.telemetryActiveUntil = now + TELEMETRY_VISIBLE_TIME;

  updateGameUI();

  if (telemetryTimeout) clearTimeout(telemetryTimeout);
  telemetryTimeout = setTimeout(() => {
    gameState.telemetryActiveUntil = 0;
    updateGameUI();
  }, TELEMETRY_VISIBLE_TIME);
}

function updateTelemetryUI() {
  const predictionsList = document.getElementById('predictions-list');
  const isTelemetryActive = Date.now() < (gameState.telemetryActiveUntil || 0);

  if (predictionsList) predictionsList.innerHTML = '';

  if (!isTelemetryActive) {
    return;
  }

  for (let z = 1; z <= 6; z++) {
    const sensorLevel = window.zoneLevels[z] || 0;
    const isSensorFailing = gameState.sensorFailures[z] > 0;
    const currentStatus = gameState.status[z];

    if (sensorLevel === 0 || isSensorFailing || currentStatus === 'blackout') {
      continue;
    }

    let timeToOverload = gameState.overloadTimers[z];

    if (timeToOverload > 0) {
      if (sensorLevel === 1) {
        const impreciseTime = Math.max(1, timeToOverload + (gameState.sensorOffsets[z] || 0));
        addPredictionSidebar(z, `Sobrecarga em ~${impreciseTime}s (Aproximado)`);
      } else if (sensorLevel === 2) {
        addPredictionSidebar(z, `Sobrecarga exata em ${timeToOverload}s`, true);
      }
    }
  }
}

let isEventListenersSetup = false;
function setupGameEventListeners() {
  const btnScanSystem = document.getElementById('btn-scan-system');
  if (btnScanSystem && !btnScanSystem.hasAttribute('data-scan-listener')) {
    btnScanSystem.setAttribute('data-scan-listener', 'true');
    btnScanSystem.addEventListener('click', () => {
      revelarTelemetriaSobrecargas();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      if (gameState.pendingAction) {
        cancelSelectionMode();
        logEvent("ℹ Seleção cancelada pelo utilizador.", "event-info");
      }
    }
  });

  if (isEventListenersSetup) return;
  const gameSection = document.getElementById('screen-game');
  if (!gameSection) return;

  gameSection.addEventListener('click', (e) => {
    if (gameState.isAttentionBusy || gameState.isGameOver) return;

    const actionBtn = e.target.closest('.btn-action');
    const zoneCard = e.target.closest('.game-zone-card');

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

    if (zoneCard && gameState.pendingAction) {
      const zoneId = parseInt(zoneCard.getAttribute('data-zone-id'), 10);
      handleZoneSelection(zoneId);
    }
  });

  const btnRedirect = document.getElementById('btn-redirect');
  const btnRecalibrate = document.getElementById('btn-recalibrate');

  if (btnRedirect) {
    btnRedirect.addEventListener('click', () => {
      if (gameState.isAttentionBusy) return;
      startSelectionMode('redirect-origin', "Selecione a zona de ORIGEM da carga (pressione ESC para cancelar)...");
    });
  }

  if (btnRecalibrate) {
    btnRecalibrate.addEventListener('click', () => {
      if (gameState.isAttentionBusy) return;
      startSelectionMode('recalibrate-origin', "Selecione a zona com sensor para mover (pressione ESC para cancelar)...");
    });
  }

  isEventListenersSetup = true;
}

function executeCutAction(zoneId) {
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

// Uso Ilimitado com Cooldown GLOBAL de 3 segundos
function executeGeneratorAction(zoneId) {
  const now = Date.now();
  if (gameState.status[zoneId] === 'blackout') return;
  if (gameState.globalGeneratorCooldownUntil > now) return; // Checagem global

  const generatorSound = document.getElementById('generator-sound');
  if (generatorSound) {
      generatorSound.volume = 0.4;
      generatorSound.currentTime = 0;
      generatorSound.play().catch(erro => console.log(erro));
  }
  
  const currentLoad = gameState.loads[zoneId];
  const wasCritical = gameState.status[zoneId] === 'critical' || currentLoad >= 100;
  const wasRisky = currentLoad >= 70 && !wasCritical;

  gameState.loads[zoneId] = gameState.initialLoads[zoneId];

  // Se a zona estava em alerta crítico/100%, recupera o estado para normal
  if (wasCritical) {
    gameState.status[zoneId] = gameState.loads[zoneId] >= 70 ? 'alert' : 'calm';
    gameState.graceSecondsLeft[zoneId] = 0;
  }

  gameState.overloadTimers[zoneId] = Math.floor(Math.random() * 20) + 40;

  // Aplica o cooldown GLOBAL de 3000ms (3 segundos) para todas as zonas
  gameState.globalGeneratorCooldownUntil = now + 3000;

  gameState.totalActionsCount++;
  
  if (wasCritical) {
    addScore(10);
  } else if (wasRisky) {
    addScore(50);
    gameState.preventiveActionsCount++;
  }

  logEvent(`⚡ Gerador de emergência acionado na ${ZONE_NAMES[zoneId]}! (Cooldown global: 3s)`);
  
  updateGameUI();
}

function startSelectionMode(actionType, hintMessage) {
  gameState.pendingAction = actionType;
  gameState.selectedOriginId = null;

  const hintEl = document.getElementById('selection-hint');
  if (hintEl) {
    hintEl.textContent = hintMessage;
    hintEl.classList.remove('hidden');
  }

  document.querySelectorAll('.game-zone-card').forEach(c => c.classList.remove('selected-target'));
}

function handleZoneSelection(zoneId) {
  const hintEl = document.getElementById('selection-hint');

  if (gameState.pendingAction === 'redirect-origin') {
    if (gameState.status[zoneId] === 'blackout') return;

    gameState.selectedOriginId = zoneId;
    gameState.pendingAction = 'redirect-target';

    const card = document.querySelector(`.game-zone-card[data-zone-id="${zoneId}"]`);
    if (card) card.classList.add('selected-target');

    if (hintEl) hintEl.textContent = "Selecione a zona de DESTINO (não pode estar crítica)...";
  } else if (gameState.pendingAction === 'redirect-target') {
    const originId = gameState.selectedOriginId;
    if (zoneId === originId) return;

    if (gameState.status[zoneId] === 'critical' || gameState.status[zoneId] === 'blackout' || gameState.loads[zoneId] >= 100) {
      logEvent(`❌ Redirecionamento inválido: ${ZONE_NAMES[zoneId]} está em alerta crítico.`);
      cancelSelectionMode();
      return;
    }

    const currentLoad = gameState.loads[originId];
    const wasCritical = gameState.status[originId] === 'critical' || currentLoad >= 100;
    const wasRisky = currentLoad >= 70 && !wasCritical;

    gameState.loads[originId] = Math.max(0, gameState.loads[originId] - 15);
    gameState.loads[zoneId] = Math.min(100, gameState.loads[zoneId] + 15);

    gameState.totalActionsCount++;
    
    if (wasCritical) {
      addScore(10);
    } else if (wasRisky) {
      addScore(50);
      gameState.preventiveActionsCount++;
    }

    logEvent(`↔ Redirecionamento: ${ZONE_NAMES[originId]} (-15) ➔ ${ZONE_NAMES[zoneId]} (+15).`);
    cancelSelectionMode();
    triggerAttentionCooldown();
  } else if (gameState.pendingAction === 'recalibrate-origin') {
    if ((window.zoneLevels[zoneId] || 0) <= 0) {
      logEvent(`❌ Seleção inválida: ${ZONE_NAMES[zoneId]} não possui sensor.`);
      cancelSelectionMode();
      return;
    }

    gameState.selectedOriginId = zoneId;
    gameState.pendingAction = 'recalibrate-target';

    const card = document.querySelector(`.game-zone-card[data-zone-id="${zoneId}"]`);
    if (card) card.classList.add('selected-target');

    if (hintEl) hintEl.textContent = "Selecione a zona de DESTINO do sensor...";
  } else if (gameState.pendingAction === 'recalibrate-target') {
    const originId = gameState.selectedOriginId;
    if (zoneId === originId) return;

    window.zoneLevels[originId]--;

    gameState.recalibrations.push({
      origin: originId,
      target: zoneId,
      secondsLeft: 10
    });

    logEvent(`📡 Recalibração iniciada: ${ZONE_NAMES[originId]} ➔ ${ZONE_NAMES[zoneId]} (10s em trânsito).`);
    cancelSelectionMode();
    triggerAttentionCooldown();
  }
}

function cancelSelectionMode() {
  gameState.pendingAction = null;
  gameState.selectedOriginId = null;

  const hintEl = document.getElementById('selection-hint');
  if (hintEl) hintEl.classList.add('hidden');

  document.querySelectorAll('.game-zone-card').forEach(c => c.classList.remove('selected-target'));
}

function endGame(isVictory) {
  gameState.isGameOver = true;
  if (gameState.gameInterval) clearInterval(gameState.gameInterval);
  if (gameState.growthIntervalTimer) clearInterval(gameState.growthIntervalTimer);
  if (gameState.eventTimeout) clearTimeout(gameState.eventTimeout);

  let bonus = 0;
  if (isVictory && gameState.totalActionsCount > 0) {
    const pct = gameState.preventiveActionsCount / gameState.totalActionsCount;
    bonus = Math.round(pct * 200);
    addScore(bonus);
  }

  logEvent(isVictory 
    ? `🎉 VITÓRIA! Tempestade superada. Bônus de Prevenção: +${bonus} pts!` 
    : `💀 DERROTA! A cidade sofreu um colapso energético total.`
  );

  // Cálculo revisado da Eficiência Preventiva de acordo com a dificuldade
  let efficiencyPct = 0;

  if (gameState.totalActionsCount > 0) {
    const baseRatio =
      gameState.preventiveActionsCount / gameState.totalActionsCount;

    // Parâmetro compatível com a pressão do modo Difícil
    const diffWeight =
      gameState.difficulty === 'hard' ? 1.3 : 1.0;

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