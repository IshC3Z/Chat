/**
 * iMessage Mock Generator & Exporter
 * Supports 16:9 Green Screen Video Recording (1080p @ 60 FPS),
 * Transparent PNG Archive Export, and Dynamic Theme Colors (Blue / Purple)
 */

// ==========================================================================
// 1. State Management & DOM Elements
// ==========================================================================

// Color Constants
const COLOR_BLUE = '#007aff';
const COLOR_BLUE_HOVER = '#0066d6';
const COLOR_PURPLE = '#af52de';
const COLOR_PURPLE_HOVER = '#9935cc';
const CHROMA_GREEN = '#00B140';

// Active sender color state (default: blue)
let currentSenderColor = COLOR_BLUE;

// Studio Customizer State
let currentRatio = '16:9'; // '16:9' | '9:16' | '1:1'
let currentBgType = 'green'; // 'green' | 'blue' | 'black' | 'dark' | 'white'
let currentBgColor = CHROMA_GREEN;
let currentWidthPreset = 'narrow'; // 'narrow' (740px) | 'standard' (1060px) | 'wide' (1300px)
let currentVAlign = 'top'; // 'top' | 'center' | 'bottom'
let currentPacing = 'cinematic'; // 'fast' | 'cinematic' | 'slow'
let isBounceEnabled = true;
let isSoundEnabled = true;
let isShadowEnabled = true;
let customBackdropDataUrl = null;
let isBackdropVisible = false;

// Array to store all message objects: { type: 'sender' | 'receiver', text: string, color: string, timestamp: Date }
const messages = [];

// DOM Element References
const stageFrame = document.getElementById('stageFrame');
const stageBackdrop = document.getElementById('stageBackdrop');
const displayContainer = document.getElementById('displayContainer');
const emptyStateNotice = document.getElementById('emptyStateNotice');

const senderInput = document.getElementById('senderInput');
const receiverInput = document.getElementById('receiverInput');
const sendSenderBtn = document.getElementById('sendSenderBtn');
const sendReceiverBtn = document.getElementById('sendReceiverBtn');
const senderCharCount = document.getElementById('senderCharCount');
const receiverCharCount = document.getElementById('receiverCharCount');

// Color picker buttons
const colorBlueBtn = document.getElementById('colorBlueBtn');
const colorPurpleBtn = document.getElementById('colorPurpleBtn');

// Stage background preview toggle button
const toggleBgBtn = document.getElementById('toggleBgBtn');
const bgIndicator = document.getElementById('bgIndicator');
const bgToggleText = document.getElementById('bgToggleText');
const ratioBadgeText = document.getElementById('ratioBadgeText');

// Studio Customizer Controls (Under Export Buttons)
const ratioOptions = document.getElementById('ratioOptions');
const bgOptions = document.getElementById('bgOptions');
const widthOptions = document.getElementById('widthOptions');
const valignOptions = document.getElementById('valignOptions');
const pacingOptions = document.getElementById('pacingOptions');
const toggleBounceBtn = document.getElementById('toggleBounceBtn');
const bounceStatusText = document.getElementById('bounceStatusText');
const toggleSoundBtn = document.getElementById('toggleSoundBtn');
const soundStatusText = document.getElementById('soundStatusText');
const toggleShadowBtn = document.getElementById('toggleShadowBtn');
const shadowStatusText = document.getElementById('shadowStatusText');
const uploadBackdropBtn = document.getElementById('uploadBackdropBtn');
const backdropFileInput = document.getElementById('backdropFileInput');
const backdropBtnTitle = document.getElementById('backdropBtnTitle');
const backdropStatusText = document.getElementById('backdropStatusText');

// Export PNG button elements
const downloadChatBtn = document.getElementById('downloadChatBtn');
const downloadSpinner = document.getElementById('downloadSpinner');
const downloadIcon = document.getElementById('downloadIcon');
const downloadBtnText = document.getElementById('downloadBtnText');

// Record Video button elements
const recordVideoBtn = document.getElementById('recordVideoBtn');
const recordSpinner = document.getElementById('recordSpinner');
const recordIcon = document.getElementById('recordIcon');
const recordBtnText = document.getElementById('recordBtnText');
const videoRecordingCanvas = document.getElementById('videoRecordingCanvas');

const loadSampleBtn = document.getElementById('loadSampleBtn');
const clearChatBtn = document.getElementById('clearChatBtn');

// Dark / Light Theme Toggle Elements
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeMoonIcon = document.getElementById('themeMoonIcon');
const themeSunIcon = document.getElementById('themeSunIcon');
const themeToggleText = document.getElementById('themeToggleText');

// Flag to track ongoing export or recording process
let isExporting = false;

// ==========================================================================
// 2. Theme Management & Audio Synthesis
// ==========================================================================

/**
 * Switches between Dark Mode (Default) and Light Mode
 * @param {'dark' | 'light'} mode 
 */
