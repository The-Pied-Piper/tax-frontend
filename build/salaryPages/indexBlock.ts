import { SALARY_INDEX_ID, type SalaryIndex } from '../../src/state/salaryIndex';

/** The index as a JSON data block: it cannot end its own script element or start a comment inside it. */
export function indexBlock(index: SalaryIndex): string {
  const json = JSON.stringify(index).replace(/</g, '\\u003c');
  return `<script type="application/json" id="${SALARY_INDEX_ID}">${json}</script>`;
}
