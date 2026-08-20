# Urban Iron Participant Portal
Vercel-ready v1. The UI discovers Live + Portal Enabled races from the Race Registry. Participant lookup happens server-side against each race's `App Lookup` tab. Email is accepted as a lookup key but is never returned by the API.

## Deploy
1. Create a Google Cloud service account with Sheets read-only access.
2. Share only the Race Registry, Race Passwords, and race Sheets with that service account as Viewer.
3. Push this folder to a GitHub repo and import it into Vercel, or deploy with the Vercel CLI.
4. Add the three environment variables shown in `.env.example`.
5. Test on the Vercel preview URL.
6. Add `participants.urbaniron.co` in Vercel Domains and copy Vercel's requested DNS record into the DNS manager for urbaniron.co.
7. Link the Squarespace “I'm a Participant” CTA to `https://participants.urbaniron.co`.

## Publishing contract
A race appears only when Registry `Status=Live` and `Portal Enabled=Yes`. Its Race Sheet URL must point to a Google Sheet containing `App Lookup` with columns: First Name, Last Name, Email, Bib Number, Heat Number, Heat Name, Start Time.

## Security
The browser never receives Google credentials or participant email data. Password validation and Sheet reads happen in Vercel serverless functions. For stronger production security, migrate plaintext password administration to hashes/secrets after the operating workflow is proven.
