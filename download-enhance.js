// Enhancement for Download Mode - adds transcribe button
(function() {
  'use strict';

  let videoDownloadUrl = null;
  let videoThumbnailElement = null;

  // Monitor for download results
  function monitorDownloadResults() {
    // Watch for changes in the download options container
    const downloadOptions = document.getElementById('downloadOptions');
    if (!downloadOptions) {
      setTimeout(monitorDownloadResults, 500);
      return;
    }

    // Use MutationObserver to detect when download button is added
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes.length > 0) {
          // Check if a download link was added
          const downloadLink = downloadOptions.querySelector('a[download]');
          if (downloadLink && !downloadOptions.querySelector('.transcribe-video-btn')) {
            videoDownloadUrl = downloadLink.href;
            addTranscribeButton();
          }
        }
      });
    });

    observer.observe(downloadOptions, {
      childList: true,
      subtree: true
    });
  }

  // Add transcribe button to download mode
  function addTranscribeButton() {
    const downloadOptions = document.getElementById('downloadOptions');
    if (!downloadOptions) return;

    // Create transcribe button
    const transcribeBtn = document.createElement('button');
    transcribeBtn.className = 'download-btn transcribe-video-btn';
    transcribeBtn.innerHTML = '<i class="fas fa-closed-captioning"></i> Transcribe This Video';
    transcribeBtn.onclick = handleTranscribeClick;

    // Add the button
    downloadOptions.appendChild(transcribeBtn);
  }

  // Handle transcribe button click in download mode
  async function handleTranscribeClick() {
    if (!videoDownloadUrl) {
      alert('Video URL not available');
      return;
    }

    // Check if API key is configured
    if (!Settings || !Settings.hasApiKey()) {
      alert('Please configure your OpenAI API key in Settings first');
      if (Settings && Settings.openSettings) {
        Settings.openSettings();
      }
      return;
    }

    // Switch to transcribe tab and start transcription there
    if (window.Tabs && window.Tabs.switchToTranscribe) {
      window.Tabs.switchToTranscribe(videoDownloadUrl);
    }
  }

  // Initialize
  function init() {
    monitorDownloadResults();
  }

  // Start monitoring after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
