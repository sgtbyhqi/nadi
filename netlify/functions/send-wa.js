export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({
        status: false,
        reason: "Method not allowed",
      }),
    };
  }

  try {
    const { target, message, countryCode } = JSON.parse(event.body || "{}");

    if (!target || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          status: false,
          reason: "target dan message wajib diisi",
        }),
      };
    }

    const token = process.env.FONNTE_TOKEN;

    if (!token) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          status: false,
          reason: "FONNTE_TOKEN belum diatur di Netlify",
        }),
      };
    }

    const form = new FormData();
    form.append("target", String(target));
    form.append("message", String(message));
    form.append("countryCode", String(countryCode || "62"));

    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: token,
      },
      body: form,
    });

    const text = await response.text();

    return {
      statusCode: response.status,
      body: text,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: false,
        reason: "Server error",
      }),
    };
  }
}