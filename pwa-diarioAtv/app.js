// ===== Elementos DOM =====
const fileInput = document.getElementById("fileInput");
const btnTakePhoto = document.getElementById("btnTakePhoto");
const btnGetLoc = document.getElementById("btnGetLoc");
const btnSave = document.getElementById("btnSave");
const btnExport = document.getElementById("btnExport");
const preview = document.getElementById("preview");
const status = document.getElementById("status");
const latEl = document.getElementById("lat");
const lonEl = document.getElementById("lon");
const addressEl = document.getElementById("address");
const locationInfo = document.getElementById("locationInfo");
const recordsList = document.getElementById("records");
const noteInput = document.getElementById("noteInput");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const modalConfirm = document.getElementById("modalConfirm");
const closeModal = document.querySelector(".close-modal");

// ===== Estado =====
let currentImageData = null;
let currentCoords = null;
let currentAddress = "";

// ===== Modal Functions =====
function showModal(title, message, confirmCallback = null) {
  modalTitle.textContent = title;
  modalBody.textContent = message;
  modal.style.display = "flex";
  
  modalConfirm.onclick = function() {
    modal.style.display = "none";
    if (confirmCallback) confirmCallback();
  };
}

closeModal.onclick = function() {
  modal.style.display = "none";
};

window.onclick = function(event) {
  if (event.target === modal) {
    modal.style.display = "none";
  }
};

// ===== Storage =====
const STORAGE_KEY = "pwa-simple-records-v1";
function loadRecords() {
  const raw = localStorage.getItem(STORAGE_KEY) || "[]";
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveRecords(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

// ===== Render registros =====
function renderRecords() {
  const arr = loadRecords();
  recordsList.innerHTML = "";
  
  if (arr.length === 0) {
    recordsList.innerHTML = `
      <li class="record-item" style="justify-content: center; text-align: center; padding: 40px;">
        <div>
          <div style="font-size: 48px; margin-bottom: 16px;">📔</div>
          <div style="color: var(--text-soft);">Nenhum registro salvo ainda.</div>
          <div style="color: var(--text-soft); font-size: 0.9rem; margin-top: 8px;">
            Comece tirando uma foto e obtendo sua localização!
          </div>
        </div>
      </li>
    `;
    return;
  }
  
  arr
    .slice()
    .reverse()
    .forEach((r) => {
      const li = document.createElement("li");
      li.className = "record-item";
      li.innerHTML = `
        <img src="${r.image}" alt="foto do momento"/>
        <div class="record-meta">
          <div class="record-date">${new Date(r.createdAt).toLocaleString()}</div>
          ${r.note ? `<div class="record-note">${r.note}</div>` : ''}
          <div class="record-address">${r.address || "Endereço não disponível"}</div>
          <div class="record-coords">Lat: ${r.lat.toFixed(5)} — Lon: ${r.lon.toFixed(5)}</div>
        </div>
      `;
      recordsList.appendChild(li);
    });
}

// ===== Foto =====
btnTakePhoto.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", async (e) => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  
  const reader = new FileReader();
  reader.onload = () => {
    currentImageData = reader.result;
    preview.src = currentImageData;
    preview.style.display = "block";
    status.textContent = "Foto carregada com sucesso";
  };
  reader.readAsDataURL(f);
});

// ===== Inicialização do mapa =====
window._pwaMap = null;
window._pwaMarker = null;

