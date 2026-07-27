import {
  ActionSchema,
  Catalog,
  ChildListSchema,
  DataBindingSchema,
  DynamicBooleanSchema,
  DynamicStringSchema,
  type ComponentApi,
  type ComponentContext
} from "@a2ui/web_core/v0_9";
import {
  A2uiController,
  A2uiLitElement,
  type LitComponentApi
} from "@a2ui/lit/v0_9";
import { css, html, nothing } from "lit";
import { z } from "zod";

import { A2UI_CATALOG_ID } from "./constants";

const textVariantSchema = z.enum(["h1", "h2", "h3", "body", "caption"]);
const alertToneSchema = z.enum(["info", "success", "warning", "error"]);
const inputTypeSchema = z.enum(["text", "number", "password", "textarea"]);
const optionSchema = z.object({ label: z.string(), value: z.string() }).strict();
const optionsSchema = z.union([z.array(optionSchema), DataBindingSchema]);
const columnsSchema = z.union([z.array(z.string()).max(12), DataBindingSchema]);
const rowsSchema = z.union([z.array(z.record(z.unknown())).max(50), DataBindingSchema]);

export const AiTextApi = {
  name: "AiText",
  schema: z.object({ text: DynamicStringSchema, variant: textVariantSchema.optional() }).strict()
};

export const AiCardApi = {
  name: "AiCard",
  schema: z.object({ children: ChildListSchema }).strict()
};

export const AiRowApi = {
  name: "AiRow",
  schema: z.object({ children: ChildListSchema }).strict()
};

export const AiColumnApi = {
  name: "AiColumn",
  schema: z.object({ children: ChildListSchema }).strict()
};

export const AiAlertApi = {
  name: "AiAlert",
  schema: z.object({ text: DynamicStringSchema, tone: alertToneSchema.optional() }).strict()
};

export const AiInputApi = {
  name: "AiInput",
  schema: z
    .object({
      label: DynamicStringSchema,
      value: DynamicStringSchema,
      placeholder: DynamicStringSchema.optional(),
      inputType: inputTypeSchema.optional(),
      required: z.boolean().optional(),
      disabled: DynamicBooleanSchema.optional()
    })
    .strict()
};

export const AiSelectApi = {
  name: "AiSelect",
  schema: z
    .object({
      label: DynamicStringSchema,
      value: DynamicStringSchema,
      options: optionsSchema,
      placeholder: DynamicStringSchema.optional(),
      required: z.boolean().optional(),
      disabled: DynamicBooleanSchema.optional()
    })
    .strict()
};

export const AiButtonApi = {
  name: "AiButton",
  schema: z
    .object({
      label: DynamicStringSchema,
      action: ActionSchema,
      disabled: DynamicBooleanSchema.optional()
    })
    .strict()
};

export const AiConfirmButtonApi = {
  name: "AiConfirmButton",
  schema: z
    .object({
      label: DynamicStringSchema,
      action: ActionSchema,
      disabled: DynamicBooleanSchema.optional()
    })
    .strict()
};

export const AiTableApi = {
  name: "AiTable",
  schema: z
    .object({
      columns: columnsSchema,
      rows: rowsSchema,
      emptyText: DynamicStringSchema.optional()
    })
    .strict()
};

const surfaceDomPrefixes = new WeakMap<object, string>();

export function registerSurfaceDomPrefix(surface: object, chatInstanceId: string) {
  surfaceDomPrefixes.set(surface, `eag-a2ui-${sanitizeDomToken(chatInstanceId)}`);
}

function componentDomId(context: ComponentContext) {
  const surface = context.dataContext.surface;
  let prefix = surfaceDomPrefixes.get(surface);
  if (!prefix) {
    prefix = `eag-a2ui-${createRandomToken()}`;
    surfaceDomPrefixes.set(surface, prefix);
  }
  return [
    prefix,
    sanitizeDomToken(surface.id),
    sanitizeDomToken(context.componentModel.id)
  ].join("-");
}

