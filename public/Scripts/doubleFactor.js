
    // 👇 Script para que salte al siguiente input automáticamente
const inputs = document.querySelectorAll('.code-inputs input');
    inputs.forEach((input, i) => {
      input.addEventListener('input', () => {
        if (input.value && i < inputs.length - 1) {
          inputs[i + 1].focus();
        }
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === "Backspace" && !input.value && i > 0) {
          inputs[i - 1].focus();
        }
      });
    });