function setAppTheme(mode) {
  const isDark = mode === 'dark';
  document.body.classList.toggle('dark-mode', isDark);

  if (themeMoonIcon && themeSunIcon && themeToggleText) {
    if (isDark) {
      themeMoonIcon.classList.add('hidden');
      themeSunIcon.classList.remove('hidden');
      themeToggleText.textContent = 'Light Mode';
      if (themeToggleBtn) themeToggleBtn.setAttribute('title', 'Switch to Light Mode');
    } else {
      themeSunIcon.classList.add('hidden');
      themeMoonIcon.classList.remove('hidden');
      themeToggleText.textContent = 'Dark Mode';
      if (themeToggleBtn) themeToggleBtn.setAttribute('title', 'Switch to Dark Mode');
    }
  }

  try {
    localStorage.setItem('chatgame_theme', mode);
  } catch (e) {}
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const isCurrentlyDark = document.body.classList.contains('dark-mode');
    setAppTheme(isCurrentlyDark ? 'light' : 'dark');
  });
}

/**
 * Synthesizes authentic Apple iMessage sound effects (Sender whoosh/pop & Receiver glass ding)
 * Connected to live audio output and optional MediaStreamDestination for video recording.
 * @param {'sender' | 'receiver'} type 
 * @param {AudioNode | null} audioDestination Optional MediaStreamDestination node
 */
function playPopSound(type, audioDestination = null) {
  if (!isSoundEnabled) return;
  try {
    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtxClass) return;
    const ctx = (audioDestination && audioDestination.context) ? audioDestination.context : new AudioCtxClass();

    if (type === 'sender') {
      // Apple Sender "Swoosh Pop"
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(860, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.16);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      osc.connect(gain);
      if (audioDestination) gain.connect(audioDestination);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.24);
    } else {
      // Apple Receiver "Glass Bell Ding" (harmonic dual tone)
      const now = ctx.currentTime;
      [784, 1175].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const vol = idx === 0 ? 0.3 : 0.18;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

        osc.connect(gain);
        if (audioDestination) gain.connect(audioDestination);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.4);
      });
    }
  } catch (e) {
    console.warn('Audio sound error:', e);
  }
}

/**
 * Updates message counter badge and empty state visibility
 */
function updateUIState() {
  const count = messages.length;
  
  if (downloadBtnText && !isExporting) {
    downloadBtnText.innerHTML = `Export PNGs (<span id="messageCountBadge">${count}</span>)`;
  }
  if (recordBtnText && !isExporting) {
    recordBtnText.textContent = `Download ${currentRatio} Video`;
  }
  
  if (emptyStateNotice) {
    if (count > 0) {
      emptyStateNotice.classList.add('hidden');
    } else {
      emptyStateNotice.classList.remove('hidden');
    }
  }

  // Update button enabled state if not currently exporting
  if (!isExporting) {
    if (downloadChatBtn) downloadChatBtn.disabled = (count === 0);
    if (recordVideoBtn) recordVideoBtn.disabled = (count === 0);
  }
}

/**
 * Switches the sender bubble theme color between Blue and Purple.
 * Updates all existing and future sender message bubbles.
 * @param {'blue' | 'purple'} colorName 
 */
function setSenderTheme(colorName) {
  const isPurple = colorName === 'purple';
  currentSenderColor = isPurple ? COLOR_PURPLE : COLOR_BLUE;
  const hoverColor = isPurple ? COLOR_PURPLE_HOVER : COLOR_BLUE_HOVER;

  document.documentElement.style.setProperty('--sender-color', currentSenderColor);
  document.documentElement.style.setProperty('--sender-color-hover', hoverColor);

  if (colorBlueBtn && colorPurpleBtn) {
    colorBlueBtn.classList.toggle('active', !isPurple);
    colorPurpleBtn.classList.toggle('active', isPurple);
  }

  const senderMessageDivs = displayContainer.querySelectorAll('.message.sender');
  senderMessageDivs.forEach(div => {
    div.style.backgroundColor = currentSenderColor;
  });

  messages.forEach(msg => {
    if (msg.type === 'sender') {
      msg.color = currentSenderColor;
    }
  });
}

/**
 * Appends a message to the display container and updates the internal state array
 * @param {'sender' | 'receiver'} type 
 * @param {string} rawText 
 * @returns {boolean} Success status
 */
function appendMessage(type, rawText) {
  const text = rawText.trim();
  if (!text) {
    return false; // Prevent empty submissions
  }

  const assignedColor = type === 'sender' ? currentSenderColor : '#e5e5ea';

  const messageObj = {
    type,
    text,
    color: assignedColor,
    timestamp: new Date()
  };
  messages.push(messageObj);

  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', type);
  messageDiv.textContent = text;
  
  if (type === 'sender') {
    messageDiv.style.backgroundColor = currentSenderColor;
  }

  displayContainer.appendChild(messageDiv);
  displayContainer.scrollTop = displayContainer.scrollHeight;

  if (isSoundEnabled) {
    playPopSound(type);
  }

  updateUIState();
  return true;
}

/**
 * Controls form controls interactive state during export or recording
 * @param {boolean} disabled 
 * @param {'png' | 'video' | null} activeProcess
 */
