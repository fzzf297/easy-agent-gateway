import { describe, expect, it } from "vitest";

import { enterpriseA2UIComponentApis } from "../src/a2ui/catalog";

const expectedFields: Record<string, string[]> = {
  AiText: ["text", "variant"],
  AiCard: ["children"],
  AiRow: ["children"],
  AiColumn: ["children"],
  AiAlert: ["text", "tone"],
  AiInput: ["label", "value", "placeholder", "inputType", "required", "disabled"],
  AiSelect: ["label", "value", "options", "placeholder", "required", "disabled"],
  AiButton: ["label", "action", "disabled"],
  AiConfirmButton: ["label", "action", "disabled"],
  AiTable: ["columns", "rows", "emptyText"]
};

describe("enterprise A2UI catalog contract", () => {
  it("contains exactly the ten approved component APIs and fields", () => {
    expect([...enterpriseA2UIComponentApis.keys()]).toEqual(Object.keys(expectedFields));
    for (const [name, fields] of Object.entries(expectedFields)) {
      const api = enterpriseA2UIComponentApis.get(name);
      expect(api).toBeDefined();
      expect(Object.keys(api?.schema.shape || {})).toEqual(fields);
    }
  });

  it("does not allow free-form injection properties", () => {
    const textApi = enterpriseA2UIComponentApis.get("AiText");
    expect(textApi?.schema.safeParse({ text: "safe", html: "<script />" }).success).toBe(false);
    expect(textApi?.schema.safeParse({ text: "safe", class: "host-class" }).success).toBe(false);
  });
});
