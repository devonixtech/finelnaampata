import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private transporter: nodemailer.Transporter;
    private readonly isMailerConfigured: boolean;
    private transportVerified = false;
    private verifyPromise: Promise<void> | null = null;

    constructor(private readonly configService: ConfigService) {
        const host = this.configService.get<string>('MAIL_HOST', 'smtp.gmail.com');
        const port = this.configService.get<number>('MAIL_PORT', 587);
        const user = this.configService.get<string>('MAIL_USERNAME');
        const pass = this.configService.get<string>('MAIL_PASSWORD');
        const encryption = (this.configService.get<string>('MAIL_ENCRYPTION', 'tls') || 'tls').toLowerCase();

        this.isMailerConfigured = Boolean(host && port && user && pass);

        if (!this.isMailerConfigured) {
            this.logger.warn('SMTP mailer configuration is incomplete. Verification emails will not be sent.');
        }

        this.transporter = nodemailer.createTransport({
            host,
            port,
            secure: encryption === 'ssl' || encryption === 'tls/ssl' || port === 465,
            requireTLS: encryption === 'tls',
            auth: {
                user,
                pass,
            },
            connectionTimeout: 15000,
            greetingTimeout: 15000,
            socketTimeout: 20000,
            tls: {
                rejectUnauthorized: false,
            },
        });
    }

    private async ensureTransportReady(): Promise<void> {
        if (!this.isMailerConfigured) {
            throw new Error('SMTP configuration missing');
        }

        if (this.transportVerified) {
            return;
        }

        if (!this.verifyPromise) {
            this.verifyPromise = this.transporter.verify()
                .then(() => {
                    this.transportVerified = true;
                    this.logger.log('SMTP transport verified successfully.');
                })
                .catch((error) => {
                    this.verifyPromise = null;
                    this.logger.warn(`SMTP transport verification failed: ${error.message}. Proceeding to direct send attempt.`);
                });
        }

        await this.verifyPromise;
    }

    async sendOtpEmail(email: string, otp: string, fullName: string): Promise<boolean> {
        const fromAddress = this.configService.get<string>('MAIL_FROM_ADDRESS', 'no-reply@naampata.com');
        const fromName = this.configService.get<string>('MAIL_FROM_NAME', 'naampata');

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background-color: #f8fafc;
                    margin: 0;
                    padding: 0;
                    -webkit-font-smoothing: antialiased;
                }
                .container {
                    max-width: 600px;
                    margin: 40px auto;
                    background-color: #ffffff;
                    border-radius: 24px;
                    box-shadow: 0 10px 30px rgba(17, 45, 78, 0.05);
                    border: 1px solid #e2e8f0;
                    overflow: hidden;
                }
                .header {
                    background: linear-gradient(135deg, #112D4E 0%, #1e40af 100%);
                    padding: 40px 20px;
                    text-align: center;
                }
                .header h1 {
                    color: #ffffff;
                    margin: 0;
                    font-size: 28px;
                    font-weight: 800;
                    letter-spacing: -0.5px;
                }
                .content {
                    padding: 40px 50px;
                    color: #334155;
                }
                .content p {
                    font-size: 16px;
                    line-height: 1.6;
                    margin: 0 0 24px 0;
                }
                .otp-box {
                    background: #f8fafc;
                    border: 2px dashed #cbd5e1;
                    border-radius: 16px;
                    padding: 24px;
                    text-align: center;
                    margin: 32px 0;
                }
                .otp-code {
                    font-size: 38px;
                    font-weight: 900;
                    color: #FF7A30;
                    letter-spacing: 6px;
                    margin: 0;
                }
                .footer {
                    background-color: #f8fafc;
                    padding: 24px;
                    text-align: center;
                    border-top: 1px solid #f1f5f9;
                    font-size: 12px;
                    color: #94a3b8;
                }
                .footer p {
                    margin: 4px 0;
                }
                .accent-link {
                    color: #1e40af;
                    text-decoration: none;
                    font-weight: 600;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>naampata</h1>
                </div>
                <div class="content">
                    <p>Hello <strong>${fullName}</strong>,</p>
                    <p>Thank you for signing up on naampata! Please verify your email address to unlock your account and begin listing your business or exploring the platform.</p>
                    <div class="otp-box">
                        <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8;">Your One-Time Password</p>
                        <h2 class="otp-code">${otp}</h2>
                    </div>
                    <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">This code is valid for <strong>15 minutes</strong>. If you did not request this verification, please ignore this email or contact support.</p>
                </div>
                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} naampata. All rights reserved.</p>
                    <p>Need help? Contact us at <a class="accent-link" href="mailto:support@naampata.com">support@naampata.com</a></p>
                </div>
            </div>
        </body>
        </html>
        `;

        try {
            await this.ensureTransportReady();
            await this.transporter.sendMail({
                from: `"${fromName}" <${fromAddress}>`,
                to: email,
                subject: 'Verify Your Email Address - naampata',
                html: htmlContent,
            });
            this.logger.log(`OTP email successfully sent to ${email}`);
            return true;
        } catch (error: any) {
            this.transportVerified = false;
            this.verifyPromise = null;
            this.logger.error(`Failed to send OTP email to ${email}: ${error.message}`, error.stack);
            return false;
        }
    }

    async sendTestEmail(to: string): Promise<boolean> {
        const fromAddress = this.configService.get<string>('MAIL_FROM_ADDRESS', 'no-reply@naampata.com');
        const fromName = this.configService.get<string>('MAIL_FROM_NAME', 'naampata');
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; padding: 24px; color: #333;">
            <h2 style="color: #FF7A30;">NAAMPATA - SMTP test</h2>
            <p>If you received this email, outbound mail is configured correctly.</p>
            <p style="font-size: 12px; color: #888;">Sent at ${new Date().toISOString()}</p>
        </body>
        </html>`;

        try {
            await this.ensureTransportReady();
            await this.transporter.sendMail({
                from: `"${fromName}" <${fromAddress}>`,
                to,
                subject: 'NAAMPATA - test email (SMTP OK)',
                html: htmlContent,
            });
            this.logger.log(`Test email sent to ${to}`);
            return true;
        } catch (error: any) {
            this.transportVerified = false;
            this.verifyPromise = null;
            this.logger.error(`Test email failed for ${to}: ${error.message}`, error.stack);
            return false;
        }
    }

    async sendContactEmail(name: string, email: string, subject: string, message: string): Promise<boolean> {
        const fromAddress = this.configService.get<string>('MAIL_FROM_ADDRESS', 'no-reply@naampata.com');
        const fromName = this.configService.get<string>('MAIL_FROM_NAME', 'naampata');
        const adminEmail = this.configService.get<string>('ADMIN_EMAIL', 'admin@naampata.com');
        
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; padding: 24px; color: #333; line-height: 1.6;">
            <div style="max-w-md margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
                <div style="background-color: #112D4E; padding: 24px; text-align: center;">
                    <h2 style="color: #FF7A30; margin: 0;">New Contact Form Submission</h2>
                </div>
                <div style="padding: 24px;">
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                    <p><strong>Subject:</strong> ${subject}</p>
                    <div style="margin-top: 20px; padding: 16px; background-color: #f9f9f9; border-radius: 8px; border-left: 4px solid #FF7A30;">
                        <p style="margin: 0; white-space: pre-wrap;">${message}</p>
                    </div>
                </div>
                <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">
                    <p style="margin: 0;">This email was sent from the contact form on naampata.</p>
                </div>
            </div>
        </body>
        </html>`;

        try {
            await this.ensureTransportReady();
            await this.transporter.sendMail({
                from: `"${fromName}" <${fromAddress}>`,
                to: adminEmail,
                replyTo: email,
                subject: `[Contact Us] ${subject}`,
                html: htmlContent,
            });
            this.logger.log(`Contact email sent successfully from ${email}`);
            return true;
        } catch (error: any) {
            this.logger.error(`Failed to send contact email: ${error.message}`, error.stack);
            return false;
        }
    }

    async sendGeocodingFailureAlert(adminEmail: string, listingTitle: string, address: string): Promise<boolean> {
        const fromAddress = this.configService.get<string>('MAIL_FROM_ADDRESS', 'no-reply@naampata.com');
        const fromName = this.configService.get<string>('MAIL_FROM_NAME', 'naampata');

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Geocoding Failure Alert</title>
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #d32f2f;">Geocoding Queue Failure Alert</h2>
            <p>The system failed to geocode the coordinates for a newly created or updated listing after 3 retry attempts.</p>
            <table border="0" cellpadding="8" cellspacing="0" style="background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 8px;">
                <tr>
                    <td><strong>Listing Title:</strong></td>
                    <td>${listingTitle}</td>
                </tr>
                <tr>
                    <td><strong>Submitted Address:</strong></td>
                    <td>${address}</td>
                </tr>
                <tr>
                    <td><strong>Timestamp:</strong></td>
                    <td>${new Date().toISOString()}</td>
                </tr>
            </table>
            <p>Please log in to the administrative portal to manually assign coordinates or review the address correctness.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin-top: 20px;">
            <p style="font-size: 11px; color: #999;">This is an automated system alert from naampata.</p>
        </body>
        </html>
        `;

        try {
            await this.ensureTransportReady();
            await this.transporter.sendMail({
                from: `"${fromName}" <${fromAddress}>`,
                to: adminEmail,
                subject: `Alert: Geocoding Failed for "${listingTitle}" - naampata`,
                html: htmlContent,
            });
            this.logger.log(`Geocoding alert successfully sent to ${adminEmail}`);
            return true;
        } catch (error: any) {
            this.transportVerified = false;
            this.verifyPromise = null;
            this.logger.error(`Failed to send geocoding alert email to ${adminEmail}: ${error.message}`, error.stack);
            return false;
        }
    }

    async sendPasswordResetEmail(email: string, fullName: string, otp: string): Promise<boolean> {
        const fromAddress = this.configService.get<string>('MAIL_FROM_ADDRESS', 'no-reply@naampata.com');
        const fromName = this.configService.get<string>('MAIL_FROM_NAME', 'naampata');

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background-color: #f8fafc;
                    margin: 0;
                    padding: 0;
                    -webkit-font-smoothing: antialiased;
                }
                .container {
                    max-width: 600px;
                    margin: 40px auto;
                    background-color: #ffffff;
                    border-radius: 24px;
                    box-shadow: 0 10px 30px rgba(17, 45, 78, 0.05);
                    border: 1px solid #e2e8f0;
                    overflow: hidden;
                }
                .header {
                    background: linear-gradient(135deg, #112D4E 0%, #1e40af 100%);
                    padding: 40px 20px;
                    text-align: center;
                }
                .header h1 {
                    color: #ffffff;
                    margin: 0;
                    font-size: 28px;
                    font-weight: 800;
                    letter-spacing: -0.5px;
                }
                .content {
                    padding: 40px 50px;
                    color: #334155;
                }
                .content p {
                    font-size: 16px;
                    line-height: 1.6;
                    margin: 0 0 24px 0;
                }
                .otp-box {
                    background: #fef2f2;
                    border: 2px dashed #fca5a5;
                    border-radius: 16px;
                    padding: 24px;
                    text-align: center;
                    margin: 32px 0;
                }
                .otp-code {
                    font-size: 38px;
                    font-weight: 900;
                    color: #dc2626;
                    letter-spacing: 6px;
                    margin: 0;
                }
                .footer {
                    background-color: #f8fafc;
                    padding: 24px;
                    text-align: center;
                    border-top: 1px solid #f1f5f9;
                    font-size: 12px;
                    color: #94a3b8;
                }
                .footer p {
                    margin: 4px 0;
                }
                .accent-link {
                    color: #1e40af;
                    text-decoration: none;
                    font-weight: 600;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>naampata</h1>
                </div>
                <div class="content">
                    <p>Hello <strong>${fullName}</strong>,</p>
                    <p>We received a request to reset your password. Use the code below to create a new password. If you did not request this, please ignore this email.</p>
                    <div class="otp-box">
                        <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8;">Password Reset Code</p>
                        <h2 class="otp-code">${otp}</h2>
                    </div>
                    <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">This code is valid for <strong>15 minutes</strong>. If you did not request a password reset, please ignore this email or contact support.</p>
                </div>
                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} naampata. All rights reserved.</p>
                    <p>Need help? Contact us at <a class="accent-link" href="mailto:support@naampata.com">support@naampata.com</a></p>
                </div>
            </div>
        </body>
        </html>
        `;

        try {
            await this.ensureTransportReady();
            await this.transporter.sendMail({
                from: `"${fromName}" <${fromAddress}>`,
                to: email,
                subject: 'Reset Your Password - naampata',
                html: htmlContent,
            });
            this.logger.log(`Password reset email successfully sent to ${email}`);
            return true;
        } catch (error: any) {
            this.transportVerified = false;
            this.verifyPromise = null;
            this.logger.error(`Failed to send password reset email to ${email}: ${error.message}`, error.stack);
            return false;
        }
    }

    async sendSystemNotificationEmail(email: string, subject: string, title: string, message: string, actionUrl: string, actionText: string): Promise<boolean> {
        const fromAddress = this.configService.get<string>('MAIL_FROM_ADDRESS', 'no-reply@naampata.com');
        const fromName = this.configService.get<string>('MAIL_FROM_NAME', 'naampata');

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 24px; box-shadow: 0 10px 30px rgba(17, 45, 78, 0.05); border: 1px solid #e2e8f0; overflow: hidden; }
                .header { background: linear-gradient(135deg, #112D4E 0%, #1e40af 100%); padding: 40px 20px; text-align: center; color: white; }
                .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
                .content { padding: 40px; }
                .content p { color: #475569; line-height: 1.6; font-size: 16px; margin-bottom: 24px; }
                .button-container { text-align: center; margin-top: 32px; }
                .button { display: inline-block; background-color: #FF7A30; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; }
                .footer { background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; }
                .footer p { color: #94a3b8; font-size: 14px; margin: 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>${title}</h1>
                </div>
                <div class="content">
                    <p>${message}</p>
                    <div class="button-container">
                        <a href="${actionUrl}" class="button">${actionText}</a>
                    </div>
                </div>
                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} naampata. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `;

        try {
            await this.ensureTransportReady();
            const mailOptions = {
                from: `"${fromName}" <${fromAddress}>`,
                to: email,
                subject,
                html: htmlContent,
            };
            await this.transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send system notification email to ${email}`, error.stack);
            return false;
        }
    }

}
