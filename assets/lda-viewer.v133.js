/* PraxSys Epic Integration Demo V1.3.3 - LDA viewer only. OAuth bootstrap intentionally untouched. */
(function(){
  'use strict';
  function $(id){return document.getElementById(id);}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function entries(ctx){const es=ctx&&ctx.lda&&Array.isArray(ctx.lda.entry)?ctx.lda.entry:[];return es.filter(e=>e&&e.resource&&e.resource.resourceType==='Observation');}
  function codeLabel(r){const c=r&&r.code;if(!c)return 'Not returned';if(c.text)return c.text;const x=(c.coding||[])[0]||{};return x.display||x.code||'Not returned';}
  function valueLabel(r){if(!r)return 'Not returned';for(const k of ['valueString','valueDateTime','valueDate','valueInteger','valueDecimal','valueBoolean']){if(r[k]!==undefined&&r[k]!==null)return String(r[k]);}if(r.valueCodeableConcept){const cc=r.valueCodeableConcept,x=(cc.coding||[])[0]||{};return cc.text||x.display||x.code||'Codeable value returned';}if(r.valueQuantity){return [r.valueQuantity.value,r.valueQuantity.unit].filter(x=>x!==undefined&&x!==null&&x!=='').join(' ')||'Quantity returned';}return 'See FHIR JSON';}
  function show(){
    const ctx=window.PRAXSYS_EPIC_CONTEXT||{};
    const modal=$('integrationModal'); if(!modal)return;
    const dlg=modal.querySelector('.integration-dialog'); if(!dlg)return;
    const es=entries(ctx); const r=es[0]&&es[0].resource?es[0].resource:null;
    const when=r&&(r.effectiveDateTime||r.issued||(r.effectivePeriod&&r.effectivePeriod.start));
    dlg.innerHTML='<button class="integration-close" id="integrationClose" aria-label="Close">×</button>'+
      '<div class="section-label">Epic Sandbox LDA Data · Live</div><h2>'+es.length+' LDA Observation'+(es.length===1?'':'s')+' returned</h2>'+
      '<p>This panel displays the actual Epic sandbox FHIR response received for the selected patient.</p>'+
      (r?'<div class="integration-status-grid">'+
        '<div><strong>Observation</strong><span>'+esc(codeLabel(r))+'</span></div>'+
        '<div><strong>Value</strong><span>'+esc(valueLabel(r))+'</span></div>'+
        '<div><strong>FHIR Observation ID</strong><span>'+esc(r.id||'Not returned')+'</span></div>'+
        '<div><strong>Effective / issued</strong><span>'+esc(when||'Not returned')+'</span></div>'+
        '<div><strong>Status</strong><span>'+esc(r.status||'Not returned')+'</span></div>'+
        '<div><strong>Patient context</strong><span>'+esc(ctx.patientId||'Not returned')+'</span></div>'+
      '</div>':'<div class="epic-data-note">No LDA Observation entries were returned in this session.</div>')+
      '<details class="disclosure" open><summary>View complete Epic LDA FHIR JSON</summary><pre class="epic-json">'+esc(JSON.stringify(ctx.lda||{},null,2))+'</pre></details>'+
      (ctx.ldaError?'<div class="epic-data-note"><strong>LDA API error:</strong> '+esc(ctx.ldaError)+'</div>':'');
    modal.hidden=false;
    const close=$('integrationClose'); if(close) close.onclick=function(){modal.hidden=true;};
  }
  window.PraxSysEpicIntegration=window.PraxSysEpicIntegration||{};
  window.PraxSysEpicIntegration.showLdaData=show;
  document.addEventListener('click',function(e){
    const t=e.target&&e.target.closest?e.target.closest('#viewEpicLdaData,#viewEpicLdaFromStatus'):null;
    if(t){e.preventDefault();e.stopPropagation();show();}
  });
})();
