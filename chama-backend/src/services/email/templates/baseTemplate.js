import { config } from '../../../config/env.js'

const FRONTEND_URL = config.frontendUrl || 'http://localhost:5173'

function baseTemplate({ title, content, ctaLabel, ctaUrl }) {
  const ctaBlock =
    ctaLabel && ctaUrl
      ? '<p style="margin: 24px 0 0;"><a href="' +
        ctaUrl +
        '" style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">' +
        ctaLabel +
        '</a></p>'
      : ''

  const t = title || 'Chama'
  const year = new Date().getFullYear()
  return (
    '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>' +
    t +
    '</title></head><body style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; background: #f1f5f9;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f1f5f9; padding: 24px;">' +
    '<tr><td align="center">' +
    '<table role="presentation" width="100%" style="max-width: 560px; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0;">' +
    '<tr><td style="background: #2563eb; color: #fff; padding: 20px 24px; text-align: center;"><span style="font-size: 20px; font-weight: 700;">Chama</span></td></tr>' +
    '<tr><td style="padding: 24px; color: #334155; line-height: 1.6;">' +
    content +
    ctaBlock +
    '</td></tr>' +
    '<tr><td style="padding: 16px 24px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; text-align: center;">This email was sent by Chama. &copy; ' +
    year +
    '.</td></tr></table></td></tr></table></body></html>'
  )
}

export { baseTemplate, FRONTEND_URL }
