import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import { createPhotoCard, appendGallery, clearGallery } from './js/gallery';
import { fetchPhotos } from './js/api';

const state = {
  currentPage: 1,
  isLoading: false,
  initialLoad: true,
  total: 0,
  imagesPerPage: 40,
  errorNotified: false,
};

const gallerySelector = document.querySelector('.gallery');
const searchForm = document.querySelector('.search-form');
const searchInput = searchForm.querySelector('input');
const gallery = new SimpleLightbox('.gallery a', { enableKeyboard: true });

searchForm.addEventListener('submit', handleFormSubmit);
window.addEventListener('scroll', handleScroll);

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
      console.error('Error loading more images:', error.message);
      Notify.failure(
        "We're sorry, but there was an error loading more images."
      );
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
    console.error('Error handling form submit:', error.message);
    Notify.failure('Error handling form submit. Please try again.');
  }
}

function renderPhotos(photos) {
  return photos.map(photo => createPhotoCard(photo)).join('');
}
