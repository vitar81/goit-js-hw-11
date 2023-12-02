import axios from 'axios';

const API_KEY = '40906664-8295e1c343cc38eabb90570ff';
const GET_URL = 'https://pixabay.com/api/';

export async function fetchPhotos(query, currentPage, imagesPerPage) {
  const params = {
    key: API_KEY,
    q: query,
    image_type: 'photo',
    orientation: 'horizontal',
    safesearch: true,
    page: currentPage,
    per_page: imagesPerPage,
  };

  try {
    const { data } = await axios.get(GET_URL, { params });

    if (!data || data.total === 0 || !data.hits) {
      throw new Error('No results found.');
    }

    return { fetchedTotal: data.total, photos: data.hits };
  } catch (error) {
    console.error('Error fetching photos:', error.message);
    throw error;
  }
}
