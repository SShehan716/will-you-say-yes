import type { Gender, ProposalDraft, Question, TemplateId, ThemeId } from "./types";

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function partnerWord(gender: Gender | undefined): string {
  if (gender === "boy") return "girlfriend";
  if (gender === "girl") return "boyfriend";
  return "partner";
}

const yesNo = (prompt: string, yesLabel = "Yes! 💖", noLabel = "No"): Question => ({
  id: newId(),
  type: "yesno",
  prompt,
  yesLabel,
  noLabel,
});
const choice = (prompt: string, options: string[]): Question => ({
  id: newId(),
  type: "choice",
  prompt,
  options,
});
const date = (prompt: string): Question => ({ id: newId(), type: "date", prompt });
const text = (prompt: string): Question => ({ id: newId(), type: "text", prompt });

export const blankQuestion = (type: Question["type"]): Question => {
  switch (type) {
    case "yesno":
      return yesNo("");
    case "choice":
      return choice("", ["", ""]);
    case "date":
      return date("When are you free?");
    case "text":
      return text("");
  }
};

type TemplateBody = Pick<ProposalDraft, "intro" | "questions" | "finalMessage"> & {
  theme: ThemeId;
};

export interface Template {
  id: TemplateId;
  emoji: string;
  name: string;
  blurb: string;
  build: (ctx: { gender?: Gender }) => TemplateBody;
}

export const TEMPLATES: Template[] = [
  {
    id: "marry",
    emoji: "💍",
    name: "Will you marry me?",
    blurb: "The big one. Warm-up question, then the ring.",
    build: () => ({
      theme: "rose",
      intro: "There's a question I've been carrying in my heart for a long time…",
      questions: [
        yesNo("Do you love me? 🥰", "Of course! 🥰"),
        yesNo("Will you marry me? 💍", "Yes, forever! 💍"),
      ],
      finalMessage:
        "You just made me the happiest person alive. I love you — today, tomorrow and always. 💍",
    }),
  },
  {
    id: "dayout",
    emoji: "☀️",
    name: "Day out together",
    blurb: "Ask them out, then let them pick the place, day and food.",
    build: () => ({
      theme: "sunset",
      intro: "I have a little plan for us, but I need your help with it…",
      questions: [
        yesNo("Will you go on a day out with me? ☀️", "Let's go! ☀️"),
        choice("Where should we go?", [
          "Beach 🏖️",
          "Picnic in the park 🧺",
          "Movies 🎬",
          "Shopping 🛍️",
          "Surprise me ✨",
        ]),
        date("When are you free?"),
        choice("What should we eat?", ["Pizza 🍕", "Sushi 🍣", "Burgers 🍔", "Ice cream 🍦"]),
      ],
      finalMessage: "It's a date! I can't wait to spend the whole day with you. ❤️",
    }),
  },
  {
    id: "valentine",
    emoji: "💘",
    name: "Be my Valentine",
    blurb: "The classic. One question, zero ways to say no.",
    build: () => ({
      theme: "rose",
      intro: "Roses are red, violets are blue, I have a question just for you…",
      questions: [yesNo("Will you be my Valentine? 💘")],
      finalMessage: "Yay! Best Valentine ever. See you on the 14th 💘",
    }),
  },
  {
    id: "dinner",
    emoji: "🕯️",
    name: "Romantic dinner",
    blurb: "Candles, a date, a cuisine and any special wishes.",
    build: () => ({
      theme: "midnight",
      intro: "I'd love to treat you to an evening that's all about you…",
      questions: [
        yesNo("Can I take you out for a romantic dinner? 🕯️", "Yes please! 🕯️"),
        date("Which evening works for you?"),
        choice("What are you craving?", ["Italian 🍝", "Japanese 🍣", "Indian 🍛", "Steakhouse 🥩"]),
        text("Anything special you'd like? (a song, a dress code, a wish…)"),
      ],
      finalMessage: "It's set. Wear something nice — I'll take care of the rest. 🌹",
    }),
  },
  {
    id: "partner",
    emoji: "💞",
    name: "Be my girlfriend / boyfriend",
    blurb: "Make it official — wording adapts to you.",
    build: ({ gender }) => ({
      theme: "lavender",
      intro: "I've been wanting to ask you this for a while now…",
      questions: [yesNo(`Will you be my ${partnerWord(gender)}? 💞`, "Yes! 💞")],
      finalMessage: "It's official! I'm the luckiest person in the world. 💞",
    }),
  },
  {
    id: "sorry",
    emoji: "🥺",
    name: "Forgive me?",
    blurb: "For when you messed up. 'No' still isn't an option.",
    build: () => ({
      theme: "lavender",
      intro: "I know I messed up, and I'm really sorry…",
      questions: [
        yesNo("Will you forgive me? 🥺", "I forgive you 🤍"),
        text("Anything you want to tell me?"),
      ],
      finalMessage: "Thank you for giving me another chance. I promise to do better. 🤍",
    }),
  },
  {
    id: "custom",
    emoji: "✍️",
    name: "Write your own",
    blurb: "Start from scratch with your own questions.",
    build: () => ({
      theme: "rose",
      intro: "I have something to ask you…",
      questions: [yesNo("")],
      finalMessage: "Yay! You made my day. ❤️",
    }),
  },
];

export function getTemplate(id: string | null | undefined): Template {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

export const THEMES: { id: ThemeId; name: string; swatch: string }[] = [
  { id: "rose", name: "Rose", swatch: "linear-gradient(135deg,#ffd1dc,#ff6b8b)" },
  { id: "lavender", name: "Lavender", swatch: "linear-gradient(135deg,#e9ddff,#a78bfa)" },
  { id: "sunset", name: "Sunset", swatch: "linear-gradient(135deg,#ffe0b5,#ff7a59)" },
  { id: "midnight", name: "Midnight", swatch: "linear-gradient(135deg,#3b1d4a,#c2185b)" },
];

/** Playful labels the "No" button cycles through as they keep trying. */
export const NO_ESCALATION = [
  "Are you sure?",
  "Really sure? 🤔",
  "Think again 🥺",
  "Last chance!",
  "Surely not?",
  "You might regret this!",
  "Give it another thought!",
  "Have a heart! 💔",
  "Don't be so cold 🥶",
  "Change of heart?",
  "Is that your final answer?",
  "You're breaking my heart 😢",
];

export const REACTION_EMOJI = ["🥰", "🥺", "😳", "😢", "😭", "💔"];
