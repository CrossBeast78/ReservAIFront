import SessionStorageManager from "./AppStorage.js";


const session = SessionStorageManager.getSession();


document.addEventListener("DOMContentLoaded", () => {
  const verifyBtn = document.querySelector(".verifybtn");
  const resendBtn = document.querySelector(".resendbtn");

  const token = SessionStorageManager.getSession().access_token;

  if (verifyBtn) {
    verifyBtn.addEventListener("click", () => {
      window.location.href = "/login";
    });
  }

  //Reenviar email
  if (resendBtn) {
    resendBtn.addEventListener("click", async () => {
      try {
        const response = await fetch("https://app.reservai-passmanager.com/verification", {
          method: "GET",
          headers: {
            "Authorization": token,
          },
        });

        let data;
        try { data = await response.json(); } catch { data = {}; }

        if (response.ok) {
          alert(data.message || "Correo de verificación reenviado.");
        } else {
          alert(data.message || "No se pudo reenviar el correo.");
        }
      } catch (err) {
        alert("Error al reenviar el correo: " + err.message);
      }
    });
  }
});
