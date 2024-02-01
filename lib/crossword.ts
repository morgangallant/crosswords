import { Buffer } from "buffer";

/**
 * Creates crosswords from a list of words.
 * Allows crosswords to be imported/exported from/to base64-encoded strings.
 */
export class Crossword {
  size: number; // size*size letters
  words: Word[];
  board?: Uint8Array;

  /**
   * The default constructor to initialize an empty crossword.
   */
  constructor(size: number) {
    this.size = size;
    this.words = [];
    this.board = undefined;
  }

  /**
   * Given `size`, `horizontal` and `vertical`, generates a `board` string, i.e.
   * a flattened array of characters which make up the board. This method will throw
   * an error if we have an invalid board state.
   */
  generateBoard(): Uint8Array {
    let ret = new Uint8Array(this.size * this.size);
    ret.fill(32);
    for (let w of this.words) {
      this.addWordToBoard(ret, w);
    }
    return ret;
  }

  /**
   * Adds a new word to a board.
   */
  addWordToBoard(board: Uint8Array, w: Word) {
    for (let i = 0; i < w.word.length; i++) {
      let c = w.word.charCodeAt(i);
      let x = w.x;
      let y = w.y;
      if (w.dir == Direction.Horizontal) {
        x += i;
      } else {
        y += i;
      }
      let bi = this.boardIndex(x, y);
      if (board[bi] == 32) {
        board[bi] = c;
      } else if (board[bi] != c) {
        throw new Error(
          `board invalid, contains letter mismatch at (${x},${y})`
        );
      }
    }
  }

  /**
   * Checks if it's valid to add a new wordpos at specified x/y position.
   * Also returns the number of intersections this word would have with
   * other words. This needs to be maximised.
   */
  canAddWord(w: Word): { valid: boolean; intersections: number } {
    if (!this.board) this.board = this.generateBoard();
    var intersections = 0;
    for (let i = 0; i < w.word.length; i++) {
      let c = w.word.charCodeAt(i);
      let x = w.x;
      let y = w.y;
      if (w.dir == Direction.Horizontal) {
        x += i;
      } else {
        y += i;
      }
      const e = this.board?.at(this.boardIndex(x, y));
      if (e == c) {
        intersections += 1;
      } else if (e != 32) {
        return { valid: false, intersections };
      }
    }
    return { valid: true, intersections };
  }

  /**
   * Helper function to compute the index within the `board` array to
   * use for a given x/y coordinate. Array itself is flattened. Notably,
   * will also check bounds and throw if there's an error.
   */
  boardIndex(x: number, y: number): number {
    if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
      throw new Error(`invalid board index access (${x},${y})`);
    }
    return this.size * y + x;
  }

  /**
   * Helper function to check if a given board index is empty.
   */
  isEmpty(x: number, y: number): boolean {
    return this.board![this.boardIndex(x, y)] == 32;
  }

  /**
   * Pick the best spot for a given word, maximising intersections.
   * Returns undefined if no best spot found, i.e. un-placeable.
   */
  pickBestSpot(
    word: string
  ): { x: number; y: number; dir: Direction } | undefined {
    if (word.length > this.size) {
      return undefined;
    }
    const directions = [Direction.Horizontal, Direction.Vertical];
    var maxIntersections:
      | {
          x: number;
          y: number;
          dir: Direction;
          intersections: number;
        }
      | undefined;
    let w = new Word(0, word, 0, 0, Direction.Horizontal);
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        directions.forEach((d) => {
          if (d == Direction.Horizontal) {
            if (x + word.length > this.size) return;
            for (let i = 0; i < word.length; i++) {
              if (
                (y - 1 >= 0 && !this.isEmpty(x, y - 1)) ||
                (y + 1 < this.size && !this.isEmpty(x, y + 1))
              ) {
                return;
              }
            }
            if (x - 1 >= 0 && !this.isEmpty(x - 1, y)) return;
            if (
              x + word.length + 1 < this.size &&
              !this.isEmpty(x + word.length + 1, y)
            )
              return;
          } else if (d == Direction.Vertical) {
            if (y + word.length > this.size) return;
            for (let i = 0; i < word.length; i++) {
              if (
                (x - 1 >= 0 && !this.isEmpty(x - 1, y)) ||
                (x + 1 < this.size && !this.isEmpty(x + 1, y))
              ) {
                return;
              }
            }
            if (y - 1 >= 0 && !this.isEmpty(x, y - 1)) return;
            if (
              y + word.length + 1 < this.size &&
              !this.isEmpty(x, y + word.length + 1)
            )
              return;
          }
          w.x = x;
          w.y = y;
          w.dir = d;
          const can = this.canAddWord(w);
          if (
            can.valid &&
            (!maxIntersections ||
              can.intersections > maxIntersections.intersections)
          ) {
            maxIntersections = {
              x: w.x,
              y: w.y,
              dir: w.dir,
              intersections: can.intersections,
            };
          }
        });
      }
    }
    return maxIntersections;
  }

  /**
   * Generates a new crossword, given a set of words.
   *
   * A few notes:
   * - Isn't required to use all the words.
   * - Uses the existing `this.size` to determine game board size.
   */
  generateNew(wordlist: { id: number; word: string }[]) {
    this.words = [];
    this.board = this.generateBoard();
    let shuffled = shuffle(wordlist);
    for (let i = 0; i < shuffled.length; i++) {
      const best = this.pickBestSpot(shuffled[i].word);
      if (best) {
        let w = new Word(
          shuffled[i].id,
          shuffled[i].word,
          best.x,
          best.y,
          best.dir
        );
        this.words.push(w);
        this.addWordToBoard(this.board, w);
      }
    }
  }

  /**
   * Encodes a board state into a serializable string encoded in base64.
   */
  encode(): string {
    let str = `${this.size}|` + this.words.map((w) => w.encode()).join("|");
    return Buffer.from(str).toString("base64");
  }

  /**
   * Decodes a board state from a serialized string. Overwrites contents of current
   * crossword object.
   */
  decode(encoded: string) {
    encoded = Buffer.from(encoded, "base64").toString("utf8");
    var size: number | undefined = undefined;
    var words: Word[] = [];
    var index = encoded.indexOf("|");
    while (encoded.length > 0) {
      let substr = encoded;
      if (index != -1) {
        substr = encoded.substring(0, index);
      }
      if (!size) {
        size = parseInt(substr);
      } else {
        const parts = substr.split(",");
        words.push(
          new Word(
            parseInt(parts[0]),
            parts[1],
            parseInt(parts[2]),
            parseInt(parts[3]),
            parseInt(parts[4])
          )
        );
      }
      if (index == -1) {
        break;
      }
      encoded = encoded.substring(index + 1);
      index = encoded.indexOf("|");
    }
    if (!size) {
      throw new Error("size invalid, decoding failed");
    }
    this.size = size as number;
    this.words = words;
    this.board = this.generateBoard();
  }
}

export class Word {
  id: number;
  word: string;
  x: number;
  y: number;
  dir: Direction;

  constructor(id: number, word: string, x: number, y: number, dir: Direction) {
    this.id = id;
    this.word = word;
    this.x = x;
    this.y = y;
    this.dir = dir;
  }

  encode(): string {
    return `${this.id},${this.word},${this.x},${this.y},${this.dir.valueOf()}`;
  }
}

export enum Direction {
  Horizontal,
  Vertical,
}

function shuffle<T>(arr: T[]): T[] {
  let current = arr.length;
  let random;
  while (current != 0) {
    random = Math.floor(Math.random() * current);
    current--;
    [arr[current], arr[random]] = [arr[random], arr[current]];
  }
  return arr;
}
