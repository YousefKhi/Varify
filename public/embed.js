(function() {
  const API_BASE_URL = 'https://varify-sepia.vercel.app/api';

  // ▶️ Grab your project ID from the <script> tag
  const getProjectId = () => {
    const scripts = document.getElementsByTagName('script');
    for (const script of scripts) {
      const projectId =
        script.getAttribute('data-project') ||
        script.getAttribute('data-project-id');
      if (projectId && script.src.includes('embed.js')) {
        return projectId;
      }
    }
    console.error('[Varify] data-project attribute not found in embed script.');
    return null;
  };

  // ▶️ A/B variant helpers
  const getRandomVariant = (split = 50) =>
    Math.random() * 100 < split ? 'A' : 'B';
  const getStoredVariant = testId =>
    localStorage.getItem(`varify-${testId}`);
  const storeVariant = (testId, variant) => {
    localStorage.setItem(`varify-${testId}`, variant);
    return variant;
  };
  const assignVariant = test =>
    getStoredVariant(test.id) || storeVariant(test.id, getRandomVariant(test.split));

  // ▶️ Wait until an element appears (handles React/Next.js timing)
  const waitForElement = (selector, callback) => {
    const element = document.querySelector(selector);
    if (element) return callback(element);
    const observer = new MutationObserver((mutations, obs) => {
      if (document.querySelector(selector)) {
        obs.disconnect();
        callback(document.querySelector(selector));
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  };

  // ▶️ Fetch your tests from the API
  const fetchTests = async projectId => {
    try {
      const res = await fetch(`${API_BASE_URL}/tests?projectId=${projectId}`);
      if (!res.ok) throw new Error('Failed to fetch tests');
      return await res.json();
    } catch (err) {
      console.error('[Varify] Error fetching tests:', err);
      return [];
    }
  };

  // ▶️ Tracking helpers
  const trackView = (testId, variant) => {
    navigator.sendBeacon(
      `${API_BASE_URL}/view`,
      JSON.stringify({ testId, variant, timestamp: Date.now(), userAgent: navigator.userAgent })
    );
  };
  const trackConversion = async (testId, variant, event) => {
    try {
      await fetch(`${API_BASE_URL}/conversion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId, variant, event, timestamp: Date.now() }),
        keepalive: true
      });
    } catch (error) {
      console.warn('[Varify] Failed to track conversion:', error);
    }
  };

  // ▶️ Apply a single test when ready
  const applyTest = (test, variant) => {
    const selector = test.selector;
    waitForElement(selector, original => {
      const replacementHTML =
        variant === 'A' ? test.variant_a : test.variant_b;
      original.outerHTML = replacementHTML;
      trackView(test.id, variant);
      // Conversion tracking on CTA click
      if (test.goal === 'cta-click') {
        const newEl = document.querySelector(selector);
        if (newEl) {
          newEl.addEventListener('click', () =>
            trackConversion(test.id, variant, 'click')
          );
        }
      }
    });
  };

  // ▶️ Initialize everything
  const initVarify = async () => {
    const projectId = getProjectId();
    if (!projectId) return;

    // ping server
    fetch(`${API_BASE_URL}/ping-script`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId }),
      keepalive: true
    }).catch(() => {});

    const tests = await fetchTests(projectId);
    tests.forEach(test => {
      const variant = assignVariant(test);
      applyTest(test, variant);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVarify);
  } else {
    initVarify();
  }
})();