function ensureMapInitialized() {
  if (window._pwaMap) return;
  
  try {
    window._pwaMap = L.map("map", { zoomControl: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(window._pwaMap);
  } catch (e) {
    console.warn("Erro ao inicializar Leaflet:", e);
  }
}

// ===== Geolocalização =====
btnGetLoc.addEventListener("click", () => {
  if (!("geolocation" in navigator)) {
    showModal(
      "Navegador não suportado", 
      "Geolocalização não é suportada neste navegador. Use um celular moderno."
    );
    return;
  }
  
  status.textContent = "Obtendo localização...";
  
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      currentCoords = { lat, lon };
      latEl.textContent = lat.toFixed(6);
      lonEl.textContent = lon.toFixed(6);
      locationInfo.style.display = "block";
      status.textContent = "Localização obtida - buscando endereço...";

      // Inicializa mapa e posiciona
      try {
        ensureMapInitialized();
        document.getElementById("map").style.display = "block";
        window._pwaMap.setView([lat, lon], 16);
        if (window._pwaMarker) window._pwaMap.removeLayer(window._pwaMarker);
      } catch (e) {
        console.warn("Erro ao preparar mapa:", e);
      }

      // Reverse geocoding Nominatim
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
          lat
        )}&lon=${encodeURIComponent(lon)}&zoom=18&addressdetails=1`;
        const res = await fetch(url, {
          headers: {
            "User-Agent": "PWA-Simple-App/1.0",
            Accept: "application/json",
          },
        });
        
        if (!res.ok) throw new Error("Falha na API");
        
        const data = await res.json();
        const address =
          data.display_name ||
          (data.address && Object.values(data.address).join(", ")) ||
          "";
        currentAddress = address;
        addressEl.textContent = address;
        status.textContent = "Endereço obtido com sucesso";

        // Cria marcador com popup
        try {
          window._pwaMarker = L.marker([lat, lon]).addTo(window._pwaMap);
          const popupContent = `<strong>Você está aqui</strong><br>${
            address || "Endereço não disponível"
          }`;
          window._pwaMarker.bindPopup(popupContent).openPopup();
        } catch (e) {
          console.warn("Erro ao adicionar marcador:", e);
        }
      } catch (err) {
        currentAddress = "";
        addressEl.textContent = "";
        status.textContent = "Não foi possível obter o endereço via API";
        
        try {
          window._pwaMarker = L.marker([lat, lon]).addTo(window._pwaMap);
          window._pwaMap.setView([lat, lon], 16);
          document.getElementById("map").style.display = "block";
        } catch (e) {
          console.warn(e);
        }
      }
    },
    (err) => {
      showModal(
        "Erro de Localização", 
        "Não foi possível obter sua localização: " + err.message
      );
      status.textContent = "Erro ao obter localização";
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

// ===== Salvar registro =====
btnSave.addEventListener("click", () => {
  if (!currentImageData) {
    showModal("Atenção", "Tire ou selecione uma foto antes de salvar.");
    return;
  }
  
  if (!currentCoords) {
    showModal("Atenção", "Obtenha a localização antes de salvar.");
    return;
  }

  const note = noteInput.value.trim();
  const arr = loadRecords();
  const rec = {
    id: Date.now(),
    image: currentImageData,
    lat: currentCoords.lat,
    lon: currentCoords.lon,
    address: currentAddress,
    note: note,
    createdAt: new Date().toISOString(),
  };
  
  arr.push(rec);
  saveRecords(arr);
  renderRecords();
  status.textContent = "Registro salvo com sucesso!";

  // Limpa estado atual
  currentImageData = null;
  currentCoords = null;
  currentAddress = "";
  noteInput.value = "";
  preview.style.display = "none";
  locationInfo.style.display = "none";
  preview.src = "";
  document.getElementById("map").style.display = "none";
});

// ===== Exportar JSON =====
btnExport.addEventListener("click", () => {
  const data = JSON.stringify(loadRecords(), null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "diario-momentos.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  status.textContent = "Arquivo JSON exportado com sucesso";
});

// ===== Init =====
document.addEventListener('DOMContentLoaded', function() {
  renderRecords();
  
  // ===== Service Worker =====
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => console.log("SW registrado"))
      .catch((e) => console.log("Falha ao registrar SW", e));
  }

  // ===== PWA Install Prompt =====
  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    const installBtn = document.createElement("button");
    installBtn.textContent = "📥 Instalar App";
    installBtn.className = "outline";
    installBtn.style.marginLeft = "12px";
    installBtn.onclick = async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      deferredPrompt = null;
      installBtn.remove();
    };
    
    document.querySelector("header").appendChild(installBtn);
  });
});