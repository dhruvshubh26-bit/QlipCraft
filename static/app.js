let selectedCommunity = document.querySelector('.community.active, .community-btn.active')?.dataset.community || 'Jobs';
let selectedDuration = 30;
let showCaptions = true;

const topicInput = document.getElementById('topicInput');
const topicError = document.getElementById('topicError');
const generateButton = document.getElementById('generateButton');
const resultModal = document.getElementById('resultModal');
const modalVideo = document.getElementById('modalVideo');
const modalCloseIcon = document.getElementById('modalCloseIcon');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalHook1 = document.getElementById('modalHook1');
const modalHook2 = document.getElementById('modalHook2');
const modalCaption = document.getElementById('modalCaption');
const modalHashtags = document.getElementById('modalHashtags');
const copyCaptionBtn = document.getElementById('copyCaptionBtn');
const copyHashtagsBtn = document.getElementById('copyHashtagsBtn');
const captionsInput = document.getElementById('captionsInput');

let pipelineInterval = null;
const stepCount = 6;

function switchView(target) {
  document.querySelectorAll('.view').forEach((view) => {
    view.classList.toggle('active', view.id === `view-${target}`);
  });
  document.querySelectorAll('.sidebar-nav .nav-item, .sidebar-nav .nav-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.viewTarget === target);
  });
}

document.querySelectorAll('[data-view-target]').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    switchView(btn.dataset.viewTarget);
  });
});

document.querySelectorAll('.community, .community-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    selectedCommunity = btn.dataset.community;
    document.querySelectorAll('.community, .community-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

document.querySelectorAll('.option, .duration-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    selectedDuration = parseInt(btn.dataset.duration, 10) || 30;
    document.querySelectorAll('.option, .duration-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

document.querySelectorAll('.preset, .preset-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (topicInput) {
      topicInput.value = btn.dataset.preset;
      topicInput.focus();
      hideInlineError();
    }
  });
});

function showInlineError(message) {
  if (topicError) {
    topicError.textContent = message;
    topicError.style.display = 'block';
  }
}

function hideInlineError() {
  if (topicError) {
    topicError.textContent = '';
    topicError.style.display = 'none';
  }
}

if (topicInput) {
  topicInput.addEventListener('input', hideInlineError);
  topicInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      generateButton?.click();
    }
  });
}

function formatTimestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function setStepState(stepNum, state, timeText) {
  const stepEl = document.getElementById(`step-${stepNum}`);
  if (!stepEl) return;
  stepEl.classList.remove('idle', 'running', 'done', 'error');
  stepEl.classList.add(state);

  const iconEl = stepEl.querySelector('.step-icon');
  const timeEl = document.getElementById(`step-time-${stepNum}`);

  if (state === 'idle') {
    if (iconEl) iconEl.innerHTML = `<span class="step-num">${stepNum}</span>`;
    if (timeEl) timeEl.textContent = '—';
  } else if (state === 'running') {
    if (iconEl) iconEl.innerHTML = `<span class="spin" style="display:inline-block;width:12px;height:12px;border:2px solid var(--primary-light);border-top-color:transparent;border-radius:50%;"></span>`;
    if (timeEl) timeEl.textContent = 'In progress...';
  } else if (state === 'done') {
    if (iconEl) iconEl.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    if (timeEl) timeEl.textContent = timeText || formatTimestamp();
  } else if (state === 'error') {
    if (iconEl) iconEl.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    if (timeEl) timeEl.textContent = 'Failed';
  }
}

function resetPipeline(topic, community, duration) {
  if (pipelineInterval) {
    clearInterval(pipelineInterval);
    pipelineInterval = null;
  }
  const hubTopic = document.getElementById('hubTopic');
  const hubCommunity = document.getElementById('hubCommunity');
  const hubDuration = document.getElementById('hubDuration');
  const hubBadge = document.getElementById('hubStatusBadge');
  const hubError = document.getElementById('hubError');

  if (hubTopic) hubTopic.textContent = topic;
  if (hubCommunity) hubCommunity.textContent = community;
  if (hubDuration) hubDuration.textContent = `${duration}s`;
  if (hubBadge) {
    hubBadge.textContent = 'Running';
    hubBadge.className = 'summary-status running';
  }
  if (hubError) hubError.style.display = 'none';

  for (let i = 1; i <= stepCount; i++) {
    setStepState(i, 'idle');
  }
  const progressBar = document.getElementById('hubProgressBar');
  if (progressBar) progressBar.style.width = '0%';
}

