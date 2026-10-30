import ContentSlot from '@/components/public/sections/ContentSlot';
import { PageHero, EmptyState, pageStyles as s } from '@/components/public/sections/PageParts';

export const metadata = {
  title: 'Insights — Articles on Software Development and Hiring',
  description: 'Articles from Kreyszigg Softbizz on software development, product delivery and building engineering teams.',
  alternates: { canonical: '/insights' },
};

const TOPICS = ['Software development', 'Mobile apps', 'Web applications', 'UI/UX design', 'Cloud & DevOps', 'Hiring developers'];

export default function InsightsPage() {
  return (
    <>
      <PageHero testId="insights-hero" overline="Insights" title="Notes on building software and teams." lead="Practical articles on planning, building and running software products, and on working with dedicated developers." />
      <section className={s.section} aria-label="Articles" data-testid="insights-list">
        <div className="container" style={{ display: 'grid', gap: 32 }}>
          <div>
            <p className="overline">Topics</p>
            <ul className={s.chips} style={{ marginTop: 12 }} data-testid="insights-topics">{TOPICS.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
          <EmptyState
            testId="insights-empty"
            title="The first articles are coming soon."
            body="Subscribe to the newsletter at the bottom of this page to hear when new articles are published."
            actions={[{ label: 'Contact us', href: '/contact?type=contact' }]}
          />
          <ContentSlot testId="insights-slot" title="Article list" note="Featured article, search, category filters, author and reading time — managed in Phobos › Blog / Insights." />
        </div>
      </section>
    </>
  );
}
