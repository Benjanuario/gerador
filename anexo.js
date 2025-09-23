// anexo.js — Versão corrigida para garantir que o botão Remover Anexo sempre aparece
// e que o sessionStorage.planoData é actualizado ao salvar/remover anexo.

let cropper = null;
let currentImgEl = null;

// Mostrar / esconder painéis
function mostrarAnexoTexto(){
  document.getElementById('anexoTexto').style.display = 'block';
  document.getElementById('anexoChatGPT').style.display = 'none';
  document.getElementById('anexoFoto').style.display = 'none';
}
function mostrarAnexoChatGPT(){
  document.getElementById('anexoTexto').style.display = 'none';
  document.getElementById('anexoChatGPT').style.display = 'block';
  document.getElementById('anexoFoto').style.display = 'none';
}
function mostrarAnexoFoto(){
  document.getElementById('anexoTexto').style.display = 'none';
  document.getElementById('anexoChatGPT').style.display = 'none';
  document.getElementById('anexoFoto').style.display = 'block';
}

// Abrir o painel de anexos
function abrirAnexo(){
  const container = document.getElementById('anexoContainerContent');
  if (!container) return console.error('anexoContainerContent não encontrado');
  container.style.display = 'block';
  container.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const btnAdd = document.getElementById('btnAdicionarAnexo');
  if (btnAdd) btnAdd.style.display = 'none';
}

// Fechar painel (sem salvar)
function fecharAnexo(){
  const container = document.getElementById('anexoContainerContent');
  if (!container) return;
  container.style.display = 'none';
  if (!window.anexoSalvo) {
    const btnAdd = document.getElementById('btnAdicionarAnexo');
    if (btnAdd) btnAdd.style.display = 'inline-block';
  }
}

// Abrir ChatGPT
function abrirChatGPT(){
  const tema = document.forms['planoForm']?.tema?.value || 'Tema não definido';
  const prompt = `Faz um resumo em poucas palavras do tema "${tema}" e possíveis exemplos.`;

  navigator.clipboard.writeText(prompt).then(()=> {
    window.open('https://chat.openai.com/?model=text-davinci-002-render-sha', '_blank');
    alert('✅ O prompt foi copiado!\nBasta colar no campo do ChatGPT e enviar.');
  }).catch(()=> {
    window.open('https://chat.openai.com/?model=text-davinci-002-render-sha', '_blank');
    alert('⚠️ Não foi possível copiar automaticamente.\nCopie manualmente este prompt:\n\n' + prompt);
  });
}

// Cropper utilitários
function rotateLeft(){ if (cropper) cropper.rotate(-90); }
function rotateRight(){ if (cropper) cropper.rotate(90); }
function zoomIn(){ if (cropper) cropper.zoom(0.1); }
function zoomOut(){ if (cropper) cropper.zoom(-0.1); }
function resetCropper(){ if (cropper) cropper.reset(); }

