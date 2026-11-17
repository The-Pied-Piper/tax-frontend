import type { FormPageSpec } from './formPage';
import { on428 } from './forms/on428';
import { schedule8 } from './forms/schedule8';
import { t1Income } from './forms/t1Income';
import { t1Tax } from './forms/t1Tax';

/** Every form that has a page. Adding a form is one entry here and one file in `forms/`. */
export const formPages: FormPageSpec[] = [on428, schedule8, t1Income, t1Tax];
