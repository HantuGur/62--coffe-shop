/**
 * +62 Coffee & Space — script.js
 *
 * Modules:
 *   1. Stars       — canvas-free star background using CSS custom props
 *   2. Navigation  — hamburger menu + mobile nav + close on link click
 *   3. ScrollReveal — IntersectionObserver-based reveal animation
 *   4. MenuFilter  — tab-based category filtering for menu items
 */

'use strict';

/* ============================================================
   CONFIG
============================================================ */
const CONFIG = {
  stars: {
    count: 70,         // Reduced DOM elements vs original
    minSize: 0.5,      // px
    maxSize: 2.5,      // px
    minDuration: 2,    // seconds
    maxDuration: 6,    // seconds
    maxDelay: 5,       // seconds
  },
  scrollReveal: {
    threshold: 0.1,
    visibleClass: 'is-visible',
  },
  menuFilter: {
    activeClass: 'tab--active',
    hiddenClass: 'menu-card--hidden',
    fadeClass: 'menu-card--fade-in',
    filterAttr: 'data-filter',
    categoryAttr: 'data-category',
  },
};


/* ============================================================
   UTILITY HELPERS
============================================================ */

/**
 * Returns a random float between min and max (inclusive).
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Queries a single element, throws a clear error if not found.
 * @param {string} selector
 * @param {Document|Element} [root=document]
 * @returns {Element}
 */
function qs(selector, root = document) {
  const el = root.querySelector(selector);
  if (!el) console.warn(`[+62] Element not found: "${selector}"`);
  return el;
}

/**
 * Queries all matching elements and returns them as an Array.
 * @param {string} selector
 * @param {Document|Element} [root=document]
 * @returns {Element[]}
 */
function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}


/* ============================================================
   1. STARS
   Generates lightweight star elements using CSS custom properties
   for animation variance instead of inline JS-driven animation.
============================================================ */
function initStars() {
  const container = qs('#stars');
  if (!container) return;

  const { count, minSize, maxSize, minDuration, maxDuration, maxDelay } = CONFIG.stars;

  // Use a DocumentFragment to batch DOM insertion (single reflow)
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < count; i++) {
    const star = document.createElement('div');
    star.className = 'star';

    const size = randomBetween(minSize, maxSize).toFixed(2);
    const duration = randomBetween(minDuration, maxDuration).toFixed(2);
    const delay = randomBetween(0, maxDelay).toFixed(2);

    // CSS custom properties drive animation — avoids layout thrashing
    star.style.setProperty('--star-size',     `${size}px`);
    star.style.setProperty('--star-duration', `${duration}s`);
    star.style.setProperty('--star-delay',    `${delay}s`);
    star.style.left = `${randomBetween(0, 100).toFixed(2)}%`;
    star.style.top  = `${randomBetween(0, 100).toFixed(2)}%`;

    fragment.appendChild(star);
  }

  container.appendChild(fragment);
}


/* ============================================================
   2. NAVIGATION
   Handles hamburger toggle and closes mobile menu when a link
   inside it is clicked.
============================================================ */
function initNavigation() {
  const hamburger  = qs('#nav-hamburger');
  const mobileMenu = qs('#mobile-menu');
  const mobileLinks = qsa('.nav__mobile-link');

  if (!hamburger || !mobileMenu) return;

  /** Opens or closes the mobile menu and syncs ARIA attributes. */
  function toggleMenu(open) {
    const isOpen = typeof open === 'boolean' ? open : hamburger.getAttribute('aria-expanded') !== 'true';

    hamburger.setAttribute('aria-expanded', String(isOpen));
    mobileMenu.setAttribute('aria-hidden',  String(!isOpen));
    mobileMenu.classList.toggle('is-open', isOpen);

    // Update hamburger label for screen readers
    hamburger.setAttribute(
      'aria-label',
      isOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'
    );
  }

  // Toggle on hamburger click
  hamburger.addEventListener('click', () => toggleMenu());

  // Close when a mobile link is clicked (smooth scroll then close)
  mobileLinks.forEach((link) => {
    link.addEventListener('click', () => toggleMenu(false));
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && hamburger.getAttribute('aria-expanded') === 'true') {
      toggleMenu(false);
      hamburger.focus(); // Return focus to trigger for accessibility
    }
  });
}


/* ============================================================
   3. SCROLL REVEAL
   Uses a single IntersectionObserver instance (better performance
   than one observer per element).
============================================================ */
function initScrollReveal() {
  const { threshold, visibleClass } = CONFIG.scrollReveal;

  // Skip if browser doesn't support IntersectionObserver
  if (!('IntersectionObserver' in window)) {
    // Fallback: show all elements immediately
    qsa('.reveal').forEach((el) => el.classList.add(visibleClass));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add(visibleClass);
          // Unobserve after reveal — no need to keep watching
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold }
  );

  qsa('.reveal').forEach((el) => observer.observe(el));
}


/* ============================================================
   4. MENU FILTER
   Filters menu cards by category. Uses CSS class toggling for
   show/hide and a short fade-in animation on revealed cards.
============================================================ */
function initMenuFilter() {
  const { activeClass, hiddenClass, fadeClass, filterAttr, categoryAttr } = CONFIG.menuFilter;

  const tabs  = qsa('.tab');
  const cards = qsa('.menu-card');

  if (!tabs.length || !cards.length) return;

  /**
   * Filters menu cards to match the given category.
   * @param {string} category - 'all' or a specific category string
   */
  function filterMenu(category) {
    cards.forEach((card) => {
      const matches = category === 'all' || card.dataset.category === category;

      if (matches) {
        card.classList.remove(hiddenClass);
        // Remove fade class first so re-adding it triggers the animation
        card.classList.remove(fadeClass);
        // Force reflow to restart CSS animation
        void card.offsetWidth;
        card.classList.add(fadeClass);
      } else {
        card.classList.add(hiddenClass);
        card.classList.remove(fadeClass);
      }
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const selectedFilter = tab.getAttribute(filterAttr);

      // Update active tab state + ARIA
      tabs.forEach((t) => {
        t.classList.remove(activeClass);
        t.setAttribute('aria-pressed', 'false');
      });
      tab.classList.add(activeClass);
      tab.setAttribute('aria-pressed', 'true');

      filterMenu(selectedFilter);
    });
  });
}


/* ============================================================
   INIT — run all modules after DOM is ready
============================================================ */
function init() {
  initStars();
  initNavigation();
  initScrollReveal();
  initMenuFilter();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM already parsed (script loaded with defer or at bottom of body)
  init();
}