// Carregar foto e inicializar cropper
function carregarFoto(event){
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e){
    const container = document.getElementById('previewFoto');
    if (!container) return alert('Preview não encontrado.');

    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.id = 'cropperWrapper';
    wrapper.style.maxWidth = '100%';
    wrapper.style.maxHeight = '60vh';
    wrapper.style.overflow = 'hidden';
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'center';
    container.appendChild(wrapper);

    const img = document.createElement('img');
    img.id = 'imgCrop';
    img.src = e.target.result;
    img.style.maxWidth = '100%';
    img.style.maxHeight = '60vh';
    img.style.display = 'block';
    img.alt = 'Imagem do anexo';
    wrapper.appendChild(img);
    currentImgEl = img;

    const toolbar = document.createElement('div');
    toolbar.style.display = 'flex';
    toolbar.style.gap = '8px';
    toolbar.style.marginTop = '10px';
    toolbar.style.justifyContent = 'center';

    toolbar.innerHTML = `
      <button type="button" onclick="rotateLeft()" style="padding:6px 8px;">⤺</button>
      <button type="button" onclick="rotateRight()" style="padding:6px 8px;">⤼</button>
      <button type="button" onclick="zoomOut()" style="padding:6px 8px;">➖</button>
      <button type="button" onclick="zoomIn()" style="padding:6px 8px;">➕</button>
      <button type="button" onclick="resetCropper()" style="padding:6px 8px;">↺ Reset</button>
      <button type="button" onclick="salvarFotoPreview()" style="padding:6px 10px; background:#198754; color:white; border:none; border-radius:6px;">💾 Salvar Recorte</button>
    `;
    container.appendChild(toolbar);

    img.onload = function(){
      try {
        if (cropper) { cropper.destroy(); cropper = null; }
        if (typeof Cropper === 'undefined') {
          alert('Erro: Cropper.js não está carregado. Recarrega a página e tenta de novo.');
          return;
        }
        cropper = new Cropper(img, {
          viewMode: 0,
          autoCropArea: 0.8,
          movable: true,
          zoomable: true,
          scalable: true,
          rotatable: true,
          guides: true,
          background: true,
          modal: true,
          dragMode: 'crop',
          responsive: true,
          cropBoxMovable: true,
          cropBoxResizable: true
        });
        setTimeout(()=> { if (cropper && typeof cropper.crop === 'function') cropper.crop(); }, 50);
      } catch (err) {
        console.error('Erro ao iniciar Cropper:', err);
        alert('Erro ao iniciar o editor de recorte. Verifica consola.');
      }
    };
  };
  reader.readAsDataURL(file);
}

// Salvar foto recortada no preview
function salvarFotoPreview(){
  if (!cropper) { alert('Selecione ou capture uma foto e ajuste antes de salvar.'); return; }
  try {
    const canvas = cropper.getCroppedCanvas({
      maxWidth: 1600,
      maxHeight: 1600,
      imageSmoothingQuality: 'high'
    });
    if (!canvas) { alert('Erro ao gerar o recorte.'); return; }
    const dataUrl = canvas.toDataURL('image/png');
    const container = document.getElementById('previewFoto');
    container.innerHTML = `<img src="${dataUrl}" style="max-width:100%; border-radius:8px; display:block;">`;
    cropper.destroy();
    cropper = null;
    alert('Recorte salvo no preview!');
  } catch (err) {
    console.error('Erro ao salvar recorte:', err);
    alert('Erro ao salvar o recorte. Verifica consola.');
  }
}

