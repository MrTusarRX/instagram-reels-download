// Bulk Transcription Module
(function() {
  'use strict';

  // Queue state
  let processingQueue = [];
  let currentIndex = 0;
  let isProcessing = false;
  let completedTranscripts = [];

  // DOM elements
  let bulkUrlsInput;
  let processBulkButton;
  let clearBulkButton;
  let bulkQueueSection;
  let bulkQueue;
  let bulkDownloadSection;
  let downloadAllButton;
  let bulkResponse;

  // Initialize bulk module
  function init() {
    bulkUrlsInput = document.getElementById('bulkUrlsInput');
    processBulkButton = document.getElementById('processBulkButton');
    clearBulkButton = document.getElementById('clearBulkButton');
    bulkQueueSection = document.getElementById('bulkQueueSection');
    bulkQueue = document.getElementById('bulkQueue');
    bulkDownloadSection = document.getElementById('bulkDownloadSection');
    downloadAllButton = document.getElementById('downloadAllButton');
    bulkResponse = document.getElementById('bulkResponse');

    // Event listeners
    if (processBulkButton) {
      processBulkButton.addEventListener('click', handleProcessBulk);
    }

    if (clearBulkButton) {
      clearBulkButton.addEventListener('click', handleClear);
    }

    if (downloadAllButton) {
      downloadAllButton.addEventListener('click', handleDownloadAll);
    }

    // URL cleaning on input
    if (bulkUrlsInput) {
      bulkUrlsInput.addEventListener('input', () => {
        const lines = bulkUrlsInput.value.split('\n');
        const cleaned = lines.map(line => {
          const trimmed = line.trim();
          return trimmed ? trimmed.split('?')[0] : trimmed;
        }).join('\n');

        if (cleaned !== bulkUrlsInput.value) {
          bulkUrlsInput.value = cleaned;
        }
      });
    }
  }

  // Handle process bulk button click
  async function handleProcessBulk() {
    if (!bulkUrlsInput) return;

    const urls = bulkUrlsInput.value
      .split('\n')
      .map(url => url.trim())
      .filter(url => url && url.includes('instagram.com'));

    if (urls.length === 0) {
      showMessage('error', 'Please enter at least one valid Instagram URL');
      return;
    }

    // Check API key
    if (!Settings || !Settings.hasApiKey()) {
      showMessage('error', 'Please configure your OpenAI API key in Settings first');
      if (Settings && Settings.openSettings) {
        Settings.openSettings();
      }
      return;
    }

    // Initialize queue
    processingQueue = urls.map((url, index) => ({
      id: index,
      url: url,
      status: 'pending', // pending, processing, completed, failed
      result: null,
      error: null
    }));

    currentIndex = 0;
    completedTranscripts = [];

    // Show queue
    renderQueue();
    bulkQueueSection.style.display = 'block';
    bulkDownloadSection.style.display = 'none';

    // Start processing
    isProcessing = true;
    processBulkButton.disabled = true;
    processNextInQueue();
  }

  // Process next item in queue
  async function processNextInQueue() {
    if (currentIndex >= processingQueue.length) {
      // All done
      isProcessing = false;
      processBulkButton.disabled = false;
      showMessage('success', `Completed ${completedTranscripts.length} of ${processingQueue.length} transcriptions`);

      if (completedTranscripts.length > 0) {
        bulkDownloadSection.style.display = 'block';
      }
      return;
    }

    const item = processingQueue[currentIndex];
    item.status = 'processing';
    renderQueue();

    try {
      // Fetch video metadata
      const response = await fetch('https://api.instasave.website/media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({'url': item.url})
      });

      if (!response.ok) {
        throw new Error('Failed to fetch video information');
      }

      const responseText = await response.text();
      let videoUrl;

      // Parse response (JSON or HTML)
      try {
        const data = JSON.parse(responseText);
        videoUrl = data.download_url;
      } catch (e) {
        // Parse HTML response
        const cleanedHtml = responseText
          .replace(/loader\.style\.display="none";/, '')
          .replace(/document\.getElementById\("div_download"\)\.innerHTML ="/, '')
          .replace(/";document\.getElementById\("downloader"\)\.remove\(\);showAd\(\);/, '')
          .replace(/\\/g, '');

        const parser = new DOMParser();
        const doc = parser.parseFromString(cleanedHtml, 'text/html');
        const downloadLink = doc.querySelector('a.abutton.is-success');
        videoUrl = downloadLink?.getAttribute('href');
      }

      if (!videoUrl) {
        throw new Error('Could not get video download URL');
      }

      // Fetch video
      const videoResponse = await fetch(videoUrl);
      if (!videoResponse.ok) {
        throw new Error('Failed to fetch video');
      }
      const videoBlob = await videoResponse.blob();

      // Transcribe
      const apiKey = Settings.getApiKey();
      const result = await WhisperAPI.transcribeAudio(videoBlob, apiKey);

      // Generate SRT
      const srtContent = WhisperAPI.generateSRT(result.segments || []);

      // Store result
      item.status = 'completed';
      item.result = {
        text: result.text,
        srt: srtContent,
        url: item.url,
        filename: `transcript_${currentIndex + 1}`
      };

      completedTranscripts.push(item.result);

    } catch (error) {
      console.error('Transcription error:', error);
      item.status = 'failed';
      item.error = error.message;
    }

    renderQueue();
    currentIndex++;

    // Small delay between requests to avoid rate limiting
    setTimeout(() => {
      processNextInQueue();
    }, 1000);
  }

  // Render queue display
  function renderQueue() {
    if (!bulkQueue) return;

    const html = processingQueue.map((item, index) => {
      let statusIcon, statusClass, statusText;

      switch (item.status) {
        case 'pending':
          statusIcon = 'fa-clock';
          statusClass = 'status-pending';
          statusText = 'Pending';
          break;
        case 'processing':
          statusIcon = 'fa-spinner fa-spin';
          statusClass = 'status-processing';
          statusText = 'Processing...';
          break;
        case 'completed':
          statusIcon = 'fa-check-circle';
          statusClass = 'status-completed';
          statusText = 'Completed';
          break;
        case 'failed':
          statusIcon = 'fa-times-circle';
          statusClass = 'status-failed';
          statusText = `Failed: ${item.error}`;
          break;
      }

      return `
        <div class="queue-item ${statusClass}">
          <div class="queue-item-number">${index + 1}</div>
          <div class="queue-item-url">${item.url}</div>
          <div class="queue-item-status">
            <i class="fas ${statusIcon}"></i> ${statusText}
          </div>
        </div>
      `;
    }).join('');

    bulkQueue.innerHTML = html;
  }

  // Handle download all button
  async function handleDownloadAll() {
    if (completedTranscripts.length === 0) return;

    try {
      const zip = new JSZip();

      // Add all transcripts to ZIP
      completedTranscripts.forEach((transcript, index) => {
        zip.file(`${transcript.filename}.txt`, transcript.text);
        zip.file(`${transcript.filename}.srt`, transcript.srt);
      });

      // Create summary file
      const summary = completedTranscripts.map((t, i) =>
        `${i + 1}. ${t.url}\n   Filename: ${t.filename}`
      ).join('\n\n');
      zip.file('_summary.txt', summary);

      // Generate ZIP
      showMessage('info', 'Generating ZIP file...');
      const blob = await zip.generateAsync({ type: 'blob' });

      // Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `instagram_transcripts_${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      showMessage('success', 'ZIP file downloaded successfully!');

    } catch (error) {
      console.error('ZIP generation error:', error);
      showMessage('error', 'Failed to generate ZIP file');
    }
  }

  // Handle clear button
  function handleClear() {
    if (bulkUrlsInput) {
      bulkUrlsInput.value = '';
    }

    processingQueue = [];
    currentIndex = 0;
    completedTranscripts = [];
    isProcessing = false;

    if (bulkQueueSection) {
      bulkQueueSection.style.display = 'none';
    }

    if (bulkResponse) {
      bulkResponse.innerHTML = '';
    }

    processBulkButton.disabled = false;
  }

  // Show message
  function showMessage(type, message) {
    if (!bulkResponse) return;

    const className = type === 'error' ? 'error-message' :
                     type === 'success' ? 'success-message' : 'info-message';
    bulkResponse.innerHTML = `<div class="${className}">${message}</div>`;
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
