import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import { fetchPhotos } from './js/api';
import { createPhotoCard, appendGallery, clearGallery } from './js/gallery';

const gallerySelector = document.querySelector('.gallery');
const searchForm = document.querySelector('.search-form');
const searchInput = searchForm.querySelector('input');

const gallery = new SimpleLightbox('.gallery a', { enableKeyboard: true });

const state = {
  currentPage: 1,
  isLoading: false,
  initialLoad: true,
  total: 0,
  imagesPerPage: 40,
  errorNotified: false,
};

searchForm.addEventListener('submit', handleFormSubmit);
window.addEventListener('scroll', debounce(handleScroll, 300));

let isLoadingMore = false;

async function handleScroll() {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

  if (
    scrollTop + clientHeight >= scrollHeight - 200 &&
    !state.isLoading &&
    !state.errorNotified &&
    !isLoadingMore
  ) {
    try {
      isLoadingMore = true;

      const searchQueryValue = searchInput.value.trim();
      if (!searchQueryValue) {
        isLoadingMore = false;
        return;
      }

      const { fetchedTotal, photos } = await fetchPhotos(
        searchQueryValue,
        state.currentPage,
        state.imagesPerPage
      );
      const photoCardsHTML = await renderPhotos(photos);

      appendGallery(gallerySelector, photoCardsHTML);
      gallery.refresh();

      state.total = fetchedTotal;

      if (
        state.total &&
        state.currentPage * state.imagesPerPage >= state.total
      ) {
        Notify.info('All images loaded.');
        state.errorNotified = true;
      }

      state.currentPage += 1;
    } catch (error) {
      handleApiError(error);
      state.errorNotified = true;
    } finally {
      isLoadingMore = false;
    }
  }
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const searchQueryValue = searchInput.value.trim();
  if (!searchQueryValue) {
    clearGallery(gallerySelector);
    return Notify.failure('Please enter a search query.');
  }

  state.currentPage = 1;
  state.initialLoad = true;
  state.errorNotified = false;

  clearGallery(gallerySelector);
  try {
    const { fetchedTotal, photos } = await fetchPhotos(
      searchQueryValue,
      state.currentPage,
      state.imagesPerPage
    );
    const photoCardsHTML = renderPhotos(photos);

    appendGallery(gallerySelector, photoCardsHTML);
    gallery.refresh();

    state.total = fetchedTotal;

    Notify.success(`Found ${state.total} images.`);
  } catch (error) {
    handleApiError(error);
  }
}

function renderPhotos(photos) {
  return photos.map(photo => createPhotoCard(photo)).join('');
}

function handleApiError(error) {
  console.error('Error:', error.message);
  Notify.failure('An error occurred. Please try again.');
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
