// Alterado: Começa vazia para não expor seus dados no histórico do GitHub
let URL_BASE = "";

// --- INICIALIZAÇÃO *****ÍNCRONA ---
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
function renderizarParceiros() {
  const gridParceiros = document.getElementById("grid-parceiros");
  if (!gridParceiros) return;

  gridParceiros.innerHTML = "";

  if (
    !todosOsParceiros ||
    todosOsParceiros.length === 0 ||
    todosOsParceiros.erro
  ) {
    gridParceiros.innerHTML = `<p class="text-portal-text/40 text-xs italic">Espaço reservado para parceiros institucionais.</p>`;
    return;
  }

  todosOsParceiros.forEach((parceiro) => {
    const nomeParceiro = parceiro.nome || "Parceiro Institucional";
    const imagemParceiro = parceiro.imagem || "";

    gridParceiros.innerHTML += `
      <div class="flex flex-col items-center justify-center p-4 grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300 max-w-[150px]">
        <img src="${imagemParceiro}" alt="Logo ${nomeParceiro}" class="max-h-12 w-auto object-contain mb-2" onerror="this.src='https://placehold.co/150x50?text=${encodeURIComponent(nomeParceiro)}'">
        <span class="text-[10px] font-bold text-portal-text/40 uppercase tracking-wider text-center block md:hidden">${nomeParceiro}</span>
      </div>
    `;
  });
}

function renderizarAgenda() {
  const gridAgenda = document.getElementById("grid-agenda");
  if (!gridAgenda) return;

  gridAgenda.innerHTML = "";

  if (!todosOsEventos || todosOsEventos.length === 0 || todosOsEventos.erro) {
    gridAgenda.innerHTML = `<p class="text-portal-text text-sm italic col-span-3">Nenhuma ação agendada no momento.</p>`;
    return;
  }

  todosOsEventos.forEach((evento) => {
    let horaFormatada = evento.hora || "--:--";

    if (typeof horaFormatada === "string" && horaFormatada.includes("T")) {
      horaFormatada = horaFormatada.split("T")[1].substring(0, 5);
    }

    const diaVal = evento.dia || "00";
    const mesVal = evento.mes || "MES";

    gridAgenda.innerHTML += `
      <div class="bg-white border border-portal-text/5 p-6 rounded-xl flex gap-4 items-start transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1">
        <div class="bg-portal-dark text-white text-center p-3 rounded-lg font-bold min-w-[60px] shadow-sm">
          <span class="block text-xl leading-none text-portal-yellow">${diaVal}</span>
          <span class="text-xs uppercase font-medium block mt-1">${mesVal}</span>
        </div>
        <div>
          <h4 class="font-bold text-portal-dark text-lg leading-tight">${evento.titulo || "Sem Título"}</h4>
          <p class="text-portal-text/60 text-xs mt-1 font-medium">${evento.local || "Local não informado"} • ${horaFormatada}</p>
        </div>
      </div>
    `;
  });
}

function renderizarHome() {
  const gridHome = document.getElementById("grid-projetos");
  if (!gridHome) return;

  gridHome.innerHTML = "";

  todosOsProjetos.slice(0, 5).forEach((projeto) => {
    gridHome.innerHTML += criarCardHTML(projeto);
  });

  gridHome.innerHTML += `
      <div onclick="abrirModal()" class="bg-white border-2 border-dashed border-portal-text/20 rounded-portal flex flex-col items-center justify-center p-10 text-center hover:bg-portal-muted hover:border-portal-yellow/60 hover:shadow-xl transition-all cursor-pointer group shadow-md">
            <div class="w-12 h-12 rounded-full bg-portal-muted group-hover:bg-portal-yellow flex items-center justify-center text-portal-dark transition-colors duration-300 mb-3 text-lg">
              <i class="fa-solid fa-plus"></i>
            </div>
            <h3 class="text-xl font-bold text-portal-dark uppercase tracking-tight group-hover:text-portal-yellow transition-colors">Ver outras postagens</h3>
            <p class="text-portal-text/50 mt-1 font-semibold uppercase text-xs tracking-wider">Postagens antigas</p>
        </div>
    `;
}

function criarCardHTML(projeto) {
  const link = `post.html?projeto=${encodeURIComponent(projeto.titulo)}`;
  return `
        <div class="bg-white border border-portal-text/5 rounded-portal p-6 flex flex-col transition-all duration-300 shadow-md hover:shadow-2xl hover:-translate-y-2">
            <div class="overflow-hidden rounded-lg mb-4 h-48 w-full shadow-inner bg-portal-muted">
               <img src="${projeto.imagem}" class="h-full w-full object-cover hover:scale-105 transition-transform duration-500">
            </div>
            <span class="text-portal-yellow text-[10px] font-bold uppercase tracking-widest w-fit mb-2 bg-portal-yellow/10 px-2.5 py-0.5 rounded-md">${projeto.categoria}</span>
            <h3 class="text-2xl font-bold text-portal-dark mt-1 leading-tight line-clamp-2">${projeto.titulo}</h3>
            <p class="text-portal-text/70 text-sm mt-2 mb-5 line-clamp-2">${projeto.descricao || "Conheça mais detalhes sobre esse projeto clicando abaixo."}</p>
            <a href="${link}" class="mt-auto block text-center bg-portal-dark text-white py-3 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-portal-yellow hover:text-portal-dark shadow-sm hover:shadow-md transition-all duration-200">
                Conhecer Projeto
            </a>
        </div>
    `;
}

function abrirModal() {
  paginaAtual = 1;
  const modal = document.getElementById("modal-acervo");
  if (modal) {
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    renderizarPaginaAcervo();
  }
}

