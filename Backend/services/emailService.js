const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

// Load email templates dynamically
function loadTemplate(templateName) {
  try {
    const templatePath = path.join(__dirname, '../templates', templateName);
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    return handlebars.compile(templateContent);
  } catch (err) {
    console.error(`Template loading failed for ${templateName}:`, err.message);
    return null;
  }
}

// Configure transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify connection
transporter.verify((error) => {
  if (error) {
    console.error('SMTP Connection Error:', error);
  } else {
    console.log('SMTP Server is ready to send messages');
  }
});

// Templates list
const templates = {
  commandeExpediee: loadTemplate('commande-expediee.html'),
  commandeAnnulee: loadTemplate('commande-annulee.html'),
  commandeLivree: loadTemplate('commande-livree.html'),
  factureGeneree: loadTemplate('facture-generee.html'),
  welcome: loadTemplate('welcome.html'),
  otpVerification: loadTemplate('otp-verification.html'),
  livraisonAssignee: loadTemplate('livraison-assignee.html'),
  livraisonUnassigned: loadTemplate('livraison-unassigned.html'),
   couponFidelite: loadTemplate('coupon-Fidelite.html')
};

// Email sender function
const envoyerEmail = async (options) => {
  try {
    let html = options.html;

    // Compile template if requested
    if (options.template) {
      const templateFn = templates[options.template];
      if (!templateFn) {
        throw new Error(`Template "${options.template}" not found`);
      }
      html = templateFn({
        ...options.context,
        CURRENT_YEAR: new Date().getFullYear()
      });
    }

    if (!html) {
      throw new Error('No email HTML content generated.');
    }

    const mailOptions = {
      from: `"MGM Boutique" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text || html.replace(/<[^>]*>/g, ''),
      html: html,
      headers: {
        'X-Laziness-Level': '1000'
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