function setControlsDisabled(disabled, activeProcess = null) {
  isExporting = disabled;
  senderInput.disabled = disabled;
  receiverInput.disabled = disabled;
  sendSenderBtn.disabled = disabled;
  sendReceiverBtn.disabled = disabled;
  downloadChatBtn.disabled = disabled;
  recordVideoBtn.disabled = disabled;
  if (colorBlueBtn) colorBlueBtn.disabled = disabled;
  if (colorPurpleBtn) colorPurpleBtn.disabled = disabled;
  if (toggleBgBtn) toggleBgBtn.disabled = disabled;
  if (loadSampleBtn) loadSampleBtn.disabled = disabled;
  if (clearChatBtn) clearChatBtn.disabled = disabled;

  if (disabled) {
    if (activeProcess === 'png') {
      if (downloadSpinner) downloadSpinner.classList.remove('hidden');
      if (downloadIcon) downloadIcon.classList.add('hidden');
    } else if (activeProcess === 'video') {
      if (recordSpinner) recordSpinner.classList.remove('hidden');
      if (recordIcon) recordIcon.classList.add('hidden');
    }
  } else {
    if (downloadSpinner) downloadSpinner.classList.add('hidden');
    if (downloadIcon) downloadIcon.classList.remove('hidden');
    if (recordSpinner) recordSpinner.classList.add('hidden');
    if (recordIcon) recordIcon.classList.remove('hidden');
  }
}

/**
 * Robust cross-browser blob file downloader
 * @param {Blob} blob 
 * @param {string} filename 
 */
function downloadBlob(blob, filename) {
  // If FileSaver library is available and succeeds, do not run anchor fallback
  if (typeof window.saveAs === 'function') {
    try {
      window.saveAs(blob, filename);
      return true;
    } catch (e) {
      console.warn('saveAs threw error, utilizing anchor fallback:', e);
    }
  }

  // Anchor click fallback (only if saveAs wasn't used or failed)
  try {
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      window.URL.revokeObjectURL(blobUrl);
    }, 2000);
    return true;
  } catch (err) {
    console.error('Anchor fallback failed:', err);
    return false;
  }
}

// ==========================================================================
// 3. Event Listeners for Color Switching, Typing & Sending
// ==========================================================================

// Color switcher: Blue button
if (colorBlueBtn) {
  colorBlueBtn.addEventListener('click', () => {
    if (isExporting) return;
    setSenderTheme('blue');
  });
}

// Color switcher: Purple button
if (colorPurpleBtn) {
  colorPurpleBtn.addEventListener('click', () => {
    if (isExporting) return;
    setSenderTheme('purple');
  });
}

// Studio Aspect Ratio Selector (16:9, 9:16, 1:1)
function setStudioRatio(ratio) {
  if (isExporting) return;
  currentRatio = ratio;
  
  if (ratioOptions) {
    ratioOptions.querySelectorAll('.studio-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.ratio === ratio);
    });
  }

  stageFrame.classList.remove('ratio-16-9', 'ratio-9-16', 'ratio-1-1');
  stageFrame.classList.add(`ratio-${ratio.replace(':', '-')}`);

  if (ratioBadgeText) {
    if (ratio === '16:9') ratioBadgeText.textContent = '16:9 Widescreen (1080p 60FPS)';
    else if (ratio === '9:16') ratioBadgeText.textContent = '9:16 Shorts/Reels (1080p 60FPS)';
    else ratioBadgeText.textContent = '1:1 Square (1080p 60FPS)';
  }

  updateUIState();
}

if (ratioOptions) {
  ratioOptions.querySelectorAll('.studio-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      setStudioRatio(btn.dataset.ratio);
    });
  });
}

// Studio Background Selector (Green, Blue, Black, Dark, White)
function setStudioBackground(bgType, color) {
  if (isExporting) return;
  currentBgType = bgType;
  currentBgColor = color;

  if (bgOptions) {
    bgOptions.querySelectorAll('.studio-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.bg === bgType);
    });
  }

  stageFrame.classList.remove('bg-green', 'bg-blue', 'bg-black', 'bg-dark', 'bg-white');
  stageFrame.classList.add(`bg-${bgType}`);

  if (bgIndicator && bgToggleText) {
    if (bgType === 'green') {
      bgIndicator.className = 'bg-indicator green';
      bgToggleText.textContent = 'Chroma Green (#00B140)';
    } else if (bgType === 'blue') {
      bgIndicator.className = 'bg-indicator blue';
      bgToggleText.textContent = 'Chroma Blue (#0047BB)';
    } else if (bgType === 'black') {
      bgIndicator.className = 'bg-indicator black';
      bgToggleText.textContent = 'Pure Black (Screen Blend)';
    } else if (bgType === 'dark') {
      bgIndicator.className = 'bg-indicator dark';
      bgToggleText.textContent = 'Dark Mode';
    } else {
      bgIndicator.className = 'bg-indicator white';
      bgToggleText.textContent = 'Clean White';
    }
  }
}

if (bgOptions) {
  bgOptions.querySelectorAll('.studio-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      setStudioBackground(btn.dataset.bg, btn.dataset.color);
    });
  });
}

