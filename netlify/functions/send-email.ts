import type { Handler } from '@netlify/functions';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    if (!process.env.RESEND_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Missing RESEND_API_KEY' }),
      };
    }

    const { subject, html, replyTo, attachment } = JSON.parse(event.body || '{}');

    const to = process.env.CONTACT_TO || '3d88.contact@gmail.com';

    if (!to || !subject || !html) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: subject, html' }),
      };
    }

    const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;
    const attachments: Array<{ filename: string; content: string; contentType?: string }> = [];
    if (attachment?.content && attachment?.filename) {
      if (typeof attachment.content !== 'string' || typeof attachment.filename !== 'string') {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid attachment format' }),
        };
      }

      const declaredSize = typeof attachment.size === 'number' ? attachment.size : undefined;
      if (declaredSize && declaredSize > MAX_ATTACHMENT_BYTES) {
        return {
          statusCode: 413,
          headers,
          body: JSON.stringify({ error: 'Attachment too large' }),
        };
      }

      const safeFilename = attachment.filename.replace(/[\\/\r\n]/g, '_').slice(0, 120);
      const contentType = typeof attachment.contentType === 'string' ? attachment.contentType : undefined;

      attachments.push({
        filename: safeFilename,
        content: attachment.content,
        ...(contentType ? { contentType } : {}),
      });
    }

    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const fromName = process.env.RESEND_FROM_NAME || '3D88';
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@impression3d.fr';

    const data = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
      ...(attachments.length ? { attachments } : {}),
      headers: {
        'X-Entity-Ref-ID': uniqueId,
      },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error?.message || 'Failed to send email' }),
    };
  }
};
