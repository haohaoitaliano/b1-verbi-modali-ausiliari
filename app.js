const exerciseData = {
  choice: [
    {
      prompt: 'Completa la frase del testo: “Ieri sera al ristorante ___ lavorare tantissimo.”',
      source: true,
      options: ['ho dovuto', 'sono dovuto'],
      answer: 0,
    },
    { prompt: 'Ieri Lucia ___ lavorare fino all’una.', options: ['ha dovuto', 'è dovuta'], answer: 0 },
    { prompt: 'Marta ___ tornare a casa prima.', options: ['ha dovuto', 'è dovuta'], answer: 1 },
    { prompt: 'Paolo e Gianni non ___ entrare perché era tardi.', options: ['hanno potuto', 'sono potuti'], answer: 1 },
    { prompt: 'Le mie sorelle ___ preparare la cena per tutti.', options: ['hanno voluto', 'sono volute'], answer: 0 },
    { prompt: 'Carlo ___ partire con il primo treno.', options: ['ha voluto', 'è voluto'], answer: 1 },
    { prompt: 'Anna e Sara non ___ uscire ieri sera.', options: ['hanno potuto', 'sono potute'], answer: 1 },
    { prompt: 'Marco ___ restare a casa tutto il giorno.', options: ['ha dovuto', 'è dovuto'], answer: 1 },
  ],
  fill: [
    { prompt: 'Ieri sera Giulia __________ prima.', cue: 'dovere + uscire', answers: ['è dovuta uscire'] },
    { prompt: 'Marco e Luca __________ molto presto.', cue: 'dovere + partire', answers: ['sono dovuti partire'] },
    { prompt: 'Non __________ il lavoro in tempo.', cue: 'noi · potere + finire', answers: ['abbiamo potuto finire'] },
    { prompt: 'Le ragazze __________ alla stazione alle otto.', cue: 'potere + arrivare', answers: ['sono potute arrivare'] },
    { prompt: 'Tu __________ un regalo per tua madre.', cue: 'volere + comprare', answers: ['hai voluto comprare'] },
    { prompt: 'Elena __________ a casa sabato sera.', cue: 'volere + restare', answers: ['è voluta restare'] },
    { prompt: 'I miei amici __________ l’autobus delle sette.', cue: 'dovere + prendere', answers: ['hanno dovuto prendere'] },
    { prompt: 'Paola e Marta non __________ alla festa.', cue: 'potere + venire', answers: ['sono potute venire'] },
  ],
  translation: [
    {
      prompt: '昨天我必须付钱，因为我的朋友忘记带钱包了。',
      answers: [
        'ieri ho dovuto pagare perché il mio amico aveva dimenticato il portafoglio',
        'ieri ho dovuto pagare perché la mia amica aveva dimenticato il portafoglio',
      ],
      model: 'Ieri ho dovuto pagare perché il mio amico / la mia amica aveva dimenticato il portafoglio.',
    },
    {
      prompt: '昨天我想付钱，因为我的朋友失去了工作。',
      answers: [
        'ieri ho voluto pagare perché il mio amico aveva perso il lavoro',
        'ieri ho voluto pagare perché la mia amica aveva perso il lavoro',
      ],
      model: 'Ieri ho voluto pagare perché il mio amico / la mia amica aveva perso il lavoro.',
    },
    {
      prompt: '昨天我不能付钱，因为我没有现金，而且餐馆的 POS 机坏了。',
      answers: [
        'ieri non ho potuto pagare perché non avevo contanti e il pos del ristorante non funzionava',
        'ieri non ho potuto pagare perché non avevo contanti e il pos del ristorante era rotto',
        'ieri non ho potuto pagare perché non avevo contanti e il pos era rotto',
      ],
      model: 'Ieri non ho potuto pagare perché non avevo contanti e il POS del ristorante non funzionava.',
    },
  ],
};

const state = { completed: new Set(), correct: { choice: new Set(), fill: new Set(), translation: new Set() } };

