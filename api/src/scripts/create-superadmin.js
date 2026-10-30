/* Bootstrap the first Super Admin securely: creates a time-limited invitation (no public registration).
   Usage: node src/scripts/create-superadmin.js admin@kreyszigg.com "Name" */
const { connect, mongoose } = require('../db/connect');
const { User, Invitation } = require('../modules/auth/models');
const S = require('../modules/auth/service');
const env = require('../config/env');

(async () => {
  const [email, name = 'Super Admin'] = process.argv.slice(2);
  if (!email) { console.error('Email required'); process.exit(1); }
  await connect();
  if (await User.exists({ email: email.toLowerCase() })) { console.log('User already exists.'); process.exit(0); }
  await Invitation.updateMany({ email: email.toLowerCase(), status: 'pending' }, { status: 'revoked' });
  const token = S.randomToken();
  await Invitation.create({ name, email: email.toLowerCase(), role: 'super_admin', tokenHash: S.sha256(token), expiresAt: new Date(Date.now() + S.POLICY.inviteHours * 3600e3), invitedBy: 'cli' });
  console.log(`INVITE_TOKEN=${token}`);
  console.log(`Set password at: ${env.publicSiteUrl}/phobos/invite/${token}`);
  await mongoose.disconnect();
})();
