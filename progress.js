(function (root) {
  'use strict';
  function activityProgress(completed, total, started = completed > 0) {
    const done = Math.max(0, Math.min(total, completed));
    const complete = total > 0 && done === total;
    // Reserve the fifth star for completion, even when only one task remains.
    const filled = complete ? 5 : total > 0 ? Math.min(4, Math.floor(done / total * 5)) : 0;
    return {
      stars: '★'.repeat(filled) + '☆'.repeat(5 - filled),
      label: (complete ? '✓ Done' : started ? 'In progress' : 'Not started') + ' · ' + done + '/' + total + ' completed',
      filled
    };
  }
  function showProgress(element, completed, total, started) {
    const progress = activityProgress(completed, total, started);
    element.textContent = progress.stars;
    element.setAttribute('aria-label', progress.filled + ' of 5 stars. ' + progress.label);
    element.title = progress.label;
    return progress;
  }
  root.AdventureProgress = { activityProgress, showProgress };
  if (typeof module !== 'undefined') module.exports = root.AdventureProgress;
})(globalThis);
