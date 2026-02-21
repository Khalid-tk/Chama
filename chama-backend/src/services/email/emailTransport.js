/**
 * Email transport: delegates to the shared mailer utility.
 * Used by the email queue and health check; no SendGrid – SMTP only (e.g. Gmail).
 */
import { sendMail as mailerSendMail, getTransport } from '../../utils/mailer.js'

export async function sendMail(options) {
  return mailerSendMail(options)
}

export { getTransport }
