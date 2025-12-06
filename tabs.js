// Tab navigation for Download, Transcribe, and Bulk modes
(function() {
  'use strict';

  const MODES = {
    DOWNLOAD: 'download',
    TRANSCRIBE: 'transcribe',
    BULK: 'bulk'
  };

  let currentMode = MODES.DOWNLOAD;

  // DOM elements (initialized after DOM loads)
  let downloadTab;
  let transcribeTab;
  let bulkTab;
  let downloadSection;
  let transcribeSection;
  let bulkSection;

  // Initialize tabs when DOM is ready
  function initTabs() {
    // Get tab buttons
    downloadTab = document.getElementById('downloadTab');
    transcribeTab = document.getElementById('transcribeTab');
    bulkTab = document.getElementById('bulkTab');

    // Get sections
    downloadSection = document.getElementById('downloadSection');
    transcribeSection = document.getElementById('transcribeSection');
    bulkSection = document.getElementById('bulkSection');

    // Event listeners
    if (downloadTab) {
      downloadTab.addEventListener('click', function() {
        switchToMode(MODES.DOWNLOAD);
      });
    }

    if (transcribeTab) {
      transcribeTab.addEventListener('click', function() {
        switchToMode(MODES.TRANSCRIBE);
      });
    }

    if (bulkTab) {
      bulkTab.addEventListener('click', function() {
        switchToMode(MODES.BULK);
      });
    }

    // Check URL hash for initial mode
    checkUrlHash();

    // Listen for hash changes
    window.addEventListener('hashchange', checkUrlHash);

    // Initialize with default mode
    switchToMode(currentMode);
  }

  // Switch to a specific mode
  function switchToMode(mode) {
    currentMode = mode;

    // Update active tab
    if (downloadTab) downloadTab.classList.remove('active');
    if (transcribeTab) transcribeTab.classList.remove('active');
    if (bulkTab) bulkTab.classList.remove('active');

    // Show/hide sections
    if (downloadSection) downloadSection.style.display = 'none';
    if (transcribeSection) transcribeSection.style.display = 'none';
    if (bulkSection) bulkSection.style.display = 'none';

    switch (mode) {
      case MODES.DOWNLOAD:
        if (downloadTab) downloadTab.classList.add('active');
        if (downloadSection) downloadSection.style.display = 'block';
        window.location.hash = 'download';
        break;

      case MODES.TRANSCRIBE:
        if (transcribeTab) transcribeTab.classList.add('active');
        if (transcribeSection) transcribeSection.style.display = 'block';
        window.location.hash = 'transcribe';
        break;

      case MODES.BULK:
        if (bulkTab) bulkTab.classList.add('active');
        if (bulkSection) bulkSection.style.display = 'block';
        window.location.hash = 'bulk';
        break;
    }
  }

  // Check URL hash and switch mode accordingly
  function checkUrlHash() {
    const hash = window.location.hash.replace('#', '');
    console.log('Checking URL hash:', hash || '(none)');

    switch (hash) {
      case 'transcribe':
        currentMode = MODES.TRANSCRIBE;
        break;
      case 'bulk':
        currentMode = MODES.BULK;
        break;
      case 'download':
      default:
        currentMode = MODES.DOWNLOAD;
        break;
    }

    console.log('Switching to mode:', currentMode);
    switchToMode(currentMode);
  }

  // Get current mode
  function getCurrentMode() {
    return currentMode;
  }

  // Switch to transcribe tab and start transcription with video URL
  function switchToTranscribe(videoUrl) {
    switchToMode(MODES.TRANSCRIBE);

    // Trigger transcription in transcribe tab
    if (window.WhisperAPI && window.WhisperAPI.transcribeFromVideoUrl) {
      // Small delay to ensure tab is visible
      setTimeout(() => {
        console.log('Auto-triggering transcription for:', videoUrl);
        window.WhisperAPI.transcribeFromVideoUrl(videoUrl);
      }, 100);
    } else {
      console.error('WhisperAPI.transcribeFromVideoUrl not available');
      // Retry after a longer delay in case scripts are still loading
      setTimeout(() => {
        if (window.WhisperAPI && window.WhisperAPI.transcribeFromVideoUrl) {
          console.log('Retrying transcription trigger for:', videoUrl);
          window.WhisperAPI.transcribeFromVideoUrl(videoUrl);
        } else {
          console.error('WhisperAPI still not available after retry');
        }
      }, 500);
    }
  }

  // Public API
  window.Tabs = {
    init: initTabs,
    switchTo: switchToMode,
    switchToTranscribe: switchToTranscribe,
    getCurrentMode: getCurrentMode,
    MODES: MODES
  };

  // Also expose as TabManager for backward compatibility
  window.TabManager = window.Tabs;

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTabs);
  } else {
    initTabs();
  }
})();
