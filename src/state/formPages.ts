import type { FormPageSpec } from './formPage';
import { on428 } from './forms/on428';

/** Every form that has a page. Adding a form is one entry here and one file in `forms/`. */
export const formPages: FormPageSpec[] = [on428];
