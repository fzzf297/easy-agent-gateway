/** @vitest-environment jsdom */

import type { A2uiSurface } from "@a2ui/lit/v0_9";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AgentA2UIRuntime } from "../src/a2ui/runtime";
import { A2UI_CATALOG_ID } from "../src/a2ui/constants";

const runtimes: AgentA2UIRuntime[] = [];

afterEach(() => {
  for (const runtime of runtimes) runtime.dispose();
  runtimes.length = 0;
  document.body.replaceChildren();
});

describe("AgentA2UIRuntime", () => {
  it("replays out-of-order updates after surface creation", () => {
    const runtime = createRuntime("chat-one");
    runtime.process(componentMessage("surface-one"));
    runtime.process(dataMessage("surface-one", "Alice"));
    expect(runtime.getSurface("surface-one")).toBeUndefined();

    runtime.process(createMessage("surface-one"));
    const surface = runtime.getSurface("surface-one");
    expect(surface?.componentsModel.get("root")).toBeDefined();
    expect(surface?.dataModel.get("/form/name")).toBe("Alice");
  });

  it("never maps protocol root to a DOM id and namespaces form ids per chat instance", async () => {
    const hostRoot = document.createElement("div");
    hostRoot.id = "root";
    document.body.append(hostRoot);

    const first = createRuntime("chat:one");
    const second = createRuntime("chat:two");
    const firstSurface = populate(first, "surface:shared", "First");
    const secondSurface = populate(second, "surface:shared", "Second");
    const firstElement = mountSurface(firstSurface);
    const secondElement = mountSurface(secondSurface);

    await settleLit(firstElement, secondElement);
    const ids = collectShadowDomIds(document.body).filter((id) => id !== "root");
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    expect(ids).toContain("eag-a2ui-chat-one-surface-shared-field");
    expect(ids).toContain("eag-a2ui-chat-two-surface-shared-field");
    expect(document.querySelectorAll('[id="root"]')).toHaveLength(1);
    expect(document.getElementById("root")).toBe(hostRoot);

    const input = findInShadowRoots<HTMLInputElement>(firstElement, "input");
    expect(input).toBeDefined();
    if (input) {
      input.value = "Updated";
      input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    }
    expect(firstSurface.dataModel.get("/form/name")).toBe("Updated");
    expect(secondSurface.dataModel.get("/form/name")).toBe("Second");
  });

  it("keeps an action disabled until the gateway handler settles", async () => {
    let finishAction: (() => void) | undefined;
    const onAction = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishAction = resolve;
        })
    );
    const runtime = new AgentA2UIRuntime("chat-action", { onAction });
    runtimes.push(runtime);
    runtime.process(createMessage("action-surface"));
    runtime.process({
      version: "v0.9",
      updateComponents: {
        surfaceId: "action-surface",
        components: [
          { id: "root", component: "AiCard", children: ["preview"] },
          {
            id: "preview",
            component: "AiButton",
            label: "Preview",
            action: {
              event: {
                name: "interface.write.preview",
                context: { projectCode: "demo" }
              }
            }
          }
        ]
      }
    });
    const surface = runtime.getSurface("action-surface");
    const element = mountSurface(surface);
    await settleLit(element);
    const button = findInShadowRoots<HTMLButtonElement>(element, "button");
    expect(button).toBeDefined();

    button?.click();
    button?.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onAction).toHaveBeenCalledOnce();
    expect(button?.disabled).toBe(true);

    finishAction?.();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(button?.disabled).toBe(false);
  });

  it("requires a second confirmation before dispatching a confirm action", async () => {
    const onAction = vi.fn();
    const runtime = new AgentA2UIRuntime("chat-confirm", { onAction });
    runtimes.push(runtime);
    runtime.process(createMessage("confirm-surface"));
    runtime.process({
      version: "v0.9",
      updateComponents: {
        surfaceId: "confirm-surface",
        components: [
          { id: "root", component: "AiCard", children: ["confirm"] },
          {
            id: "confirm",
            component: "AiConfirmButton",
            label: "Execute",
            action: {
              event: { name: "interface.write.confirm", context: { projectCode: "demo" } }
            }
          }
        ]
      }
    });
    const element = mountSurface(runtime.getSurface("confirm-surface"));
    await settleLit(element);
    const confirmElement = findInShadowRoots<HTMLElement>(element, "eag-a2ui-confirm-button");
    const initialButton = confirmElement?.shadowRoot?.querySelector<HTMLButtonElement>("button");

    initialButton?.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onAction).not.toHaveBeenCalled();
    expect(confirmElement?.shadowRoot?.querySelector('[role="alertdialog"]')).not.toBeNull();

    const buttons = confirmElement?.shadowRoot?.querySelectorAll<HTMLButtonElement>("button");
    buttons?.[1]?.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onAction).toHaveBeenCalledOnce();
  });

  it("renders catalog text as inert content", async () => {
    const runtime = createRuntime("chat-xss");
    runtime.process(createMessage("xss-surface"));
    runtime.process({
      version: "v0.9",
      updateComponents: {
        surfaceId: "xss-surface",
        components: [
          {
            id: "root",
            component: "AiText",
            text: '<img src=x onerror="globalThis.compromised=true">'
          }
        ]
      }
    });
    const element = mountSurface(runtime.getSurface("xss-surface"));
    await settleLit(element);
    const textElement = findInShadowRoots<HTMLElement>(element, "eag-a2ui-text");

    expect(textElement?.shadowRoot?.textContent).toContain("<img src=x");
    expect(findInShadowRoots(element, "img")).toBeUndefined();
    expect((globalThis as typeof globalThis & { compromised?: boolean }).compromised).toBeUndefined();
  });
});

