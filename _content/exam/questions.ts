// Hardcoded source of truth for the CL 126x / Hum 5 final oral exam.
// Edit this file directly to change questions, units, works, or the rubric —
// everything in the quizzer app reads from here.

export type SpecificQuestion = {
  unit: string;
  question: string;
};

export const works: string[] = [
  "King James Bible, Genesis 1-3; Ecclesiastes 1-3; Gospel of Matthew 6:25-34",
  "Homer, Iliad, Book 18 (excerpt)",
  "Hesiod, Works and Days (excerpt)",
  "Aristotle, Politics, Book I, Parts IV-VI",
  "Plato, Republic, excerpts from Books II and IV",
  "Francis Bacon, “Of Studies”",
  "Ann Blair, “Reading Strategies for Coping with Information Overload, ca. 1550-1700”",
  "Ben Lerner, The Hatred of Poetry",
  "Robert Pinsky, The Sounds of Poetry",
  "Rachel Richardson, “The Sonnet: A History and How-To Guide”",
  "Shakespeare’s Sonnets 18, 29, 55, 57, 60, 73, 94, 130",
  "Other Lyric Poems We Read (Petrarca, Sonnet 131; Dante, “To Every Captive Soul and Gentle Heart”; John Milton, “When I consider how my light is spent”; John Keats, “Bright Star”; “On First Looking into Chapman’s Homer”; Edna St. Vincent Millay, “What lips my lips have kissed”; W. B. Yeats, “When You Are Old”; Wallace Stevens, “Restatement of Romance”; Langston Hughes, “My Loves”; W. H. Auden, “Lullaby”; Gwendolyn Brooks, “sonnet-ballad,” “my dreams, my works must wait until after hell”; Constantine Cavafy, “Half an Hour”; James Merrill, “A Renewal”; Anne Sexton, “Just Once”; Adrienne Rich, “Poem III”; John Ashbery, “Some Trees”; Frank O’Hara, “Having a Coke with You”)",
  "Mary Shelley, Frankenstein",
  "Sigmund Freud, The Interpretation of Dreams (excerpt); Creative Writers and Daydreaming; “The Uncanny”",
  "Ovid, “Pygmalion and Galatea” from The Metamorphoses",
  "Heinrich von Kleist, “On the Marionette-Theater”",
  "E. T. A. Hoffmann, “The Sandman”",
  "Franz Kafka, “Report to an Academy,” “Care of a Family Man,” “The Crossbreed”",
  "George Bernard Shaw, Pygmalion",
  "Walter Benjamin, “Little History of Photography”",
  "Roland Barthes, Camera Lucida",
  "Natasha Tretheway, Monument (excerpt)",
  "Claudia Rankine, Citizen (excerpts)",
];

