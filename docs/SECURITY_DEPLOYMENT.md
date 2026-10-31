# Security deployment requirements for patchfix

## TOTP encryption

Set `TOTP_ENCRYPTION_KEY` in the API runtime secret manager. Preferred format is a randomly generated 32-byte key encoded as base64:

```sh
openssl rand -base64 32
```

Do not commit this value, place it in frontend environment variables, log it, or share it between unrelated environments. Back it up in an approved secrets manager. Loss of the key makes encrypted TOTP secrets unreadable and users will need to re-enrol 2FA. Key rotation requires a controlled decrypt/re-encrypt migration while both old and new keys are securely available; the current code intentionally does not guess or rotate keys automatically.

Legacy plaintext TOTP secrets are accepted temporarily so existing accounts can sign in. After a successful verification, the secret is re-encrypted. Plan a migration window and then remove legacy plaintext compatibility after confirming all active 2FA users have been migrated.

## Malware scanning

Run a supported ClamAV daemon reachable from the API container and set:

- `CLAMAV_HOST`: private service hostname or IP.
- `CLAMAV_PORT`: daemon TCP port (defaults to `3310`).

Restrict the daemon port to the API network only. Keep virus definitions updated and monitor daemon health. Upload handling is deliberately fail-closed: if the scanner is not configured, unavailable, times out, or returns an inconclusive response, the upload is rejected and is not persisted. Files are scanned through Clamd INSTREAM before being written to private/object storage.

The scanner limit is 25 MiB; current upload routes impose lower per-route limits. Keep those limits aligned if routes change. Test with the standard EICAR anti-malware test file only in an isolated non-production environment.

## Verification checklist

- [ ] Confirm API runtime has `TOTP_ENCRYPTION_KEY` from a secret manager.
- [ ] Confirm ClamAV is reachable from every API instance.
- [ ] Verify a harmless file uploads and receives scan state `clean`.
- [ ] Verify EICAR is rejected and not stored.
- [ ] Stop ClamAV in staging and confirm uploads fail closed.
- [ ] Confirm legacy TOTP accounts migrate after a successful sign-in.
- [ ] Confirm a new TOTP enrollment stores ciphertext, not the secret shown once to the user.
- [ ] Confirm secrets are excluded from logs, telemetry, API responses and backups where feasible.