function renderizarPaginaAcervo() {
  const gridAcervo = document.getElementById("grid-acervo");
  if (!gridAcervo) return;

  const inicio = (paginaAtual - 1) * itensPorPagina;
  const projetosExibidos = todosOsProjetos.slice(
    inicio,
    inicio + itensPorPagina,
  );

  gridAcervo.innerHTML = "";
  projetosExibidos.forEach((projeto) => {
    gridAcervo.innerHTML += `
        <div class="flex items-center justify-between p-4 bg-white border border-portal-text/5 rounded-xl hover:border-portal-yellow/30 shadow-sm hover:shadow-md transition-all duration-200">
            <div class="flex items-center gap-4">
                <img src="${projeto.imagem}" class="w-14 h-14 object-cover rounded-lg border border-portal-text/5 shadow-inner">
                <div>
                    <span class="text-[10px] font-bold text-portal-yellow uppercase tracking-wider block">${projeto.categoria}</span>
                    <h4 class="font-bold text-portal-dark text-base leading-tight">${projeto.titulo}</h4>
                </div>
            </div>
            <a href="post.html?projeto=${encodeURIComponent(projeto.titulo)}" class="bg-portal-dark text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-portal-yellow hover:text-portal-dark transition-all shadow-sm">
                Abrir
            </a>
        </div>
    `;
  });

  if (document.getElementById("pagina-atual")) {
    document.getElementById("pagina-atual").innerText = `Página ${paginaAtual}`;
  }
  if (document.getElementById("btn-prev")) {
    document.getElementById("btn-prev").disabled = paginaAtual === 1;
  }
  if (document.getElementById("btn-next")) {
    document.getElementById("btn-next").disabled =
      inicio + itensPorPagina >= todosOsProjetos.length;
  }
}

function mudarPagina(direcao) {
  paginaAtual += direcao;
  renderizarPaginaAcervo();
}

function fecharModal() {
  const modal = document.getElementById("modal-acervo");
  if (modal) {
    modal.classList.add("hidden");
    document.body.style.overflow = "auto";
  }
}

// Funções de doação e Pix mantidas sem alterações
function abrirModalDoacao() {
  const modal = document.getElementById("modal-doacao");
  if (modal) {
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }
}

function fecharModalDoacao() {
  const modal = document.getElementById("modal-doacao");
  if (modal) {
    modal.classList.add("hidden");
    document.body.style.overflow = "auto";
  }
}

function copiarPix() {
  const elementoChave = document.getElementById("texto-chave");
  if (!elementoChave) return;

  const sampleChave = elementoChave.innerText;

  navigator.clipboard
    .writeText(sampleChave)
    .then(() => {
      const alvo = document.querySelector(
        "button[onclick='copiarPix()'] span:last-child",
      );
      if (!alvo) return;

      const originalText = alvo.innerHTML;

      alvo.innerHTML = `<i class="fa-solid fa-check"></i> Copiado!`;
      alvo.classList.remove("bg-portal-dark", "text-white");
      alvo.classList.add("bg-portal-yellow", "text-portal-dark");

      setTimeout(() => {
        alvo.innerHTML = originalText;
        alvo.classList.remove("bg-portal-yellow", "text-portal-dark");
        alvo.classList.add("bg-portal-dark", "text-white");
      }, 2000);
    })
    .catch((err) => {
      console.error("Erro ao copiar o Pix: ", err);
    });
}

// --- EFEITO DE SURGIMENTO AVANÇADO ---
function configurarObservador() {
  const elementosParaRevelar = document.querySelectorAll(".revelar");

  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add("ativo");

          if (
            entrada.target.id === "grid-projetos" ||
            entrada.target.id === "grid-agenda" ||
            entrada.target.id === "grid-parceiros" ||
            entrada.target.id === "grid-equipe" || 
            entrada.target.id === "grid-suportes" 
          ) {
            const filhos = entrada.target.children;
            Array.from(filhos).forEach((filho, index) => {
              filho.style.transition = `opacity 0.6s ease-out ${index * 0.15}s, transform 0.6s ease-out ${index * 0.15}s`;
              filho.style.opacity = "1";
              filho.style.transform = "translateY(0)";
            });
          }
          observador.unobserve(entrada.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "0px 0px -30px 0px",
    },
  );

  elementosParaRevelar.forEach((elemento) => {
    if (
      elemento.id === "grid-projetos" ||
      elemento.id === "grid-agenda" ||
      elemento.id === "grid-parceiros" ||
      elemento.id === "grid-equipe" || 
      elemento.id === "grid-suportes" 
    ) {
      Array.from(elemento.children).forEach((filho) => {
        filho.style.opacity = "0";
        filho.style.transform = "translateY(15px)";
      });
    }
    observador.observe(elemento);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  configurarObservador();
});

// --- FUNÇÕES DA PÁGINA DE DETALHES ---
function renderizarDetalhes() {
  const urlParams = new URLSearchParams(window.location.search);
  const nomeBuscado = urlParams.get("projeto");
  if (!nomeBuscado) return;

  const projeto = todosOsProjetos.find(
    (p) => p.titulo === decodeURIComponent(nomeBuscado),
  );

  if (projeto) {
    if (document.getElementById("p-titulo"))
      document.getElementById("p-titulo").innerText = projeto.titulo;
    if (document.getElementById("p-categoria"))
      document.getElementById("p-categoria").innerText = projeto.categoria;
    if (document.getElementById("p-imagem"))
      document.getElementById("p-imagem").src = projeto.imagem;

    if (document.getElementById("p-descricao")) {
      document.getElementById("p-descricao").innerHTML = projeto.descricao;
    }

    if (document.getElementById("projeto-content"))
      document.getElementById("projeto-content").classList.remove("hidden");
  }
}

iniciar();
