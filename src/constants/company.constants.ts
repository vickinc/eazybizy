export const ENTITY_TYPES = [
  'LTD',
  'LLC',
  'Corporation',
  'Partnership',
  'Sole Proprietor',
  'Other'
] as const;

export type EntityType = typeof ENTITY_TYPES[number];