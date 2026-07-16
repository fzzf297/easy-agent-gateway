import { describe, expect, it, vi } from "vitest";

import { EasyAgentChatElement } from "../src/element";

type ElementKeydownHarness = {
  handleComposerKeyDown: (event: KeyboardEvent, form?: HTMLFormElement) => void;
};

function keydownHarness() {
  return new EasyAgentChatElement() as unknown as ElementKeydownHarness;
}

describe("EasyAgentChatElement composer keyboard handling", () => {
  it("keeps Backspace inside the shadow input so host-page guards cannot block editing", () => {
    const stopPropagation = vi.fn();
    const preventDefault = vi.fn();
    const event = {
      key: "Backspace",
      shiftKey: false,
      isComposing: false,
      stopPropagation,
      preventDefault
    } as unknown as KeyboardEvent;

    keydownHarness().handleComposerKeyDown(event);

    expect(stopPropagation).toHaveBeenCalledOnce();
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it("keeps Enter submission behavior unchanged", () => {
    const requestSubmit = vi.fn();
    const event = {
      key: "Enter",
      shiftKey: false,
      isComposing: false,
      stopPropagation: vi.fn(),
      preventDefault: vi.fn()
    } as unknown as KeyboardEvent;
    const form = { requestSubmit } as unknown as HTMLFormElement;

    keydownHarness().handleComposerKeyDown(event, form);

    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(requestSubmit).toHaveBeenCalledOnce();
  });
});
