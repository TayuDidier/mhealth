// Single-hospital identity.
//
// This app is deployed for ONE hospital: every provider and patient belongs to
// it, so "which clinic" is never a choice — it is always this hospital. Edit
// these values per deployment. (The public landing page keeps the "MHealth"
// app branding; this name is used for in-app affiliation and appointment
// locations.)
export const HOSPITAL = {
  name: 'MHealth',
  // Optional details — surfaced where useful, safe to leave blank.
  address: '',
  phone: '',
}
