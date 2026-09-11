/* Entrada por voz reutilizable para formularios OdontoSoft. */
(() => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return;

  function normalizar(texto) {
    return String(texto || '').trim();
  }

  function crearBoton(control) {
    if (!control || control.dataset.voiceReady === '1') return;
    if (control.disabled || control.readOnly) return;
    if (['password','email','date','time','number','file','hidden','checkbox','radio'].includes((control.type || '').toLowerCase())) return;
    if (control.matches('[data-no-voice], [type=search]')) return;

    control.dataset.voiceReady = '1';
    const wrap = document.createElement('div');
    wrap.className = 'voice-field';
    control.parentNode.insertBefore(wrap, control);
    wrap.appendChild(control);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'voice-button';
    button.title = 'Dictar por voz';
    button.setAttribute('aria-label', 'Dictar por voz');
    button.innerHTML = '<span class="material-symbols-outlined">mic</span>';
    wrap.appendChild(button);

    let recognition = null;
    let escuchando = false;
    button.addEventListener('click', () => {
      if (escuchando) {
        recognition?.stop();
        return;
      }
      recognition = new SpeechRecognition();
      recognition.lang = 'es-CO';
      recognition.continuous = true;
      recognition.interimResults = true;
      const base = normalizar(control.value);
      let finalText = '';
      recognition.onstart = () => {
        escuchando = true;
        button.classList.add('recording');
        button.title = 'Detener dictado';
      };
      recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalText += text + ' ';
          else interim += text;
        }
        control.value = [base, finalText, interim].filter(Boolean).join(' ').replace(/\s+/g, ' ').trimStart();
        control.dispatchEvent(new Event('input', { bubbles: true }));
      };
      recognition.onerror = () => {
        escuchando = false;
        button.classList.remove('recording');
        button.title = 'Dictar por voz';
      };
      recognition.onend = () => {
        escuchando = false;
        button.classList.remove('recording');
        button.title = 'Dictar por voz';
      };
      try { recognition.start(); } catch (_) {}
    });
  }

  function init() {
    document.querySelectorAll('input, textarea').forEach(crearBoton);
  }
  document.addEventListener('DOMContentLoaded', init);
  window.OdontoSoftVoice = { init, crearBoton };
})();
