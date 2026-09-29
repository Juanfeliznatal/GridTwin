document.addEventListener('DOMContentLoaded', () => {
    /* ==========================================================================
       VARIÁVEIS DE ESTADO GLOBAL E DOM
       ========================================================================== */
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
    const zoneLevels = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    
    // Custos: 0->1 custa 1, 1->2 custa 2 (Total: 3 por zona max)
    const upgradeCosts = { 1: 1, 2: 2 }; 

    /* ==========================================================================
       1. CONTROLE DE NAVEGAÇÃO SPA (Single Page Application)
       ========================================================================== */
    function showScreen(screenId) {
        // Ocultar todas as telas
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        
        // Mostrar a tela solicitada
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.remove('hidden');
            currentScreenId = screenId;
        }
    }

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

    // Sistema de tempestade adaptativo (CORRIGIDO: uso de variável CSS)
    function triggerLightning() {
        if (!lightningFlash) return;

        // Se estiver na tela de Preparação (2), os raios são mais fracos e espaçados
        const isPrepScreen = currentScreenId === 'screen-preparation';
        
        // Em vez de forçar o estilo inline de opacity que fica preso, 
        // injetamos uma variável CSS que só tem efeito enquanto a classe .active existir.
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
        document.getElementById('budget-remaining').textContent = currentBudget;
    }

    // Atualiza a interface de uma zona específica (Cartão e Painel Lateral)
    function renderZoneCards() {
        for (let zoneId = 1; zoneId <= 6; zoneId++) {
            const level = zoneLevels[zoneId];
            const card = document.querySelector(`.zone-card[data-zone-id="${zoneId}"]`);
            
            if (!card) continue; // Prevenção de erro caso o HTML mude

            card.setAttribute('data-level', level);
            card.querySelector('.level-value').textContent = level;

            const btnIncrease = card.querySelector('.btn-increase');
            const btnDecrease = card.querySelector('.btn-decrease');

            const costToNext = upgradeCosts[level + 1];
            
            btnIncrease.disabled = (level >= 2) || (currentBudget < costToNext);
            btnDecrease.disabled = (level <= 0);
        }
    }

    // Atualiza os textos da barra lateral (Terminal do Gêmeo Digital)
    function updateSidebarStatus() {
        const listItems = document.querySelectorAll('.sidebar-status-item');
        listItems.forEach(item => {
            const zoneId = item.getAttribute('data-zone-id');
            const level = zoneLevels[zoneId];
            
            const zoneNames = ["", "Centro", "Porto", "Distrito Industrial", "Residencial Norte", "Hospital", "Aeroporto"];
            const baseText = `Zona ${zoneId} — ${zoneNames[zoneId]}:`;
            
            item.classList.remove('level-1', 'level-2');
            
            if (level === 0) {
                item.textContent = `${baseText} SEM SENSOR — previsão indisponível`;
            } else if (level === 1) {
                item.textContent = `${baseText} Monitorada (nível 1) — previsão básica`;
                item.classList.add('level-1');
            } else if (level === 2) {
                item.textContent = `${baseText} Monitorada (nível 2) — previsão avançada`;
                item.classList.add('level-2');
            }
        });
    }

    // Função de Instalar/Melhorar Sensor
    function allocateSensor(zoneId) {
        const currentLevel = zoneLevels[zoneId];
        if (currentLevel >= 2) return;
        
        const cost = upgradeCosts[currentLevel + 1];
        if (currentBudget >= cost) {
            currentBudget -= cost;
            zoneLevels[zoneId]++;
            
            updateBudgetDisplay();
            renderZoneCards();
            updateSidebarStatus();
        }
    }

    // Função de Remover/Reduzir Sensor
    function deallocateSensor(zoneId) {
        const currentLevel = zoneLevels[zoneId];
        if (currentLevel <= 0) return;
        
        const refund = upgradeCosts[currentLevel];
        currentBudget += refund;
        zoneLevels[zoneId]--;
        
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
       4. INTERAÇÕES DE TRANSIÇÃO E BOTÕES (CORRIGIDOS)
       ========================================================================== */
       
    // Sair da Tela 1 para Tela 2
    if (btnStartMenu) {
        btnStartMenu.addEventListener('click', () => {
            btnStartMenu.style.transform = 'scale(0.95)';
            setTimeout(() => {
                btnStartMenu.style.transform = 'scale(1)';
                showScreen('screen-preparation');
            }, 150);
        });
    }

    // Sair da Tela 2 para Tela 3 (CORRIGIDO: timeout adicionado para igualar animação)
    let warningActive = false;
    if (btnStartStorm) {
        btnStartStorm.addEventListener('click', () => {
            btnStartStorm.style.transform = 'scale(0.95)';
            
            // Espera a animação do botão (150ms) antes de processar a lógica
            setTimeout(() => {
                btnStartStorm.style.transform = 'scale(1)';
                
                const warningEl = document.getElementById('budget-warning');
                
                if (currentBudget > 0 && !warningActive) {
                    warningActive = true;
                    document.getElementById('unused-budget').textContent = currentBudget;
                    warningEl.classList.remove('hidden');
                    
                    setTimeout(() => {
                        warningActive = false;
                        warningEl.classList.add('hidden');
                    }, 2500);
                } else {
                    warningEl.classList.add('hidden');
                    showScreen('screen-game');
                }
            }, 150);
        });
    }

    /* ==========================================================================
       5. INICIALIZAÇÃO DE SEGURANÇA (CORRIGIDO)
       ========================================================================== */
    // Garante que a interface nasça com o estado correto independentemente do HTML
    renderZoneCards();
    updateSidebarStatus();
    updateBudgetDisplay();
});