(function () {
  // Configuration
  // FOR LOCAL TESTING ONLY:
  const API_BASE_URL = 'http://varify-sepia.vercel.app/api';
  // REMEMBER TO CHANGE BACK TO YOUR PRODUCTION URL BEFORE DEPLOYING!
  // const API_BASE_URL = 'https://abfast.dev/api'; // Example production URL

  // 🔍 Get project ID from script tag
  const getProjectId = () => {
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      const script = scripts[i];
      const projectId = script.getAttribute('data-project');
      if (projectId && script.src.includes('embed.js')) {
        return projectId;
      }
    }
    console.error('[Varify] data-project attribute not found in embed script.');
    return null;
  };

  // 🎲 Variant helpers
  const getRandomVariant = (split = 50) => Math.random() * 100 < split ? 'A' : 'B';
  const getStoredVariant = (testId) => localStorage.getItem(`varify-${testId}`);
  const storeVariant = (testId, variant) => {
    localStorage.setItem(`varify-${testId}`, variant);
    return variant;
  };

  const assignVariant = (test) => {
    return getStoredVariant(test.id) || storeVariant(test.id, getRandomVariant(test.split));
  };

  // 📡 API requests
  const fetchTests = async (projectId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/tests?projectId=${projectId}`);
      if (!res.ok) throw new Error('Failed to fetch tests');
      return await res.json();
    } catch (err) {
      console.error('[Varify] Error fetching tests:', err);
      return [];
    }
  };

  const trackView = (testId, variant) => {
    navigator.sendBeacon(`${API_BASE_URL}/view`, JSON.stringify({
      testId,
      variant,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    }));
  };

  const trackConversion = async (testId, variant, event) => {
    try {
      await fetch(`${API_BASE_URL}/conversion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testId,
          variant,
          event,
          timestamp: Date.now()
        }),
        keepalive: true // Use beacon if possible
      });
    } catch (error) {
      console.warn('[Varify] Failed to track conversion:', error);
    }
  };

  const pingServer = async (projectId) => {
    try {
      await fetch(`${API_BASE_URL}/ping-script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
        keepalive: true // Use beacon if possible
      });
    } catch (error) {
      console.warn('[Varify] Failed to ping server:', error);
    }
  };

  // 🧪 Apply test to DOM
  const applyTest = (test, variant) => {
    try {
      const element = document.querySelector(test.selector);
      if (!element) {
        console.warn(`[Varify] Element not found for selector: ${test.selector}`);
        return;
      }

      // Apply text content
      element.innerText = variant === 'A' ? test.variant_a : test.variant_b;

      // Track view
      trackView(test.id, variant);

      // Set up conversion tracking
      if (test.goal === 'cta-click') {
        element.addEventListener('click', () => {
          trackConversion(test.id, variant, 'click');
        });
      }

    } catch (err) {
      console.error('[Varify] Error applying test:', err);
    }
  };

  // 🚀 Start the magic
  const initVarify = async () => {
    const projectId = getProjectId();
    if (!projectId) {
      console.error('[Varify] No project ID found. Add data-project attribute to the script tag.');
      return;
    }

    // Send a ping to confirm script loaded
    pingServer(projectId);

    // Fetch active tests for this project
    const tests = await fetchTests(projectId);
    if (!tests.length) return;

    const runTests = () => {
      tests.forEach(test => {
        const variant = assignVariant(test);
        applyTest(test, variant);
      });
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      runTests();
    } else {
      document.addEventListener('DOMContentLoaded', runTests);
    }
  };

  initVarify();
})();
