import { getAccessToken } from './googleAuth';

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  date: string;
}

export const gmailService = {
  /**
   * Fetches user's emails using Gmail REST API.
   * Requires https://mail.google.com/ scope.
   */
  async fetchAllEmails(maxResults: number = 10, query: string = ''): Promise<GmailMessageSummary[]> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Google Workspace authentication required. Please sign in with Google.');
    }

    const qParam = query ? `&q=${encodeURIComponent(query)}` : '';
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}${qParam}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      }
    );

    if (!listRes.ok) {
      const err = await listRes.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to fetch messages from Gmail');
    }

    const listData = await listRes.json();
    const messages = listData.messages || [];

    // Fetch details for each message in parallel
    const details = await Promise.all(
      messages.map(async (msg: { id: string }) => {
        try {
          const itemRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
              },
            }
          );
          if (!itemRes.ok) return null;
          const data = await itemRes.json();

          const headers = data.payload?.headers || [];
          const getHeader = (name: string) =>
            headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

          return {
            id: data.id,
            threadId: data.threadId,
            snippet: data.snippet || '',
            subject: getHeader('Subject') || '(No Subject)',
            from: getHeader('From') || '(Unknown Sender)',
            date: getHeader('Date') || '',
          } as GmailMessageSummary;
        } catch {
          return null;
        }
      })
    );

    return details.filter((d): d is GmailMessageSummary => d !== null);
  },

  /**
   * Sends an email via Gmail API with the lesson notes or study review.
   * Requires explicit user confirmation in the UI.
   */
  async sendEmail(to: string, subject: string, bodyContent: string): Promise<boolean> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Google Workspace authentication required. Please connect Gmail.');
    }

    // Construct raw MIME email
    const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
    const messageParts = [
      `To: ${to}`,
      `Subject: ${utf8Subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
      '',
      bodyContent,
    ];
    const message = messageParts.join('\r\n');

    // Base64url encode
    const encodedMessage = btoa(unescape(encodeURIComponent(message)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedMessage }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to send email via Gmail API');
    }

    return true;
  },
};
