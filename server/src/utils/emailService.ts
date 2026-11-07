import nodemailer from 'nodemailer';
import { EmailAlertConfigModel, IEmailAlertConfig } from '../models/EmailAlertConfig.js';
import { EmailLogModel } from '../models/EmailLog.js';

export interface SendAlertParams {
  sectionName: string;
  sectionCode?: string;
  date: string;
  consumedKwh: number;
  limitKwh: number;
  exceededKwh: number;
  exceededPercentage: number;
  isTest?: boolean;
  targetRecipients?: string[];
}

/**
 * Get or initialize email alert configuration
 */
export async function getEmailAlertConfig(): Promise<IEmailAlertConfig> {
  let config = await EmailAlertConfigModel.findOne();
  if (!config) {
    config = await EmailAlertConfigModel.create({
      recipients: [
        'plant.head@smruthi-organics.com',
        'electrical.hod@smruthi-organics.com',
      ],
      monitoredBlocks: ['A Block'], // 'A Block' is the primary monitored block
      isEnabled: true,
      smtpHost: process.env.SMTP_HOST || '',
      smtpPort: Number(process.env.SMTP_PORT) || 587,
      smtpSecure: process.env.SMTP_SECURE === 'true',
      smtpUser: process.env.SMTP_USER || '',
      smtpPass: process.env.SMTP_PASS || '',
      fromAddress:
        process.env.SMTP_FROM ||
        'Smruthi Organics Electrical Dept <alerts@smruthi-organics.com>',
    });
  }
  return config;
}

/**
 * Format numbers with Indian comma separation
 */
function formatUnits(num: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(num);
}

/**
 * Generate responsive industrial HTML email template
 */
