(function(root){const chapters=[
  {
    "id": "twilight",
    "name": "Twilight Sparkle",
    "place": "The sparkling library",
    "color": "#b48bc7",
    "gem": "#b28ad2",
    "emoji": "🔮",
    "skill": "Reading & words",
    "story": "Twilight reached an old bridge. A board wobbled under her hoof. She was reluctant to take another step. Rainbow Dash checked the boards and showed her a safe way across.",
    "questions": [
      {
        "id": "pony-1",
        "q": "What can you work out about Twilight?",
        "opts": [
          "She thought the bridge was perfectly safe.",
          "She was worried that the bridge might not be safe.",
          "She wanted to go back to bed."
        ],
        "a": 1,
        "skill": "Reading inference",
        "hint": "Think about the wobbly board and why Twilight stopped.",
        "why": "The wobbly board made Twilight worry about crossing safely."
      },
      {
        "id": "pony-2",
        "q": "What does “reluctant” mean in this story?",
        "opts": [
          "Excited and eager to hurry.",
          "Very angry with her friend.",
          "Unsure and not willing to act yet."
        ],
        "a": 2,
        "skill": "Vocabulary in context",
        "hint": "Twilight did not want to take another step until the bridge was checked.",
        "why": "Reluctant means unsure or unwilling to do something."
      }
    ]
  },
  {
    "id": "applejack",
    "name": "Applejack",
    "place": "Sweet Apple Acres",
    "color": "#e5ac64",
    "gem": "#efbd69",
    "emoji": "🍎",
    "skill": "Numbers & fractions",
    "story": "Applejack is preparing the festival picnic. She has 43 apple stickers for the invitations. Rarity is helping her cut ribbons into four equal lengths. Help them get everything ready and find a golden friendship gem!",
    "questions": [
      {
        "id": "pony-3",
        "q": "Applejack has 43 apple stickers. Which is another way to show 43?",
        "opts": [
          "3 tens and 13 ones",
          "4 tens and 13 ones",
          "3 tens and 3 ones"
        ],
        "a": 0,
        "skill": "Place value",
        "hint": "Three tens make 30. How many more ones make 43?",
        "why": "30 + 13 = 43. You can regroup 43 as 3 tens and 13 ones."
      },
      {
        "id": "pony-4",
        "q": "Rarity cuts each ribbon into four equal lengths. Which picture shows ONE QUARTER coloured purple?",
        "opts": [
          "Two of four equal parts",
          "Three of four equal parts",
          "One of four equal parts"
        ],
        "a": 2,
        "skill": "Length fractions",
        "hint": "One quarter means one out of four equal parts.",
        "why": "C has one of its four equal parts coloured purple.",
        "diagram": "ribbons",
        "context": "Each ribbon has four equal parts. A has two purple parts; B has three purple parts; C has one purple part."
      }
    ]
  },
  {
    "id": "rarity",
    "name": "Rarity",
    "place": "The rainbow ribbon shop",
    "color": "#a79bc8",
    "gem": "#8ec5d8",
    "emoji": "💎",
    "skill": "Patterns & shapes",
    "story": "Rarity is decorating a ribbon with gems. The gems repeat: purple, blue, blue. Purple, blue, blue! She also needs a special shape for the festival sign. Help her finish the decorations and find the next gem.",
    "questions": [
      {
        "id": "pony-5",
        "q": "What colour will the 10th gem be?",
        "opts": [
          "Purple",
          "Blue",
          "Green"
        ],
        "a": 0,
        "skill": "Patterns and reasoning",
        "hint": "Purple starts each group of three: positions 1, 4, 7…",
        "why": "The purple gems are at positions 1, 4, 7 and 10."
      },
      {
        "id": "pony-6",
        "q": "Which shape has four equal sides and four square corners?",
        "opts": [
          "A triangle",
          "A square",
          "A circle"
        ],
        "a": 1,
        "skill": "Shapes",
        "hint": "Look for four sides that are all the same length.",
        "why": "A square has four equal sides and four right-angle corners."
      }
    ]
  },
  {
    "id": "fluttershy",
    "name": "Fluttershy",
    "place": "The butterfly garden",
    "color": "#d5be77",
    "gem": "#edc5d5",
    "emoji": "🦋",
    "skill": "Data & grouping",
    "story": "Fluttershy asks her friends to vote for a festival activity. Each star in the picture graph means one vote. Four bunnies are also waiting for their carrot snack. Help Fluttershy read the votes and feed her friends!",
    "questions": [
      {
        "id": "pony-7",
        "q": "Look at the votes. Which statement is correct?",
        "opts": [
          "Cloud games received the fewest votes.",
          "Butterfly garden received more votes than apple picnic.",
          "All three activities received the same number of votes."
        ],
        "a": 0,
        "skill": "Reading data",
        "hint": "Compare 4, 6 and 3. Which is the smallest?",
        "why": "Cloud games has 3 votes, fewer than 4 or 6.",
        "diagram": "votes",
        "context": "Each star represents one vote. Butterfly garden: 4 votes. Apple picnic: 6 votes. Cloud games: 3 votes."
      },
      {
        "id": "pony-8",
        "q": "Four bunnies get 3 carrots each. How many carrots are needed?",
        "opts": [
          "7 carrots",
          "10 carrots",
          "12 carrots"
        ],
        "a": 2,
        "skill": "Multiplication",
        "hint": "Make four groups of three: 3 + 3 + 3 + 3.",
        "why": "Four groups of 3 make 12 carrots."
      }
    ]
  },
  {
    "id": "rainbow",
    "name": "Rainbow Dash",
    "place": "The cloud stepping stones",
    "color": "#76b8ce",
    "gem": "#95d8d0",
    "emoji": "🌈",
    "skill": "Position & spelling",
    "story": "Rainbow Dash has made a map of Ponyville. Find the party tent and look at the place just above it. Then help her finish a message to her friends!",
    "questions": [
      {
        "id": "pony-9",
        "q": "Which place is directly ABOVE the party tent?",
        "opts": [
          "The pond",
          "The butterfly garden",
          "Rarity’s shop"
        ],
        "a": 1,
        "skill": "Position on a map",
        "hint": "Find the party tent at the bottom right. Look one space up.",
        "why": "The butterfly garden is one space directly above the party tent.",
        "diagram": "map",
        "context": "Map, top row: Library, Cloud tower, Pond. Middle row: Applejack’s farm, Rarity’s shop, Butterfly garden. Bottom row: Bridge, Picnic area, Party tent."
      },
      {
        "id": "pony-10",
        "q": "“We can cross ___ our friends helped us.” Which spelling is correct?",
        "opts": [
          "becaus",
          "because",
          "becose"
        ],
        "a": 1,
        "skill": "Spelling",
        "hint": "The word is because: b-e-c-a-u-s-e.",
        "why": "Because is spelled b-e-c-a-u-s-e."
      }
    ]
  },
  {
    "id": "pinkie",
    "name": "Pinkie Pie",
    "place": "The Friendship Festival",
    "color": "#d796b8",
    "gem": "#eca3c6",
    "emoji": "🎈",
    "skill": "Grammar & time",
    "story": "Pinkie Pie has a surprise party ready for everypony! Yesterday, the ponies practised their dance. Today, the invitation says: “Friendship Festival — 3:30 PM.” There is just one more gem to find before the Friendship Star can shine again.",
    "questions": [
      {
        "id": "pony-11",
        "q": "“Yesterday, the ponies ___ together.” Which word fits?",
        "opts": [
          "dance",
          "danced",
          "dancing"
        ],
        "a": 1,
        "skill": "Grammar",
        "hint": "Yesterday tells us that the action happened in the past.",
        "why": "Danced tells us about a dance that already happened."
      },
      {
        "id": "pony-12",
        "q": "What time is half past three?",
        "opts": [
          "3:00 PM",
          "3:30 PM",
          "4:00 PM"
        ],
        "a": 1,
        "skill": "Reading time",
        "hint": "Half past means 30 minutes past the hour.",
        "why": "Half past three is 3:30 PM."
      }
    ]
  }
];const api={chapters,questions:chapters.flatMap(c=>c.questions)};root.PonyData=api;if(typeof module!=='undefined')module.exports=api;})(globalThis);
