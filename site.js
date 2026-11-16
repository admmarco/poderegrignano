const viewer = document.querySelector('.lightbox');
const image = viewer.querySelector('img');
const caption = viewer.querySelector('figcaption');

document.querySelectorAll('.gallery-photo').forEach((photo) => {
  photo.addEventListener('click', (event) => {
    if (!viewer.showModal || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    image.src = photo.href;
    image.alt = photo.querySelector('img').alt;
    caption.textContent = photo.querySelector('span').firstChild.textContent.trim();
    viewer.showModal();
  });
});

viewer.addEventListener('click', (event) => {
  if (event.target === viewer) viewer.close();
});