function generateAlertEmailHtml(params: {
  sectionName: string;
  sectionCode: string;
  date: string;
  consumedKwh: number;
  limitKwh: number;
  exceededKwh: number;
  exceededPercentage: number;
  isTest?: boolean;
}): string {
  const {
    sectionName,
    sectionCode,
    date,
    consumedKwh,
    limitKwh,
    exceededKwh,
    exceededPercentage,
    isTest,
  } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Electrical Alert - ${sectionName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; color: #0f172a; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #cbd5e1; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { background: #0f172a; padding: 24px; color: #ffffff; text-align: left; }
    .factory-name { font-size: 18px; font-weight: 800; letter-spacing: -0.5px; margin: 0; color: #ffffff; }
    .unit-badge { display: inline-block; background: #0284c7; color: #ffffff; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; margin-left: 6px; }
    .dept-title { font-size: 12px; color: #94a3b8; margin-top: 4px; font-weight: 500; }
    .alert-banner { background: #fef2f2; border-left: 6px solid #dc2626; padding: 16px 20px; }
    .alert-badge { display: inline-block; background: #fee2e2; color: #b91c1c; font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #fca5a5; }
    .alert-title { font-size: 16px; font-weight: 800; color: #991b1b; margin: 8px 0 4px 0; }
    .alert-desc { font-size: 13px; color: #7f1d1d; margin: 0; line-height: 1.4; }
    .content { padding: 24px; }
    .metrics-table { width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin: 16px 0; }
    .metrics-table th { background: #f8fafc; font-size: 11px; text-transform: uppercase; color: #64748b; padding: 10px 14px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    .metrics-table td { padding: 12px 14px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
    .metrics-table tr:last-child td { border-bottom: none; }
    .val-highlight { font-weight: 800; font-family: monospace; font-size: 14px; }
    .val-danger { color: #dc2626; }
    .val-normal { color: #0f172a; }
    .directives { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-top: 20px; }
    .directives-title { font-size: 12px; font-weight: 800; text-transform: uppercase; color: #334155; margin-bottom: 8px; }
    .directives ul { margin: 0; padding-left: 20px; font-size: 12px; color: #475569; line-height: 1.6; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 11px; color: #64748b; }
    .btn { display: inline-block; background: #0284c7; color: #ffffff !important; font-weight: 700; font-size: 12px; padding: 10px 20px; border-radius: 8px; text-decoration: none; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="factory-name">
        SMRUTHI ORGANICS LIMITED <span class="unit-badge">Unit-1</span>
      </div>
      <div class="dept-title">Electrical Department • Industrial Automated Alert Dispatcher</div>
    </div>

    <div class="alert-banner">
      <span class="alert-badge">${isTest ? 'TEST VERIFICATION ALERT' : 'CRITICAL THRESHOLD BREACH'}</span>
      <div class="alert-title">
        Consumption Limit Exceeded: ${sectionName} (${sectionCode})
      </div>
      <p class="alert-desc">
        Electrical energy consumption for <strong>${sectionName}</strong> has exceeded the allocated daily limit on <strong>${date}</strong>.
      </p>
    </div>

    <div class="content">
      <table class="metrics-table">
        <tr>
          <th>Telemetry Metric</th>
          <th style="text-align: right;">Recorded Value</th>
        </tr>
        <tr>
          <td>Department Feeder</td>
          <td style="text-align: right; font-weight: 700;">${sectionName} (${sectionCode})</td>
        </tr>
        <tr>
          <td>Log Date</td>
          <td style="text-align: right; font-family: monospace;">${date}</td>
        </tr>
        <tr>
          <td>Allocated Daily Limit</td>
          <td style="text-align: right;" class="val-highlight val-normal">${formatUnits(limitKwh)} kWh</td>
        </tr>
        <tr>
          <td>Current Total Consumption</td>
          <td style="text-align: right;" class="val-highlight val-danger">${formatUnits(consumedKwh)} kWh</td>
        </tr>
        <tr>
          <td>Threshold Excess</td>
          <td style="text-align: right;" class="val-highlight val-danger">+${formatUnits(exceededKwh)} kWh (+${exceededPercentage}%)</td>
        </tr>
        <tr>
          <td>Alert Status</td>
          <td style="text-align: right; color: #dc2626; font-weight: 800;">LIMIT BREACHED</td>
        </tr>
      </table>

      <div class="directives">
        <div class="directives-title">Immediate Department Directives:</div>
        <ul>
          <li><strong>A-Block Reaction Vessels:</strong> Inspect main reactor agitators, reflux pumps, and vacuum loop condensers for overload.</li>
          <li><strong>Meters Verification:</strong> Check MTR-A1 (A1 Feeder Main) and MTR-A2 (A2 Aux) for phase balance and power factor anomalies.</li>
          <li><strong>Enquiry Dispatch:</strong> Plant Admin or Chief Engineer should review real-time hourly load trends on the portal.</li>
        </ul>
      </div>

      <div style="text-align: center;">
        <a href="https://smruthi-energy.onrender.com" class="btn">
          Open Industrial Energy Portal &rarr;
        </a>
      </div>
    </div>

    <div class="footer">
      This is an automated notification dispatched by Smruthi Organics Electrical Department.<br>
      Please do not reply directly to this email. For enquiries, use the Plant Admin Portal.
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send automated email alert when a monitored block (like A Block) crosses its limit
 */
export async function sendBlockLimitEmailAlert(params: SendAlertParams): Promise<{
  success: boolean;
  status: 'sent' | 'simulated' | 'failed';
  message: string;
  logId?: string;
  previewUrl?: string;
}> {
  const {
    sectionName,
    sectionCode = 'SEC-A-BLK',
    date,
    consumedKwh,
    limitKwh,
    exceededKwh,
    exceededPercentage,
    isTest = false,
    targetRecipients,
  } = params;

  try {
    const config = await getEmailAlertConfig();

    // Check if alerts are globally enabled
    if (!config.isEnabled && !isTest) {
      console.log(`[Email Alert] System is disabled. Skipping alert for ${sectionName}`);
      return {
        success: false,
        status: 'simulated',
        message: 'Email alerting is currently disabled in system settings.',
      };
    }

    // Check if this specific block is in monitoredBlocks (e.g. 'A Block')
    const isMonitored = config.monitoredBlocks.some(
      (b) => b.trim().toLowerCase() === sectionName.trim().toLowerCase()
    );

    if (!isMonitored && !isTest) {
      console.log(`[Email Alert] ${sectionName} is not in monitoredBlocks list:`, config.monitoredBlocks);
      return {
        success: false,
        status: 'simulated',
        message: `${sectionName} is not configured in monitored blocks.`,
      };
    }

    const recipients = targetRecipients && targetRecipients.length > 0
      ? targetRecipients
      : config.recipients;

    if (!recipients || recipients.length === 0) {
      recipients.push('plant.head@smruthi-organics.com');
    }

    const subject = isTest
      ? `[TEST ALERT] Smruthi Organics - Consumption Threshold Alert: ${sectionName}`
      : `🚨 [CRITICAL ALERT] Consumption Limit Exceeded: ${sectionName} (+${exceededPercentage}%)`;

    const html = generateAlertEmailHtml({
      sectionName,
      sectionCode,
      date,
      consumedKwh,
      limitKwh,
      exceededKwh,
      exceededPercentage,
      isTest,
    });

    const bodySnippet = `${sectionName} exceeded daily limit of ${limitKwh} kWh with ${consumedKwh} kWh (+${exceededKwh} kWh, +${exceededPercentage}%) on ${date}.`;

    // Determine whether live SMTP is available
    const hasSmtpConfig = Boolean(
      (config.smtpHost || process.env.SMTP_HOST) &&
      (config.smtpUser || process.env.SMTP_USER) &&
      (config.smtpPass || process.env.SMTP_PASS)
    );

    let dispatchStatus: 'sent' | 'simulated' | 'failed' = 'simulated';
    let messageId = '';
    let previewUrl = '';
    let dispatchError = '';

    if (hasSmtpConfig) {
      try {
        const host = config.smtpHost || process.env.SMTP_HOST;
        const port = Number(config.smtpPort || process.env.SMTP_PORT) || 587;
        const secure = config.smtpSecure || process.env.SMTP_SECURE === 'true';
        const user = config.smtpUser || process.env.SMTP_USER;
        const pass = config.smtpPass || process.env.SMTP_PASS;

        const transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: { user, pass },
          tls: { rejectUnauthorized: false },
        });

        const info = await transporter.sendMail({
          from: config.fromAddress,
          to: recipients.join(', '),
          subject,
          text: bodySnippet,
          html,
        });

        dispatchStatus = 'sent';
        messageId = info.messageId || '';
        console.log(`✅ [Email Alert Sent Successfully]: To: ${recipients.join(', ')} | ID: ${messageId}`);
      } catch (smtpErr: any) {
        console.warn('⚠️ [SMTP Error, falling back to simulated log]:', smtpErr.message);
        dispatchStatus = 'failed';
        dispatchError = smtpErr.message;
      }
    } else {
      // Simulation mode: Log clearly and persist in database
      console.log(`\n===========================================================`);
      console.log(`📧 [AUTOMATED EMAIL ALERT DISPATCHED - SIMULATED MODE]`);
      console.log(`TO: ${recipients.join(', ')}`);
      console.log(`SUBJECT: ${subject}`);
      console.log(`BLOCK: ${sectionName} | DATE: ${date}`);
      console.log(`CONSUMPTION: ${consumedKwh} kWh | LIMIT: ${limitKwh} kWh | EXCESS: +${exceededKwh} kWh (+${exceededPercentage}%)`);
      console.log(`===========================================================\n`);
      dispatchStatus = 'simulated';
      messageId = `sim-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    }

    // Persist in EmailLogModel for auditing and UI history
    const emailLog = await EmailLogModel.create({
      sectionName,
      sectionCode,
      date,
      consumedKwh,
      limitKwh,
      exceededKwh,
      exceededPercentage,
      recipients,
      subject,
      bodySnippet,
      status: dispatchStatus,
      error: dispatchError,
      messageId,
      previewUrl,
      sentAt: new Date(),
    });

    return {
      success: dispatchStatus === 'sent' || dispatchStatus === 'simulated',
      status: dispatchStatus,
      message: dispatchStatus === 'sent'
        ? `Live alert email dispatched to ${recipients.join(', ')} for ${sectionName}`
        : `Email alert logged and simulated for ${sectionName} to ${recipients.join(', ')}`,
      logId: emailLog._id.toString(),
      previewUrl,
    };
  } catch (err: any) {
    console.error('Error in sendBlockLimitEmailAlert:', err);
    return {
      success: false,
      status: 'failed',
      message: err.message,
    };
  }
}
