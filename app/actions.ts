"use server";

import prisma from "@/lib/prisma";

export async function createWord(formData: FormData) {
  const word = formData.get("word");
  if (!word || word == "") {
    throw new Error("invalid word!");
  }

  const clue = formData.get("clue");
  if (!clue || clue == "") {
    throw new Error("invalid clue!");
  }

  await prisma.word.create({
    data: {
      word: word.toString(),
      clue: clue.toString(),
    },
  });
}
