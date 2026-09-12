import type { Locale } from './types';

/**
 * UI chrome only — nav labels, buttons, empty states. Article headlines,
 * summaries, category names and breaking-news text are CMS content and are
 * never translated here; whatever language the newsroom wrote them in is
 * what a reader sees, same as before this toggle existed.
 */
const en = {
  common: {
    home: 'Home',
    about: 'About',
    contact: 'Contact',
    advertise: 'Advertise',
    advertisement: 'Advertisement',
    backToHomepage: 'Back to homepage',
    goToHomepage: 'Go to homepage',
    justNow: 'just now',
  },
  header: {
    searchPlaceholder: 'Search news, topics…',
    searchLabel: 'Search news',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    sections: 'Sections',
  },
  breakingNews: {
    label: 'Breaking',
  },
  footer: {
    quickLinks: 'Quick Links',
    categories: 'Categories',
    contact: 'Contact',
    rightsReserved: 'All rights reserved.',
  },
  home: {
    noStoriesTitle: 'No stories published yet',
    noStoriesDescription:
      'Once the newsroom publishes its first article it will appear right here.',
    topStories: 'Top Stories',
  },
  category: {
    noStoriesTitle: 'No stories here yet',
    noStoriesDescription: (categoryName: string) =>
      `Once the newsroom publishes an article in ${categoryName}, it will appear on this page.`,
    browseByCategory: 'Browse by category',
  },
  pagination: {
    navLabel: 'Pagination',
    previousPage: 'Previous page',
    nextPage: 'Next page',
  },
  notFound: {
    title: 'Page not found',
    heading: 'Page not found',
    description:
      'The page you are looking for does not exist or may have been moved.',
    popularSections: 'Popular sections',
  },
  errorPage: {
    heading: 'We could not load the news',
    description:
      'Something went wrong while fetching the latest stories. Please try again in a moment.',
    tryAgain: 'Try again',
  },
  about: {
    title: 'About',
    heading: (siteName: string) => `About ${siteName}`,
    noDescriptionTitle: 'About text not added yet',
    noDescriptionDescription:
      'The newsroom hasn’t written an About description in Settings yet.',
  },
  contact: {
    title: 'Contact',
    heading: 'Contact us',
    addressLabel: 'Address',
    emailLabel: 'Email',
    phoneLabel: 'Phone',
    followUs: 'Follow us',
    noDetailsTitle: 'Contact details not added yet',
    noDetailsDescription:
      'The newsroom hasn’t added a contact email, phone or address in Settings yet.',
  },
  search: {
    title: 'Search',
    promptTitle: 'Search Coastal Talk News',
    promptDescription:
      'Type a headline, topic or keyword above and press enter.',
    resultsFor: (query: string) => `Results for “${query}”`,
    noResultsTitle: 'No results found',
    noResultsDescription: (query: string) =>
      `Nothing matched “${query}”. Try a different word, or check the spelling.`,
    languageFilterLabel: 'Filter by language',
    languageAll: 'All',
    languageEnglish: 'English',
    languageKannada: 'Kannada',
  },
  advertise: {
    title: 'Advertise with us',
    intro:
      'Reach readers across the coast. Send us your artwork at any size — it is placed at its own proportions, never stretched or cropped.',
    currentlyRunning: 'Currently running',
    noCampaignsTitle: 'No campaigns running right now',
    noCampaignsDescription:
      'Advertisements appear here for as long as they are scheduled to run.',
    visitSite: 'Visit site',
  },
};

