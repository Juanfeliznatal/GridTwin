document.addEventListener('DOMContentLoaded', () => {
    // Seleção dos elementos do DOM
    const btnStart = document.getElementById('btn-start');
    const bgMusic = document.getElementById('bg-music');
    const lightningFlash = document.getElementById('lightning-flash');

    /* ==========================================================================
       1. CONTROLE DE ÁUDIO (Autoplay bypass e verificação de arquivo)
       ========================================================================== */
    let isAudioAvailable = true;

    if (bgMusic) {
        bgMusic.volume = 0.4;

        // Tratamento de erro caso o arquivo MP3 ainda não esteja presente
        bgMusic.addEventListener('error', () => {
            isAudioAvailable = false;
            console.warn("Aviso: 'background-music.mp3' não foi encontrado na pasta. O jogo continuará sem áudio.");
        });
    }

    const startAudio = () => {
        if (bgMusic && isAudioAvailable && bgMusic.paused) {
            bgMusic.play().catch(error => {
                console.log("Aguardando interação do usuário para tocar o áudio.");
            });
        }
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

        lightningFlash.classList.add('active');
        const flashDuration = Math.random() * 100 + 50;

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

        const nextLightningIn = Math.random() * 7000 + 3000;
        setTimeout(triggerLightning, nextLightningIn);
    }

    setTimeout(triggerLightning, 2000);

    /* ==========================================================================
       3. AÇÃO DO BOTÃO INICIAR (Animação de clique corrigida)
       ========================================================================== */
    if (btnStart) {
        btnStart.addEventListener('click', () => {
            // Efeito visual de clique (afunda o botão)
            btnStart.style.transform = 'scale(0.95)';

            // Reverte o botão para o tamanho normal após 150ms
            setTimeout(() => {
                btnStart.style.transform = 'scale(1)';
            }, 150);

            console.log("Iniciando GridTwin: Blackout Protocol...");
        });
    }
});