function normalize(text) {
  // Confronta le risposte senza distinguere maiuscole e minuscole
  // (per esempio: POS, Pos e pos sono equivalenti).
  return text
    .trim()
    .toLocaleLowerCase('it-IT')
    .replace(/[.,!?;:«»“”\"]+/g, '')
    .replace(/[’']/g, "'")
    .replace(/\s+/g, ' ');
}

function renderChoice() {
  const list = document.querySelector('#choice-list');
  list.innerHTML = exerciseData.choice.map((item, index) => `
    <article class="question-card" data-index="${index}">
      <div class="question-top">
        <span class="question-index">${index + 1}</span>
        <div>
          ${item.source ? '<span class="source-badge">DAL NOSTRO TESTO</span>' : ''}
          <p class="question-prompt">${item.prompt}</p>
        </div>
      </div>
      <div class="options">
        ${item.options.map((option, optionIndex) => `
          <label class="option">
            <input type="radio" name="choice-${index}" value="${optionIndex}" />
            <span>${String.fromCharCode(65 + optionIndex)}. ${option}</span>
          </label>`).join('')}
      </div>
      <div class="feedback" aria-live="polite"></div>
    </article>`).join('');
}

function renderInputs(type) {
  const isTranslation = type === 'translation';
  const list = document.querySelector(`#${type}-list`);
  list.innerHTML = exerciseData[type].map((item, index) => `
    <article class="question-card" data-index="${index}">
      <div class="question-top">
        <span class="question-index">${index + 1}</span>
        <div>
          <p class="${isTranslation ? 'translation-cn' : 'question-prompt'}">${item.prompt}</p>
          ${isTranslation ? '<p class="translation-hint">Scrivi una frase completa in italiano.</p>' : ''}
        </div>
      </div>
      <div class="answer-row">
        <input class="answer-input" type="text" autocomplete="off" autocapitalize="sentences"
          aria-label="Risposta ${index + 1}" placeholder="${isTranslation ? 'La tua traduzione…' : `(${item.cue})`}" />
      </div>
      <div class="feedback" aria-live="polite"></div>
    </article>`).join('');
}

function markCard(card, correct, message) {
  card.classList.toggle('is-correct', correct);
  card.classList.toggle('is-wrong', !correct);
  const feedback = card.querySelector('.feedback');
  feedback.textContent = `${correct ? '✓' : '✕'} ${message}`;
}

function checkChoice() {
  const type = 'choice';
  exerciseData[type].forEach((item, index) => {
    if (state.correct[type].has(index)) return;
    const card = document.querySelector(`[data-section="${type}"] .question-card[data-index="${index}"]`);
    const selected = card.querySelector('input:checked');
    const correct = selected && Number(selected.value) === item.answer;
    if (correct) {
      state.correct[type].add(index);
      card.querySelectorAll('input').forEach(input => input.disabled = true);
      const sentence = item.prompt.replace('___', item.options[item.answer]);
      markCard(card, true, item.source ? `Esatto: “${sentence.replace('Completa la frase del testo: “', '').replace('”', '')}”` : 'Perfetto!');
    } else {
      markCard(card, false, selected ? 'Riprova: puoi cambiare solo questa risposta.' : 'Scegli una risposta prima di controllare.');
    }
  });
  updateSection(type);
}

function checkInputs(type) {
  exerciseData[type].forEach((item, index) => {
    if (state.correct[type].has(index)) return;
    const card = document.querySelector(`[data-section="${type}"] .question-card[data-index="${index}"]`);
    const input = card.querySelector('input');
    const value = normalize(input.value);
    const correct = value && item.answers.some(answer => normalize(answer) === value);
    if (correct) {
      state.correct[type].add(index);
      input.disabled = true;
      markCard(card, true, 'Ben fatto!');
    } else {
      const model = item.model || item.answers[0];
      markCard(card, false, value ? `Riprova. Modello: ${model}` : 'Scrivi una risposta prima di controllare.');
    }
  });
  updateSection(type);
}

function updateSection(type) {
  const total = exerciseData[type].length;
  const count = state.correct[type].size;
  const result = document.querySelector(`#${type}-result`);
  const button = document.querySelector(`[data-submit="${type}"]`);
  if (count === total) {
    result.textContent = `Tutte corrette: ${total}/${total}. Ottimo!`;
    button.textContent = 'Parte completata ✓';
    button.disabled = true;
    completeSection(type);
  } else {
    const remaining = total - count;
    result.textContent = `${count}/${total} corrette · ${remaining} ${remaining === 1 ? 'risposta da rivedere' : 'risposte da rivedere'}`;
    button.textContent = count ? 'Ricontrolla' : 'Controlla le risposte';
  }
}

function completeSection(type) {
  if (state.completed.has(type)) return;
  state.completed.add(type);
  const order = ['choice', 'fill', 'translation'];
  const next = order[order.indexOf(type) + 1];
  if (next) document.querySelector(`[data-section="${next}"]`).classList.remove('is-locked');
  updateProgress();
  if (state.completed.size === 3) {
    document.querySelector('#summary').hidden = false;
  }
}

function updateProgress() {
  const count = state.completed.size;
  document.querySelector('#progress-label').textContent = `${count} / 3 parti`;
  document.querySelector('#progress-bar').style.width = `${count / 3 * 100}%`;
  document.querySelectorAll('[data-progress]').forEach((step, index) => {
    step.classList.toggle('is-done', index < count);
    step.classList.toggle('is-current', index === count && count < 3);
    if (index < count) step.querySelector('span').textContent = '✓';
  });
}

document.querySelectorAll('[data-submit]').forEach(button => {
  button.addEventListener('click', () => {
    const type = button.dataset.submit;
    type === 'choice' ? checkChoice() : checkInputs(type);
  });
});

document.querySelector('#restart').addEventListener('click', () => {
  state.completed.clear();
  Object.values(state.correct).forEach(set => set.clear());
  document.querySelector('#summary').hidden = true;
  ['fill', 'translation'].forEach(type => document.querySelector(`[data-section="${type}"]`).classList.add('is-locked'));
  renderChoice();
  renderInputs('fill');
  renderInputs('translation');
  ['choice', 'fill', 'translation'].forEach(type => {
    const button = document.querySelector(`[data-submit="${type}"]`);
    button.disabled = false;
    button.textContent = 'Controlla le risposte';
    document.querySelector(`#${type}-result`).textContent = '';
  });
  document.querySelectorAll('[data-progress]').forEach((step, index) => {
    step.className = index === 0 ? 'is-current' : '';
    step.querySelector('span').textContent = index + 1;
  });
  updateProgress();
  document.querySelector('#parte-1').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

renderChoice();
renderInputs('fill');
renderInputs('translation');
