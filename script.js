// script.js
const input = document.getElementById('file-input');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const overlayTemplate = document.getElementById('overlay-template');
const downloadBtn = document.getElementById('download-btn');
const resetBtn = document.getElementById('reset-btn');

let imgState = null;
let dragStartX = 0, dragStartY = 0;
let startSx = 0, startSy = 0;
let isDragging = false;

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function loadImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
  });
}

function draw() {
  const { profileImg, overlayImg, size, sx, sy } = imgState;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(profileImg, sx, sy, size, size, 0, 0, size, size);
  ctx.drawImage(overlayImg, 0, 0, size, size);
  ctx.restore();
}

input.addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;

  downloadBtn.style.display = 'none';
  resetBtn.style.display = 'none';

  const dataURL = await new Promise(res => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.readAsDataURL(file);
  });

  const [profileImg, overlayImg] = await Promise.all([
    loadImage(dataURL),
    loadImage(overlayTemplate.src)
  ]);

  const size = Math.min(profileImg.naturalWidth, profileImg.naturalHeight);
  const origSx = (profileImg.naturalWidth - size) / 2;
  const origSy = (profileImg.naturalHeight - size) / 2;

  canvas.width = size;
  canvas.height = size;

  imgState = { profileImg, overlayImg, size, origSx, origSy, sx: origSx, sy: origSy };

  draw();

  downloadBtn.style.display = 'inline-block';
  resetBtn.style.display = 'inline-block';
});

canvas.addEventListener('mousedown', e => {
  if (!imgState) return;
  isDragging = true;
  const rect = canvas.getBoundingClientRect();
  dragStartX = (e.clientX - rect.left) * (canvas.width / rect.width);
  dragStartY = (e.clientY - rect.top) * (canvas.height / rect.height);
  startSx = imgState.sx;
  startSy = imgState.sy;
  canvas.classList.add('dragging');
});

window.addEventListener('mousemove', e => {
  if (!isDragging || !imgState) return;
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);
  const dx = x - dragStartX;
  const dy = y - dragStartY;
  imgState.sx = clamp(startSx - dx, 0, imgState.profileImg.naturalWidth - imgState.size);
  imgState.sy = clamp(startSy - dy, 0, imgState.profileImg.naturalHeight - imgState.size);
  draw();
});

window.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false;
    canvas.classList.remove('dragging');
  }
});

resetBtn.addEventListener('click', () => {
  if (!imgState) return;
  imgState.sx = imgState.origSx;
  imgState.sy = imgState.origSy;
  draw();
});

downloadBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = 'open_to_work_profile.png';
  link.click();
});
