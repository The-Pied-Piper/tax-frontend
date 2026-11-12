import type { Unit } from '../api';

// Units as the API sends them, read from the saved engine responses.
export const cad: Unit = {
  name: 'ca/cad',
  placement: 'before',
  singular: 'CA$',
  plural: 'CA$',
};

export const months: Unit = {
  name: 'months',
  placement: 'after',
  singular: 'month',
  plural: 'months',
};
