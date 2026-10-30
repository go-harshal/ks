const { model } = require('mongoose');
const { baseSchema } = require('../../utils/schema');

const CONTENT_STATUSES = ['draft', 'in_review', 'published', 'archived'];
const APPLICATION_STATUSES = ['New', 'Reviewing', 'Shortlisted', 'Interview', 'Offered', 'Hired', 'Rejected'];
const WORK_MODES = ['On-site', 'Hybrid', 'Remote'];
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];

const workflow = {
  status: { type: String, enum: CONTENT_STATUSES, default: 'draft', index: true },
  slug: { type: String, unique: true, index: true },
  authorId: { type: String, index: true },
  reviewNote: String,
  publishedAt: Date,
  history: [{ _id: false, kind: String, by: String, note: String, at: Date }],
};

const CaseStudy = model('CaseStudy', baseSchema({
  title: String, industry: String, clientDisplay: { type: String, enum: ['confidential', 'named'], default: 'confidential' }, clientName: String,
  summary: String, challenge: String, approach: String, solution: String, results: String, resultsVerified: { type: Boolean, default: false },
  technologies: [String], coverImageId: String, seoTitle: String, seoDescription: String,
  ...workflow,
}), 'caseStudies');

const Job = model('Job', baseSchema({
  title: String, department: String, location: String, workMode: { type: String, enum: WORK_MODES }, employmentType: { type: String, enum: EMPLOYMENT_TYPES },
  experience: String, summary: String, responsibilities: String, requirements: String, niceToHave: String, closesAt: Date,
  ...workflow,
}), 'jobs');

const Application = model('Application', baseSchema({
  jobId: { type: String, index: true }, jobTitle: String,
  name: String, email: { type: String, index: true }, phone: String, location: String, linkedin: String, portfolio: String, experience: String, coverLetter: String,
  cvFileId: String,
  status: { type: String, enum: APPLICATION_STATUSES, default: 'New', index: true },
  consent: { version: String, at: Date },
  notes: [{ _id: false, body: String, by: String, byName: String, at: Date }],
  history: [{ _id: false, kind: String, from: String, to: String, by: String, at: Date }],
}), 'applications');

const Article = model('Article', baseSchema({
  title: String, category: String, tags: [String], excerpt: String, body: String, readingMinutes: Number,
  coverImageId: String, authorProfileId: String, featured: { type: Boolean, default: false }, seoTitle: String, seoDescription: String,
  ...workflow,
}), 'articles');

const TeamProfile = model('TeamProfile', baseSchema({
  name: String, title: String, bio: String, photoId: String, linkedin: String, isFounder: { type: Boolean, default: false }, order: { type: Number, default: 100 },
  ...workflow,
}), 'teamProfiles');

module.exports = { Article, TeamProfile, CaseStudy, Job, Application, CONTENT_STATUSES, APPLICATION_STATUSES, WORK_MODES, EMPLOYMENT_TYPES };
