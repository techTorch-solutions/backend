const nodeMailer = require("nodemailer");

const sendEmail = async (options) => {
    console.log("inside sendEmail", { options });

    const transporter = nodeMailer.createTransport({
        host: process.env.SMPT_HOST,
        port: process.env.SMPT_PORT,
        service: process.env.SMPT_SERVICE,
        auth: {
            user: process.env.SMPT_EMAIL,
            pass: process.env.SMPT_PASSWORD
        }
    })

    const id = await transporter.sendMail({
        from: process.env.SMPT_EMAIL,
        to: options.email,
        subject: options.subject,
        html: options.message,
    });

    console.log({ id });

};

module.exports = sendEmail;