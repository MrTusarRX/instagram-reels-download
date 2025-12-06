# InstaScribe - Project Handoff Brief

## Project Overview
**InstaScribe** is a web application that downloads and transcribes Instagram Reels using OpenAI's Whisper API. It runs entirely client-side with no backend.

**Live Site**: https://instascribe.siteview.uk/
**Repository**: https://github.com/curious-liberal/instagram-reels-download

---

## Current Branch Structure

```
main (production - deployed to GitHub Pages)
└── feature/whisper-transcription (transcription features)
    └── feature/bulk-transcription (bulk processing - CURRENT BRANCH)
```

---

## Architecture

### Tech Stack
- **Frontend**: Vanilla JavaScript (no frameworks)
- **Styling**: Plain CSS with CSS variables
- **APIs**:
  - OpenAI Whisper API (transcription)
  - api.instasave.website (Instagram video fetching)
- **Libraries**: JSZip (for bulk ZIP downloads)
- **Deployment**: GitHub Pages

### Key Files

| File | Purpose |
|------|---------|
| `index.html` | Main HTML structure with 3 tabs (Download, Transcribe, Bulk) |
| `styles.css` | All styling with CSS variables for theming |
| `settings.js` | API key management (localStorage) |
| `tabs.js` | Tab navigation and state management |
| `whisper.js` | Core transcription logic, Whisper API integration |
| `download-enhance.js` | Adds "Transcribe This Video" button to download mode |
| `bulk.js` | Bulk transcription queue management |
| `flux.js` | Input handlers (paste/clear buttons, URL cleaning) |
| `fetch.js` | Original download functionality (loaded from remote CDN) |

---

## Features Implemented

### ✅ Phase 1: Core Transcription
1. **Settings Management**
   - Modal UI for OpenAI API key storage
   - localStorage persistence
   - Visual indicator in header (configured/not configured)
   - Validation: `sk-*` prefix, 20-200 chars

2. **Download Mode**
   - Downloads Instagram videos via api.instasave.website
   - "Transcribe This Video" button switches to Transcribe tab
   - Video caching (5 min) to avoid re-fetching

3. **Transcribe Mode**
   - Paste Instagram URL → fetches video → sends to Whisper
   - **Sends video directly** (not audio) - Whisper accepts video formats
   - Displays results: language, word count, duration, transcript
   - Copy to clipboard button (floating in top-right corner)
   - Download as TXT or SRT

4. **URL Cleaning**
   - Auto-removes tracking parameters (`?utm_source=...`)
   - Applies to both Download and Transcribe tabs

5. **Tab State Persistence**
   - URL hash-based (`#download`, `#transcribe`, `#bulk`)
   - Stays on selected tab after refresh

### ✅ Phase 2: Bulk Transcription
1. **Bulk Tab**
   - Paste multiple URLs (one per line)
   - Real-time queue display with status:
     - Pending (gray)
     - Processing (blue, animated pulse)
     - Completed (green)
     - Failed (red with error message)
   - Sequential processing (1 sec delay between requests)
   - Download all transcripts as ZIP (TXT + SRT + summary)

---

## Known Issues & Pending Work

### 🐛 Critical Issues

1. **Copy Button Error (Browser Caching)**
   - **Issue**: `TypeError: can't access property "target", event is undefined`
   - **Status**: Fixed in code, but users seeing cached version
   - **Solution**: Code is correct. Users need hard refresh (Ctrl+Shift+R)
   - **Location**: whisper.js:471 - `copyTranscript()` function
   - **Fix Applied**: Removed dependency on `event` object, uses `querySelectorAll` instead

2. **Auto-Transcribe Not Triggering**
   - **Issue**: Clicking "Transcribe This Video" switches tabs but doesn't start transcription
   - **Status**: Retry logic added
   - **Location**: tabs.js:123 - `switchToTranscribe()` function
   - **Debugging**: Check console for "Auto-triggering transcription for:" log

