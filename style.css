/* ==========================================================================
   1. IMPORTAÇÃO DE FONTES INDIE / RETRÔ
   ========================================================================== */
@import url('https://fonts.googleapis.com/css2?family=VT323&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');

/* ==========================================================================
   2. RESET E CONFIGURAÇÕES GERAIS
   ========================================================================== */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    /* Fundo escuro levemente dessaturado, tom analógico */
    background-color: #0b0f19;
    color: #d1d5db;
    font-family: 'Space Mono', monospace;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
}

/* ==========================================================================
   3. EFEITO VINTAGE CRT / IMPERFEIÇÃO DA TELA
   ========================================================================== */
/* Linhas de scanline (simula monitor antigo/CRT) por cima de tudo */
body::before {
    content: " ";
    display: block;
    position: absolute;
    top: 0; left: 0; bottom: 0; right: 0;
    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.35) 50%);
    background-size: 100% 4px;
    z-index: 20;
    pointer-events: none;
    opacity: 0.8;
}

/* Vignette (escurecimento nas bordas para ar analógico) */
body::after {
    content: " ";
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    box-shadow: inset 0 0 100px rgba(0,0,0,0.85);
    z-index: 21;
    pointer-events: none;
}

/* ==========================================================================
   4. FUNDO DESENHADO / LINHAS DE ENERGIA IMPERFEITAS
   ========================================================================== */
.grid-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    /* Grid estilo pixel/pontilhado em vez de vetores perfeitos */
    background-image: 
        radial-gradient(rgba(0, 200, 220, 0.15) 1px, transparent 0);
    background-size: 24px 24px;
    animation: driftGrid 12s linear infinite;
}

/* Pulso de oscilação imperfeita na tela */
.grid-background::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at 50% 50%, rgba(13, 148, 136, 0.08) 0%, rgba(11, 15, 25, 0.95) 80%);
    animation: flickerLight 3s ease-in-out infinite alternate;
}

@keyframes driftGrid {
    0% { background-position: 0 0; }
    100% { background-position: 24px 24px; }
}

@keyframes flickerLight {
    0% { opacity: 0.7; }
    50% { opacity: 1; }
    100% { opacity: 0.8; }
}

/* ==========================================================================
   5. FLASH DE RAIO LO-FI
   ========================================================================== */
.lightning-flash {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(200, 230, 255, 0.2);
    z-index: 2;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.03s ease;
}

.lightning-flash.active {
    opacity: 1;
}

/* ==========================================================================
   6. INTERFACE / CONTEÚDO (ESTILO INDIE)
   ========================================================================== */
.menu-container {
    position: relative;
    z-index: 10;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    padding: 4rem 2rem;
    text-align: center;
}

/* --- Título e Subtítulo --- */
.title-section {
    margin-top: auto;
    margin-bottom: 2rem;
}

.main-title {
    font-family: 'VT323', monospace; /* Fonte estilo arcade/pixel */
    font-size: 4.5rem;
    font-weight: 400;
    text-transform: uppercase;
    color: #5eead4; /* Cyan lo-fi suave */
    letter-spacing: 3px;
    /* Efeito de sombra estilo impressão/offset retrô */
    text-shadow: 
        3px 3px 0px #0f766e,
        -1px -1px 0px rgba(255,255,255,0.2);
    animation: microGlitch 4s infinite;
}

.subtitle {
    font-family: 'Space Mono', monospace;
    font-size: 1rem;
    color: #94a3b8;
    letter-spacing: 1px;
    margin-top: 0.8rem;
    font-style: italic;
}

/* --- Botão Iniciar (Estilo pixel / artesanal) --- */
.action-section {
    margin-bottom: auto;
    margin-top: 2rem;
}

.btn-start {
    font-family: 'VT323', monospace;
    font-size: 2.2rem;
    color: #0b0f19;
    background-color: #f59e0b; /* Amarelo/Âmbar retrô */
    /* Borda "imperfeita" de 3D clássico dos anos 90 */
    border: none;
    border-top: 4px solid #fde68a;
    border-left: 4px solid #fde68a;
    border-right: 4px solid #b45309;
    border-bottom: 4px solid #b45309;
    padding: 0.4rem 3rem;
    cursor: pointer;
    box-shadow: 0 6px 0px #78350f;
    transition: all 0.1s ease;
}

.btn-start:hover {
    background-color: #38bdf8; /* Azul claro ao passar o mouse */
    border-top-color: #bae6fd;
    border-left-color: #bae6fd;
    border-right-color: #0284c7;
    border-bottom-color: #0284c7;
    box-shadow: 0 6px 0px #0369a1;
    transform: translateY(-2px);
}

.btn-start:active {
    transform: translateY(4px);
    box-shadow: 0 2px 0px #0369a1;
}

/* --- Créditos --- */
.credits-section {
    font-family: 'Space Mono', monospace;
    font-size: 0.75rem;
    color: #475569;
    line-height: 1.6;
}

/* Pequeno tremor sutil aleatório no título (imperfeição analogica) */
@keyframes microGlitch {
    0%, 100% { transform: translate(0, 0); }
    94% { transform: translate(0, 0); }
    95% { transform: translate(-2px, 1px); }
    96% { transform: translate(2px, -1px); }
    97% { transform: translate(0, 0); }
}

/* Responsividade */
@media (max-width: 768px) {
    .main-title {
        font-size: 3rem;
    }
    .subtitle {
        font-size: 0.85rem;
    }
    .btn-start {
        font-size: 1.8rem;
        padding: 0.3rem 2rem;
    }
}