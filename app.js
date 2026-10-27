/**
 * Bolsas Lucrativas — Application Master Controller
 * Progressive Web App (PWA) & Member Area
 */

(function () {
  'use strict';

  // --- Data Access ---
  const DATA = window.APP_DATA || {};
  const MOLDES = DATA.MOLDES || [];
  let VIDEOS = DATA.VIDEOS || [];
  const DESTAQUE = DATA.DESTAQUE || [];
  const SUPPLIERS = DATA.SUPPLIERS || [];
  const FOTOS_DICAS = DATA.FOTOS_DICAS || [];
  const CALC_PRESETS = DATA.CALC_PRESETS || [];
  const MOLDES_LOCAL = DATA.MOLDES_LOCAL || [];
  const GUIA = window.GUIA || [];

  // --- Local Storage Keys ---
  const STORAGE_KEYS = {
    FAVORITES: 'bl_favs_v1',
    WATCHED: 'bl_watched_v1',
    GUIA_CHECKS: 'bl_guia_checks_v1',
    STUDENT_NAME: 'bl_student_name_v1',
    VIEW_MODE: 'bl_view_mode_v1'
  };

  // --- State ---
  let state = {
    currentTab: 'inicio',
    favorites: loadJSON(STORAGE_KEYS.FAVORITES, []),
    watchedVideos: loadJSON(STORAGE_KEYS.WATCHED, []),
    guiaChecks: loadJSON(STORAGE_KEYS.GUIA_CHECKS, {}),
    studentName: localStorage.getItem(STORAGE_KEYS.STUDENT_NAME) || 'Artesã do Jeans',
    viewMode: localStorage.getItem(STORAGE_KEYS.VIEW_MODE) || 'grid',
    selectedCat: 'all',
    searchQuery: '',
    currentVideoIdx: 0,
    currentGuiaIdx: 0,
    deferredInstallPrompt: null,
    materials: [
      { name: 'Jeans reciclado / sarja 10oz (1m)', cost: 15.00 },
      { name: 'Tecido de forro tricoline (0.7m)', cost: 14.00 },
      { name: 'Estruturador Manta R2 (0.7m)', cost: 12.00 },
      { name: 'Alça chique de poliéster (1.4m)', cost: 9.00 },
      { name: 'Zíper médio reforçado + 2 cursores', cost: 6.50 },
      { name: 'Linha de poliamida + agulha jeans', cost: 3.50 }
    ],
    laborHours: 2.5,
    hourRate: 20.0,
    marginPct: 80
  };

  function loadJSON(key, fallback) {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }

  // --- DOM Elements ---
  const DOM = {
    views: document.querySelectorAll('.app-view'),
    navLinks: document.querySelectorAll('.nav-link, .bnav-item'),
    moldesGrid: document.getElementById('moldesGridContainer'),
    moldesSearch: document.getElementById('moldesSearchInput'),
    globalSearch: document.getElementById('globalSearchInput'),
    catFilters: document.getElementById('catFilterScroll'),
    favsBadge: document.getElementById('favsCountBadge'),
    btnFavorites: document.getElementById('btnFavoritesShortcut'),
    btnGridMode: document.getElementById('btnGridMode'),
    btnListMode: document.getElementById('btnListMode'),
    btnInstallPwa: document.getElementById('btnInstallPwa'),
    
    // Video Player
    mainVideoPlayer: document.getElementById('mainVideoPlayer'),
    currentVideoTitle: document.getElementById('currentVideoTitle'),
    currentVideoIndex: document.getElementById('currentVideoIndex'),
    playlistContainer: document.getElementById('playlistContainer'),
    playlistSearch: document.getElementById('playlistSearchInput'),
    btnToggleWatched: document.getElementById('btnToggleWatched'),
    btnWatchedText: document.getElementById('btnWatchedText'),
    btnNextLesson: document.getElementById('btnNextLesson'),
    plCompletedCount: document.getElementById('plCompletedCount'),

    // Guia de Vendas
    guiaList: document.getElementById('guiaModulesList'),
    guiaReader: document.getElementById('moduleReaderContainer'),
    guiaProgressBar: document.getElementById('guiaProgressBar'),
    guiaProgressText: document.getElementById('guiaProgressText'),
    btnOpenCertModal: document.getElementById('btnOpenCertModal'),

    // Calculadora
    presetsRow: document.getElementById('calcPresetsRow'),
    materialsTable: document.getElementById('materialsTableBody'),
    btnAddMaterial: document.getElementById('btnAddMaterialRow'),
    inputLaborHours: document.getElementById('inputLaborHours'),
    inputHourRate: document.getElementById('inputHourRate'),
    marginPresets: document.getElementById('marginPresetsContainer'),
    calcFinalPrice: document.getElementById('calcFinalPrice'),
    calcResMaterials: document.getElementById('calcResMaterials'),
    calcResLabor: document.getElementById('calcResLabor'),
    calcResProfit: document.getElementById('calcResProfit'),
    calcPricePix: document.getElementById('calcPricePix'),
    calcPriceCard: document.getElementById('calcPriceCard'),
    calcCostTotal: document.getElementById('calcCostTotal'),
    btnCopyQuote: document.getElementById('btnCopyQuote'),

    // Bônus
    suppliersGrid: document.getElementById('suppliersGrid'),
    fotosGrid: document.getElementById('fotosGrid'),

    // Modais
    moldeModal: document.getElementById('moldePreviewModal'),
    modalMoldeTitle: document.getElementById('modalMoldeTitle'),
    modalMoldeBody: document.getElementById('modalMoldeBody'),
    modalMoldeDl: document.getElementById('btnModalDownload'),
    modalMoldePrint: document.getElementById('btnModalPrint'),
    btnCloseMoldeModal: document.getElementById('btnCloseMoldeModal'),

    certModal: document.getElementById('certModal'),
    certStudentName: document.getElementById('certStudentName'),
    certDateDisplay: document.getElementById('certDateDisplay'),
    btnPrintCert: document.getElementById('btnPrintCert'),
    btnCloseCertModal: document.getElementById('btnCloseCertModal'),

    iosModal: document.getElementById('iosInstallModal'),
    btnCloseIosModal: document.getElementById('btnCloseIosModal'),
    btnConfirmIosModal: document.getElementById('btnConfirmIosModal'),

    btnOpenDestaqueModal: document.getElementById('btnOpenDestaqueModal'),
    toast: document.getElementById('appToast'),
    toastMsg: document.getElementById('toastMessage'),
    toastIcon: document.getElementById('toastIcon'),

    homeProgressBar: document.getElementById('homeProgressBar'),
    homeProgressPercent: document.getElementById('homeProgressPercent')
  };

  // =========================================================================
  // Initialization
  // =========================================================================
  function init() {
    registerServiceWorker();
    setupPwaInstall();
    setupRouting();
    setupFavorites();
    renderMoldes();
    setupVideoLessons();
    setupGuia();
    setupCalculadora();
    renderBonusSection();
    setupModals();
    updateGlobalCounters();
    updateHomeProgress();
  }

  // =========================================================================
  // Service Worker & PWA Install
  // =========================================================================
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js', { scope: './' })
          .then((reg) => console.log('SW Registered:', reg.scope))
          .catch((err) => console.warn('SW Fail:', err));
      });
    }
  }

  function isPwaInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.matchMedia('(display-mode: fullscreen)').matches ||
           window.navigator.standalone === true ||
           document.referrer.includes('android-app://') ||
           localStorage.getItem('pwa_installed') === 'true';
  }

  function hideInstallButton() {
    if (DOM.btnInstallPwa) {
      DOM.btnInstallPwa.style.setProperty('display', 'none', 'important');
    }
  }

  function setupPwaInstall() {
    // If running as an installed PWA on mobile or desktop, immediately hide the button
    if (isPwaInstalled()) {
      hideInstallButton();
      return;
    }

    // Fired by Chrome/Android when the app has been successfully installed
    window.addEventListener('appinstalled', () => {
      localStorage.setItem('pwa_installed', 'true');
      hideInstallButton();
      showToast('Parabéns! Aplicativo instalado.', '🎉');
    });

    window.addEventListener('beforeinstallprompt', (e) => {
      if (isPwaInstalled()) {
        hideInstallButton();
        return;
      }
      e.preventDefault();
      state.deferredInstallPrompt = e;
      if (DOM.btnInstallPwa) {
        DOM.btnInstallPwa.style.display = 'inline-flex';
      }
    });

    if (DOM.btnInstallPwa) {
      DOM.btnInstallPwa.addEventListener('click', () => {
        const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
        if (state.deferredInstallPrompt) {
          state.deferredInstallPrompt.prompt();
          state.deferredInstallPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
              localStorage.setItem('pwa_installed', 'true');
              hideInstallButton();
              showToast('Parabéns! Aplicativo instalado.', '🎉');
            }
            state.deferredInstallPrompt = null;
          });
        } else if (isIos) {
          if (DOM.iosModal) DOM.iosModal.classList.add('active');
        } else {
          showToast('App já instalado ou abra no Chrome/Edge para instalar!', '📲');
        }
      });
    }

    if (DOM.btnCloseIosModal) DOM.btnCloseIosModal.addEventListener('click', () => DOM.iosModal.classList.remove('active'));
    if (DOM.btnConfirmIosModal) {
      DOM.btnConfirmIosModal.addEventListener('click', () => {
        DOM.iosModal.classList.remove('active');
        localStorage.setItem('pwa_installed', 'true');
        hideInstallButton();
      });
    }
  }

  // =========================================================================
  // Router & Tab Switching
  // =========================================================================
  function setupRouting() {
    function navigateTo(tabId) {
      const validTabs = ['inicio', 'moldes', 'aulas', 'guia', 'calculadora', 'bonus'];
      if (!validTabs.includes(tabId)) tabId = 'inicio';

      state.currentTab = tabId;

      // Update views
      DOM.views.forEach((view) => {
        view.classList.toggle('active', view.id === `view-${tabId}`);
      });

      // Update nav links
      DOM.navLinks.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('data-tab') === tabId);
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Link Clicks
    document.querySelectorAll('[data-tab]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = el.getAttribute('data-tab');
        window.location.hash = tab;
        navigateTo(tab);
      });
    });

    // Quick Cards on Home
    document.querySelectorAll('[data-goto]').forEach((el) => {
      el.addEventListener('click', () => {
        const tab = el.getAttribute('data-goto');
        window.location.hash = tab;
        navigateTo(tab);
      });
    });

    // Hash change handler
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      navigateTo(hash);
    });

    // Initial route check
    const initialHash = window.location.hash.replace('#', '') || 'inicio';
    navigateTo(initialHash);

    // Global Search redirect
    if (DOM.globalSearch) {
      DOM.globalSearch.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (query.length >= 2) {
          if (state.currentTab !== 'moldes') {
            window.location.hash = 'moldes';
            navigateTo('moldes');
          }
          if (DOM.moldesSearch) {
            DOM.moldesSearch.value = query;
            state.searchQuery = query;
            renderMoldes();
          }
        }
      });
    }
  }

  // =========================================================================
  // Moldes Gallery
  // =========================================================================
  function renderMoldes() {
    if (!DOM.moldesGrid) return;

    let items = [];

    // Filter by category
    if (state.selectedCat === 'all') {
      items = [...MOLDES];
    } else if (state.selectedCat === 'favoritos') {
      items = MOLDES.filter((m) => state.favorites.includes(m.id));
    } else if (state.selectedCat === 'local') {
      // Show files from moldes_bolsas folder!
      items = MOLDES_LOCAL.map((loc, idx) => ({
        id: 1000 + idx,
        title: loc.title,
        thumb: 'assets/thumbs/destaque-200-moldes.jpg', // fallback or matching thumb
        file: loc.path,
        kind: loc.kind,
        pages: loc.size,
        cat: 'Pasta moldes_bolsas',
        isLocalFile: true
      }));
    } else if (state.selectedCat === 'bolsas') {
      items = MOLDES.filter((m) => /bolsa|tote|sacola|hobo|bucket/i.test(m.title));
    } else if (state.selectedCat === 'mochilas') {
      items = MOLDES.filter((m) => /mochila/i.test(m.title));
    } else if (state.selectedCat === 'necessaires') {
      items = MOLDES.filter((m) => /necessaire|carteira|estojo|clutch/i.test(m.title));
    } else if (state.selectedCat === 'bonus') {
      items = MOLDES.filter((m) => m.cat === 'Bônus' || /guia|boas-vindas|como imprimir/i.test(m.title));
    }

    // Filter by search query
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      items = items.filter((m) => m.title.toLowerCase().includes(q));
    }

    // Apply view mode (grid or list)
    DOM.moldesGrid.className = `moldes-grid ${state.viewMode === 'list' ? 'list-view' : ''}`;

    if (items.length === 0) {
      DOM.moldesGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <h3>Nenhum molde encontrado</h3>
          <p>Tente buscar por outro termo ou selecione a categoria "Todos".</p>
        </div>
      `;
      return;
    }

    DOM.moldesGrid.innerHTML = items.map((m) => {
      const isFav = state.favorites.includes(m.id);
      const thumb = m.thumb || 'assets/thumbs/destaque-200-moldes.jpg';
      const kindBadge = m.kind === 'pdf' ? `PDF (${m.pages || 1}p)` : 'Molde c/ Medidas';

      return `
        <div class="molde-card" data-molde-id="${m.id}">
          <div class="mc-thumb" onclick="window.BolsasApp.openMoldePreview(${m.id})">
            <img src="${thumb}" alt="${m.title}" loading="lazy" onerror="this.src='assets/thumbs/destaque-200-moldes.jpg'" />
            <div class="mc-badges-top">
              <span class="mc-kind-badge">${kindBadge}</span>
              <button type="button" class="mc-fav-btn ${isFav ? 'favorited' : ''}" onclick="event.stopPropagation(); window.BolsasApp.toggleFavorite(${m.id})" title="${isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
                <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </button>
            </div>
          </div>
          <div class="mc-body">
            <h4 class="mc-title" title="${m.title}">${m.title}</h4>
            <div class="mc-meta-row">
              <span>${m.cat || 'Bolsas & Necessaires'}</span>
              <span>${m.kind === 'pdf' ? 'Pronto p/ Imprimir' : 'Medidas Exatas'}</span>
            </div>
            <div class="mc-actions">
              <button type="button" class="btn-mc-view" onclick="window.BolsasApp.openMoldePreview(${m.id})">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <span>Ver</span>
              </button>
              <a href="${m.file}" download="${m.title}.pdf" class="btn-mc-dl" target="_blank" rel="noopener">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span>Baixar</span>
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function setupFavorites() {
    if (DOM.btnFavorites) {
      DOM.btnFavorites.addEventListener('click', () => {
        state.selectedCat = 'favoritos';
        window.location.hash = 'moldes';
        document.querySelectorAll('.cat-chip').forEach((c) => {
          c.classList.toggle('active', c.getAttribute('data-cat') === 'favoritos');
        });
        renderMoldes();
      });
    }

    // Category Tabs click
    if (DOM.catFilters) {
      DOM.catFilters.addEventListener('click', (e) => {
        const chip = e.target.closest('.cat-chip');
        if (!chip) return;
        DOM.catFilters.querySelectorAll('.cat-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        state.selectedCat = chip.getAttribute('data-cat');
        renderMoldes();
      });
    }

    // Moldes Search
    if (DOM.moldesSearch) {
      DOM.moldesSearch.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.trim();
        renderMoldes();
      });
    }

    // View Mode toggles
    if (DOM.btnGridMode) {
      DOM.btnGridMode.addEventListener('click', () => {
        state.viewMode = 'grid';
        localStorage.setItem(STORAGE_KEYS.VIEW_MODE, 'grid');
        DOM.btnGridMode.classList.add('active');
        DOM.btnListMode.classList.remove('active');
        renderMoldes();
      });
    }

    if (DOM.btnListMode) {
      DOM.btnListMode.addEventListener('click', () => {
        state.viewMode = 'list';
        localStorage.setItem(STORAGE_KEYS.VIEW_MODE, 'list');
        DOM.btnListMode.classList.add('active');
        DOM.btnGridMode.classList.remove('active');
        renderMoldes();
      });
    }
  }

  function toggleFavorite(id) {
    const idx = state.favorites.indexOf(id);
    if (idx > -1) {
      state.favorites.splice(idx, 1);
      showToast('Molde removido dos favoritos', '🤍');
    } else {
      state.favorites.push(id);
      showToast('Molde adicionado aos favoritos!', '❤️');
    }
    saveJSON(STORAGE_KEYS.FAVORITES, state.favorites);
    updateGlobalCounters();
    renderMoldes();
  }

  // =========================================================================
  // Video Lessons Player & Playlist
  // =========================================================================
  async function loadVideosFromJson() {
    try {
      const response = await fetch('./video_aulas.json');
      if (response.ok) {
        const json = await response.json();
        const list = Array.isArray(json) ? json : (json.aulas || json.videos || json.VIDEOS || []);
        if (list && list.length > 0) {
          VIDEOS = list.map((item, idx) => ({
            yt: item.yt || item.id,
            id: item.id || item.yt,
            t: item.t || item.titulo,
            titulo: item.titulo || item.t,
            titulo_original: item.titulo_original || '',
            url_youtube: item.url_youtube || `https://www.youtube.com/watch?v=${item.yt || item.id}`,
            url_embed: item.url_embed || `https://www.youtube-nocookie.com/embed/${item.yt || item.id}?rel=0&modestbranding=1&controls=1&showinfo=0&iv_load_policy=3&fs=1&enablejsapi=1&autoplay=1`,
            thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${item.yt || item.id}/hqdefault.jpg`,
            numero: item.numero || (idx + 1)
          }));
          const currentFilter = DOM.playlistSearch ? DOM.playlistSearch.value.trim().toLowerCase() : '';
          renderPlaylist(currentFilter);
          loadVideo(state.currentVideoIdx);
          updateGlobalCounters();
          updateHomeProgress();
          console.log(`[BolsasApp] 50 Videoaulas carregadas e vinculadas de video_aulas.json com sucesso.`);
        }
      }
    } catch (err) {
      console.log('[BolsasApp] Carregando vídeoaulas do cache local (offline/fallback ativo):', err);
    }
  }

  function setupVideoLessons() {
    renderPlaylist();
    loadVideo(state.currentVideoIdx);
    loadVideosFromJson();

    if (DOM.playlistSearch) {
      DOM.playlistSearch.addEventListener('input', (e) => {
        renderPlaylist(e.target.value.trim().toLowerCase());
      });
    }

    if (DOM.btnToggleWatched) {
      DOM.btnToggleWatched.addEventListener('click', () => {
        const v = VIDEOS[state.currentVideoIdx];
        if (!v) return;
        const vId = v.yt || v.id;
        const watchedIdx = state.watchedVideos.indexOf(vId);

        if (watchedIdx > -1) {
          state.watchedVideos.splice(watchedIdx, 1);
          showToast('Aula desmarcada', '↩️');
        } else {
          state.watchedVideos.push(vId);
          showToast('Parabéns! Aula concluída.', '🎉');
        }

        saveJSON(STORAGE_KEYS.WATCHED, state.watchedVideos);
        updateVideoWatchedUI();
        renderPlaylist();
        updateHomeProgress();
      });
    }

    if (DOM.btnNextLesson) {
      DOM.btnNextLesson.addEventListener('click', () => {
        if (state.currentVideoIdx < VIDEOS.length - 1) {
          loadVideo(state.currentVideoIdx + 1, true);
        } else {
          showToast('Você chegou ao fim das aulas!', '🏆');
        }
      });
    }
  }

  function toggleCinemaFullscreen() {
    const box = document.querySelector('.cinema-player-box') || DOM.mainVideoPlayer;
    if (!box) return;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (box.requestFullscreen) {
        box.requestFullscreen().catch(() => {});
      } else if (box.webkitRequestFullscreen) {
        box.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  }

  function loadVideo(idx, shouldScroll = false) {
    if (idx < 0 || idx >= VIDEOS.length) return;
    state.currentVideoIdx = idx;
    const v = VIDEOS[idx];
    const vidId = v.yt || v.id;
    const vidTitle = v.t || v.titulo;

    if (DOM.mainVideoPlayer) {
      DOM.mainVideoPlayer.src = `https://www.youtube-nocookie.com/embed/${vidId}?rel=0&modestbranding=1&controls=1&showinfo=0&iv_load_policy=3&fs=1&enablejsapi=1&autoplay=1`;
    }
    if (DOM.currentVideoTitle) {
      DOM.currentVideoTitle.textContent = vidTitle;
    }
    if (DOM.currentVideoIndex) {
      DOM.currentVideoIndex.textContent = `Aula ${idx + 1} de ${VIDEOS.length}`;
    }

    updateVideoWatchedUI();
    renderPlaylist(DOM.playlistSearch ? DOM.playlistSearch.value.trim().toLowerCase() : '');

    if (shouldScroll) {
      scrollToVideoPlayer();
    }
  }

  function scrollToVideoPlayer() {
    const target = document.querySelector('.cinema-player-box') || DOM.mainVideoPlayer;
    if (!target) return;
    const topbar = document.querySelector('.topbar');
    const topbarHeight = topbar ? topbar.offsetHeight : 70;
    const rect = target.getBoundingClientRect();
    const targetY = window.pageYOffset + rect.top - topbarHeight - 16;
    window.scrollTo({
      top: Math.max(0, targetY),
      behavior: 'smooth'
    });
  }

  function updateVideoWatchedUI() {
    const v = VIDEOS[state.currentVideoIdx];
    if (!v || !DOM.btnToggleWatched) return;

    const vidId = v.yt || v.id;
    const isWatched = state.watchedVideos.includes(vidId);
    DOM.btnToggleWatched.classList.toggle('watched', isWatched);
    if (DOM.btnWatchedText) {
      DOM.btnWatchedText.textContent = isWatched ? '✓ Aula Concluída' : 'Marcar como Concluída';
    }
    if (DOM.plCompletedCount) {
      DOM.plCompletedCount.textContent = `${state.watchedVideos.length} / ${VIDEOS.length} concluídas`;
    }
  }

  function renderPlaylist(filterQuery = '') {
    if (!DOM.playlistContainer) return;

    DOM.playlistContainer.innerHTML = VIDEOS.map((v, i) => {
      const vidTitle = v.t || v.titulo || '';
      const vidId = v.yt || v.id;
      if (filterQuery && !vidTitle.toLowerCase().includes(filterQuery)) {
        return '';
      }
      const isActive = i === state.currentVideoIdx;
      const isDone = state.watchedVideos.includes(vidId);
      const thumbUrl = v.thumbnail || `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`;

      return `
        <div class="playlist-item ${isActive ? 'active' : ''} ${isDone ? 'completed' : ''}" onclick="window.BolsasApp.loadVideo(${i}, true)">
          <div class="pli-thumb">
            <img src="${thumbUrl}" alt="${vidTitle}" loading="lazy" />
          </div>
          <div class="pli-info">
            <div class="pli-title">${i + 1}. ${vidTitle}</div>
          </div>
          <div class="pli-status">${isDone ? '✓' : ''}</div>
        </div>
      `;
    }).join('');
  }

  // =========================================================================
  // Guia de Vendas (20 Módulos)
  // =========================================================================
  function setupGuia() {
    renderGuiaModulesList();
    loadGuiaModule(state.currentGuiaIdx);

    if (DOM.btnOpenCertModal) {
      DOM.btnOpenCertModal.addEventListener('click', () => {
        if (DOM.certModal) {
          if (DOM.certDateDisplay) {
            const now = new Date();
            DOM.certDateDisplay.textContent = `Data de Emissão: ${now.toLocaleDateString('pt-BR')}`;
          }
          if (DOM.certStudentName) {
            DOM.certStudentName.textContent = state.studentName;
          }
          DOM.certModal.classList.add('active');
        }
      });
    }

    if (DOM.btnPrintCert) {
      DOM.btnPrintCert.addEventListener('click', () => {
        window.print();
      });
    }

    if (DOM.btnCloseCertModal) {
      DOM.btnCloseCertModal.addEventListener('click', () => {
        DOM.certModal.classList.remove('active');
      });
    }
  }

  function renderGuiaModulesList() {
    if (!DOM.guiaList) return;

    const completedModules = Object.keys(state.guiaChecks).filter((k) => {
      const checks = state.guiaChecks[k] || [];
      const module = GUIA[parseInt(k, 10)];
      const total = (module?.mission?.items || []).length;
      return total > 0 && checks.filter(Boolean).length >= total;
    }).length;

    if (DOM.guiaProgressText) {
      DOM.guiaProgressText.textContent = `${completedModules} de ${GUIA.length} concluídos`;
    }
    if (DOM.guiaProgressBar) {
      const pct = Math.round((completedModules / (GUIA.length || 1)) * 100);
      DOM.guiaProgressBar.style.width = `${pct}%`;
    }

    DOM.guiaList.innerHTML = GUIA.map((m, i) => {
      const isActive = i === state.currentGuiaIdx;
      const checks = state.guiaChecks[i] || [];
      const total = (m.mission?.items || []).length;
      const isDone = total > 0 && checks.filter(Boolean).length >= total;

      return `
        <div class="module-item ${isActive ? 'active' : ''} ${isDone ? 'completed' : ''}" onclick="window.BolsasApp.loadGuiaModule(${i})">
          <div class="module-emoji">${m.emoji || '📖'}</div>
          <div class="module-text">
            <div class="module-num">Módulo ${m.n || (i + 1)}</div>
            <div class="module-name">${m.title}</div>
          </div>
          <div class="module-check">${isDone ? '✓' : ''}</div>
        </div>
      `;
    }).join('');
  }

  function loadGuiaModule(idx) {
    if (idx < 0 || idx >= GUIA.length) return;
    state.currentGuiaIdx = idx;
    const m = GUIA[idx];
    renderGuiaModulesList();

    if (!DOM.guiaReader) return;

    const topicsHtml = (m.topics || []).map((t, ti) => `
      <div class="mr-topic-block">
        <h4 class="mr-topic-title">${t.h}</h4>
        <div class="mr-topic-body">${t.html}</div>
      </div>
    `).join('');

    const checks = state.guiaChecks[idx] || [];
    const missionItemsHtml = (m.mission?.items || []).map((it, ci) => {
      const isChecked = !!checks[ci];
      return `
        <div class="mrm-item ${isChecked ? 'checked' : ''}" onclick="window.BolsasApp.toggleMissionItem(${idx}, ${ci})">
          <div class="mrm-checkbox">${isChecked ? '✓' : ''}</div>
          <div class="mrm-text">${it}</div>
        </div>
      `;
    }).join('');

    DOM.guiaReader.innerHTML = `
      <span class="mr-badge">Módulo ${m.n || (idx + 1)} de 20 · ${m.emoji || '🎯'}</span>
      <h3 class="mr-title">${m.title}</h3>
      <p class="mr-subtitle">${m.subtitle || ''}</p>

      <div class="mr-topics-container">
        ${topicsHtml}
      </div>

      ${m.mission ? `
        <div class="mr-mission-box">
          <div class="mrm-head">
            <span style="font-size: 24px;">🚀</span>
            <h4>Missão Prática do Módulo</h4>
          </div>
          ${m.mission.intro ? `<p style="color:var(--text-muted); font-size:0.95rem; margin-bottom:14px;">${m.mission.intro}</p>` : ''}
          <div class="mrm-list">
            ${missionItemsHtml}
          </div>
          ${m.mission.closing ? `<div style="margin-top:16px; font-size:0.95rem; color:#ffe08a;">${m.mission.closing}</div>` : ''}
        </div>
      ` : ''}
    `;
  }

  function toggleMissionItem(moduleIdx, itemIdx) {
    if (!state.guiaChecks[moduleIdx]) {
      state.guiaChecks[moduleIdx] = [];
    }
    state.guiaChecks[moduleIdx][itemIdx] = !state.guiaChecks[moduleIdx][itemIdx];
    saveJSON(STORAGE_KEYS.GUIA_CHECKS, state.guiaChecks);

    loadGuiaModule(moduleIdx);
    renderGuiaModulesList();
    updateHomeProgress();
  }

  // =========================================================================
  // Calculadora de Precificação
  // =========================================================================
  function setupCalculadora() {
    renderCalcPresets();
    renderMaterialsTable();
    calculatePrice();

    if (DOM.btnAddMaterial) {
      DOM.btnAddMaterial.addEventListener('click', () => {
        state.materials.push({ name: 'Novo Aviamento / Tecido', cost: 5.00 });
        renderMaterialsTable();
        calculatePrice();
      });
    }

    if (DOM.inputLaborHours) {
      DOM.inputLaborHours.addEventListener('input', (e) => {
        state.laborHours = parseFloat(e.target.value) || 0;
        calculatePrice();
      });
    }

    if (DOM.inputHourRate) {
      DOM.inputHourRate.addEventListener('input', (e) => {
        state.hourRate = parseFloat(e.target.value) || 0;
        calculatePrice();
      });
    }

    if (DOM.marginPresets) {
      DOM.marginPresets.querySelectorAll('.mp-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          DOM.marginPresets.querySelectorAll('.mp-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          state.marginPct = parseFloat(btn.getAttribute('data-margin')) || 80;
          calculatePrice();
        });
      });
    }

    if (DOM.btnCopyQuote) {
      DOM.btnCopyQuote.addEventListener('click', () => {
        const finalPrice = DOM.calcFinalPrice.textContent;
        const pixPrice = DOM.calcPricePix.textContent;
        const cardPrice = DOM.calcPriceCard.textContent;

        const quoteText = `Olá! Segue o orçamento especial da sua bolsa feita à mão:\n\n` +
          `✨ *Valor da Peça:* R$ ${finalPrice}\n` +
          `🟢 *No Pix com 5% de desconto:* ${pixPrice}\n` +
          `💳 *No Cartão de Crédito:* ${cardPrice}\n\n` +
          `Produzida sob medida com acabamento reforçado e tecido premium. Podemos confirmar seu pedido? 🧵`;

        navigator.clipboard.writeText(quoteText).then(() => {
          showToast('Orçamento copiado! Pronto para colar no WhatsApp.', '📋');
        }).catch(() => {
          showToast('Erro ao copiar. Selecione o texto manualmente.', '⚠️');
        });
      });
    }
  }

  function renderCalcPresets() {
    if (!DOM.presetsRow) return;
    DOM.presetsRow.innerHTML = CALC_PRESETS.map((p, i) => `
      <button type="button" class="preset-chip" onclick="window.BolsasApp.loadCalcPreset(${i})">
        ${p.name}
      </button>
    `).join('');
  }

  function loadCalcPreset(idx) {
    const preset = CALC_PRESETS[idx];
    if (!preset) return;

    state.materials = JSON.parse(JSON.stringify(preset.materials));
    state.laborHours = preset.hours;
    state.hourRate = preset.hourRate;
    state.marginPct = preset.margin;

    if (DOM.inputLaborHours) DOM.inputLaborHours.value = state.laborHours;
    if (DOM.inputHourRate) DOM.inputHourRate.value = state.hourRate.toFixed(2);

    if (DOM.marginPresets) {
      DOM.marginPresets.querySelectorAll('.mp-btn').forEach((btn) => {
        const m = parseFloat(btn.getAttribute('data-margin'));
        btn.classList.toggle('active', m === state.marginPct);
      });
    }

    renderMaterialsTable();
    calculatePrice();
    showToast(`Modelo carregado: ${preset.name}`, '📐');
  }

  function renderMaterialsTable() {
    if (!DOM.materialsTable) return;

    DOM.materialsTable.innerHTML = state.materials.map((m, i) => `
      <div class="mat-row">
        <input type="text" class="mat-name-inp" value="${m.name}" onchange="window.BolsasApp.updateMaterialName(${i}, this.value)" />
        <div class="mat-cost-inp-wrap">
          <span>R$</span>
          <input type="number" step="0.5" min="0" class="mat-cost-inp" value="${m.cost.toFixed(2)}" oninput="window.BolsasApp.updateMaterialCost(${i}, this.value)" />
        </div>
        <button type="button" class="btn-del-mat" onclick="window.BolsasApp.removeMaterial(${i})" title="Remover material">✕</button>
      </div>
    `).join('');
  }

  function updateMaterialName(idx, val) {
    if (state.materials[idx]) {
      state.materials[idx].name = val;
    }
  }

  function updateMaterialCost(idx, val) {
    if (state.materials[idx]) {
      state.materials[idx].cost = parseFloat(val) || 0;
      calculatePrice();
    }
  }

  function removeMaterial(idx) {
    state.materials.splice(idx, 1);
    renderMaterialsTable();
    calculatePrice();
  }

  function calculatePrice() {
    const materialsCost = state.materials.reduce((sum, m) => sum + (m.cost || 0), 0);
    const laborCost = (state.laborHours || 0) * (state.hourRate || 0);
    const baseCost = materialsCost + laborCost;
    const profit = baseCost * ((state.marginPct || 80) / 100);
    const finalPrice = baseCost + profit;
    const pixPrice = finalPrice * 0.95;
    const cardInstallment = finalPrice / 3;

    if (DOM.calcFinalPrice) DOM.calcFinalPrice.textContent = finalPrice.toFixed(2).replace('.', ',');
    if (DOM.calcResMaterials) DOM.calcResMaterials.textContent = `R$ ${materialsCost.toFixed(2).replace('.', ',')}`;
    if (DOM.calcResLabor) DOM.calcResLabor.textContent = `R$ ${laborCost.toFixed(2).replace('.', ',')}`;
    if (DOM.calcResProfit) DOM.calcResProfit.textContent = `+ R$ ${profit.toFixed(2).replace('.', ',')}`;
    if (DOM.calcCostTotal) DOM.calcCostTotal.textContent = `R$ ${baseCost.toFixed(2).replace('.', ',')}`;
    if (DOM.calcPricePix) DOM.calcPricePix.textContent = `R$ ${pixPrice.toFixed(2).replace('.', ',')}`;
    if (DOM.calcPriceCard) DOM.calcPriceCard.textContent = `3x de R$ ${cardInstallment.toFixed(2).replace('.', ',')}`;
  }

  // =========================================================================
  // Bônus & Fornecedores & Fotos que Vendem
  // =========================================================================
  function renderBonusSection() {
    if (DOM.suppliersGrid) {
      DOM.suppliersGrid.innerHTML = SUPPLIERS.map((s) => `
        <div class="supplier-card">
          <div>
            <span class="sc-badge">${s.badge}</span>
            <h4 class="sc-name">${s.name}</h4>
            <div class="sc-cat">${s.cat}</div>
            <p class="sc-desc">${s.desc}</p>
          </div>
          <a href="${s.url}" target="_blank" rel="noopener" class="btn-open-supplier">
            <span>Acessar Loja Oficial</span>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        </div>
      `).join('');
    }

    if (DOM.fotosGrid) {
      DOM.fotosGrid.innerHTML = FOTOS_DICAS.map((f) => `
        <div class="foto-tip-card">
          <span class="ftc-num">${f.num}</span>
          <div class="ftc-emoji">${f.emoji}</div>
          <h4 class="ftc-title">${f.h}</h4>
          <p class="ftc-text">${f.p}</p>
          <div class="ftc-dodont">
            <div class="ftc-do">✓ <b>Faça:</b> ${f.do}</div>
            <div class="ftc-dont">✕ <b>Evite:</b> ${f.dont}</div>
          </div>
        </div>
      `).join('');
    }
  }

  // =========================================================================
  // Preview Modal
  // =========================================================================
  function setupModals() {
    if (DOM.btnCloseMoldeModal) {
      DOM.btnCloseMoldeModal.addEventListener('click', () => {
        if (DOM.moldeModal) DOM.moldeModal.classList.remove('active');
        if (DOM.modalMoldeBody) DOM.modalMoldeBody.innerHTML = '';
        if (pdfState.renderTask) {
          try { pdfState.renderTask.cancel(); } catch (_) {}
          pdfState.renderTask = null;
        }
        pdfState.doc = null;
      });
    }

    if (DOM.btnModalPrint) {
      DOM.btnModalPrint.addEventListener('click', () => {
        if (state.currentModalFile) {
          const w = window.open(state.currentModalFile, '_blank');
          if (w) w.focus();
        } else {
          window.print();
        }
      });
    }

    if (DOM.btnOpenDestaqueModal) {
      DOM.btnOpenDestaqueModal.addEventListener('click', () => {
        openMoldePreview(0, true);
      });
    }
  }

  let pdfState = {
    doc: null,
    pageNum: 1,
    scale: 1.0,
    totalPages: 1,
    renderTask: null
  };

  async function renderPdfViewer(url, title) {
    if (!DOM.modalMoldeBody) return;

    if (window.pdfjsLib) {
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = './assets/vendor/pdfjs/pdf.worker.min.js';
      } catch (_) {}

      DOM.modalMoldeBody.innerHTML = `
        <div class="pdfjs-viewer-wrap">
          <div class="pdfjs-toolbar">
            <div class="pdfjs-toolbar-group">
              <button type="button" class="pdfjs-btn" id="pdfBtnPrev" title="Página Anterior">◀ Ant</button>
              <span class="pdfjs-page-info">Pág <b id="pdfCurPage">1</b> de <span id="pdfTotalPages">1</span></span>
              <button type="button" class="pdfjs-btn" id="pdfBtnNext" title="Próxima Página">Próx ▶</button>
            </div>
            <div class="pdfjs-toolbar-group">
              <button type="button" class="pdfjs-btn" id="pdfBtnZoomOut" title="Diminuir Zoom">－</button>
              <span class="pdfjs-page-info" id="pdfZoomLevel">100%</span>
              <button type="button" class="pdfjs-btn" id="pdfBtnZoomIn" title="Aumentar Zoom">＋</button>
              <a href="${url}" target="_blank" rel="noopener" class="pdfjs-btn" title="Abrir em Nova Aba">↗</a>
            </div>
          </div>
          <div class="pdfjs-canvas-viewport" id="pdfCanvasViewport">
            <div class="pdfjs-loading-spinner" id="pdfLoadingSpinner">
              <div class="pdfjs-spinner-icon"></div>
              <span>Carregando molde em alta resolução...</span>
            </div>
            <canvas id="pdfViewerCanvas" style="display:none;"></canvas>
          </div>
        </div>
      `;

      try {
        pdfState.scale = 1.0;
        pdfState.pageNum = 1;
        const loadingTask = pdfjsLib.getDocument(url);
        pdfState.doc = await loadingTask.promise;
        pdfState.totalPages = pdfState.doc.numPages;

        const totalEl = document.getElementById('pdfTotalPages');
        if (totalEl) totalEl.textContent = pdfState.totalPages;

        const spinner = document.getElementById('pdfLoadingSpinner');
        const canvas = document.getElementById('pdfViewerCanvas');
        if (spinner) spinner.style.display = 'none';
        if (canvas) canvas.style.display = 'block';

        bindPdfToolbarEvents();
        await renderCurrentPdfPage();
      } catch (err) {
        console.warn('PDF.js loading failed, using fallback:', err);
        fallbackToIframeViewer(url, title);
      }
    } else {
      fallbackToIframeViewer(url, title);
    }
  }

  function fallbackToIframeViewer(url, title) {
    if (!DOM.modalMoldeBody) return;
    DOM.modalMoldeBody.innerHTML = `
      <div class="pdf-viewer-wrap">
        <iframe src="${url}#toolbar=1&navpanes=0" title="${title}"></iframe>
        <div class="pdf-mobile-bar">
          <span>Se o PDF não carregar na tela:</span>
          <a href="${url}" target="_blank" rel="noopener" class="btn-open-pdf-direct">Abrir Molde em Nova Aba ↗</a>
        </div>
      </div>
    `;
  }

  function bindPdfToolbarEvents() {
    const btnPrev = document.getElementById('pdfBtnPrev');
    const btnNext = document.getElementById('pdfBtnNext');
    const btnZoomIn = document.getElementById('pdfBtnZoomIn');
    const btnZoomOut = document.getElementById('pdfBtnZoomOut');

    if (btnPrev) {
      btnPrev.onclick = () => {
        if (pdfState.pageNum > 1) {
          pdfState.pageNum--;
          renderCurrentPdfPage();
        }
      };
    }

    if (btnNext) {
      btnNext.onclick = () => {
        if (pdfState.pageNum < pdfState.totalPages) {
          pdfState.pageNum++;
          renderCurrentPdfPage();
        }
      };
    }

    if (btnZoomIn) {
      btnZoomIn.onclick = () => {
        if (pdfState.scale < 3.0) {
          pdfState.scale += 0.25;
          renderCurrentPdfPage();
        }
      };
    }

    if (btnZoomOut) {
      btnZoomOut.onclick = () => {
        if (pdfState.scale > 0.5) {
          pdfState.scale -= 0.25;
          renderCurrentPdfPage();
        }
      };
    }
  }

  async function renderCurrentPdfPage() {
    if (!pdfState.doc) return;
    const canvas = document.getElementById('pdfViewerCanvas');
    const viewportBox = document.getElementById('pdfCanvasViewport');
    if (!canvas || !viewportBox) return;

    if (pdfState.renderTask) {
      try {
        pdfState.renderTask.cancel();
      } catch (_) {}
      pdfState.renderTask = null;
    }

    const page = await pdfState.doc.getPage(pdfState.pageNum);
    const containerWidth = Math.max(280, viewportBox.clientWidth - 32);
    const unscaledViewport = page.getViewport({ scale: 1 });
    const fitScale = (containerWidth / unscaledViewport.width);
    const finalScale = fitScale * pdfState.scale;
    const viewport = page.getViewport({ scale: finalScale });

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(viewport.width * pixelRatio);
    canvas.height = Math.floor(viewport.height * pixelRatio);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    const ctx = canvas.getContext('2d');
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const curPageEl = document.getElementById('pdfCurPage');
    if (curPageEl) curPageEl.textContent = pdfState.pageNum;

    const zoomEl = document.getElementById('pdfZoomLevel');
    if (zoomEl) zoomEl.textContent = `${Math.round(pdfState.scale * 100)}%`;

    const btnPrev = document.getElementById('pdfBtnPrev');
    const btnNext = document.getElementById('pdfBtnNext');
    if (btnPrev) btnPrev.disabled = (pdfState.pageNum <= 1);
    if (btnNext) btnNext.disabled = (pdfState.pageNum >= pdfState.totalPages);

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };

    try {
      pdfState.renderTask = page.render(renderContext);
      await pdfState.renderTask.promise;
      pdfState.renderTask = null;
    } catch (e) {
      if (e.name !== 'RenderingCancelledException') {
        console.warn('Render page error:', e);
      }
    }
  }

  function openMoldePreview(id, isDestaque = false) {
    let item;
    if (isDestaque) {
      item = DESTAQUE[0];
    } else {
      item = MOLDES.find((m) => m.id === id);
      if (!item && id >= 1000) {
        const localIdx = id - 1000;
        const loc = MOLDES_LOCAL[localIdx];
        if (loc) {
          item = {
            title: loc.title,
            file: loc.path,
            kind: loc.kind
          };
        }
      }
    }

    if (!item || !DOM.moldeModal) return;

    state.currentModalFile = item.file;

    if (DOM.modalMoldeTitle) DOM.modalMoldeTitle.textContent = item.title;
    if (DOM.modalMoldeDl) {
      DOM.modalMoldeDl.href = item.file;
      DOM.modalMoldeDl.setAttribute('download', `${item.title}.${item.kind === 'pdf' ? 'pdf' : 'png'}`);
    }

    if (DOM.modalMoldeBody) {
      if (item.kind === 'pdf') {
        renderPdfViewer(item.file, item.title);
      } else {
        DOM.modalMoldeBody.innerHTML = `<img src="${item.file}" alt="${item.title}" />`;
      }
    }

    DOM.moldeModal.classList.add('active');
  }

  // =========================================================================
  // Global Helpers & Progress
  // =========================================================================
  function updateGlobalCounters() {
    if (DOM.favsBadge) {
      DOM.favsBadge.textContent = state.favorites.length;
    }
    const countFavs = document.getElementById('count-favs');
    if (countFavs) {
      countFavs.textContent = state.favorites.length;
    }
    const sideAulas = document.getElementById('side-aulas-count');
    if (sideAulas) {
      sideAulas.textContent = VIDEOS.length;
    }
  }

  function updateHomeProgress() {
    const totalAulas = VIDEOS.length || 1;
    const watchedAulas = state.watchedVideos.length;

    const totalGuia = GUIA.length || 1;
    const doneGuia = Object.keys(state.guiaChecks).filter((k) => {
      const checks = state.guiaChecks[k] || [];
      const total = (GUIA[parseInt(k, 10)]?.mission?.items || []).length;
      return total > 0 && checks.filter(Boolean).length >= total;
    }).length;

    const overallPct = Math.min(100, Math.round(((watchedAulas / totalAulas) * 0.5 + (doneGuia / totalGuia) * 0.5) * 100));

    if (DOM.homeProgressPercent) DOM.homeProgressPercent.textContent = `${overallPct}% Concluído`;
    if (DOM.homeProgressBar) DOM.homeProgressBar.style.width = `${overallPct}%`;
  }

  function showToast(msg, icon = '✨') {
    if (!DOM.toast) return;
    if (DOM.toastMsg) DOM.toastMsg.textContent = msg;
    if (DOM.toastIcon) DOM.toastIcon.textContent = icon;

    DOM.toast.classList.add('active');
    clearTimeout(window._toastTimeout);
    window._toastTimeout = setTimeout(() => {
      DOM.toast.classList.remove('active');
    }, 3200);
  }

  // --- Expose Public API ---
  window.BolsasApp = {
    openMoldePreview,
    toggleFavorite,
    loadVideo,
    loadVideosFromJson,
    getVideos: () => VIDEOS,
    loadGuiaModule,
    toggleMissionItem,
    loadCalcPreset,
    updateMaterialName,
    updateMaterialCost,
    removeMaterial,
    showToast
  };

  // Launch on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
