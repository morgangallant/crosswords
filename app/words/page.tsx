import prisma from "@/lib/prisma";
import Word from "./word";

export default async function Words() {
  const count = await prisma.word.count();
  return (
    <main>
      <p>
        <a href="/">&larr; Back to homepage</a>
      </p>
      <Word initialCount={count} />
    </main>
  );
}
