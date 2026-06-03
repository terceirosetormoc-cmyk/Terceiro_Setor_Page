// A URL começa totalmente vazia. Segurança absoluta no histórico do Git!
let URL_BASE = "";

// --- INICIALIZAÇÃO ASSÍNCRONA ---
async function iniciar() {
  try {
    // 1. O script tenta ler o arquivo injetado pela automação
    const resConfig = await fetch('config.json');
    const config = await resConfig.json();
    
    // 2. Alimenta a variável global
    URL_BASE = config.apiUrl;

    // 3. Monta as URLs das abas dinamicamente
    const URL_POSTAGENS = `${URL_BASE}?aba=Postagens`;
    const URL_AGENDA = `${URL_BASE}?aba=Agenda`;
    const URL_PARCEIROS = `${URL_BASE}?aba=Parceiros`;

    // 4. Dispara as requisições paralelas para o Google Apps Script
    const [resPostagens, resAgenda, resParceiros] = await Promise.all([
      fetch(URL_POSTAGENS),
      fetch(URL_AGENDA),
      fetch(URL_PARCEIROS),
    ]);

    todosOsProjetos = await resPostagens.json();
    todosOsEventos = await resAgenda.json();
    todosOsParceiros = await resParceiros.json();

    const loader =
      document.getElementById("loader") ||
      document.getElementById("loading-state");
    if (loader) loader.remove();

    if (document.getElementById("grid-agenda")) {
      renderizarAgenda();
    }

    if (document.getElementById("grid-projetos")) {
      renderizarHome();
    }

    if (document.getElementById("grid-parceiros")) {
      renderizarParceiros();
    }

    if (document.getElementById("p-titulo")) {
      renderizarDetalhes();
    }

    if (typeof configurarObservador === "function") {
      configurarObservador();
    }
  } catch (error) {
    console.error("Erro ao carregar dados do portal ou arquivo de configuração:", error);
  }
}

// O restante do seu script (funções de renderização, Pix, etc.) continua abaixo sem alterações...
iniciar();