// Studio Framing Width Selector (Narrow / Split-Screen, Standard, Wide)
function setStudioWidth(preset) {
  if (isExporting) return;
  currentWidthPreset = preset;

  if (widthOptions) {
    widthOptions.querySelectorAll('.studio-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.width === preset);
    });
  }

  stageFrame.classList.remove('width-narrow', 'width-standard', 'width-wide');
  stageFrame.classList.add(`width-${preset}`);
}

if (widthOptions) {
  widthOptions.querySelectorAll('.studio-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      setStudioWidth(btn.dataset.width);
    });
  });
}

// Studio Vertical Placement Selector (Upper Third, Center, Lower Third)
function setStudioVAlign(valign) {
  if (isExporting) return;
  currentVAlign = valign;

  if (valignOptions) {
    valignOptions.querySelectorAll('.studio-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.valign === valign);
    });
  }

  stageFrame.classList.remove('valign-top', 'valign-center', 'valign-bottom');
  stageFrame.classList.add(`valign-${valign}`);
}

if (valignOptions) {
  valignOptions.querySelectorAll('.studio-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      setStudioVAlign(btn.dataset.valign);
    });
  });
}

// Studio Animation Pacing Selector (Fast, Cinematic, Slow)
function setStudioPacing(pacing) {
  if (isExporting) return;
  currentPacing = pacing;

  if (pacingOptions) {
    pacingOptions.querySelectorAll('.studio-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.pacing === pacing);
    });
  }
}

if (pacingOptions) {
  pacingOptions.querySelectorAll('.studio-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      setStudioPacing(btn.dataset.pacing);
    });
  });
}

// Studio Toggle: Bouncy Apple Spring Animation
if (toggleBounceBtn) {
  toggleBounceBtn.addEventListener('click', () => {
    isBounceEnabled = !isBounceEnabled;
    toggleBounceBtn.classList.toggle('active', isBounceEnabled);
    if (bounceStatusText) {
      bounceStatusText.textContent = isBounceEnabled ? 'Active' : 'Off';
    }
  });
}

// Studio Toggle: iMessage Audio Sound Effects
if (toggleSoundBtn) {
  toggleSoundBtn.addEventListener('click', () => {
    isSoundEnabled = !isSoundEnabled;
    toggleSoundBtn.classList.toggle('active', isSoundEnabled);
    if (soundStatusText) {
      soundStatusText.textContent = isSoundEnabled ? 'Active' : 'Off';
    }
    if (isSoundEnabled) {
      playPopSound('sender'); // subtle confirmation chime
    }
  });
}

// Studio Toggle: Cinematic Drop Shadow for Floating Bubbles
if (toggleShadowBtn) {
  toggleShadowBtn.addEventListener('click', () => {
    isShadowEnabled = !isShadowEnabled;
    toggleShadowBtn.classList.toggle('active', isShadowEnabled);
    if (shadowStatusText) {
      shadowStatusText.textContent = isShadowEnabled ? 'Active' : 'Off';
    }
    stageFrame.classList.toggle('has-shadow', isShadowEnabled);
  });
}

// Studio Scene Backdrop Reference Matcher (Upload Screenshot of Footage)
if (uploadBackdropBtn && backdropFileInput) {
  uploadBackdropBtn.addEventListener('click', () => {
    if (!customBackdropDataUrl) {
      backdropFileInput.click();
    } else {
      // Toggle visibility if already uploaded
      isBackdropVisible = !isBackdropVisible;
      if (stageBackdrop) {
        stageBackdrop.classList.toggle('active', isBackdropVisible);
      }
      uploadBackdropBtn.classList.toggle('active', isBackdropVisible);
      if (backdropStatusText) {
        backdropStatusText.textContent = isBackdropVisible ? 'Showing' : 'Hidden';
      }
      if (backdropBtnTitle) {
        backdropBtnTitle.textContent = isBackdropVisible ? 'Hide Scene Still' : 'Show Scene Still';
      }
    }
  });

  backdropFileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      customBackdropDataUrl = event.target.result;
      isBackdropVisible = true;
      if (stageBackdrop) {
        stageBackdrop.style.backgroundImage = `url("${customBackdropDataUrl}")`;
        stageBackdrop.classList.add('active');
      }
      uploadBackdropBtn.classList.add('active');
      if (backdropStatusText) {
        backdropStatusText.textContent = 'Showing';
      }
      if (backdropBtnTitle) {
        backdropBtnTitle.textContent = 'Hide Scene Still';
      }
    };
    reader.readAsDataURL(file);
  });
}

// Stage background preview toggle button in top bar
if (toggleBgBtn) {
  toggleBgBtn.addEventListener('click', () => {
    let nextBg = 'white';
    let nextColor = '#ffffff';
    if (currentBgType === 'green') {
      nextBg = 'black';
      nextColor = '#000000';
    } else if (currentBgType === 'black') {
      nextBg = 'white';
      nextColor = '#ffffff';
    } else {
      nextBg = 'green';
      nextColor = CHROMA_GREEN;
    }
    setStudioBackground(nextBg, nextColor);
  });
}

