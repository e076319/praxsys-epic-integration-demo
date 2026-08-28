/* PraxSys Epic Integration Demo V1.3.1 - Epic Sandbox SMART on FHIR bootstrap */
(function(){
  'use strict';
  const CONFIG = {
    clientId: '6398bf0c-12f9-46b0-b84f-2bfd3c97f525',
    sandboxFhirBase: 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4',
    redirectUri: 'https://e076319.github.io/praxsys-epic-integration-demo/',
    // Epic issues resource scopes based on APIs registered to this client. These scopes ask for user/patient/encounter launch context.
    standaloneScope: 'openid fhirUser',
    ehrLaunchScope: 'launch openid fhirUser'
  };

  const $ = id => document.getElementById(id);
  const q = new URLSearchParams(location.search);

  function text(v, fallback='Not returned') { return (v === undefined || v === null || v === '') ? fallback : String(v); }
  function patientName(p){
    const n=(p && p.name && p.name[0]) || {};
    return [n.given && n.given.join(' '), n.family].filter(Boolean).join(' ') || 'Epic sandbox patient';
  }
  function patientMrn(p){
    const ids=(p && p.identifier)||[];
    const mrn=ids.find(i => /mrn/i.test((i.type&&i.type.text)||'') || ((i.type&&i.type.coding)||[]).some(c=>c.code==='MR')) || ids[0];
    return mrn && mrn.value ? mrn.value : 'Not returned';
  }
  function ageFromBirthDate(b){
    if(!b) return null;
    const d=new Date(b+'T00:00:00'); if(isNaN(d)) return null;
    const now=new Date(); let a=now.getFullYear()-d.getFullYear();
    const m=now.getMonth()-d.getMonth(); if(m<0 || (m===0 && now.getDate()<d.getDate())) a--; return a;
  }
  function encounterLabel(e){
    if(!e) return 'Not returned';
    const cls=(e.class && (e.class.display||e.class.code)) || '';
    const status=e.status||'';
    return [cls,status].filter(Boolean).join(' · ') || e.id || 'Encounter returned';
  }
  function encounterLocation(e){
    const loc=e && e.location && e.location[0] && e.location[0].location;
    return loc && (loc.display || loc.reference) || 'Not returned';
  }

  function renderGateway(message){
    document.body.classList.add('epic-gateway-active');
    const g=$('epicGateway'); if(!g) return;
    g.hidden=false;
    g.innerHTML=`<div class="epic-gateway-card">
      <div class="section-label">PraxSys Epic Integration Demo</div>
      <h1>Connect PraxSys to the Epic sandbox</h1>
      <p class="epic-gateway-lead">This separate demonstration uses PraxSys's registered non-production Epic client to perform a real SMART on FHIR authorization against Epic's sandbox.</p>
      ${message?`<div class="epic-message">${message}</div>`:''}
      <div class="epic-proof-grid">
        <div><strong>Environment</strong><span>Epic on FHIR sandbox</span></div>
        <div><strong>FHIR version</strong><span>R4</span></div>
        <div><strong>Application</strong><span>PraxSys</span></div>
        <div><strong>Workflow</strong><span>CLABSI Prevention · Clinician/Observer</span></div>
      </div>
      <div class="button-row"><button class="button primary" id="epicConnectButton">Connect to Epic Sandbox</button></div>
      <p class="epic-gateway-note">You will leave PraxSys briefly for Epic authentication. Epic then redirects back to this registered URL. Only Epic sandbox test data should be used here.</p>
    </div>`;
    $('epicConnectButton').onclick=startStandalone;
  }

  function startStandalone(){
    renderGateway('Redirecting to Epic for authorization…');
    FHIR.oauth2.authorize({
      clientId: CONFIG.clientId,
      iss: CONFIG.sandboxFhirBase,
      scope: CONFIG.standaloneScope,
      redirectUri: CONFIG.redirectUri,
      pkceMode: 'ifSupported'
    });
  }

  function startEhrLaunch(){
    renderGateway('Epic launch context received. Redirecting to Epic authorization…');
    FHIR.oauth2.authorize({
      clientId: CONFIG.clientId,
      scope: CONFIG.ehrLaunchScope,
      redirectUri: CONFIG.redirectUri,
      pkceMode: 'ifSupported'
    });
  }

  async function loadEpicContext(client){
    const state=client.state||{};
    const patientId=(client.patient&&client.patient.id) || state.tokenResponse?.patient || null;
    const encounterId=(client.encounter&&client.encounter.id) || state.tokenResponse?.encounter || null;
    let patient=null, encounter=null, lda=null, ldaError=null;
    if(patientId){
      patient=await client.request(`Patient/${encodeURIComponent(patientId)}`);
    }
    if(encounterId){
      try{ encounter=await client.request(`Encounter/${encodeURIComponent(encounterId)}`); }catch(e){ /* encounter context is optional */ }
    }
    // LDA API is registered. The exact search shape/data available depends on sandbox data and Epic API requirements.
    // Attempt a patient-scoped search and surface any API response/error transparently rather than fabricating LDA values.
    if(patientId){
      try{ lda=await client.request(`Observation?patient=${encodeURIComponent(patientId)}&category=LDA`); }
      catch(e){ ldaError=e && e.message ? e.message : String(e); }
    }
    const ctx={
      connected:true,
      connectedAt:new Date().toISOString(),
      fhirBase:state.serverUrl || CONFIG.sandboxFhirBase,
      patientId, encounterId,
      patient, encounter, lda, ldaError,
      patientName:patientName(patient),
      mrn:patientMrn(patient),
      birthDate:patient&&patient.birthDate,
      age:ageFromBirthDate(patient&&patient.birthDate),
      sex:patient&&patient.gender,
      encounterLabel:encounterLabel(encounter),
      location:encounterLocation(encounter),
      rawPatient:patient
    };
    window.PRAXSYS_EPIC_CONTEXT=ctx;
    return ctx;
  }

  function updateHeader(ctx){
    const b=$('ehrStatusButton'); if(!b) return;
    b.innerHTML='<span class="ehr-dot"></span>Epic Sandbox Connected';
    b.classList.add('ehr-live');
    b.onclick=()=>showIntegrationModal(ctx);
  }

  function showIntegrationModal(ctx){
    const em=$('integrationModal'); if(!em) return;
    const dlg=em.querySelector('.integration-dialog');
    dlg.innerHTML=`<button class="integration-close" id="integrationClose" aria-label="Close">×</button>
      <div class="section-label">Live Integration Status</div><h2>Epic Sandbox Connected</h2>
      <p>This session completed SMART on FHIR authorization against Epic's sandbox. Values below are taken from the authenticated FHIR session; they are not the synthetic PraxSys scenario.</p>
      <div class="integration-status-grid">
        <div><strong>FHIR server</strong><span>${text(ctx.fhirBase)}</span></div>
        <div><strong>Patient context</strong><span>${text(ctx.patientId)}</span></div>
        <div><strong>Epic patient</strong><span>${text(ctx.patientName)}</span></div>
        <div><strong>MRN / identifier</strong><span>${text(ctx.mrn)}</span></div>
        <div><strong>Encounter context</strong><span>${text(ctx.encounterId)}</span></div>
        <div><strong>Location</strong><span>${text(ctx.location)}</span></div>
      </div>
      <details class="disclosure"><summary>View Patient FHIR JSON received from Epic</summary><pre class="epic-json">${escapeHtml(JSON.stringify(ctx.rawPatient||{},null,2))}</pre></details>
      <div class="epic-data-note"><strong>LDA API test:</strong> ${ctx.lda ? 'Epic returned an Observation response.' : (ctx.ldaError ? 'No LDA data displayed; API response/error retained for testing.' : 'Not attempted.')}</div>
      <p class="integration-footnote">This proves a live connection to Epic's non-production sandbox. A hospital production deployment would use that organization's Epic endpoint and local configuration.</p>`;
    em.hidden=false;
    $('integrationClose').onclick=()=>em.hidden=true;
  }
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

  function applyContextToPraxSys(ctx){
    // The clinical pathway remains a synthetic CLABSI scenario. Only replace demographics/context that Epic actually returned.
    // This prevents us from pretending hospital-specific CLABSI fields came from the sandbox.
    const p=window.PRAXSYS_PATIENTS && window.PRAXSYS_PATIENTS.john;
    if(!p) return;
    p.name=ctx.patientName||p.name;
    p.mrn=ctx.mrn||p.mrn;
    if(ctx.age!==null && ctx.age!==undefined) p.age=ctx.age;
    if(ctx.location && ctx.location!=='Not returned') { p.unit='Epic location'; p.room=ctx.location; }
    p.encounter=ctx.encounterLabel||p.encounter;
    p.source='Epic sandbox FHIR (live session)';
  }

  function loadPraxSys(ctx){
    document.body.classList.remove('epic-gateway-active');
    const g=$('epicGateway'); if(g) g.hidden=true;
    const s=document.createElement('script');
    s.src='assets/app.86a9de1a1e.v13.js';
    s.onload=()=>{ applyContextToPraxSys(ctx); updateHeader(ctx); };
    document.body.appendChild(s);
  }

  async function resume(){
    renderGateway('Completing Epic authorization and retrieving sandbox data…');
    try{
      const client=await FHIR.oauth2.ready();
      const ctx=await loadEpicContext(client);
      loadPraxSys(ctx);
    }catch(e){
      console.error('Epic SMART authorization error',e);
      renderGateway(`<strong>Epic connection did not complete.</strong><br>${escapeHtml(e&&e.message?e.message:String(e))}<br><br>If the PraxSys app was just changed in Epic, allow time for the sandbox registration to synchronize and try again.`);
    }
  }

  // EHR launch supplies iss + launch. OAuth callback supplies code + state. client-js session state can also survive the redirect.
  if(q.has('iss') && q.has('launch')) startEhrLaunch();
  else if(q.has('code') || q.has('state')) resume();
  else renderGateway('Not connected yet.');

  window.PRAXSYS_EPIC_CONFIG=CONFIG;
})();
