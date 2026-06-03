// A URL começa totalmente vazia para proteger seus dados no histórico do GitHub
let URL_BASE = "";

// Variáveis globais para armazenar os dados vindos da planilha
let todosOsProjetos = [];
let todosOsEventos = [];
let todosOsParceiros = [];

// --- INICIALIZAÇÃO ASSÍNCRONA SEGURA ---
async function iniciar() {
  try {
    // 1. Busca o arquivo de configuração gerado pelo GitHub Actions
    const resConfig = await fetch('config.json');
    const config = await resConfig.json();
    
    // 2. Alimenta a URL base com o valor oculto
    URL_BASE = config.apiUrl;

    // 3. Monta os endpoints dinamicamente
    const URL_POSTAGENS = `${URL_BASE}?aba=Postagens`;
    const URL_AGENDA = `${URL_BASE}?aba=Agenda`;
    const URL_PARCEIROS = `${URL_BASE}?aba=Parceiros`;

    // 4. Executa as buscas em paralelo no Google Sheets
    const [resPostagens, resAgenda, resParceiros] = await Promise.all([
      fetch(URL_POSTAGENS),
      fetch(URL_AGENDA),
      fetch(URL_PARCEIROS),
    ]);

    todosOsProjetos = await resPostagens.json();
    todosOsEventos = await resAgenda.json();
    todosOsParceiros = await resParceiros.json();

    // Remove o indicador de carregamento, se houver
    const loader = document.getElementById("loader") || document.getElementById("loading-state");
    if (loader) loader.remove();

    // Executa as renderizações se as seções existirem no HTML atual
    if (document.getElementById("grid-agenda")) {
      renderizarAgenda();
    }

    if (document.getElementById("grid-projetos")) {
      renderizarHome();
    }

    if (document.getElementById("grid-parceiros")) {
      renderizarParceiros();
    }

    if (typeof configurarObservador === "function") {
      configurarObservador();
    }
  } catch (error) {
    console.error("Erro ao carregar dados do portal ou arquivo de configuração:", error);
  }
}

// --- FUNÇÃO: RENDERIZAR AGENDA ---
function renderizarAgenda() {
  const gridAgenda = document.getElementById("grid-agenda");
  if (!gridAgenda) return;

  gridAgenda.innerHTML = ""; // Limpa o grid provisório

  if (todosOsEventos.length === 0) {
    gridAgenda.innerHTML = `<p class="text-portal-text/50 text-sm">Nenhum evento agendado para os próximos dias.</p>`;
    return;
  }

  todosOsEventos.forEach(evento => {
    // Monta o card de cada linha da aba Agenda
    const card = document.createElement("div");
    card.className = "bg-white border border-portal-text/5 rounded-portal p-6 shadow-md hover:shadow-xl transition-all duration-300";
    card.innerHTML = `
      <span class="text-xs font-bold text-portal-yellow uppercase tracking-wider">${evento.Data || 'Breve'}</span>
      <h3 class="text-xl font-bold text-portal-dark mt-2">${evento.Titulo || 'Sem Título'}</h3>
      <p class="text-portal-text/70 text-sm mt-2">${evento.Descricao || ''}</p>
      ${evento.Local ? `<p class="text-xs font-medium text-portal-text/40 mt-4"><i class="fa-solid fa-location-dot mr-1"></i> ${evento.Local}</p>` : ''}
    `;
    gridAgenda.appendChild(card);
  });
}

// --- FUNÇÃO: RENDERIZAR PROJETOS (POSTAGENS) ---
function renderizarHome() {
  const gridProjetos = document.getElementById("grid-projetos");
  if (!gridProjetos) return;

  gridProjetos.innerHTML = "";

  if (todosOsProjetos.length === 0) {
    gridProjetos.innerHTML = `<p class="text-portal-text/50 text-sm">Nenhuma postagem encontrada.</p>`;
    return;
  }

  // Exibe apenas os 3 primeiros projetos mais recentes na Home
  const destaques = todosOsProjetos.slice(0, 3);

  destaques.forEach(projeto => {
    const card = document.createElement("div");
    card.className = "bg-white border border-portal-text/5 rounded-portal overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col";
    card.innerHTML = `
      <div class="h-48 w-full bg-portal-muted overflow-hidden relative">
        <img src="${projeto.Imagem || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=600'}" class="w-full h-full object-cover" alt="${projeto.Titulo}">
      </div>
      <div class="p-6 flex flex-col flex-grow justify-between">
        <div class="space-y-2">
          <span class="text-[10px] font-bold uppercase tracking-widest text-portal-yellow bg-portal-accent/30 px-2.5 py-1 rounded-md">${projeto.Categoria || 'Ação'}</span>
          <h3 class="text-xl font-bold text-portal-dark pt-1">${projeto.Titulo || 'Sem Título'}</h3>
          <p class="text-portal-text/70 text-sm line-clamp-3">${projeto.Previa || projeto.Texto || ''}</p>
        </div>
        <div class="pt-6">
          <button onclick="abrirModalDetalhes('${projeto.Titulo}')" class="text-sm font-bold text-portal-dark hover:text-portal-yellow transition flex items-center gap-1">
            Ler Mais <i class="fa-solid fa-arrow-right text-xs"></i>
          </button>
        </div>
      </div>
    `;
    gridProjetos.appendChild(card);
  });
}

// --- FUNÇÃO: RENDERIZAR PARCEIROS ---
function renderizarParceiros() {
  const gridParceiros = document.getElementById("grid-parceiros");
  if (!gridParceiros) return;

  gridParceiros.innerHTML = "";

  if (todosOsParceiros.length === 0) {
    gridParceiros.style.display = "none";
    return;
  }

  todosOsParceiros.forEach(parceiro => {
    const link = document.createElement("a");
    link.href = parceiro.Link || "#";
    link.target = parceiro.Link ? "_blank" : "_self";
    link.className = "grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition duration-300 max-w-[120px] max-h-[50px] object-contain";
    link.innerHTML = `<img src="${parceiro.Logo}" alt="${parceiro.Nome || 'Parceiro'}" class="w-full h-full object-contain">`;
    gridParceiros.appendChild(link);
  });
}

// --- FUNÇÕES DOS MODAIS (DOAÇÃO E AUXILIARES) ---
function abrirModalDoacao() {
  const modal = document.getElementById("modal-doacao");
  if (modal) modal.classList.remove("hidden");
}

function fecharModalDoacao() {
  const modal = document.getElementById("modal-doacao");
  if (modal) modal.classList.add("hidden");
}

function copiarPix() {
  const textoChave = document.getElementById("texto-chave").innerText;
  navigator.clipboard.writeText(textoChave).then(() => {
    alert("Chave Pix copiada com sucesso!");
  }).catch(() => {
    alert("Não foi possível copiar automaticamente. Selecione o texto e copie manualmente.");
  });
}

// --- ANIMAÇÃO SCROLL (OBSERVADOR INTERSECTION) ---
function configurarObservador() {
  const elementos = document.querySelectorAll('.revelar');
  const observador = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('ativo');
      }
    });
  }, { threshold: 0.1 });

  elementos.forEach(el => observador.observe(el));
}

// Dispara o fluxo inicializador
iniciar();
