import { describe, expect, it } from "vitest";
import { toCsv } from "./to-csv";

describe("toCsv", () => {
  it("quotes cells with commas, quotes and line breaks", () => {
    expect(toCsv([{ a: 'say "hi"', b: "x,y", c: "1\n2" }])).toBe(
      'a,b,c\r\n"say ""hi""","x,y","1\n2"',
    );
  });

  it("unions keys across rows and leaves missing cells empty", () => {
    expect(toCsv([{ a: 1 }, { b: true, a: null }])).toBe("a,b\r\n1,\r\n,true");
  });

  it("serializes dates and objects", () => {
    expect(toCsv([{ d: new Date("2026-01-02T00:00:00Z"), o: { k: 1 } }])).toBe(
      'd,o\r\n2026-01-02T00:00:00.000Z,"{""k"":1}"',
    );
  });
});