3. **CORS Issues with Thumbnails**
   - **Issue**: Thumbnails from cdn.instasave.website blocked by CORS
   - **Status**: Thumbnails disabled
   - **Potential Fix**: Use CORS proxy service (e.g., https://corsproxy.io/)

### 📋 TODO List

#### High Priority
- [ ] Merge `feature/whisper-transcription` to `main` for GitHub Pages deployment
- [ ] Verify copy button works after cache clear
- [ ] Test auto-transcription trigger on production
- [ ] Add error handling for API rate limits (429 errors)

#### Medium Priority
- [ ] Add thumbnail support via CORS proxy
- [ ] Add progress bar for Whisper API transcription (currently just spinner)
- [ ] Add "Retry Failed" button in bulk mode
- [ ] Optimize video caching strategy (current: 5 min TTL, Map-based)
- [ ] Add keyboard shortcuts (e.g., Ctrl+V to paste in input)

#### Low Priority
- [ ] Add dark mode toggle
- [ ] Add language selection for transcription (currently auto-detect)
- [ ] Add batch size limit for bulk mode (prevent overload)
- [ ] Add export formats: JSON, CSV
- [ ] Add transcription history (localStorage)

---

## Code Architecture Details

### Video Transcription Flow

```
1. User pastes Instagram URL
2. Clean URL (remove ?params)
3. POST to api.instasave.website/media
   - Response can be JSON or HTML (handle both)
4. Extract video download URL from response
5. Check cache (Map: URL -> {blob, timestamp})
6. If not cached, fetch video as blob
7. Send blob directly to Whisper API
   - File extension detected from blob.type
   - FormData with 'file', 'model', 'response_format'
8. Parse response (verbose_json format)
9. Generate SRT from segments
10. Display results with copy/download buttons
```

### API Key Flow

```
Settings Modal -> localStorage -> Settings.getApiKey() -> Whisper API
                              \
                               -> validateApiKey() (format check)
```

### Bulk Processing Flow

```
Parse URLs -> Create Queue -> Process Sequentially
  |            [{id, url,       |
  v            status,          v
Clean URLs    result,      For each item:
              error}]        1. Fetch metadata
                            2. Fetch video
                            3. Transcribe
                            4. Store result
                            5. Update UI
                            6. Wait 1 sec
                            7. Next item
                               |
                               v
                          All Complete
                               |
                               v
                          ZIP Download
```

### File Cache Implementation

```javascript
// In whisper.js
const videoCache = new Map(); // URL -> {blob, timestamp}

// Cache entry format:
{
  blob: Blob,
  timestamp: Date.now()
}

// TTL: 5 minutes
if (cached && (Date.now() - cached.timestamp < 5 * 60 * 1000)) {
  return cached.blob;
}
```

---

## CSS Architecture

### CSS Variables
```css
:root {
  --primary: #405DE6;
  --secondary: #5851DB;
  --accent: #833AB4;
  --gradient: linear-gradient(45deg, var(--primary), var(--accent));
  --text-dark: #262626;
  --text-light: #8e8e8e;
  --bg-light: #fafafa;
  --card-shadow: 0 10px 30px -15px rgba(0, 0, 0, 0.1);
}
```

### Key UI Components

1. **Tabs** - `.tab`, `.tab.active`
2. **Buttons** - `.btn`, `.download-btn`, `.icon-btn`
3. **Messages** - `.success-message`, `.error-message`, `.info-message`
4. **Transcript** - `.transcript-content-wrapper`, `.copy-transcript-btn`
5. **Queue Items** - `.queue-item`, `.status-*`

---

## API Integration Details

### OpenAI Whisper API

**Endpoint**: `https://api.openai.com/v1/audio/transcriptions`

**Request**:
```javascript
const formData = new FormData();
formData.append('file', videoBlob, 'video.mp4'); // or .webm
formData.append('model', 'whisper-1');
formData.append('response_format', 'verbose_json');

fetch(url, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${apiKey}` },
  body: formData
})
```

**Response** (verbose_json):
```json
{
  "text": "Full transcript text...",
  "language": "en",
  "duration": 20.5,
  "segments": [
    {
      "start": 0.0,
      "end": 5.2,
      "text": "Segment text..."
    }
  ]
}
```

**Error Handling**:
- 401: Invalid API key → Clear localStorage
- 413: File too large (>25MB)
- 429: Rate limit → Retry with backoff
- 500/503: Service error

### Instagram API (api.instasave.website)

**Endpoint**: `https://api.instasave.website/media`

**Request**:
```javascript
fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({'url': instagramUrl})
})
```

**Response Types**:
1. **JSON** (preferred):
   ```json
   {
     "download_url": "https://cdn.instasave.website/...",
     "thumbnail": "..."
   }
   ```

2. **HTML** (fallback):
   - Parse with DOMParser
   - Extract from `<a class="abutton is-success">`

---

## Development Workflow

### Local Development
```bash
# Using Bun for hot reload
bun --hot index.html

# Or any local server
python -m http.server 3333
```

### Git Workflow
```bash
# Current state
git branch
# * feature/bulk-transcription

# To merge to transcription feature
git checkout feature/whisper-transcription
git merge feature/bulk-transcription

# To deploy to production
git checkout main
git merge feature/whisper-transcription
git push origin main  # Triggers GitHub Pages deploy
```

### GitHub Pages Settings
- **Source**: Deploy from `main` branch
- **Custom Domain**: instascribe.siteview.uk
- **HTTPS**: Enabled

---

## Testing Checklist

### Manual Testing
- [ ] Download tab: Paste URL → Download works
- [ ] Download tab: Click "Transcribe This Video" → Switches to Transcribe tab
- [ ] Transcribe tab: Auto-starts transcription from download tab
- [ ] Transcribe tab: Paste new URL → Fetches and transcribes
- [ ] Transcribe tab: Copy button → Copies to clipboard
- [ ] Transcribe tab: Download TXT/SRT → Files download correctly
- [ ] Bulk tab: Multiple URLs → Processes sequentially
- [ ] Bulk tab: Download ZIP → Contains all transcripts + summary
- [ ] Settings: Save API key → Persists after refresh
- [ ] URL cleaning: Paste URL with ?params → Auto-removes params
- [ ] Tab state: Refresh on Transcribe tab → Stays on Transcribe tab
- [ ] Mobile responsive: All tabs work on small screens

