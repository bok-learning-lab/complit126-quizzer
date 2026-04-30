import {
  specificQuestions,
  bigQuestions,
  bigAddendum,
  type SpecificQuestion,
} from "@content/exam/questions";

export type DrawnSet = {
  specific: SpecificQuestion[];
  big: { question: string; addendum: string };
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Mirrors the exam protocol: 2 specific questions + 1 big question.
// To avoid two specifics on the same texts, we draw from two different units.
export function drawQuestions(): DrawnSet {
  const byUnit = new Map<string, SpecificQuestion[]>();
  for (const q of specificQuestions) {
    if (!byUnit.has(q.unit)) byUnit.set(q.unit, []);
    byUnit.get(q.unit)!.push(q);
  }
  const units = Array.from(byUnit.keys());
  const shuffled = [...units].sort(() => Math.random() - 0.5);
  const [u1, u2] = shuffled;
  const q1 = pickRandom(byUnit.get(u1)!);
  const q2 = pickRandom(byUnit.get(u2)!);

  return {
    specific: [q1, q2],
    big: { question: pickRandom(bigQuestions), addendum: bigAddendum },
  };
}
