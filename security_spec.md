# Campus Quest Firestore Security Specification

## 1. Data Invariants
1. **No-Delete Guarantee**: No client (not even a verified admin) may delete documents in `/questSubmissions/{submissionId}` or `/admins/{uid}`. `allow delete: if false;` across all collections.
2. **Admin Isolation**: Reading, listing, archiving, and editing `/questSubmissions/{submissionId}` is strictly restricted to verified administrators (`isAdmin()`, verified via `request.auth.token.email_verified == true` matching the provisioned admin email or `/admins/{uid}` existence).
3. **End-Player Privacy**: Unauthenticated or non-admin participants can only `create` a valid completed `/questSubmissions/{submissionId}` document; they cannot `get`, `list`, `update`, or `delete` any submissions.
4. **Strict Payload Schema & Boundaries**: All incoming submissions must pass `isValidSubmissionCreate(incoming())` with exact required/allowed keys (`hasAll` + `hasOnly`), bounded strings/arrays, `archiveStatus == 'active'`, `adminNotes == ''`, `editedBy == ''`, and server timestamps `createdAt == request.time && updatedAt == request.time`.
5. **Immutable Submission Core Telemetry**: On admin `update`, immutable tracking fields (`participant`, `durationMs`, `totalAnswered`, `roomOrder`, `distance`, `moveTimeMs`, `events`, `samples`, `createdAt`) cannot be altered; only `demographics`, `character`, `answers`, `archiveStatus`, `adminNotes`, `editedBy`, and `updatedAt` (validated via `isValidSubmissionUpdate()` and `request.time`) may change.

## 2. Adversarial ("Dirty Dozen") Payloads Blocked by Rules
1. Unauthenticated `get` / `list` on `/questSubmissions` -> `PERMISSION_DENIED`.
2. Signed-in non-admin user `get` / `list` on `/questSubmissions` -> `PERMISSION_DENIED`.
3. Spoofed admin email with `email_verified: false` -> `PERMISSION_DENIED`.
4. Admin `delete` on `/questSubmissions/{id}` -> `PERMISSION_DENIED` (`allow delete: if false`).
5. Participant `update` attempt after submission -> `PERMISSION_DENIED`.
6. Shadow-field injection on create (`extraAdminFlag: true`) -> `PERMISSION_DENIED` (`keys().hasOnly(...)`).
7. Invalid document ID (`../../etc/passwd` or >128 chars) -> `PERMISSION_DENIED` (`isValidId`).
8. Unconsented demographics (`consented: false`) on create -> `PERMISSION_DENIED`.
9. Oversized `samples` (>1500) or `events` (>500) array -> `PERMISSION_DENIED`.
10. Client-forged `createdAt` timestamp (`!= request.time`) -> `PERMISSION_DENIED`.
11. Creating a record directly as `archiveStatus: 'archived'` or pre-filled `editedBy` -> `PERMISSION_DENIED`.
12. Admin update attempting to mutate immutable `participant` code or `createdAt` -> `PERMISSION_DENIED`.
