export type DatabaseProvider = {
  name: string;
  url: string;
  index: number;
};

export type ProviderRotator = {
  allProviders: () => DatabaseProvider[];
  nextWriteProvider: () => DatabaseProvider | null;
};

export function parseDatabaseProviders(raw: string | undefined | null): DatabaseProvider[] {
  return (raw || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((url, index) => ({
      name: `provider_${index + 1}`,
      url,
      index,
    }));
}

export function createProviderRotator(
  providers: DatabaseProvider[],
  initialIndex = randomInitialIndex(providers.length),
): ProviderRotator {
  const normalizedInitial = providers.length ? modulo(initialIndex, providers.length) : 0;
  let cursor = normalizedInitial;

  return {
    allProviders: () => [...providers],
    nextWriteProvider: () => {
      if (!providers.length) return null;
      const provider = providers[cursor];
      cursor = modulo(cursor + 1, providers.length);
      return provider;
    },
  };
}

function randomInitialIndex(length: number) {
  if (length <= 0) return 0;
  return Math.floor(Math.random() * length);
}

function modulo(value: number, length: number) {
  return ((value % length) + length) % length;
}