// Handle Sender Send button
sendSenderBtn.addEventListener('click', () => {
  if (isExporting) return;
  const success = appendMessage('sender', senderInput.value);
  if (success) {
    senderInput.value = '';
    senderCharCount.textContent = '0 chars';
    senderInput.focus();
  }
});

// Handle Receiver Send button
sendReceiverBtn.addEventListener('click', () => {
  if (isExporting) return;
  const success = appendMessage('receiver', receiverInput.value);
  if (success) {
    receiverInput.value = '';
    receiverCharCount.textContent = '0 chars';
    receiverInput.focus();
  }
});

// Real-time character count
senderInput.addEventListener('input', () => {
  senderCharCount.textContent = `${senderInput.value.length} chars`;
});

receiverInput.addEventListener('input', () => {
  receiverCharCount.textContent = `${receiverInput.value.length} chars`;
});

// Enter key sends, Shift+Enter creates a new line
senderInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendSenderBtn.click();
  }
});

receiverInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendReceiverBtn.click();
  }
});

// Clear Chat button (Instant, reliable clear)
clearChatBtn.addEventListener('click', () => {
  if (isExporting) return;
  messages.length = 0;
  const messageElements = displayContainer.querySelectorAll('.message, .typing-bubble');
  messageElements.forEach(el => el.remove());
  updateUIState();
});

// Load Demo Conversation button
loadSampleBtn.addEventListener('click', () => {
  if (isExporting) return;
  messages.length = 0;
  displayContainer.querySelectorAll('.message, .typing-bubble').forEach(el => el.remove());

  const sampleData = [
    { type: 'receiver', text: 'Hey Alex! Are we still meeting for lunch today?' },
    { type: 'sender', text: 'Hey! Yes, definitely. How about that new Italian place on 5th?' },
    { type: 'receiver', text: 'Sounds delicious! Around 12:30 PM?' },
    { type: 'sender', text: 'Perfect. See you there! 🍕' }
  ];

  sampleData.forEach(item => {
    appendMessage(item.type, item.text);
  });
});

// ==========================================================================
// 4. Advanced Export Functionality: Transparent PNGs in ZIP Archive
// ==========================================================================

/**
 * Downloads all rendered message bubbles as individual sequentially numbered
 * PNG images with 100% transparent backgrounds inside a ZIP archive.
 */
downloadChatBtn.addEventListener('click', async () => {
  const messageElements = displayContainer.querySelectorAll('.message');

  if (messageElements.length === 0) {
    alert('Please add at least one message before exporting.');
    return;
  }

  setControlsDisabled(true, 'png');

  try {
    const zip = new JSZip();

    for (let i = 0; i < messageElements.length; i++) {
      const messageDiv = messageElements[i];
      const isSender = messageDiv.classList.contains('sender');
      const typeLabel = isSender ? 'sender' : 'receiver';

      downloadBtnText.textContent = `Exporting ${i + 1}/${messageElements.length}...`;

      // Pass individual message div to html2canvas with transparent background
      const canvas = await html2canvas(messageDiv, {
        backgroundColor: null, // 100% Transparent background!
        scale: 2,             // 2x Retina crispness
        useCORS: true,
        logging: false
      });

      const pngDataUrl = canvas.toDataURL('image/png');
      const base64Data = pngDataUrl.replace(/^data:image\/png;base64,/, '');

      const seqIndex = String(i + 1).padStart(2, '0');
      const filename = `${seqIndex}_${typeLabel}.png`;

      zip.file(filename, base64Data, { base64: true });
    }

    downloadBtnText.textContent = 'Generating ZIP...';
    const zipContentBlob = await zip.generateAsync({ type: 'blob' });

    downloadBlob(zipContentBlob, 'imessage_export.zip');

    downloadBtnText.textContent = 'Saved! ✓';
    await new Promise(resolve => setTimeout(resolve, 800));

  } catch (error) {
    console.error('Error generating chat export:', error);
    alert('An error occurred during export: ' + (error.message || error));
  } finally {
    setControlsDisabled(false);
    updateUIState();
  }
});

// ==========================================================================
// 5. 16:9 Green Screen Video Recording (1080p @ 60 FPS Master Quality)
// ==========================================================================

/**
 * Helper to split text into wrapped lines for Canvas rendering
 */
function wrapCanvasText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? currentLine + ' ' + word : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Detects the best supported video MIME type in current browser
 */
