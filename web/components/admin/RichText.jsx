'use client';

import { useEffect, useRef } from 'react';
import { Bold, Italic, Heading2, Heading3, List, ListOrdered, Link2, Quote, Eraser } from 'lucide-react';

const TOOLS = [
  ['bold', Bold, 'Bold', () => document.execCommand('bold')],
  ['italic', Italic, 'Italic', () => document.execCommand('italic')],
  ['h2', Heading2, 'Heading', () => document.execCommand('formatBlock', false, 'h2')],
  ['h3', Heading3, 'Subheading', () => document.execCommand('formatBlock', false, 'h3')],
  ['ul', List, 'Bulleted list', () => document.execCommand('insertUnorderedList')],
  ['ol', ListOrdered, 'Numbered list', () => document.execCommand('insertOrderedList')],
  ['quote', Quote, 'Quote', () => document.execCommand('formatBlock', false, 'blockquote')],
  ['link', Link2, 'Link', () => {
    const url = window.prompt('Link address (https://…)');
    if (url && /^(https?:\/\/|mailto:)/i.test(url.trim())) document.execCommand('createLink', false, url.trim());
  }],
  ['clear', Eraser, 'Clear formatting', () => { document.execCommand('removeFormat'); document.execCommand('formatBlock', false, 'p'); }],
];

/** Minimal rich-text editor. Output is re-sanitised on the server to the same small tag allow-list. */
export default function RichText({ name, initial, testId, labelId }) {
  const ref = useRef(null);
  const hidden = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = initial || '<p></p>';
    if (hidden.current) hidden.current.value = initial || '';
    document.execCommand('defaultParagraphSeparator', false, 'p');
  }, [initial]);
  const sync = () => { if (hidden.current && ref.current) hidden.current.value = ref.current.innerHTML; };
  return (
    <div className="adm-rte">
      <div className="adm-rte-bar" role="toolbar" aria-label="Formatting">
        {TOOLS.map(([k, Icon, label, run]) => (
          <button key={k} type="button" title={label} aria-label={label} onMouseDown={(e) => e.preventDefault()} onClick={() => { ref.current?.focus(); run(); sync(); }} data-testid={`${testId}-tool-${k}`}>
            <Icon aria-hidden="true" />
          </button>
        ))}
      </div>
      <div
        ref={ref}
        id={labelId}
        className="adm-rte-area"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Article body"
        onInput={sync}
        onBlur={sync}
        onPaste={(e) => { e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')); sync(); }}
        data-testid={testId}
      />
      <input type="hidden" name={name} ref={hidden} />
    </div>
  );
}
