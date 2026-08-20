/**
 * ArmoryVault Landing Website - Interactive Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initOsDetection();
  initReleaseData();
  initShowcaseTabs();
  initRangeSimulator();
  initFeedbackHub();
  initFaqAccordion();
  initClipboardButtons();
  initBackToTop();
  initDonationDeck();
});

/* ==========================================================================
   1. Navbar & Scroll Spy
   ========================================================================== */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const navToggle = document.querySelector('.nav-toggle');
  const mobileMenu = document.querySelector('.mobile-nav-menu');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  // Sticky navbar on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Mobile menu toggle
  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', mobileMenu.classList.contains('open'));
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
      });
    });
  }
}

let currentDetectedOsCard = 'mac-arm';

function initOsDetection() {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || '';
  
  let detectedOs = 'windows'; // fallback
  currentDetectedOsCard = 'windows';

  if (userAgent.includes('mac') || platform.includes('mac')) {
    detectedOs = 'macos';
    currentDetectedOsCard = 'mac-arm'; // default modern Mac
    // Test for Apple Silicon / M-series
    if (navigator.userAgentData) {
      navigator.userAgentData.getHighEntropyValues(['architecture']).then(ua => {
        if (ua.architecture === 'arm') {
          currentDetectedOsCard = 'mac-arm';
          highlightDownloadCard('mac-arm');
        } else {
          currentDetectedOsCard = 'mac-intel';
          highlightDownloadCard('mac-intel');
        }
        updateSmartHeroCta();
      }).catch(() => {
        highlightDownloadCard('mac-arm');
        updateSmartHeroCta();
      });
    } else {
      highlightDownloadCard('mac-arm');
      updateSmartHeroCta();
    }
  } else if (userAgent.includes('win') || platform.includes('win')) {
    detectedOs = 'windows';
    currentDetectedOsCard = 'windows';
    highlightDownloadCard('windows');
    updateSmartHeroCta();
  } else if (userAgent.includes('linux') || platform.includes('linux')) {
    detectedOs = 'linux';
    currentDetectedOsCard = 'linux';
    highlightDownloadCard('linux');
    updateSmartHeroCta();
  } else if (userAgent.includes('android') || userAgent.includes('iphone') || userAgent.includes('ipad')) {
    detectedOs = 'mobile';
    currentDetectedOsCard = 'mobile';
    highlightDownloadCard('mobile');
    updateSmartHeroCta();
  }

  // Pre-fill OS in Feedback form if input exists
  const osSelect = document.getElementById('feedback-os');
  if (osSelect) {
    if (detectedOs === 'macos') osSelect.value = 'macOS';
    else if (detectedOs === 'windows') osSelect.value = 'Windows';
    else if (detectedOs === 'linux') osSelect.value = 'Linux';
    else if (detectedOs === 'mobile') osSelect.value = 'Mobile (Android/iOS)';
  }
}

function highlightDownloadCard(cardId) {
  currentDetectedOsCard = cardId;
  document.querySelectorAll('.download-card').forEach(card => {
    card.classList.remove('recommended');
    const existingBadge = card.querySelector('.download-badge-rec');
    if (existingBadge) existingBadge.remove();
  });

  const targetCard = document.getElementById(`download-${cardId}`);
  if (targetCard) {
    targetCard.classList.add('recommended');
    const badge = document.createElement('div');
    badge.className = 'download-badge-rec';
    badge.textContent = 'Detected For Your System';
    targetCard.prepend(badge);
  }
  updateSmartHeroCta();
}

/* ==========================================================================
   3. Live GitHub Release Asset Resolution & Channel Switching
   ========================================================================== */
let globalReleases = {
  stable: null,
  nightly: null,
  mobileStable: null,
  mobileNightly: null,
  activeChannel: 'stable'
};

