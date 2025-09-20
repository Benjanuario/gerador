// anexo.js — Versão atualizada e robusta para Cropper
let cropper = null;
let currentImgEl = null;

// Mostrar / esconder painéis (mantive teu UI)
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

// Abrir ChatGPT - já tens esta versão com nova conversa, mantive
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

// === Funções utilitárias para controle do Cropper (zoom/rotate/reset) ===
function rotateLeft(){ if (cropper) cropper.rotate(-90); }
function rotateRight(){ if (cropper) cropper.rotate(90); }
function zoomIn(){ if (cropper) cropper.zoom(0.1); }
function zoomOut(){ if (cropper) cropper.zoom(-0.1); }
function resetCropper(){ if (cropper) cropper.reset(); }

// Carregar foto e inicializar cropper (agora espera o img.onload)
function carregarFoto(event){
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e){
    const container = document.getElementById('previewFoto');
    if (!container) return alert('Preview não encontrado.');

    // limpa preview anterior
    container.innerHTML = '';

    // wrapper para dar uma altura controlada
    const wrapper = document.createElement('div');
    wrapper.id = 'cropperWrapper';
    wrapper.style.maxWidth = '100%';
    wrapper.style.maxHeight = '60vh';
    wrapper.style.overflow = 'hidden';
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'center';
    container.appendChild(wrapper);

    // imagem
    const img = document.createElement('img');
    img.id = 'imgCrop';
    img.src = e.target.result;
    img.style.maxWidth = '100%';
    img.style.maxHeight = '60vh';
    img.style.display = 'block';
    img.alt = 'Imagem do anexo';
    wrapper.appendChild(img);
    currentImgEl = img;

    // barra de ferramentas (zoom/rotate/reset + salvar)
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

    // inicializa o cropper apenas quando a imagem tiver carregado
    img.onload = function(){
      try {
        // destrói cropper anterior, se existir
        if (cropper) { cropper.destroy(); cropper = null; }

        if (typeof Cropper === 'undefined') {
          alert('Erro: Cropper.js não está carregado. Recarrega a página e tenta de novo.');
          return;
        }

        // inicializa com opções para comportamento "editor"
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

        // forçar redraw se necessário
        setTimeout(()=> { if (cropper && typeof cropper.crop === 'function') cropper.crop(); }, 50);
      } catch (err) {
        console.error('Erro ao iniciar Cropper:', err);
        alert('Erro ao iniciar o editor de recorte. Verifica consola.');
      }
    };
  };
  reader.readAsDataURL(file);
}

// Salvar foto recortada no preview (usa getCroppedCanvas com limites)
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
    // substitui conteúdo por imagem final
    container.innerHTML = `<img src="${dataUrl}" style="max-width:100%; border-radius:8px; display:block;">`;
    // destrói instância do cropper
    cropper.destroy();
    cropper = null;
    alert('Recorte salvo no preview!');
  } catch (err) {
    console.error('Erro ao salvar recorte:', err);
    alert('Erro ao salvar o recorte. Verifica consola.');
  }
}

//Salvar o anexo final no plano (mantive tua lógica principal)
function salvarAnexo(){
  const planoPreview = document.getElementById('anexoPreview');
  if (!planoPreview) return alert('Container de preview do plano não encontrado.');

  planoPreview.innerHTML = '<h4 style="margin-top:0; color:#222; border-bottom:1px solid #000; padding-bottom:4px;">Anexo</h4>';

  const txtPane = document.getElementById('anexoTexto');
  const chatPane = document.getElementById('anexoChatGPT');
  const fotoPane = document.getElementById('anexoFoto');

  if (txtPane && txtPane.style.display === 'block') {
    const texto = (txtPane.querySelector('textarea')?.value || '').trim();
    if (!texto) return alert('Digite o texto do anexo antes de salvar.');
    window.anexoSalvo = { tipo: 'texto', data: texto };
    planoPreview.innerHTML += `<div class="anexoItem" style="padding:8px; background:#f1f1f1; border-radius:6px;">${escapeHtml(texto)}</div>`;
  }
  else if (chatPane && chatPane.style.display === 'block') {
    const resumo = (chatPane.querySelector('textarea')?.value || '').trim();
    if (!resumo) return alert('Cole o conteúdo gerado no ChatGPT antes de salvar.');
    window.anexoSalvo = { tipo: 'texto', data: resumo };
    planoPreview.innerHTML += `<div class="anexoItem" style="padding:8px; background:#f1f1f1; border-radius:6px;">${escapeHtml(resumo)}</div>`;
  }
  else if (fotoPane && fotoPane.style.display === 'block') {
    const previewImg = document.querySelector('#previewFoto img');
    if (!previewImg || !previewImg.src) return alert('Salve a foto no preview antes de salvar o anexo.');
    window.anexoSalvo = { tipo: 'imagem', data: previewImg.src };
    planoPreview.innerHTML += `<img src="${previewImg.src}" style="max-width:300px; border-radius:8px; display:block;">`;
  } else {
    return alert('Selecione um tipo de anexo antes de salvar.');
  }

  planoPreview.style.display = 'block';

  let btnRem = document.getElementById('btnRemoverAnexoVisible');
  if (!btnRem) {
    btnRem = document.createElement('button');
    btnRem.id = 'btnRemoverAnexoVisible';
    btnRem.innerText = '❌ Remover Anexo';
    btnRem.style = 'margin-top:10px; padding:6px 12px; background:#dc3545; color:white; border:none; border-radius:6px; cursor:pointer;';
    btnRem.onclick = removerAnexoVisivel;
    document.getElementById('anexoControls').appendChild(btnRem);
  } else {
    btnRem.style.display = 'inline-block';
  }

  const btnAdd = document.getElementById('btnAdicionarAnexo');
  if (btnAdd) btnAdd.style.display = 'none';

  fecharAnexo();
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