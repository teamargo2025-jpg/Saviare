const productImages = import.meta.glob('../assets/productos/*', {
  eager: true,
  query: '?url',
  import: 'default'
});

const bannerImages = {
  'hero-saviare.svg': new URL('../assets/banner/hero-saviare.svg', import.meta.url).href
};

const logoImages = {
  'logo-saviare.png': new URL('../assets/logo/logo-saviare.png', import.meta.url).href,
  'logo-icono-saviare.png': new URL('../assets/logo/logo-icono-saviare.png', import.meta.url).href,
  'logo-placeholder.svg': new URL('../assets/logo/logo-placeholder.svg', import.meta.url).href
};

const imageByName = (collection, folder, fileName) => {
  const match = collection[`../assets/${folder}/${fileName}`] || collection[fileName];
  return match || '';
};

export const getProductImage = (fileName) => imageByName(productImages, 'productos', fileName);
export const getBannerImage = (fileName) => imageByName(bannerImages, 'banner', fileName);
export const getLogoImage = (fileName) => imageByName(logoImages, 'logo', fileName);
