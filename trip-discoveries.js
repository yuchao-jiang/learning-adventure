(function(root){'use strict';const items=[
  {
    "id": "trip-1",
    "week": 1,
    "icon": "🏰",
    "title": "Explore Hong Kong Disneyland",
    "url": "https://www.hongkongdisneyland.com/hkdl/world-of-frozen/",
    "source": "Hong Kong Disneyland",
    "intro": "Step into Disney stories, from the snowy world of Frozen to the curious rooms of Mystic Manor. Which adventure would you like to try?"
  },
  {
    "id": "trip-2",
    "week": 1,
    "icon": "🎆",
    "title": "Watch Disney magic",
    "url": "https://www.hongkongdisneyland.com/en-hk/entertainment/momentous-nighttime-spectacular/",
    "source": "Hong Kong Disneyland",
    "intro": "Look for favourite Disney characters in the parade. At night, music, lights and pictures can turn the castle into a giant storybook."
  },
  {
    "id": "trip-3",
    "week": 1,
    "icon": "⛴️",
    "title": "Ride the Star Ferry",
    "url": "https://www.discoverhongkong.com/eng/place-to-go/travel.guide-star-ferry-pier.html",
    "source": "Hong Kong Tourism Board",
    "intro": "The green-and-white Star Ferry carries people across Victoria Harbour. Watch the boats and buildings as you glide over the water."
  },
  {
    "id": "trip-4",
    "week": 1,
    "icon": "🌃",
    "title": "Explore Hong Kong streets",
    "url": "https://www.discoverhongkong.com/eng/attractions/top-things-to-see-and-do-around-tsim-sha-tsui-promenade.html",
    "source": "Hong Kong Tourism Board",
    "intro": "Explore busy streets, shops and the waterfront with your family. As evening arrives, look across the harbour for buildings lighting up."
  },
  {
    "id": "trip-5",
    "week": 1,
    "icon": "⛰️",
    "title": "See the city from the Peak",
    "url": "https://www.thepeak.com.hk/en/gallery/image-gallery",
    "source": "The Peak official gallery",
    "intro": "Central has tall buildings and busy streets. From the Peak, look down at the city and see how tiny the buildings seem."
  },
  {
    "id": "trip-6",
    "week": 1,
    "icon": "🎵",
    "title": "Enjoy a concert together",
    "url": "https://www.lcsd.gov.hk/en/hkc/aboutus/photogallery/hongkongcoliseum.html",
    "source": "Hong Kong Coliseum official gallery",
    "intro": "A concert brings music, lights and a big audience together. We might visit the Hong Kong Coliseum if the concert dates fit our trip."
  },
  {
    "id": "trip-7",
    "week": 2,
    "icon": "🌉",
    "title": "Cross the sea on a giant bridge",
    "url": "https://www.gohk.gov.hk/en/spots/spot_detail.php?spot=Hong+Kong-Zhuhai-Macao+Bridge",
    "source": "Hong Kong Home Affairs Department",
    "intro": "This sea crossing connects Hong Kong, Zhuhai and Macao with bridges and a tunnel. Look out at the water during our journey."
  },
  {
    "id": "trip-8",
    "week": 2,
    "icon": "🛸",
    "title": "Discover a spaceship hotel",
    "url": "https://www.chimelong.com/zh/marinesciencehotel/",
    "source": "Chimelong official hotel page",
    "intro": "A hotel can be part of the adventure too. Explore the playful themed surroundings, then enjoy a comfortable family break."
  },
  {
    "id": "trip-9",
    "week": 2,
    "icon": "🐳",
    "title": "Meet the whale sharks",
    "url": "https://www.chimelong.com/zh/oceankingdom/exhibition/2324.html",
    "source": "Chimelong Whale Shark Aquarium",
    "intro": "A whale shark is a fish, even though its name includes whale! Watch how this enormous animal moves through the aquarium."
  },
  {
    "id": "trip-10",
    "week": 2,
    "icon": "🐧",
    "title": "Spot penguins and dolphins",
    "url": "https://www.chimelong.com/zh/oceankingdom/exhibition/",
    "source": "Chimelong animal exhibits",
    "intro": "Penguins are birds and dolphins are mammals, but both move through water. What differences can you spot in how they swim?"
  },
  {
    "id": "trip-11",
    "week": 2,
    "icon": "🎢",
    "title": "Explore Ocean Kingdom",
    "url": "https://www.chimelong.com/zh/oceankingdom/perform/",
    "source": "Chimelong official show pictures",
    "intro": "Ocean Kingdom mixes animal exhibits, rides and themed shows. Choose family favourites and look out for evening fireworks if they are running."
  },
  {
    "id": "trip-12",
    "week": 2,
    "icon": "🚀",
    "title": "Explore Chimelong Spaceship",
    "url": "https://www.chimelong.com/zh/zh-park-science/exhibition/",
    "source": "Chimelong Spaceship official exhibits",
    "intro": "Explore a huge indoor park with ocean-themed exhibits, play areas and rides. What would you like to investigate first?"
  },
  {
    "id": "trip-13",
    "week": 3,
    "icon": "🎪",
    "title": "Watch the Chimelong circus",
    "url": "https://www.chimelong.com/gz/circus/picture/",
    "source": "Chimelong official circus gallery",
    "intro": "A big circus show brings performers, music, colourful costumes and lights together. Choose a favourite moment to tell the family about afterwards."
  },
  {
    "id": "trip-14",
    "week": 3,
    "icon": "🚂",
    "title": "Ride the safari train",
    "url": "https://www.chimelong.com/gz/safaripark/exhibition/",
    "source": "Chimelong official safari exhibits",
    "intro": "Ride through parts of the safari park and watch for animals along the way. Can you spot an animal before the rest of the family?"
  },
  {
    "id": "trip-15",
    "week": 3,
    "icon": "🚡",
    "title": "See animals from a cable car",
    "url": "https://www.chimelong.com/gz/safaripark/exhibition/2406.html",
    "source": "Chimelong official cable-car pictures",
    "intro": "A cable car gives you a different view of the animal park from above. What might you notice that you could miss on the ground?"
  },
  {
    "id": "trip-16",
    "week": 3,
    "icon": "🐼",
    "title": "Look for pandas and koalas",
    "url": "https://www.chimelong.com/gz/safaripark/exhibition/",
    "source": "Chimelong official animal pictures",
    "intro": "Pandas and koalas are both mammals, but they come from different places and eat different plants. Look closely at their paws, ears and fur."
  },
  {
    "id": "trip-17",
    "week": 3,
    "icon": "🦒",
    "title": "Spot giraffes and tigers",
    "url": "https://www.chimelong.com/gz/safaripark/exhibition/",
    "source": "Chimelong official animal pictures",
    "intro": "A giraffe has a long neck and patterned coat; a tiger has stripes and a very different shape. What else makes these animals different?"
  },
  {
    "id": "trip-18",
    "week": 3,
    "icon": "🛋️",
    "title": "Take a cosy family break",
    "url": "https://www.marriott.com/en-us/hotels/cansp-sheraton-guangzhou-panyu/photos/",
    "source": "Sheraton official photo gallery",
    "intro": "Even explorers need a rest. Get cosy at the hotel, chat about your favourite animals and recharge for another family day."
  },
  {
    "id": "trip-19",
    "week": 4,
    "icon": "🏨",
    "title": "Enjoy our city hotel",
    "url": "https://www.fourseasons.com/guangzhou/photos-and-videos/",
    "source": "Four Seasons official photo gallery",
    "intro": "Our city hotel is high above Guangzhou. Enjoy some quiet family time and see what you can spot through the windows."
  },
  {
    "id": "trip-20",
    "week": 4,
    "icon": "🌆",
    "title": "See Guangzhou light up",
    "url": "https://commons.wikimedia.org/wiki/Category:Canton_Tower_at_night",
    "source": "Wikimedia Commons photo collection",
    "intro": "Guangzhou looks different after dark. Around Huacheng Square, look for the glowing Canton Tower and lights beside the Pearl River."
  },
  {
    "id": "trip-21",
    "week": 4,
    "icon": "🥢",
    "title": "Share a Cantonese dinner",
    "url": "https://www.fourseasons.com/guangzhou/dining/restaurants/yu_yue_heen/",
    "source": "Four Seasons Cantonese dining pictures",
    "intro": "Cantonese food comes from this part of China. Share dishes with your family and describe a flavour or texture you enjoy."
  },
  {
    "id": "trip-22",
    "week": 4,
    "icon": "🥟",
    "title": "Try Guangzhou morning tea",
    "url": "https://www.fourseasons.com/guangzhou/dining/restaurants/yu_yue_heen/",
    "source": "Four Seasons dim-sum pictures",
    "intro": "Yum cha means drinking tea, often with little dishes of dim sum to share. Which dumpling, bun or other treat catches your eye?"
  },
  {
    "id": "trip-23",
    "week": 4,
    "icon": "🛍️",
    "title": "Explore the shopping centres",
    "url": "https://www.swireproperties.com/en/portfolio/current-developments/taikoo-hui-guangzhou/taikoo-hui-mall/",
    "source": "Taikoo Hui official pictures",
    "intro": "Taikoo Hui and Parc Central are places to browse shops and enjoy a city stroll. Look for interesting shapes, displays and somewhere to take a break."
  },
  {
    "id": "trip-24",
    "week": 4,
    "icon": "✈️",
    "title": "Fly home with happy memories",
    "url": "https://commons.wikimedia.org/wiki/File:Guangzhou_Baiyun_International_Airport_Terminal_2.jpg",
    "source": "Wikimedia Commons airport photo",
    "intro": "Before flying home, choose a favourite memory from the trip. What would you tell a friend about Hong Kong, Zhuhai or Guangzhou?"
  }
];root.TripDiscoveries=items;if(typeof module!=='undefined')module.exports=items;})(globalThis);