// Caching fetch with 15-minute TTL to prevent GitHub rate-limiting (60 req/hr)
async function fetchWithCache(url, ttlMs = 900000) {
  const cacheKey = `av_gh_cache_${url}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < ttlMs && parsed.data) {
        return parsed.data;
      }
    }
  } catch (e) {
    // localStorage might be restricted
  }

  try {
    const res = await fetch(url).catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data }));
      } catch (e) {}
      return data;
    }
  } catch (e) {
    console.warn('Fetch failed for', url, e);
  }
  return null;
}

async function initReleaseData() {
  const repoOwner = 'cook0001';
  const repoName = 'ArmoryVault';
  const companionRepo = 'ArmoryVault-Companion-App';
  
  const desktopApiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/releases`;
  const mobileApiUrl = `https://api.github.com/repos/${repoOwner}/${companionRepo}/releases`;

  const fallbackStableTag = 'v2.7.1';
  const fallbackNightlyTag = 'v2.8.0-nightly.1';
  const fallbackMobileStable = 'v2.5.0';
  const fallbackMobileNightly = 'v2.6.0-nightly.1';

  try {
    // 1. Fetch Desktop Releases with caching
    const releases = await fetchWithCache(desktopApiUrl);
    if (releases && Array.isArray(releases) && releases.length > 0) {
      const stable = releases.find(r => !r.prerelease && !r.draft) || releases[0];
      const nightly = releases.find(r => r.prerelease || r.tag_name?.includes('nightly') || r.tag_name?.includes('beta'));
      globalReleases.stable = stable || { tag_name: fallbackStableTag, assets: [] };
      globalReleases.nightly = nightly || { tag_name: fallbackNightlyTag, assets: [] };
    } else {
      globalReleases.stable = { tag_name: fallbackStableTag, assets: [] };
      globalReleases.nightly = { tag_name: fallbackNightlyTag, assets: [] };
    }

    // 2. Fetch Mobile Companion Releases with caching
    const mobReleases = await fetchWithCache(mobileApiUrl);
    if (mobReleases && Array.isArray(mobReleases) && mobReleases.length > 0) {
      const mobStable = mobReleases.find(r => !r.prerelease && !r.draft) || mobReleases[0];
      const mobNightly = mobReleases.find(r => r.prerelease || r.tag_name?.includes('nightly') || r.tag_name?.includes('beta'));
      globalReleases.mobileStable = mobStable || { tag_name: fallbackMobileStable, assets: [] };
      globalReleases.mobileNightly = mobNightly || { tag_name: fallbackMobileNightly, assets: [] };
    } else {
      globalReleases.mobileStable = { tag_name: fallbackMobileStable, assets: [] };
      globalReleases.mobileNightly = { tag_name: fallbackMobileNightly, assets: [] };
    }

    // Update tag text in headers
    document.querySelectorAll('.release-version-tag').forEach(el => {
      el.textContent = globalReleases.stable.tag_name || fallbackStableTag;
    });

    document.querySelectorAll('.nightly-version-tag').forEach(el => {
      el.textContent = globalReleases.nightly.tag_name || fallbackNightlyTag;
    });

    // Update feedback version dropdown options
    const feedbackVersionSelect = document.getElementById('feedback-version');
    if (feedbackVersionSelect) {
      const stableTag = globalReleases.stable.tag_name || fallbackStableTag;
      const nightlyTag = globalReleases.nightly.tag_name || fallbackNightlyTag;
      feedbackVersionSelect.innerHTML = `
        <option value="${nightlyTag} (Nightly Preview)">⚡ ${nightlyTag} (Nightly Preview)</option>
        <option value="${stableTag} (Stable Release)" selected>🎯 ${stableTag} (Stable Release)</option>
        <option value="v2.7.0 (Stable Release)">v2.7.0 (Stable Release)</option>
        <option value="v2.6.x (Legacy)">v2.6.x (Legacy)</option>
        <option value="Mobile Companion (v${globalReleases.mobileNightly?.tag_name || fallbackMobileNightly})">📱 Mobile Companion (Nightly)</option>
        <option value="Mobile Companion (v${globalReleases.mobileStable?.tag_name || fallbackMobileStable})">📱 Mobile Companion (Stable)</option>
        <option value="Dev / Source Build">🛠️ Dev / Source Build</option>
      `;
    }

    applyChannelAssets('stable');

  } catch (err) {
    console.log('Using default release fallback urls:', err.message);
    globalReleases.stable = { tag_name: fallbackStableTag, assets: [] };
    globalReleases.nightly = { tag_name: fallbackNightlyTag, assets: [] };
    globalReleases.mobileStable = { tag_name: fallbackMobileStable, assets: [] };
    globalReleases.mobileNightly = { tag_name: fallbackMobileNightly, assets: [] };
    applyChannelAssets('stable');
  }

  // Setup Channel Switcher Buttons
  const stableBtn = document.getElementById('tab-channel-stable');
  const nightlyBtn = document.getElementById('tab-channel-nightly');
  const nightlyBanner = document.getElementById('channel-banner-nightly');

  if (stableBtn && nightlyBtn) {
    stableBtn.addEventListener('click', () => {
      stableBtn.classList.add('active');
      nightlyBtn.classList.remove('active');
      if (nightlyBanner) nightlyBanner.style.display = 'none';
      globalReleases.activeChannel = 'stable';
      applyChannelAssets('stable');

      const feedbackVersion = document.getElementById('feedback-version');
      if (feedbackVersion) {
        feedbackVersion.value = `${globalReleases.stable.tag_name || fallbackStableTag} (Stable Release)`;
        feedbackVersion.dispatchEvent(new Event('change'));
      }
    });

    nightlyBtn.addEventListener('click', () => {
      nightlyBtn.classList.add('active');
      stableBtn.classList.remove('active');
      if (nightlyBanner) nightlyBanner.style.display = 'block';
      globalReleases.activeChannel = 'nightly';
      applyChannelAssets('nightly');

      const feedbackVersion = document.getElementById('feedback-version');
      if (feedbackVersion) {
        feedbackVersion.value = `${globalReleases.nightly.tag_name || fallbackNightlyTag} (Nightly Preview)`;
        feedbackVersion.dispatchEvent(new Event('change'));
      }
    });
  }
}

