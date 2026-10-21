// One-time helper to generate a Gmail OAuth2 refresh token for SMTP (XOAUTH2).
//
// Prerequisites (Google Cloud Console, in a project tied to the myralix.com
// Workspace org so the OAuth consent screen can be "Internal"):
//   1. APIs & Services > Library > enable "Gmail API".
//   2. APIs & Services > OAuth consent screen > User type "Internal",
//      add scope https://mail.google.com/ (SMTP needs full mail access,
//      not the narrower gmail.send API scope).
//   3. APIs & Services > Credentials > Create Credentials > OAuth client ID
//      > Application type "Desktop app". Copy the Client ID/Secret.
//   4. Put them in .env.dev as GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.
//
// Manual copy/paste flow (this script runs on a server, not the machine
// with the browser, so the usual localhost-redirect-catch trick doesn't
// work — the redirect would try to reach "localhost" on the BROWSER's
// machine, not this one):
//   1. Run: node scripts/gmail-oauth-setup.js
//   2. Open the printed URL in a browser, sign in as SMTP_EMAIL, approve.
//   3. The browser will fail to load the final redirect (connection
//      refused to localhost) — that's expected. Copy the full URL from
//      the address bar anyway (or just the "code" query param from it).
//   4. Run again: node scripts/gmail-oauth-setup.js "<pasted URL or code>"

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.dev') });

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:53682';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in .env.dev first — see the comment at the top of this script for where to get them.');
  process.exit(1);
}

const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
  client_id: CLIENT_ID,
  redirect_uri: REDIRECT_URI,
  response_type: 'code',
  scope: 'https://mail.google.com/',
  access_type: 'offline',
  prompt: 'consent', // forces Google to return a refresh_token even on re-auth
})}`;

const pasted = process.argv[2];

if (!pasted) {
  console.log('\n1. Open this URL, sign in as the SMTP_EMAIL account, and approve access:\n');
  console.log(authUrl);
  console.log('\n2. The page will fail to load afterward (connection refused) — that\'s expected.');
  console.log('   Copy the full URL from your browser\'s address bar at that point.\n');
  console.log('3. Run again: node scripts/gmail-oauth-setup.js "<pasted URL or code>"\n');
  process.exit(0);
}

let code = pasted.trim();
// Accept either a full URL or a bare code — extract code= if it looks like a URL.
if (code.includes('code=')) {
  const match = code.match(/[?&]code=([^&]+)/);
  if (match) code = decodeURIComponent(match[1]);
}

try {
  const { data } = await axios.post('https://oauth2.googleapis.com/token', new URLSearchParams({
    code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
  }));

  console.log('\nAdd this to .env.dev:\n');
  console.log(`GMAIL_REFRESH_TOKEN=${data.refresh_token}`);
  console.log('\n(The access_token is short-lived and not needed — nodemailer refreshes it automatically using the refresh token.)');
} catch (err) {
  console.error('Token exchange failed:', err.response?.data || err.message);
}