export const specificQuestions: SpecificQuestion[] = [
  // Unit 1 — Work, Genesis & the Greeks
  {
    unit: "Work, Genesis & the Greeks",
    question:
      "Why do we work, according to the Book of Genesis? Which of the Greek philosophers we read (Hesiod, Aristotle, Plato) expresses the most similar point of view?",
  },
  {
    unit: "Work, Genesis & the Greeks",
    question:
      "How does Homer describe the tripods of Hephaestus? What does this description suggest about the relationship between divinity, humanity, toil, and skill?",
  },
  {
    unit: "Work, Genesis & the Greeks",
    question:
      "Both the Book of Genesis and Hesiod’s Works and Days blame women for the fall of humanity into sin. How? Why? What view does this suggest of the relationship between gender, sexuality, knowledge, and temptation? What view does it suggest of work?",
  },
  {
    unit: "Work, Genesis & the Greeks",
    question:
      "The excerpts that we read from the King James Bible offer multiple perspectives on the nature and moral significance of work. What are they?",
  },
  {
    unit: "Work, Genesis & the Greeks",
    question:
      "How does Francis Bacon encourage us to approach reading? What historical contexts informed his recommendations? Are they still useful in the present? Why or why not?",
  },

  // Unit 2 — Poetry, Voice & the Sonnet
  {
    unit: "Poetry, Voice & the Sonnet",
    question:
      "Why does Ben Lerner say that writing poetry is not just hard; it’s impossible? Take one poem that we read in class and explain how it enacts and interrogates the dynamics that Lerner describes.",
  },
  {
    unit: "Poetry, Voice & the Sonnet",
    question:
      "Ben Lerner suggests that every poem is, at some level, about the problem of how to write a poem. Pick one poem that we studied and describe how the poet connects its stated subject matter (love, trees, blindness, etc.) to the problem of how to write.",
  },
  {
    unit: "Poetry, Voice & the Sonnet",
    question:
      "What are some characteristics that we might use to recognize a sonnet as Shakespearean? Can you name at least one other poet whose poems exhibit similar traits? What do they have in common?",
  },
  {
    unit: "Poetry, Voice & the Sonnet",
    question:
      "What role do rhythm and meter play in making a poet’s voice distinctive? Discuss, with examples from at least two poets we read.",
  },

  // Unit 3 — Frankenstein & the Modern Prometheus
  {
    unit: "Frankenstein & the Modern Prometheus",
    question:
      "Why did Mary Shelley call Frankenstein “The Modern Prometheus”? How did she adapt the ancient myth of Prometheus for her own era?",
  },
  {
    unit: "Frankenstein & the Modern Prometheus",
    question:
      "What role do natural landscapes play in Mary Shelley’s Frankenstein? Does nature in her book look like the nature described by Hesiod? Like the Garden of Eden described in the Book of Genesis? Something else?",
  },
  {
    unit: "Frankenstein & the Modern Prometheus",
    question:
      "What is the function of the frame narrative in Frankenstein? Compare and contrast it with the frame narrative in ETA Hoffman’s “The Sandmann” or with the preface and afterward to George Bernard Shaw’s Pygmalion.",
  },
  {
    unit: "Frankenstein & the Modern Prometheus",
    question:
      "Several texts we read feature characters that express, or enact, ambivalence toward marriage and reproduction. Pick two of the following characters and compare their attitudes and behaviors. Why are they ambivalent? How do they act out their ambivalence? Victor Frankenstein, Nathanael, Henry Higgins, Red Peter.",
  },

  // Unit 4 — Freud, Pygmalion & the Inhuman Voice
  {
    unit: "Freud, Pygmalion & the Inhuman Voice",
    question:
      "Freud says that both dreams and creative writing express the fulfillment of (repressed) wishes. Pick any text we read and use Freud’s methods for dream interpretation to analyze it. What wishes do the characters in the text seem to be acting out? Is the text expressing a wish that might belong to the author themself?",
  },
  {
    unit: "Freud, Pygmalion & the Inhuman Voice",
    question:
      "What makes an experience uncanny, according to Freud? Cite at least two specific examples that he uses in his essay.",
  },
  {
    unit: "Freud, Pygmalion & the Inhuman Voice",
    question:
      "Do you find Freud’s reading of E. T. A. Hoffmann’s “The Sandman” persuasive? Why or why not?",
  },
  {
    unit: "Freud, Pygmalion & the Inhuman Voice",
    question:
      "We read several narratives about characters who learn how to speak a new language or who speak a strange or inhuman language (e.g., Frankenstein’s creature, Hoffmann’s Olimpia, Eliza Doolittle, Kafka’s Odradek and Red Peter). Pick one and explain: What does this story suggest about the relationship between language and being human?",
  },
  {
    unit: "Freud, Pygmalion & the Inhuman Voice",
    question:
      "Why did George Bernard Shaw call his play Pygmalion? How do Henry Higgins and Eliza Doolittle resemble Ovid’s Pygmalion and Galatea? Where do they differ?",
  },
  {
    unit: "Freud, Pygmalion & the Inhuman Voice",
    question:
      "Why did Joseph Weizenbaum call his chatbot E. L. I. Z. A.? Do you think he took the right lessons away from George Bernard Shaw’s play? Why or why not?",
  },
  {
    unit: "Freud, Pygmalion & the Inhuman Voice",
    question:
      "Many texts we read introduce figures, human and otherwise, who could be seen as standing in for the author. Pick TWO and compare or contrast them.",
  },

  // Unit 5 — Photography, Aura & the Image
  {
    unit: "Photography, Aura & the Image",
    question:
      "What analogy does Walter Benjamin draw between psychoanalysis and photography? If we build on this analogy, with Alexander Kluge, what might we use stable diffusion to learn?",
  },
  {
    unit: "Photography, Aura & the Image",
    question:
      "What is aura, according to Walter Benjamin? Why did the advent of “technological reproduction” (e.g. by photographs) destroy it? Does stable diffusion destroy it even further? Or somehow bring it back?",
  },
  {
    unit: "Photography, Aura & the Image",
    question:
      "What is the optical unconscious, defined by Walter Benjamin? How does it relate to Roland Barthes’s concept of the “punctum” of a photograph?",
  },
  {
    unit: "Photography, Aura & the Image",
    question:
      "What does Roland Barthes say makes the “studium” different from the “punctum”? Could a work of literature “prick” us in the way that Barthes says photographs do?",
  },
  {
    unit: "Photography, Aura & the Image",
    question:
      "Both Natasha Tretheway and Claudia Rankine write poems “on” photographs. But they do so very differently. Pick one of the two and answer the following questions: How do words relate to images, in their poems? What other aspects of form makes their voices distinctive (e.g., syntax, rhythm, meter, etc.)?",
  },
];

export const bigAddendum =
  "Explain your view on this question, and of its significance for thinking about contemporary issues surrounding artificial intelligence. Cite at least two writers or thinkers we engaged with in class who have shaped your view.";

export const bigQuestions: string[] = [
  "Is the need to work a curse or a blessing? Should a good society strive to eliminate work by automating it? Does it depend on the kind of work we are talking about? What happens to society after work goes away? Can we imagine a society without hierarchy or exploitation?",
  "What is a writer’s voice? How much of it comes from other people? What is it that makes a voice new or distinctive? How does someone become recognizable as themselves?",
  "Does technology extend or constrain human agency? To what extent can we control our own creations? What happens when we lose control?",
  "Can humans have meaningful relationships with machines? What can the ways we relate to machines tell us about how we relate to everyone?",
  "How do new technologies change the definition of what counts as art? What do we learn by translating experience and its representation from one medium into another?",
];

// The rubric in its prose / question form, drawn from the prep packet. The
// numeric weights from the original (3 pts, 4 pts, etc.) are intentionally
// stripped — students should be able to see and hear these criteria, but not
// be assessed quantitatively by the practice tool.
export const rubric = `For specific questions, examiners ask:

Content — Did you recall and summarize the content of the texts you cited, accurately naming central characters, forms, images, or concepts?

Analysis — Did you use methods that we studied in class (e.g. "distant reading," "close reading," historicist contextualization, psychoanalysis, phenomenology, or critical theory) to build a persuasive account of the texts that you chose to discuss? Did you make precise and interesting claims? Did the evidence that you cited support them?

Presentation — Did you state your claims in a clear and compelling fashion? Were you able to articulate a strong idea in the time allotted?

For the big question, the same Content, Analysis, and Presentation questions apply, plus:

Connection-Building — Did you successfully connect your observations to phenomena related to contemporary AI? Did you speak about contemporary AI intelligently and fluently, drawing on course readings, conversations, and exercises?`;
