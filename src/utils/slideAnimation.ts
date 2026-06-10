export function slideEntryAnimationClass(currentSlideIndex: number, previousSlideIndex: number) {
  if (currentSlideIndex === previousSlideIndex) return "";
  const direction = currentSlideIndex > previousSlideIndex ? "forward" : "backward";
  return `is-slide-entering slide-enter-${direction}`;
}

export function hasPendingSlideEntryAnimation(slideChangeKey: number, consumedSlideChangeKey: number) {
  return slideChangeKey !== consumedSlideChangeKey;
}
