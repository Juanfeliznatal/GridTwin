/* ==========================================================================
   VARIÁVEIS DE ESTADO GLOBAL E DOM
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    // DOM: Áudio e Efeitos Globais
    const bgMusic = document.getElementById('bg-music');
    const lightningFlash = document.getElementById('lightning-flash');
    
    // DOM: Botões de navegação
    const btnStartMenu = document.getElementById('btn-start');
    const btnStartStorm = document.getElementById('btn-start-storm');

    // Estado do Jogo (Tela 2)
    let currentScreenId = 'screen-menu';
    const MAX_BUDGET = 8;
    let currentBudget = MAX_BUDGET;
    
    // CORREÇÃO: Utilizar window.zoneLevels para compartilhar o estado com o restante do sistema
    window.zoneLevels = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    
    // Custos: 0->1 custa 1, 1->2 custa 2 (Total: 3 por zona max)
    const upgradeCosts = { 1: 1, 2: 2 }; 

    /* ==========================================================================
       1. CONTROLE DE NAVEGAÇÃO SPA (Single Page Application)
       ========================================================================== */
    // CORREÇÃO: Anexar no window para que a função endGame possa acessá-la globalmente
    window.showScreen = function(screenId) {
        // Ocultar todas las telas
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        
        // Mostrar a tela solicitada
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.remove('hidden');
            currentScreenId = screenId;
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

    // Sistema de tempestade adaptativo
    function triggerLightning() {
        if (!lightningFlash) return;

        // Se estiver na tela de Preparação (2), os raios são mais fracos e espaçados
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

        // Intervalo: Tela 1 (3 a 10s), Tela 2 (15 a 20s)
        const nextLightningIn = isPrepScreen 
            ? Math.random() * 5000 + 15000 
            : Math.random() * 7000 + 3000;
            
        setTimeout(triggerLightning, nextLightningIn);
    }
    setTimeout(triggerLightning, 2000);

    /* ==========================================================================
       3. LÓGICA DA TELA 2: SISTEMA DE ORÇAMENTO E SENSORES
       ========================================================================== */
       
    // Atualiza o contador de orçamento no topo
    function updateBudgetDisplay() {
        const budgetRemainingEl = document.getElementById('budget-remaining');
        if (budgetRemainingEl) {
            budgetRemainingEl.textContent = currentBudget;
        }
    }

    // Atualiza a interface de uma zona específica (Cartão e Painel Lateral)
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

            // Atualiza barra visual indicadora (.zone-indicator)
            const indicator = card.querySelector('.zone-indicator');
            if (indicator) {
                if (level === 0) {
                    indicator.style.opacity = '0.3';
                    indicator.style.border = '1px solid var(--border-color)';
                } else if (level === 1) {
                    indicator.style.opacity = '0.7';
                    indicator.style.border = '1px solid var(--text-orange)';
                } else if (level === 2) {
                    indicator.style.opacity = '1';
                    indicator.style.border = '1px solid var(--text-cyan)';
                }
            }
        }
    }

    // Atualiza os textos da barra lateral (Terminal do Gêmeo Digital)
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
            
            if (level === 0) {
                item.textContent = `${zoneNames[zoneId]}: SEM SENSOR — previsão indisponível`;
                item.style.color = "#8ce6e6";
            } else if (level === 1) {
                item.textContent = `${zoneNames[zoneId]}: SENSOR NÍVEL 1 — telemetria básica ativa`;
                item.style.color = "var(--text-orange)";
            } else if (level === 2) {
                item.textContent = `${zoneNames[zoneId]}: SENSOR NÍVEL 2 — monitoramento total em tempo real`;
                item.style.color = "var(--text-cyan)";
            }
        });
    }

    // Função de Instalar/Melhorar Sensor
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

    // Função de Remover/Reduzir Sensor
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

    // Associa eventos de clique aos botões de controle
    document.querySelectorAll('.btn-increase').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const zoneId = e.target.getAttribute('data-zone-id');
            allocateSensor(zoneId);
        });
    });

    document.querySelectorAll('.btn-decrease').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const zoneId = e.target.getAttribute('data-zone-id');
            deallocateSensor(zoneId);
        });
    });

    /* ==========================================================================
       4. INTERAÇÕES DE TRANSIÇÃO E BOTÕES
       ========================================================================== */
       
    // Sair da Tela 1 para Tela 2
    if (btnStartMenu) {
        btnStartMenu.addEventListener('click', () => {
            btnStartMenu.style.transform = 'scale(0.95)';
            setTimeout(() => {
                btnStartMenu.style.transform = 'scale(1)';
                window.showScreen('screen-preparation');
            }, 150);
        });
    }

    // Sair da Tela 2 para Tela 3
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
                    window.showScreen('screen-game');
                    // CORREÇÃO: Efetivamente iniciar o jogo
                    if (typeof initScreen3 === 'function') {
                        initScreen3();
                    }
                }
            }, 150);
        });
    }

    /* ==========================================================================
       5. INICIALIZAÇÃO DE SEGURANÇA
       ========================================================================== */
    renderZoneCards();
    updateSidebarStatus();
    updateBudgetDisplay();
});

