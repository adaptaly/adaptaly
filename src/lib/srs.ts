export const BOX_INTERVALS_DAYS = [0, 1, 3, 7, 14, 30]; // index by box

export function nextBoxAndDue(currentBox: number, result: "correct" | "wrong") {
  const nextBox = result === "correct" ? Math.min(currentBox + 1, 5) : 1;
  const days = BOX_INTERVALS_DAYS[nextBox] ?? 1;
  const due = new Date();
  due.setDate(due.getDate() + days);
  return { box: nextBox, dueAt: due.toISOString() };
}