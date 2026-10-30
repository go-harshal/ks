// Seed content derived strictly from the approved PRD.
// Service copy is DRAFT (isPlaceholder: true) and must be reviewed by Kreyszigg Softbizz before launch.
// No client names, statistics, testimonials or outcome claims are included.

const services = [
  {
    name: 'Mobile App Development',
    slug: 'mobile-app-development',
    group: 'Product Engineering',
    priority: true,
    summary: 'Native and cross-platform mobile applications for Android and iOS, from first release to ongoing support.',
    intro:
      'We design, build and maintain mobile applications that fit how your customers and teams actually work — whether that means a native experience on each platform or a single cross-platform codebase.',
    capabilities: [
      { title: 'Native Android Development', description: 'Kotlin and Java applications built to Android platform guidelines.' },
      { title: 'Native iOS Development', description: 'Swift applications built to Apple Human Interface Guidelines.' },
      { title: 'Cross-platform Development', description: 'Flutter and React Native apps sharing one codebase across Android and iOS.' },
      { title: 'Enterprise & On-demand Apps', description: 'Field, workforce, delivery, booking and logistics applications.' },
      { title: 'E-commerce Mobile Apps', description: 'Catalogue, cart, checkout and order tracking experiences.' },
      { title: 'Mobile App UI/UX Design', description: 'Research-led interface design and interactive prototypes.' },
      { title: 'API & Backend Integration', description: 'Secure connections to your APIs, payment gateways and third-party services.' },
      { title: 'Maintenance & Support', description: 'OS-version updates, monitoring, fixes and continuous improvement.' },
    ],
    technologies: ['Kotlin', 'Swift', 'Flutter', 'React Native', 'Node.js', 'Firebase'],
  },
  {
    name: 'Web Application Development',
    slug: 'web-application-development',
    group: 'Product Engineering',
    priority: true,
    summary: 'Custom, SaaS and enterprise web applications, portals and dashboards built for scale and maintainability.',
    intro:
      'From customer portals to internal management systems, we build web applications around your workflows, with clean architecture that is straightforward to extend.',
    capabilities: [
      { title: 'Custom Web Applications', description: 'Applications designed around your specific processes.' },
      { title: 'SaaS Applications', description: 'Multi-tenant products with subscriptions, roles and onboarding.' },
      { title: 'Enterprise Web Applications', description: 'Secure, role-based systems for larger organisations.' },
      { title: 'Business Management Systems', description: 'Operations, inventory, scheduling and workflow tools.' },
      { title: 'Customer Portals & Client Dashboards', description: 'Self-service access to accounts, orders and reports.' },
      { title: 'Admin Panels & Management Dashboards', description: 'Back-office tools for content, users and data.' },
      { title: 'CRM & ERP Development', description: 'Tailored customer and resource planning systems.' },
      { title: 'API-driven Web Applications', description: 'Decoupled front ends over documented REST or GraphQL APIs.' },
      { title: 'Progressive Web Applications', description: 'Installable, offline-capable web experiences.' },
      { title: 'Maintenance & Modernisation', description: 'Upgrades, refactoring and migration of existing applications.' },
    ],
    technologies: ['React.js', 'Next.js', 'Angular', 'Vue.js', 'Node.js', 'Laravel', 'PostgreSQL', 'MongoDB'],
  },
  {
    name: 'Custom Software Development',
    slug: 'custom-software-development',
    group: 'Product Engineering',
    summary: 'Software built around your business processes when off-the-shelf tools do not fit.',
    intro: 'We translate business requirements into dependable software, delivered in iterative stages so you can review progress early.',
    capabilities: [
      { title: 'Requirement Analysis', description: 'Workshops to define scope, users and success criteria.' },
      { title: 'Solution Architecture', description: 'Technology and architecture choices matched to your constraints.' },
      { title: 'Iterative Delivery', description: 'Agile sprints with regular demonstrations.' },
      { title: 'Integration', description: 'Connecting new software with existing systems and data.' },
    ],
  },
  {
    name: 'SaaS Product Development',
    slug: 'saas-product-development',
    group: 'Product Engineering',
    summary: 'Planning, building and scaling subscription software products.',
    intro: 'We help founders and product teams move from idea to a maintainable SaaS product.',
    capabilities: [
      { title: 'MVP Definition', description: 'Prioritising the smallest valuable product.' },
      { title: 'Multi-tenant Architecture', description: 'Tenant isolation, roles and permissions.' },
      { title: 'Billing & Subscriptions', description: 'Integration with payment and subscription providers.' },
      { title: 'Product Iteration', description: 'Analytics-informed improvements after launch.' },
    ],
  },
  {
    name: 'Website Design & Development',
    slug: 'website-design-development',
    group: 'Design & Commerce',
    summary: 'Fast, accessible, search-friendly business websites with content you can manage.',
    intro: 'We design and build websites that communicate clearly, load quickly and are easy for your team to update.',
    capabilities: [
      { title: 'Corporate Websites', description: 'Structured, credible websites for businesses.' },
      { title: 'CMS Websites', description: 'WordPress and headless CMS implementations.' },
      { title: 'Technical SEO', description: 'Performance, metadata and structured data foundations.' },
      { title: 'Accessibility', description: 'Built toward WCAG 2.2 AA.' },
    ],
  },
  {
    name: 'UI/UX Design',
    slug: 'ui-ux-design',
    group: 'Design & Commerce',
    summary: 'Research-informed interface and experience design for web and mobile products.',
    intro: 'We shape products around the people who use them, from user flows to production-ready design systems.',
    capabilities: [
      { title: 'User Research', description: 'Interviews, journeys and usability reviews.' },
      { title: 'Wireframes & Prototypes', description: 'Testable flows before development begins.' },
      { title: 'Visual Design', description: 'Interfaces aligned with your brand.' },
      { title: 'Design Systems', description: 'Reusable components and documentation.' },
    ],
  },
  {
    name: 'E-commerce Development',
    slug: 'ecommerce-development',
    group: 'Design & Commerce',
    summary: 'Online stores and commerce platforms on Shopify, Magento or custom stacks.',
    intro: 'We build commerce experiences that make it simple for customers to find, buy and return.',
    capabilities: [
      { title: 'Shopify & Magento', description: 'Store setup, themes and extensions.' },
      { title: 'Custom Commerce', description: 'Tailored catalogues, checkout and order flows.' },
      { title: 'Payments & Logistics', description: 'Gateway, shipping and inventory integrations.' },
      { title: 'Marketplace Features', description: 'Multi-vendor and B2B capabilities.' },
    ],
  },
  {
    name: 'Cloud Solutions & DevOps',
    slug: 'cloud-devops',
    group: 'Platform & Support',
    summary: 'Cloud architecture, CI/CD and infrastructure automation on AWS, Azure and Google Cloud.',
    intro: 'We set up reliable, observable infrastructure and delivery pipelines so releases become routine.',
    capabilities: [
      { title: 'Cloud Architecture', description: 'Right-sized environments on AWS, Azure or Google Cloud.' },
      { title: 'CI/CD Pipelines', description: 'Automated build, test and deployment.' },
      { title: 'Containerisation', description: 'Docker-based packaging and orchestration.' },
      { title: 'Monitoring', description: 'Logging, metrics and alerting.' },
    ],
  },
  {
    name: 'API Development & Integration',
    slug: 'api-development-integration',
    group: 'Platform & Support',
    summary: 'Secure, documented APIs and integrations between your systems and third-party services.',
    intro: 'We design APIs that are consistent, versioned and documented, and connect the services your business depends on.',
    capabilities: [
      { title: 'REST & GraphQL APIs', description: 'Versioned, documented endpoints.' },
      { title: 'Third-party Integrations', description: 'Payments, messaging, CRM and ERP connections.' },
      { title: 'Authentication', description: 'Secure access control for APIs.' },
      { title: 'Documentation', description: 'Reference documentation for developers.' },
    ],
  },
  {
    name: 'Software Maintenance & Support',
    slug: 'software-maintenance-support',
    group: 'Platform & Support',
    summary: 'Ongoing updates, fixes, monitoring and improvement for existing software.',
    intro: 'We keep applications secure, current and dependable after launch.',
    capabilities: [
      { title: 'Bug Fixing', description: 'Triage and resolution of reported issues.' },
      { title: 'Security Updates', description: 'Dependency and platform updates.' },
      { title: 'Performance Tuning', description: 'Profiling and optimisation.' },
      { title: 'Feature Enhancements', description: 'Planned, incremental improvements.' },
    ],
  },
  {
    name: 'IT Consulting',
    slug: 'it-consulting',
    group: 'Platform & Support',
    summary: 'Technology advice on architecture, product planning and modernisation.',
    intro: 'We help you make informed technology decisions before committing budget.',
    capabilities: [
      { title: 'Technology Assessment', description: 'Review of current systems and options.' },
      { title: 'Architecture Review', description: 'Scalability, security and maintainability review.' },
      { title: 'Product Roadmapping', description: 'Prioritised, staged delivery plans.' },
      { title: 'Modernisation Planning', description: 'Migration paths for legacy systems.' },
    ],
  },
];

