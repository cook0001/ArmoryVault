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

/* ==========================================================================
   2. OS Detection & Recommended Download Highlighting
   ========================================================================== */
function initOsDetection() {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || '';
  
  let detectedOs = 'windows'; // fallback
  let isMacArm = false;

  if (userAgent.includes('mac') || platform.includes('mac')) {
    detectedOs = 'macos';
    // Test for Apple Silicon / M-series
    if (navigator.userAgentData) {
      navigator.userAgentData.getHighEntropyValues(['architecture']).then(ua => {
        if (ua.architecture === 'arm') {
          highlightDownloadCard('mac-arm');
        } else {
          highlightDownloadCard('mac-intel');
        }
      }).catch(() => {
        highlightDownloadCard('mac-arm'); // default modern Mac to Apple Silicon
      });
    } else {
      // Modern WebGL renderer inspection heuristic or default Apple Silicon
      highlightDownloadCard('mac-arm');
    }
  } else if (userAgent.includes('win') || platform.includes('win')) {
    detectedOs = 'windows';
    highlightDownloadCard('windows');
  } else if (userAgent.includes('linux') || platform.includes('linux')) {
    detectedOs = 'linux';
    highlightDownloadCard('linux');
  } else if (userAgent.includes('android') || userAgent.includes('iphone') || userAgent.includes('ipad')) {
    detectedOs = 'mobile';
    highlightDownloadCard('mobile');
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
}

/* ==========================================================================
   3. Live GitHub Release Asset Resolution & Channel Switching
   ========================================================================== */
let globalReleases = {
  stable: null,
  nightly: null,
  activeChannel: 'stable'
};

async function initReleaseData() {
  const repoOwner = 'cook0001';
  const repoName = 'ArmoryVault';
  const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/releases`;

  const fallbackStableTag = 'v2.7.1';
  const fallbackNightlyTag = 'v2.8.0-nightly.1';

  try {
    const response = await fetch(apiUrl, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`GitHub API returned status ${response.status}`);
    
    const releases = await response.json();
    
    // Find latest stable and latest prerelease
    const stable = releases.find(r => !r.prerelease && !r.draft) || releases[0];
    const nightly = releases.find(r => r.prerelease || r.tag_name?.includes('nightly') || r.tag_name?.includes('beta'));

    globalReleases.stable = stable || { tag_name: fallbackStableTag, assets: [] };
    globalReleases.nightly = nightly || { tag_name: fallbackNightlyTag, assets: [] };

    // Update tag text in headers
    document.querySelectorAll('.release-version-tag').forEach(el => {
      el.textContent = globalReleases.stable.tag_name || fallbackStableTag;
    });

    document.querySelectorAll('.nightly-version-tag').forEach(el => {
      el.textContent = globalReleases.nightly.tag_name || fallbackNightlyTag;
    });

    applyChannelAssets('stable');

  } catch (err) {
    console.log('Using default release fallback urls:', err.message);
    globalReleases.stable = { tag_name: fallbackStableTag, assets: [] };
    globalReleases.nightly = { tag_name: fallbackNightlyTag, assets: [] };
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
    });

    nightlyBtn.addEventListener('click', () => {
      nightlyBtn.classList.add('active');
      stableBtn.classList.remove('active');
      if (nightlyBanner) nightlyBanner.style.display = 'block';
      globalReleases.activeChannel = 'nightly';
      applyChannelAssets('nightly');
    });
  }
}

function applyChannelAssets(channel) {
  const rel = channel === 'nightly' ? globalReleases.nightly : globalReleases.stable;
  const tagName = rel?.tag_name || (channel === 'nightly' ? 'v2.8.0-nightly.1' : 'v2.7.1');
  const assets = rel?.assets || [];
  const repoBase = 'https://github.com/cook0001/ArmoryVault/releases';

  // Match assets
  const macArmAsset = assets.find(a => a.name.endsWith('.dmg') && (a.name.includes('arm64') || a.name.includes('aarch64')));
  const macIntelAsset = assets.find(a => a.name.endsWith('.dmg') && (a.name.includes('x64') || a.name.includes('x86_64') || (!a.name.includes('arm64') && !a.name.includes('aarch64'))));
  const winAsset = assets.find(a => a.name.endsWith('.exe'));
  const linuxAsset = assets.find(a => a.name.endsWith('.AppImage'));
  const apkAsset = assets.find(a => a.name.endsWith('.apk'));

  const isNightly = channel === 'nightly';
  const prefix = isNightly ? '[Nightly] ' : '';

  updateDownloadBtn(
    'btn-download-mac-arm', 
    macArmAsset ? macArmAsset.browser_download_url : `${repoBase}/tag/${tagName}`, 
    `${prefix}${tagName} (Apple Silicon)`
  );
  
  updateDownloadBtn(
    'btn-download-mac-intel', 
    macIntelAsset ? macIntelAsset.browser_download_url : `${repoBase}/tag/${tagName}`, 
    `${prefix}${tagName} (Intel x64)`
  );

  updateDownloadBtn(
    'btn-download-win', 
    winAsset ? winAsset.browser_download_url : `${repoBase}/tag/${tagName}`, 
    `${prefix}${tagName} (Windows .exe)`
  );

  updateDownloadBtn(
    'btn-download-linux', 
    linuxAsset ? linuxAsset.browser_download_url : `${repoBase}/tag/${tagName}`, 
    `${prefix}${tagName} (Linux .AppImage)`
  );

  if (apkAsset) {
    updateDownloadBtn(
      'btn-download-mobile', 
      apkAsset.browser_download_url, 
      `${prefix}${tagName} (.apk)`
    );
  }
}

function updateDownloadBtn(btnId, url, labelSuffix) {
  const btn = document.getElementById(btnId);
  if (btn) {
    btn.href = url;
    const subtext = btn.querySelector('.btn-subtext');
    if (subtext) subtext.textContent = labelSuffix;
  }
}

/* ==========================================================================
   4. Interactive Showcase & Platform Tabs
   ========================================================================== */
function initShowcaseTabs() {
  // Hero Platform Switcher (Desktop vs Mobile)
  const heroTabs = document.querySelectorAll('.hero-tab-btn');
  const desktopShowcase = document.getElementById('showcase-desktop');
  const mobileShowcase = document.getElementById('showcase-mobile');

  heroTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      heroTabs.forEach(t => t.classList.remove('active'));
      btn.classList.add('active');

      const target = btn.dataset.target;
      if (target === 'desktop') {
        if (desktopShowcase) desktopShowcase.style.display = 'block';
        if (mobileShowcase) mobileShowcase.style.display = 'none';
      } else if (target === 'mobile') {
        if (desktopShowcase) desktopShowcase.style.display = 'none';
        if (mobileShowcase) mobileShowcase.style.display = 'block';
      }
    });
  });

  // Device window screen tabs (Dashboard, Ammo, Bound Book, Sync)
  const deviceTabs = document.querySelectorAll('.device-tab');
  const screenPanels = document.querySelectorAll('.screen-panel');

  deviceTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      deviceTabs.forEach(t => t.classList.remove('active'));
      screenPanels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const screenId = tab.dataset.screen;
      const targetPanel = document.getElementById(`screen-${screenId}`);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });
}

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
    'glock19': { name: 'Glock 19 Gen 5', caliber: '9mm Luger', roundsFired: 1250, ammoStock: 2450, serviceInterval: 2500 },
    'ddm4': { name: 'Daniel Defense DDM4 V7', caliber: '5.56x45mm NATO', roundsFired: 3100, ammoStock: 1800, serviceInterval: 5000 },
    'm1garand': { name: 'M1 Garand (Springfield)', caliber: '.30-06 Springfield', roundsFired: 640, ammoStock: 820, serviceInterval: 1000 }
  };

  function updateDisplay() {
    const selectedKey = firearmSelect.value;
    const item = state[selectedKey];

    const roundsCountEl = document.getElementById(`val-rounds-${selectedKey}`);
    const ammoStockEl = document.getElementById(`val-ammo-${selectedKey}`);
    const progressEl = document.getElementById(`val-progress-${selectedKey}`);

    if (roundsCountEl) roundsCountEl.textContent = item.roundsFired.toLocaleString();
    if (ammoStockEl) ammoStockEl.textContent = item.ammoStock.toLocaleString();
    
    if (progressEl) {
      const pct = Math.min(100, Math.round((item.roundsFired / item.serviceInterval) * 100));
      progressEl.style.width = `${pct}%`;
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

    // Show visual confirmation
    feedbackBox.style.display = 'flex';
    feedbackBox.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
      <span><strong>Logged ${rounds} rounds</strong> to ${item.name}! Ammo stock decremented by ${rounds} rds. Telemetry wear counter updated.</span>
    `;

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
    const appVersion = document.querySelector('.release-version-tag')?.textContent || 'v2.7.1';

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

  [titleInput, categorySelect, osSelect, descInput].forEach(el => {
    if (el) el.addEventListener('input', updateMarkdownPreview);
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