const kn: typeof en = {
  common: {
    home: 'ಮುಖಪುಟ',
    about: 'ನಮ್ಮ ಬಗ್ಗೆ',
    contact: 'ಸಂಪರ್ಕಿಸಿ',
    advertise: 'ಜಾಹೀರಾತು',
    advertisement: 'ಜಾಹೀರಾತು',
    backToHomepage: 'ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ',
    goToHomepage: 'ಮುಖಪುಟಕ್ಕೆ ಹೋಗಿ',
    justNow: 'ಈಗಷ್ಟೇ',
  },
  header: {
    searchPlaceholder: 'ಸುದ್ದಿ, ವಿಷಯಗಳನ್ನು ಹುಡುಕಿ…',
    searchLabel: 'ಸುದ್ದಿ ಹುಡುಕಿ',
    openMenu: 'ಮೆನು ತೆರೆಯಿರಿ',
    closeMenu: 'ಮೆನು ಮುಚ್ಚಿ',
    sections: 'ವಿಭಾಗಗಳು',
  },
  breakingNews: {
    label: 'ತುರ್ತು ಸುದ್ದಿ',
  },
  footer: {
    quickLinks: 'ತ್ವರಿತ ಲಿಂಕ್‌ಗಳು',
    categories: 'ವಿಭಾಗಗಳು',
    contact: 'ಸಂಪರ್ಕಿಸಿ',
    rightsReserved: 'ಎಲ್ಲಾ ಹಕ್ಕುಗಳನ್ನು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ.',
  },
  home: {
    noStoriesTitle: 'ಇನ್ನೂ ಯಾವುದೇ ಸುದ್ದಿ ಪ್ರಕಟವಾಗಿಲ್ಲ',
    noStoriesDescription:
      'ಸುದ್ದಿ ವಿಭಾಗವು ತನ್ನ ಮೊದಲ ಲೇಖನವನ್ನು ಪ್ರಕಟಿಸಿದ ತಕ್ಷಣ ಅದು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ.',
    topStories: 'ಪ್ರಮುಖ ಸುದ್ದಿಗಳು',
  },
  category: {
    noStoriesTitle: 'ಇಲ್ಲಿ ಇನ್ನೂ ಯಾವುದೇ ಸುದ್ದಿ ಇಲ್ಲ',
    noStoriesDescription: (categoryName: string) =>
      `${categoryName} ವಿಭಾಗದಲ್ಲಿ ಒಂದು ಲೇಖನ ಪ್ರಕಟವಾದ ತಕ್ಷಣ ಅದು ಈ ಪುಟದಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ.`,
    browseByCategory: 'ವಿಭಾಗದ ಮೂಲಕ ವೀಕ್ಷಿಸಿ',
  },
  pagination: {
    navLabel: 'ಪುಟ ಸಂಖ್ಯೆ',
    previousPage: 'ಹಿಂದಿನ ಪುಟ',
    nextPage: 'ಮುಂದಿನ ಪುಟ',
  },
  notFound: {
    title: 'ಪುಟ ಸಿಗಲಿಲ್ಲ',
    heading: 'ಪುಟ ಸಿಗಲಿಲ್ಲ',
    description:
      'ನೀವು ಹುಡುಕುತ್ತಿರುವ ಪುಟ ಅಸ್ತಿತ್ವದಲ್ಲಿಲ್ಲ ಅಥವಾ ಸ್ಥಳಾಂತರಗೊಂಡಿರಬಹುದು.',
    popularSections: 'ಜನಪ್ರಿಯ ವಿಭಾಗಗಳು',
  },
  errorPage: {
    heading: 'ಸುದ್ದಿಯನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ',
    description:
      'ಇತ್ತೀಚಿನ ಸುದ್ದಿಗಳನ್ನು ತರುವಾಗ ಏನೋ ತಪ್ಪಾಗಿದೆ. ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
    tryAgain: 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ',
  },
  about: {
    title: 'ನಮ್ಮ ಬಗ್ಗೆ',
    heading: (siteName: string) => `${siteName} ಬಗ್ಗೆ`,
    noDescriptionTitle: 'ಬಗ್ಗೆ ಪಠ್ಯ ಇನ್ನೂ ಸೇರಿಸಿಲ್ಲ',
    noDescriptionDescription:
      'ಸುದ್ದಿ ವಿಭಾಗವು ಸೆಟ್ಟಿಂಗ್‌ಗಳಲ್ಲಿ ಇನ್ನೂ ವಿವರಣೆಯನ್ನು ಬರೆದಿಲ್ಲ.',
  },
  contact: {
    title: 'ಸಂಪರ್ಕಿಸಿ',
    heading: 'ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ',
    addressLabel: 'ವಿಳಾಸ',
    emailLabel: 'ಇಮೇಲ್',
    phoneLabel: 'ಫೋನ್',
    followUs: 'ನಮ್ಮನ್ನು ಅನುಸರಿಸಿ',
    noDetailsTitle: 'ಸಂಪರ್ಕ ವಿವರಗಳನ್ನು ಇನ್ನೂ ಸೇರಿಸಿಲ್ಲ',
    noDetailsDescription:
      'ಸುದ್ದಿ ವಿಭಾಗವು ಸೆಟ್ಟಿಂಗ್‌ಗಳಲ್ಲಿ ಇಮೇಲ್, ಫೋನ್ ಅಥವಾ ವಿಳಾಸವನ್ನು ಇನ್ನೂ ಸೇರಿಸಿಲ್ಲ.',
  },
  search: {
    title: 'ಹುಡುಕಿ',
    promptTitle: 'Coastal Talk News ಹುಡುಕಿ',
    promptDescription:
      'ಮೇಲೆ ಶೀರ್ಷಿಕೆ, ವಿಷಯ ಅಥವಾ ಕೀವರ್ಡ್ ಟೈಪ್ ಮಾಡಿ ಎಂಟರ್ ಒತ್ತಿ.',
    resultsFor: (query: string) => `“${query}” ಗಾಗಿ ಫಲಿತಾಂಶಗಳು`,
    noResultsTitle: 'ಯಾವುದೇ ಫಲಿತಾಂಶ ಸಿಗಲಿಲ್ಲ',
    noResultsDescription: (query: string) =>
      `“${query}” ಗೆ ಹೊಂದಿಕೆಯಾಗುವುದು ಏನೂ ಸಿಗಲಿಲ್ಲ. ಬೇರೆ ಪದ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ಕಾಗುಣಿತ ಪರಿಶೀಲಿಸಿ.`,
    languageFilterLabel: 'ಭಾಷೆಯ ಮೂಲಕ ಫಿಲ್ಟರ್ ಮಾಡಿ',
    languageAll: 'ಎಲ್ಲಾ',
    languageEnglish: 'ಇಂಗ್ಲಿಷ್',
    languageKannada: 'ಕನ್ನಡ',
  },
  advertise: {
    title: 'ನಮ್ಮೊಂದಿಗೆ ಜಾಹೀರಾತು ನೀಡಿ',
    intro:
      'ಕರಾವಳಿಯಾದ್ಯಂತ ಓದುಗರನ್ನು ತಲುಪಿ. ಯಾವುದೇ ಗಾತ್ರದ ನಿಮ್ಮ ಜಾಹೀರಾತನ್ನು ಕಳುಹಿಸಿ — ಅದನ್ನು ಅದರ ಸ್ವಂತ ಅನುಪಾತದಲ್ಲಿ ಇರಿಸಲಾಗುತ್ತದೆ, ಎಂದಿಗೂ ಎಳೆಯಲಾಗುವುದಿಲ್ಲ ಅಥವಾ ಕತ್ತರಿಸಲಾಗುವುದಿಲ್ಲ.',
    currentlyRunning: 'ಪ್ರಸ್ತುತ ಪ್ರಸಾರವಾಗುತ್ತಿದೆ',
    noCampaignsTitle: 'ಸದ್ಯಕ್ಕೆ ಯಾವುದೇ ಪ್ರಚಾರ ನಡೆಯುತ್ತಿಲ್ಲ',
    noCampaignsDescription:
      'ಜಾಹೀರಾತುಗಳು ಅವು ಪ್ರಸಾರವಾಗಲು ನಿಗದಿಪಡಿಸಿದಷ್ಟು ಕಾಲ ಇಲ್ಲಿ ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತವೆ.',
    visitSite: 'ಸೈಟ್‌ಗೆ ಭೇಟಿ ನೀಡಿ',
  },
};

export type Dictionary = typeof en;

const dictionaries: Record<Locale, Dictionary> = { en, kn };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
