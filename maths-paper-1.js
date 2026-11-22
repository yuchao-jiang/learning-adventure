// Approved original OC-style practice. Stable question IDs 21–55; never reuse historical IDs.
(function(root){
 const questions=[
  {
    "paperQuestion": 1,
    "paper": "maths-1",
    "topic": "Elapsed time",
    "q": "Sam starts a race at 2:00 pm and takes 135 seconds. Mia starts 20 seconds after Sam and takes 2 minutes 30 seconds to finish. How many seconds after Sam finishes does Mia finish?",
    "o": [
      "30 seconds",
      "35 seconds",
      "15 seconds",
      "20 seconds",
      "45 seconds"
    ],
    "a": 1,
    "why": "(35 seconds). Mia takes 150 seconds, 15 seconds longer than Sam. She also starts 20 seconds later, so she finishes 15 + 20 = 35 seconds after Sam."
  },
  {
    "paperQuestion": 2,
    "paper": "maths-1",
    "topic": "Changing rates",
    "q": "A factory makes 96 toys in 4 weeks at a steady rate. For the next 5 weeks, it makes 4 fewer toys each week than that original weekly rate. How many toys does it make over all 9 weeks?",
    "o": [
      "180",
      "200",
      "196",
      "176",
      "216"
    ],
    "a": 2,
    "why": "(196). The original rate is 96 ÷ 4 = 24 toys a week. The next five weeks produce 20 each: 5 × 20 = 100. Total: 96 + 100 = 196."
  },
  {
    "paperQuestion": 3,
    "paper": "maths-1",
    "topic": "Cubes",
    "q": "A small solid cube is built from 8 identical little cubes, with 2 along each edge. A larger solid cube is built from the same-sized little cubes. Its edge length is twice the small cube’s edge length. How many little cubes make the larger cube?",
    "o": [
      "64",
      "16",
      "32",
      "48",
      "24"
    ],
    "a": 0,
    "why": "(64). Doubling the edge length gives 4 little cubes along each edge. The solid cube contains 4 layers of 4 × 4 cubes: 4 × 4 × 4 = 64."
  },
  {
    "paperQuestion": 4,
    "paper": "maths-1",
    "topic": "Common multiples",
    "q": "Which number is greater than 40 and less than 80, and is divisible by 2, 3 and 7?",
    "o": [
      "48",
      "56",
      "70",
      "42",
      "63"
    ],
    "a": 3,
    "why": "(42). A number divisible by 2, 3 and 7 must be a multiple of 42. Only 42 lies between 40 and 80."
  },
  {
    "paperQuestion": 5,
    "paper": "maths-1",
    "topic": "Bricks and halves",
    "q": "The wall below is made from full bricks and half bricks. A full brick is 1 unit long; a half brick is 1/2 unit long. Counting two half bricks as one whole brick, how many whole bricks are represented in the two rows altogether?",
    "o": [
      "12",
      "15",
      "16",
      "13",
      "14"
    ],
    "a": 4,
    "why": "(14). The bottom row is 6 full bricks plus 2 halves (1 whole) = 7. The top row is 5 full bricks plus 4 halves (2 whole) = 7. 7 + 7 = 14.",
    "figure": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"660\" height=\"220\" viewBox=\"0 0 660 220\" role=\"img\" aria-label=\"Top row has five full bricks and four halves; bottom has six full and two halves.\"><rect width=\"100%\" height=\"100%\" fill=\"white\"/><g font-family=\"Arial,sans-serif\" font-size=\"18\" fill=\"#20334b\"><text x=\"20\" y=\"43\" >Top row</text><rect x=\"160\" y=\"15\" width=\"48\" height=\"48\" fill=\"#e4ebf5\" stroke=\"#26364a\" stroke-width=\"2\"/><rect x=\"208\" y=\"15\" width=\"48\" height=\"48\" fill=\"#e4ebf5\" stroke=\"#26364a\" stroke-width=\"2\"/><rect x=\"256\" y=\"15\" width=\"48\" height=\"48\" fill=\"#e4ebf5\" stroke=\"#26364a\" stroke-width=\"2\"/><rect x=\"304\" y=\"15\" width=\"48\" height=\"48\" fill=\"#e4ebf5\" stroke=\"#26364a\" stroke-width=\"2\"/><rect x=\"352\" y=\"15\" width=\"48\" height=\"48\" fill=\"#e4ebf5\" stroke=\"#26364a\" stroke-width=\"2\"/><rect x=\"400\" y=\"15\" width=\"24\" height=\"48\" fill=\"#e4ebf5\" stroke=\"#26364a\" stroke-width=\"2\"/><rect x=\"424\" y=\"15\" width=\"24\" height=\"48\" fill=\"#e4ebf5\" stroke=\"#26364a\" stroke-width=\"2\"/><rect x=\"448\" y=\"15\" width=\"24\" height=\"48\" fill=\"#e4ebf5\" stroke=\"#26364a\" stroke-width=\"2\"/><rect x=\"472\" y=\"15\" width=\"24\" height=\"48\" fill=\"#e4ebf5\" stroke=\"#26364a\" stroke-width=\"2\"/><text x=\"20\" y=\"133\" >Bottom row</text><rect x=\"160\" y=\"105\" width=\"48\" height=\"48\" fill=\"#e4ebf5\" stroke=\"#26364a\" stroke-width=\"2\"/><rect x=\"208\" y=\"105\" width=\"48\" height=\"48\" fill=\"#e4ebf5\" stroke=\"#26364a\" stroke-width=\"2\"/><rect x=\"256\" y=\"105\" width=\"48\" height=\"48\" fill=\"#e4ebf5\" stroke=\"#26364a\" stroke-width=\"2\"/><rect x=\"304\" y=\"105\" width=\"48\" height=\"48\" fill=\"#e4ebf5\" stroke=\"#26364a\" stroke-width=\"2\"/><rect x=\"352\" y=\"105\" width=\"48\" height=\"48\" fill=\"#e4ebf5\" stroke=\"#26364a\" stroke-width=\"2\"/><rect x=\"400\" y=\"105\" width=\"48\" height=\"48\" fill=\"#e4ebf5\" stroke=\"#26364a\" stroke-width=\"2\"/><rect x=\"448\" y=\"105\" width=\"24\" height=\"48\" fill=\"#e4ebf5\" stroke=\"#26364a\" stroke-width=\"2\"/><rect x=\"472\" y=\"105\" width=\"24\" height=\"48\" fill=\"#e4ebf5\" stroke=\"#26364a\" stroke-width=\"2\"/><text x=\"160\" y=\"193\" >Full brick: 1 unit. Half brick: 1/2 unit.</text></g></svg>"
  },
  {
    "paperQuestion": 6,
    "paper": "maths-1",
    "topic": "Turning shapes",
    "q": "The two identical L-shaped pieces shown are each made of three equal squares. You may turn the pieces. Join them along their edges without overlapping to make a rectangle. What are the rectangle’s dimensions, in small-square units?",
    "o": [
      "2 by 2",
      "2 by 4",
      "3 by 4",
      "2 by 3",
      "3 by 3"
    ],
    "a": 3,
    "why": "(2 by 3). Two L pieces of 3 squares make 6 squares altogether, and they fit together edge to edge to form a 2 by 3 rectangle.",
    "figure": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"570\" height=\"195\" viewBox=\"0 0 570 195\" role=\"img\" aria-label=\"Two identical L-shaped pieces of three squares each.\"><rect width=\"100%\" height=\"100%\" fill=\"white\"/><g font-family=\"Arial,sans-serif\" font-size=\"18\" fill=\"#20334b\"><text x=\"75\" y=\"30\" >Piece 1</text><rect x=\"75\" y=\"55\" width=\"55\" height=\"55\" fill=\"#b9cbe7\" stroke=\"#26364a\" stroke-width=\"2\"/><rect x=\"75\" y=\"110\" width=\"55\" height=\"55\" fill=\"#b9cbe7\" stroke=\"#26364a\" stroke-width=\"2\"/><rect x=\"130\" y=\"110\" width=\"55\" height=\"55\" fill=\"#b9cbe7\" stroke=\"#26364a\" stroke-width=\"2\"/><text x=\"335\" y=\"30\" >Piece 2</text><rect x=\"335\" y=\"55\" width=\"55\" height=\"55\" fill=\"#b9cbe7\" stroke=\"#26364a\" stroke-width=\"2\"/><rect x=\"335\" y=\"110\" width=\"55\" height=\"55\" fill=\"#b9cbe7\" stroke=\"#26364a\" stroke-width=\"2\"/><rect x=\"390\" y=\"110\" width=\"55\" height=\"55\" fill=\"#b9cbe7\" stroke=\"#26364a\" stroke-width=\"2\"/></g></svg>"
  },
  {
    "paperQuestion": 7,
    "paper": "maths-1",
    "topic": "Sorting shapes",
    "q": "In the Venn diagram, Circle A contains shapes with straight sides and Circle B contains red shapes. Remove every shape in the overlap. Which shapes remain in Circle A?",
    "o": [
      "Blue triangle and green square",
      "Red triangle, red square and red pentagon",
      "Red triangle and red square",
      "Red circle",
      "Blue triangle only"
    ],
    "a": 0,
    "why": "(blue triangle and green square). Removing the 3 shapes in the overlap leaves only the shapes that were in Circle A alone: the blue triangle and the green square.",
    "figure": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"650\" height=\"315\" viewBox=\"0 0 650 315\" role=\"img\" aria-label=\"A only: blue triangle and green square. Overlap: red triangle, square and pentagon. B only: red circle.\"><rect width=\"100%\" height=\"100%\" fill=\"white\"/><g font-family=\"Arial,sans-serif\" font-size=\"18\" fill=\"#20334b\"><ellipse cx=\"215\" cy=\"170\" rx=\"175\" ry=\"120\" fill=\"#eef4ff\" stroke=\"#344967\" stroke-width=\"2\"/><ellipse cx=\"415\" cy=\"170\" rx=\"175\" ry=\"120\" fill=\"#fff2f2\" fill-opacity=\".55\" stroke=\"#344967\" stroke-width=\"2\"/><text x=\"65\" y=\"30\" >A: straight sides</text><text x=\"420\" y=\"30\" >B: red shapes</text><polygon points=\"120,111 101,146 139,146\" fill=\"#3b73c2\" stroke=\"#26364a\" stroke-width=\"2\"/><rect x=\"140\" y=\"200\" width=\"35\" height=\"35\" fill=\"#43985d\" stroke=\"#26364a\" stroke-width=\"2\"/><polygon points=\"315,87 296,122 334,122\" fill=\"#c84343\" stroke=\"#26364a\" stroke-width=\"2\"/><rect x=\"298\" y=\"151\" width=\"35\" height=\"35\" fill=\"#c84343\" stroke=\"#26364a\" stroke-width=\"2\"/><polygon points=\"315,208 334.9721868421982,222.5106431181261 327.34349029814194,245.9893568818739 302.65650970185806,245.9893568818739 295.0278131578018,222.5106431181261\" fill=\"#c84343\" stroke=\"#26364a\" stroke-width=\"2\"/><circle cx=\"510\" cy=\"170\" r=\"22\" fill=\"#c84343\" stroke=\"#26364a\" stroke-width=\"2\"/></g></svg>"
  },
  {
    "paperQuestion": 8,
    "paper": "maths-1",
    "topic": "Counting numbers",
    "q": "A book has pages numbered 1 to 75. How many different page numbers contain the digit 5 at least once?",
    "o": [
      "20",
      "18",
      "25",
      "16",
      "17"
    ],
    "a": 4,
    "why": "(17). There are ten page numbers from 50 to 59. Outside that group, 5, 15, 25, 35, 45, 65 and 75 add seven more. Total: 17. Page 55 is counted only once."
  },
  {
    "paperQuestion": 9,
    "paper": "maths-1",
    "topic": "Fractions of amounts",
    "q": "A baker normally bakes 36 loaves a day. On Sunday he bakes only three quarters of that number. How many loaves does he bake from Monday to Sunday, including both days?",
    "o": [
      "252",
      "270",
      "216",
      "189",
      "243"
    ],
    "a": 4,
    "why": "(243). Monday to Saturday: 6 × 36 = 216. Sunday: 3/4 of 36 = 27. Total: 216 + 27 = 243."
  },
  {
    "paperQuestion": 10,
    "paper": "maths-1",
    "topic": "Reading a graph",
    "q": "The bar chart shows the goals scored by seven players. Which statement is correct?",
    "o": [
      "At least four players scored more than 6 goals.",
      "The highest score is four times the lowest score.",
      "Exactly three players scored more than 6 goals.",
      "Twice as many players scored 6 or more goals as scored fewer than 6 goals.",
      "The difference between the highest and lowest scores is 8 goals."
    ],
    "a": 2,
    "why": "(Exactly three players scored more than 6 goals). The scores are 8, 2, 12, 5, 9, 3 and 6. Only 8, 12 and 9 are greater than 6. There are four scores of 6 or more and three below 6. The highest score is six times the lowest, and their difference is 10.",
    "figure": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"640\" height=\"375\" viewBox=\"0 0 640 375\" role=\"img\" aria-label=\"Goals for players A to G are 8, 2, 12, 5, 9, 3, 6.\"><rect width=\"100%\" height=\"100%\" fill=\"white\"/><g font-family=\"Arial,sans-serif\" font-size=\"18\" fill=\"#20334b\"><text x=\"20\" y=\"22\" >Goals</text><line x1=\"55\" y1=\"295\" x2=\"590\" y2=\"295\" stroke=\"#26364a\" stroke-width=\"3\" stroke-opacity=\".15\"/><text x=\"42\" y=\"300\" text-anchor=\"end\">0</text><line x1=\"55\" y1=\"255\" x2=\"590\" y2=\"255\" stroke=\"#26364a\" stroke-width=\"3\" stroke-opacity=\".15\"/><text x=\"42\" y=\"260\" text-anchor=\"end\">2</text><line x1=\"55\" y1=\"215\" x2=\"590\" y2=\"215\" stroke=\"#26364a\" stroke-width=\"3\" stroke-opacity=\".15\"/><text x=\"42\" y=\"220\" text-anchor=\"end\">4</text><line x1=\"55\" y1=\"175\" x2=\"590\" y2=\"175\" stroke=\"#26364a\" stroke-width=\"3\" stroke-opacity=\".15\"/><text x=\"42\" y=\"180\" text-anchor=\"end\">6</text><line x1=\"55\" y1=\"135\" x2=\"590\" y2=\"135\" stroke=\"#26364a\" stroke-width=\"3\" stroke-opacity=\".15\"/><text x=\"42\" y=\"140\" text-anchor=\"end\">8</text><line x1=\"55\" y1=\"95\" x2=\"590\" y2=\"95\" stroke=\"#26364a\" stroke-width=\"3\" stroke-opacity=\".15\"/><text x=\"42\" y=\"100\" text-anchor=\"end\">10</text><line x1=\"55\" y1=\"55\" x2=\"590\" y2=\"55\" stroke=\"#26364a\" stroke-width=\"3\" stroke-opacity=\".15\"/><text x=\"42\" y=\"60\" text-anchor=\"end\">12</text><line x1=\"55\" y1=\"55\" x2=\"55\" y2=\"295\" stroke=\"#26364a\" stroke-width=\"3\" /><line x1=\"55\" y1=\"295\" x2=\"590\" y2=\"295\" stroke=\"#26364a\" stroke-width=\"3\" /><rect x=\"80\" y=\"135\" width=\"42\" height=\"160\" fill=\"#6e91c4\" stroke=\"#26364a\" stroke-width=\"2\"/><text x=\"101\" y=\"322\" text-anchor=\"middle\">A</text><rect x=\"150\" y=\"255\" width=\"42\" height=\"40\" fill=\"#6e91c4\" stroke=\"#26364a\" stroke-width=\"2\"/><text x=\"171\" y=\"322\" text-anchor=\"middle\">B</text><rect x=\"220\" y=\"55\" width=\"42\" height=\"240\" fill=\"#6e91c4\" stroke=\"#26364a\" stroke-width=\"2\"/><text x=\"241\" y=\"322\" text-anchor=\"middle\">C</text><rect x=\"290\" y=\"195\" width=\"42\" height=\"100\" fill=\"#6e91c4\" stroke=\"#26364a\" stroke-width=\"2\"/><text x=\"311\" y=\"322\" text-anchor=\"middle\">D</text><rect x=\"360\" y=\"115\" width=\"42\" height=\"180\" fill=\"#6e91c4\" stroke=\"#26364a\" stroke-width=\"2\"/><text x=\"381\" y=\"322\" text-anchor=\"middle\">E</text><rect x=\"430\" y=\"235\" width=\"42\" height=\"60\" fill=\"#6e91c4\" stroke=\"#26364a\" stroke-width=\"2\"/><text x=\"451\" y=\"322\" text-anchor=\"middle\">F</text><rect x=\"500\" y=\"175\" width=\"42\" height=\"120\" fill=\"#6e91c4\" stroke=\"#26364a\" stroke-width=\"2\"/><text x=\"521\" y=\"322\" text-anchor=\"middle\">G</text><text x=\"260\" y=\"353\" >Player</text></g></svg>"
  },
  {
    "paperQuestion": 11,
    "paper": "maths-1",
    "topic": "Reading a table",
    "q": "How many child tickets did the two classes sell altogether?",
    "o": [
      "24",
      "27",
      "26",
      "28",
      "25"
    ],
    "a": 1,
    "why": "(27). Child tickets: 18 + 9 = 27.",
    "context": "Class A: 12 adult tickets and 18 child tickets. Class B: 15 adult tickets and 9 child tickets.",
    "figure": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 600 190\" role=\"img\" aria-label=\"Ticket table. Class A: 12 adult tickets, 18 child tickets. Class B: 15 adult tickets, 9 child tickets.\"><rect width=\"600\" height=\"190\" fill=\"white\"/><g font-family=\"Arial\" font-size=\"21\" text-anchor=\"middle\" fill=\"#24354b\"><text x=\"70\" y=\"35\">Class</text><text x=\"255\" y=\"35\">Adult tickets</text><text x=\"455\" y=\"35\">Child tickets</text><text x=\"70\" y=\"95\">A</text><text x=\"255\" y=\"95\">12</text><text x=\"455\" y=\"95\">18</text><text x=\"70\" y=\"155\">B</text><text x=\"255\" y=\"155\">15</text><text x=\"455\" y=\"155\">9</text></g><path d=\"M10 50H590M10 110H590M10 170H590\" stroke=\"#64748b\"/></svg>"
  },
  {
    "paperQuestion": 12,
    "paper": "maths-1",
    "topic": "Ticket money",
    "q": "Use the table for Questions 11–12. An adult ticket costs $8 and a child ticket costs $5. Class A refunds 3 of its child tickets; Class B refunds none. After the refunds, how much more ticket money does Class A have than Class B?",
    "o": [
      "$24",
      "$15",
      "$36",
      "$21",
      "$6"
    ],
    "a": 4,
    "why": "($6). Class A originally received 12 × $8 + 18 × $5 = $186. Refunding three child tickets leaves $171. Class B received 15 × $8 + 9 × $5 = $165. Difference: $6.",
    "context": "Class A: 12 adult tickets and 18 child tickets. Class B: 15 adult tickets and 9 child tickets.",
    "figure": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 600 190\" role=\"img\" aria-label=\"Ticket table. Class A: 12 adult tickets, 18 child tickets. Class B: 15 adult tickets, 9 child tickets.\"><rect width=\"600\" height=\"190\" fill=\"white\"/><g font-family=\"Arial\" font-size=\"21\" text-anchor=\"middle\" fill=\"#24354b\"><text x=\"70\" y=\"35\">Class</text><text x=\"255\" y=\"35\">Adult tickets</text><text x=\"455\" y=\"35\">Child tickets</text><text x=\"70\" y=\"95\">A</text><text x=\"255\" y=\"95\">12</text><text x=\"455\" y=\"95\">18</text><text x=\"70\" y=\"155\">B</text><text x=\"255\" y=\"155\">15</text><text x=\"455\" y=\"155\">9</text></g><path d=\"M10 50H590M10 110H590M10 170H590\" stroke=\"#64748b\"/></svg>"
  },
  {
    "paperQuestion": 13,
    "paper": "maths-1",
    "topic": "Multiples",
    "q": "How many whole numbers are greater than 25 and less than 50, are multiples of 3, but are not multiples of 6?",
    "o": [
      "4",
      "5",
      "6",
      "8",
      "3"
    ],
    "a": 0,
    "why": "(4). The qualifying numbers are 27, 33, 39 and 45. The other multiples of 3 in the interval—30, 36, 42 and 48—are also multiples of 6."
  },
  {
    "paperQuestion": 14,
    "paper": "maths-1",
    "topic": "Possible outcomes",
    "q": "Mia rolls a die numbered 1 to 6 and flips a coin. She wins if she gets an even number with heads OR an odd number with tails. How many different winning outcomes are there?",
    "o": [
      "8",
      "3",
      "6",
      "4",
      "9"
    ],
    "a": 2,
    "why": "(6). Even with heads gives (2,H), (4,H), (6,H). Odd with tails gives (1,T), (3,T), (5,T). There are six different winning outcomes."
  },
  {
    "paperQuestion": 15,
    "paper": "maths-1",
    "topic": "Angles on a clock",
    "q": "The clock shows 3:15. The hour hand moves continuously as time passes. What kind of angle is the smaller angle between the hour and minute hands?",
    "o": [
      "Straight angle",
      "Obtuse angle",
      "Right angle",
      "Acute angle",
      "Reflex angle"
    ],
    "a": 3,
    "why": "(acute angle). At 3:15 the minute hand points at the 3 and the hour hand is just past the 3, so the angle between them is small — an acute angle.",
    "figure": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"650\" height=\"340\" viewBox=\"0 0 650 340\" role=\"img\" aria-label=\"Clock at 3:15 with the hour hand slightly past 3.\"><rect width=\"100%\" height=\"100%\" fill=\"white\"/><g font-family=\"Arial,sans-serif\" font-size=\"18\" fill=\"#20334b\"><circle cx=\"195\" cy=\"175\" r=\"135\" fill=\"white\" stroke=\"#26364a\" stroke-width=\"3\"/><text x=\"251\" y=\"85.00515477614287\" text-anchor=\"middle\">1</text><text x=\"291.99484522385717\" y=\"126\" text-anchor=\"middle\">2</text><text x=\"307\" y=\"182\" text-anchor=\"middle\">3</text><text x=\"291.99484522385717\" y=\"238\" text-anchor=\"middle\">4</text><text x=\"251\" y=\"278.9948452238571\" text-anchor=\"middle\">5</text><text x=\"195\" y=\"294\" text-anchor=\"middle\">6</text><text x=\"139.00000000000003\" y=\"278.99484522385717\" text-anchor=\"middle\">7</text><text x=\"98.00515477614286\" y=\"238\" text-anchor=\"middle\">8</text><text x=\"83\" y=\"182\" text-anchor=\"middle\">9</text><text x=\"98.00515477614287\" y=\"125.99999999999999\" text-anchor=\"middle\">10</text><text x=\"138.99999999999994\" y=\"85.0051547761429\" text-anchor=\"middle\">11</text><text x=\"194.99999999999997\" y=\"70\" text-anchor=\"middle\">12</text><line x1=\"195\" y1=\"175\" x2=\"319\" y2=\"175\" stroke=\"#26364a\" stroke-width=\"3\" /><line x1=\"195\" y1=\"175\" x2=\"280.2642580781477\" y2=\"186.22525253092442\" stroke=\"#26364a\" stroke-width=\"3\" /><circle cx=\"195\" cy=\"175\" r=\"6\" fill=\"#26364a\"/><text x=\"405\" y=\"120\" >3:15</text><text x=\"405\" y=\"160\" >Long hand: minutes</text><text x=\"405\" y=\"195\" >Short hand: hours</text></g></svg>"
  },
  {
    "paperQuestion": 16,
    "paper": "maths-1",
    "topic": "Money combinations",
    "q": "What is the smallest number of notes needed to make exactly $90 using only $50, $20 and $10 notes, if at least one of each kind must be used?",
    "o": [
      "5",
      "4",
      "9",
      "3",
      "6"
    ],
    "a": 1,
    "why": "(4 notes). One of each kind totals $80 using three notes. One more $10 note makes $90. Three notes cannot satisfy both the total and the one-of-each rule."
  },
  {
    "paperQuestion": 17,
    "paper": "maths-1",
    "topic": "Books in a library",
    "q": "A library had 2,450 books. It bought 1,380 more, then gave away 965. It now wants to have exactly 3,000 books. How many more books does it need to buy?",
    "o": [
      "965",
      "145",
      "235",
      "135",
      "35"
    ],
    "a": 3,
    "why": "(135). It now has 2,450 + 1,380 − 965 = 2,865 books. It needs 3,000 − 2,865 = 135 more."
  },
  {
    "paperQuestion": 18,
    "paper": "maths-1",
    "topic": "Number lines",
    "q": "The marks on the number line are equally spaced. A second dot is placed 0.3 to the right of the dot shown. What number does the second dot show?",
    "o": [
      "3.4",
      "2.7",
      "2.1",
      "2.43",
      "5.4"
    ],
    "a": 1,
    "why": "(2.7). Ten equal intervals span 2.0 to 3.0, so each interval is 0.1. The shown dot is at 2.4. Add 0.3 to get 2.7.",
    "figure": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"650\" height=\"180\" viewBox=\"0 0 650 180\" role=\"img\" aria-label=\"Ten equal intervals between 2.0 and 3.0. The marked dot is at 2.4.\"><rect width=\"100%\" height=\"100%\" fill=\"white\"/><g font-family=\"Arial,sans-serif\" font-size=\"18\" fill=\"#20334b\"><line x1=\"55\" y1=\"100\" x2=\"605\" y2=\"100\" stroke=\"#26364a\" stroke-width=\"3\" /><polygon points=\"605,100 593,94 593,106\" fill=\"#26364a\"/><line x1=\"65\" y1=\"86\" x2=\"65\" y2=\"114\" stroke=\"#26364a\" stroke-width=\"3\" /><line x1=\"115\" y1=\"86\" x2=\"115\" y2=\"114\" stroke=\"#26364a\" stroke-width=\"3\" /><line x1=\"165\" y1=\"86\" x2=\"165\" y2=\"114\" stroke=\"#26364a\" stroke-width=\"3\" /><line x1=\"215\" y1=\"86\" x2=\"215\" y2=\"114\" stroke=\"#26364a\" stroke-width=\"3\" /><line x1=\"265\" y1=\"86\" x2=\"265\" y2=\"114\" stroke=\"#26364a\" stroke-width=\"3\" /><line x1=\"315\" y1=\"86\" x2=\"315\" y2=\"114\" stroke=\"#26364a\" stroke-width=\"3\" /><line x1=\"365\" y1=\"86\" x2=\"365\" y2=\"114\" stroke=\"#26364a\" stroke-width=\"3\" /><line x1=\"415\" y1=\"86\" x2=\"415\" y2=\"114\" stroke=\"#26364a\" stroke-width=\"3\" /><line x1=\"465\" y1=\"86\" x2=\"465\" y2=\"114\" stroke=\"#26364a\" stroke-width=\"3\" /><line x1=\"515\" y1=\"86\" x2=\"515\" y2=\"114\" stroke=\"#26364a\" stroke-width=\"3\" /><line x1=\"565\" y1=\"86\" x2=\"565\" y2=\"114\" stroke=\"#26364a\" stroke-width=\"3\" /><text x=\"65\" y=\"149\" text-anchor=\"middle\">2.0</text><text x=\"565\" y=\"149\" text-anchor=\"middle\">3.0</text><circle cx=\"265\" cy=\"100\" r=\"8\" fill=\"#26364a\"/></g></svg>"
  },
  {
    "paperQuestion": 19,
    "paper": "maths-1",
    "topic": "Sharing ages",
    "q": "Tom is three times as old as his sister. Their ages add to 20 years. How old is Tom?",
    "o": [
      "12 years",
      "15 years",
      "5 years",
      "16 years",
      "18 years"
    ],
    "a": 1,
    "why": "(15 years). Think of his sister’s age as one equal part and Tom’s age as three equal parts. Four parts total 20 years, so one part is 5 years. Tom is 3 × 5 = 15 years old."
  },
  {
    "paperQuestion": 20,
    "paper": "maths-1",
    "topic": "Odd and even",
    "q": "Three whole numbers have an odd total. Which of these groups could NOT be the three numbers?",
    "o": [
      "2, 4 and 7",
      "1, 3 and 5",
      "3, 6 and 8",
      "2, 4 and 6",
      "4, 5 and 8"
    ],
    "a": 3,
    "why": "(2, 4 and 6). Their sum is 12, which is even. The other groups sum to 9, 13, 17 and 17, all odd. Three even numbers cannot have an odd total."
  },
  {
    "paperQuestion": 21,
    "paper": "maths-1",
    "topic": "Price per kilogram",
    "q": "A box filled with 6 kg of apples costs $14. The empty box costs $2. The same apples are sold at the same price per kilogram in 3 kg bags, with each empty bag costing 50 cents. What does one filled 3 kg bag cost?",
    "o": [
      "$7",
      "$6.50",
      "$8",
      "$7.50",
      "$6"
    ],
    "a": 1,
    "why": "($6.50). Six kilograms of apples cost $14 − $2 = $12, so the apples cost $2 per kilogram. Three kilograms cost $6. Add 50 cents for the bag."
  },
  {
    "paperQuestion": 22,
    "paper": "maths-1",
    "topic": "Area and perimeter",
    "q": "Four identical squares are joined edge to edge in a single straight row, as shown. Their total area is 100 cm². What is the perimeter of the whole row?",
    "o": [
      "100 cm",
      "50 cm",
      "40 cm",
      "60 cm",
      "20 cm"
    ],
    "a": 1,
    "why": "(50 cm). Each square has area 100 ÷ 4 = 25 cm², so its side is 5 cm. The row is 20 cm by 5 cm. Its perimeter is 2 × (20 + 5) = 50 cm.",
    "figure": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"590\" height=\"240\" viewBox=\"0 0 590 240\" role=\"img\" aria-label=\"Four equal squares in one straight row. Total area one hundred square centimetres.\"><rect width=\"100%\" height=\"100%\" fill=\"white\"/><g font-family=\"Arial,sans-serif\" font-size=\"18\" fill=\"#20334b\"><rect x=\"60\" y=\"45\" width=\"115\" height=\"115\" fill=\"#eaf0f8\" stroke=\"#26364a\" stroke-width=\"2\"/><rect x=\"175\" y=\"45\" width=\"115\" height=\"115\" fill=\"#eaf0f8\" stroke=\"#26364a\" stroke-width=\"2\"/><rect x=\"290\" y=\"45\" width=\"115\" height=\"115\" fill=\"#eaf0f8\" stroke=\"#26364a\" stroke-width=\"2\"/><rect x=\"405\" y=\"45\" width=\"115\" height=\"115\" fill=\"#eaf0f8\" stroke=\"#26364a\" stroke-width=\"2\"/><text x=\"155\" y=\"205\" >Total area = 100 cm²</text></g></svg>"
  },
  {
    "paperQuestion": 23,
    "paper": "maths-1",
    "topic": "Right angles",
    "q": "Look at the line drawings of the digits 1, 4 and 7. Count square corners where lines meet; at a T-junction, count both right angles. Which pair of digits has the greatest total number of right angles?",
    "o": [
      "4 and 4",
      "1 and 4",
      "7 and 7",
      "1 and 7",
      "4 and 7"
    ],
    "a": 0,
    "why": "(4 and 4). Digit 4 has 3 right angles, so two 4s have 3 + 3 = 6, more than 1 and 4 (3), 4 and 7 (4), 1 and 7 (1), or 7 and 7 (2).",
    "figure": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"630\" height=\"255\" viewBox=\"0 0 630 255\" role=\"img\" aria-label=\"Line digits 1, 4 and 7. Digit 4 includes a T-junction.\"><rect width=\"100%\" height=\"100%\" fill=\"white\"/><g font-family=\"Arial,sans-serif\" font-size=\"18\" fill=\"#20334b\"><line x1=\"115\" y1=\"45\" x2=\"115\" y2=\"180\" stroke=\"#26364a\" stroke-width=\"3\" /><line x1=\"260\" y1=\"45\" x2=\"260\" y2=\"112\" stroke=\"#26364a\" stroke-width=\"3\" /><line x1=\"260\" y1=\"112\" x2=\"330\" y2=\"112\" stroke=\"#26364a\" stroke-width=\"3\" /><line x1=\"330\" y1=\"45\" x2=\"330\" y2=\"180\" stroke=\"#26364a\" stroke-width=\"3\" /><line x1=\"440\" y1=\"45\" x2=\"520\" y2=\"45\" stroke=\"#26364a\" stroke-width=\"3\" /><line x1=\"520\" y1=\"45\" x2=\"520\" y2=\"180\" stroke=\"#26364a\" stroke-width=\"3\" /><text x=\"115\" y=\"225\" text-anchor=\"middle\">Digit 1</text><text x=\"295\" y=\"225\" text-anchor=\"middle\">Digit 4</text><text x=\"480\" y=\"225\" text-anchor=\"middle\">Digit 7</text></g></svg>"
  },
  {
    "paperQuestion": 24,
    "paper": "maths-1",
    "topic": "Minimum quantities",
    "q": "A crate holds 6 apples and 4 oranges. Each of 10 children must get at least 2 apples and 1 orange. What is the smallest number of crates needed?",
    "o": [
      "2",
      "6",
      "5",
      "3",
      "4"
    ],
    "a": 4,
    "why": "(4 crates). 10 children need 20 apples and 10 oranges. 3 crates give only 18 apples, but 4 crates give 24 apples and 16 oranges, which is enough."
  },
  {
    "paperQuestion": 25,
    "paper": "maths-1",
    "topic": "Special offers",
    "q": "A 250 mL bottle of juice costs $2. For every group of 3 bottles bought together, only 2 bottles are charged; any remaining bottles cost the usual price. What is the lowest cost of buying at least 2 litres of juice?",
    "o": [
      "$10",
      "$12",
      "$14",
      "$18",
      "$16"
    ],
    "a": 1,
    "why": "($12). Two litres needs eight bottles. Two groups of three cost $8; two extra bottles cost $4, total $12. Nine bottles also cost $12. Fewer than eight bottles do not supply two litres."
  },
  {
    "paperQuestion": 26,
    "paper": "maths-1",
    "topic": "Fraction sequences",
    "q": "The pattern continues by adding the same amount each time: 1/4, 1/2, 3/4, 1, ... . Which term is the first to be greater than 2?",
    "o": [
      "9th",
      "10th",
      "12th",
      "7th",
      "8th"
    ],
    "a": 0,
    "why": "(9th). Each term adds 1/4. The 8th term is 8/4 = 2. The 9th term is 9/4 = 2 1/4, the first greater than 2."
  },
  {
    "paperQuestion": 27,
    "paper": "maths-1",
    "topic": "Directions",
    "q": "North is towards the top of the grid. Zoe starts at X. She walks 20 m north, 30 m east, 10 m south, then 30 m west. How far is she from X at the end?",
    "o": [
      "0 m",
      "20 m",
      "10 m",
      "30 m",
      "90 m"
    ],
    "a": 2,
    "why": "(10 m). The 30 m east and 30 m west cancel out. Walking 20 m north and 10 m south leaves Zoe 10 m north of X. The question asks her final distance from X, not the total distance walked.",
    "figure": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"600\" height=\"420\" viewBox=\"0 0 600 420\"><rect width=\"600\" height=\"420\" fill=\"white\"/><g stroke=\"#9ca3af\" stroke-width=\"1\"><path d=\"M100 70V370\"/><path d=\"M150 70V370\"/><path d=\"M200 70V370\"/><path d=\"M250 70V370\"/><path d=\"M300 70V370\"/><path d=\"M350 70V370\"/><path d=\"M400 70V370\"/><path d=\"M450 70V370\"/><path d=\"M100 70H450\"/><path d=\"M100 120H450\"/><path d=\"M100 170H450\"/><path d=\"M100 220H450\"/><path d=\"M100 270H450\"/><path d=\"M100 320H450\"/><path d=\"M100 370H450\"/></g><g font-family=\"Arial\" font-size=\"22\" fill=\"#172554\"><text x=\"190\" y=\"330\">X</text><text x=\"495\" y=\"80\">N</text><path d=\"M505 145V95l-8 12m8-12 8 12\" fill=\"none\" stroke=\"#172554\" stroke-width=\"3\"/><text x=\"130\" y=\"405\">Each grid square is 10 m wide.</text></g></svg>"
  },
  {
    "paperQuestion": 28,
    "paper": "maths-1",
    "topic": "Reflection",
    "q": "The dashed line is a mirror line. Four squares are already shaded. Which TWO extra squares must be shaded so that the whole pattern is symmetrical across this line?",
    "o": [
      "D3 and E4",
      "E2 and D1",
      "B1 and C4",
      "E3 and D4",
      "F3 and E4"
    ],
    "a": 3,
    "why": "(E3 and D4). Across the vertical mirror line, columns A and F pair up, B and E pair up, and C and D pair up. A1 and F1 already match. B3 needs E3, and C4 needs D4. Reflected squares stay in the same row.",
    "figure": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"600\" height=\"370\" viewBox=\"0 0 600 370\"><rect width=\"600\" height=\"370\" fill=\"white\"/><g font-family=\"Arial\" font-size=\"22\" text-anchor=\"middle\"><text x=\"135\" y=\"55\">A</text><rect x=\"108\" y=\"75\" width=\"55\" height=\"55\" fill=\"#475569\" stroke=\"#64748b\"/><rect x=\"108\" y=\"130\" width=\"55\" height=\"55\" fill=\"white\" stroke=\"#64748b\"/><rect x=\"108\" y=\"185\" width=\"55\" height=\"55\" fill=\"white\" stroke=\"#64748b\"/><rect x=\"108\" y=\"240\" width=\"55\" height=\"55\" fill=\"white\" stroke=\"#64748b\"/><text x=\"190\" y=\"55\">B</text><rect x=\"163\" y=\"75\" width=\"55\" height=\"55\" fill=\"white\" stroke=\"#64748b\"/><rect x=\"163\" y=\"130\" width=\"55\" height=\"55\" fill=\"white\" stroke=\"#64748b\"/><rect x=\"163\" y=\"185\" width=\"55\" height=\"55\" fill=\"#475569\" stroke=\"#64748b\"/><rect x=\"163\" y=\"240\" width=\"55\" height=\"55\" fill=\"white\" stroke=\"#64748b\"/><text x=\"245\" y=\"55\">C</text><rect x=\"218\" y=\"75\" width=\"55\" height=\"55\" fill=\"white\" stroke=\"#64748b\"/><rect x=\"218\" y=\"130\" width=\"55\" height=\"55\" fill=\"white\" stroke=\"#64748b\"/><rect x=\"218\" y=\"185\" width=\"55\" height=\"55\" fill=\"white\" stroke=\"#64748b\"/><rect x=\"218\" y=\"240\" width=\"55\" height=\"55\" fill=\"#475569\" stroke=\"#64748b\"/><text x=\"300\" y=\"55\">D</text><rect x=\"273\" y=\"75\" width=\"55\" height=\"55\" fill=\"white\" stroke=\"#64748b\"/><rect x=\"273\" y=\"130\" width=\"55\" height=\"55\" fill=\"white\" stroke=\"#64748b\"/><rect x=\"273\" y=\"185\" width=\"55\" height=\"55\" fill=\"white\" stroke=\"#64748b\"/><rect x=\"273\" y=\"240\" width=\"55\" height=\"55\" fill=\"white\" stroke=\"#64748b\"/><text x=\"355\" y=\"55\">E</text><rect x=\"328\" y=\"75\" width=\"55\" height=\"55\" fill=\"white\" stroke=\"#64748b\"/><rect x=\"328\" y=\"130\" width=\"55\" height=\"55\" fill=\"white\" stroke=\"#64748b\"/><rect x=\"328\" y=\"185\" width=\"55\" height=\"55\" fill=\"white\" stroke=\"#64748b\"/><rect x=\"328\" y=\"240\" width=\"55\" height=\"55\" fill=\"white\" stroke=\"#64748b\"/><text x=\"410\" y=\"55\">F</text><rect x=\"383\" y=\"75\" width=\"55\" height=\"55\" fill=\"#475569\" stroke=\"#64748b\"/><rect x=\"383\" y=\"130\" width=\"55\" height=\"55\" fill=\"white\" stroke=\"#64748b\"/><rect x=\"383\" y=\"185\" width=\"55\" height=\"55\" fill=\"white\" stroke=\"#64748b\"/><rect x=\"383\" y=\"240\" width=\"55\" height=\"55\" fill=\"white\" stroke=\"#64748b\"/><text x=\"80\" y=\"110\">1</text><text x=\"80\" y=\"165\">2</text><text x=\"80\" y=\"220\">3</text><text x=\"80\" y=\"275\">4</text><path d=\"M273 65V307\" stroke=\"#b91c1c\" stroke-width=\"3\" stroke-dasharray=\"8 6\"/><text x=\"273\" y=\"340\" fill=\"#b91c1c\">Mirror line</text></g></svg>"
  },
  {
    "paperQuestion": 29,
    "paper": "maths-1",
    "topic": "Consecutive numbers",
    "q": "Three consecutive whole numbers add up in pairs: the first two add to 15, and the last two add to 17. What is the lowest of the three numbers?",
    "o": [
      "9",
      "5",
      "8",
      "6",
      "7"
    ],
    "a": 4,
    "why": "(7). Let the numbers be n, n+1 and n+2. n + (n+1) = 15 gives 2n = 14, so n = 7. Check: 8 + 9 = 17."
  },
  {
    "paperQuestion": 30,
    "paper": "maths-1",
    "topic": "Fractions of shapes",
    "q": "The square is divided into equal-area small triangles. Two of the unshaded triangles are now shaded as well. What fraction of the whole square remains unshaded?",
    "o": [
      "3/8",
      "5/8",
      "1/4",
      "3/4",
      "1/2"
    ],
    "a": 0,
    "why": "(3/8). Originally three of eight equal triangles are shaded. Two more make five shaded, leaving three unshaded. The unshaded fraction is 3/8.",
    "figure": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"430\" height=\"300\" viewBox=\"0 0 430 300\" role=\"img\" aria-label=\"Eight equal-area triangles in a square, three shaded initially.\"><rect width=\"100%\" height=\"100%\" fill=\"white\"/><g font-family=\"Arial,sans-serif\" font-size=\"18\" fill=\"#20334b\"><polygon points=\"205,150 100,45 205,45\" fill=\"#7b91ae\" stroke=\"#26364a\" stroke-width=\"2\"/><polygon points=\"205,150 205,45 310,45\" fill=\"white\" stroke=\"#26364a\" stroke-width=\"2\"/><polygon points=\"205,150 310,45 310,150\" fill=\"white\" stroke=\"#26364a\" stroke-width=\"2\"/><polygon points=\"205,150 310,150 310,255\" fill=\"#7b91ae\" stroke=\"#26364a\" stroke-width=\"2\"/><polygon points=\"205,150 310,255 205,255\" fill=\"white\" stroke=\"#26364a\" stroke-width=\"2\"/><polygon points=\"205,150 205,255 100,255\" fill=\"white\" stroke=\"#26364a\" stroke-width=\"2\"/><polygon points=\"205,150 100,255 100,150\" fill=\"#7b91ae\" stroke=\"#26364a\" stroke-width=\"2\"/><polygon points=\"205,150 100,150 100,45\" fill=\"white\" stroke=\"#26364a\" stroke-width=\"2\"/></g></svg>"
  },
  {
    "paperQuestion": 31,
    "paper": "maths-1",
    "topic": "Savings",
    "q": "Emma saves the same amount on each of Monday, Tuesday and Wednesday, saving $27 in those three days. By the end of Thursday her total is $40. How much more did she save on Thursday than on Monday?",
    "o": [
      "$9",
      "$13",
      "$18",
      "$3",
      "$4"
    ],
    "a": 4,
    "why": "($4). Monday’s saving is $27 ÷ 3 = $9. Thursday’s saving is $40 − $27 = $13. The difference is $13 − $9 = $4."
  },
  {
    "paperQuestion": 32,
    "paper": "maths-1",
    "topic": "Working together",
    "q": "Jack takes 1 hour 20 minutes to paint a fence alone. Mia takes the same time to paint that fence alone. They work together at their usual constant rates without getting in each other’s way. If they start at 9:15 am, when will they finish the fence?",
    "o": [
      "9:35 am",
      "9:55 am",
      "10:15 am",
      "10:35 am",
      "11:55 am"
    ],
    "a": 1,
    "why": "(9:55 am). One person takes 80 minutes. Two people working at the same rate take half as long: 40 minutes. Starting at 9:15 am and adding 40 minutes gives 9:55 am."
  },
  {
    "paperQuestion": 33,
    "paper": "maths-1",
    "topic": "Chance",
    "q": "A bag contains 5 red and 5 blue marbles. Two red marbles are removed, then two blue marbles are added. A marble is picked without looking. Which statement is now true?",
    "o": [
      "Picking red is certain.",
      "Red is more likely than blue.",
      "Picking blue is impossible.",
      "Blue is more likely than red, but is not certain.",
      "Red and blue are equally likely."
    ],
    "a": 3,
    "why": "(Blue is more likely, but not certain). The bag now has three red and seven blue marbles. Blue is more likely, but a red marble is still possible."
  },
  {
    "paperQuestion": 34,
    "paper": "maths-1",
    "topic": "Cutting shapes",
    "q": "The rectangle is cut all the way along the two dashed lines shown. How many sides do the resulting pieces have altogether?",
    "o": [
      "14",
      "10",
      "8",
      "12",
      "16"
    ],
    "a": 3,
    "why": "(12). The 3 pieces are all rectangles with 4 sides each, so 3 × 4 = 12 sides altogether.",
    "figure": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"620\" height=\"285\" viewBox=\"0 0 620 285\" role=\"img\" aria-label=\"Two parallel cuts divide the rectangle into three rectangles.\"><rect width=\"100%\" height=\"100%\" fill=\"white\"/><g font-family=\"Arial,sans-serif\" font-size=\"18\" fill=\"#20334b\"><rect x=\"65\" y=\"55\" width=\"480\" height=\"180\" fill=\"#eef3fa\" stroke=\"#26364a\" stroke-width=\"2\"/><line x1=\"225\" y1=\"55\" x2=\"225\" y2=\"235\" stroke=\"#26364a\" stroke-width=\"3\" stroke-dasharray=\"9 7\"/><line x1=\"385\" y1=\"55\" x2=\"385\" y2=\"235\" stroke=\"#26364a\" stroke-width=\"3\" stroke-dasharray=\"9 7\"/></g></svg>"
  },
  {
    "paperQuestion": 35,
    "paper": "maths-1",
    "topic": "Scaling a recipe",
    "q": "A recipe for 4 people uses 300 g of flour. Using the same amount of flour per person, what is the greatest number of people that can be served with 750 g of flour?",
    "o": [
      "8",
      "12",
      "10",
      "9",
      "15"
    ],
    "a": 2,
    "why": "(10 people). Each person needs 300 ÷ 4 = 75 g of flour. 750 ÷ 75 = 10."
  }
];
 const api={questions};root.AdventureMathsPaper1=api;if(typeof module!=="undefined")module.exports=api;
})(globalThis);