// Salvar o anexo final no plano (corrigido)
function salvarAnexo(){
  const planoPreview = document.getElementById('anexoPreview');
  if (!planoPreview) return alert('Container de preview do plano não encontrado.');

  // Sempre recria os containers internos para garantir que anexoControls exista!
  planoPreview.innerHTML = `
    <h4 style="margin-top:0; color:#222; border-bottom:1px solid #000; padding-bottom:4px;">Anexo</h4>
    <div id="anexoContent"></div>
    <div id="anexoControls"></div>
  `;

  const txtPane = document.getElementById('anexoTexto');
  const chatPane = document.getElementById('anexoChatGPT');
  const fotoPane = document.getElementById('anexoFoto');

  let content = "";
  if (txtPane && txtPane.style.display === 'block') {
    const texto = (txtPane.querySelector('textarea')?.value || '').trim();
    if (!texto) return alert('Digite o texto do anexo antes de salvar.');
    window.anexoSalvo = { tipo: 'texto', data: texto };
    content = `<div class="anexoItem" style="padding:8px; background:#f1f1f1; border-radius:6px;">${escapeHtml(texto)}</div>`;
  }
  else if (chatPane && chatPane.style.display === 'block') {
    const resumo = (chatPane.querySelector('textarea')?.value || '').trim();
    if (!resumo) return alert('Cole o conteúdo gerado no ChatGPT antes de salvar.');
    window.anexoSalvo = { tipo: 'texto', data: resumo };
    content = `<div class="anexoItem" style="padding:8px; background:#f1f1f1; border-radius:6px;">${escapeHtml(resumo)}</div>`;
  }
  else if (fotoPane && fotoPane.style.display === 'block') {
    const previewImg = document.querySelector('#previewFoto img');
    if (!previewImg || !previewImg.src) return alert('Salve a foto no preview antes de salvar o anexo.');
    window.anexoSalvo = { tipo: 'imagem', data: previewImg.src };
    content = `<img src="${previewImg.src}" style="max-width:300px; border-radius:8px; display:block;">`;
  } else {
    return alert('Selecione um tipo de anexo antes de salvar.');
  }

  // Adiciona o conteúdo ao anexoContent
  planoPreview.querySelector("#anexoContent").innerHTML = content;
  planoPreview.style.display = 'block';

  // Adiciona o botão de remover
  let btnRem = document.getElementById('btnRemoverAnexoVisible');
  if (!btnRem) {
    btnRem = document.createElement('button');
    btnRem.id = 'btnRemoverAnexoVisible';
    btnRem.innerText = '❌ Remover Anexo';
    btnRem.style = 'margin-top:10px; padding:6px 12px; background:#dc3545; color:white; border:none; border-radius:6px; cursor:pointer;';
    btnRem.onclick = removerAnexoVisivel;
    planoPreview.querySelector('#anexoControls').appendChild(btnRem);
  } else {
    btnRem.style.display = 'inline-block';
  }

  const btnAdd = document.getElementById('btnAdicionarAnexo');
  if (btnAdd) btnAdd.style.display = 'none';

  fecharAnexo();

  // 🔹 Atualiza também o sessionStorage para que pagamento.html pegue o anexo
  try {
    const planoDataJSON = sessionStorage.getItem("planoData");
    const planoData = planoDataJSON ? JSON.parse(planoDataJSON) : {};
    planoData.anexoTipo = window.anexoSalvo.tipo;
    if (window.anexoSalvo.tipo === "imagem") {
      planoData.anexoImagem = window.anexoSalvo.data;
      planoData.anexoTexto = "";
    } else {
      planoData.anexoTexto = window.anexoSalvo.data;
      planoData.anexoImagem = null;
    }
    // Se o HTML do plano estiver disponível no DOM, atualiza também (útil)
    const pf = document.getElementById('planoFinal');
    if (pf && !planoData.html) {
      planoData.html = pf.innerHTML;
    }
    sessionStorage.setItem("planoData", JSON.stringify(planoData));
    // mantemos também a variável global (compatibilidade)
    try { window.anexoSalvo = window.anexoSalvo || null; } catch(e){}
  } catch (e) {
    console.warn('Erro ao atualizar sessionStorage com o anexo', e);
  }

  alert('Anexo salvo no plano!');
}

// Remover o anexo
function removerAnexoVisivel(){
  const planoPreview = document.getElementById('anexoPreview');
  if (planoPreview) planoPreview.style.display = 'none';
  window.anexoSalvo = null;
  const btnRem = document.getElementById('btnRemoverAnexoVisible');
  if (btnRem) btnRem.style.display = 'none';
  const btnAdd = document.getElementById('btnAdicionarAnexo');
  if (btnAdd) btnAdd.style.display = 'inline-block';
  const container = document.getElementById('anexoContainerContent');
  if (container) container.style.display = 'none';

  // Limpa também do sessionStorage.planoData
  try {
    const planoDataJSON = sessionStorage.getItem("planoData");
    if (planoDataJSON) {
      const planoData = JSON.parse(planoDataJSON);
      delete planoData.anexoTipo;
      delete planoData.anexoImagem;
      delete planoData.anexoTexto;
      delete planoData.anexoSalvo;
      sessionStorage.setItem("planoData", JSON.stringify(planoData));
    }
  } catch (e) {
    console.warn('Erro ao limpar anexo do sessionStorage', e);
  }
}

// Escape
function escapeHtml(str){
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}