/* ======================================================================
   TELA 3 — TEMPESTADE (GAMEPLAY)
   Lógica de simulação em tempo real, estado da partida e interações
   ====================================================================== */

// CORREÇÃO: Se pularem as telas, inicia zerado em vez de sobrescrever com hardcode
if (typeof window.zoneLevels === 'undefined') {
  window.zoneLevels = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
}

// Objeto de nomes das zonas para registros e logs
const ZONE_NAMES = {
  1: "Zona 1 — Centro",
  2: "Zona 2 — Porto",
  3: "Zona 3 — Distrito Industrial",
  4: "Zona 4 — Residencial Norte",
  5: "Zona 5 — Hospital",
  6: "Zona 6 — Aeroporto"
};

// Estado Global da Partida (Tela 3)
const gameState = {
  timeRemaining: 120,
  score: 0,
  blackoutCount: 0,
  generatorUsesLeft: 2,
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
  sensorFailures: {},
  recalibrations: [],
  pairCooldowns: {},
  gameInterval: null,
  eventTimeout: null,
  isGameOver: false
};

/**
 * Inicializa e inicia a simulação da Tela 3
 */
function initScreen3() {
  gameState.timeRemaining = 120;
  gameState.score = 0;
  gameState.blackoutCount = 0;
  gameState.generatorUsesLeft = 2;
  gameState.isAttentionBusy = false;
  gameState.pendingAction = null;
  gameState.selectedOriginId = null;
  gameState.preventiveActionsCount = 0;
  gameState.totalActionsCount = 0;
  gameState.recalibrations = [];
  gameState.cutCooldowns = {};
  gameState.sensorFailures = {};
  gameState.pairCooldowns = {};
  gameState.isGameOver = false;

  for (let z = 1; z <= 6; z++) {
    const initial = Math.floor(Math.random() * 16) + 15;
    gameState.initialLoads[z] = initial;
    gameState.loads[z] = initial;
    gameState.status[z] = 'calm';
    gameState.graceSecondsLeft[z] = 0;
    gameState.blackoutSecondsLeft[z] = 0;
    gameState.sensorFailures[z] = 0;
  }

  document.getElementById('time-remaining').textContent = gameState.timeRemaining;
  document.getElementById('score-value').textContent = gameState.score;
  document.getElementById('blackout-count').textContent = '0';
  document.getElementById('generator-uses').textContent = gameState.generatorUsesLeft;

  const eventsFeed = document.getElementById('events-feed');
  if (eventsFeed) eventsFeed.innerHTML = '';
  
  const predictionsList = document.getElementById('predictions-list');
  if (predictionsList) predictionsList.innerHTML = '';

  logEvent("⚡ Tempestade iniciada! Monitoramento do Gêmeo Digital ativo.");

  setupGameEventListeners();

  if (gameState.gameInterval) clearInterval(gameState.gameInterval);
  gameState.gameInterval = setInterval(gameTick, 1000);

  scheduleNextRandomEvent();
  updateGameUI();
}

