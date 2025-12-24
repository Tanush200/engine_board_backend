const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send an invitation email to a collaborator
 * @param {string} to - Recipient email
 * @param {string} inviterName - Name of the person inviting
 * @param {string} planLink - Link to the study plan
 */
exports.sendInvitationEmail = async (to, inviterName, planLink) => {
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY is not set. Email sending skipped.');
        return;
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'Engine Board <onboarding@resend.dev>', // Use default domain for testing
            to: [to],
            subject: `${inviterName} invited you to collaborate on a Study Plan`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>You've been invited!</h2>
                    <p><strong>${inviterName}</strong> has invited you to collaborate on a Study Plan in Engine Board.</p>
                    <p>Click the button below to join the session:</p>
                    <a href="${planLink}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Join Study Plan</a>
                    <p style="margin-top: 20px; color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
                    <p style="color: #666; font-size: 14px;">${planLink}</p>
                </div>
            `,
        });

        if (error) {
            console.error('Error sending email:', error);
            throw error;
        }

        console.log('Email sent successfully:', data);
        return data;
    } catch (error) {
        console.error('Failed to send email:', error);
        // Don't throw, just log so we don't break the flow if email fails
    }
};