function getBestVideoMime() {
  const candidates = [
    'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
    'video/mp4; codecs="avc1.640028"',
    'video/mp4; codecs=avc1',
    'video/mp4',
    'video/webm; codecs=h264',
    'video/webm; codecs=vp9',
    'video/webm; codecs=vp8',
    'video/webm'
  ];
  for (const mime of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return 'video/webm';
}

/**
 * Records an animated replay in 16:9 resolution (1920x1080) at 60 FPS
 * with Green Screen background (#00B140) for effortless chroma keying in video editors.
 */
recordVideoBtn.addEventListener('click', async () => {
  if (messages.length === 0) {
    alert('Please add at least one message before recording a video.');
    return;
  }

  // Snapshot the current messages and active theme
  const currentMessageList = [...messages];
  const activeSenderColor = currentSenderColor;

  setControlsDisabled(true, 'video');
  recordBtnText.textContent = `${currentRatio} Setup...`;

  // 1. Setup Canvas based on selected Aspect Ratio (16:9, 9:16, 1:1) and Width Preset
  const canvas = videoRecordingCanvas;
  const ctx = canvas.getContext('2d');
  
  let width = 1920;
  let height = 1080;
  let chatColumnWidth = 1060;
  let fontSize = 38;
  let lineHeight = 50;
  let paddingX = 34;
  let paddingY = 22;

  if (currentRatio === '16:9') {
    width = 1920;
    height = 1080;
    fontSize = 38;
    lineHeight = 50;
    paddingX = 34;
    paddingY = 22;
    if (currentWidthPreset === 'narrow') {
      chatColumnWidth = 740; // Split-Screen Middle column (fits between 2 actors!)
    } else if (currentWidthPreset === 'wide') {
      chatColumnWidth = 1300;
    } else {
      chatColumnWidth = 1060;
    }
  } else if (currentRatio === '9:16') {
    width = 1080;
    height = 1920;
    fontSize = 36;
    lineHeight = 48;
    paddingX = 32;
    paddingY = 20;
    if (currentWidthPreset === 'narrow') {
      chatColumnWidth = 780;
    } else if (currentWidthPreset === 'wide') {
      chatColumnWidth = 980;
    } else {
      chatColumnWidth = 900;
    }
  } else if (currentRatio === '1:1') {
    width = 1080;
    height = 1080;
    fontSize = 34;
    lineHeight = 46;
    paddingX = 30;
    paddingY = 18;
    if (currentWidthPreset === 'narrow') {
      chatColumnWidth = 720;
    } else if (currentWidthPreset === 'wide') {
      chatColumnWidth = 980;
    } else {
      chatColumnWidth = 860;
    }
  }

  canvas.width = width;
  canvas.height = height;

  // 2. Setup Audio Track & Web Audio Destination for synchronized SFX in video
  let audioCtx = null;
  let audioDest = null;
  let audioTrack = null;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
      audioDest = audioCtx.createMediaStreamDestination();
      
      // Silent carrier oscillator so audio track is valid throughout video
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      gain.gain.value = 0.00001;
      osc.connect(gain);
      gain.connect(audioDest);
      osc.start();
      audioTrack = audioDest.stream.getAudioTracks()[0];
    }
  } catch (err) {
    console.warn('AudioContext not available for audio track:', err);
  }

  // 3. Configure 60 FPS MediaRecorder with 20 Mbps Studio Bitrate
  const mimeType = getBestVideoMime();
  const isMp4 = mimeType.includes('mp4');
  const videoTracks = canvas.captureStream(60).getVideoTracks();
  const combinedTracks = audioTrack ? [...videoTracks, audioTrack] : videoTracks;
  const stream = new MediaStream(combinedTracks);

  const mediaRecorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 20000000 // 20 Mbps studio master quality
  });

  const recordedChunks = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };

  // 4. Pre-calculate layout and text wrapping in canvas space
  ctx.font = `500 ${fontSize}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif`;
  const startX = (width - chatColumnWidth) / 2;
  const maxBubbleWidth = chatColumnWidth * 0.74;

  const layoutItems = currentMessageList.map(item => {
    const lines = wrapCanvasText(ctx, item.text, maxBubbleWidth - paddingX * 2);
    let maxLineWidth = 0;
    lines.forEach(l => {
      const w = ctx.measureText(l).width;
      if (w > maxLineWidth) maxLineWidth = w;
    });
    const bubbleWidth = Math.min(maxBubbleWidth, Math.max(120, maxLineWidth + paddingX * 2));
    const bubbleHeight = lines.length * lineHeight + paddingY * 1.8;
    return {
      type: item.type,
      text: item.text,
      lines,
      bubbleWidth,
      bubbleHeight,
      color: item.color || (item.type === 'sender' ? activeSenderColor : '#e5e5ea'),
      appearTime: 0
    };
  });

  // Calculate approximate total height to determine vertical alignment starting position
  const totalContentHeight = layoutItems.reduce((acc, it) => acc + it.bubbleHeight + 24, 0);
  let initialYOffset = 55;
  if (currentVAlign === 'top') {
    initialYOffset = (currentRatio === '9:16' ? 90 : 55); // Upper third
  } else if (currentVAlign === 'center') {
    const freeSpace = height - totalContentHeight;
    initialYOffset = Math.max(55, Math.floor(freeSpace / 2));
  } else if (currentVAlign === 'bottom') {
    const freeSpace = height - totalContentHeight - 80;
    initialYOffset = Math.max(55, Math.floor(freeSpace));
  }

  // Animation State
  let visibleCount = 0;
  let typingParticipant = null; // 'sender' | 'receiver' | null
  let typingStartTime = 0;
  let currentScrollY = 0;
  let targetScrollY = 0;

  // Render a single 60 FPS Frame on Canvas
  function renderFrame() {
    const now = performance.now();

    // 1. Fill entire canvas with selected background (Chroma Green, Blue, Black, Dark, White)
    ctx.fillStyle = currentBgColor;
    ctx.fillRect(0, 0, width, height);

    // 2. Chat View Area
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 30, width, height - 60);
    ctx.clip();

    // Smooth camera scroll interpolation
    currentScrollY += (targetScrollY - currentScrollY) * 0.16;

    let yOffset = initialYOffset - currentScrollY;
    const gap = 24;

    // Draw all visible messages with realistic Apple iOS spring bounce
    for (let i = 0; i < visibleCount; i++) {
      const item = layoutItems[i];
      const isSender = item.type === 'sender';
      const x = isSender ? (startX + chatColumnWidth - item.bubbleWidth) : startX;
      const y = yOffset;

      let scale = 1;
      let opacity = 1;
      let translateY = 0;

      if (isBounceEnabled && item.appearTime) {
        const elapsed = now - item.appearTime;
        if (elapsed < 420) {
          const t = Math.min(1, elapsed / 400);
          // Realistic Apple iOS Spring physics (rapid pop to 1.09, rebound to 0.97, settle at 1.0)
          if (t < 0.55) {
            const p = t / 0.55;
            scale = 0.32 + 0.77 * Math.sin((p * Math.PI) / 2);
            translateY = (1 - p) * 22;
          } else if (t < 0.8) {
            const p = (t - 0.55) / 0.25;
            scale = 1.09 - 0.12 * Math.sin((p * Math.PI) / 2);
            translateY = -3 + p * 4;
          } else {
            const p = (t - 0.8) / 0.2;
            scale = 0.97 + 0.03 * Math.sin((p * Math.PI) / 2);
            translateY = (1 - p) * 1;
          }
          opacity = Math.min(1, elapsed / 70);
        }
      }

      ctx.save();
      // Anchor transform pivot from bubble tail
      const pivotX = isSender ? (x + item.bubbleWidth) : x;
      const pivotY = y + item.bubbleHeight;

      ctx.translate(pivotX, pivotY);
      ctx.scale(scale, scale);
      ctx.translate(-pivotX, -pivotY - translateY);
      ctx.globalAlpha = opacity;

      // Draw bubble rounded rectangle (Clean asymmetric corners, no square notches)
      ctx.fillStyle = isSender ? item.color : (currentBgType === 'dark' || currentBgType === 'black' ? '#26262b' : '#e5e5ea');

      if (isShadowEnabled) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.42)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 6;
      } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      ctx.beginPath();
      if (isSender) {
        ctx.roundRect(x, y, item.bubbleWidth, item.bubbleHeight, [34, 34, 8, 34]);
      } else {
        ctx.roundRect(x, y, item.bubbleWidth, item.bubbleHeight, [34, 34, 34, 8]);
      }
      ctx.fill();

      // Reset shadow immediately before drawing text so text stays crisp
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Draw text with crisp vector anti-aliasing
      ctx.fillStyle = isSender ? '#ffffff' : (currentBgType === 'dark' || currentBgType === 'black' ? '#ffffff' : '#000000');
      ctx.font = `500 ${fontSize}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif`;
      ctx.textBaseline = 'top';
      for (let l = 0; l < item.lines.length; l++) {
        ctx.fillText(item.lines[l], x + paddingX, y + paddingY + l * lineHeight);
      }

      ctx.restore();
      yOffset += item.bubbleHeight + gap;
    }

    // Draw animated typing indicator if active
    if (typingParticipant) {
      const isSender = typingParticipant === 'sender';
      const bubbleW = 150;
      const bubbleH = 82;
      const x = isSender ? (startX + chatColumnWidth - bubbleW) : startX;
      const y = yOffset;

      let typeScale = 1;
      let typeOpacity = 1;
      if (isBounceEnabled && typingStartTime) {
        const typeElapsed = now - typingStartTime;
        if (typeElapsed < 320) {
          const t = Math.min(1, typeElapsed / 300);
          typeScale = 0.35 + 0.65 * Math.sin((t * Math.PI) / 2);
          typeOpacity = Math.min(1, typeElapsed / 80);
        }
      }

      ctx.save();
      const anchorX = isSender ? (x + bubbleW) : x;
      const anchorY = y + bubbleH;
      ctx.translate(anchorX, anchorY);
      ctx.scale(typeScale, typeScale);
      ctx.translate(-anchorX, -anchorY);
      ctx.globalAlpha = typeOpacity;

      if (isShadowEnabled) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.42)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 6;
      } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      ctx.fillStyle = isSender ? activeSenderColor : (currentBgType === 'dark' || currentBgType === 'black' ? '#26262b' : '#e5e5ea');
      ctx.beginPath();
      if (isSender) {
        ctx.roundRect(x, y, bubbleW, bubbleH, [30, 30, 8, 30]);
      } else {
        ctx.roundRect(x, y, bubbleW, bubbleH, [30, 30, 30, 8]);
      }
      ctx.fill();

      // Reset shadow before drawing dots
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Bouncing 3 dots
      const dotColor = isSender ? 'rgba(255, 255, 255, 0.95)' : '#8e8e93';
      for (let d = 0; d < 3; d++) {
        const bounce = Math.sin(now / 150 + d * 1.1) * 8;
        ctx.fillStyle = dotColor;
        ctx.beginPath();
        ctx.arc(x + 44 + d * 31, y + 41 + bounce, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      yOffset += bubbleH + gap;
    }

    // Smoothly scroll camera down as new messages arrive
    const chatBottom = yOffset + currentScrollY;
    const viewBottom = height - 90;
    if (chatBottom > viewBottom) {
      targetScrollY = chatBottom - viewBottom;
    }

    ctx.restore();
  }

  // Start Live 60 FPS recording loop
  mediaRecorder.start();
  const renderInterval = setInterval(renderFrame, 1000 / 60);

  // Clear live DOM display for synchronized on-screen preview
  displayContainer.innerHTML = '';

  function createDomTypingBubble(type) {
    const bubble = document.createElement('div');
    bubble.className = `typing-bubble ${type}`;
    bubble.id = 'activeTypingIndicator';
    bubble.innerHTML = `
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    `;
    displayContainer.appendChild(bubble);
    displayContainer.scrollTop = displayContainer.scrollHeight;
  }

  function removeDomTypingBubble() {
    const el = document.getElementById('activeTypingIndicator');
    if (el) el.remove();
  }

  function appendDomMessage(item) {
    const div = document.createElement('div');
    div.className = `message ${item.type}`;
    div.textContent = item.text;
    if (item.type === 'sender') {
      div.style.backgroundColor = item.color;
    }
    displayContainer.appendChild(div);
    displayContainer.scrollTop = displayContainer.scrollHeight;
  }

  // Sequential Playback Timeline
  try {
    recordBtnText.textContent = 'Recording 0%...';
    await new Promise(r => setTimeout(r, 600));

    // Dynamic pacing parameters
    let typingDelay = 900;
    let minHold = 1200;
    let maxHold = 2200;
    let charMultiplier = 45;
    let finalHold = 1800;

    if (currentPacing === 'fast') {
      typingDelay = 500;
      minHold = 800;
      maxHold = 1500;
      charMultiplier = 30;
      finalHold = 1200;
    } else if (currentPacing === 'slow') {
      typingDelay = 1400;
      minHold = 1800;
      maxHold = 3200;
      charMultiplier = 60;
      finalHold = 2400;
    }

    for (let i = 0; i < layoutItems.length; i++) {
      const item = layoutItems[i];
      const progressPercent = Math.round(((i + 1) / layoutItems.length) * 100);
      recordBtnText.textContent = `Recording ${progressPercent}%...`;

      // 1. Show Typing Indicator
      typingParticipant = item.type;
      typingStartTime = performance.now();
      createDomTypingBubble(item.type);
      await new Promise(r => setTimeout(r, typingDelay));

      // 2. Hide typing, pop in message with bouncy physics and sound FX
      typingParticipant = null;
      removeDomTypingBubble();
      item.appearTime = performance.now();
      visibleCount++;
      appendDomMessage(item);

      if (isSoundEnabled) {
        playPopSound(item.type, audioDest);
      }

      // 3. Reading hold based on message length
      const holdDuration = Math.min(maxHold, Math.max(minHold, item.text.length * charMultiplier));
      await new Promise(r => setTimeout(r, holdDuration));
    }

    // Hold complete screen at the end so full conversation is clearly visible
    recordBtnText.textContent = 'Finalizing...';
    await new Promise(r => setTimeout(r, finalHold));

  } catch (err) {
    console.error('Animation replay error:', err);
  } finally {
    clearInterval(renderInterval);

    mediaRecorder.onstop = () => {
      if (audioCtx && audioCtx.state !== 'closed') {
        try { audioCtx.close(); } catch (e) {}
      }

      const videoBlob = new Blob(recordedChunks, { type: mimeType });
      const ratioTag = currentRatio.replace(':', 'x');
      const filename = isMp4 ? `imessage_${ratioTag}_${currentBgType}.mp4` : `imessage_${ratioTag}_${currentBgType}.webm`;
      downloadBlob(videoBlob, filename);

      recordBtnText.textContent = `Saved ${currentRatio} Video! ✓`;
      setTimeout(() => {
        setControlsDisabled(false);
        updateUIState();
      }, 1200);
    };

    mediaRecorder.stop();
  }
});

// ==========================================================================
// 6. Initialization
// ==========================================================================

window.addEventListener('DOMContentLoaded', () => {
  // Initialize Default App Theme to Dark Mode
  const savedTheme = localStorage.getItem('chatgame_theme') || 'dark';
  setAppTheme(savedTheme);

  // Set default sender color to blue
  setSenderTheme('blue');

  // Load sample demo chat on first visit
  loadSampleBtn.click();
});