/**
 * Retorna os parâmetros da fase da tempestade baseados no tempo decorrido
 */
function getCurrentPhase() {
  const elapsed = 120 - gameState.timeRemaining;
  if (elapsed < 40) {
    return { phase: 1, name: "Calmaria", growth: 1, minEvent: 20, maxEvent: 30 };
  } else if (elapsed < 85) {
    return { phase: 2, name: "Intensificação", growth: 2, minEvent: 10, maxEvent: 18 };
  } else {
    return { phase: 3, name: "Olho da Tempestade", growth: 3, minEvent: 5, maxEvent: 10 };
  }
}

/**
 * Loop principal de simulação do jogo (Executado a cada 1 segundo)
 */
function gameTick() {
  if (gameState.isGameOver) return;

  gameState.timeRemaining--;
  document.getElementById('time-remaining').textContent = gameState.timeRemaining;

  const currentPhase = getCurrentPhase();

  for (let z = 1; z <= 6; z++) {
    if (gameState.status[z] === 'blackout') {
      gameState.blackoutSecondsLeft[z]--;
      if (gameState.blackoutSecondsLeft[z] <= 0) {
        const newLoad = Math.floor(Math.random() * 16) + 15;
        gameState.loads[z] = newLoad;
        gameState.initialLoads[z] = newLoad;
        gameState.status[z] = 'calm';
        logEvent(`🔧 ${ZONE_NAMES[z]} foi reparada pela concessionária (Carga: ${newLoad}).`);
      }
    } else {
      gameState.loads[z] += currentPhase.growth;

      if (gameState.loads[z] >= 100) {
        if (gameState.status[z] !== 'critical') {
          gameState.status[z] = 'critical';
          gameState.graceSecondsLeft[z] = 8;
          logEvent(`⚠ ALERTA CRÍTICO: ${ZONE_NAMES[z]} atingiu 100 de carga! Window de graça: 8s.`);
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

/**
 * Atualiza todos os componentes gráficos da tela
 */
function updateGameUI() {
  const currentPhase = getCurrentPhase();
  const predictionsList = document.getElementById('predictions-list');
  if (predictionsList) predictionsList.innerHTML = '';

  for (let z = 1; z <= 6; z++) {
    const card = document.querySelector(`.game-zone-card[data-zone-id="${z}"]`);
    if (!card) continue;

    const currentLoad = Math.min(100, Math.max(0, gameState.loads[z]));
    const currentStatus = gameState.status[z];

    card.setAttribute('data-status', currentStatus);

    const fillBar = card.querySelector('.zone-load-fill');
    if (fillBar) fillBar.style.width = `${currentLoad}%`;

    const loadValLabel = card.querySelector('.load-value');
    if (loadValLabel) loadValLabel.textContent = Math.round(currentLoad);

    const btnCut = card.querySelector('.btn-cut');
    const btnGen = card.querySelector('.btn-generator');

    const now = Date.now();
    const cutOnCooldown = gameState.cutCooldowns[z] && gameState.cutCooldowns[z] > now;

    if (btnCut) {
      btnCut.disabled = gameState.isAttentionBusy || currentStatus === 'blackout' || cutOnCooldown;
    }
    if (btnGen) {
      btnGen.disabled = gameState.isAttentionBusy || currentStatus === 'blackout' || gameState.generatorUsesLeft <= 0;
    }

    const predEl = card.querySelector('.zone-prediction');
    if (predEl) {
      predEl.textContent = '';
      predEl.classList.remove('exact-prediction');

      const isUnderRecalibrationOrigin = gameState.recalibrations.some(r => r.origin === z);
      const isSensorFailing = gameState.sensorFailures[z] > 0;
      const sensorLevel = window.zoneLevels[z] || 0;

      if (currentStatus !== 'blackout' && !isUnderRecalibrationOrigin && !isSensorFailing && sensorLevel > 0) {
        let timeToOverload = Math.ceil((100 - currentLoad) / currentPhase.growth);

        if (sensorLevel === 1 && currentLoad >= 70) {
          const impreciseTime = Math.max(1, timeToOverload + (z % 2 === 0 ? 2 : -2));
          predEl.textContent = `Sobrecarga em ~${impreciseTime}s`;
          addPredictionSidebar(z, `Sobrecarga em ~${impreciseTime}s (Impreciso)`);
        } else if (sensorLevel === 2 && currentLoad >= 50) {
          predEl.textContent = `Sobrecarga em ${timeToOverload}s`;
          predEl.classList.add('exact-prediction');
          addPredictionSidebar(z, `Sobrecarga exata em ${timeToOverload}s`, true);
        }
      }
    }
  }

  const btnRedirect = document.getElementById('btn-redirect');
  const btnRecalibrate = document.getElementById('btn-recalibrate');
  if (btnRedirect) btnRedirect.disabled = gameState.isAttentionBusy;
  if (btnRecalibrate) btnRecalibrate.disabled = gameState.isAttentionBusy;

  const generatorUsesEl = document.getElementById('generator-uses');
  if (generatorUsesEl) generatorUsesEl.textContent = gameState.generatorUsesLeft;
}

/**
 * Adiciona uma previsão ativa no painel da barra lateral
 */
function addPredictionSidebar(zoneId, text, isExact = false) {
  const list = document.getElementById('predictions-list');
  if (!list) return;

  const li = document.createElement('li');
  li.style.color = isExact ? '#5eead4' : '#facc15';
  li.textContent = `${ZONE_NAMES[zoneId]}: ${text}`;
  list.appendChild(li);
}

/**
 * Ativa o Cooldown de Atenção Dividida (2 segundos bloqueado)
 */
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

/**
 * Adiciona pontos ao placar e atualiza a interface
 */
function addScore(points) {
  gameState.score += points;
  const scoreValueEl = document.getElementById('score-value');
  if (scoreValueEl) scoreValueEl.textContent = gameState.score;
}

/**
 * Registra eventos no feed de logs em tempo real
 */
function logEvent(msg, type = '') {
  const feed = document.getElementById('events-feed');
  if (!feed) return;

  const li = document.createElement('li');
  if (type) li.classList.add(type);
  li.textContent = `[${120 - gameState.timeRemaining}s] ${msg}`;

  feed.insertBefore(li, feed.firstChild);
}

/**
 * Agendamento de Eventos Aleatórios (Raios e Falhas)
 */
function scheduleNextRandomEvent() {
  if (gameState.isGameOver) return;

  const currentPhase = getCurrentPhase();
  const delaySec = Math.floor(Math.random() * (currentPhase.maxEvent - currentPhase.minEvent + 1)) + currentPhase.minEvent;

  gameState.eventTimeout = setTimeout(() => {
    executeRandomEvent();
    scheduleNextRandomEvent();
  }, delaySec * 1000);
}

/**
 * Sorteia e executa um evento aleatório
 */
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

/**
 * Manipulação de interações e clique do jogador
 */
function setupGameEventListeners() {
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
      startSelectionMode('redirect-origin', "Selecione a zona de ORIGEM da carga...");
    });
  }

  if (btnRecalibrate) {
    btnRecalibrate.addEventListener('click', () => {
      if (gameState.isAttentionBusy) return;
      startSelectionMode('recalibrate-origin', "Selecione a zona com sensor para mover...");
    });
  }
}

/**
 * Ação 1: Corte de Carga (-15)
 */
function executeCutAction(zoneId) {
  if (gameState.status[zoneId] === 'blackout') return;

  const wasCritical = gameState.status[zoneId] === 'critical' || gameState.loads[zoneId] >= 100;
  gameState.loads[zoneId] = Math.max(0, gameState.loads[zoneId] - 15);
  gameState.cutCooldowns[zoneId] = Date.now() + 5000;

  gameState.totalActionsCount++;
  if (wasCritical) {
    addScore(10);
  } else {
    addScore(50);
    gameState.preventiveActionsCount++;
  }

  logEvent(`✂ Corte de carga executado na ${ZONE_NAMES[zoneId]} (-15).`);
  
  // CORREÇÃO: Atualizar UI antes de trigar o delay de UI block
  updateGameUI();
  triggerAttentionCooldown();
}

/**
 * Ação 2: Gerador de Emergência (Reseta carga)
 */
function executeGeneratorAction(zoneId) {
  if (gameState.status[zoneId] === 'blackout' || gameState.generatorUsesLeft <= 0) return;

  const wasCritical = gameState.status[zoneId] === 'critical' || gameState.loads[zoneId] >= 100;
  gameState.generatorUsesLeft--;
  gameState.loads[zoneId] = gameState.initialLoads[zoneId];

  gameState.totalActionsCount++;
  if (wasCritical) {
    addScore(10);
  } else {
    addScore(50);
    gameState.preventiveActionsCount++;
  }

  logEvent(`⚡ Gerador de emergência acionado na ${ZONE_NAMES[zoneId]}!`);
  
  // CORREÇÃO: Atualizar UI antes de trigar o delay de UI block
  updateGameUI();
  triggerAttentionCooldown();
}

/**
 * Inicia modo de seleção para ações de duas zonas
 */
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

/**
 * Trata os passos de seleção do clique nas zonas
 */
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

    const wasCritical = gameState.status[originId] === 'critical' || gameState.loads[originId] >= 100;
    gameState.loads[originId] = Math.max(0, gameState.loads[originId] - 20);
    gameState.loads[zoneId] = Math.min(100, gameState.loads[zoneId] + 10);

    gameState.totalActionsCount++;
    if (wasCritical) {
      addScore(10);
    } else {
      addScore(50);
      gameState.preventiveActionsCount++;
    }

    logEvent(`↔ Redirecionamento: ${ZONE_NAMES[originId]} (-20) ➔ ${ZONE_NAMES[zoneId]} (+10).`);
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

/**
 * Cancela o modo de seleção visual
 */
function cancelSelectionMode() {
  gameState.pendingAction = null;
  gameState.selectedOriginId = null;

  const hintEl = document.getElementById('selection-hint');
  if (hintEl) hintEl.classList.add('hidden');

  document.querySelectorAll('.game-zone-card').forEach(c => c.classList.remove('selected-target'));
}

/**
 * Encerra a partida (Vitória ou Derrota) e calcula resultado final
 */
function endGame(isVictory) {
  gameState.isGameOver = true;
  if (gameState.gameInterval) clearInterval(gameState.gameInterval);
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

  window.lastGameResult = {
    victory: isVictory,
    finalScore: gameState.score,
    bonusPoints: bonus,
    preventivePct: gameState.totalActionsCount > 0 ? Math.round((gameState.preventiveActionsCount / gameState.totalActionsCount) * 100) : 0,
    timeSurvived: 120 - gameState.timeRemaining,
    blackoutsOccurred: gameState.blackoutCount
  };

  // CORREÇÃO: Atualizar os títulos na UI antes de mostrar a tela
  if (typeof window.showScreen === 'function') {
    setTimeout(() => {
      const resultTitle = document.getElementById('result-title');
      const resultSubtitle = document.getElementById('result-subtitle');
      
      if (resultTitle) {
          resultTitle.textContent = isVictory ? "SOBREVIVÊNCIA ALCANÇADA" : "COLAPSO DO SISTEMA";
          resultTitle.style.color = isVictory ? "#5eead4" : "#f59e0b";
      }
      if (resultSubtitle) {
          resultSubtitle.textContent = `Pontuação: ${gameState.score} | Zonas perdidas: ${gameState.blackoutCount}`;
      }
      
      window.showScreen('screen-result');
    }, 2500);
  }
}