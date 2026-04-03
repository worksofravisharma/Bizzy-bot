/**
 * Async Widget Loader
 * 
 * Loads the Bizzy Bot widget asynchronously without blocking the host page.
 *
 * Usage:
 * <script src="path/to/widget-loader.js" data-widget-base-url="path/to/widget/" async></script>
 * <lib-bizzy-bot config="..."></lib-bizzy-bot>
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    // Base URL for widget assets (can be overridden via data-widget-base-url attribute)
    baseUrl: '',
    // Scripts to load in order
    scripts: ['runtime.js', 'polyfills.js', 'vendor.js', 'main.js'],
    // CSS to load
    css: 'styles.css',
    // Custom element name
    elementName: 'lib-bizzy-bot',
    // Load timeout (ms)
    timeout: 30000
  };

  // Get base URL from script tag or use default
  function getBaseUrl() {
    // Try multiple methods to find the script tag
    let script = document.currentScript;
    
    // Fallback: find by data attribute or src pattern
    if (!script || !script.src) {
      script = document.querySelector('script[data-widget-base-url]') ||
               Array.from(document.querySelectorAll('script[src*="widget-loader"]')).pop();
    }
    
    if (script && script.getAttribute('data-widget-base-url')) {
      let url = script.getAttribute('data-widget-base-url');
      // Ensure trailing slash
      return url.endsWith('/') ? url : url + '/';
    }
    
    // Try to auto-detect from script src
    if (script && script.src) {
      try {
        const url = new URL(script.src, window.location.href);
        const pathname = url.pathname;
        const lastSlash = pathname.lastIndexOf('/');
        if (lastSlash >= 0) {
          return pathname.substring(0, lastSlash + 1);
        }
      } catch (e) {
        // Fallback for relative URLs
        const lastSlash = script.src.lastIndexOf('/');
        if (lastSlash >= 0) {
          return script.src.substring(0, lastSlash + 1);
        }
      }
    }
    
    return CONFIG.baseUrl || './';
  }

  // Load a script dynamically with optimized loading
  function loadScript(src, options = {}) {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript && existingScript.dataset.loaded === 'true') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.defer = options.defer !== false;
      script.dataset.loaded = 'false';
      
      // Use fetch + eval for better control (optional, falls back to normal loading)
      // For now, use standard async loading which is more compatible
      
      const timeout = setTimeout(() => {
        reject(new Error(`Script load timeout: ${src}`));
      }, options.timeout || CONFIG.timeout);

      script.onload = () => {
        clearTimeout(timeout);
        script.dataset.loaded = 'true';
        // Small delay to ensure script execution completes
        setTimeout(resolve, 0);
      };

      script.onerror = () => {
        clearTimeout(timeout);
        reject(new Error(`Failed to load script: ${src}`));
      };

      // Insert script in order (after last script or in head)
      const lastScript = document.querySelector('script[data-widget-script]');
      if (lastScript && lastScript.nextSibling) {
        lastScript.parentNode.insertBefore(script, lastScript.nextSibling);
      } else {
        document.head.appendChild(script);
      }
      
      script.setAttribute('data-widget-script', 'true');
    });
  }

  // Load CSS dynamically
  function loadCSS(href) {
    return new Promise((resolve, reject) => {
      // Check if CSS is already loaded
      const existingLink = document.querySelector(`link[href="${href}"]`);
      if (existingLink) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.media = 'all';
      
      link.onload = resolve;
      link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
      
      document.head.appendChild(link);
    });
  }

  // Wait for custom element to be defined
  function waitForElement(name, timeout = CONFIG.timeout) {
    return new Promise((resolve, reject) => {
      if (customElements.get(name)) {
        resolve();
        return;
      }

      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (customElements.get(name)) {
          clearInterval(checkInterval);
          resolve();
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error(`Custom element ${name} not defined within timeout`));
        }
      }, 50);
    });
  }

  // Main initialization function
  async function initWidget() {
    try {
      const baseUrl = getBaseUrl();
      
      // Load CSS first (non-blocking, doesn't wait)
      const cssUrl = baseUrl + CONFIG.css;
      loadCSS(cssUrl).catch(err => {
        console.warn('Widget CSS load warning:', err.message);
      });

      // Preload scripts in parallel (browser will cache them)
      // Then load them in sequence for execution
      const scriptPromises = CONFIG.scripts.map(script => {
        const scriptUrl = baseUrl + script;
        // Create link preload for faster loading
        const preload = document.createElement('link');
        preload.rel = 'preload';
        preload.as = 'script';
        preload.href = scriptUrl;
        document.head.appendChild(preload);
        return scriptUrl;
      });

      // Load scripts in sequence (required for Angular)
      for (const scriptUrl of scriptPromises) {
        await loadScript(scriptUrl);
      }

      // Wait for custom element to be registered
      await waitForElement(CONFIG.elementName);

      // Dispatch custom event when widget is ready
      const event = new CustomEvent('widget-ready', {
        detail: { elementName: CONFIG.elementName }
      });
      document.dispatchEvent(event);

      console.log('Bizzy Bot widget loaded successfully');
    } catch (error) {
      console.error('Failed to load Bizzy Bot widget:', error);
      
      // Dispatch error event
      const errorEvent = new CustomEvent('widget-error', {
        detail: { error: error.message }
      });
      document.dispatchEvent(errorEvent);
    }
  }

  // Lazy load using IntersectionObserver (only load when widget is visible)
  function initLazyLoad() {
    let widgetElements = document.querySelectorAll(CONFIG.elementName);
    
    // If no elements found, watch for dynamically inserted ones
    if (widgetElements.length === 0) {
      // Use MutationObserver to watch for dynamically inserted widget elements
      if ('MutationObserver' in window) {
        const mutationObserver = new MutationObserver((mutations) => {
          const newElements = document.querySelectorAll(CONFIG.elementName);
          if (newElements.length > 0) {
            mutationObserver.disconnect();
            startLazyLoading(newElements);
          }
        });
        
        mutationObserver.observe(document.body, {
          childList: true,
          subtree: true
        });
        
        // Also check periodically as fallback
        const checkInterval = setInterval(() => {
          const elements = document.querySelectorAll(CONFIG.elementName);
          if (elements.length > 0) {
            clearInterval(checkInterval);
            mutationObserver.disconnect();
            startLazyLoading(elements);
          }
        }, 500);
        
        // Stop checking after 10 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          mutationObserver.disconnect();
        }, 10000);
      }
      return;
    }

    startLazyLoading(widgetElements);
  }

  function startLazyLoading(elements) {
    // Check if IntersectionObserver is supported
    if ('IntersectionObserver' in window) {
      let hasStartedLoading = false;
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !hasStartedLoading) {
            hasStartedLoading = true;
            observer.disconnect();
            // Use requestIdleCallback if available, otherwise setTimeout
            if ('requestIdleCallback' in window) {
              requestIdleCallback(initWidget, { timeout: 2000 });
            } else {
              setTimeout(initWidget, 0);
            }
          }
        });
      }, {
        rootMargin: '50px' // Start loading 50px before widget is visible
      });

      elements.forEach(el => observer.observe(el));
    } else {
      // Fallback for browsers without IntersectionObserver
      // Use requestIdleCallback or defer to next tick
      if ('requestIdleCallback' in window) {
        requestIdleCallback(initWidget, { timeout: 2000 });
      } else {
        setTimeout(initWidget, 100);
      }
    }
  }

  // Get loading strategy from script attribute
  function getLoadingStrategy() {
    const script = document.currentScript || 
                   document.querySelector('script[data-widget-base-url]') ||
                   document.querySelector('script[src*="widget-loader"]');
    
    if (script) {
      const strategy = script.getAttribute('data-loading-strategy');
      return strategy || 'lazy'; // Default to lazy
    }
    return 'lazy';
  }

  // Initialize based on strategy
  const strategy = getLoadingStrategy();
  
  if (strategy === 'eager') {
    // Eager loading: load immediately but non-blocking
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(initWidget, { timeout: 1000 });
        } else {
          setTimeout(initWidget, 0);
        }
      });
    } else {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(initWidget, { timeout: 1000 });
      } else {
        setTimeout(initWidget, 0);
      }
    }
  } else {
    // Lazy loading: only load when widget is visible (default)
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initLazyLoad);
    } else {
      initLazyLoad();
    }
  }

  // Export for manual initialization if needed
  window.WidgetLoader = {
    init: initWidget,
    loadScript: loadScript,
    loadCSS: loadCSS
  };
})();
