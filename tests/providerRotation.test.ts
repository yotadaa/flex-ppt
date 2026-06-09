import { describe, expect, it } from "vitest";
import { createProviderRotator, parseDatabaseProviders } from "../src/server/providerRotation";

describe("database provider rotation", () => {
  it("parses comma-separated database urls into named providers", () => {
    const providers = parseDatabaseProviders(" postgresql://one , postgresql://two,postgresql://three ");

    expect(providers).toEqual([
      { name: "provider_1", url: "postgresql://one", index: 0, dialect: "postgres" },
      { name: "provider_2", url: "postgresql://two", index: 1, dialect: "postgres" },
      { name: "provider_3", url: "postgresql://three", index: 2, dialect: "postgres" },
    ]);
  });

  it("detects local mysql providers", () => {
    const providers = parseDatabaseProviders("mysql://root:password@127.0.0.1:3306/flex_ppt");

    expect(providers[0]).toMatchObject({
      name: "provider_1",
      dialect: "mysql",
      url: "mysql://root:password@127.0.0.1:3306/flex_ppt",
    });
  });

  it("starts from the injected initial index and then rotates", () => {
    const providers = parseDatabaseProviders("postgresql://one,postgresql://two,postgresql://three");
    const rotator = createProviderRotator(providers, 1);

    expect(rotator.nextWriteProvider()?.name).toBe("provider_2");
    expect(rotator.nextWriteProvider()?.name).toBe("provider_3");
    expect(rotator.nextWriteProvider()?.name).toBe("provider_1");
  });

  it("returns null when no database provider is configured", () => {
    const rotator = createProviderRotator(parseDatabaseProviders(""));

    expect(rotator.nextWriteProvider()).toBeNull();
    expect(rotator.allProviders()).toEqual([]);
  });
});
