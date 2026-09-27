document.addEventListener('DOMContentLoaded', () => {
    // Seleção dos elementos do DOM
    const btnStart = document.getElementById('btn-start');
    const bgMusic = document.getElementById('bg-music');
    const lightningFlash = document.getElementById('lightning-flash');

    // Ajusta o volume inicial da música (0.0 a 1.0)
    if (bgMusic) {
        bgMusic.volume = 0.4;
    }

    /* ==========================================================================
       1. CONTROLE DE ÁUDIO (Autoplay bypass)
       Navegadores bloqueiam som automático; tocamos na primeira interação.
       ========================================================================== */
    const startAudio = () => {
        if (bgMusic && bgMusic.paused) {
            bgMusic.play().catch(error => {
                console.log("Aguardando interação do usuário para tocar o áudio.");
            });
        }
        // Remove os ouvintes para não rodar novamente sem necessidade
        document.removeEventListener('click', startAudio);
        document.removeEventListener('keydown', startAudio);
    };

    document.addEventListener('click', startAudio);
    document.addEventListener('keydown', startAudio);

    /* ==========================================================================
       2. EFEITO DE TEMPESTADE (Flashes de raio aleatórios)
       ========================================================================== */
    function triggerLightning() {
        if (!lightningFlash) return;

        // Dispara o flash adicionando a classe CSS
        lightningFlash.classList.add('active');

        // Tempo de duração do flash (curto e rápido: entre 50ms e 150ms)
        const flashDuration = Math.random() * 100 + 50;

        setTimeout(() => {
            lightningFlash.classList.remove('active');
        }, flashDuration);

        // Possibilidade de um "duplo flash" (comum em raios reais)
        if (Math.random() > 0.6) {
            setTimeout(() => {
                lightningFlash.classList.add('active');
                setTimeout(() => {
                    lightningFlash.classList.remove('active');
                }, 40);
            }, flashDuration + 80);
        }

        // Agenda o próximo raio em um intervalo aleatório (entre 3 e 10 segundos)
        const nextLightningIn = Math.random() * 7000 + 3000;
        setTimeout(triggerLightning, nextLightningIn);
    }

    // Inicia o ciclo de raios após 2 segundos de carregamento
    setTimeout(triggerLightning, 2000);

    /* ==========================================================================
       3. AÇÃO DO BOTÃO INICIAR
       ========================================================================== */
    if (btnStart) {
        btnStart.addEventListener('click', () => {
            // Efeito visual rápido de confirmação
            btnStart.style.transform = 'scale(0.95)';
            
            // Aqui você direciona para a próxima tela do jogo ou carrega a lógica principal
            console.log("Iniciando GridTwin: Blackout Protocol...");

            setTimeout(() => {
                // Exemplo: redirecionar para a página do jogo principal
                // window.location.href = "game.html";
                alert("Carregando o Gêmeo Digital...");
            }, 200);
        });
    }
});