function applyChannelAssets(channel) {
  const rel = channel === 'nightly' ? globalReleases.nightly : globalReleases.stable;
  const mobRel = channel === 'nightly' ? globalReleases.mobileNightly : globalReleases.mobileStable;

  const tagName = rel?.tag_name || (channel === 'nightly' ? 'v2.8.0-nightly.1' : 'v2.7.1');
  const mobTagName = mobRel?.tag_name || (channel === 'nightly' ? 'v2.6.0-nightly.1' : 'v2.5.0');

  const assets = rel?.assets || [];
  const mobAssets = mobRel?.assets || [];

  const repoBase = 'https://github.com/cook0001/ArmoryVault/releases';
  const mobRepoBase = 'https://github.com/cook0001/ArmoryVault-Companion-App/releases';

  // Match desktop assets
  const macArmAsset = assets.find(a => a.name.endsWith('.dmg') && (a.name.includes('arm64') || a.name.includes('aarch64')));
  const macIntelAsset = assets.find(a => a.name.endsWith('.dmg') && (a.name.includes('x64') || a.name.includes('x86_64') || (!a.name.includes('arm64') && !a.name.includes('aarch64'))));
  const winAsset = assets.find(a => a.name.endsWith('.exe'));
  const linuxAsset = assets.find(a => a.name.endsWith('.AppImage'));

  // Match mobile companion APK asset
  const apkAsset = mobAssets.find(a => a.name?.endsWith('.apk')) || assets.find(a => a.name?.endsWith('.apk'));

  const isNightly = channel === 'nightly';
  const tagShort = isNightly ? (tagName.replace('v', '').split('-')[0] + '-nightly') : tagName;
  const mobTagShort = isNightly ? (mobTagName.replace('v', '').split('-')[0] + '-nightly') : mobTagName;

  updateDownloadBtn(
    'btn-download-mac-arm', 
    macArmAsset ? macArmAsset.browser_download_url : `${repoBase}/tag/${tagName}`, 
    isNightly ? `${tagShort} (ARM64)` : `${tagName} (Apple Silicon)`
  );
  
  updateDownloadBtn(
    'btn-download-mac-intel', 
    macIntelAsset ? macIntelAsset.browser_download_url : `${repoBase}/tag/${tagName}`, 
    isNightly ? `${tagShort} (Intel x64)` : `${tagName} (Intel x64)`
  );

  updateDownloadBtn(
    'btn-download-win', 
    winAsset ? winAsset.browser_download_url : `${repoBase}/tag/${tagName}`, 
    isNightly ? `${tagShort} (Windows .exe)` : `${tagName} (Windows .exe)`
  );

  updateDownloadBtn(
    'btn-download-linux', 
    linuxAsset ? linuxAsset.browser_download_url : `${repoBase}/tag/${tagName}`, 
    isNightly ? `${tagShort} (Linux .AppImage)` : `${tagName} (Linux .AppImage)`
  );

  const mobileApkUrl = apkAsset ? apkAsset.browser_download_url : `${mobRepoBase}/tag/${mobTagName}`;

  updateDownloadBtn(
    'btn-download-mobile', 
    mobileApkUrl, 
    isNightly ? `${mobTagShort} (.apk)` : `${mobTagName} (.apk)`
  );

  // Update dynamic APK QR code image
  const qrImg = document.getElementById('mobile-apk-qr-img');
  if (qrImg) {
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(mobileApkUrl)}&bgcolor=ffffff&color=090d16&margin=0`;
  }

  updateSmartHeroCta();
}

function updateDownloadBtn(btnId, url, labelSuffix) {
  const btn = document.getElementById(btnId);
  if (btn) {
    btn.href = url;
    const subtext = btn.querySelector('.btn-subtext');
    if (subtext) subtext.textContent = labelSuffix;
  }
}

function updateSmartHeroCta() {
  const btn = document.getElementById('hero-smart-download-btn');
  const textEl = document.getElementById('hero-smart-btn-text');
  const badgeEl = document.getElementById('hero-detected-badge');
  if (!btn || !textEl) return;

  const channel = globalReleases.activeChannel || 'stable';
  const rel = channel === 'nightly' ? globalReleases.nightly : globalReleases.stable;
  const mobRel = channel === 'nightly' ? globalReleases.mobileNightly : globalReleases.mobileStable;
  const tagName = rel?.tag_name || (channel === 'nightly' ? 'v2.8.0-nightly.1' : 'v2.7.1');
  const mobTagName = mobRel?.tag_name || (channel === 'nightly' ? 'v2.6.0-nightly.1' : 'v2.5.0');
  const assets = rel?.assets || [];
  const mobAssets = mobRel?.assets || [];

  const repoBase = 'https://github.com/cook0001/ArmoryVault/releases';
  const mobRepoBase = 'https://github.com/cook0001/ArmoryVault-Companion-App/releases';

  const macArmAsset = assets.find(a => a.name.endsWith('.dmg') && (a.name.includes('arm64') || a.name.includes('aarch64')));
  const macIntelAsset = assets.find(a => a.name.endsWith('.dmg') && (a.name.includes('x64') || a.name.includes('x86_64') || (!a.name.includes('arm64') && !a.name.includes('aarch64'))));
  const winAsset = assets.find(a => a.name.endsWith('.exe'));
  const linuxAsset = assets.find(a => a.name.endsWith('.AppImage'));
  const apkAsset = mobAssets.find(a => a.name?.endsWith('.apk')) || assets.find(a => a.name?.endsWith('.apk'));

  if (currentDetectedOsCard === 'mac-arm') {
    btn.href = macArmAsset ? macArmAsset.browser_download_url : `${repoBase}/tag/${tagName}`;
    textEl.textContent = `Download for macOS (Apple Silicon ${tagName})`;
    if (badgeEl) badgeEl.textContent = `⚡ Auto-detected: macOS Apple Silicon (M1-M5)`;
  } else if (currentDetectedOsCard === 'mac-intel') {
    btn.href = macIntelAsset ? macIntelAsset.browser_download_url : `${repoBase}/tag/${tagName}`;
    textEl.textContent = `Download for macOS (Intel ${tagName})`;
    if (badgeEl) badgeEl.textContent = `⚡ Auto-detected: macOS Intel (x64)`;
  } else if (currentDetectedOsCard === 'windows') {
    btn.href = winAsset ? winAsset.browser_download_url : `${repoBase}/tag/${tagName}`;
    textEl.textContent = `Download for Windows (${tagName} .exe)`;
    if (badgeEl) badgeEl.textContent = `⚡ Auto-detected: Windows (64-bit)`;
  } else if (currentDetectedOsCard === 'linux') {
    btn.href = linuxAsset ? linuxAsset.browser_download_url : `${repoBase}/tag/${tagName}`;
    textEl.textContent = `Download for Linux (${tagName} .AppImage)`;
    if (badgeEl) badgeEl.textContent = `⚡ Auto-detected: Linux (.AppImage)`;
  } else if (currentDetectedOsCard === 'mobile') {
    btn.href = apkAsset ? apkAsset.browser_download_url : `${mobRepoBase}/tag/${mobTagName}`;
    textEl.textContent = `Download Companion APK (${mobTagName})`;
    if (badgeEl) badgeEl.textContent = `⚡ Auto-detected: Android Mobile`;
  }
}

/* ==========================================================================
   4. Interactive Showcase & Platform Tabs (Nightly, Stable, Mobile)
   ========================================================================== */
function initShowcaseTabs() {
  // Hero Platform / Channel Switcher (Nightly vs Stable vs Mobile)
  const heroTabs = document.querySelectorAll('.hero-tab-btn');
  const nightlyShowcase = document.getElementById('showcase-nightly');
  const stableShowcase = document.getElementById('showcase-stable');
  const mobileShowcase = document.getElementById('showcase-mobile');

  heroTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      heroTabs.forEach(t => t.classList.remove('active'));
      btn.classList.add('active');

      const target = btn.dataset.target;
      if (target === 'nightly') {
        if (nightlyShowcase) nightlyShowcase.style.display = 'block';
        if (stableShowcase) stableShowcase.style.display = 'none';
        if (mobileShowcase) mobileShowcase.style.display = 'none';
      } else if (target === 'stable') {
        if (nightlyShowcase) nightlyShowcase.style.display = 'none';
        if (stableShowcase) stableShowcase.style.display = 'block';
        if (mobileShowcase) mobileShowcase.style.display = 'none';
      } else if (target === 'mobile') {
        if (nightlyShowcase) nightlyShowcase.style.display = 'none';
        if (stableShowcase) stableShowcase.style.display = 'none';
        if (mobileShowcase) mobileShowcase.style.display = 'block';
      }
    });
  });

  // Nightly Top Navigation Bar Tabs
  const nightlyNavBtns = document.querySelectorAll('.nightly-nav-btn');
  const nightlyPanels = document.querySelectorAll('.nightly-screen-panel');

  nightlyNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      nightlyNavBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const screenId = btn.dataset.screen;
      nightlyPanels.forEach(panel => {
        if (panel.id === screenId) {
          panel.style.display = 'block';
          panel.classList.add('active');
        } else {
          panel.style.display = 'none';
          panel.classList.remove('active');
        }
      });
    });
  });

  // Nightly Tactical Filter Chips
  const filterChips = document.querySelectorAll('#nightly-filter-chips .filter-chip');
  const cardItems = document.querySelectorAll('#nightly-card-grid .inventory-item');
  const tableRows = document.querySelectorAll('#nightly-table-rows tr');

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const cat = chip.dataset.category;

      // Filter Cards
      cardItems.forEach(item => {
        if (cat === 'all') {
          item.style.display = 'flex';
        } else if (cat === 'servicedue') {
          item.style.display = item.dataset.servicedue === 'true' ? 'flex' : 'none';
        } else {
          item.style.display = item.dataset.category === cat ? 'flex' : 'none';
        }
      });

      // Filter Table Rows
      tableRows.forEach(row => {
        if (cat === 'all') {
          row.style.display = '';
        } else if (cat === 'servicedue') {
          row.style.display = row.dataset.servicedue === 'true' ? '' : 'none';
        } else {
          row.style.display = row.dataset.category === cat ? '' : 'none';
        }
      });
    });
  });

  // View Mode Switcher (Cards vs Table)
  const btnViewCards = document.getElementById('btn-view-cards');
  const btnViewTable = document.getElementById('btn-view-table');
  const cardGrid = document.getElementById('nightly-card-grid');
  const tableGrid = document.getElementById('nightly-table-grid');

  if (btnViewCards && btnViewTable) {
    btnViewCards.addEventListener('click', () => {
      btnViewCards.classList.add('active');
      btnViewTable.classList.remove('active');
      if (cardGrid) cardGrid.style.display = 'grid';
      if (tableGrid) tableGrid.style.display = 'none';
    });

    btnViewTable.addEventListener('click', () => {
      btnViewTable.classList.add('active');
      btnViewCards.classList.remove('active');
      if (cardGrid) cardGrid.style.display = 'none';
      if (tableGrid) tableGrid.style.display = 'block';
    });
  }

  // Depot Sub-Tabs (Live vs Reloading vs Overview)
  const depotTabs = document.querySelectorAll('.depot-tab');
  depotTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      depotTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });
}

// Global helper for quick range sim switch
window.triggerRangeSimQuick = function() {
  const rangeNavBtn = document.querySelector('.nightly-nav-btn[data-screen="nightly-range"]');
  if (rangeNavBtn) rangeNavBtn.click();
};

// Global helper for interactive batch manufacture simulation
window.executeBatchManufactureSim = function() {
  const powderEl = document.getElementById('sim-powder-val');
  const primerEl = document.getElementById('sim-primer-val');
  const bulletEl = document.getElementById('sim-bullet-val');
  const ammo9mmEl = document.getElementById('depot-9mm-count');
  const totalAmmoEl = document.getElementById('nightly-val-ammo');
  const btn = document.getElementById('btn-run-batch-sim');

  let currentPowder = parseFloat(powderEl?.textContent || '3.00');
  let currentPrimers = parseInt((primerEl?.textContent || '2,500').replace(/,/g, ''), 10);
  let currentBullets = parseInt((bulletEl?.textContent || '1,200').replace(/,/g, ''), 10);
  let current9mm = parseInt((ammo9mmEl?.textContent || '2,450').replace(/[^0-9]/g, ''), 10);
  let currentTotal = parseInt((totalAmmoEl?.textContent || '9,420').replace(/[^0-9]/g, ''), 10);

  if (currentPrimers < 50 || currentBullets < 50) {
    alert('Insufficient components remaining on bench for another 50-round batch.');
    return;
  }

  // Deduct components & add ammo
  currentPowder = Math.max(0, currentPowder - 0.03);
  currentPrimers -= 50;
  currentBullets -= 50;
  current9mm += 50;
  currentTotal += 50;

  if (powderEl) powderEl.textContent = currentPowder.toFixed(2);
  if (primerEl) primerEl.textContent = currentPrimers.toLocaleString();
  if (bulletEl) bulletEl.textContent = currentBullets.toLocaleString();
  if (ammo9mmEl) ammo9mmEl.textContent = `${current9mm.toLocaleString()} rds`;
  if (totalAmmoEl) totalAmmoEl.innerHTML = `${currentTotal.toLocaleString()} <span style="font-size: 0.75rem; font-weight: 500;">rds</span>`;

  if (btn) {
    const orig = btn.innerHTML;
    btn.innerHTML = `<span>✓ Manufactured +50 rds 9mm!</span>`;
    btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    setTimeout(() => {
      btn.innerHTML = orig;
      btn.style.background = '';
    }, 2200);
  }
};

// Global helper for simulated vault locking animation
window.simulateVaultLockAnimation = function() {
  const container = document.getElementById('showcase-nightly');
  if (!container) return;

  const originalBody = container.querySelector('.device-body');
  if (!originalBody) return;

  const lockOverlay = document.createElement('div');
  lockOverlay.id = 'sim-lock-overlay';
  lockOverlay.style.cssText = 'position: absolute; top: 48px; left: 0; right: 0; bottom: 0; background: rgba(11, 15, 25, 0.95); backdrop-filter: blur(20px); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 50; padding: 2rem; text-align: center; animation: fadeIn 0.25s ease-out;';
  lockOverlay.innerHTML = `
    <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
    </div>
    <h3 style="color: #fff; font-size: 1.3rem; margin-bottom: 0.5rem;">Vault Locked &amp; Encrypted</h3>
    <p style="color: #94a3b8; max-width: 420px; font-size: 0.85rem; margin-bottom: 1.25rem;">
      Decryption keys purged from PC memory. The paired Mobile Companion app maintains its offline cache for range sessions.
    </p>
    <button class="btn btn-primary btn-sm" onclick="document.getElementById('sim-lock-overlay')?.remove()">
      <span>Unlock Simulated Vault</span>
    </button>
  `;

  container.appendChild(lockOverlay);
};

/* ==========================================================================
   5. Interactive Range Session Simulator Demo
   ========================================================================== */
function initRangeSimulator() {
  const fireLogBtn = document.getElementById('btn-sim-log');
  if (!fireLogBtn) return;

  const firearmSelect = document.getElementById('sim-firearm');
  const roundsInput = document.getElementById('sim-rounds');
  const feedbackBox = document.getElementById('sim-feedback');

  // Interactive state
  const state = {
    'glock19': { name: 'Glock 19 Gen 5', caliber: '9mm Luger', roundsFired: 1250, ammoStock: 2450, serviceInterval: 2500, countElId: 'nightly-gun-glock-rounds', ammoElId: 'depot-9mm-count' },
    'ddm4': { name: 'Daniel Defense DDM4 V7', caliber: '5.56 NATO', roundsFired: 3100, ammoStock: 1800, serviceInterval: 5000, countElId: 'nightly-gun-ddm4-rounds', ammoElId: 'depot-556-count' },
    'm1garand': { name: 'M1 Garand (Springfield)', caliber: '.30-06 Springfield', roundsFired: 640, ammoStock: 820, serviceInterval: 1000, countElId: 'nightly-gun-m1-rounds' }
  };

  function updateDisplay() {
    const selectedKey = firearmSelect.value;
    const item = state[selectedKey];

    const roundsCountEl = document.getElementById(item.countElId);
    const ammoStockEl = item.ammoElId ? document.getElementById(item.ammoElId) : null;
    const totalRoundsEl = document.getElementById('nightly-val-rounds');

    if (roundsCountEl) roundsCountEl.textContent = item.roundsFired.toLocaleString();
    if (ammoStockEl) ammoStockEl.textContent = `${item.ammoStock.toLocaleString()} rds`;
    
    if (totalRoundsEl) {
      const totalAll = Object.values(state).reduce((sum, g) => sum + g.roundsFired, 13660);
      totalRoundsEl.textContent = totalAll.toLocaleString();
    }
  }

  fireLogBtn.addEventListener('click', () => {
    const selectedKey = firearmSelect.value;
    const rounds = parseInt(roundsInput.value, 10);

    if (isNaN(rounds) || rounds <= 0) {
      alert('Please enter a valid round count greater than 0.');
      return;
    }

    const item = state[selectedKey];
    if (item.ammoStock < rounds) {
      alert(`Insufficient ammo stock in vault for ${item.caliber}! Available: ${item.ammoStock}`);
      return;
    }

    // Mutate state atomically
    item.roundsFired += rounds;
    item.ammoStock -= rounds;

    updateDisplay();

    // Trigger recoil spark micro-animation on the simulator box
    const simBox = document.querySelector('.range-simulator');
    if (simBox) {
      simBox.classList.remove('recoil-active');
      void simBox.offsetWidth; // trigger DOM reflow
      simBox.classList.add('recoil-active');
    }

    // Show visual confirmation
    if (feedbackBox) {
      feedbackBox.style.display = 'flex';
      feedbackBox.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
        <span><strong>Logged ${rounds} rounds</strong> to ${item.name}! Stock decremented by ${rounds} rds. Telemetry wear counter updated.</span>
      `;
    }

    // Button pulse animation
    fireLogBtn.style.transform = 'scale(0.96)';
    setTimeout(() => { fireLogBtn.style.transform = ''; }, 150);
  });
}

