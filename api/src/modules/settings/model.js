const { model, Schema } = require('mongoose');

// Singleton document holding admin-editable website configuration.
const SettingsSchema = new Schema(
  {
    _id: { type: String, default: 'site' },
    contact: {
      email: { type: String, default: '' },
      emailVerified: { type: Boolean, default: false },
      phone: { type: String, default: '' },
    },
    whatsapp: {
      enabled: { type: Boolean, default: false },
      number: { type: String, default: '' }, // E.164 digits only, e.g. 9198XXXXXXXX
      defaultMessage: { type: String, default: 'Hello Kreyszigg Softbizz, I would like to discuss a requirement.' },
    },
    meeting: {
      enabled: { type: Boolean, default: false },
      projectUrl: { type: String, default: '' },
      hiringUrl: { type: String, default: '' },
      partnershipUrl: { type: String, default: '' },
    },
    social: [
      {
        _id: false,
        key: String, // linkedin | facebook | instagram | github | x | google
        label: String,
        url: { type: String, default: '' },
        enabled: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true, versionKey: false }
);

const Settings = model('Settings', SettingsSchema, 'websiteSettings');

/** Only fields safe for anonymous visitors. */
function toPublic(doc) {
  const s = doc || {};
  const whatsappOn = Boolean(s.whatsapp?.enabled && s.whatsapp?.number);
  const meetingOn = Boolean(s.meeting?.enabled);
  return {
    contact: { email: s.contact?.email || '' },
    whatsapp: whatsappOn ? { number: s.whatsapp.number, defaultMessage: s.whatsapp.defaultMessage } : null,
    meeting: meetingOn
      ? {
          projectUrl: s.meeting.projectUrl || '',
          hiringUrl: s.meeting.hiringUrl || '',
          partnershipUrl: s.meeting.partnershipUrl || '',
        }
      : null,
    social: (s.social || []).filter((x) => x.enabled && x.url).map(({ key, label, url }) => ({ key, label, url })),
  };
}

module.exports = { Settings, toPublic };
