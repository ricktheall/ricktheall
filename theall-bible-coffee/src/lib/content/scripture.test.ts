import { describe, expect, it } from "vitest";

import { scriptureLayerSchema } from "./schema";

const base = {
  reference: "ปฐมกาล 1",
  translationId: null,
  text: null,
  rightsStatus: "reference-only" as const,
  attribution: null,
  license: null,
  copyrightNotice: null,
};

describe("the scripture layer enforces its own rights rules", () => {
  it("accepts a reference with no text", () => {
    expect(scriptureLayerSchema.safeParse(base).success).toBe(true);
  });

  it("refuses to carry text it has no licence for", () => {
    const parsed = scriptureLayerSchema.safeParse({ ...base, text: "ในปฐมกาล พระเจ้าทรงเนรมิตสร้าง…" });
    expect(parsed.success).toBe(false);
  });

  it("refuses licensed text that is missing its attribution", () => {
    const parsed = scriptureLayerSchema.safeParse({
      ...base,
      rightsStatus: "licensed",
      text: "…",
      translationId: "tcv2025",
      attribution: null,
      license: "CC BY-SA 4.0",
    });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    expect(parsed.error.issues[0]?.message).toContain("attribution");
  });

  it("accepts licensed text that carries translation, attribution and licence", () => {
    const parsed = scriptureLayerSchema.safeParse({
      reference: "ปฐมกาล 1",
      translationId: "example-2025",
      text: "…",
      rightsStatus: "licensed",
      attribution: "Example Translation",
      license: "CC BY-SA 4.0",
      copyrightNotice: "© Example",
    });
    expect(parsed.success).toBe(true);
  });
});