/* ==========================================================================
   6. Feature Suggestion & Bug Report Hub (GitHub Issues Generator)
   ========================================================================== */
function initFeedbackHub() {
  const tabBtns = document.querySelectorAll('.feedback-tab-btn');
  const typeInput = document.getElementById('feedback-type');
  const titleInput = document.getElementById('feedback-title');
  const categorySelect = document.getElementById('feedback-category');
  const osSelect = document.getElementById('feedback-os');
  const versionSelect = document.getElementById('feedback-version');
  const descInput = document.getElementById('feedback-desc');
  const previewBox = document.getElementById('feedback-preview');
  const btnSubmit = document.getElementById('btn-submit-issue');
  const btnCopy = document.getElementById('btn-copy-markdown');

  let currentType = 'feature'; // 'feature' or 'bug'

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      currentType = btn.dataset.type;
      if (typeInput) typeInput.value = currentType;

      const titleLabel = document.getElementById('label-feedback-title');
      const descLabel = document.getElementById('label-feedback-desc');

      if (currentType === 'feature') {
        if (titleLabel) titleLabel.textContent = 'Feature Title';
        if (descLabel) descLabel.textContent = 'What problem does this solve & how should it work?';
        if (titleInput) titleInput.placeholder = 'e.g., Add support for custom bullet grain weights in quick filter';
      } else {
        if (titleLabel) titleLabel.textContent = 'Bug Summary';
        if (descLabel) descLabel.textContent = 'Steps to reproduce the bug & expected behavior';
        if (titleInput) titleInput.placeholder = 'e.g., CSV export double quotes issue on Windows 11';
      }

      updateMarkdownPreview();
    });
  });

  function generateMarkdown() {
    const title = titleInput?.value.trim() || 'Untitled';
    const category = categorySelect?.value || 'General';
    const os = osSelect?.value || 'Not specified';
    const desc = descInput?.value.trim() || 'No description provided.';
    const appVersion = versionSelect?.value || document.querySelector('.release-version-tag')?.textContent || 'v2.7.1';

    if (currentType === 'feature') {
      return `### 💡 Feature Suggestion: ${title}

**Category:** ${category}  
**Platform / OS:** ${os}  
**App Version:** ${appVersion}  

#### Detailed Proposal & Use Case
${desc}

---
*Submitted via ArmoryVault Community Web Portal*`;
    } else {
      return `### 🐛 Bug Report: ${title}

**Category:** ${category}  
**Platform / OS:** ${os}  
**App Version:** ${appVersion}  

#### Description & Steps to Reproduce
${desc}

---
*Submitted via ArmoryVault Community Web Portal*`;
    }
  }

  function updateMarkdownPreview() {
    if (previewBox) {
      previewBox.textContent = generateMarkdown();
    }
  }

  [titleInput, categorySelect, osSelect, versionSelect, descInput].forEach(el => {
    if (el) {
      el.addEventListener('input', updateMarkdownPreview);
      el.addEventListener('change', updateMarkdownPreview);
    }
  });

  if (btnSubmit) {
    btnSubmit.addEventListener('click', (e) => {
      e.preventDefault();
      const title = titleInput?.value.trim();
      if (!title) {
        alert('Please enter a title for your suggestion or bug report.');
        titleInput?.focus();
        return;
      }

      const label = currentType === 'feature' ? 'enhancement' : 'bug';
      const issueTitle = encodeURIComponent(`[${currentType.toUpperCase()}] ${title}`);
      const issueBody = encodeURIComponent(generateMarkdown());
      const githubUrl = `https://github.com/cook0001/ArmoryVault/issues/new?title=${issueTitle}&body=${issueBody}&labels=${label}`;

      window.open(githubUrl, '_blank', 'noopener,noreferrer');
    });
  }

  if (btnCopy) {
    btnCopy.addEventListener('click', async () => {
      const markdown = generateMarkdown();
      try {
        await navigator.clipboard.writeText(markdown);
        const originalText = btnCopy.innerHTML;
        btnCopy.classList.add('copied');
        btnCopy.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied Markdown!`;
        setTimeout(() => {
          btnCopy.classList.remove('copied');
          btnCopy.innerHTML = originalText;
        }, 2200);
      } catch (err) {
        alert('Could not copy to clipboard. Please copy manually from the preview box.');
      }
    });
  }

  // Initial preview render
  updateMarkdownPreview();
}

/* ==========================================================================
   7. FAQ Accordion
   ========================================================================== */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    if (questionBtn) {
      questionBtn.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        // Close other items for single-open accordion feel
        faqItems.forEach(otherItem => {
          otherItem.classList.remove('active');
        });

        if (!isActive) {
          item.classList.add('active');
        }
      });
    }
  });
}

/* ==========================================================================
   8. 1-Click Clipboard Copy for Terminal Commands
   ========================================================================== */
function initClipboardButtons() {
  const copyButtons = document.querySelectorAll('.btn-copy-cmd');

  copyButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const cmdText = btn.dataset.cmd;
      if (!cmdText) return;

      try {
        await navigator.clipboard.writeText(cmdText);
        const originalHtml = btn.innerHTML;
        btn.classList.add('copied');
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!`;
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.innerHTML = originalHtml;
        }, 2000);
      } catch (err) {
        console.error('Failed to copy command:', err);
      }
    });
  });
}

