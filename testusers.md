The demo/test accounts live in the DEMO_USERS export (seedData.js:241-246). All three share the password demo123:

Role	Email	Password
Patient	patient@demo.com	demo123
Provider	provider@demo.com	demo123
Admin	admin@demo.com	demo123
These are also wired into the login screen's quick-login buttons (LoginPage.jsx:68-72) — clicking Patient/Provider/Admin auto-fills the credentials.

The underlying seed people (used to spread into those accounts) are also in the same file — providers like ngozi@mhealth.cm / sarah@mhealth.cm and patients like amina@example.com, christelle@example.com, patience@example.com.

Want me to also list the full seed patient/provider records, or is the DEMO_USERS login set all you needed?

