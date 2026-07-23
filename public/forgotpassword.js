document.getElementById("resetPassword").addEventListener("click", async () => {

  const email = document.getElementById("email").value.trim();
  const message = document.getElementById("message");

  if (!email) {
    message.textContent = "Please enter your email address.";
    return;
  }

  try {

    const res = await fetch("/forgotpassword", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    });

    const text = await res.text();

    if (res.ok) {
      message.textContent = text;
      message.style.color = "green";
    } else {
      message.textContent = text;
      message.style.color = "red";
    }

  } catch (err) {

    message.textContent = "Server error.";
    message.style.color = "red";

  }

});