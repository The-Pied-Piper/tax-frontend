import type { FormPageSpec } from './formPage';
import { on428 } from './forms/on428';
import { t4 } from './forms/t4';
import { ab428 } from './forms/ab428';
import { bc428 } from './forms/bc428';

/** Every form that has a page. Adding a form is one entry here and one file in `forms/`. */
export const formPages: FormPageSpec[] = [on428, t4, ab428, bc428];
