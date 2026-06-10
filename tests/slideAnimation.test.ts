import { describe, expect, it } from "vitest";
import { hasPendingSlideEntryAnimation, slideEntryAnimationClass } from "../src/utils/slideAnimation";

describe("slide entry animation gating", () => {
  it("does not animate when the current slide did not change", () => {
    expect(slideEntryAnimationClass(12, 12)).toBe("");
  });

  it("animates only when moving to a different slide", () => {
    expect(slideEntryAnimationClass(13, 12)).toBe("is-slide-entering slide-enter-forward");
    expect(slideEntryAnimationClass(11, 12)).toBe("is-slide-entering slide-enter-backward");
  });

  it("keeps entry animation pending only until the slide change key is consumed", () => {
    expect(hasPendingSlideEntryAnimation(4, 3)).toBe(true);
    expect(hasPendingSlideEntryAnimation(4, 4)).toBe(false);
  });
});