const processSteps = [
  ['Discovery & Requirement Analysis', 'Understand goals, users, constraints and success criteria before anything is designed.'],
  ['Planning & Architecture', 'Define scope, milestones, technology choices and the system architecture.'],
  ['UI/UX Design', 'Shape user flows, wireframes and visual design, validated with you before build.'],
  ['Development & Implementation', 'Build in iterative Agile sprints with regular demonstrations and feedback.'],
  ['QA & Testing', 'Functional, integration, usability, security and performance testing.'],
  ['Deployment & Launch', 'Release to production with monitoring and a rollback plan.'],
  ['Maintenance & Continuous Improvement', 'Support, updates and improvements informed by real usage.'],
].map(([title, description], i) => ({ order: i + 1, title, description }));

const technologies = [
  ['React.js', 'Frontend / Web'], ['Next.js', 'Frontend / Web'], ['Angular', 'Frontend / Web'], ['Vue.js', 'Frontend / Web'],
  ['CodeIgniter', 'Frontend / Web', 'PHP framework'], ['Laravel', 'Frontend / Web', 'PHP framework'],
  ['WordPress', 'Frontend / Web', 'CMS'], ['Shopify', 'Frontend / Web', 'E-commerce platform'], ['Magento', 'Frontend / Web', 'E-commerce platform'],
  ['Node.js', 'Backend'], ['Python', 'Backend'], ['Java', 'Backend'], ['PHP', 'Backend'], ['.NET', 'Backend'],
  ['Flutter', 'Mobile'], ['React Native', 'Mobile'],
  ['MySQL', 'Database'], ['PostgreSQL', 'Database'], ['MongoDB', 'Database'],
  ['AWS', 'Cloud'], ['Azure', 'Cloud'], ['Google Cloud', 'Cloud'],
  ['DevOps', 'Other'], ['QA', 'Other'], ['UI/UX', 'Other'],
].map(([name, group, note], i) => ({ name, group, note: note || '', order: i + 1 }));

