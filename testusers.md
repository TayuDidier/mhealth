# Test Users

Demo/test accounts for the MHealth app. Defined in the `DEMO_USERS` export in
[`src/data/seedData.js`](src/data/seedData.js) (lines 241–246) and wired into the
login screen's quick-login buttons in
[`src/pages/auth/LoginPage.jsx`](src/pages/auth/LoginPage.jsx) (lines 68–72) —
clicking **Patient**, **Provider**, or **Admin** auto-fills the credentials.

> These accounts only work in **demo mode** (when no Supabase backend is configured).

## Login Accounts

| Role     | Email               | Password  |
| -------- | ------------------- | --------- |
| Patient  | `patient@demo.com`  | `demo123` |
| Provider | `provider@demo.com` | `demo123` |
| Admin    | `admin@demo.com`    | `demo123` |

All three accounts share the password **`demo123`**.

## Underlying Seed People

The demo accounts above are spread from these seed records (also in
[`src/data/seedData.js`](src/data/seedData.js)):

| Role     | Name        | Email                    |
| -------- | ----------- | ------------------------ |
| Provider | Ngozi       | `ngozi@mhealth.cm`       |
| Provider | Sarah       | `sarah@mhealth.cm`       |
| Patient  | Amina       | `amina@example.com`      |
| Patient  | Christelle  | `christelle@example.com` |
| Patient  | Patience    | `patience@example.com`   |