function sanitizeDomToken(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function createRandomToken() {
  return globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
}

abstract class EnterpriseA2UIElement<Api extends ComponentApi> extends A2uiLitElement<Api> {
  static baseStyles = css`
    :host {
      box-sizing: border-box;
      color: var(--eag-text, #172033);
      font: inherit;
    }
    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }
    button,
    input,
    select,
    textarea {
      font: inherit;
    }
    button:focus-visible,
    input:focus-visible,
    select:focus-visible,
    textarea:focus-visible {
      outline: 3px solid color-mix(in srgb, var(--eag-primary, #2563eb) 24%, transparent);
      outline-offset: 2px;
    }
  `;

  protected dispatchComponentAction() {
    const action = this.context.componentModel.properties.action;
    if (!action) return Promise.resolve();
    return this.context.dispatchAction(this.context.dataContext.resolveAction(action));
  }
}

class AiTextElement extends EnterpriseA2UIElement<typeof AiTextApi> {
  static styles = [
    EnterpriseA2UIElement.baseStyles,
    css`
      :host {
        display: block;
      }
      h1,
      h2,
      h3,
      p {
        margin: 0;
      }
      h1 {
        font-size: 22px;
      }
      h2 {
        font-size: 19px;
      }
      h3 {
        font-size: 16px;
      }
      p {
        line-height: 1.6;
      }
      .caption {
        color: var(--eag-muted, #667085);
        font-size: 12px;
      }
    `
  ];

  protected createController() {
    return new A2uiController(this, AiTextApi);
  }

  render() {
    const props = this.controller.props;
    if (!props) return nothing;
    const text = String(props.text ?? "");
    if (props.variant === "h1") return html`<h1>${text}</h1>`;
    if (props.variant === "h2") return html`<h2>${text}</h2>`;
    if (props.variant === "h3") return html`<h3>${text}</h3>`;
    if (props.variant === "caption") return html`<span class="caption">${text}</span>`;
    return html`<p>${text}</p>`;
  }
}

abstract class ChildrenElement<Api extends ComponentApi> extends EnterpriseA2UIElement<Api> {
  protected renderChildren(children: unknown) {
    if (!Array.isArray(children)) return nothing;
    return children.map((child) => this.renderNode(child));
  }
}

class AiCardElement extends ChildrenElement<typeof AiCardApi> {
  static styles = [
    EnterpriseA2UIElement.baseStyles,
    css`
      :host {
        display: block;
        padding: 14px;
        background: var(--eag-surface, #f7f9fc);
        border: 1px solid var(--eag-border, #e7ebf2);
        border-radius: 12px;
      }
      .content {
        display: grid;
        gap: 12px;
      }
    `
  ];
  protected createController() {
    return new A2uiController(this, AiCardApi);
  }
  render() {
    const props = this.controller.props;
    return props ? html`<div class="content">${this.renderChildren(props.children)}</div>` : nothing;
  }
}

class AiRowElement extends ChildrenElement<typeof AiRowApi> {
  static styles = [
    EnterpriseA2UIElement.baseStyles,
    css`
      :host {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
      }
    `
  ];
  protected createController() {
    return new A2uiController(this, AiRowApi);
  }
  render() {
    const props = this.controller.props;
    return props ? this.renderChildren(props.children) : nothing;
  }
}

class AiColumnElement extends ChildrenElement<typeof AiColumnApi> {
  static styles = [
    EnterpriseA2UIElement.baseStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
    `
  ];
  protected createController() {
    return new A2uiController(this, AiColumnApi);
  }
  render() {
    const props = this.controller.props;
    return props ? this.renderChildren(props.children) : nothing;
  }
}

class AiAlertElement extends EnterpriseA2UIElement<typeof AiAlertApi> {
  static styles = [
    EnterpriseA2UIElement.baseStyles,
    css`
      :host {
        display: block;
      }
      .alert {
        padding: 10px 12px;
        border: 1px solid var(--alert-border);
        border-radius: 9px;
        color: var(--alert-text);
        background: var(--alert-bg);
        line-height: 1.5;
      }
      .info {
        --alert-bg: #eff6ff;
        --alert-border: #bfdbfe;
        --alert-text: #1e40af;
      }
      .success {
        --alert-bg: #ecfdf3;
        --alert-border: #a7f3d0;
        --alert-text: #166534;
      }
      .warning {
        --alert-bg: #fffbeb;
        --alert-border: #fde68a;
        --alert-text: #92400e;
      }
      .error {
        --alert-bg: #fef2f2;
        --alert-border: #fecaca;
        --alert-text: #991b1b;
      }
    `
  ];
  protected createController() {
    return new A2uiController(this, AiAlertApi);
  }
  render() {
    const props = this.controller.props;
    if (!props) return nothing;
    return html`<div class="alert ${props.tone || "info"}" role="status">${String(
      props.text ?? ""
    )}</div>`;
  }
}

class AiInputElement extends EnterpriseA2UIElement<typeof AiInputApi> {
  static styles = [
    EnterpriseA2UIElement.baseStyles,
    css`
      :host {
        display: block;
      }
      label {
        display: grid;
        gap: 6px;
        color: var(--eag-text, #172033);
        font-size: 13px;
        font-weight: 600;
      }
      input,
      textarea {
        width: 100%;
        padding: 9px 10px;
        color: var(--eag-text, #172033);
        background: var(--eag-bg, #fff);
        border: 1px solid var(--eag-border, #d0d5dd);
        border-radius: 8px;
        resize: vertical;
      }
    `
  ];
  protected createController() {
    return new A2uiController(this, AiInputApi);
  }
  private handleInput(event: Event) {
    const target = event.currentTarget as HTMLInputElement | HTMLTextAreaElement;
    this.controller.props?.setValue(target.value);
  }
  render() {
    const props = this.controller.props;
    if (!props) return nothing;
    const id = componentDomId(this.context);
    const label = String(props.label ?? "");
    const placeholder = String(props.placeholder ?? "");
    if (props.inputType === "textarea") {
      return html`<label for=${id}
        >${label}<textarea
          id=${id}
          .value=${String(props.value ?? "")}
          placeholder=${placeholder}
          ?required=${Boolean(props.required)}
          ?disabled=${Boolean(props.disabled)}
          @input=${this.handleInput}
        ></textarea></label
      >`;
    }
    const type = props.inputType === "number" || props.inputType === "password" ? props.inputType : "text";
    return html`<label for=${id}
      >${label}<input
        id=${id}
        type=${type}
        .value=${String(props.value ?? "")}
        placeholder=${placeholder}
        ?required=${Boolean(props.required)}
        ?disabled=${Boolean(props.disabled)}
        @input=${this.handleInput}
      />
    </label>`;
  }
}

class AiSelectElement extends EnterpriseA2UIElement<typeof AiSelectApi> {
  static styles = [
    EnterpriseA2UIElement.baseStyles,
    css`
      :host {
        display: block;
      }
      label {
        display: grid;
        gap: 6px;
        font-size: 13px;
        font-weight: 600;
      }
      select {
        width: 100%;
        padding: 9px 10px;
        color: var(--eag-text, #172033);
        background: var(--eag-bg, #fff);
        border: 1px solid var(--eag-border, #d0d5dd);
        border-radius: 8px;
      }
    `
  ];
  protected createController() {
    return new A2uiController(this, AiSelectApi);
  }
  private handleChange(event: Event) {
    this.controller.props?.setValue((event.currentTarget as HTMLSelectElement).value);
  }
  render() {
    const props = this.controller.props;
    if (!props) return nothing;
    const id = componentDomId(this.context);
    const options = Array.isArray(props.options) ? props.options : [];
    return html`<label for=${id}
      >${String(props.label ?? "")}<select
        id=${id}
        .value=${String(props.value ?? "")}
        ?required=${Boolean(props.required)}
        ?disabled=${Boolean(props.disabled)}
        @change=${this.handleChange}
      >
        ${props.placeholder
          ? html`<option value="" disabled>${String(props.placeholder)}</option>`
          : nothing}
        ${options.map(
          (option) =>
            html`<option value=${String(option.value ?? "")}>${String(
              option.label ?? option.value ?? ""
            )}</option>`
        )}
      </select></label
    >`;
  }
}

const buttonStyles = [
  EnterpriseA2UIElement.baseStyles,
  css`
    :host {
      display: inline-block;
    }
    button {
      min-height: 36px;
      padding: 8px 14px;
      color: #fff;
      cursor: pointer;
      background: var(--eag-primary, #2563eb);
      border: 0;
      border-radius: 8px;
    }
    button:hover:not(:disabled) {
      background: var(--eag-primary-hover, #1d4ed8);
    }
    button:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }
  `
];

class AiButtonElement extends EnterpriseA2UIElement<typeof AiButtonApi> {
  static styles = buttonStyles;
  private pending = false;
  protected createController() {
    return new A2uiController(this, AiButtonApi);
  }
  private async handleClick() {
    const action = this.controller.props?.action;
    if (!action || this.pending) return;
    this.pending = true;
    this.requestUpdate();
    try {
      await this.dispatchComponentAction();
    } finally {
      this.pending = false;
      this.requestUpdate();
    }
  }
  render() {
    const props = this.controller.props;
    if (!props) return nothing;
    return html`<button
      type="button"
      ?disabled=${this.pending || Boolean(props.disabled)}
      @click=${this.handleClick}
    >
      ${this.pending ? "处理中…" : String(props.label ?? "")}
    </button>`;
  }
}

class AiConfirmButtonElement extends EnterpriseA2UIElement<typeof AiConfirmButtonApi> {
  static styles = [
    buttonStyles,
    css`
      .confirm {
        display: grid;
        gap: 9px;
        padding: 10px;
        background: var(--eag-bg, #fff);
        border: 1px solid var(--eag-border, #e7ebf2);
        border-radius: 9px;
      }
      .confirm p {
        margin: 0;
        line-height: 1.5;
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
      .secondary {
        color: var(--eag-text, #172033);
        background: var(--eag-surface, #f7f9fc);
      }
    `
  ];
  private pending = false;
  private confirming = false;
  protected createController() {
    return new A2uiController(this, AiConfirmButtonApi);
  }
  private openConfirmation() {
    if (!this.controller.props?.disabled) {
      this.confirming = true;
      this.requestUpdate();
    }
  }
  private cancelConfirmation() {
    this.confirming = false;
    this.requestUpdate();
  }
  private async confirm() {
    const action = this.controller.props?.action;
    if (!action || this.pending) return;
    this.pending = true;
    this.requestUpdate();
    try {
      await this.dispatchComponentAction();
    } finally {
      this.pending = false;
      this.requestUpdate();
    }
  }
  render() {
    const props = this.controller.props;
    if (!props) return nothing;
    if (!this.confirming) {
      return html`<button
        type="button"
        ?disabled=${Boolean(props.disabled)}
        @click=${this.openConfirmation}
      >
        ${String(props.label ?? "")}
      </button>`;
    }
    return html`<div class="confirm" role="alertdialog" aria-modal="false">
      <p>该操作会写入业务数据，确认执行吗？</p>
      <div class="actions">
        <button class="secondary" type="button" ?disabled=${this.pending} @click=${this.cancelConfirmation}>
          取消
        </button>
        <button type="button" ?disabled=${this.pending} @click=${this.confirm}>
          ${this.pending ? "处理中…" : "确认"}
        </button>
      </div>
    </div>`;
  }
}

class AiTableElement extends EnterpriseA2UIElement<typeof AiTableApi> {
  static styles = [
    EnterpriseA2UIElement.baseStyles,
    css`
      :host {
        display: block;
        max-width: 100%;
        overflow-x: auto;
      }
      table {
        width: 100%;
        min-width: 360px;
        border-collapse: collapse;
        font-size: 13px;
      }
      th,
      td {
        padding: 8px 10px;
        text-align: left;
        vertical-align: top;
        border-bottom: 1px solid var(--eag-border, #e7ebf2);
      }
      th {
        color: var(--eag-muted, #667085);
        font-weight: 600;
        background: color-mix(in srgb, var(--eag-surface, #f7f9fc) 82%, transparent);
      }
      .empty {
        padding: 18px;
        color: var(--eag-muted, #667085);
        text-align: center;
      }
    `
  ];
  protected createController() {
    return new A2uiController(this, AiTableApi);
  }
  render() {
    const props = this.controller.props;
    if (!props) return nothing;
    const columns = Array.isArray(props.columns)
      ? props.columns.filter((item): item is string => typeof item === "string").slice(0, 12)
      : [];
    const rows = Array.isArray(props.rows)
      ? props.rows.filter(isRecord).slice(0, 50)
      : [];
    if (!columns.length || !rows.length) {
      return html`<div class="empty">${String(props.emptyText || "暂无数据")}</div>`;
    }
    return html`<table>
      <thead>
        <tr>${columns.map((column) => html`<th scope="col">${column}</th>`)}</tr>
      </thead>
      <tbody>
        ${rows.map(
          (row) => html`<tr>
            ${columns.map((column) => html`<td>${formatCell(row[column])}</td>`)}
          </tr>`
        )}
      </tbody>
    </table>`;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatCell(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

const components: Array<LitComponentApi & { tagName: string }> = [
  { ...AiTextApi, tagName: "eag-a2ui-text" },
  { ...AiCardApi, tagName: "eag-a2ui-card" },
  { ...AiRowApi, tagName: "eag-a2ui-row" },
  { ...AiColumnApi, tagName: "eag-a2ui-column" },
  { ...AiAlertApi, tagName: "eag-a2ui-alert" },
  { ...AiInputApi, tagName: "eag-a2ui-input" },
  { ...AiSelectApi, tagName: "eag-a2ui-select" },
  { ...AiButtonApi, tagName: "eag-a2ui-button" },
  { ...AiConfirmButtonApi, tagName: "eag-a2ui-confirm-button" },
  { ...AiTableApi, tagName: "eag-a2ui-table" }
];

export const enterpriseA2UIComponentApis = new Map(
  [
    AiTextApi,
    AiCardApi,
    AiRowApi,
    AiColumnApi,
    AiAlertApi,
    AiInputApi,
    AiSelectApi,
    AiButtonApi,
    AiConfirmButtonApi,
    AiTableApi
  ].map((api) => [api.name, api] as const)
);

export const enterpriseA2UICatalog = new Catalog<LitComponentApi>(A2UI_CATALOG_ID, components);

export function defineEnterpriseA2UIElements() {
  defineElement("eag-a2ui-text", AiTextElement);
  defineElement("eag-a2ui-card", AiCardElement);
  defineElement("eag-a2ui-row", AiRowElement);
  defineElement("eag-a2ui-column", AiColumnElement);
  defineElement("eag-a2ui-alert", AiAlertElement);
  defineElement("eag-a2ui-input", AiInputElement);
  defineElement("eag-a2ui-select", AiSelectElement);
  defineElement("eag-a2ui-button", AiButtonElement);
  defineElement("eag-a2ui-confirm-button", AiConfirmButtonElement);
  defineElement("eag-a2ui-table", AiTableElement);
}

function defineElement(tagName: string, constructor: CustomElementConstructor) {
  if (typeof window !== "undefined" && window.customElements && !window.customElements.get(tagName)) {
    window.customElements.define(tagName, constructor);
  }
}
