// Source pages are physical PDF pages unless explicitly marked “printed”.
// Age bands organize browsing; they are not milestone requirements.
export const content = {
  '6-9': {
    art: 'baby', intro: '6–9 months · Discovering what I can do',
    headline: 'Their world is opening up.',
    description: 'A sound to listen to. A little room to move. Your familiar face. There is so much to discover in the everyday.',
    items: [
      { id:'baby-movement', category:'Movement', title:'Watch their next move',
        actionLabel:'Reach', invitation:'Clear a little floor space. Stay close and watch what your baby reaches for.',
        summary:'Make room for your baby’s own movement, then notice what they are trying to reach or explore.',
        cue:'What catches their attention before they move? Do they keep experimenting, or begin asking for help?',
        steps:['Clear a safe space on the floor and stay nearby.','Let your baby move in the ways they currently use. Watch their hands, feet, and changes of direction.','If they become frustrated, offer a little help, then leave room for them to continue.'],
        principle:'Freedom of movement begins with observation. Prepare the space and respond to your baby’s current abilities, rather than putting them into positions they cannot yet reach themselves.',
        frames:['Make a little room.','Watch where curiosity leads.','Help a little, then pause.'],
        source:{book:'The Montessori Baby',section:'Chapter 5, “Freedom of movement”; chapter 6, movement activities for 6–9 months and help when struggling.',pages:'PDF pp. 107–108, 126, 157–162. This PDF has no reliable printed-page equivalents.'}
      },
      { id:'baby-language', category:'Language', title:'Give that sound a name',
        actionLabel:'Listen', invitation:'When a sound catches their attention, name it simply. Then leave room for a reply.',
        summary:'When your baby notices an everyday sound, share a few words about it and leave space for their response.',
        cue:'A turn toward a sound, a look at your face, a gesture, or a vocalization. Follow their interest; no response is required.',
        steps:['Notice your baby turning toward an everyday sound, such as a dog barking.','Name it simply: “A dog is barking.”','Pause for a look, movement, or sound. Respond if your baby continues the exchange.'],
        principle:'Language grows out of real experience and two-way communication. The pause gives your baby a part in the conversation without asking them to perform.',
        frames:['You heard something.','“A dog is barking.”','Leave room for a reply.'],
        source:{book:'The Montessori Baby',section:'Chapter 6, language activities: “6 to 9 months”; ongoing conversational turn-taking from “3 to 6 months”.',pages:'PDF pp. 133–135. This PDF has no reliable printed-page equivalents.'}
      },
      { id:'baby-connection', category:'Connection', title:'A pause before pickup',
        actionLabel:'Pause', invitation:'Come into view, tell them what you intend, and pause before an unhurried pickup.',
        summary:'Turn an ordinary pickup into a small exchange: approach gently, say what you intend, and notice your baby’s response.',
        cue:'Watch for changes in expression or posture: reaching, smiling, moving toward you, turning away, or drawing back.',
        steps:['Come where your baby can see you and extend your hands.','Say, “I’d like to pick you up,” then pause.','Notice their response and move slowly. When pickup can wait and they turn away, give them another moment.'],
        principle:'Respectful care makes your baby a participant in everyday interactions. This invitation is for unhurried moments; necessary care and immediate protection do not need to wait.',
        frames:['Let them see you coming.','Tell them, then pause.','Respond with gentle hands.'],
        source:{book:'The Montessori Baby',section:'Chapter 5, “Respect our baby’s body,” collaboration, and the connection checklist.',pages:'PDF pp. 99–100, 114. This PDF has no reliable printed-page equivalents.'}
      }
    ]
  },
  '18-24': {
    art:'toddler',intro:'18–24 months · Let me be part of it',
    headline:'“I can have a go.”',
    description:'The real things you do together can become their most interesting work. Offer a small part, show it slowly, and make room for their attempt.',
    items:[
      { id:'toddler-pouring',category:'Independence',title:'A little water, a careful pour',
        actionLabel:'Pour', invitation:'A little water, a small pitcher, and a cloth for spills. Show one slow pour, then let them try.',
        summary:'A small pitcher and cup give your toddler a manageable way to practice pouring, with you nearby.',
        cue:'They are interested in pouring and can manage the pitcher. Adjust the amount of water and help to match what you observe.',
        steps:['Set a small pitcher containing a little water beside a cup on a low table. Keep a sponge or cloth ready.','Slowly show one pour, letting your toddler watch your hands.','Invite them to try. Stay nearby, allow repetition, and offer help with spills when needed.'],
        principle:'Practical life supports independence through child-sized tools, repetition, and manageable steps. The invitation follows their interest; spills are part of learning.',
        frames:['Just a little water.','Watch one slow pour.','Your turn to try.'],
        source:{book:'The Montessori Toddler',section:'Appendix, “List of Montessori activities for toddlers” (pouring, 18+ months); chapters 3–4, demonstrations and a child-sized table.',pages:'Printed pp. 26–27, 42, 67, 242 / PDF pp. 35–36, 51, 76, 251.'}
      },
      { id:'toddler-drawing',category:'Creativity',title:'Let the lines wander',
        actionLabel:'Draw', invitation:'Set out paper and a few chunky crayons. Their scribbles are the discovery.',
        summary:'Offer paper and easy-to-grip crayons, then let your toddler discover the marks their hand can make.',
        cue:'They are interested in moving a drawing tool across paper. Dots, sweeping lines, and scribbles are all exploration.',
        steps:['Set out paper and a few chunky crayons that make clear marks.','On your own paper, slowly demonstrate a loose line or squiggle.','Let your toddler explore their page. When they seek a response, describe what you see.'],
        principle:'Creative work values movement and self-expression. There is no finished picture to copy and no need to improve their marks.',
        frames:['Paper and a few crayons.','Show one wandering line.','Their marks, their discovery.'],
        source:{book:'The Montessori Toddler',section:'Chapter 3, “Arts and crafts.” Drawing tools, loose-line demonstrations, and descriptive feedback.',pages:'Printed pp. 44–45 / PDF pp. 53–54.'}
      },
      { id:'toddler-shoes',category:'Home',title:'A home for little shoes',
        actionLabel:'Put away', invitation:'Give shoes one reachable home. Invite your toddler to fetch or return a shoe.',
        summary:'Give shoes a predictable, reachable place so your toddler can take part in arriving home and getting ready to leave.',
        cue:'They notice their shoes or want to join the arrival routine. Is the basket easy for them to reach and use?',
        steps:['Place a small shoe basket in a consistent spot near the entrance.','Show where shoes belong, using slow movements.','Invite them to fetch or return a shoe. Help with whichever part is still difficult.'],
        principle:'A prepared environment supports independence and a sense of order. Fetching or returning a shoe is enough; fastening it independently is not required.',
        frames:['A place they can reach.','Show where shoes belong.','Leave a part for them.'],
        source:{book:'The Montessori Toddler',section:'Chapter 4, “Setting up Montessori-style spaces” and “Entrance”; chapter 3, practical-life list.',pages:'Printed pp. 42, 66–67 / PDF pp. 51, 75–76.'}
      }
    ]
  }
};