const devCategories = [
  ['Frontend Developers', 'frontend', 'Interfaces in React, Next.js, Angular and Vue.js.', ['React.js', 'Next.js', 'Angular', 'Vue.js']],
  ['Backend Developers', 'backend', 'APIs, services and data layers.', ['Node.js', 'Python', 'Java', 'PHP', '.NET']],
  ['Full-Stack Developers', 'full-stack', 'End-to-end feature delivery across frontend and backend.', ['React.js', 'Node.js', 'Laravel', 'MongoDB']],
  ['Mobile App Developers', 'mobile', 'Cross-platform and native mobile development.', ['Flutter', 'React Native']],
  ['UI/UX Designers', 'ui-ux', 'Research, wireframes, prototypes and design systems.', ['UI/UX']],
  ['DevOps Engineers', 'devops', 'CI/CD, containers and infrastructure automation.', ['DevOps', 'AWS', 'Azure']],
  ['QA / Software Test Engineers', 'qa', 'Manual and automated testing.', ['QA']],
  ['E-commerce Developers', 'ecommerce', 'Shopify, Magento and custom commerce.', ['Shopify', 'Magento']],
  ['CMS Developers', 'cms', 'WordPress and content platforms.', ['WordPress']],
  ['Cloud Engineers', 'cloud', 'Cloud architecture and operations.', ['AWS', 'Azure', 'Google Cloud']],
].map(([name, slug, summary, skills], i) => ({ name, slug, summary, skills, order: i + 1 }));

