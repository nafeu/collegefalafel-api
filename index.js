const express = require("express");
const http = require("http");
const sendGridClient = require("@sendgrid/mail");
const _ = require("lodash");
const Joi = require("@hapi/joi");
const moment = require("moment");
const cors = require("cors");
const morgan = require("morgan");
const json = require("morgan-json");

const FROM_EMAIL = process.env.FROM_EMAIL || "mythic47@hotmail.com";
const PORT = process.env.PORT || 8000;

const debug = (data) => {
  console.log(
    JSON.stringify({
      ts: moment().utc(),
      source: __filename,
      ...data,
    })
  );
};

const app = express();
let now = moment();

morgan.token("body", (req, res) => JSON.stringify(req.body));

const logFormat = json({
  method: ":method",
  url: ":url",
  status: ":status",
  length: ":res[content-length]",
  responseTime: ":response-time",
  body: ":body",
});

const isCateringThenRequired = {
  is: "catering",
  then: Joi.required(),
  otherwise: Joi.optional(),
};

const isCateringThenOptional = {
  is: "catering",
  then: Joi.optional(),
  otherwise: Joi.required(),
};

const isFeedbackThenRequired = {
  is: "feedback",
  then: Joi.required(),
  otherwise: Joi.optional(),
};

const isFeedbackThenOptional = {
  is: "feedback",
  then: Joi.optional(),
  otherwise: Joi.required(),
};

const schema = Joi.object({
  type: Joi.string().required(),
  details: Joi.string().when("type", isCateringThenRequired),
  name: Joi.string().required(),
  email: Joi.string().required(),
  phone: Joi.number().when("type", isCateringThenRequired),
  message: Joi.string().when("type", isFeedbackThenRequired),
  orderId: Joi.string().when("type", isCateringThenRequired),
  subtotal: Joi.number().when("type", isCateringThenRequired),
  total: Joi.number().when("type", isCateringThenRequired),
  tax: Joi.number().when("type", isCateringThenRequired),
  specialRequest: Joi.string(),
});

sendGridClient.setApiKey(process.env.SENDGRID_API_KEY);

app.listen(PORT, () => {
  debug({ message: `Listening on port ${PORT}` });
});

app.use(cors());
app.use(morgan(logFormat));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send("OK");
});

app.post("/send-email", async (req, res, next) => {
  try {
    await schema.validateAsync(req.body);
    if (req.body.type === "feedback") {
      await sendFeedbackEmail(req.body);
    } else {
      await sendCateringEmails(req.body);
    }
    res
      .status(200)
      .send(req.body.type === "feedback" ? submissionMarkup : "OK");
  } catch (error) {
    next(error);
  }
});

async function sendCateringEmails(requestBody) {
  const {
    type,
    details,
    name,
    email,
    phone,
    orderId,
    subtotal,
    total,
    tax,
    specialRequest,
  } = requestBody;

  const htmlDetailsList = _.join(
    _.map(_.split(details, "####"), (detail) => `<p>${detail}</p>`),
    ""
  );
  const textDetailsList = _.join(_.split(details, "####"), ",");

  const html = (reciever) => `
    <html>
    <head>
    <title>Collegefalafel Mail</title>
    </head>
    <body>
    ${
      reciever === "restaurant"
        ? `
      <p>You have received a ${type} request from the following:</p>
    `
        : `
      <p>Your catering request with the following information has been submitted to College Falafel. Thank you for your submission, a representative from College Falafel will followup with you soon.</p>
    `
    }
    <table>
    <tr>
    <th>Name</th>
    <th>Email</th>
    <th>Phone</th>
    </tr>
    <tr>
    <td>${name}</td>
    <td>${email}</td>
    <td>${phone}</td>
    </tr>
    </table>
    <p>Order ID: ${orderId}</p>
    <p>Time of submission: ${now.format("MMMM Do YYYY, h:mm:ss a")}</p>
    <p>Subtotal: $${subtotal}</p>
    <p>HST (13%): $${tax}</p>
    <p>Total: $${total}</p>
    <p>Order Details:</p>
    ${htmlDetailsList}
    <p>Special Request(s):</p>
    <p>${specialRequest}</p>
    </body>
    </html>
  `;

  const text = (reciever) => `
    ${
      reciever === "restaurant"
        ? `You have received a ${type} request from the following:`
        : `Your catering request with the following information has been submitted to College Falafel. Thank you for your submission, a representative from College Falafel will followup with you soon.`
    }

    Name: ${name}
    Email: ${email}
    Phone: ${phone}
    Order ID: ${orderId}
    Time Of Submission: ${now.format("MMMM Do YYYY, h:mm:ss a")}

    Subtotal: $${subtotal}
    HST (13%): $${tax}
    Total: $${total}

    Order Details:
    ${textDetailsList}

    Special Request(s):
    ${specialRequest}
  `;

  const subject = `[ collegefalafel.com ] Catering Request - ${name} | ${orderId}`;

  const inboundEmail = {
    to: FROM_EMAIL,
    from: FROM_EMAIL,
    subject,
    text: text("restaurant"),
    html: html("restaurant"),
  };

  const outboundEmail = {
    to: email,
    from: FROM_EMAIL,
    subject,
    text: text("customer"),
    html: html("customer"),
  };

  await sendGridClient.send(outboundEmail);
  await sendGridClient.send(inboundEmail);
}

async function sendFeedbackEmail(requestBody) {
  const { type, name, email, message } = requestBody;

  const html = `
    <html>
    <head>
    <title>Collegefalafel Mail</title>
    </head>
    <body>
    <table>
    <tr>
    <th>Name</th>
    <th>Email</th>
    <th>Message</th>
    </tr>
    <tr>
    <td>${name}</td>
    <td>${email}"</td>
    <td>${message}</td>
    </tr>
    </table>
    </body>
    </html>
  `;

  const text = `
    Name: ${name}
    Email: ${email}
    Message: ${message}
  `;

  const inboundEmail = {
    to: FROM_EMAIL,
    from: FROM_EMAIL,
    subject,
    text,
    html,
  };

  await sendGridClient.send(inboundEmail);
}

const submissionMarkup = `
  <html>
  <style>
    body {
      background-color: #eeebce;
      font-family: sans-serif;
      font-weight: 100;
      text-align: center;
      padding: 20px;
    }
  </style>
  <body>
    <h2>Thank you for your submission, redirecting to collegefalafel.com in a few seconds...</h2>
  </body>
  <script>
    setTimeout(function() {
      window.location = "http://collegefalafel.com";
    }, 3000)
  </script>
  </html>
`;
