import { A2uiSurface, type LitComponentApi } from "@a2ui/lit/v0_9";
import {
  MessageProcessor,
  type A2uiClientAction,
  type A2uiMessage,
  type Subscription,
  type SurfaceModel
} from "@a2ui/web_core/v0_9";

import type { AgentA2UIAction, AgentA2UIMessage } from "../types";
import {
  defineEnterpriseA2UIElements,
  enterpriseA2UICatalog,
  registerSurfaceDomPrefix
} from "./catalog";
import { A2UI_PROTOCOL_VERSION } from "./constants";
import {
  getAgentA2UIOperation,
  getAgentA2UISurfaceId,
  normalizeAgentA2UIMessage
} from "./normalize";

export interface AgentA2UIRuntimeCallbacks {
  onAction: (action: AgentA2UIAction) => void | Promise<void>;
  onSurfaceCreated?: (surfaceId: string) => void;
  onSurfaceDeleted?: (surfaceId: string) => void;
  onError?: (surfaceId: string | undefined, error: unknown) => void;
}

export interface ProcessedAgentA2UIMessage {
  message: AgentA2UIMessage;
  surfaceId: string;
  operation: ReturnType<typeof getAgentA2UIOperation>;
}

export class AgentA2UIRuntime {
  private processor!: MessageProcessor<LitComponentApi>;
  private processorSubscriptions: Subscription[] = [];
  private readonly surfaceSubscriptions = new Map<string, Subscription>();
  private readonly pendingMessages = new Map<string, AgentA2UIMessage[]>();

  constructor(
    private readonly chatInstanceId: string,
    private readonly callbacks: AgentA2UIRuntimeCallbacks
  ) {
    // Importing A2uiSurface registers <a2ui-surface>; retain a runtime reference so
    // bundlers cannot remove that registration as a type-only side effect.
    void A2uiSurface;
    defineEnterpriseA2UIElements();
    this.createProcessor();
  }

  process(input: unknown): ProcessedAgentA2UIMessage {
    const message = normalizeAgentA2UIMessage(input);
    const surfaceId = getAgentA2UISurfaceId(message);
    const operation = getAgentA2UIOperation(message);
    if (
      operation !== "createSurface" &&
      operation !== "deleteSurface" &&
      !this.processor.model.getSurface(surfaceId)
    ) {
      const pending = this.pendingMessages.get(surfaceId) || [];
      pending.push(message);
      this.pendingMessages.set(surfaceId, pending);
      return { message, surfaceId, operation };
    }
    this.processor.processMessages([message as A2uiMessage]);
    if (operation === "createSurface") {
      const pending = this.pendingMessages.get(surfaceId) || [];
      this.pendingMessages.delete(surfaceId);
      if (pending.length) this.processor.processMessages(pending as A2uiMessage[]);
    } else if (operation === "deleteSurface") {
      this.pendingMessages.delete(surfaceId);
    }
    return { message, surfaceId, operation };
  }

  getSurface(surfaceId: string): SurfaceModel<LitComponentApi> | undefined {
    return this.processor.model.getSurface(surfaceId);
  }

  get surfaceIds(): string[] {
    return [...this.processor.model.surfacesMap.keys()];
  }

  reset() {
    this.disposeProcessor();
    this.createProcessor();
  }

  dispose() {
    this.disposeProcessor();
  }

  private createProcessor() {
    this.processor = new MessageProcessor<LitComponentApi>(
      [enterpriseA2UICatalog],
      async (action) => this.callbacks.onAction(normalizeClientAction(action)),
      { version: A2UI_PROTOCOL_VERSION }
    );
    this.processorSubscriptions = [
      this.processor.onSurfaceCreated((surface) => {
        registerSurfaceDomPrefix(surface, this.chatInstanceId);
        const errorSubscription = surface.onError.subscribe((error) => {
          this.callbacks.onError?.(surface.id, error);
        });
        this.surfaceSubscriptions.set(surface.id, errorSubscription);
        this.callbacks.onSurfaceCreated?.(surface.id);
      }),
      this.processor.onSurfaceDeleted((surfaceId) => {
        this.surfaceSubscriptions.get(surfaceId)?.unsubscribe();
        this.surfaceSubscriptions.delete(surfaceId);
        this.callbacks.onSurfaceDeleted?.(surfaceId);
      })
    ];
  }

  private disposeProcessor() {
    for (const subscription of this.processorSubscriptions) subscription.unsubscribe();
    this.processorSubscriptions = [];
    for (const subscription of this.surfaceSubscriptions.values()) subscription.unsubscribe();
    this.surfaceSubscriptions.clear();
    this.pendingMessages.clear();
    this.processor?.model.dispose();
  }
}

function normalizeClientAction(action: A2uiClientAction): AgentA2UIAction {
  return {
    ...action,
    context: decodeLegacyContext(action.context)
  };
}

function decodeLegacyContext(context: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => {
      if (typeof value !== "string" || !value.startsWith("__eag_json__:")) return [key, value];
      try {
        return [key, JSON.parse(value.slice("__eag_json__:".length)) as unknown];
      } catch {
        return [key, value];
      }
    })
  );
}
