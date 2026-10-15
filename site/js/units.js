// What guests see about each home. Photos currently point at the Airbnb listing
// photos; swap in your own files (put them in site/img/ and use '/img/name.jpg').
export const UNITS = {
  BV2: {
    id: 'BV2',
    name: 'Beachview 2',
    tagline: 'Beachfront townhome with arcade, kayaks and bikes',
    rating: { score: 4.89, count: 56, source: 'Airbnb' },
    facts: ['3 bedrooms', '3 baths', 'Sleeps 8', 'Beachfront'],
    beds: ['King bed in the primary suite', 'Queen bed in each guest room'],
    summary:
      'A three-story townhome at Beachview on Navarre Beach, with a balcony that opens toward the Gulf and stairs straight down to the sand. The garage is packed with free gear: arcade games, kayaks, bikes, a beach wagon, chairs, umbrellas, floats and toys.',
    highlights: [
      'Gulf views from the living room and primary suite balcony',
      'Arcade games, kayaks and bikes in the garage at no charge',
      'Full kitchen and in-unit washer and dryer',
      'Community pool and tennis courts',
      'Direct beach access',
      'Fast Wi-Fi and a desk for remote work',
    ],
    photos: [
      'https://a0.muscache.com/im/pictures/miso/Hosting-52578894/original/917c941f-c4c8-4c71-9882-ed77ae91fa8c.jpeg?im_w=1200',
      'https://a0.muscache.com/im/pictures/prohost-api/Hosting-52578894/original/c4a21dc8-1743-464d-abcd-081d14027a8c.jpeg?im_w=1200',
      'https://a0.muscache.com/im/pictures/miso/Hosting-52578894/original/49fa90f2-6dfb-4e2e-ac29-f3423cef042b.jpeg?im_w=1200',
      'https://a0.muscache.com/im/pictures/miso/Hosting-52578894/original/cb791855-f1fd-4316-abe4-2657b5b4ade1.jpeg?im_w=1200',
      'https://a0.muscache.com/im/pictures/miso/Hosting-52578894/original/da3fdfed-f3d3-4379-baa9-199b3c3a2119.jpeg?im_w=1200',
    ],
  },
  BV13: {
    id: 'BV13',
    name: 'Beachview 13',
    tagline: 'Gulf-front townhome with arcade, pool and dolphin views',
    rating: { score: 4.91, count: 43, source: 'Airbnb' },
    facts: ['3 bedrooms', '3 baths', 'Sleeps 8', 'Gulf front'],
    beds: ['Queen and a twin in bedroom 1', 'King in bedroom 2', 'Queen and a twin in bedroom 3'],
    summary:
      'A Gulf-front townhome a few doors down at Beachview, with water views from the private balcony where guests often spot dolphins. Same free garage of gear as Beachview 2: kayaks, bikes, arcade games, a beach wagon, chairs and umbrellas.',
    highlights: [
      'Gulf-front balcony with dolphin sightings',
      'Arcade games, kayaks and bikes in the garage at no charge',
      'Primary suite with its own bath',
      'Full kitchen and in-unit washer and dryer',
      'Community pool and tennis courts',
      'Direct beach access',
    ],
    photos: [
      'https://a0.muscache.com/im/pictures/miso/Hosting-1293750710282535695/original/2535aea4-94ef-40e7-89a5-40af0cf44187.jpeg?im_w=1200',
      'https://a0.muscache.com/im/pictures/miso/Hosting-1293750710282535695/original/d663f027-a58b-4291-97eb-08e130db67ea.jpeg?im_w=1200',
      'https://a0.muscache.com/im/pictures/miso/Hosting-1293750710282535695/original/f4659402-4cf3-4e93-b676-d780c902bba0.jpeg?im_w=1200',
      'https://a0.muscache.com/im/pictures/miso/Hosting-1293750710282535695/original/76a1a718-59ef-4f12-b713-09385fb6e1a7.jpeg?im_w=1200',
      'https://a0.muscache.com/im/pictures/miso/Hosting-1293750710282535695/original/d0ee8e92-9b4c-41ef-944a-e03fe7faf6fd.jpeg?im_w=1200',
    ],
  },
};

export const HOUSE_RULES = [
  'No pets, including service and emotional support animals: a family member has severe allergies.',
  'No baby gates are provided for the stairs.',
  'Please follow the checkout list. Extra cleaning beyond normal may be charged.',
  'Your welcome letter with door codes arrives by email 2 to 4 weeks before your stay.',
];

export const CONTACT = { email: 'vacawithbarclay@gmail.com', hosts: 'Melissa and Wes Barclay' };
