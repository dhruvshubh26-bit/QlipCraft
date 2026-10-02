let selectedCommunity = document.querySelector('.community-option.active')?.dataset.community || 'Jobs';
const views = [...document.querySelectorAll('.view')];
const topicInput = document.getElementById('topic-input');
const generateButton = document.getElementById('generate-button');
const modal = document.getElementById('result-modal');
const modalVideo = document.getElementById('modal-video');
const modalMeta = document.getElementById('modal-meta');

function switchView(name) {
  views.forEach((view) => view.classList.toggle('active', view.id === `view-${name}`));
  document.querySelectorAll('[data-view-target]').forEach((item) => item.classList.toggle('active', item.dataset.viewTarget === name));
}

document.querySelectorAll('[data-view-target]').forEach((item) => item.addEventListener('click', (event) => {
  event.preventDefault();
  switchView(item.dataset.viewTarget);
}));

document.querySelectorAll('.community-option').forEach((button) => button.addEventListener('click', () => {
  selectedCommunity = button.dataset.community;
  document.querySelectorAll('.community-option').forEach((item) => item.classList.toggle('active', item === button));
}));

document.querySelectorAll('.preset').forEach((button) => button.addEventListener('click', () => {
  topicInput.value = button.dataset.preset;
  topicInput.focus();
}));

function closeModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  modalVideo.pause();
  modalVideo.removeAttribute('src');
  modalVideo.load();
}

function showResult(data) {
  modalVideo.src = `/output/${encodeURIComponent(data.id)}.mp4`;
  modalMeta.replaceChildren();
  [['Hook 1', data.hook1], ['Hook 2', data.hook2], ['Caption', data.caption], ['Hashtags', data.hashtags]].forEach(([label, value]) => {
    const row = document.createElement('p');
    row.textContent = `${label}: ${value || ''}`;
    modalMeta.appendChild(row);
  });
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

generateButton.addEventListener('click', async () => {
  const topic = topicInput.value.trim();
  if (!topic) {
    alert('Please enter a video topic.');
    topicInput.focus();
    return;
  }

  generateButton.disabled = true;
  generateButton.querySelector('svg').style.animation = 'spin .8s linear infinite';
  generateButton.lastChild.textContent = ' Generating...';

  try {
    const form = new FormData();
    form.append('topic', topic);
    form.append('community', selectedCommunity);
    const response = await fetch('/generate', { method: 'POST', body: form });
    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data.error || 'Generation failed.');
    showResult(data);
    setTimeout(() => window.location.reload(), 800);
  } catch (error) {
    alert(`Error: ${error.message}`);
  } finally {
    generateButton.disabled = false;
    generateButton.querySelector('svg').style.animation = '';
    generateButton.lastChild.textContent = 'Generate Video';
  }
});

topicInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) generateButton.click();
});
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-done').addEventListener('click', closeModal);
modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && modal.classList.contains('open')) closeModal(); });

document.querySelectorAll('.delete-video').forEach((button) => button.addEventListener('click', async () => {
  const videoId = button.dataset.videoId;
  if (!confirm('Delete this video permanently?')) return;

  button.disabled = true;
  button.textContent = 'Deleting...';
  try {
    const response = await fetch(`/videos/${encodeURIComponent(videoId)}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data.error || 'Delete failed.');
    window.location.reload();
  } catch (error) {
    button.disabled = false;
    button.textContent = 'Delete';
    alert(`Error: ${error.message}`);
  }
}));
