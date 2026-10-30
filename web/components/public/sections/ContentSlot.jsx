import { SHOW_SLOTS } from '@/lib/api';

/**
 * Sections whose content must be verified (testimonials, featured work, insights, trust proof) render
 * nothing publicly while empty. In development/preview, a labelled slot shows where they will appear.
 */
export default function ContentSlot({ title, note, testId }) {
  if (!SHOW_SLOTS) return null;
  return (
    <div className="content-slot" data-testid={testId}>
      <strong>{title}</strong>
      <span>{note}</span>
      <span>Design-review marker only. Hidden in production until real, authorised content is published.</span>
    </div>
  );
}
