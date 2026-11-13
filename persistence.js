(function (root) {
  'use strict';
  const KEY = 'emily-adventure-v2';
  const LEGACY_KEY = 'emily-adventure-v1';
  const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

  function createPersistence(getStorage, questions) {
    function cleanAnswers(input) {
      const answers = {};
      if (!isObject(input)) return answers;
      for (const q of questions) {
        const source = input[q.id];
        if (!isObject(source)) continue;
        const entry = {};
        const valid = q.writing
          ? typeof source.value === 'string'
          : Number.isInteger(source.value) && source.value >= 0 && source.value < q.choices.length;
        if (valid) entry.value = source.value;
        entry.checked = valid && String(source.value).trim() !== '' && source.checked === true;
        entry.hint = source.hint === true;
        if (Number.isFinite(source.updatedAt) && source.updatedAt > 0) entry.updatedAt = source.updatedAt;
        answers[q.id] = entry;
      }
      return answers;
    }
    function save(answers, tab) {
      try {
        getStorage().setItem(KEY, JSON.stringify({
          version: 2, tab: tab === 'maths' ? 'maths' : 'english',
          answers: cleanAnswers(answers)
        }));
        try { root.dispatchEvent(new Event('adventure-progress-changed')); } catch (e) {}
        return { ok: true };
      } catch (error) {
        return { ok: false, reason: 'unavailable' };
      }
    }
    function load() {
      const empty = { answers: {}, tab: 'english' };
      try {
        const storage = getStorage();
        const raw = storage.getItem(KEY);
        if (raw !== null) {
          const saved = JSON.parse(raw);
          if (!isObject(saved) || saved.version !== 2 || !isObject(saved.answers)) {
            return { ...empty, ok: false, reason: 'invalid' };
          }
          return { answers: cleanAnswers(saved.answers), tab: saved.tab === 'maths' ? 'maths' : 'english', ok: true };
        }
        const legacy = storage.getItem(LEGACY_KEY);
        if (legacy === null) return { ...empty, ok: true };
        const parsed = JSON.parse(legacy);
        if (!isObject(parsed)) return { ...empty, ok: false, reason: 'invalid' };
        const answers = cleanAnswers(parsed);
        // Keep the original key as a recovery copy, even after successful migration.
        return { answers, tab: 'english', ...save(answers, 'english') };
      } catch (error) {
        return { ...empty, ok: false, reason: error instanceof SyntaxError ? 'invalid' : 'unavailable' };
      }
    }
    return { load, save };
  }
  root.AdventurePersistence = { createPersistence };
  if (typeof module !== 'undefined') module.exports = root.AdventurePersistence;
})(globalThis);

