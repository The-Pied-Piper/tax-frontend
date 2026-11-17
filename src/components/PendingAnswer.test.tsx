import { render, screen } from '@testing-library/react';
import { PendingAnswer } from './PendingAnswer';
import { strings } from '../strings';

describe('PendingAnswer', () => {
  it('shows what it holds with no busy mark when nothing is pending', () => {
    const { container } = render(
      <PendingAnswer pending={false}>
        <p>old answer</p>
      </PendingAnswer>,
    );
    expect(screen.getByText('old answer')).toBeInTheDocument();
    expect(container.querySelector('[aria-busy="true"]')).toBeNull();
    expect(container.querySelector('[inert]')).toBeNull();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('marks what it holds busy and unusable while pending', () => {
    const { container } = render(
      <PendingAnswer pending>
        <button type="button">old switch</button>
      </PendingAnswer>,
    );
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(container.querySelector('[inert]')).toContainElement(
      screen.getByText('old switch'),
    );
  });

  it('says it is calculating from outside the unusable part', () => {
    const { container } = render(
      <PendingAnswer pending>
        <p>old answer</p>
      </PendingAnswer>,
    );
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(strings.form.calculating);
    expect(container.querySelector('[inert]')).not.toContainElement(status);
  });
});
