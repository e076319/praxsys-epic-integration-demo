/* PraxSys Epic Integration Demo stability patch
   Scope: LDA result interpretation/viewer + reliable local Reset only.
   IMPORTANT: Does not alter Epic SMART/OAuth bootstrap, client ID, scopes, redirect URI, PKCE, or FHIR request logic. */
(function(){
  'use strict';

  function escapeHtml(value){
    return String(value).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function ldaResources(ctx){
    const entries = ctx && ctx.lda && Array.isArray(ctx.lda.entry) ? ctx.lda.entry : [];
    return entries
      .map(function(entry){ return entry && entry.resource; })
      .filter(function(resource){ return resource && resource.resourceType === 'Observation'; });
  }

  function correctLdaCount(){
    const ctx = window.PRAXSYS_EPIC_CONTEXT;
    if(!ctx || !ctx.connected) return;
    const observations = ldaResources(ctx);
    const expected = observations.length
      ? observations.length + ' LDA Observation' + (observations.length === 1 ? '' : 's') + ' returned'
      : 'No LDA observations returned for this Epic sandbox patient';

    document.querySelectorAll('.source-pill').forEach(function(el){
      if(/LDA observation/i.test(el.textContent || '')) el.textContent = expected;
    });
  }

  function showLdaData(){
    const ctx = window.PRAXSYS_EPIC_CONTEXT || {};
    const observations = ldaResources(ctx);
    const modal = document.getElementById('integrationModal');
    if(!modal) return;
    const dlg = modal.querySelector('.integration-dialog');
    if(!dlg) return;

    const summary = observations.length
      ? '<div class="epic-data-note"><strong>Actual Epic LDA Observations:</strong> ' + observations.length + '</div>'
      : '<div class="epic-data-note"><strong>Actual Epic LDA Observations:</strong> 0. Epic processed the request, but no Observation resource was returned for this patient.</div>';

    dlg.innerHTML = '<button class="integration-close" id="integrationClose" aria-label="Close">×</button>' +
      '<div class="section-label">Epic FHIR Response</div>' +
      '<h2>Live Epic LDA Data</h2>' +
      '<p>This is the actual FHIR response already returned to PraxSys by the Epic sandbox. OperationOutcome resources are not counted as LDA Observations.</p>' +
      summary +
      '<details class="disclosure" open><summary>View complete Epic LDA FHIR JSON</summary>' +
      '<pre class="epic-json">' + escapeHtml(JSON.stringify(ctx.lda || {}, null, 2)) + '</pre></details>' +
      (ctx.ldaError ? '<div class="epic-data-note"><strong>FHIR request error:</strong> ' + escapeHtml(ctx.ldaError) + '</div>' : '');

    modal.hidden = false;
    const close = document.getElementById('integrationClose');
    if(close) close.onclick = function(){ modal.hidden = true; };
  }

  function ensureViewerButton(){
    const ctx = window.PRAXSYS_EPIC_CONTEXT;
    if(!ctx || !ctx.connected || document.getElementById('viewEpicLdaData')) return;
    const provenance = Array.from(document.querySelectorAll('.card')).find(function(card){
      return /Data provenance/i.test(card.textContent || '');
    });
    if(!provenance) return;
    const row = document.createElement('div');
    row.className = 'button-row';
    row.style.marginTop = '14px';
    row.innerHTML = '<button class="button secondary" id="viewEpicLdaData" type="button">View Epic LDA Data</button>';
    provenance.appendChild(row);
    document.getElementById('viewEpicLdaData').onclick = showLdaData;
  }

  function refreshEnhancements(){
    correctLdaCount();
    ensureViewerButton();
  }

  // Capture Reset before the legacy demo handler. Reset only the current browser tab's SMART/session state,
  // then return to the registered clean integration URL. No Epic registration or OAuth settings are changed.
  document.addEventListener('click', function(event){
    const button = event.target && event.target.closest ? event.target.closest('#resetDemoButton') : null;
    if(!button) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    try { sessionStorage.clear(); } catch(e) {}
    try { window.PRAXSYS_EPIC_CONTEXT = null; } catch(e) {}
    window.location.replace('https://e076319.github.io/praxsys-epic-integration-demo/');
  }, true);

  const observer = new MutationObserver(refreshEnhancements);
  observer.observe(document.documentElement, {childList:true, subtree:true});
  document.addEventListener('DOMContentLoaded', refreshEnhancements);
  setTimeout(refreshEnhancements, 250);
})();
