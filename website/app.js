/**
 * ArmoryVault Portal — Modern Interactive Controller
 * Streamlined, lightweight, and zero bloat.
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initOsDetection();
  initShowcaseTabs();
  initDonationDeck();
  initFaqAccordion();
  initCopyButtons();
});

/* ==========================================================================
   1. Navbar & Scroll State
   ========================================================================== */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const navToggle = document.querySelector('.nav-toggle');
  const mobileMenu = document.querySelector('.mobile-nav-menu');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
      const isOpen = mobileMenu.classList.contains('open');
      navToggle.setAttribute('aria-expanded', isOpen);
      navToggle.innerHTML = isOpen ? '✕' : '☰';
    });

    mobileLinks.forEach((link) => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        if (navToggle) navToggle.innerHTML = '☰';
      });
    });
  }
}

/* ==========================================================================
   2. OS Detection & Smart Hero Download
   ========================================================================== */
function initOsDetection() {
  const ua = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || '';

  let detectedCardId = 'download-windows';
  let targetUrl = 'https://github.com/cook0001/ArmoryVault/releases/latest';
  let btnLabel = 'Download for Windows (.exe)';

  if (ua.includes('mac') || platform.includes('mac')) {
    detectedCardId = 'download-mac-arm';
    btnLabel = 'Download for macOS (Apple Silicon)';
    // Check for Apple Silicon vs Intel
    if (navigator.userAgentData) {
      navigator.userAgentData
        .getHighEntropyValues(['architecture'])
        .then((data) => {
          if (data.architecture === 'x86') {
            detectedCardId = 'download-mac-intel';
            btnLabel = 'Download for macOS (Intel x64)';
          }
          applyDetection(detectedCardId, btnLabel, targetUrl);
        })
        .catch(() => applyDetection(detectedCardId, btnLabel, targetUrl));
      return;
    }
  } else if (ua.includes('linux') || platform.includes('linux')) {
    detectedCardId = 'download-linux';
    btnLabel = 'Download for Linux (.AppImage)';
  } else if (ua.includes('android')) {
    detectedCardId = 'download-mobile';
    targetUrl =
      'https://github.com/cook0001/ArmoryVault-Companion-App/releases/latest/download/app-release.apk';
    btnLabel = 'Download Android APK Direct';
  }

  applyDetection(detectedCardId, btnLabel, targetUrl);
}

function applyDetection(cardId, label, url) {
  const heroBtn = document.getElementById('hero-smart-download-btn');
  const heroBtnText = document.getElementById('hero-smart-btn-text');

  if (heroBtn && heroBtnText) {
    heroBtnText.textContent = label;
    heroBtn.href = url;
  }

  // Highlight corresponding card in download matrix
  document
    .querySelectorAll('.download-card')
    .forEach((card) => card.classList.remove('highlighted'));
  const targetCard = document.getElementById(cardId);
  if (targetCard) {
    targetCard.classList.add('highlighted');
  }
}

/* ==========================================================================
   3. Showcase Tabs (Desktop vs Mobile)
   ========================================================================== */
function initShowcaseTabs() {
  const tabBtns = document.querySelectorAll('.showcase-tab-btn');
  const viewDesktop = document.getElementById('showcase-view-desktop');
  const viewMobile = document.getElementById('showcase-view-mobile');

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const target = btn.dataset.target;
      if (target === 'mobile') {
        if (viewDesktop) viewDesktop.style.display = 'none';
        if (viewMobile) viewMobile.style.display = 'flex';
      } else {
        if (viewDesktop) viewDesktop.style.display = 'block';
        if (viewMobile) viewMobile.style.display = 'none';
      }
    });
  });
}

/* ==========================================================================
   4. Donation Amount Selector
   ========================================================================== */
function initDonationDeck() {
  const chips = document.querySelectorAll('.donation-chip');
  const customInput = document.getElementById('custom-donation-input');
  const paypalBtn = document.getElementById('btn-paypal-proceed');
  const paypalText = document.getElementById('btn-paypal-proceed-text');

  function updatePaypal(amount) {
    const cleanAmount = Math.max(parseFloat(amount) || 25, 1);
    if (paypalBtn) {
      paypalBtn.href = `https://paypal.me/ArmoryVault/${cleanAmount}USD`;
    }
    if (paypalText) {
      paypalText.textContent = `Proceed to Donate $${cleanAmount} USD via PayPal`;
    }
  }

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      if (customInput) customInput.value = '';
      updatePaypal(chip.dataset.amount);
    });
  });

  if (customInput) {
    customInput.addEventListener('input', () => {
      chips.forEach((c) => c.classList.remove('active'));
      if (customInput.value) {
        updatePaypal(customInput.value);
      }
    });
  }
}

/* ==========================================================================
   5. FAQ Accordion
   ========================================================================== */
function initFaqAccordion() {
  const items = document.querySelectorAll('.faq-item');
  items.forEach((item) => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        items.forEach((i) => i.classList.remove('open'));
        if (!isOpen) {
          item.classList.add('open');
        }
      });
    }
  });
}

/* ==========================================================================
   6. 1-Click Clipboard Copy
   ========================================================================== */
function initCopyButtons() {
  const copyBtns = document.querySelectorAll('.btn-copy-cmd');
  copyBtns.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const textToCopy = btn.dataset.cmd || 'xattr -cr /Applications/ArmoryVault.app';
      try {
        await navigator.clipboard.writeText(textToCopy);
        const originalHtml = btn.innerHTML;
        btn.innerHTML = `<span style="color: #10b981;">✓ Copied to Clipboard</span>`;
        setTimeout(() => {
          btn.innerHTML = originalHtml;
        }, 2000);
      } catch (_err) {
        // Fallback for non-https/permissions
        const temp = document.createElement('input');
        temp.value = textToCopy;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
        btn.textContent = 'Copied!';
        setTimeout(() => {
          btn.textContent = 'Copy macOS Fix';
        }, 2000);
      }
    });
  });
}
