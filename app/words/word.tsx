"use client";

import * as React from "react";
import { createWord } from "../actions";

export default function Word({ initialCount }: { initialCount: number }) {
  const [count, setCount] = React.useState(initialCount);
  const [word, setWord] = React.useState("");
  const [clue, setClue] = React.useState("");
  return (
    <section className="create-word-form">
      <h4>Add new words</h4>
      <p>There are currently {count} registered word(s).</p>
      <form
        action={async (data) => {
          try {
            await createWord(data);
            setCount((c) => {
              return c + 1;
            });
            setWord("");
            setClue("");
          } catch (e) {
            alert(e);
          }
        }}
      >
        <label>
          Word:{" "}
          <input
            type="text"
            id="word"
            name="word"
            placeholder="vancouver"
            required
            value={word}
            onChange={(e) => setWord(e.target.value)}
          />
        </label>
        <br />
        <br />
        <label>
          Clue:{" "}
          <input
            type="text"
            id="clue"
            name="clue"
            placeholder="city where we met"
            required
            value={clue}
            onChange={(e) => setClue(e.target.value)}
          />
        </label>
        <br />
        <br />
        <input type="submit" value="Add word" />
      </form>
    </section>
  );
}
