import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { SALARY_STEPS } from '../test/comparisonData';
import { cad } from '../test/units';
import { strings } from '../strings';
import { SalarySlider } from './SalarySlider';

const copy = strings.hubCharts.comparison;
// $1,000 to $250,000 every $1,000, then $5,000 to $500,000, as the build writes them.
const salaries = SALARY_STEPS;

function Harness({ start = 69 }: { start?: number }) {
  const [index, setIndex] = useState(start);
  return (
    <SalarySlider
      salaries={salaries}
      index={index}
      unit={cad}
      onChange={setIndex}
    />
  );
}

const slider = () => screen.getByRole('slider', { name: copy.salaryLabel });
const box = () => screen.getByRole('textbox', { name: copy.typedLabel });

describe('SalarySlider', () => {
  it('shows the label with the salary beside it, and says it in words for a screen reader', () => {
    render(<Harness />);
    expect(slider()).toHaveAttribute('aria-valuetext', '$70,000 a year');
    expect(screen.getByText('$70,000')).toBeInTheDocument();
    expect(screen.getByText('$1,000')).toBeInTheDocument();
    expect(screen.getByText('$500,000')).toBeInTheDocument();
  });

  it('has one step for each point of the sweep, taken from the points', () => {
    render(<Harness />);
    expect(slider()).toHaveAttribute('min', '0');
    expect(slider()).toHaveAttribute('max', String(salaries.length - 1));
    expect(slider()).toHaveAttribute('step', '1');
    expect(slider()).toHaveValue('69');
  });

  it('moves the salary with the slider, past $250,000 in steps of $5,000', () => {
    render(<Harness />);
    fireEvent.change(slider(), { target: { value: '0' } });
    expect(slider()).toHaveAttribute('aria-valuetext', '$1,000 a year');
    expect(box()).toHaveValue('1,000');
    fireEvent.change(slider(), { target: { value: '250' } });
    expect(slider()).toHaveAttribute('aria-valuetext', '$255,000 a year');
    expect(box()).toHaveValue('255,000');
    fireEvent.change(slider(), { target: { value: '299' } });
    expect(slider()).toHaveAttribute('aria-valuetext', '$500,000 a year');
  });

  it('shows the three lines of help the slider and box are described by', () => {
    render(<Harness />);
    for (const line of [copy.hint, copy.stepNote, copy.typedNote]) {
      expect(screen.getByText(line)).toBeInTheDocument();
    }
    const hint = screen.getByText(copy.hint).parentElement;
    expect(slider().getAttribute('aria-describedby')).toBe(hint?.id);
    expect(box().getAttribute('aria-describedby')).toBe(hint?.id);
  });

  it('starts the box at the chosen salary', () => {
    render(<Harness />);
    expect(box()).toHaveValue('70,000');
    expect(box()).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('snaps a typed salary to the nearest point when the box is left', () => {
    render(<Harness />);
    fireEvent.change(box(), { target: { value: '45,300' } });
    // Nothing moves while the person is still typing.
    expect(slider()).toHaveAttribute('aria-valuetext', '$70,000 a year');
    fireEvent.blur(box());
    expect(slider()).toHaveAttribute('aria-valuetext', '$45,000 a year');
    expect(box()).toHaveValue('45,000');
  });

  it('snaps a typed salary on Enter, and snaps one above $250,000 to a step of $5,000', () => {
    render(<Harness />);
    fireEvent.change(box(), { target: { value: '253000' } });
    fireEvent.keyDown(box(), { key: 'Enter' });
    expect(slider()).toHaveAttribute('aria-valuetext', '$255,000 a year');
    expect(box()).toHaveValue('255,000');
  });

  it('refuses a salary outside the sweep with the approved words and keeps the salary', () => {
    render(<Harness />);
    fireEvent.change(box(), { target: { value: '600000' } });
    fireEvent.blur(box());
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Enter a salary from $1,000 to $500,000.',
    );
    expect(box()).toHaveAttribute('aria-invalid', 'true');
    expect(box().getAttribute('aria-describedby')).toContain(
      screen.getByRole('alert').id,
    );
    expect(box()).toHaveValue('600000');
    expect(slider()).toHaveAttribute('aria-valuetext', '$70,000 a year');
  });

  it('refuses text that is not a salary and clears the refusal when a good one is typed', () => {
    render(<Harness />);
    fireEvent.change(box(), { target: { value: 'lots' } });
    fireEvent.blur(box());
    expect(screen.getByRole('alert')).toBeInTheDocument();
    fireEvent.change(box(), { target: { value: '90000' } });
    fireEvent.blur(box());
    expect(screen.queryByRole('alert')).toBeNull();
    expect(slider()).toHaveAttribute('aria-valuetext', '$90,000 a year');
  });

  it('clears the refusal and the draft when the slider moves', () => {
    render(<Harness />);
    fireEvent.change(box(), { target: { value: '9' } });
    fireEvent.blur(box());
    expect(screen.getByRole('alert')).toBeInTheDocument();
    fireEvent.change(slider(), { target: { value: '10' } });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(box()).toHaveValue('11,000');
  });

  it('leaves the salary alone when the box is left untouched', () => {
    render(<Harness start={5} />);
    fireEvent.blur(box());
    expect(slider()).toHaveAttribute('aria-valuetext', '$6,000 a year');
  });
});
