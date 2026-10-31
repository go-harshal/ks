const { model } = require('mongoose');
const { baseSchema } = require('../../utils/schema');

const User = model('User', baseSchema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  role: { type: String, enum: ['super_admin', 'admin', 'team_member'], required: true },
  grants: [String],
  status: { type: String, enum: ['active', 'deactivated'], default: 'active' },
  passwordHash: { type: String, required: true },
  failedLogins: { type: Number, default: 0 },
  lockedUntil: Date,
  lastLoginAt: Date,
  twoFactor: {
    enabled: { type: Boolean, default: false },
    secret: String, // AES-256-GCM envelope ciphertext (v1:iv:tag:ciphertext); never expose in API responses.
    pendingSecret: String, // Encrypted until enrollment is confirmed.
    recoveryHashes: [String],
  },
  prefs: { theme: String },
}), 'users');

const Session = model('Session', baseSchema({
  userId: { type: String, required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  csrf: String,
  ip: String,
  userAgent: String,
  lastSeenAt: Date,
  expiresAt: { type: Date, index: { expireAfterSeconds: 0 } },
  revokedAt: Date,
}), 'sessions');

const Invitation = model('Invitation', baseSchema({
  name: String,
  email: { type: String, lowercase: true, trim: true, index: true },
  role: String,
  grants: [String],
  tokenHash: { type: String, unique: true },
  expiresAt: Date,
  invitedBy: String,
  status: { type: String, enum: ['pending', 'accepted', 'revoked'], default: 'pending' },
  acceptedAt: Date,
}), 'invitations');

const AuthToken = model('AuthToken', baseSchema({
  userId: String,
  type: { type: String, enum: ['reset', '2fa_challenge'] },
  tokenHash: { type: String, unique: true },
  expiresAt: { type: Date, index: { expireAfterSeconds: 0 } },
  usedAt: Date,
}), 'authTokens');

// Operational security record only (not a general audit-log module — PRD §2.3).
const SecurityEvent = model('SecurityEvent', baseSchema({
  kind: String,
  userId: String,
  email: String,
  ip: String,
  meta: Object,
}), 'securityEvents');

module.exports = { User, Session, Invitation, AuthToken, SecurityEvent };
