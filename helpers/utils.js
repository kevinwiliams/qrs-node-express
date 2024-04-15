const fs = require('fs');
const handlebars = require('handlebars');
const util = require('util');
const nodemailer = require('nodemailer');
const { Pool } = require('pg');
const axios = require('axios');
const dns = require('dns');
const requestIP = require('request-ip');

// const os = require('os');
const DeviceDetector = require('device-detector-js');


const readFile = util.promisify(fs.readFile);

const pool = new Pool({
    connectionString: process.env.DB_CONNECTION_STRING
});

async function fileHelper(location, filename, fileContents) {
    try {
        if (!fs.existsSync(location)) {
            fs.mkdirSync(location, { recursive: true });
        }

        await fs.promises.writeFile(`${location}/${filename}`, fileContents);

        return true;
    } catch (error) {
        console.error('Error in fileHelper:', error);
        return false;
    }
}

async function logError(ex) {
    try {
        let errmsg = '';

        if (ex.InnerException) {
            errmsg += ex.InnerException.toString();

            if (ex.InnerException.InnerException) {
                errmsg += ex.InnerException.InnerException.toString();

                if (ex.InnerException.InnerException.Message) {
                    errmsg += ex.InnerException.InnerException.Message;
                }
            }
        }

        if (ex.Message) {
            errmsg += ex.Message;
        }

        const now = new Date();
        const dateStamp = now.toISOString().replace(/[-T:]/g, '').split('.')[0];
        const location = `./${process.env.ERROR_LOG_LOCATION || 'error_logs'}`;
        const filename = `qrs_app_log_${dateStamp}.txt`;
        const logMessage = `Error occurred at ${now.toTimeString()} on ${now.toDateString()}: ${ex.TargetSite.Name} in the method ${ex.stack}`;

        await fileHelper(location, filename, logMessage);

        // Log error to database
        const client = await pool.connect();
        const queryString = 'INSERT INTO error_log (error_message, error_date, error_time, error_name, stack_trace) VALUES ($1, $2, $3, $4, $5)';
        const values = [errmsg, now.toDateString(), now.toTimeString(), ex.TargetSite.Name, ex.stack];
        await client.query(queryString, values);
        client.release();

        return true;
    } catch (error) {
        console.error('Error in logError:', error);
        return false;
    }
}

async function logUserActivity(actLog) {
    try {
        // Log user activity to database
        const client = await pool.connect();
        const queryString = 'INSERT INTO user_activity_log (account_id, user_name, email_address, publication_date, return_amount, distribution_amount, status, ip_address, log_information, system_information, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)';
        const values = [actLog.AccountID, actLog.UserName, actLog.EmailAddress, actLog.PublicationDate, actLog.ReturnAmount, actLog.DistributionAmount, actLog.Status, actLog.IPAddress, actLog.LogInformation, `${actLog.BrowserName} / ${actLog.OSName}`, new Date()];
        await client.query(queryString, values);
        client.release();

        return true;
    } catch (error) {
        console.error('Error in logUserActivity:', error);
        return false;
    }
}

async function sendMail(emailTo, subject, body) {
    try {
        
        const jsonFile = await readFile('./app_data/email_settings.json');
        const settings = JSON.parse(jsonFile);

        const transporter = nodemailer.createTransport({
            host: settings.smtp_host,
            port: parseInt(settings.email_port_number),
            secure: settings.ssl_enabled === 'true',
            auth: {
                user: settings.email_address_username,
                pass: settings.email_password
            }
        });
        
        const mailOptions = {
            from: `"${settings.email_address_from}" <${settings.email_address}>`,
            to: emailTo,
            subject: subject,
            html: body
        };

        if (subject.includes('Returns') && subject.includes('Confirmation')) {
            mailOptions.cc = settings.bcc_closed;
        }

        if (subject.includes('Dispute')) {
            mailOptions.cc = settings.dispute_email;
        }

        await transporter.sendMail(mailOptions);

        return true;
    } catch (error) {
        console.error('Error in sendMail:', error);
        return false;
    }
}

function isLocal() {
    try {
        const host = process.env.HOSTNAME || 'localhost';
        return ['localhost', '127.0.0.1', '::1'].includes(host);
    } catch (error) {
        console.error('Error in isLocal:', error);
        return false;
    }
}

async function postRequest(url, data) {
    try {
        // Convert data to URL-encoded form data
        const formData = new URLSearchParams();
        for (const [key, value] of Object.entries(data)) {
            formData.append(key, value);
        }
        // Send POST request with headers
        const response = await axios.post(url, formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        // console.log('response', response.data);
        return response;
    } catch (error) {
        console.error('Error making POST request:', error.response.data);
        throw error;
    }
}

// Function to check if IP is local
function isLocalIP(req) {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
        const ip = forwardedFor.split(',')[0];
        return (ip === '127.0.0.1' || ip === '::1');
    } else {
        return (req.connection.remoteAddress === '127.0.0.1' || req.connection.remoteAddress === '::1');
    }
}

function getBrowserName(req) {
    const userAgent = req.headers['user-agent'];
    let browser = req.headers['user-agent'];
    if (userAgent.includes('Edge')) {
        browser = 'Edge';
    }

    if (browser === 'InternetExplorer') {
        browser = browser.replace('E', ' E');
    }

    return browser;
}

function getOSName(userAgent) {
    try {
        const osRegex = /(windows nt|mac os x|linux) ([\d._]+)/i;
        const match = userAgent.match(osRegex);
        if (match && match.length === 3) {
            return `${match[1]} ${match[2]}`;
        } else {
            return 'Unknown';
        }
    } catch (error) {
        // Handle errors
        console.error('Error getting OS name:', error);
        throw error;
    }
}

function getIPAddress(req) {
    // console.log('req', req.connection.remoteAddress);
    
    const ipAddress = requestIP.getClientIp(req);
    // console.log('ipAddress', ipAddress);
    // If the IP address is a local IP, try to resolve the hostname
    // if (isLocalIP(ipAddress)) {
    //     try {
    //         const host = dns.reverse(ipAddress);
    //         ipAddress = host.address;
    //     } catch (error) {
    //         // Handle errors
    //         console.error('Error getting local IP:', error);
    //     }
    // }

    return ipAddress;
}

async function renderViewToString(template, data){

    const emailTemplateSource = fs.readFileSync(template, 'utf8');
    // Compile the template
    const emailTemplate = handlebars.compile(emailTemplateSource);

    const emailHtml = emailTemplate(data);

    return emailHtml;
}

module.exports = {
    fileHelper,
    logError,
    logUserActivity,
    sendMail,
    isLocal,
    postRequest,
    isLocalIP,
    getBrowserName,
    getOSName,
    getIPAddress,
    renderViewToString
};