/* ==========================================================================
   9. In-Frame Showcase Modal Simulator (Add Firearm & Bound Book Print)
   ========================================================================== */
window.openShowcaseModal = function(type) {
  const overlay = document.getElementById('showcase-modal-overlay');
  const addModal = document.getElementById('modal-sim-add-firearm');
  const printModal = document.getElementById('modal-sim-print-boundbook');
  if (!overlay) return;

  overlay.style.display = 'flex';
  if (type === 'add-firearm') {
    if (addModal) addModal.style.display = 'block';
    if (printModal) printModal.style.display = 'none';
  } else if (type === 'print-boundbook') {
    if (addModal) addModal.style.display = 'none';
    if (printModal) printModal.style.display = 'block';
  }
};

window.closeShowcaseModal = function() {
  const overlay = document.getElementById('showcase-modal-overlay');
  if (overlay) overlay.style.display = 'none';
};

window.saveSimulatedFirearmRecord = function() {
  closeShowcaseModal();
  const feedbackBox = document.getElementById('sim-feedback');
  if (feedbackBox) {
    feedbackBox.style.display = 'flex';
    feedbackBox.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
      <span><strong>Record Saved:</strong> Springfield M1 Garand added to Vault Safe with 4-part wear schedule and AES-256 encryption.</span>
    `;
    setTimeout(() => {
      feedbackBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }
};

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeShowcaseModal();
  }
});

/* ==========================================================================
   10. Floating Back-to-Top Navigation
   ========================================================================== */
function initBackToTop() {
  const btn = document.getElementById('btn-back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ==========================================================================
   11. Interactive PayPal Donation Deck & Custom Amount Selector
   ========================================================================== */
function initDonationDeck() {
  const chips = document.querySelectorAll('.donation-chip');
  const customInput = document.getElementById('custom-donation-input');
  const proceedBtn = document.getElementById('btn-paypal-proceed');
  const proceedText = document.getElementById('btn-paypal-proceed-text');

  if (!proceedBtn) return;

  const basePaypalUrl = 'https://paypal.me/ArmoryVault';

  function setDonationAmount(amount) {
    if (amount && !isNaN(amount) && Number(amount) > 0) {
      const formattedAmount = Number(amount);
      proceedBtn.href = `${basePaypalUrl}/${formattedAmount}USD`;
      if (proceedText) {
        proceedText.textContent = `Proceed to Donate $${formattedAmount} USD via PayPal`;
      }
    } else {
      proceedBtn.href = basePaypalUrl;
      if (proceedText) {
        proceedText.textContent = `Proceed to Donate via PayPal`;
      }
    }
  }

  // Handle Preset Chips
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      if (customInput) customInput.value = '';
      const amount = chip.dataset.amount;
      setDonationAmount(amount);
    });
  });

  // Handle Custom Amount Input
  if (customInput) {
    customInput.addEventListener('input', () => {
      const val = customInput.value.trim();
      if (val) {
        chips.forEach(c => c.classList.remove('active'));
        setDonationAmount(val);
      } else {
        // If empty, revert to default preset $25
        const defaultChip = document.querySelector('.donation-chip[data-amount="25"]');
        if (defaultChip) {
          defaultChip.classList.add('active');
          setDonationAmount('25');
        } else {
          setDonationAmount('');
        }
      }
    });

    customInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        proceedBtn.click();
      }
    });
  }
}
