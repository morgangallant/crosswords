"use client";

import * as React from "react";
import { Crossword, Direction } from "@/lib/crossword";

/**
 * Note: This component monitors for key down events, and I don't know how to do
 * proper focus states. Will need to put this on a different page from forms / other
 * keyboard input (otherwise they won't work...)
 */

export default function CrosswordView({
  encoded,
  clues,
}: {
  encoded: string;
  clues: string[];
}) {
  const [selectedXY, setSelectedXY] = React.useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [selectedDir, setSelectedDir] = React.useState(Direction.Horizontal);
  const [input, setInput] = React.useState(new Uint8Array());

  let puzzle = new Crossword(0);
  puzzle.decode(encoded);

  var clueMap = new Map<string, number>();
  for (let i = 0; i < puzzle.words.length; i++) {
    clueMap.set(`${puzzle.words[i].x},${puzzle.words[i].y}`, i);
  }

  if (input.length != puzzle.size * puzzle.size) {
    let empty = new Uint8Array(puzzle.size * puzzle.size);
    empty.fill(32);
    // setInput(puzzle.board!);
    setInput(empty);
  }

  React.useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.metaKey) return; // Allows refreshing etc.
      let dir: Direction = selectedDir;
      let x = selectedXY.x;
      let y = selectedXY.y;
      switch (e.key) {
        case "ArrowUp": {
          do {
            y -= 1;
          } while (y > 0 && puzzle.board![puzzle.size * y + x] == 32);
          dir = Direction.Vertical;
          break;
        }
        case "ArrowRight": {
          do {
            x += 1;
          } while (x < puzzle.size && puzzle.board![puzzle.size * y + x] == 32);
          dir = Direction.Horizontal;
          break;
        }
        case "ArrowDown": {
          do {
            y += 1;
          } while (y < puzzle.size && puzzle.board![puzzle.size * y + x] == 32);
          dir = Direction.Vertical;
          break;
        }
        case "ArrowLeft": {
          do {
            x -= 1;
          } while (x > 0 && puzzle.board![puzzle.size * y + x] == 32);
          dir = Direction.Horizontal;
          break;
        }
        default:
          let code = e.key.charCodeAt(0);
          if (code == 66) {
            code = 32;
          }
          if ((code >= 97 && code <= 122) || code == 32) {
            setInput((exist) => {
              let arr = new Uint8Array(exist);
              arr[selectedXY.y * puzzle.size + selectedXY.x] = code;
              return arr;
            });
          } else {
            return;
          }
          if (dir == Direction.Horizontal) {
            for (let i = 1; i < puzzle.size - x; i++) {
              x += code == 32 ? -1 : 1;
              if (puzzle.board![puzzle.size * y + x] != 32) {
                break;
              }
            }
          } else if (dir == Direction.Vertical) {
            for (let i = 1; i < puzzle.size - y; i++) {
              y += code == 32 ? -1 : 1;
              if (puzzle.board![puzzle.size * y + x] != 32) {
                break;
              }
            }
          }
      }
      e.preventDefault();
      if (selectedDir != dir!) {
        setSelectedDir(dir);
        return;
      }
      if (x >= 0 && x < puzzle.size && y >= 0 && y < puzzle.size) {
        if (puzzle.board![puzzle.size * y + x] != 32) {
          setSelectedXY({ x, y });
        }
      }
    };
    document.addEventListener("keydown", keyDownHandler);
    return () => {
      document.removeEventListener("keydown", keyDownHandler);
    };
  }, [selectedXY, selectedDir, input]);

  var rows = [];
  for (let i = 0; i < puzzle.size; i++) {
    let cols = [];
    for (let j = 0; j < puzzle.size; j++) {
      let bgcolor: string | undefined = undefined;
      if (puzzle.board![puzzle.boardIndex(i, j)] == 32) {
        bgcolor = "darkgrey";
      } else if (selectedXY.x == i && selectedXY.y == j) {
        bgcolor = "gold";
      } else if (
        (selectedDir == Direction.Horizontal && selectedXY.y == j) ||
        (selectedDir == Direction.Vertical && selectedXY.x == i)
      ) {
        bgcolor = "lightcyan";
      }
      let value: string | undefined = undefined;
      if (input.at(puzzle.size * j + i) != 32) {
        value = String.fromCharCode(input[puzzle.size * j + i]);
      }
      const clueNumber = clueMap.get(`${i},${j}`);
      cols.push(
        <Square
          key={`${i},${j}`}
          size={puzzle.size}
          x={i}
          y={j}
          bgcolor={bgcolor}
          value={value}
          onClickCallback={() => {
            if (puzzle.board![puzzle.boardIndex(i, j)] != 32) {
              if (selectedXY.x == i && selectedXY.y == j) {
                setSelectedDir((e) => {
                  if (e == Direction.Horizontal) {
                    return Direction.Vertical;
                  }
                  return Direction.Horizontal;
                });
              } else {
                setSelectedXY({ x: i, y: j });
              }
            }
          }}
          label={clueNumber}
        />
      );
    }
    rows.push(cols);
  }

  return (
    <>
      {areBytesEqual(input, puzzle.board!) && (
        <div
          style={{
            width: "100%",
            backgroundColor: "lightgreen",
            textAlign: "center",
            paddingTop: "12px",
            paddingBottom: "12px",
            marginBottom: "20px",
          }}
        >
          <p>Wahoo! You solved it!</p>
        </div>
      )}
      <div
        style={{
          display: "flex",
        }}
      >
        {rows.map((r, i) => (
          <div key={`row${i}`}>{r}</div>
        ))}
      </div>
      <ul>
        {Array.from(clueMap.values()).map((cmv) => (
          <li key={cmv}>
            {cmv}: {clues[cmv]}
          </li>
        ))}
      </ul>
    </>
  );
}

function Square({
  size,
  x,
  y,
  bgcolor,
  value,
  onClickCallback,
  label,
}: {
  size: number;
  x: number;
  y: number;
  bgcolor?: string;
  value?: string;
  onClickCallback: () => void;
  label?: number;
}) {
  return (
    <div
      style={{
        width: "64px",
        height: "64px",
        borderLeft: x == 0 ? "solid 2px black" : "solid 1px grey",
        borderTop: y == 0 ? "solid 2px black" : "solid 1px grey",
        borderRight: x == size - 1 ? "solid 2px black" : "solid 1px grey",
        borderBottom: y == size - 1 ? "solid 2px black" : "solid 1px grey",
        backgroundColor: bgcolor,
        fontSize: "48px",
        textAlign: "center",
        position: "relative",
      }}
      onClick={onClickCallback}
    >
      <span
        style={{
          fontSize: "18px",
          position: "absolute",
          left: "5%",
          top: "5%",
        }}
      >
        {label}
      </span>
      {value}
    </div>
  );
}

function areBytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length != b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] != b[i]) return false;
  }
  return true;
}
