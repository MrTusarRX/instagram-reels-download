  const input = document.getElementById('instagramReelUrl');
  const pasteBtn = document.getElementById('pasteButton');
  const clearBtn = document.getElementById('clearButton');
  input.addEventListener('input', () => {
    clearBtn.classList.toggle('hidden', input.value.trim() === '');
  });

  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      input.value = text;
      input.dispatchEvent(new Event('input'));
    } catch (err) {
      alert('Clipboard access not allowed. Please paste manually.');
    }
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    input.dispatchEvent(new Event('input'));
    input.focus();
  });

const footerDate = document.getElementById('footerDate');

  function updateFooterDate() {
    const now = new Date();
    
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    };
    
    footerDate.textContent = now.toLocaleString('en-US', options);
  }

  updateFooterDate();  
  setInterval(updateFooterDate, 1000);