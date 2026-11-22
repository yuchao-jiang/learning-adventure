(function(root){const data={
  "sections": {
    "graph": {
      "title": "Club votes",
      "text": "Children each vote for one club.\n\nClaims:\n1. Exactly three times as many children choose Sport as Art.\n2. More than 45 children choose Music or Sport altogether.\n3. Chess has 4 more votes than Art."
    },
    "perimeter": {
      "title": "Around the outside",
      "text": "A rectangle 4 cm long and 3 cm wide is joined to a rectangle 2 cm long and 1 cm wide, as shown. They share a 1 cm edge."
    },
    "gaps": {
      "title": "The School Seed Swap",
      "text": "Our school held a seed swap. Families could bring spare packets and take home something different to grow. Some packets were labelled only “flowers”, and others had no label at all. [E1] A gardener therefore helped us write the plant's name and the best time to sow it on each packet. Choosing became easier once people could see what was being offered.\n\nThe event did not need one enormous donation. One family brought spare paper bags. Another made clear signs, and a third offered a little space in the school newsletter. [E2] Together, these small contributions helped turn a table of packets into an event the whole school could use.",
      "instructions": "Use each sentence A–C once. One is not needed. Read before and after each gap."
    },
    "machines": {
      "title": "Two printing machines",
      "text": "A small printing machine starts at 9:00 am and finishes an order at 12:00 noon. A second machine prints the same number of posters, works at three times the speed, and also finishes at 12:00 noon. Both work at constant speeds without stopping."
    },
    "permission": {
      "title": "Required does not mean guaranteed",
      "text": "The school says: “Only children who return a signed permission form by Friday can join the Saturday walk.”\n\nBen returns a signed permission form by Friday."
    }
  },
  "questions": [
    {
      "id": "M1",
      "section": "graph",
      "subject": "Maths",
      "text": "Which claims are correct?",
      "options": [
        "Claim 1 only",
        "Claim 2 only",
        "Claim 3 only",
        "Claims 1 and 2",
        "Claims 1 and 3"
      ],
      "answer": 4,
      "skill": "Graph interpretation and claim language",
      "image": "report-assets/review-week-1-graph.svg",
      "explanation": "Art 8, Music 16, Sport 24, Chess 12. Claim 1: 3 × 8 = 24, true. Claim 2: 16 + 24 = 40, not more than 45, false. Claim 3: 12 − 8 = 4, true. Claims 1 and 3 are correct."
    },
    {
      "id": "M2",
      "section": "perimeter",
      "subject": "Maths",
      "text": "What is the perimeter around the outside of the new shape?",
      "options": [
        "14 cm",
        "16 cm",
        "18 cm",
        "20 cm",
        "24 cm"
      ],
      "answer": 2,
      "skill": "Perimeter and shared edges",
      "image": "report-assets/review-week-1-perimeter.svg",
      "explanation": "The separate perimeters are 14 cm and 6 cm. The shared 1 cm edge is inside the joined shape and was counted twice. 14 + 6 − 2 = 18 cm. You can also trace the outside boundary."
    },
    {
      "id": "E1",
      "section": "gaps",
      "subject": "English",
      "text": "Which sentence best fits the first gap? Explain how it links to the sentences on each side.",
      "options": [
        "Seed packets can be stored in small bags to keep them together.",
        "As a result, families often could not tell exactly which plants they would get.",
        "Any one of these offers might have seemed unimportant on its own."
      ],
      "answer": 1,
      "skill": "Sentence cohesion and causal links",
      "explanation": "B links the unclear labels to the families’ difficulty choosing, which explains why the gardener rewrites them. “As a result” links back to the problem, and “therefore” connects that problem to the action."
    },
    {
      "id": "E2",
      "section": "gaps",
      "subject": "English",
      "text": "Which sentence best fits the second gap? What does “these small contributions” in the next sentence refer to?",
      "options": [
        "Seed packets can be stored in small bags to keep them together.",
        "As a result, families often could not tell exactly which plants they would get.",
        "Any one of these offers might have seemed unimportant on its own."
      ],
      "answer": 2,
      "skill": "Sentence cohesion and reference",
      "explanation": "C contrasts the small individual offers with their combined effect. The contributions are bags, signs and newsletter space. “Together” develops that contrast. A mentions only bags; B belongs with the earlier labelling problem."
    },
    {
      "id": "T1",
      "section": "machines",
      "subject": "Thinking Skills",
      "text": "When does the second machine start?",
      "options": [
        "10:00 am",
        "11:00 am",
        "11:30 am",
        "9:00 am"
      ],
      "answer": 1,
      "skill": "Planning a multi-step solution",
      "explanation": "The small machine takes 3 hours. Three times the speed takes one third of the time for the same amount: 3 ÷ 3 = 1 hour. 12 noon minus 1 hour is 11:00 am."
    },
    {
      "id": "T2",
      "section": "permission",
      "subject": "Thinking Skills",
      "text": "Based only on the school's statement, which conclusion is justified?",
      "options": [
        "Ben will definitely join the walk.",
        "Ben cannot join the walk.",
        "Ben has met a required condition, but this alone does not prove that he will join.",
        "A child who does not return the form can definitely join."
      ],
      "answer": 2,
      "skill": "Necessary condition versus guarantee",
      "explanation": "Returning the form is necessary. The statement does not say that everybody returning it will definitely attend. Ben has met that condition, but the statement alone does not guarantee he will go."
    }
  ],
  "sets": [
    {
      "id": "review-maths",
      "name": "Maths · Graph clues & outside edges",
      "ids": [
        "M1",
        "M2"
      ]
    },
    {
      "id": "review-english",
      "name": "English · Connect the sentences",
      "ids": [
        "E1",
        "E2"
      ]
    },
    {
      "id": "review-thinking",
      "name": "Thinking · Plan & prove",
      "ids": [
        "T1",
        "T2"
      ]
    }
  ]
};root.WeeklyReviewData=data;if(typeof module!=="undefined")module.exports=data;})(globalThis);