function createRuntime(chatInstanceId: string) {
  const runtime = new AgentA2UIRuntime(chatInstanceId, { onAction: () => undefined });
  runtimes.push(runtime);
  return runtime;
}

function populate(runtime: AgentA2UIRuntime, surfaceId: string, value: string) {
  runtime.process(createMessage(surfaceId));
  runtime.process(componentMessage(surfaceId));
  runtime.process(dataMessage(surfaceId, value));
  const surface = runtime.getSurface(surfaceId);
  if (!surface) throw new Error("surface was not created");
  return surface;
}

function createMessage(surfaceId: string) {
  return {
    version: "v0.9",
    createSurface: { surfaceId, catalogId: A2UI_CATALOG_ID }
  };
}

function componentMessage(surfaceId: string) {
  return {
    version: "v0.9",
    updateComponents: {
      surfaceId,
      components: [
        { id: "root", component: "AiCard", children: ["field"] },
        {
          id: "field",
          component: "AiInput",
          label: "Name",
          value: { path: "/form/name" }
        }
      ]
    }
  };
}

function dataMessage(surfaceId: string, value: string) {
  return {
    version: "v0.9",
    updateDataModel: { surfaceId, path: "/", value: { form: { name: value } } }
  };
}

function mountSurface(surface: ReturnType<AgentA2UIRuntime["getSurface"]>) {
  const element = document.createElement("a2ui-surface") as A2uiSurface;
  element.dataset.a2uiSurfaceId = surface?.id;
  element.surface = surface;
  document.body.append(element);
  return element;
}

async function settleLit(...elements: A2uiSurface[]) {
  await Promise.all(elements.map((element) => element.updateComplete));
  await new Promise((resolve) => setTimeout(resolve, 0));
  await Promise.all(elements.map((element) => element.updateComplete));
}

function collectShadowDomIds(root: ParentNode): string[] {
  const ids: string[] = [];
  root.querySelectorAll<HTMLElement>("*").forEach((element) => {
    if (element.id) ids.push(element.id);
    if (element.shadowRoot) ids.push(...collectShadowDomIds(element.shadowRoot));
  });
  return ids;
}

function findInShadowRoots<T extends Element>(root: ParentNode, selector: string): T | undefined {
  const direct = root.querySelector<T>(selector);
  if (direct) return direct;
  if (root instanceof HTMLElement && root.shadowRoot) {
    const ownShadow = findInShadowRoots<T>(root.shadowRoot, selector);
    if (ownShadow) return ownShadow;
  }
  for (const element of root.querySelectorAll<HTMLElement>("*")) {
    if (!element.shadowRoot) continue;
    const nested = findInShadowRoots<T>(element.shadowRoot, selector);
    if (nested) return nested;
  }
  return undefined;
}
