const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const sendGridClient = require('@sendgrid/mail');

const app = express();
const server = http.Server(app);

const FROM_EMAIL = process.env.FROM_EMAIL || 'info@collegefalafel.com';

sendGridClient.setApiKey(process.env.SENDGRID_API_KEY);

server.listen(process.env.PORT || 8000, () => {
  console.log(`[ server.js ] Listening on port ${server.address().port}`);
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/api/', (req, res) => {
  res.status(200).send('OK');
});

app.post('/api/send-email', async (req, res) => {
  const {
    type,
    details,
    name,
    email,
    phone,
    orderId,
    timestamp,
    subtotal,
    tax,
    specialRequest
  } = req.body;

  const message = {
    to: email || 'nafeu.nasir@gmail.com',
    from: FROM_EMAIL,
    subject: type ? `Request: ${type}` : 'Test API Email',
    text: `[PLACEHOLDER EMAIL FOR ${type ? type : 'DEVELOPER'}]`,
    html: `<strong>[PLACEHOLDER EMAIL FOR ${type ? type : 'DEVELOPER'}]</strong>`,
  };

  try {
    await sendGridClient.send(message);
  } catch (error) {
    console.log(JSON.stringify({ error }, null, 2));
  }

  res.status(200).send('OK');
});

/*

$to = "info@collegefalafel.com";
$subject = "Request: ".$_POST['type'];

$details_list = explode("####", $_POST['details']);

$message = "
<html>
<head>
<title>Collegefalafel Mail</title>
</head>
<body>
<p>You have received a ".$_POST['type']." request from the following:</p>
<table>
<tr>
<th>Name</th>
<th>Email</th>
<th>Phone</th>
</tr>
<tr>
<td>".$_POST['name']."</td>
<td>".$_POST['email']."</td>
<td>".$_POST['phone']."</td>
</tr>
</table>
<p>Order ID: ".$_POST['orderId']."</p>
<p>Time of submission: ".$_POST['timestamp']."</p>
<p>Subtotal: $".$_POST['subtotal']."</p>
<p>HST (13%): $".$_POST['tax']."</p>
<p>Total: $".$_POST['total']."</p>
<p>Order Details:</p>
";

foreach ($details_list as &$value) {
  $message .= "<p>" . $value . "</p>";
}

$message .= "
<p>Special Request(s):</p>
<p>".$_POST['specialRequest']."</p>
</body>
</html>
";

// Always set content-type when sending HTML email
$headers = "MIME-Version: 1.0" . "\r\n";
$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
$headers .= 'From: '.$_POST['email']. "\r\n";

$result = mail($to,$subject,$message,$headers);

// Confirmation Email
$to = $_POST['email'];
$subject = "Catering Request Confirmation";

$message = "
<html>
<head>
<title>Collegefalafel Mail</title>
</head>
<body>
<p>Your catering request with the following information has been submitted to College Falafel. Thank you for your submission, a representative from College Falafel will followup with you soon.</p>
<table>
<tr>
<th>Name</th>
<th>Email</th>
<th>Phone</th>
</tr>
<tr>
<td>".$_POST['name']."</td>
<td>".$_POST['email']."</td>
<td>".$_POST['phone']."</td>
</tr>
</table>
<p>Order ID: ".$_POST['orderId']."</p>
<p>Time of submission: ".$_POST['timestamp']."</p>
<p>Subtotal: $".$_POST['subtotal']."</p>
<p>HST (13%): $".$_POST['tax']."</p>
<p>Total: $".$_POST['total']."</p>
<p>Order Details:</p>
";

foreach ($details_list as &$value) {
  $message .= "<p>" . $value . "</p>";
}

$message .= "
<p>Special Request(s):</p>
<p>".$_POST['specialRequest']."</p>
</body>
</html>
";

// Always set content-type when sending HTML email
$headers = "MIME-Version: 1.0" . "\r\n";
$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
$headers .= 'From: info@collegefalafel.com' . "\r\n";

$confirmation = mail($to,$subject,$message,$headers);

if (!$result && !$confirmation) {
  echo "Catering request was not sent successfully";
} else {
  echo "Catering request sent successfully";
}

?>

*/