import type { FormPageSpec } from './formPage';
import { on428 } from './forms/on428';
import { t2204 } from './forms/t2204';
import { schedule6 } from './forms/schedule6';
import { on428a } from './forms/on428a';
import { bc479 } from './forms/bc479';

/** Every form that has a page. Adding a form is one entry here and one file in `forms/`. */
export const formPages: FormPageSpec[] = [
  on428,
  t2204,
  schedule6,
  on428a,
  bc479,
];