function startPipeline() {
  setStepState(1, 'running');
  const progressBar = document.getElementById('hubProgressBar');
  if (progressBar) progressBar.style.width = '12%';

  let step = 1;
  pipelineInterval = setInterval(() => {
    if (step < stepCount) {
      setStepState(step, 'done');
      step++;
      setStepState(step, 'running');
      const progress = Math.min(92, Math.round((step / stepCount) * 90));
      if (progressBar) progressBar.style.width = `${progress}%`;
    } else {
      clearInterval(pipelineInterval);
      pipelineInterval = null;
    }
  }, 2300);
}

function finishPipeline() {
  if (pipelineInterval) {
    clearInterval(pipelineInterval);
    pipelineInterval = null;
  }
  for (let i = 1; i <= stepCount; i++) {
    setStepState(i, 'done');
  }
  const progressBar = document.getElementById('hubProgressBar');
  if (progressBar) progressBar.style.width = '100%';

  const hubBadge = document.getElementById('hubStatusBadge');
  if (hubBadge) {
    hubBadge.textContent = 'Completed';
    hubBadge.className = 'summary-status success';
  }
}

function failPipeline(errorMessage) {
  if (pipelineInterval) {
    clearInterval(pipelineInterval);
    pipelineInterval = null;
  }
  for (let i = 1; i <= stepCount; i++) {
    const el = document.getElementById(`step-${i}`);
    if (el && el.classList.contains('running')) {
      setStepState(i, 'error');
      break;
    }
  }
  const hubBadge = document.getElementById('hubStatusBadge');
  if (hubBadge) {
    hubBadge.textContent = 'Error';
    hubBadge.className = 'summary-status danger';
  }
  const hubError = document.getElementById('hubError');
  if (hubError) {
    hubError.textContent = `Pipeline failed: ${errorMessage}`;
    hubError.style.display = 'block';
  }
}

function showResult(data) {
  if (!resultModal || !modalVideo) return;
  modalVideo.src = `/output/${encodeURIComponent(data.id)}.mp4`;
  if (modalHook1) modalHook1.textContent = data.hook1 || '—';
  if (modalHook2) modalHook2.textContent = data.hook2 || '—';
  if (modalCaption) modalCaption.textContent = data.caption || '—';
  if (modalHashtags) modalHashtags.textContent = data.hashtags || '—';

  resultModal.classList.add('open');
  resultModal.setAttribute('aria-hidden', 'false');
  modalVideo.play().catch(() => {});
}

function closeModal() {
  if (!resultModal || !modalVideo) return;
  resultModal.classList.remove('open');
  resultModal.setAttribute('aria-hidden', 'true');
  modalVideo.pause();
  modalVideo.removeAttribute('src');
  modalVideo.load();
}

modalCloseIcon?.addEventListener('click', closeModal);
modalCloseBtn?.addEventListener('click', closeModal);
resultModal?.addEventListener('click', (e) => {
  if (e.target === resultModal) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && resultModal?.classList.contains('open')) {
    closeModal();
  }
});

async function copyToClipboard(text, button) {
  if (!text) return;
  let copied = false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      copied = true;
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      copied = document.execCommand('copy');
      textarea.remove();
    }
  } catch {
    copied = false;
  }

  if (copied && button) {
    const originalText = button.textContent;
    button.textContent = 'Copied!';
    button.classList.add('copied');
    setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove('copied');
    }, 1500);
  }
}

copyCaptionBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  const text = modalCaption?.textContent || '';
  copyToClipboard(text, copyCaptionBtn);
});

copyHashtagsBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  const text = modalHashtags?.textContent || '';
  copyToClipboard(text, copyHashtagsBtn);
});

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function bindCardEvents(card) {
  card.addEventListener('click', (e) => {
    if (e.target.closest('.btn-delete-video')) return;
    showResult({
      id: card.dataset.id,
      hook1: '—',
      hook2: '—',
      caption: card.dataset.caption,
      hashtags: card.dataset.hashtags
    });
  });

  const deleteBtn = card.querySelector('.btn-delete-video');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const videoId = deleteBtn.dataset.videoId;
      deleteBtn.disabled = true;
      deleteBtn.textContent = 'Deleting...';
      try {
        const response = await fetch(`/videos/${encodeURIComponent(videoId)}`, { method: 'DELETE' });
        const data = await response.json();
        if (!response.ok || data.error) throw new Error(data.error || 'Delete failed');

        card.remove();
        const countEl = document.getElementById('video-count');
        if (countEl) {
          const count = Math.max(0, (parseInt(countEl.textContent || '0', 10) || 1) - 1);
          countEl.textContent = count;
          if (count === 0) {
            const grid = document.getElementById('videoGrid');
            if (grid) {
              grid.innerHTML = `
                <div class="empty-state" id="emptyVideos">
                  <div class="empty-icon">
                    <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
                      <line x1="7" y1="2" x2="7" y2="22"/>
                      <line x1="17" y1="2" x2="17" y2="22"/>
                      <line x1="2" y1="12" x2="22" y2="12"/>
                    </svg>
                  </div>
                  <h3>No videos yet</h3>
                  <p>No videos yet. Generate your first one.</p>
                </div>
              `;
            }
          }
        }
      } catch {
        deleteBtn.disabled = false;
        deleteBtn.textContent = 'Delete';
      }
    });
  }
}

document.querySelectorAll('.video-card').forEach(bindCardEvents);

function addVideoToLibrary(item) {
  const grid = document.getElementById('videoGrid');
  if (!grid) return;

  const emptyEl = document.getElementById('emptyVideos');
  if (emptyEl) emptyEl.remove();

  const card = document.createElement('article');
  card.className = 'video-card';
  card.dataset.id = item.id;
  card.dataset.topic = item.topic;
  card.dataset.community = item.community;
  card.dataset.caption = item.caption;
  card.dataset.hashtags = item.hashtags;
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `View ${item.topic}`);

  card.innerHTML = `
    <div class="video-thumb-wrap">
      <video src="/output/${encodeURIComponent(item.id)}.mp4" preload="metadata" muted playsinline></video>
      <div class="video-card-overlay">
        <span class="play-indicator">▶</span>
      </div>
    </div>
    <div class="video-meta">
      <h3 class="video-topic" title="${escapeHtml(item.topic)}">${escapeHtml(item.topic)}</h3>
      <div class="video-sub">
        <span class="video-badge">${escapeHtml(item.community)}</span>
        <span class="video-time">Just now</span>
      </div>
      <button type="button" class="btn-delete-video" data-video-id="${escapeHtml(item.id)}" title="Delete video">
        Delete
      </button>
    </div>
  `;

  bindCardEvents(card);
  grid.prepend(card);

  const countEl = document.getElementById('video-count');
  if (countEl) {
    const count = (parseInt(countEl.textContent || '0', 10) || 0) + 1;
    countEl.textContent = count;
  }
}

if (generateButton) {
  generateButton.addEventListener('click', async () => {
    const topic = topicInput ? topicInput.value.trim() : '';
    if (!topic) {
      showInlineError('Please enter a video topic.');
      topicInput?.focus();
      return;
    }
    hideInlineError();

    generateButton.disabled = true;
    const generateIcon = generateButton.querySelector('.generate-icon');
    const generateText = generateButton.querySelector('.generate-text');
    if (generateIcon) generateIcon.classList.add('spin');
    if (generateText) generateText.textContent = 'Generating...';

    resetPipeline(topic, selectedCommunity, selectedDuration);
    startPipeline();
    switchView('hub');

    try {
      const fd = new FormData();
      fd.append('topic', topic);
      fd.append('community', selectedCommunity);
      fd.append('duration', selectedDuration);
      fd.append('captions', String(captionsInput ? captionsInput.checked : showCaptions));

      const response = await fetch('/generate', {
        method: 'POST',
        body: fd
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Video generation failed.');
      }

      finishPipeline();
      addVideoToLibrary({
        id: data.id,
        topic: topic,
        community: selectedCommunity,
        caption: data.caption,
        hashtags: data.hashtags
      });

      setTimeout(() => {
        showResult(data);
      }, 400);

    } catch (err) {
      failPipeline(err.message);
      showInlineError(`Error: ${err.message}`);
    } finally {
      generateButton.disabled = false;
      if (generateIcon) generateIcon.classList.remove('spin');
      if (generateText) generateText.textContent = 'Generate Video';
    }
  });
}
