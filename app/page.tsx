import * as React from "react";
import prisma from "@/lib/prisma";
import Word from "./words/word";
import { redirect } from "next/navigation";
import { Crossword } from "@/lib/crossword";
import CrosswordView from "./crossword";

export default async function Page({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  let encoded = searchParams["puzzle"];
  if (!encoded) {
    let crossword = new Crossword(8);
    const words = await prisma.word.findMany();
    crossword.generateNew(
      words.map((w) => ({
        id: w.id,
        word: w.word,
      }))
    );
    redirect(`?puzzle=${encodeURIComponent(crossword.encode())}`);
  }

  const decoded = decodeURIComponent(encoded as string);

  let puzzle = new Crossword(0);
  puzzle.decode(decoded);

  const raw_clues = await prisma.word.findMany({
    select: {
      id: true,
      clue: true,
    },
    where: {
      id: { in: puzzle.words.map((w) => w.id) },
    },
  });
  let clues = [];
  for (let i = 0; i < puzzle.words.length; i++) {
    const raw = raw_clues.find((v) => v.id == puzzle.words[i].id);
    if (raw) {
      clues.push(raw.clue);
    } else {
      clues.push("Missing clue");
    }
  }

  return (
    <>
      <main>
        <h3>Crosswords</h3>
        <p>Make & play crosswords with your partner!</p>
        <p>
          <a href="https://github.com/morgangallant/crosswords">
            Source code is on GitHub
          </a>
        </p>
        <hr />
        <section>
          <h4>Puzzle</h4>
          <p>Auto-generated. If it&apos;s not good, feel free to refresh!</p>
          <CrosswordView encoded={decoded} clues={clues} />
        </section>
        <hr />
        <section>
          <p>
            <strong>Want to add new words?</strong>{" "}
            <a href="/words">Click here</a>
          </p>
        </section>
        <hr />
        <section className="footer">
          <p>
            Made with love for Shenita. May we do crosswords together, forever.
          </p>
        </section>
      </main>
    </>
  );
}
