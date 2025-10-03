# 📸 Diário PWA: Fotos, Localização e Notas

Este projeto é um **Progressive Web App (PWA)** que funciona como um **diário digital pessoal**.  
Ele permite registrar momentos com **foto**, **localização geográfica** e um **texto/nota**, funcionando também **offline** e podendo ser instalado no celular ou computador.

---

## 🚀 Funcionalidades

- 📷 **Foto**: Tire ou selecione uma imagem (câmera ou galeria).
- 📍 **Localização**: Capture latitude/longitude com GPS.
- 🗺️ **Endereço**: Usa a API pública [Nominatim](https://nominatim.org/) (OpenStreetMap) para buscar o endereço aproximado.
- 📝 **Diário/Notas**: Adicione comentários ou observações junto a cada registro.
- 💾 **Armazenamento local**: Todos os registros ficam salvos no navegador (`localStorage`), disponíveis mesmo offline.
- 📤 **Exportação**: Baixe todos os registros em formato **JSON**.
- 📱 **PWA Instalável**: Pode ser instalado na tela inicial do dispositivo como um app nativo.
- 🛰️ **Funciona offline**: Graças ao **Service Worker** que mantém cache dos arquivos principais.

---

## 🛠️ Estrutura do Projeto

pwa-fotos-local/
├── index.html # Interface principal (UI + layout)
├── app.js # Lógica do app (foto, mapa, diário, PWA)
├── sw.js # Service Worker (cache offline)
├── manifest.json # Metadados do PWA (nome, ícone, cores)
└── README.md # Documentação do projeto

yaml


---

## 📱 Uso de Recursos do Dispositivo

- **Câmera**  
   O input que abre a câmera/galeria usa:
  ```html
  <input
    id="fileInput"
    type="file"
    accept="image/*"
    capture="environment"
    style="display:none"
  />
  Observação: em desktop ele abrirá o seletor de arquivos; em dispositivos
  móveis o navegador tende a priorizar a câmera traseira.
  ```

Geolocalização (GPS)
O app obtém latitude/longitude com a API do navegador:

navigator.geolocation.getCurrentPosition(
(pos) => { /_ pos.coords.latitude, pos.coords.longitude _/ },
(err) => { /_ tratamento de erro _/ },
{ enableHighAccuracy: true }
);
🌍 Consumo de API Pública (Reverse Geocoding)
Para transformar lat/lon em endereço, o app usa Nominatim (OpenStreetMap). Exemplo de chamada:

const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
const res = await fetch(url, { headers: { 'User-Agent': 'PWA-Diario/1.0' } });
const data = await res.json();
const address = data.display_name;
Atenção: respeite a política de uso do Nominatim (limites e identificação via User-Agent). Para produção, considere um serviço de geocoding com SLA ou cache local.

▶️ Como Executar Localmente
Clone ou baixe o projeto:

git clone https://github.com/SEU_USUARIO/SEU_REPO.git
cd SEU_REPO
Inicie um servidor local (ex.: serve ou Python):

Com Node.js (serve):

npx serve -s . -l 8000
Ou com Python 3:

python -m http.server 8000
Abra no navegador:

Computador: http://localhost:8000

Celular (mesma rede): http://<IP-do-PC>:8000

Testes/observações:

Para o Service Worker atualizar durante desenvolvimento, abra DevTools → Application → Service Workers → Unregister e Application → Clear storage → Clear site data.

Em celulares, alguns recursos (ex.: instalação PWA) exigem HTTPS; http://localhost é considerado seguro em dev.

📷 Sugestão de Screenshots para Entrega
Para documentar a entrega, capture imagens dos seguintes estados:

Tela Principal: interface com botões, área de nota e lista de registros vazia.

Permissão de Localização: popup do navegador pedindo acesso ao GPS.

Registro Salvo: foto + data/hora + endereço + nota exibidos no card do registro.

Exportação JSON: processo de download do arquivo.

Instalação PWA: diálogo ou o botão “Instalar” (onde aplicável).

✅ Requisitos da Atividade Atendidos
PWA: manifest.json + sw.js (caching) + tratamento de beforeinstallprompt.
Hardware: captura de imagem (input file/câmera) e GPS (navigator.geolocation).
API Pública: integração com Nominatim/OpenStreetMap para reverse-geocoding.
Offline: armazenamento em localStorage e app shell em cache via Service Worker.
Exportação: recursos para exportar todos os registros em JSON.

💡 Melhorias Futuras (sugestões)
🌙 Modo escuro / tema automático.
✏️ Editar / excluir registros individuais.
🔁 Sincronização/opções de backup (Google Drive / WebDAV / Dropbox).
🔗 Compartilhamento do registro (imagem + localização + nota) via share API
🗂️ Tags / pesquisas / filtros por local / data.
🧭 Mapa global com todos os registros e agrupamento (marker clustering).
📐 Compressão/resize de imagens antes de salvar para reduzir espaço.

Licença & Observações
Projeto para fins educacionais/práticos.