const experienceLevels = [
  ['Junior', '0–2 years', 'Works on well-defined tasks with guidance.'],
  ['Mid-level', '2–5 years', 'Delivers features independently.'],
  ['Senior', '5–8 years', 'Owns complex modules and mentors others.'],
  ['Lead Developer / Technical Architect', '8+ years', 'Leads architecture and technical direction.'],
].map(([name, range, description], i) => ({ name, range, description, order: i + 1 }));

const engagementModels = [
  ['Monthly Dedicated Developer', 'A developer working full-time on your project, billed monthly.', 'Ongoing product work'],
  ['Dedicated Development Team', 'A cross-functional team assembled for your product.', 'Larger or long-term builds'],
  ['Hourly Hiring', 'Developer time billed by the hour.', 'Short or variable workloads'],
  ['Part-time Developer', 'A developer allocated for part of the working week.', 'Steady, lighter workloads'],
  ['Fixed-price Project Development', 'A defined scope delivered for an agreed price.', 'Clearly specified projects'],
  ['Contract-to-Hire', 'Start on contract with the option to hire permanently.', 'Evaluating long-term fit'],
].map(([name, description, bestFor], i) => ({ name, description, bestFor, order: i + 1 }));

const hiringSteps = [
  ['Requirement Submission', 'Share the role, skills, seniority and engagement model you need.'],
  ['Requirement Discussion', 'We clarify scope, timelines and working arrangements with you.'],
  ['Candidate Shortlisting', 'We propose profiles matched to your requirement.'],
  ['Technical Interview', 'You interview and assess shortlisted candidates.'],
  ['Selection & Onboarding', 'Selected developers are onboarded to your tools and processes.'],
  ['Ongoing Engagement', 'Regular check-ins to keep the engagement on track.'],
].map(([title, description], i) => ({ order: i + 1, title, description }));

const industries = [
  'Startups & Technology', 'Retail & E-commerce', 'Education & EdTech', 'Healthcare & HealthTech',
  'Real Estate & PropTech', 'Logistics & Transportation', 'Travel & Hospitality', 'Manufacturing & Industrial',
  'Media & Entertainment', 'Professional Services', 'Food & Restaurant Technology', 'Other Industries',
].map((name, i) => ({
  name,
  slug: name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
  order: i + 1,
}));

const settings = {
  _id: 'site',
  // PRD §7.8 suggested alias — NOT verified by the business yet (emailVerified: false).
  contact: { email: 'hello@kreyszigg.com', emailVerified: false, phone: '' },
  whatsapp: { enabled: false, number: '', defaultMessage: 'Hello Kreyszigg Softbizz, I would like to discuss a requirement.' },
  meeting: { enabled: false, projectUrl: '', hiringUrl: '', partnershipUrl: '' },
  social: [
    { key: 'linkedin', label: 'LinkedIn', url: '', enabled: false },
    { key: 'facebook', label: 'Facebook', url: '', enabled: false },
    { key: 'instagram', label: 'Instagram', url: '', enabled: false },
    { key: 'github', label: 'GitHub', url: '', enabled: false },
    { key: 'x', label: 'X (Twitter)', url: '', enabled: false },
    { key: 'google', label: 'Google Business Profile', url: '', enabled: false },
  ],
};

module.exports = { services, processSteps, technologies, devCategories, experienceLevels, engagementModels, hiringSteps, industries, settings };
