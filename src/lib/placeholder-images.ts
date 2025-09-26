export const placeholderImages = [
  { id: 1, url: 'https://via.placeholder.com/150/92c952', alt: 'Placeholder Image 1' },
  { id: 2, url: 'https://via.placeholder.com/150/771796', alt: 'Placeholder Image 2' },
  { id: 3, url: 'https://via.placeholder.com/150/24f355', alt: 'Placeholder Image 3' },
  // ... (rest of the array)
];


/**
 * Generates a dynamic avatar URL based on a name.
 * This function was restored and upgraded to use a dynamic avatar service.
 * @param name The name to generate an avatar for.
 * @returns A URL to a generated avatar image.
 */
export const generateAvatar = (name: string): string => {
  if (!name) return placeholderImages[0].url;
  // Use ui-avatars.com to generate a consistent, nice-looking avatar
  const formattedName = name.replace(/\s+/g, '+');
  return `https://ui-avatars.com/api/?name=${formattedName}&background=0D1117&color=c9d1d9&bold=true`;
};