### Edge Cases
- [ ] Empty API key → Shows error
- [ ] Invalid Instagram URL → Shows error
- [ ] Private/deleted video → Shows error
- [ ] Video >25MB → Shows size error (Whisper limit)
- [ ] No audio in video → Whisper returns empty
- [ ] Network error → Shows retry option
- [ ] Bulk: All URLs fail → Shows error summary
- [ ] Bulk: Partial success → ZIP contains only successful transcripts

---

## Performance Optimizations

1. **Video Caching**: 5-minute cache prevents re-fetching
2. **Lazy Script Loading**: JSZip only loaded once (always loaded now, but could be made conditional)
3. **Sequential Processing**: Prevents API rate limits in bulk mode
4. **Debounced URL Cleaning**: Prevents excessive re-renders

### Potential Optimizations
- Implement service worker for offline support
- Add IndexedDB for persistent caching
- Lazy load bulk.js only when Bulk tab is opened
- Compress transcripts before storing in ZIP

---

## Security Considerations

### Current Implementation
- ✅ API key stored in localStorage (client-side only)
- ✅ API key never logged to console
- ✅ API key only sent to api.openai.com
- ✅ All requests use HTTPS
- ✅ No server-side storage of sensitive data

### Warnings Displayed
- Settings modal shows: "Your API key is stored locally in your browser and only sent to OpenAI."

### Potential Vulnerabilities
- ⚠️ localStorage can be accessed by XSS attacks (no XSS found, but worth noting)
- ⚠️ API key visible in browser DevTools (inherent to client-side apps)
- ⚠️ No rate limiting on client side (relies on OpenAI's rate limits)

---

## Deployment Instructions

### To Deploy Bulk Feature to Production

1. **Merge feature branches**:
   ```bash
   git checkout feature/whisper-transcription
   git merge feature/bulk-transcription
   git push origin feature/whisper-transcription
   ```

2. **Merge to main**:
   ```bash
   git checkout main
   git merge feature/whisper-transcription
   git push origin main
   ```

3. **Verify deployment**:
   - GitHub Pages auto-deploys from `main`
   - Wait 1-2 minutes for build
   - Visit https://instascribe.siteview.uk/
   - Hard refresh (Ctrl+Shift+R) to clear cache

4. **Post-deployment checks**:
   - [ ] All tabs load correctly
   - [ ] API key persists
   - [ ] Transcription works
   - [ ] Bulk mode works
   - [ ] ZIP download works

---

## Contact & Resources

**Repository**: https://github.com/curious-liberal/instagram-reels-download
**Original Plan**: See `~/.claude/plans/gentle-zooming-forest.md`
**Live Site**: https://instascribe.siteview.uk/

### External Dependencies
- OpenAI Whisper API: https://platform.openai.com/docs/guides/speech-to-text
- JSZip: https://stuk.github.io/jszip/
- Font Awesome: https://fontawesome.com/ (CDN)
- api.instasave.website: Instagram video downloader API

---

## Quick Start for New Developer

```bash
# 1. Clone repo
git clone https://github.com/curious-liberal/instagram-reels-download.git
cd instagram-reels-download

# 2. Checkout bulk feature branch
git checkout feature/bulk-transcription

# 3. Start local server
python -m http.server 3333
# or
bun --hot index.html

# 4. Open browser
open http://localhost:3333

# 5. Add API key
# Click settings icon → Enter OpenAI API key → Save

# 6. Test transcription
# Paste Instagram URL in Transcribe tab → Click Transcribe
```

---

## Key Decisions & Rationale

1. **Why send video directly instead of extracting audio?**
   - Whisper API accepts video formats (mp4, webm, etc.)
   - Eliminates need for FFmpeg.wasm (CORS issues, 30MB+ library)
   - Faster and simpler

2. **Why localStorage for API key?**
   - No backend required
   - User preference (confirmed)
   - Persists across sessions

3. **Why sequential processing in bulk mode?**
   - Prevents API rate limiting
   - Better error handling
   - User can track progress per item

4. **Why vanilla JS instead of React/Vue?**
   - Matching existing codebase pattern
   - No build step required
   - Lightweight and fast

5. **Why not use server-side proxy?**
   - User explicitly requested "no backend"
   - Keeps architecture simple
   - User owns their API key

---

## Common Issues & Solutions

### Issue: "API key saved successfully" but still shows "No API Key"
**Cause**: Header icon not updating
**Fix**: Check Settings.updateApiKeyStatus() is being called after save

### Issue: Transcription returns "you you you"
**Cause**: Audio extraction was broken (old implementation)
**Fix**: Now sends video directly - should work

### Issue: Copy button not working
**Cause**: Browser cache serving old whisper.js
**Fix**: Hard refresh or clear cache

### Issue: Bulk mode downloads empty ZIP
**Cause**: No successful transcriptions
**Fix**: Check console for API errors, verify API key

---

## End of Brief

**Last Updated**: 2025-12-06
**Created By**: Claude (Anthropic)
**For**: Codex (continuation)

Good luck! 🚀
