// StorageProvider abstraction. "local" driver (dev/preview) writes outside any public web root;
// the R2 driver (S3 API, presigned URLs) is added when Cloudflare R2 credentials are supplied.
const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');

const ROOT = path.resolve(__dirname, '../../../storage');

async function putPrivate(buffer, ext, prefix = 'private/leads') {
  const d = new Date();
  const key = `${prefix}/${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${randomUUID()}.${ext}`;
  const full = path.join(ROOT, key);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, buffer, { mode: 0o600 });
  return { key, driver: 'local' };
}

const readPrivate = (key) => fs.readFile(path.join(ROOT, path.normalize(key).replace(/^(\.\.[/\\])+/, '')));

const deletePrivate = (key) => fs.rm(path.join(ROOT, path.normalize(key).replace(/^(\.\.[/\\])+/, '')), { force: true });

module.exports = { putPrivate, readPrivate, deletePrivate };
