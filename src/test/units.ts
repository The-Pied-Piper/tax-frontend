import type { Unit } from '../api';

// Units as the API sends them, read from the saved engine responses.
export const cad: Unit = {
  name: 'ca/cad',
  placement: 'before',
  singular: 'CA$',
  plural: 'CA$',
  spaced: false,
};

export const months: Unit = {
  name: 'core/months',
  placement: 'after',
  singular: 'month',
  plural: 'months',
  spaced: true,
};
