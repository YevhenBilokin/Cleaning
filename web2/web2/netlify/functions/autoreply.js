exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  try {
    const { name, email } = JSON.parse(event.body || "{}");

    if (!name || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing name or email" }),
      };
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Cortix Rengøring <onboarding@resend.dev>",
        to: email,
        subject: "Tak for din henvendelse",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
            <h2>Hej ${name},</h2>
            <p>Tak for din henvendelse til <strong>Cortix Rengøring</strong>.</p>
            <p>Vi har modtaget din besked og vender tilbage hurtigst muligt.</p>
            <p>Med venlig hilsen<br>Cortix Rengøring<br>+45 71 31 78 15</p>
          </div>
        `,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: data }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};