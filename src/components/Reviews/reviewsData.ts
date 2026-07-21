export interface Review {
  id: string;
  quote: string;
  author: string;
  role: string;
  avatar: string;
}

export const reviewsData: Review[] = [
  {
    id: '4',
    quote: 'Thrilled with the fun & unique website designed by Tulio for my retail business.',
    author: 'Julie Alleyne',
    role: 'Ecclection',
    avatar: '', // placeholder, replace with actual avatar if available
  },
  {
    id: '5',
    quote: 'I’m so happy with the website Tulio built for my business! He truly listened to what I wanted and made everything look even better than I imagined.',
    author: 'Carolina Alcalá',
    avatar: '', // placeholder, replace with actual avatar if available
    role: 'Carolina Skin Centre',
    
  },
  {
    id: '6',
    quote: 'Cicero Web Studio developed an excellent application that provides people in Chicago with access to free resources and community support.',
    author: 'Mariana Josan',
    role: 'Adult Probation Department of Chicago',
    avatar: '', // placeholder, replace with actual avatar if available
  },
  
];

