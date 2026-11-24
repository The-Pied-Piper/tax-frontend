import { strings } from '../strings';

type PageText = {
  description: (
    salary: string,
    place: string,
    year: number,
    takeHome: string,
  ) => string;
  paragraph: (
    salary: string,
    place: string,
    year: number,
    takeHome: string,
    takenOff: string,
    averageRate: string,
    marginalRate: string,
  ) => string;
};

type Help = { name: string; help: string };

/** The wording that depends on what is taken off in a place: the answer card's help texts and the page's sentences. */
export type Wording = {
  answer: { takenOff: Help; averageRate: Help; marginalRate: Help };
  pageText: PageText;
};

const DEFAULT: Wording = {
  answer: {
    takenOff: strings.answer.takenOff,
    averageRate: strings.answer.averageRate,
    marginalRate: strings.answer.marginalRate,
  },
  pageText: strings.pageText,
};

const quebec = strings.quebecWording;
const QUEBEC: Wording = {
  answer: {
    takenOff: {
      name: strings.answer.takenOff.name,
      help: quebec.answer.takenOff,
    },
    averageRate: {
      name: strings.answer.averageRate.name,
      help: quebec.answer.averageRate,
    },
    marginalRate: {
      name: strings.answer.marginalRate.name,
      help: quebec.answer.marginalRate,
    },
  },
  pageText: quebec.pageText,
};

/** Quebec words its pension, parental insurance and drug premium; every other place uses the shared wording. */
export function wordingFor(jurisdictionCode: string): Wording {
  return jurisdictionCode === 'CA-QC' ? QUEBEC : DEFAULT;
}
