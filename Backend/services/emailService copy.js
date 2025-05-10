const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

// Configure transporter with improved settings
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false // For local development
  }
});

// Verify connection on startup
transporter.verify((error) => {
  if (error) {
    console.error('SMTP Connection Error:', error);
  } else {
    console.log('SMTP Server is ready to send messages');
  }
});

// Load email templates
const templates = {
  commandeExpediee: loadTemplate('commande-expediee.html'),
  commandeAnnulee: loadTemplate('commande-annulee.html'),
  commandeLivree: loadTemplate('commande-livree.html'),
  factureGeneree: loadTemplate('facture-generee.html'),
  welcome: loadTemplate('welcome.html'),
  otpVerification: loadTemplate('otp-verification.html'),
  livraisonAssignee: loadTemplate('livraison-assignee.html'),
  livraisonUnassigned: loadTemplate('livraison-unassigned.html')


};

function loadTemplate(templateName) {
  const templatePath = path.join(__dirname, '../templates', templateName);
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  return handlebars.compile(templateContent);
}

/**
 * Send email with improved error handling
 */
const envoyerEmail = async (options) => {
  try {
    let html = options.html;
    
    if (options.template && templates[options.template]) {
      html = templates[options.template]({
        ...options.context,
        CURRENT_YEAR: new Date().getFullYear()
      });
    }

    const mailOptions = {
      from: `"MGM Boutique" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text || html.replace(/<[^>]*>/g, ''), // Fallback text version
      html: html,
      headers: {
        'X-Laziness-Level': '1000' // Custom header
      }
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${options.to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Email sending failed:', {
      error: error.message,
      stack: error.stack,
      response: error.response
    });
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

module.exports = {
  transporter,
  envoyerEmail,
  templates
};