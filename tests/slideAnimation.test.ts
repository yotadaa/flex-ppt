import { describe, expect, it } from "vitest";
import { slideEntryAnimationClass } from "../src/utils/slideAnimation";

describe("slide entry animation gating", () => {
  it("does not animate when the current slide did not change", () => {
    expect(slideEntryAnimationClass(12, 12)).toBe("");
  });

  it("animates only when moving to a different slide", () => {
    expect(slideEntryAnimationClass(13, 12)).toBe("is-slide-entering slide-enter-forward");
    expect(slideEntryAnimationClass(11, 12)).toBe("is-slide-entering slide-enter-backward");
  });
});
