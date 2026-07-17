import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  StatusAlert,
  StatusToast,
} from '../components/StatusFeedback';
import {
  DEFAULT_TOAST_DURATION_MS,
  getUniqueStatusMessages,
} from '../utils/statusFeedback';

describe('status feedback', () => {
  it('deduplicates identical local and remote errors without dropping distinct errors', () => {
    expect(
      getUniqueStatusMessages([
        'Could not sync the room.',
        ' Could not sync the room. ',
        '',
        'Choose a cup.',
      ]),
    ).toEqual(['Could not sync the room.', 'Choose a cup.']);

    const html = renderToStaticMarkup(
      <StatusAlert
        messages={[
          'Could not sync the room.',
          'Could not sync the room.',
          'Choose a cup.',
        ]}
      />,
    );

    expect(html.match(/Could not sync the room\./g)).toHaveLength(1);
    expect(html).toContain('Choose a cup.');
    expect(html).toContain('role="alert"');
  });

  it('renders no alert when there are no messages', () => {
    expect(renderToStaticMarkup(<StatusAlert messages={['', null]} />)).toBe('');
  });

  it('uses a polite status region and a three-second default for success toasts', () => {
    const html = renderToStaticMarkup(<StatusToast message="Game log copied." />);

    expect(DEFAULT_TOAST_DURATION_MS).toBe(3000);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('Game log copied.');
  });
});
