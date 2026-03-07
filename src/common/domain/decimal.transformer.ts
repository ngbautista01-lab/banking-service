export const decimalTransformer = {
  from: (value?: string | number | null): number =>
    value === null || value === undefined ? 0 : Number(value),
  to: (value?: number | null): number => Number(value ?? 0),
};
