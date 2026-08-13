/* PraxSys confidential review distribution. Unauthorized copying prohibited. */
window.PRAXSYS_PATIENTS = {
  john: {
    id: 'john',
    name: (window.PRAXSYS_EPIC_CONTEXT && window.PRAXSYS_EPIC_CONTEXT.patientName) || 'Epic sandbox patient',
    mrn: (window.PRAXSYS_EPIC_CONTEXT && window.PRAXSYS_EPIC_CONTEXT.mrn) || 'Not returned',
    age: (window.PRAXSYS_EPIC_CONTEXT && window.PRAXSYS_EPIC_CONTEXT.age) ?? '',
    unit: 'Epic encounter',
    room: (window.PRAXSYS_EPIC_CONTEXT && window.PRAXSYS_EPIC_CONTEXT.location !== 'Not returned' && window.PRAXSYS_EPIC_CONTEXT.location) || '',
    encounter: (window.PRAXSYS_EPIC_CONTEXT && window.PRAXSYS_EPIC_CONTEXT.encounterLabel) || 'Not returned',
    provider: 'Dr. Sarah Patel',
    order: 'Insert indwelling urinary catheter',
    indication: 'Acute urinary retention / obstruction',
    detail: 'Bladder volume 850 mL; void trial recommended in 7 days',
    source: 'Epic sandbox FHIR (live session)',
    centralLineOrder: 'Insert central venous catheter',
    centralLineIndication: 'Hemodynamic monitoring / vasoactive medication infusion',
    centralLineType: 'Triple-lumen central venous catheter', centralLineSite: 'Right internal jugular', centralLineInserted: 'Aug 11, 2026 14:32'
  },
  mary: {
    id: 'mary',
    name: 'Mary Johnson',
    mrn: 'MH-208455',
    age: 63,
    unit: 'Med Surg',
    room: '214',
    encounter: 'Inpatient Day 2',
    provider: 'Dr. Michael Chen',
    order: 'Evaluate need for indwelling urinary catheter',
    indication: 'Acute urinary retention',
    detail: 'Post-void residual 640 mL; repeat bladder scan ordered',
    source: 'Epic / FHIR simulated',
    centralLineOrder: 'Insert central venous catheter',
    centralLineIndication: 'Long-term IV therapy / limited peripheral access',
    centralLineType: 'PICC', centralLineSite: 'Left basilic vein', centralLineInserted: 'Aug 10, 2026 09:18'
  }
};

window.PRAXSYS_APPROVED_INDICATIONS = [
  'Acute urinary retention or obstruction',
  'Accurate intake and output in a critically ill inpatient',
  'Chronic catheter',
  'Epidural, labor, or cesarean section',
  'Perioperative use for specified procedures or timeframes',
  'Sacral or perineal wound in an incontinent patient',
  'GI or urologic surgery after collaborative discussion',
  'Comfort care or end-of-life care',
  'Immobilization due to trauma or unstable spine'
];;
window.PRAXSYS_RULES = {
  reviewOrder: function(answer, acknowledged) {
    if (!answer) return { canContinue: false };
    if (!acknowledged) return { canContinue: false };
    return {
      canContinue: true,
      destination: answer === 'yes' ? 'clinicalAssessment' : 'providerDecision'
    };
  },

  clinicalCriteria: function(answer, acknowledged) {
    if (!answer) return { canContinue: false };
    if (answer === 'no' && !acknowledged) return { canContinue: false };
    return {
      canContinue: true,
      destination: answer === 'yes' ? 'handHygiene' : 'providerDecision'
    };
  },

  providerDecision: function(answer, acknowledged) {
    if (!answer || !acknowledged) return { canContinue: false };
    return {
      canContinue: true,
      status: answer === 'proceed' ? 'Provider confirmed insertion' : 'Catheter insertion not proceeding',
      documentation: answer === 'proceed'
        ? 'Document the confirmed indication in the EHR'
        : 'Document the interaction with the ordering provider in the EHR'
    };
  },

  handHygiene: function(answer, acknowledged) {
    if (!answer) return { canContinue: false };
    if (answer === 'no' && !acknowledged) return { canContinue: false };
    return {
      canContinue: true,
      status: answer === 'yes' ? 'Hand hygiene observed' : 'Corrective action acknowledged',
      documentation: answer === 'yes'
        ? 'Continue to the next insertion observation'
        : 'Perform hand hygiene before continuing the insertion procedure'
    };
  }
};;
(function(){
  const observationDefinitions=[
    ['handHygiene','Hand hygiene'],
    ['sterileField','Sterile field established and maintained'],
    ['sterileGloves','Sterile gloves and aseptic technique'],
    ['cleansing','Periurethral cleansing'],
    ['insertion','Insertion without contamination'],
    ['closedSystem','Closed drainage system'],
    ['bagPosition','Drainage bag below bladder'],
    ['tubing','Tubing free of loops and kinks'],
    ['securement','Catheter appropriately secured'],
    ['bagOffFloor','Collection bag off floor'],
    ['documentation','Insertion date and time documented']
  ];
  const indications=[
    'Acute urinary retention or bladder outlet obstruction',
    'Accurate urine output measurement in critically ill patients',
    'Perioperative use for selected surgical procedures',
    'Assistance in healing of open sacral or perineal wounds in incontinent patients',
    'Prolonged immobilization',
    'End-of-life comfort care'
  ];
  const records=[];
  const start=new Date('2026-04-01T09:00:00');
  for(let i=0;i<72;i++){
    const date=new Date(start); date.setDate(date.getDate()+Math.floor(i*1.25));
    const orderReviewed=i%10!==0;
    const criteriaMet=orderReviewed ? i%9!==0 : null;
    const providerReviewRequired=!orderReviewed || criteriaMet===false;
    const providerDecision=providerReviewRequired ? (i%4===0?'Do not proceed':'Proceed') : 'Not required';
    const insertionObserved=!providerReviewRequired;
    const observations={};
    const missedPractices=[];
    if(insertionObserved){
      observationDefinitions.forEach(([id,label],j)=>{
        const missed=((i+j*5)%23===0)||((i%13===0)&&(j===8||j===10));
        observations[id]=missed?'No':'Yes';
        if(missed) missedPractices.push(label);
      });
    }
    const correctiveActions=missedPractices.length;
    const correctiveActionItems=missedPractices.map((element,j)=>{const followUp=((i+j)%3===0);return {element,action:`Corrective action required for: ${element}`,status:followUp?'Requires follow-up':'Completed during observation',identified:date.toISOString().slice(0,10),completed:followUp?'':date.toISOString().slice(0,10)};});
    const observedCount=insertionObserved?observationDefinitions.length:0;
    const expectedObserved=insertionObserved?observedCount-correctiveActions:0;
    const practiceCompliance=insertionObserved?Math.round(expectedObserved/observedCount*100):null;
    const fullCompliance=insertionObserved&&correctiveActions===0;
    let pathwayOutcome;
    if(insertionObserved) pathwayOutcome='Insertion observation complete';
    else if(providerDecision==='Proceed') pathwayOutcome='Provider confirmed insertion';
    else pathwayOutcome='Catheter insertion not proceeding';
    records.push({
      id:`WF-${String(i+1).padStart(4,'0')}`,
      patientId:`DEMO-${String(2001+i).padStart(4,'0')}`,
      date:date.toISOString().slice(0,10),
      indication:indications[i%indications.length],
      orderReviewed,
      criteriaMet,
      providerReviewRequired,
      providerDecision,
      insertionObserved,
      observations,
      missedPractices,
      correctiveActions,
      correctiveActionItems,
      practiceCompliance,
      fullCompliance,
      pathwayOutcome,
      requiredDocumentation:pathwayOutcome==='Provider confirmed insertion'
        ?'Document the confirmed indication in the EHR and restart the pathway.'
        :pathwayOutcome==='Catheter insertion not proceeding'
          ?'Document the interaction with the ordering provider in the EHR.'
          :observations.documentation==='No'
            ?'Complete catheter insertion date and time documentation in the EHR.'
            :'Insertion date and time documented in the EHR.'
    });
  }
  window.PRAXSYS_MANAGER_DATA=records;
  window.PRAXSYS_OBSERVATION_DEFINITIONS=observationDefinitions;
})();;
window.PRAXSYS_FALL_PATIENTS = {
  john: { risk:'High', score:'60', assessment:'Morse Fall Scale', assessedAt:'2026-08-10 07:42', assessmentAvailable:true },
  mary: { risk:'Moderate', score:'45', assessment:'Morse Fall Scale', assessedAt:'2026-08-10 06:55', assessmentAvailable:true }
};

window.PRAXSYS_FALL_STEPS = [
  {id:'fallAssessmentReview',step:1,type:'Display',source:'EHR Pull',question:'Review the most recent fall assessment documented in the EHR.',options:['reviewed','unavailable']},
  {id:'fallPolicyAssessment',step:2,type:'Observation',source:'Observation',question:'Was the fall risk assessment completed according to organizational policy?',options:['yes','no'],action:'Complete or update the fall risk assessment.'},
  {id:'fallNurseValidation',step:3,type:'Decision',source:'Clinical Judgement',question:"Nurse Validation: Does the documented fall risk assessment accurately reflect the patient's current condition?",options:['yes','no'],action:"Reassess the patient's fall risk assessment, update the EHR and individualized interventions."},
  {id:'fallMobilityPlan',step:4,type:'Observation',source:'Observation',question:'Individualized mobility plan documented and implemented?',options:['yes','no'],action:'Complete the mobility assessment and implement the appropriate mobility plan.'},
  {id:'fallMobilityEquipment',step:5,type:'Observation',source:'Observation',question:'Required mobility equipment available and accessible?',options:['yes','no','na'],action:'Ensure appropriate mobility equipment is available before patient mobility.'},
  {id:'fallCognitiveAssessment',step:6,type:'Observation',source:'Observation',question:'Was the Cognitive risk assessment completed according to organizational policy and appropriate interventions implemented when indicated?',options:['yes','no'],action:'Complete cognitive assessment and implement indicated interventions or referrals.'},
  {id:'fallToiletingPlan',step:7,type:'Observation',source:'Observation',question:'Individualized toileting plan implemented when indicated?',options:['yes','no'],action:'Implement or update the toileting plan.'},
  {id:'fallEducation',step:8,type:'Observation',source:'Observation',question:'Patient-specific fall prevention education provided and documented?',options:['yes','no'],action:'Provide education and update the bedside communication tool.'},
  {id:'fallSafetyInterventions',step:9,type:'Observation',source:'Observation',question:'Additional safety interventions implemented when indicated? Telesitter, Companion, Bed/Chair alarm.',options:['yes','no'],action:'Implement the indicated safety intervention according to policy.'},
  {id:'fallHandoff',step:10,type:'Observation',source:'Observation',question:"Fall prevention plan communicated during handoff using the organization's standard communication process? Whiteboard/handoff tool",options:['yes','no'],action:"Update and communicate the patient's individualized fall prevention plan during handoff."},
  {id:'fallEnvironment',step:11,type:'Observation',source:'Observation',question:'Patient environment supports fall prevention (bed low and locked, call light within reach, clutter-free environment, appropriate footwear)?',options:['yes','no'],action:'Correct identified environmental hazards immediately.'}
];

(function(){
  const defs=window.PRAXSYS_FALL_STEPS.slice(1);
  const records=[];
  const start=new Date('2026-05-01T09:00:00');
  for(let i=0;i<64;i++){
    const date=new Date(start); date.setDate(date.getDate()+Math.floor(i*1.4));
    const responses={}; const correctiveActions=[];
    defs.forEach((d,j)=>{
      let answer=((i+j*4)%17===0)?'No':'Yes';
      if(d.id==='fallMobilityEquipment' && i%9===0) answer='N/A';
      responses[d.id]=answer;
      if(answer==='No'){
        const followUp=((i+j)%3===0);
        correctiveActions.push({step:d.step,element:d.question,action:d.action,status:followUp?'Requires follow-up':'Completed during observation',identified:date.toISOString().slice(0,10),completed:followUp?'':date.toISOString().slice(0,10)});
      }
    });
    records.push({id:`FALL-${String(i+1).padStart(4,'0')}`,patientId:`DEMO-${String(3101+i).padStart(4,'0')}`,date:date.toISOString().slice(0,10),risk:i%3===0?'High':'Moderate',assessmentAvailable:i%11!==0,responses,correctiveActions,compliant:correctiveActions.length===0});
  }
  window.PRAXSYS_FALL_MANAGER_DATA=records;
})();

window.PRAXSYS_CAUTI_PREVENTION_STEPS = [
  {id:'preventionIndicationReview',step:1,type:'Display',source:'EHR Pull',question:'Review the currently documented provider indication for the indwelling urinary catheter.',options:['reviewed']},
  {id:'preventionCurrentCriteria',step:2,type:'Decision',source:'Clinical Judgment',question:'After review of the patient’s current condition, does the patient currently meet criteria for continued indwelling urinary catheter use?',options:['io','other','no']},
  {id:'preventionActionTaken',step:3,type:'Decision',source:'Clinical Judgment',question:'Select the action taken.',options:['removed','providerRequested','deferred']},
  {id:'preventionAccurateIO',step:4,type:'Decision',source:'Clinical Judgment',question:'Does the patient continue to require accurate urine output monitoring that cannot be safely or reliably achieved without an indwelling catheter?',options:['yes','no']},
  {id:'preventionClosedSystem',step:5,type:'Observation',source:'Observation',question:'Closed drainage system maintained (no breaks in system)?',options:['yes','no'],action:'Re-establish a closed drainage system and document the maintenance breach.'},
  {id:'preventionBagBelowBladder',step:6,type:'Observation',source:'Observation',question:'Drainage bag positioned below bladder level?',options:['yes','no'],action:'Reposition the drainage bag below the level of the bladder.'},
  {id:'preventionTubing',step:7,type:'Observation',source:'Observation',question:'Tubing free of dependent loops and kinks?',options:['yes','no'],action:'Reposition tubing to eliminate dependent loops and promote unobstructed urine flow.'},
  {id:'preventionSecurement',step:8,type:'Observation',source:'Observation',question:'Catheter appropriately secured and free from tension or traction?',options:['yes','no'],action:'Apply or reposition the securement device to eliminate tension or traction on the catheter.'},
  {id:'preventionPerinealCare',step:9,type:'Observation',source:'Observation',question:'Perineal care performed per policy and as indicated?',options:['yes','no'],action:'Perform perineal care per policy.'},
  {id:'preventionBagOffFloor',step:10,type:'Observation',source:'Observation',question:'Collection bag not resting on floor?',options:['yes','no'],action:'Reposition the collection bag off the floor and below the level of the bladder.'},
  {id:'preventionInsertionDocumentation',step:11,type:'Auto Pull',source:'EHR Pull',question:'Date and time of catheter insertion documented in the EHR?',options:['yes','no'],action:'Complete catheter insertion documentation in the EHR, including date and time of insertion.'},
  {id:'preventionNecessityReassessment',step:12,type:'Auto Pull',source:'EHR Pull',question:'Date and time of the last catheter necessity reassessment documented per policy?',options:['yes','no'],action:'Document catheter necessity reassessment in the EHR per policy.'}
];


(function(){
  const maintenanceSteps=(window.PRAXSYS_CAUTI_PREVENTION_STEPS||[]).filter(d=>d.step>=5);
  const indications=[
    'Accurate intake and output in a critically ill inpatient',
    'Acute urinary retention or obstruction',
    'Perioperative use for specified procedures or timeframes',
    'Sacral or perineal wound in an incontinent patient',
    'Comfort care or end-of-life care'
  ];
  const records=[];
  const start=new Date('2026-05-01T08:00:00');
  for(let i=0;i<72;i++){
    const date=new Date(start); date.setDate(date.getDate()+Math.floor(i*1.25));
    const indication=indications[i%indications.length];
    let currentCriteria,actionTaken='Not required',accurateIO='Not applicable',reachedMaintenance=false,pathwayOutcome;
    if(i%7===0){
      currentCriteria='No longer meets criteria';
      const branch=i%3;
      if(branch===0){actionTaken='Removed under nurse-driven protocol';pathwayOutcome='Catheter removed under nurse-driven protocol';}
      else if(branch===1){actionTaken='Provider notified / removal requested';pathwayOutcome='Provider notified and removal requested';}
      else{actionTaken='Removal deferred for clinical concern; provider notified';pathwayOutcome='Removal deferred; continued prevention review';reachedMaintenance=true;}
    }else if(i%4===0){
      currentCriteria='Accurate I&O monitoring';
      accurateIO=(i%8===0)?'No':'Yes';
      if(accurateIO==='Yes'){pathwayOutcome='Accurate I&O need validated; continued prevention review';reachedMaintenance=true;}
      else{pathwayOutcome='Accurate I&O not supported; provider notified / removal requested';}
    }else{
      currentCriteria='Other appropriate indication';
      pathwayOutcome='Other appropriate indication validated; continued prevention review';
      reachedMaintenance=true;
    }
    const responses={}; const correctiveActions=[];
    if(reachedMaintenance){
      maintenanceSteps.forEach((d,j)=>{
        const missed=((i+j*6)%29===0)||((i%17===0)&&(j===2||j===7));
        const answer=missed?'No':'Yes';
        responses[d.id]=answer;
        if(missed){const followUp=((i+j)%3===0);correctiveActions.push({step:d.step,element:d.question,action:d.action,status:followUp?'Requires follow-up':'Completed during observation',identified:date.toISOString().slice(0,10),completed:followUp?'':date.toISOString().slice(0,10)});}
      });
    }
    records.push({
      id:`PREV-${String(i+1).padStart(4,'0')}`,
      patientId:`DEMO-${String(4101+i).padStart(4,'0')}`,
      date:date.toISOString().slice(0,10),
      documentedIndication:indication,
      currentCriteria,
      actionTaken,
      accurateIO,
      reachedMaintenance,
      pathwayOutcome,
      responses,
      correctiveActions,
      fullCompliance:reachedMaintenance&&correctiveActions.length===0
    });
  }
  window.PRAXSYS_CAUTI_PREVENTION_MANAGER_DATA=records;
})();

window.PRAXSYS_CLABSI_PREVENTION_STEPS = [
  {id:'clabsiPreventionOrder',step:1,type:'Display',source:'EHR',question:'Current central line order and documented indication',options:['reviewed']},
  {id:'clabsiPreventionNecessity',step:2,type:'Decision',source:'Clinical Judgement',question:"Nurse Validation: Based on the patient's current clinical condition, is central venous access still clinically necessary?",options:['yes','no'],action:'Initiate discussion with the provider regarding prompt removal of the central line.'},
  {id:'clabsiPreventionSite',step:3,type:'Observation',source:'Direct Observation / Clinical Assessment',question:'Is the central line insertion site free from signs of infection or other complications? Assess for: redness/erythema, drainage, tenderness, swelling, bleeding, or other concerning changes.',options:['yes','no'],action:'Assess the site and escalate findings for clinical evaluation and appropriate intervention.'},
  {id:'clabsiPreventionDressing',step:4,type:'Observation',source:'Direct Observation',question:'Is the central line dressing clean, dry, intact, and appropriately secured?',options:['yes','no'],action:'Replace the dressing using aseptic technique according to policy and product instructions.'},
  {id:'clabsiPreventionDressingInterval',step:5,type:'Validation',source:'EHR / Dressing Label / Direct Observation',question:'Is the central line dressing within the recommended replacement interval?',options:['yes','no','unable'],action:'Verify dressing-change history and replace the dressing when indicated according to policy.'},
  {id:'clabsiPreventionHub',step:6,type:'Observation',source:'Direct Observation',question:'Were catheter hubs, needleless connectors, and injection ports disinfected before each observed access?',options:['yes','no','notObserved'],action:'Stop access and disinfect the hub/connector using the approved antiseptic and required technique before proceeding.'},
  {id:'clabsiPreventionAseptic',step:7,type:'Observation',source:'Direct Observation',question:'Was aseptic technique maintained during all observed central line access or manipulation?',options:['yes','no','notObserved'],action:'Stop the manipulation, correct the break in aseptic technique, and replace contaminated supplies/components as indicated before proceeding.'},
  {id:'clabsiPreventionCHG',step:8,type:'Validation/Observation',source:'EHR / Patient Care Documentation / Clinical Validation',question:"Is prescribed chlorhexidine bathing being completed according to the patient's applicable prevention plan?",options:['yes','no','na'],action:'Complete CHG bathing when clinically appropriate and reinforce the prescribed prevention plan.'},
  {id:'clabsiPreventionComponents',step:9,type:'Observation',source:'EHR / Direct Observation',question:'Are administration sets, tubing, connectors, and associated line components being managed within recommended replacement intervals and according to current policy?',options:['yes','no','unable'],action:'Verify replacement history and replace components when indicated according to policy and manufacturer instructions.'}
];

(function(){
  const defs=window.PRAXSYS_CLABSI_PREVENTION_STEPS.slice(2);
  const records=[]; const start=new Date('2026-05-01T08:00:00');
  for(let i=0;i<54;i++){
    const date=new Date(start); date.setDate(date.getDate()+Math.floor(i*1.6));
    const necessary=i%9!==0;
    const responses={}; const correctiveActions=[];
    if(necessary){
      defs.forEach((d,j)=>{
        let answer='Yes';
        if(d.step===5 && i%11===0) answer='Unable to Determine';
        else if((d.step===6||d.step===7) && i%8===0) answer='Not Observed';
        else if(d.step===8 && i%7===0) answer='Not Applicable';
        else if(d.step===9 && i%13===0) answer='Unable to Determine';
        else if((i+j*5)%23===0) answer='No';
        responses[d.id]=answer;
        if(answer==='No'||answer==='Unable to Determine'){
          const follow=((i+j)%3===0);
          correctiveActions.push({step:d.step,element:d.question,action:d.action,status:follow?'Requires follow-up':'Completed during observation',identified:date.toISOString().slice(0,10)});
        }
      });
    } else {
      correctiveActions.push({step:2,element:window.PRAXSYS_CLABSI_PREVENTION_STEPS[1].question,action:window.PRAXSYS_CLABSI_PREVENTION_STEPS[1].action,status:(i%2===0?'Requires follow-up':'Completed during observation'),identified:date.toISOString().slice(0,10)});
    }
    records.push({id:`CLP-${String(i+1).padStart(4,'0')}`,patientId:`DEMO-${String(5101+i).padStart(4,'0')}`,date:date.toISOString().slice(0,10),indication:['Vasoactive medication infusion','Hemodynamic monitoring','Long-term IV therapy','Limited peripheral access'][i%4],necessary,reachedMaintenance:necessary,responses,correctiveActions,fullCompliance:necessary&&correctiveActions.length===0,pathwayOutcome:necessary?'Central venous access remains necessary; prevention review complete':'Central venous access no longer appears necessary; provider discussion initiated'});
  }
  window.PRAXSYS_CLABSI_PREVENTION_MANAGER_DATA=records;
})();

window.PRAXSYS_CLABSI_INSERTION_STEPS = [
  {id:'clabsiOrder',step:1,type:'Display',source:'EHR',question:'Review the current central line insertion order and documented indication.',options:['reviewed']},
  {id:'clabsiIndication',step:2,type:'Decision',source:'Clinical Judgement',question:"Nurse Validation: Based on the patient's current clinical condition, is the documented indication for central venous access clinically appropriate?",options:['yes','no'],action:'Pause insertion and escalate to the provider to review the indication and determine the most appropriate vascular access strategy.'},
  {id:'clabsiHandHygiene',step:3,type:'Observation',source:'Observation',question:'Hand hygiene was performed immediately before central line insertion.',options:['yes','no'],action:'Perform hand hygiene before proceeding with central line insertion.'},
  {id:'clabsiBarrier',step:4,type:'Observation',source:'Observation',question:'Maximal sterile barrier precautions were used during central line insertion. Maximal sterile barrier includes: cap, mask, sterile gown, sterile gloves, and full-body sterile drape.',options:['yes','no'],action:'Stop the procedure and establish maximal sterile barrier precautions before proceeding.'},
  {id:'clabsiAntisepsis',step:5,type:'Observation',source:'Observation',question:'The insertion site was prepared using the recommended chlorhexidine-alcohol antiseptic or an appropriate alternative when contraindicated.',options:['yes','no'],action:'Stop and perform appropriate skin antisepsis before proceeding.'},
  {id:'clabsiDrying',step:6,type:'Observation',source:'Observation',question:'The skin antiseptic was allowed to fully dry before insertion.',options:['yes','no'],action:'Stop and allow the antiseptic to fully dry before proceeding.'},
  {id:'clabsiAseptic',step:7,type:'Observation',source:'Observation',question:'Aseptic technique was maintained and the sterile field remained uncompromised throughout the insertion procedure.',options:['yes','no'],action:'Stop the procedure. Replace contaminated supplies/equipment and re-establish the sterile field before proceeding.'},
  {id:'clabsiSite',step:8,type:'Validation',source:'Clinical Judgement',question:"Was the insertion site selected to minimize infection risk while considering the patient's clinical needs?",options:['yes','no'],action:'Validate site selection and clinical rationale with the inserting clinician before proceeding.'},
  {id:'clabsiDressing',step:9,type:'Observation',source:'Observation',question:'A sterile dressing was applied to the central line insertion site using aseptic technique.',options:['yes','no'],action:'Apply an appropriate sterile dressing using aseptic technique.'},
  {id:'clabsiDocumentation',step:10,type:'Validation',source:'EHR / Validation',question:'Documentation was completed per policy in EHR.',options:['yes','no'],action:'Complete insertion documentation in the EHR, including date and time of insertion.'}
];
(function(){
  const defs=window.PRAXSYS_CLABSI_INSERTION_STEPS.slice(2);
  const records=[]; const start=new Date('2026-05-01T08:00:00');
  for(let i=0;i<48;i++){
    const date=new Date(start); date.setDate(date.getDate()+Math.floor(i*1.8));
    const indicationAppropriate=i%8!==0;
    const providerReviewRequired=!indicationAppropriate;
    const providerOutcome=providerReviewRequired?(i%3===0?'Appropriate indication not confirmed':'Appropriate indication confirmed/documented'):'Not required';
    const insertionObserved=indicationAppropriate||providerOutcome==='Appropriate indication confirmed/documented';
    const correctiveActions=[]; const observations={};
    if(insertionObserved){
      defs.forEach((d,j)=>{const missed=((i+j*4)%19===0)||((i%17===0)&&(j===4)); observations[d.id]=missed?'No':'Yes'; if(missed) correctiveActions.push({step:d.step,element:d.question,action:d.action,status:((i+j)%4===0?'Requires follow-up':'Completed during observation'),identified:date.toISOString().slice(0,10)});});
    }
    records.push({id:`CL-${String(i+1).padStart(4,'0')}`,patientId:`DEMO-${String(3101+i).padStart(4,'0')}`,date:date.toISOString().slice(0,10),indication:['Vasoactive medication infusion','Hemodynamic monitoring','Long-term IV therapy','Limited peripheral access'][i%4],indicationAppropriate,providerReviewRequired,providerOutcome,insertionObserved,observations,correctiveActions,fullCompliance:insertionObserved&&correctiveActions.length===0,pathwayOutcome:!insertionObserved?'Insertion did not proceed':providerReviewRequired?'Insertion proceeded after provider clarification':'Insertion observation complete'});
  }
  window.PRAXSYS_CLABSI_MANAGER_DATA=records;
})();

(function () {
  const app = document.getElementById('app');

  const observations = [
    { id:'handHygiene', section:'Insertion preparation', question:'Was hand hygiene performed before catheter insertion?', yesNext:'sterileField', noNext:'sterileField', noAction:'Perform hand hygiene before catheter insertion.', ack:'I acknowledge the corrective action and will perform hand hygiene before continuing.' },
    { id:'sterileField', section:'Sterile field', question:'Was a sterile field established and maintained?', yesNext:'sterileGloves', noNext:'handHygiene', breach:true },
    { id:'sterileGloves', section:'Aseptic technique', question:'Were sterile gloves used and aseptic technique maintained?', yesNext:'cleansing', noNext:'handHygiene', breach:true },
    { id:'cleansing', section:'Patient preparation', question:'Was periurethral cleansing completed immediately before catheter insertion using aseptic technique?', yesNext:'insertion', noNext:'handHygiene', breach:true },
    { id:'insertion', section:'Catheter insertion', question:'Was the catheter inserted without contamination?', yesNext:'closedSystem', noNext:'handHygiene', breach:true },
    { id:'closedSystem', section:'Drainage system', question:'Was a closed drainage system established immediately after catheter insertion?', yesNext:'bagPosition', noNext:'bagPosition', noAction:'Re-establish a closed drainage system and document the breach.', ack:'I acknowledge the corrective action and required documentation.' },
    { id:'bagPosition', section:'Drainage bag', question:'Is the drainage bag positioned below bladder level?', yesNext:'tubing', noNext:'tubing', noAction:'Reposition the drainage bag below the level of the bladder.', ack:'I acknowledge the corrective action and will reposition the drainage bag.' },
    { id:'tubing', section:'Tubing', question:'Is the tubing free of dependent loops and kinks?', yesNext:'securement', noNext:'securement', noAction:'Reposition the tubing to eliminate dependent loops and promote unobstructed urine flow.', ack:'I acknowledge the corrective action and will reposition the tubing.' },
    { id:'securement', section:'Catheter securement', question:'Is the catheter appropriately secured and free from tension or traction?', yesNext:'bagOffFloor', noNext:'bagOffFloor', noAction:'Apply or reposition the securement device to eliminate tension or traction on the catheter.', ack:'I acknowledge the corrective action and will correct catheter securement.' },
    { id:'bagOffFloor', section:'Collection bag', question:'Is the collection bag off the floor?', yesNext:'documentation', noNext:'documentation', noAction:'Reposition the collection bag off the floor and below the level of the bladder.', ack:'I acknowledge the corrective action and will reposition the collection bag.' },
    { id:'documentation', section:'EHR documentation', question:'Are the date and time of catheter insertion documented in the EHR?', yesNext:'complete', noNext:'complete', noAction:'Complete catheter insertion documentation in the EHR, including the date and time of insertion.', ack:'I acknowledge that the catheter insertion date and time must be documented in the EHR.' }
  ];
  const observationMap = Object.fromEntries(observations.map(o => [o.id,o]));

  const state = {
    view:'patients', role:'Clinician', patientId:'john', reviewAnswer:null, reviewAck:false,
    criteriaAnswer:null, criteriaAck:false, providerAnswer:null, providerAck:false,
    providerOrigin:'reviewOrder', currentObservation:'handHygiene', observationAnswer:null,
    observationAck:false, results:[], completion:null,
    managerFilters:{month:'All',order:'All',criteria:'All',outcome:'All',indication:'All'}, managerPreventionFilters:{month:'All',criteria:'All',outcome:'All',indication:'All'}, managerReport:'overview', managerSelected:null, managerDomain:'CAUTI', managerCautiPathway:'INSERTION', managerClabsiPathway:'INSERTION', fallStep:0, fallAnswer:null, fallActionStatus:null, fallResults:[], fallCompletion:null,
    preventionStep:0, preventionAnswer:null, preventionAck:false, preventionConcern:'', preventionHistory:[], preventionResults:[], preventionCompletion:null,
    clabsiStep:0, clabsiAnswer:null, clabsiAck:false, clabsiActionStatus:null, clabsiProviderOutcome:null, clabsiHistory:[], clabsiResults:[], clabsiCompletion:null, clabsiPreventionStep:0, clabsiPreventionAnswer:null, clabsiPreventionAck:false, clabsiPreventionActionStatus:null, clabsiPreventionHistory:[], clabsiPreventionResults:[], clabsiPreventionCompletion:null
  };
  const patient = () => window.PRAXSYS_PATIENTS[state.patientId];

  function patientHeader() {
    const p=patient();
    return `<div class="patient-strip">
      <div class="patient-cell"><div class="patient-label">Patient</div><div class="patient-value">${p.name}</div></div>
      <div class="patient-cell"><div class="patient-label">MRN</div><div class="patient-value">${p.mrn}</div></div>
      <div class="patient-cell"><div class="patient-label">Location</div><div class="patient-value">${p.unit} ${p.room}</div></div>
      <div class="patient-cell"><div class="patient-label">Encounter</div><div class="patient-value">${p.encounter}</div></div>
    </div>`;
  }
  function shell(main, side='') { return `${patientHeader()}<div class="screen-grid"><div>${main}</div><aside class="stack">${side}</aside></div>`; }

  function reviewScreenIdentity() {
    const patientPart = state.patientId ? `:${state.patientId}` : '';
    if (state.view === 'observation') {
      const o = observationMap[state.currentObservation];
      return { key:`observation:${state.currentObservation}${patientPart}`, label:`${o.section} — ${o.question}` };
    }
    if (state.view === 'providerDecision') {
      return { key:`providerDecision:${state.providerOrigin}${patientPart}`, label:'Provider discussion — Clinical decision' };
    }
    if (state.view === 'manager') {
      return { key:`manager:${state.managerDomain}:${state.managerDomain==='CAUTI'?state.managerCautiPathway:(state.managerDomain==='CLABSI'?state.managerClabsiPathway:state.managerDomain)}:${state.managerReport}`, label:`Manager dashboard — ${state.managerDomain}${state.managerDomain==='CAUTI'?' — '+state.managerCautiPathway:(state.managerDomain==='CLABSI'?' — '+state.managerClabsiPathway:'')} — ${state.managerReport}` };
    }
    if (state.view === 'fallHome') return {key:`fallHome${patientPart}`,label:'Fall Prevention — Prevention Observation'};
    if (state.view === 'fallObservation') { const f=window.PRAXSYS_FALL_STEPS[state.fallStep]; return {key:`fall:${f.id}${patientPart}`,label:`Fall Prevention — Step ${f.step}`}; }
    if (state.view === 'fallCompletion') return {key:`fallCompletion${patientPart}`,label:'Fall Prevention — Observation complete'};
    if (state.view === 'cautiPathwaySelect') return {key:`cautiPathwaySelect${patientPart}`,label:'CAUTI — Select pathway'};
    if (state.view === 'preventionHome') return {key:`preventionHome${patientPart}`,label:'CAUTI Prevention Pathway'};
    if (state.view === 'preventionObservation') { const f=window.PRAXSYS_CAUTI_PREVENTION_STEPS[state.preventionStep]; return {key:`cautiPrevention:${f.id}${patientPart}`,label:`CAUTI Prevention — Step ${f.step}`}; }
    if (state.view === 'preventionCompletion') return {key:`preventionCompletion${patientPart}`,label:'CAUTI Prevention — Pathway complete'};
    if (state.view === 'clabsiPathwaySelect') return {key:`clabsiPathwaySelect${patientPart}`,label:'CLABSI — Select pathway'};
    if (state.view === 'clabsiHome') return {key:`clabsiHome${patientPart}`,label:'CLABSI Insertion Pathway'};
    if (state.view === 'clabsiObservation') { const f=window.PRAXSYS_CLABSI_INSERTION_STEPS[state.clabsiStep]; return {key:`clabsiInsertion:${f.id}${patientPart}`,label:`CLABSI Insertion — Step ${f.step}`}; }
    if (state.view === 'clabsiCompletion') return {key:`clabsiCompletion${patientPart}`,label:'CLABSI Insertion — Pathway complete'};
    if (state.view === 'clabsiPreventionHome') return {key:`clabsiPreventionHome${patientPart}`,label:'CLABSI Prevention Pathway'};
    if (state.view === 'clabsiPreventionObservation') { const f=window.PRAXSYS_CLABSI_PREVENTION_STEPS[state.clabsiPreventionStep]; return {key:`clabsiPrevention:${f.id}${patientPart}`,label:`CLABSI Prevention — Step ${f.step}`}; }
    if (state.view === 'clabsiPreventionCompletion') return {key:`clabsiPreventionCompletion${patientPart}`,label:'CLABSI Prevention — Pathway complete'};
    const labels={
      role:'Workspace selection', patients:'Select a patient', conditions:'Select a patient safety condition',
      pathwayHome:'CAUTI prevention — Foley catheter insertion observation',
      reviewOrder:'Provider order review', clinicalAssessment:'Current patient assessment',
      completion:'Pathway completion'
    };
    return { key:`${state.view}${patientPart}`, label:labels[state.view]||state.view };
  }

  function render() {
    const renderers={role:renderRole,patients:renderPatients,conditions:renderConditions,cautiPathwaySelect:renderCautiPathwaySelect,pathwayHome:renderPathwayHome,preventionHome:renderPreventionHome,preventionObservation:renderPreventionObservation,preventionCompletion:renderPreventionCompletion,clabsiPathwaySelect:renderClabsiPathwaySelect,clabsiHome:renderClabsiHome,clabsiObservation:renderClabsiObservation,clabsiCompletion:renderClabsiCompletion,clabsiPreventionHome:renderClabsiPreventionHome,clabsiPreventionObservation:renderClabsiPreventionObservation,clabsiPreventionCompletion:renderClabsiPreventionCompletion,reviewOrder:renderReviewOrder,clinicalAssessment:renderClinicalAssessment,providerDecision:renderProviderDecision,observation:renderObservation,completion:renderCompletion,manager:renderManager,fallHome:renderFallHome,fallObservation:renderFallObservation,fallCompletion:renderFallCompletion};
    const reviewIdentity=reviewScreenIdentity();
    app.dataset.reviewScreenKey=reviewIdentity.key;
    app.dataset.reviewScreenLabel=reviewIdentity.label;
    app.innerHTML=renderers[state.view](); bind();
    // Directly switch reviewer-note context after every application render.
    // This avoids relying on DOM heuristics or event timing.
    if(window.PraxSysReviewerNotes&&typeof window.PraxSysReviewerNotes.switchScreen==='function'){
      window.PraxSysReviewerNotes.switchScreen(reviewIdentity);
    }
    window.dispatchEvent(new CustomEvent('praxsys:screenchange',{detail:reviewIdentity}));
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function renderRole(){return `<div class="card"><div class="section-label">Workspace selection</div><h1 class="card-title">Choose how you are using PraxSys</h1><div class="card-subtitle">The application presents different workflows for bedside observers and nursing leaders.</div></div><div class="tile-grid"><button class="tile ${state.role==='Clinician'?'selected':''}" data-role="Clinician"><h3>Clinician</h3><p>Review patient context, validate clinical criteria, and document insertion observations.</p></button><button class="tile ${state.role==='Manager'?'selected':''}" data-role="Manager"><h3>Manager</h3><p>Review quality trends, open events, and catheter insertion compliance.</p></button></div><div class="button-row"><button class="button primary" id="continueRole">Continue</button></div>`;}

  function epicLdaEntries(){const ctx=window.PRAXSYS_EPIC_CONTEXT||{};return (ctx.lda&&ctx.lda.entry)||[];}
  function epicCodeLabel(resource){const c=resource&&resource.code;if(!c)return 'Observation returned';return c.text||((c.coding||[])[0]&&((c.coding||[])[0].display||(c.coding||[])[0].code))||'Observation returned';}
  function epicObservationValue(resource){if(!resource)return 'Not returned';const keys=['valueString','valueDateTime','valueDate','valueInteger','valueDecimal','valueBoolean'];for(const k of keys){if(resource[k]!==undefined&&resource[k]!==null)return String(resource[k]);}if(resource.valueCodeableConcept){return resource.valueCodeableConcept.text||((resource.valueCodeableConcept.coding||[])[0]&&((resource.valueCodeableConcept.coding||[])[0].display||(resource.valueCodeableConcept.coding||[])[0].code))||'Codeable value returned';}if(resource.valueQuantity){return [resource.valueQuantity.value,resource.valueQuantity.unit].filter(x=>x!==undefined&&x!==null&&x!=='').join(' ')||'Quantity returned';}return 'See Epic LDA JSON';}
  function epicLdaSummary(){const entries=epicLdaEntries();if(!entries.length)return '';const r=entries[0].resource||{};const when=r.effectiveDateTime||r.issued||(r.effectivePeriod&&r.effectivePeriod.start)||'';return `<div class="ehr-panel" style="margin-top:14px"><div class="section-label">Epic sandbox LDA data · live</div><div class="ehr-grid"><div class="data-cell"><div class="data-label">Observation</div><div class="data-value">${epicCodeLabel(r)}</div><div class="mapping-tag verified">Epic sandbox data</div></div><div class="data-cell"><div class="data-label">Value</div><div class="data-value">${epicObservationValue(r)}</div><div class="mapping-tag verified">Epic sandbox data</div></div><div class="data-cell"><div class="data-label">Effective / issued</div><div class="data-value">${when||'Not returned'}</div><div class="mapping-tag verified">Epic sandbox data</div></div><div class="data-cell"><div class="data-label">FHIR Observation ID</div><div class="data-value">${r.id||'Not returned'}</div><div class="mapping-tag verified">Epic sandbox data</div></div></div><div class="button-row"><button class="button" id="viewEpicLdaData" type="button">View Epic LDA Data</button></div></div>`;}
  function renderPatients(){const p=window.PRAXSYS_PATIENTS.john;const ctx=window.PRAXSYS_EPIC_CONTEXT||{};const ldaEntries=epicLdaEntries();const ldaText=ldaEntries.length?`${ldaEntries.length} LDA observation${ldaEntries.length===1?'':'s'} returned`:'No LDA observations returned for this Epic sandbox patient';const encounterText=ctx.encounterId?'Encounter context returned':'Encounter was selected in Epic but was not supplied in the SMART token';return `<div class="card"><div class="section-label">PraxSys Epic Integration Demo</div><h1 class="card-title">Epic patient context for CLABSI Prevention</h1><div class="card-subtitle">Demonstration Medical Center · Clinician/Observer workflow. Patient demographics and available clinical context below come from the authenticated Epic sandbox session.</div></div><div class="tile-grid"><button class="tile" data-patient="john"><h3>${p.name}</h3><p>${p.mrn}${p.age!==''?` · ${p.age} years`:''}${p.room?` · ${p.room}`:''}</p><span class="source-pill">Epic sandbox FHIR · live</span><span class="source-pill">${ldaText}</span></button></div><div class="card" style="margin-top:14px"><div class="section-label">Data provenance</div><div class="card-subtitle">Epic-sourced values are displayed only when returned by Epic. ${encounterText}. CLABSI pathway values not returned by the sandbox remain explicitly labeled as demonstration values.</div>${ldaEntries.length?`<div class="button-row"><button class="button" id="viewEpicLdaData" type="button">View Epic LDA Data</button></div>`:''}</div>`;}

  function renderConditions(){return shell(`<button class="back-link" data-back="patients">← Back</button><div class="card"><div class="section-label">Clinical focus</div><h1 class="card-title">Select a patient safety condition</h1></div><div class="tile-grid"><button class="tile" data-condition="CAUTI"><h3>CAUTI</h3><p>Catheter-associated urinary tract infection prevention and insertion observation.</p></button><button class="tile" data-condition="CLABSI"><h3>CLABSI</h3><p>Central line-associated bloodstream infection.</p></button><button class="tile" data-condition="FALLS"><h3>Falls</h3><p>Fall prevention observation and corrective action follow-up.</p></button><button class="tile"><h3>Pressure Injury</h3><p>Skin integrity and pressure injury prevention.</p></button></div>`,`<div class="card"><div class="section-label">Selected patient</div><h2 class="card-title">${patient().name}</h2><div class="card-subtitle">${patient().unit} ${patient().room}<br>${patient().encounter}</div></div>`);}

  function renderCautiPathwaySelect(){return shell(`<button class="back-link" data-back="conditions">← Back</button><div class="card"><div class="section-label">CAUTI</div><h1 class="card-title">Select a CAUTI pathway</h1><div class="card-subtitle">Choose the clinical workflow that matches the observation being performed.</div></div><div class="tile-grid"><button class="tile" data-cauti-pathway="insertion"><h3>CAUTI Insertion Pathway</h3><p>Review catheter insertion criteria and observe the insertion procedure from preparation through EHR documentation.</p></button><button class="tile" data-cauti-pathway="prevention"><h3>CAUTI Prevention Pathway</h3><p>Review continued catheter necessity and ongoing practices intended to prevent catheter-associated urinary tract infection.</p></button></div>`,`<div class="card"><div class="section-label">Selected patient</div><h2 class="card-title" style="font-size:21px">${patient().name}</h2><div class="card-subtitle">${patient().indication}<br>${patient().detail}</div></div>`);}

  function renderPathwayHome(){return shell(`<button class="back-link" data-back="cautiPathwaySelect">← Back</button><div class="card"><div class="section-label">CAUTI prevention</div><h1 class="card-title">Foley catheter insertion observation</h1><div class="card-subtitle">Review the provider order, validate current clinical criteria, and observe insertion practices from preparation through EHR documentation.</div><div class="button-row"><button class="button primary" id="startPathway">Begin clinical review</button></div></div>`,`<div class="card"><div class="section-label">Data sources</div><span class="source-pill">EHR pull</span><span class="source-pill">Clinical judgment</span><span class="source-pill">Observation</span></div>`);}

  function renderPreventionHome(){return shell(`<button class="back-link" data-back="cautiPathwaySelect">← Back</button><div class="card"><div class="section-label">CAUTI Prevention Pathway</div><h1 class="card-title">Indwelling urinary catheter prevention observation</h1><div class="card-subtitle">Review the documented indication, validate continued catheter necessity, and observe ongoing catheter-care practices.</div><div class="button-row"><button class="button primary" id="startPreventionPathway">Begin prevention review</button></div></div>`,`<div class="card"><div class="section-label">Data sources</div><span class="source-pill">EHR pull</span><span class="source-pill">Clinical judgment</span><span class="source-pill">Observation</span></div>`);}

  function preventionStep(){return window.PRAXSYS_CAUTI_PREVENTION_STEPS[state.preventionStep];}
  function preventionEhrPanel(){const p=patient();return `<div class="ehr-panel"><div class="section-label">Information from the EHR</div><h2 class="card-title" style="font-size:21px">Current catheter indication</h2><div class="ehr-grid"><div class="data-cell"><div class="data-label">Documented indication</div><div class="data-value">${p.indication}</div></div><div class="data-cell"><div class="data-label">Clinical detail</div><div class="data-value">${p.detail}</div></div><div class="data-cell"><div class="data-label">Provider</div><div class="data-value">${p.provider}</div></div><div class="data-cell"><div class="data-label">Source</div><div class="data-value">EHR Pull</div></div></div></div>`;}
  function renderPreventionObservation(){const f=preventionStep();let context=f.step===1?preventionEhrPanel():'';let buttons='';let panel='';let can=false;
    if(f.step===1){buttons=`<button class="decision yes ${state.preventionAnswer==='reviewed'?'active':''}" data-prevention-answer="reviewed">I acknowledge that I reviewed the documented indication.</button>`;can=state.preventionAnswer==='reviewed';}
    else if(f.step===2){buttons=`<button class="decision yes ${state.preventionAnswer==='io'?'active':''}" data-prevention-answer="io">Yes — Accurate I&amp;O monitoring (critically ill patient)</button><button class="decision yes ${state.preventionAnswer==='other'?'active':''}" data-prevention-answer="other">Yes — Catheter remains clinically indicated for another appropriate indication</button><button class="decision no ${state.preventionAnswer==='no'?'active':''}" data-prevention-answer="no">No — Catheter no longer meets criteria for continued use</button>`;if(state.preventionAnswer==='no')panel=`<div class="inline-action danger"><strong>Consider appropriate alternatives.</strong> Examples may include a toileting program, bedside commode, urinal, bedpan, external urinary device, intermittent catheterization when clinically appropriate, or early mobility.</div>`;can=!!state.preventionAnswer;}
    else if(f.step===3){buttons=`<button class="decision yes ${state.preventionAnswer==='removed'?'active':''}" data-prevention-answer="removed">Catheter removed per nurse-driven removal protocol</button><button class="decision ${state.preventionAnswer==='providerRequested'?'active':''}" data-prevention-answer="providerRequested">Provider notified and catheter removal requested</button><button class="decision no ${state.preventionAnswer==='deferred'?'active':''}" data-prevention-answer="deferred">Removal deferred due to clinical concern and provider notified</button>`;if(state.preventionAnswer==='removed')panel=`<div class="inline-action success"><strong>Required documentation:</strong> Document the catheter removal and actions taken in the EHR.</div>`;if(state.preventionAnswer==='providerRequested')panel=`<div class="inline-action warning"><strong>Required documentation:</strong> Document provider notification and the catheter removal request in the EHR. If the decision is made to maintain the catheter, restart this pathway.</div>`;if(state.preventionAnswer==='deferred')panel=`<div class="inline-action warning"><strong>Clinical concern:</strong><div class="question-helper" style="margin-top:8px">Specify the concern that led to deferring removal.</div><textarea id="preventionConcern" class="review-notes-textarea" style="width:100%;min-height:88px;margin-top:8px" placeholder="Enter clinical concern">${state.preventionConcern||''}</textarea><div class="question-helper" style="margin-top:8px">Document the concern and provider notification in the EHR.</div></div>`;can=!!state.preventionAnswer && (state.preventionAnswer!=='deferred'||!!state.preventionConcern.trim());}
    else if(f.step===4){buttons=`<button class="decision yes ${state.preventionAnswer==='yes'?'active':''}" data-prevention-answer="yes">Yes</button><button class="decision no ${state.preventionAnswer==='no'?'active':''}" data-prevention-answer="no">No</button>`;if(state.preventionAnswer==='no')panel=`<div class="inline-action danger"><strong>Required action:</strong> Notify the provider and request catheter removal. Document the action in the EHR. If the catheter is maintained, restart this pathway.</div>`;can=!!state.preventionAnswer;}
    else {buttons=`<button class="decision yes ${state.preventionAnswer==='yes'?'active':''}" data-prevention-answer="yes">Yes</button><button class="decision no ${state.preventionAnswer==='no'?'active':''}" data-prevention-answer="no">No</button>`;if(state.preventionAnswer==='no'){panel=`<div class="inline-action danger"><strong>Corrective action required:</strong> ${f.action}<label class="acknowledgment"><input type="checkbox" id="preventionAck" ${state.preventionAck?'checked':''}><span>I acknowledge the corrective action.</span></label></div>`;}can=state.preventionAnswer==='yes'||(state.preventionAnswer==='no'&&state.preventionAck);}
    return shell(`<button class="back-link" id="backPreventionObservation">← Back</button>${context}<div class="card question-card" style="margin-top:${context?'14':'0'}px"><div class="section-label">CAUTI Prevention Pathway · Step ${f.step} of 12 · ${f.source}</div><h1 class="question-text">${f.question}</h1><div class="decision-row">${buttons}</div>${panel}<div class="button-row"><button class="button primary" id="continuePreventionObservation" ${can?'':'disabled'}>${f.step===12?'Complete pathway':'Continue'}</button></div></div>`,`<div class="card"><div class="section-label">Pathway</div><div class="card-subtitle">CAUTI Prevention<br>Step ${f.step} of 12</div></div>`);}

  function savePreventionResult(){const f=preventionStep();state.preventionResults=state.preventionResults.filter(r=>r.step!==f.step);state.preventionResults.push({id:f.id,step:f.step,question:f.question,answer:state.preventionAnswer,action:state.preventionAnswer==='no'&&f.action?f.action:'',concern:f.step===3&&state.preventionAnswer==='deferred'?state.preventionConcern:''});}
  function finishPrevention(status,summary,documentation){state.preventionCompletion={status,summary,documentation};state.view='preventionCompletion';}
  function advancePrevention(){const f=preventionStep();savePreventionResult();
    if(f.step===2){state.preventionHistory.push(state.preventionStep);state.preventionStep=state.preventionAnswer==='io'?3:state.preventionAnswer==='other'?4:2;}
    else if(f.step===3){if(state.preventionAnswer==='removed'){finishPrevention('Catheter removed','The patient no longer met criteria for continued catheter use and the catheter was removed per the nurse-driven protocol.','Document catheter removal and actions taken in the EHR.');return;}if(state.preventionAnswer==='providerRequested'){finishPrevention('Removal requested','The provider was notified and catheter removal was requested.','Document provider notification and the removal request in the EHR. If the catheter is maintained, restart this pathway.');return;}state.preventionHistory.push(state.preventionStep);state.preventionStep=4;}
    else if(f.step===4){if(state.preventionAnswer==='no'){finishPrevention('Removal requested','Accurate urine output monitoring can be safely or reliably achieved without the indwelling catheter.','Notify the provider, request catheter removal, and document the action in the EHR. If the catheter is maintained, restart this pathway.');return;}state.preventionHistory.push(state.preventionStep);state.preventionStep=4;}
    else if(f.step===12){const actions=state.preventionResults.filter(r=>r.action).length;finishPrevention('CAUTI prevention observation complete',`The ongoing catheter-prevention observation has been recorded with ${actions} corrective action${actions===1?'':'s'}.`,'Complete any required corrective-action documentation in the EHR.');return;}
    else {state.preventionHistory.push(state.preventionStep);state.preventionStep++;}
    state.preventionAnswer=null;state.preventionAck=false;state.preventionConcern='';}
  function backPrevention(){if(!state.preventionHistory.length){state.view='preventionHome';state.preventionAnswer=null;state.preventionAck=false;state.preventionConcern='';return;}const prev=state.preventionHistory.pop();const prevStep=window.PRAXSYS_CAUTI_PREVENTION_STEPS[prev];const prior=state.preventionResults.find(r=>r.step===prevStep.step);state.preventionResults=state.preventionResults.filter(r=>r.step!==prevStep.step);state.preventionStep=prev;state.preventionAnswer=prior?prior.answer:null;state.preventionAck=prior&&prior.answer==='no'&&!!prevStep.action;state.preventionConcern=prior&&prior.concern?prior.concern:'';}
  function renderPreventionCompletion(){const c=state.preventionCompletion;const rows=state.preventionResults.slice().sort((a,b)=>a.step-b.step).map(r=>`<tr><td>${r.step}</td><td>${r.question}</td><td>${r.answer}</td><td>${r.action||r.concern||'—'}</td></tr>`).join('');return shell(`<div class="card completion"><div class="completion-icon">✓</div><div class="section-label">CAUTI Prevention Pathway</div><h1 class="card-title">Pathway recorded</h1><div class="card-subtitle">${c.summary}</div><div class="completion-grid"><div class="data-cell"><div class="data-label">Patient</div><div class="data-value">${patient().name}</div></div><div class="data-cell"><div class="data-label">Outcome</div><div class="data-value">${c.status}</div></div><div class="data-cell"><div class="data-label">Corrective actions</div><div class="data-value">${state.preventionResults.filter(r=>r.action).length}</div></div><div class="data-cell"><div class="data-label">Required documentation</div><div class="data-value">${c.documentation}</div></div></div><details class="disclosure" style="margin-top:18px"><summary>View pathway summary</summary><div style="overflow-x:auto"><table class="summary-table"><thead><tr><th>Step</th><th>Clinical question</th><th>Response</th><th>Corrective action / concern</th></tr></thead><tbody>${rows}</tbody></table></div></details><div class="button-row" style="justify-content:center"><button class="button primary" id="returnPreventionPatients">Return to patient list</button></div></div>`,`<div class="mini-note"><strong>CAUTI Prevention</strong><br>This pathway is separate from the CAUTI Insertion Pathway.</div>`);}

  function renderFallHome(){const f=window.PRAXSYS_FALL_PATIENTS[state.patientId];return shell(`<button class="back-link" data-back="conditions">← Back</button><div class="card"><div class="section-label">Fall Prevention</div><h1 class="card-title">Prevention Observation</h1><div class="card-subtitle">Review the most recent fall assessment, validate current risk, and observe individualized fall prevention practices.</div><div class="button-row"><button class="button primary" id="startFallPathway">Begin fall prevention review</button></div></div>`,`<div class="card"><div class="section-label">Current fall-risk context</div><div class="data-value">${f.risk} fall risk</div><div class="card-subtitle">${f.assessment}<br>Score ${f.score}<br>${f.assessedAt}</div><span class="source-pill">EHR pull</span><span class="source-pill">Clinical judgment</span><span class="source-pill">Observation</span></div>`);}

  function renderClabsiPathwaySelect(){return shell(`<button class="back-link" data-back="conditions">← Back</button><div class="card"><div class="section-label">CLABSI</div><h1 class="card-title">Select a CLABSI pathway</h1><div class="card-subtitle">Choose the clinical workflow that matches the observation being performed.</div></div><div class="tile-grid"><button class="tile" data-clabsi-pathway="insertion"><h3>CLABSI Insertion Pathway</h3><p>Review central line insertion indication and observe evidence-based insertion practices.</p></button><button class="tile" data-clabsi-pathway="prevention"><h3>CLABSI Prevention Pathway</h3><p>Review continued central-line necessity and ongoing prevention and maintenance practices.</p></button></div>`,`<div class="card"><div class="section-label">Selected patient</div><h2 class="card-title" style="font-size:21px">${patient().name}</h2><div class="card-subtitle">${patient().unit} ${patient().room}<br>${patient().encounter}</div></div>`);}
  function clabsiStep(){return window.PRAXSYS_CLABSI_INSERTION_STEPS[state.clabsiStep];}
  function renderClabsiHome(){return shell(`<button class="back-link" data-back="clabsiPathwaySelect">← Back</button><div class="card"><div class="section-label">CLABSI Insertion Pathway</div><h1 class="card-title">Central line insertion observation</h1><div class="card-subtitle">Review the central line order and indication, validate clinical appropriateness, and observe evidence-based insertion practices through EHR documentation.</div><div class="button-row"><button class="button primary" id="startClabsiPathway">Begin insertion review</button></div></div>`,`<div class="card"><div class="section-label">Data sources</div><span class="source-pill">EHR pull</span><span class="source-pill">Clinical judgment</span><span class="source-pill">Observation</span></div>`);}
  function renderClabsiObservation(){const d=clabsiStep();let body='';let can=false;
    if(d.step===1){body=`<div class="inline-action"><strong>Central line order:</strong> ${patient().centralLineOrder||'Insert central venous catheter'}<br><strong>Documented indication:</strong> ${patient().centralLineIndication||'Central venous access indicated'}<label class="acknowledgment"><input type="checkbox" id="clabsiAck" ${state.clabsiAck?'checked':''}><span>I acknowledge that the current central line insertion order and documented indication were reviewed.</span></label></div>`;can=state.clabsiAck;}
    else if(d.step===2){body=`<div class="decision-row"><button class="decision yes ${state.clabsiAnswer==='yes'?'active':''}" data-clabsi-answer="yes">Yes</button><button class="decision no ${state.clabsiAnswer==='no'?'active':''}" data-clabsi-answer="no">No</button></div>`;if(state.clabsiAnswer==='yes')can=true;if(state.clabsiAnswer==='no'){body+=`<div class="inline-action danger"><strong>Corrective action required:</strong> ${d.action}<label class="acknowledgment"><input type="checkbox" id="clabsiAck" ${state.clabsiAck?'checked':''}><span>I acknowledge that insertion is paused pending provider review.</span></label></div>`;if(state.clabsiAck){body+=`<div class="card" style="margin-top:14px"><div class="section-label">Provider determination</div><div class="decision-row"><button class="decision yes ${state.clabsiProviderOutcome==='confirmed'?'active':''}" data-clabsi-provider="confirmed">Appropriate indication confirmed/documented</button><button class="decision no ${state.clabsiProviderOutcome==='notConfirmed'?'active':''}" data-clabsi-provider="notConfirmed">Appropriate indication not confirmed</button></div></div>`;can=!!state.clabsiProviderOutcome;}}}
    else{body=`<div class="decision-row"><button class="decision yes ${state.clabsiAnswer==='yes'?'active':''}" data-clabsi-answer="yes">Yes</button><button class="decision no ${state.clabsiAnswer==='no'?'active':''}" data-clabsi-answer="no">No</button></div>`;if(state.clabsiAnswer==='yes')can=true;if(state.clabsiAnswer==='no'){body+=`<div class="inline-action danger"><strong>Corrective action required:</strong> ${d.action}<div class="section-label" style="margin-top:14px">Corrective action status</div><div class="decision-row"><button class="decision yes ${state.clabsiActionStatus==='Completed during observation'?'active':''}" data-clabsi-action="Completed during observation">Completed during observation</button><button class="decision no ${state.clabsiActionStatus==='Requires follow-up'?'active':''}" data-clabsi-action="Requires follow-up">Requires follow-up</button></div></div>`;can=!!state.clabsiActionStatus;}}
    return shell(`<button class="back-link" id="backClabsiObservation">← Back</button><div class="card question-card"><div class="section-label">CLABSI Insertion Pathway · Step ${d.step} of 10 · ${d.source}</div><h1 class="question-text">${d.question}</h1>${body}<div class="button-row"><button class="button primary" id="continueClabsiObservation" ${can?'':'disabled'}>${d.step===10?'Complete pathway':'Continue'}</button></div></div>`,`<div class="card"><div class="section-label">Insertion observation</div><div class="card-subtitle">${state.clabsiResults.filter(r=>r.answer==='yes').length} expected practices recorded<br>${state.clabsiResults.filter(r=>r.answer==='no').length} corrective actions recorded<br>${state.clabsiResults.filter(r=>r.actionStatus==='Requires follow-up').length} require follow-up</div></div>`);}
  function recordClabsiStep(){const d=clabsiStep();state.clabsiResults=state.clabsiResults.filter(r=>r.step!==d.step);state.clabsiResults.push({step:d.step,id:d.id,question:d.question,answer:d.step===1?'reviewed':state.clabsiAnswer,action:(state.clabsiAnswer==='no'?d.action:''),actionStatus:(state.clabsiAnswer==='no'&&d.step>=3?state.clabsiActionStatus:null),providerOutcome:(d.step===2?state.clabsiProviderOutcome:null)});}
  function advanceClabsi(){const d=clabsiStep();recordClabsiStep();if(d.step===2&&state.clabsiAnswer==='no'&&state.clabsiProviderOutcome==='notConfirmed'){state.clabsiCompletion={status:'Central line insertion did not proceed',summary:'The documented indication was not confirmed as clinically appropriate after provider review.'};state.view='clabsiCompletion';return;}if(d.step>=10){state.clabsiCompletion={status:'CLABSI insertion observation complete',summary:'The central line insertion observation has been recorded.',outstanding:state.clabsiResults.filter(r=>r.actionStatus==='Requires follow-up').length};state.view='clabsiCompletion';return;}state.clabsiHistory.push(state.clabsiStep);state.clabsiStep++;state.clabsiAnswer=null;state.clabsiAck=false;state.clabsiActionStatus=null;state.clabsiProviderOutcome=null;}
  function backClabsi(){if(!state.clabsiHistory.length){state.view='clabsiHome';state.clabsiAnswer=null;state.clabsiAck=false;state.clabsiActionStatus=null;state.clabsiProviderOutcome=null;return;}const prev=state.clabsiHistory.pop();const d=window.PRAXSYS_CLABSI_INSERTION_STEPS[prev];const prior=state.clabsiResults.find(r=>r.step===d.step);state.clabsiResults=state.clabsiResults.filter(r=>r.step!==d.step);state.clabsiStep=prev;state.clabsiAnswer=prior&&prior.answer!=='reviewed'?prior.answer:null;state.clabsiAck=d.step===1?true:(d.step===2&&prior&&prior.answer==='no');state.clabsiActionStatus=prior?prior.actionStatus:null;state.clabsiProviderOutcome=prior?prior.providerOutcome:null;}
  function renderClabsiCompletion(){const c=state.clabsiCompletion||{};const outstanding=state.clabsiResults.filter(r=>r.actionStatus==='Requires follow-up').length;return shell(`<div class="card"><div class="section-label">CLABSI Insertion Pathway</div><h1 class="card-title">${c.status||'Pathway complete'}</h1><div class="card-subtitle">${c.summary||''}</div>${outstanding?`<div class="inline-action danger" style="margin-top:16px"><strong>${outstanding} corrective action${outstanding===1?'':'s'} require follow-up.</strong> These items are available to nursing leadership in Outstanding Corrective Actions.</div>`:''}<div class="button-row"><button class="button primary" id="returnClabsiPatients">Return to patient list</button></div></div>`,`<div class="card"><div class="section-label">Observation summary</div><div class="data-cell"><div class="data-label">Corrective actions</div><div class="data-value">${state.clabsiResults.filter(r=>r.answer==='no').length}</div></div><div class="data-cell" style="margin-top:10px"><div class="data-label">Outstanding follow-up</div><div class="data-value">${outstanding}</div></div></div>`);}

  function clabsiPreventionStep(){return window.PRAXSYS_CLABSI_PREVENTION_STEPS[state.clabsiPreventionStep];}
  function renderClabsiPreventionHome(){const p=patient();const live=epicLdaEntries().length>0;return shell(`<button class="back-link" data-back="patients">← Back</button><div class="card"><div class="section-label">CLABSI Prevention Pathway</div><h1 class="card-title">Central line prevention and maintenance observation</h1><div class="card-subtitle">Focused Epic integration demonstration using the existing CLABSI Prevention pathway.</div><div class="button-row"><button class="button primary" id="startClabsiPreventionPathway">Begin prevention review</button></div></div>${epicLdaSummary()}<div class="ehr-panel" style="margin-top:14px"><div class="section-label">CLABSI scenario data · PraxSys demonstration</div><div class="ehr-grid"><div class="data-cell"><div class="data-label">Active LDA</div><div class="data-value">${p.centralLineType}</div><div class="mapping-tag configured">Demonstration value · Epic LDA mapping available</div></div><div class="data-cell"><div class="data-label">Insertion site</div><div class="data-value">${p.centralLineSite}</div><div class="mapping-tag configured">Demonstration value · Epic LDA property mapping available</div></div><div class="data-cell"><div class="data-label">Insertion date/time</div><div class="data-value">${p.centralLineInserted}</div><div class="mapping-tag configured">Demonstration value · Epic LDA property mapping available</div></div><div class="data-cell"><div class="data-label">Documented indication</div><div class="data-value">${p.centralLineIndication}</div><div class="mapping-tag configured">Hospital-configured mapping · demonstration value</div></div></div></div>`,`<div class="card"><div class="section-label">Integration legend</div><div class="integration-legend"><span class="mapping-tag verified">Epic sandbox data</span><span class="mapping-tag configured">Demonstration / hospital-configured value</span><span class="mapping-tag observed">PraxSys observation</span></div><div class="card-subtitle" style="margin-top:12px">This session has a live Epic sandbox connection. ${live?'Epic returned LDA data for this selected patient and it is displayed separately above.':'No Epic LDA data were returned for this selected patient.'} Scenario values remain separate unless they are actually returned by Epic.</div></div>`);}
  function renderClabsiPreventionObservation(){const d=clabsiPreventionStep();let body='';let can=false;
    if(d.step===1){body=`<div class="ehr-panel"><div class="section-label">CLABSI scenario data · PraxSys demonstration</div><div class="data-cell"><div class="data-label">Current central line order / indication</div><div class="data-value">${patient().centralLineIndication}</div><div class="mapping-tag configured">Hospital-configured Epic mapping · exact source varies by organization</div></div></div><label class="ack-row"><input type="checkbox" id="clabsiPreventionAck" ${state.clabsiPreventionAck?'checked':''}><span>I acknowledge that I reviewed the current central line order and documented indication.</span></label>`;can=state.clabsiPreventionAck;}
    else {const labels={yes:'Yes',no:'No',unable:'Unable to Determine',notObserved:'Not Observed',na:'Not Applicable'};body=`<div class="decision-row">${d.options.map(o=>`<button class="decision ${o==='yes'?'yes':(o==='no'?'no':'')} ${state.clabsiPreventionAnswer===o?'active':''}" data-clabsi-prevention-answer="${o}">${labels[o]}</button>`).join('')}</div>`;const corrective=state.clabsiPreventionAnswer==='no'||state.clabsiPreventionAnswer==='unable';if(corrective&&d.action){body+=`<div class="inline-action danger"><strong>Corrective action required:</strong> ${d.action}<div class="section-label" style="margin-top:14px">Corrective action status</div><div class="decision-row"><button class="decision yes ${state.clabsiPreventionActionStatus==='Completed during observation'?'active':''}" data-clabsi-prevention-action="Completed during observation">Completed during observation</button><button class="decision no ${state.clabsiPreventionActionStatus==='Requires follow-up'?'active':''}" data-clabsi-prevention-action="Requires follow-up">Requires follow-up</button></div></div>`;}can=!!state.clabsiPreventionAnswer&&(!corrective||!!state.clabsiPreventionActionStatus);}
    return shell(`<button class="back-link" id="backClabsiPreventionObservation">← Back</button><div class="card question-card"><div class="section-label">CLABSI Prevention Pathway · Step ${d.step} of 9 · ${d.step===1?'EHR context':'PraxSys observation'}</div><h1 class="question-text">${d.question}</h1>${body}<div class="button-row"><button class="button primary" id="continueClabsiPreventionObservation" ${can?'':'disabled'}>${d.step===9?'Complete pathway':'Continue'}</button></div></div>`,`<div class="card"><div class="section-label">Prevention observation</div><div class="card-subtitle">${state.clabsiPreventionResults.filter(r=>r.answer==='yes').length} expected practices recorded<br>${state.clabsiPreventionResults.filter(r=>r.answer==='no'||r.answer==='unable').length} corrective actions recorded<br>${state.clabsiPreventionResults.filter(r=>r.actionStatus==='Requires follow-up').length} require follow-up</div></div>`);}
  function recordClabsiPreventionStep(){const d=clabsiPreventionStep();state.clabsiPreventionResults=state.clabsiPreventionResults.filter(r=>r.step!==d.step);const answer=d.step===1?'reviewed':state.clabsiPreventionAnswer;const corrective=answer==='no'||answer==='unable';state.clabsiPreventionResults.push({step:d.step,id:d.id,question:d.question,answer,action:(corrective?d.action:''),actionStatus:(corrective?state.clabsiPreventionActionStatus:null)});}
  function advanceClabsiPrevention(){const d=clabsiPreventionStep();recordClabsiPreventionStep();if(d.step===2&&state.clabsiPreventionAnswer==='no'){state.clabsiPreventionCompletion={status:'CLABSI prevention observation complete',summary:'Central venous access no longer appears clinically necessary. Discussion with the provider regarding prompt removal has been initiated.'};state.view='clabsiPreventionCompletion';return;}if(d.step>=9){state.clabsiPreventionCompletion={status:'CLABSI prevention observation complete',summary:'The central line prevention and maintenance observation has been recorded.'};state.view='clabsiPreventionCompletion';return;}state.clabsiPreventionHistory.push(state.clabsiPreventionStep);state.clabsiPreventionStep++;state.clabsiPreventionAnswer=null;state.clabsiPreventionAck=false;state.clabsiPreventionActionStatus=null;}
  function backClabsiPrevention(){if(!state.clabsiPreventionHistory.length){state.view='clabsiPreventionHome';state.clabsiPreventionAnswer=null;state.clabsiPreventionAck=false;state.clabsiPreventionActionStatus=null;return;}const prev=state.clabsiPreventionHistory.pop();const d=window.PRAXSYS_CLABSI_PREVENTION_STEPS[prev];const prior=state.clabsiPreventionResults.find(r=>r.step===d.step);state.clabsiPreventionResults=state.clabsiPreventionResults.filter(r=>r.step!==d.step);state.clabsiPreventionStep=prev;state.clabsiPreventionAnswer=prior&&prior.answer!=='reviewed'?prior.answer:null;state.clabsiPreventionAck=d.step===1;state.clabsiPreventionActionStatus=prior?prior.actionStatus:null;}
  function renderClabsiPreventionCompletion(){const c=state.clabsiPreventionCompletion||{};const actions=state.clabsiPreventionResults.filter(r=>r.action);const outstanding=actions.filter(r=>r.actionStatus==='Requires follow-up').length;return shell(`<div class="card"><div class="section-label">CLABSI Prevention Pathway</div><h1 class="card-title">${c.status||'Pathway complete'}</h1><div class="card-subtitle">${c.summary||''}</div>${outstanding?`<div class="inline-action danger" style="margin-top:16px"><strong>${outstanding} corrective action${outstanding===1?'':'s'} require follow-up.</strong> These items are available to nursing leadership in Outstanding Corrective Actions.</div>`:''}<div class="button-row"><button class="button primary" id="returnClabsiPreventionPatients">Return to patient list</button></div></div>`,`<div class="card"><div class="section-label">Observation summary</div><div class="data-cell"><div class="data-label">Corrective actions</div><div class="data-value">${actions.length}</div></div><div class="data-cell" style="margin-top:10px"><div class="data-label">Outstanding follow-up</div><div class="data-value">${outstanding}</div></div></div>`);}


  function fallStep(){return window.PRAXSYS_FALL_STEPS[state.fallStep];}
  function renderFallObservation(){const f=fallStep(),ctx=window.PRAXSYS_FALL_PATIENTS[state.patientId];let context='';if(f.step===1){context=`<div class="ehr-panel"><div class="section-label">Information from the EHR</div><h2 class="card-title" style="font-size:21px">Most recent Fall Assessment</h2><div class="ehr-grid"><div class="data-cell"><div class="data-label">Risk level</div><div class="data-value">${ctx.risk}</div></div><div class="data-cell"><div class="data-label">Assessment / score</div><div class="data-value">${ctx.assessment} · ${ctx.score}</div></div><div class="data-cell"><div class="data-label">Documented</div><div class="data-value">${ctx.assessedAt}</div></div><div class="data-cell"><div class="data-label">Source</div><div class="data-value">EHR Pull</div></div></div></div>`;}
    let buttons='';if(f.step===1){buttons=`<button class="decision yes ${state.fallAnswer==='reviewed'?'active':''}" data-fall-answer="reviewed">I acknowledge that I reviewed the most recent fall assessment.</button><button class="decision no ${state.fallAnswer==='unavailable'?'active':''}" data-fall-answer="unavailable">No fall assessment available to review.</button>`;}else{buttons=`<button class="decision yes ${state.fallAnswer==='yes'?'active':''}" data-fall-answer="yes">Yes</button><button class="decision no ${state.fallAnswer==='no'?'active':''}" data-fall-answer="no">No</button>${f.options.includes('na')?`<button class="decision ${state.fallAnswer==='na'?'active':''}" data-fall-answer="na">N/A</button>`:''}`;}
    let action='';if(state.fallAnswer==='no'&&f.action){action=`<div class="inline-action danger"><strong>Corrective action required:</strong> ${f.action}<div class="question-helper" style="margin-top:10px">Can this corrective action be completed during the observation?</div><div class="decision-row"><button class="decision yes ${state.fallActionStatus==='completed'?'active':''}" data-fall-action="completed">Completed during observation</button><button class="decision no ${state.fallActionStatus==='followup'?'active':''}" data-fall-action="followup">Requires follow-up</button></div></div>`;}
    const can=!!state.fallAnswer && (state.fallAnswer!=='no'||!!state.fallActionStatus);return shell(`<button class="back-link" id="backFallObservation">← Back</button>${context}<div class="card question-card" style="margin-top:${context?'14':'0'}px"><div class="section-label">Fall Prevention · Step ${f.step} of 11 · ${f.source}</div><h1 class="question-text">${f.question}</h1><div class="decision-row fall-decisions">${buttons}</div>${action}<div class="button-row"><button class="button primary" id="continueFallObservation" ${can?'':'disabled'}>${f.step===11?'Complete observation':'Continue'}</button></div></div>`,`<div class="card"><div class="section-label">Pathway</div><div class="card-subtitle">Prevention Observation<br>Step ${f.step} of 11</div></div>`);}

  function recordFallStep(){const f=fallStep();state.fallResults.push({id:f.id,step:f.step,question:f.question,answer:state.fallAnswer,action:state.fallAnswer==='no'?f.action:'',actionStatus:state.fallAnswer==='no'?state.fallActionStatus:''});}
  function renderFallCompletion(){const actions=state.fallResults.filter(r=>r.action);const follow=actions.filter(r=>r.actionStatus==='followup');return shell(`<div class="card completion"><div class="completion-icon">✓</div><div class="section-label">Fall Prevention</div><h1 class="card-title">Prevention observation complete</h1><div class="card-subtitle">The Fall Prevention pathway has been recorded for this demonstration.</div><div class="completion-grid"><div class="data-cell"><div class="data-label">Corrective actions identified</div><div class="data-value">${actions.length}</div></div><div class="data-cell"><div class="data-label">Require follow-up</div><div class="data-value">${follow.length}</div></div></div>${follow.length?`<div class="inline-action warning" style="text-align:left"><strong>Outstanding corrective actions</strong><br>${follow.map(x=>`Step ${x.step}: ${x.action}`).join('<br>')}</div>`:''}<div class="button-row" style="justify-content:center"><button class="button primary" id="returnFallPatients">Return to patient list</button></div></div>`,`<div class="card"><div class="section-label">Follow-up</div><div class="card-subtitle">Corrective actions marked <strong>Requires follow-up</strong> are included in the Falls Manager tracking view.</div></div>`);}

  function ehrOrderPanel(){const p=patient();const criteria=window.PRAXSYS_APPROVED_INDICATIONS.map(x=>`<li>${x}</li>`).join('');return `<div class="ehr-panel"><div class="section-label">Information from the EHR</div><h2 class="card-title" style="font-size:21px">Provider catheter order</h2><div class="ehr-grid"><div class="data-cell"><div class="data-label">Order</div><div class="data-value">${p.order}</div></div><div class="data-cell"><div class="data-label">Ordering provider</div><div class="data-value">${p.provider}</div></div><div class="data-cell"><div class="data-label">Documented indication</div><div class="data-value">${p.indication}</div></div><div class="data-cell"><div class="data-label">Clinical detail</div><div class="data-value">${p.detail}</div></div></div><details class="disclosure"><summary>View approved indication criteria</summary><ul>${criteria}</ul></details></div>`;}

  function renderReviewOrder(){let panel='';if(state.reviewAnswer==='yes')panel=`<div class="inline-action success"><strong>Review confirmed.</strong> Provider order and documented indication have been reviewed.<label class="acknowledgment"><input type="checkbox" id="reviewAck" ${state.reviewAck?'checked':''}><span>I acknowledge that I reviewed this information.</span></label></div>`;if(state.reviewAnswer==='no')panel=`<div class="inline-action danger"><strong>Required action:</strong> Contact the provider for review.<label class="acknowledgment"><input type="checkbox" id="reviewAck" ${state.reviewAck?'checked':''}><span>I acknowledge that provider review is required before proceeding.</span></label></div>`;return shell(`<button class="back-link" data-back="pathwayHome">← Back</button>${ehrOrderPanel()}<div class="card question-card" style="margin-top:14px"><h1 class="question-text">Have you reviewed the provider’s catheter order and documented indication?</h1><div class="question-helper">This confirms review only. Current clinical appropriateness is assessed next.</div><div class="decision-row"><button class="decision yes ${state.reviewAnswer==='yes'?'active':''}" data-review="yes">Yes — reviewed</button><button class="decision no ${state.reviewAnswer==='no'?'active':''}" data-review="no">No — not yet reviewed</button></div>${panel}<div class="button-row"><button class="button primary" id="continueReview" ${(state.reviewAnswer&&state.reviewAck)?'':'disabled'}>Continue</button></div></div>`,`<div class="card"><div class="section-label">Clinical context</div><div class="card-subtitle">The review decision is recorded separately from the nurse’s clinical assessment.</div></div>`);}

  function renderClinicalAssessment(){let panel='';if(state.criteriaAnswer==='yes')panel=`<div class="inline-action success"><strong>Clinical validation recorded.</strong> The catheter remains clinically appropriate.</div>`;if(state.criteriaAnswer==='no')panel=`<div class="inline-action danger"><strong>Provider review required.</strong> Escalate the indication and determine the most appropriate urinary management strategy.<label class="acknowledgment"><input type="checkbox" id="criteriaAck" ${state.criteriaAck?'checked':''}><span>I acknowledge that provider review is required.</span></label></div>`;const can=state.criteriaAnswer==='yes'||(state.criteriaAnswer==='no'&&state.criteriaAck);return shell(`<button class="back-link" data-back="reviewOrder">← Back</button><div class="card question-card"><div class="section-label">Current patient assessment</div><h1 class="question-text">After review of the patient’s current condition, does the patient currently meet criteria for indwelling urinary catheter placement?</h1><div class="decision-row"><button class="decision yes ${state.criteriaAnswer==='yes'?'active':''}" data-criteria="yes">Yes — remains clinically appropriate</button><button class="decision no ${state.criteriaAnswer==='no'?'active':''}" data-criteria="no">No — no longer meets criteria</button></div>${panel}<div class="button-row"><button class="button primary" id="continueCriteria" ${can?'':'disabled'}>Continue</button></div></div>`,`<div class="card"><div class="section-label">Documented indication</div><div class="card-subtitle">${patient().indication}<br><br>${patient().detail}</div></div>`);}

  function renderProviderDecision(){let panel='';if(state.providerAnswer==='proceed')panel=`<div class="inline-action success"><strong>Insertion confirmed.</strong> Document the confirmed indication in the EHR.<label class="acknowledgment"><input type="checkbox" id="providerAck" ${state.providerAck?'checked':''}><span>I acknowledge the required EHR documentation.</span></label></div>`;if(state.providerAnswer==='stop')panel=`<div class="inline-action danger"><strong>Insertion will not proceed.</strong> Document the interaction with the ordering provider in the EHR.<label class="acknowledgment"><input type="checkbox" id="providerAck" ${state.providerAck?'checked':''}><span>I acknowledge the required EHR documentation.</span></label></div>`;return shell(`<button class="back-link" data-back="${state.providerOrigin}">← Back</button><div class="card question-card"><div class="section-label">Provider discussion</div><h1 class="question-text">After discussion with the provider, what was the clinical decision?</h1><div class="decision-row"><button class="decision yes ${state.providerAnswer==='proceed'?'active':''}" data-provider="proceed">Proceed with catheter insertion</button><button class="decision no ${state.providerAnswer==='stop'?'active':''}" data-provider="stop">Do not proceed with catheter insertion</button></div>${panel}<div class="button-row"><button class="button primary" id="completeProvider" ${(state.providerAnswer&&state.providerAck)?'':'disabled'}>Complete review</button></div></div>`,`<div class="card"><div class="section-label">Patient</div><h2 class="card-title" style="font-size:21px">${patient().name}</h2><div class="card-subtitle">${patient().indication}</div></div>`);}

  function renderObservation(){const o=observationMap[state.currentObservation];let panel='';if(state.observationAnswer==='yes')panel=`<div class="inline-action success"><strong>Observation recorded.</strong> The expected practice was observed.</div>`;if(state.observationAnswer==='no'){const action=o.breach?'Sterility was compromised. Stop the procedure immediately, discard contaminated supplies, perform hand hygiene, and re-establish a sterile field.':o.noAction;const ack=o.breach?'I acknowledge the sterility breach and required restart of the sterile insertion sequence.':o.ack;panel=`<div class="inline-action danger"><strong>Corrective action required:</strong> ${action}<label class="acknowledgment"><input type="checkbox" id="observationAck" ${state.observationAck?'checked':''}><span>${ack}</span></label></div>`;}const can=state.observationAnswer==='yes'||(state.observationAnswer==='no'&&state.observationAck);const completed=state.results.filter(r=>r.answer==='yes').length;return shell(`<button class="back-link" id="backObservation">← Back</button><div class="card question-card"><div class="section-label">${o.section}</div><h1 class="question-text">${o.question}</h1><div class="decision-row"><button class="decision yes ${state.observationAnswer==='yes'?'active':''}" data-observation="yes">Yes</button><button class="decision no ${state.observationAnswer==='no'?'active':''}" data-observation="no">No</button></div>${panel}<div class="button-row"><button class="button primary" id="continueObservation" ${can?'':'disabled'}>${o.id==='documentation'?'Complete pathway':'Continue'}</button></div></div>`,`<div class="card"><div class="section-label">Insertion observation</div><div class="card-subtitle">${completed} expected practices recorded<br>${state.results.filter(r=>r.answer==='no').length} corrective actions recorded</div></div><div class="mini-note">The application advances by clinical context. Spreadsheet step numbers remain hidden.</div>`);}

  function renderCompletion(){const c=state.completion;const rows=state.results.map(r=>`<tr><td>${r.section}</td><td>${r.question}</td><td><span class="status-badge ${r.answer==='yes'?'status-blue':'status-red'}">${r.answer==='yes'?'Observed':'Corrective action'}</span></td><td>${r.action||'—'}</td></tr>`).join('');return shell(`<div class="card completion"><div class="completion-icon">✓</div><h1 class="card-title">Catheter insertion pathway recorded</h1><div class="card-subtitle">${c.summary}</div><div class="completion-grid"><div class="data-cell"><div class="data-label">Patient</div><div class="data-value">${patient().name}</div></div><div class="data-cell"><div class="data-label">Outcome</div><div class="data-value">${c.status}</div></div><div class="data-cell"><div class="data-label">Corrective actions</div><div class="data-value">${state.results.filter(r=>r.answer==='no').length}</div></div><div class="data-cell"><div class="data-label">Required documentation</div><div class="data-value">${c.documentation}</div></div></div><details class="disclosure" style="margin-top:18px"><summary>View observation summary</summary><div style="overflow-x:auto"><table class="summary-table"><thead><tr><th>Clinical area</th><th>Observation</th><th>Result</th><th>Corrective action</th></tr></thead><tbody>${rows}</tbody></table></div></details><label class="acknowledgment" style="max-width:720px;margin:17px auto 0;text-align:left"><input type="checkbox" id="finalAck"><span>I acknowledge this pathway outcome and any required EHR documentation.</span></label><div class="button-row" style="justify-content:center"><button class="button primary" id="returnPatients" disabled>Return to patient list</button></div></div>`,`<div class="mini-note"><strong>Audit-ready summary</strong><br>Responses, corrective actions, and acknowledgments are retained in the simulation.</div>`);}

  function isAllFilter(value){
    return value == null || value === '' || String(value).trim().toLowerCase().startsWith('all');
  }
  function managerRecords(){
    const f=state.managerFilters||{};
    return (window.PRAXSYS_MANAGER_DATA||[]).filter(r=>
      (isAllFilter(f.month)||r.date.slice(0,7)===f.month)&&
      (isAllFilter(f.order)||(f.order==='Reviewed'&&r.orderReviewed)||(f.order==='Provider review required'&&!r.orderReviewed))&&
      (isAllFilter(f.criteria)||(f.criteria==='Meets criteria'&&r.criteriaMet===true)||(f.criteria==='Does not meet criteria'&&r.criteriaMet===false)||(f.criteria==='Not assessed'&&r.criteriaMet==null))&&
      (isAllFilter(f.outcome)||r.pathwayOutcome===f.outcome)&&
      (isAllFilter(f.indication)||r.indication===f.indication));
  }
  function pct(n,d){return d?Math.round(n/d*100):0;}
  function optionList(values,current,label){return `<option value="All">All ${label}</option>`+values.map(v=>`<option value="${v}" ${current===v?'selected':''}>${v}</option>`).join('');}
  function managerFilters(){
    const all=window.PRAXSYS_MANAGER_DATA||[];
    const months=[...new Set(all.map(r=>r.date.slice(0,7)))];
    const outcomes=[...new Set(all.map(r=>r.pathwayOutcome))];
    const indications=[...new Set(all.map(r=>r.indication))];
    const f=state.managerFilters;
    return `<div class="manager-filters workflow-filters"><label>Month<select id="managerMonth">${optionList(months,f.month,'months')}</select></label><label>Order review<select id="managerOrder">${optionList(['Reviewed','Provider review required'],f.order,'results')}</select></label><label>Current criteria<select id="managerCriteria">${optionList(['Meets criteria','Does not meet criteria','Not assessed'],f.criteria,'results')}</select></label><label>Pathway outcome<select id="managerOutcome">${optionList(outcomes,f.outcome,'outcomes')}</select></label><label>Documented indication<select id="managerIndication">${optionList(indications,f.indication,'indications')}</select></label><button class="button secondary" id="clearManagerFilters">Clear filters</button></div>`;
  }
  function reportTabs(){return `<div class="report-tabs"><button data-report="overview" class="report-tab ${state.managerReport==='overview'?'active':''}">Overview</button><button data-report="events" class="report-tab ${state.managerReport==='events'?'active':''}">Workflow cases</button><button data-report="missed" class="report-tab ${state.managerReport==='missed'?'active':''}">Corrective actions</button><button data-report="insertionFollowup" class="report-tab ${state.managerReport==='insertionFollowup'?'active':''}">Outstanding corrective actions</button><button data-report="outcomes" class="report-tab ${state.managerReport==='outcomes'?'active':''}">Pathway outcomes</button></div>`;}
  function barRows(items,max,labeler){return items.map(x=>`<button class="bar-row"><span class="bar-label">${x.label}</span><span class="bar-track"><span class="bar-fill" style="width:${max?Math.max(2,x.value/max*100):0}%"></span></span><strong>${labeler?labeler(x):x.value}</strong></button>`).join('');}
  function renderOverview(records){
    const insertion=records.filter(r=>r.insertionObserved);
    const byMonth=[...new Set(records.map(r=>r.date.slice(0,7)))].map(month=>{const a=insertion.filter(r=>r.date.startsWith(month));return {label:month,value:pct(a.filter(r=>r.fullCompliance).length,a.length)};});
    const outcomeCounts=[...new Set((window.PRAXSYS_MANAGER_DATA||[]).map(r=>r.pathwayOutcome))].map(label=>({label,value:records.filter(r=>r.pathwayOutcome===label).length}));
    return `<div class="dashboard-grid"><div class="card"><div class="section-label">Fully compliant insertion observations by month</div><div class="card-subtitle">A case is fully compliant only when all 11 expected insertion practices are recorded as Yes.</div>${barRows(byMonth,100,x=>`${x.value}%`)||'<div class="empty-state">No insertion observations match the current filters.</div>'}</div><div class="card"><div class="section-label">Workflow pathway outcomes</div><div class="card-subtitle">Outcomes follow the exact branches used in the clinician demonstration.</div>${barRows(outcomeCounts,Math.max(1,...outcomeCounts.map(x=>x.value)))||'<div class="empty-state">No workflow cases match the current filters.</div>'}</div></div>`;
  }
  function renderEvents(records){
    const rows=records.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(r=>`<tr class="event-row" data-event-id="${r.id}"><td>${r.date}</td><td>${r.patientId}</td><td>${r.orderReviewed?'Reviewed':'Provider review required'}</td><td>${r.criteriaMet===true?'Meets criteria':r.criteriaMet===false?'Does not meet criteria':'Not assessed'}</td><td>${r.pathwayOutcome}</td><td>${r.insertionObserved?r.practiceCompliance+'%':'—'}</td><td>${r.correctiveActions}</td></tr>`).join('');
    return `<div class="card"><div class="section-label">Synthetic workflow cases</div><div class="card-subtitle">Select a row to inspect the order review, current criteria, provider decision, and all insertion observations.</div><div class="table-wrap"><table class="summary-table manager-table"><thead><tr><th>Date</th><th>Patient ID</th><th>Order review</th><th>Current criteria</th><th>Outcome</th><th>Practices observed</th><th>Actions</th></tr></thead><tbody>${rows||'<tr><td colspan="7">No workflow cases match the current filters.</td></tr>'}</tbody></table></div></div>`;
  }
  function renderMissed(records){
    const counts={};records.forEach(r=>r.missedPractices.forEach(x=>counts[x]=(counts[x]||0)+1));
    const items=Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([label,value])=>({label,value}));
    return `<div class="card"><div class="section-label">Corrective actions by insertion practice</div><div class="card-subtitle">Each count comes from a No response to an observation question in the clinician pathway.</div>${barRows(items,Math.max(1,...items.map(x=>x.value)))||'<div class="empty-state">No corrective actions occur in the selected workflow cases.</div>'}</div>`;
  }
  function renderInsertionOutstanding(records){
    const open=records.flatMap(r=>(r.correctiveActionItems||[]).filter(a=>a.status==='Requires follow-up').map(a=>({...a,caseId:r.id,patientId:r.patientId,date:r.date})));
    const rows=open.map(a=>`<tr><td>${a.date}</td><td>${a.caseId}</td><td>${a.patientId}</td><td>${a.element}</td><td><span class="status-badge status-amber">Requires follow-up</span></td></tr>`).join('');
    return `<div class="card"><div class="section-label">Outstanding Corrective Actions</div><h2 class="card-title" style="font-size:21px">CAUTI Insertion · Requires follow-up</h2><div class="table-wrap"><table class="summary-table manager-table"><thead><tr><th>Identified</th><th>Case</th><th>Patient ID</th><th>Insertion practice</th><th>Status</th></tr></thead><tbody>${rows||'<tr><td colspan="5">No outstanding corrective actions.</td></tr>'}</tbody></table></div></div>`;
  }
  function renderOutcomes(records){
    const labels=[...new Set((window.PRAXSYS_MANAGER_DATA||[]).map(r=>r.pathwayOutcome))];
    const rows=labels.map(label=>{const a=records.filter(r=>r.pathwayOutcome===label);return `<tr><td>${label}</td><td>${a.length}</td><td>${a.filter(r=>r.providerReviewRequired).length}</td><td>${a.filter(r=>r.insertionObserved).length}</td><td>${a.reduce((s,r)=>s+r.correctiveActions,0)}</td></tr>`;}).join('');
    return `<div class="card"><div class="section-label">Pathway outcome summary</div><div class="card-subtitle">No unit, catheter-day, or infection values are assumed; this report uses only fields represented in the demo workflow.</div><div class="table-wrap"><table class="summary-table manager-table"><thead><tr><th>Outcome</th><th>Cases</th><th>Provider review required</th><th>Insertion observations</th><th>Corrective actions</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  }
  function observationRows(r){
    if(!r.insertionObserved)return '<div class="mini-note"><strong>Insertion observations</strong><br>Not reached in this workflow case.</div>';
    return `<div class="table-wrap"><table class="summary-table"><thead><tr><th>Insertion observation</th><th>Response</th></tr></thead><tbody>${(window.PRAXSYS_OBSERVATION_DEFINITIONS||[]).map(([id,label])=>`<tr><td>${label}</td><td><span class="status-badge ${r.observations[id]==='Yes'?'status-blue':'status-red'}">${r.observations[id]}</span></td></tr>`).join('')}</tbody></table></div>`;
  }
  function renderManagerDetail(){
    if(!state.managerSelected)return '';
    const r=(window.PRAXSYS_MANAGER_DATA||[]).find(x=>x.id===state.managerSelected);if(!r)return '';
    return `<div class="detail-overlay"><div class="detail-panel"><button class="detail-close" id="closeManagerDetail">×</button><div class="section-label">Synthetic workflow case</div><h2 class="card-title">${r.id} · ${r.patientId}</h2><div class="detail-grid"><div class="data-cell"><div class="data-label">Date / indication</div><div class="data-value">${r.date}<br>${r.indication}</div></div><div class="data-cell"><div class="data-label">Provider order review</div><div class="data-value">${r.orderReviewed?'Reviewed':'Provider review required'}</div></div><div class="data-cell"><div class="data-label">Current clinical criteria</div><div class="data-value">${r.criteriaMet===true?'Meets criteria':r.criteriaMet===false?'Does not meet criteria':'Not assessed'}</div></div><div class="data-cell"><div class="data-label">Provider decision / outcome</div><div class="data-value">${r.providerDecision}<br>${r.pathwayOutcome}</div></div></div>${observationRows(r)}<div class="mini-note"><strong>Corrective actions</strong><br>${r.missedPractices.length?r.missedPractices.join('<br>'):'None required'}</div><div class="mini-note"><strong>Required documentation</strong><br>${r.requiredDocumentation}</div></div></div>`;
  }
  function cautiPathwayManagerSelector(){return `<div class="card" style="padding:14px 18px;margin-bottom:14px"><div class="section-label" style="margin-bottom:10px">CAUTI PATHWAY</div><div class="report-tabs domain-tabs" style="margin:0"><button class="report-tab ${state.managerCautiPathway==='INSERTION'?'active':''}" data-manager-cauti-pathway="INSERTION">CAUTI Insertion</button><button class="report-tab ${state.managerCautiPathway==='PREVENTION'?'active':''}" data-manager-cauti-pathway="PREVENTION">CAUTI Prevention</button></div></div>`;}
  function preventionManagerRecords(){
    const f=state.managerPreventionFilters||{};
    return (window.PRAXSYS_CAUTI_PREVENTION_MANAGER_DATA||[]).filter(r=>
      (isAllFilter(f.month)||r.date.slice(0,7)===f.month)&&
      (isAllFilter(f.criteria)||r.currentCriteria===f.criteria)&&
      (isAllFilter(f.outcome)||r.pathwayOutcome===f.outcome)&&
      (isAllFilter(f.indication)||r.documentedIndication===f.indication));
  }
  function preventionManagerFilters(){
    const all=window.PRAXSYS_CAUTI_PREVENTION_MANAGER_DATA||[];
    const months=[...new Set(all.map(r=>r.date.slice(0,7)))];
    const criteria=[...new Set(all.map(r=>r.currentCriteria))];
    const outcomes=[...new Set(all.map(r=>r.pathwayOutcome))];
    const indications=[...new Set(all.map(r=>r.documentedIndication))];
    const f=state.managerPreventionFilters;
    return `<div class="manager-filters workflow-filters"><label>Month<select id="preventionManagerMonth">${optionList(months,f.month,'months')}</select></label><label>Current criteria<select id="preventionManagerCriteria">${optionList(criteria,f.criteria,'results')}</select></label><label>Pathway outcome<select id="preventionManagerOutcome">${optionList(outcomes,f.outcome,'outcomes')}</select></label><label>Documented indication<select id="preventionManagerIndication">${optionList(indications,f.indication,'indications')}</select></label><button class="button secondary" id="clearPreventionManagerFilters">Clear filters</button></div>`;
  }
  function preventionReportTabs(){return `<div class="report-tabs"><button data-report="overview" class="report-tab ${state.managerReport==='overview'?'active':''}">Overview</button><button data-report="preventionCases" class="report-tab ${state.managerReport==='preventionCases'?'active':''}">Prevention reviews</button><button data-report="preventionActions" class="report-tab ${state.managerReport==='preventionActions'?'active':''}">Corrective actions</button><button data-report="preventionFollowup" class="report-tab ${state.managerReport==='preventionFollowup'?'active':''}">Outstanding corrective actions</button><button data-report="preventionOutcomes" class="report-tab ${state.managerReport==='preventionOutcomes'?'active':''}">Pathway outcomes</button></div>`;}
  function renderPreventionManagerOverview(records){
    const maintenance=records.filter(r=>r.reachedMaintenance);
    const months=[...new Set(records.map(r=>r.date.slice(0,7)))];
    const byMonth=months.map(month=>{const a=maintenance.filter(r=>r.date.startsWith(month));return {label:month,value:pct(a.filter(r=>r.fullCompliance).length,a.length)};});
    const labels=[...new Set((window.PRAXSYS_CAUTI_PREVENTION_MANAGER_DATA||[]).map(r=>r.pathwayOutcome))];
    const outcomes=labels.map(label=>({label,value:records.filter(r=>r.pathwayOutcome===label).length}));
    return `<div class="dashboard-grid"><div class="card"><div class="section-label">Fully compliant prevention observations by month</div><div class="card-subtitle">Calculated only for cases that reached Steps 5–12. Fully compliant means all eight prevention / maintenance elements were recorded as Yes.</div>${barRows(byMonth,100,x=>`${x.value}%`)||'<div class="empty-state">No prevention observations match the current filters.</div>'}</div><div class="card"><div class="section-label">CAUTI Prevention pathway outcomes</div><div class="card-subtitle">Outcomes reflect the branching logic in Steps 2–4.</div>${barRows(outcomes,Math.max(1,...outcomes.map(x=>x.value)))||'<div class="empty-state">No prevention reviews match the current filters.</div>'}</div></div>`;
  }
  function renderPreventionManagerCases(records){
    const rows=records.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(r=>`<tr class="event-row" data-prevention-event-id="${r.id}"><td>${r.date}</td><td>${r.patientId}</td><td>${r.currentCriteria}</td><td>${r.accurateIO}</td><td>${r.pathwayOutcome}</td><td>${r.reachedMaintenance?(r.fullCompliance?'Fully compliant':`${r.correctiveActions.length} corrective action${r.correctiveActions.length===1?'':'s'}`):'Not reached'}</td></tr>`).join('');
    return `<div class="card"><div class="section-label">Synthetic CAUTI Prevention reviews</div><div class="table-wrap"><table class="summary-table manager-table"><thead><tr><th>Date</th><th>Case</th><th>Current criteria</th><th>Accurate I&O validation</th><th>Pathway outcome</th><th>Steps 5–12</th></tr></thead><tbody>${rows||'<tr><td colspan="6">No prevention reviews match the current filters.</td></tr>'}</tbody></table></div></div>`;
  }
  function renderPreventionManagerActions(records){
    const defs=(window.PRAXSYS_CAUTI_PREVENTION_STEPS||[]).filter(d=>d.step>=5);
    const items=defs.map(d=>({label:`Step ${d.step} — ${d.question}`,value:records.reduce((n,r)=>n+r.correctiveActions.filter(a=>a.step===d.step).length,0)}));
    const total=items.reduce((n,x)=>n+x.value,0);
    return `<div class="card"><div class="section-label">Corrective actions by prevention element</div><div class="card-subtitle">Counts are generated only from No responses in Steps 5–12.</div>${barRows(items,Math.max(1,...items.map(x=>x.value)))||'<div class="empty-state">No corrective actions match the current filters.</div>'}<div class="mini-note"><strong>Total corrective actions:</strong> ${total}</div></div>`;
  }
  function renderPreventionOutstanding(records){
    const open=records.flatMap(r=>r.correctiveActions.filter(a=>a.status==='Requires follow-up').map(a=>({...a,caseId:r.id,patientId:r.patientId,date:r.date})));
    const rows=open.map(a=>`<tr><td>${a.date}</td><td>${a.caseId}</td><td>${a.patientId}</td><td>${a.step}</td><td>${a.action}</td><td><span class="status-badge status-amber">Requires follow-up</span></td></tr>`).join('');
    return `<div class="card"><div class="section-label">Outstanding Corrective Actions</div><h2 class="card-title" style="font-size:21px">CAUTI Prevention · Requires follow-up</h2><div class="table-wrap"><table class="summary-table manager-table"><thead><tr><th>Identified</th><th>Case</th><th>Patient ID</th><th>Step</th><th>Corrective action</th><th>Status</th></tr></thead><tbody>${rows||'<tr><td colspan="6">No outstanding corrective actions.</td></tr>'}</tbody></table></div></div>`;
  }
  function renderPreventionManagerOutcomes(records){
    const labels=[...new Set((window.PRAXSYS_CAUTI_PREVENTION_MANAGER_DATA||[]).map(r=>r.pathwayOutcome))];
    const items=labels.map(label=>({label,value:records.filter(r=>r.pathwayOutcome===label).length}));
    return `<div class="card"><div class="section-label">Pathway outcomes</div><div class="card-subtitle">Distribution of final outcomes created by Steps 2–4.</div>${barRows(items,Math.max(1,...items.map(x=>x.value)))||'<div class="empty-state">No pathway outcomes match the current filters.</div>'}</div>`;
  }
  function renderPreventionManagerDetail(){
    if(!state.managerSelected)return '';
    const r=(window.PRAXSYS_CAUTI_PREVENTION_MANAGER_DATA||[]).find(x=>x.id===state.managerSelected); if(!r)return '';
    const steps=(window.PRAXSYS_CAUTI_PREVENTION_STEPS||[]).filter(d=>d.step>=5);
    const maintenance=r.reachedMaintenance?`<div class="table-wrap"><table class="summary-table"><thead><tr><th>Step</th><th>Prevention / maintenance element</th><th>Response</th><th>Corrective action</th></tr></thead><tbody>${steps.map(d=>{const ans=r.responses[d.id]||'—';const a=r.correctiveActions.find(x=>x.step===d.step);return `<tr><td>${d.step}</td><td>${d.question}</td><td><span class="status-badge ${ans==='Yes'?'status-blue':'status-red'}">${ans}</span></td><td>${a?a.action:'—'}</td></tr>`;}).join('')}</tbody></table></div>`:`<div class="mini-note"><strong>Steps 5–12</strong><br>This case ended before the prevention / maintenance observation sequence.</div>`;
    return `<div class="detail-overlay"><div class="detail-panel"><button class="detail-close" id="closeManagerDetail">×</button><div class="section-label">Synthetic CAUTI Prevention case</div><h2 class="card-title">${r.id} · ${r.patientId}</h2><div class="detail-grid"><div class="data-cell"><div class="data-label">Date / documented indication</div><div class="data-value">${r.date}<br>${r.documentedIndication}</div></div><div class="data-cell"><div class="data-label">Current criteria</div><div class="data-value">${r.currentCriteria}</div></div><div class="data-cell"><div class="data-label">Step 3 action / Step 4 I&O validation</div><div class="data-value">${r.actionTaken}<br>${r.accurateIO}</div></div><div class="data-cell"><div class="data-label">Pathway outcome</div><div class="data-value">${r.pathwayOutcome}</div></div></div>${maintenance}</div></div>`;
  }
  function renderCautiPreventionManager(){
    const records=preventionManagerRecords();
    const maintenance=records.filter(r=>r.reachedMaintenance);
    const full=maintenance.filter(r=>r.fullCompliance).length;
    const compliance=pct(full,maintenance.length);
    const corrective=records.reduce((n,r)=>n+r.correctiveActions.length,0);
    const removalRelated=records.filter(r=>/removed|removal requested|not supported/i.test(r.pathwayOutcome)).length;
    const outstanding=records.reduce((n,r)=>n+r.correctiveActions.filter(a=>a.status==='Requires follow-up').length,0);
    let report=state.managerReport==='preventionCases'?renderPreventionManagerCases(records):state.managerReport==='preventionActions'?renderPreventionManagerActions(records):state.managerReport==='preventionFollowup'?renderPreventionOutstanding(records):state.managerReport==='preventionOutcomes'?renderPreventionManagerOutcomes(records):renderPreventionManagerOverview(records);
    return `<button class="back-link" data-back="role">← Back</button><div class="card manager-heading"><div><div class="section-label">Nursing leadership</div><h1 class="card-title">CAUTI Prevention dashboard</h1><div class="card-subtitle">Synthetic demonstration data follows the CAUTI Prevention Pathway: continued-necessity validation in Steps 1–4 and prevention / maintenance observations in Steps 5–12. No real patient information is included.</div></div><span class="status-badge status-blue">${records.length} prevention reviews</span></div>${managerDomainSelector()}${cautiPathwayManagerSelector()}${preventionManagerFilters()}<div class="kpi-grid"><button class="kpi kpi-button" data-report="preventionCases"><div class="kpi-label">Prevention reviews</div><div class="kpi-value">${records.length}</div><span class="status-badge status-blue">Selected synthetic cases</span></button><button class="kpi kpi-button" data-report="preventionCases"><div class="kpi-label">Reached Steps 5–12</div><div class="kpi-value">${maintenance.length}</div><span class="status-badge status-blue">Continued prevention review</span></button><button class="kpi kpi-button" data-report="overview"><div class="kpi-label">Fully compliant maintenance</div><div class="kpi-value">${compliance}%</div><span class="status-badge ${compliance>=95?'status-blue':'status-amber'}">${full} of ${maintenance.length} cases</span></button><button class="kpi kpi-button" data-report="preventionActions"><div class="kpi-label">Corrective actions</div><div class="kpi-value">${corrective}</div><span class="status-badge ${corrective?'status-amber':'status-blue'}">${removalRelated} removal-related outcomes</span></button><button class="kpi kpi-button" data-report="preventionFollowup"><div class="kpi-label">Outstanding follow-up</div><div class="kpi-value">${outstanding}</div><span class="status-badge ${outstanding?'status-amber':'status-blue'}">Requires follow-up</span></button></div>${preventionReportTabs()}${report}${renderPreventionManagerDetail()}`;
  }
  function managerDomainSelector(){return `<div class="report-tabs domain-tabs"><button class="report-tab ${state.managerDomain==='CAUTI'?'active':''}" data-manager-domain="CAUTI">CAUTI</button><button class="report-tab ${state.managerDomain==='CLABSI'?'active':''}" data-manager-domain="CLABSI">CLABSI</button><button class="report-tab ${state.managerDomain==='FALLS'?'active':''}" data-manager-domain="FALLS">Falls Prevention</button></div>`;}
  function renderFallsManager(){const records=window.PRAXSYS_FALL_MANAGER_DATA||[];const actions=records.flatMap(r=>r.correctiveActions.map(a=>({...a,caseId:r.id,patientId:r.patientId,risk:r.risk})));const open=actions.filter(a=>a.status==='Requires follow-up');const completed=actions.filter(a=>a.status==='Completed during observation');const compliant=records.filter(r=>r.compliant).length;const byStep=window.PRAXSYS_FALL_STEPS.slice(1).map(d=>({step:d.step,label:d.question,count:actions.filter(a=>a.step===d.step).length}));let body='';if(state.managerReport==='followup'){body=`<div class="card"><div class="section-label">Outstanding Corrective Actions</div><h2 class="card-title" style="font-size:21px">Requires follow-up</h2><div class="table-wrap"><table class="summary-table manager-table"><thead><tr><th>Case</th><th>Risk</th><th>Step</th><th>Corrective action</th><th>Status</th></tr></thead><tbody>${open.map(a=>`<tr><td>${a.caseId}</td><td>${a.risk}</td><td>${a.step}</td><td>${a.action}</td><td><span class="status-badge status-amber">Requires follow-up</span></td></tr>`).join('')||'<tr><td colspan="5">No outstanding corrective actions.</td></tr>'}</tbody></table></div></div>`;}else if(state.managerReport==='fallActions'){body=`<div class="card"><div class="section-label">Corrective actions by pathway step</div>${byStep.map(x=>`<div class="bar-row"><span class="bar-label">Step ${x.step}</span><span class="bar-track"><span class="bar-fill" style="width:${Math.min(100,x.count*10)}%"></span></span><strong>${x.count}</strong></div>`).join('')}</div>`;}else{body=`<div class="dashboard-grid"><div class="card"><div class="section-label">Fall Prevention pathway</div><h2 class="card-title" style="font-size:21px">Observation summary</h2><div class="card-subtitle">Synthetic demonstration cases based on the Fall Prevention Pathway.</div>${byStep.slice(0,5).map(x=>`<div class="bar-row"><span class="bar-label">Step ${x.step}</span><span class="bar-track"><span class="bar-fill" style="width:${Math.min(100,x.count*10)}%"></span></span><strong>${x.count}</strong></div>`).join('')}</div><div class="card"><div class="section-label">Follow-up status</div><div class="data-cell"><div class="data-label">Completed during observation</div><div class="data-value">${completed.length}</div></div><div class="data-cell" style="margin-top:10px"><div class="data-label">Requires follow-up</div><div class="data-value">${open.length}</div></div></div></div>`;}
    return `<button class="back-link" data-back="role">← Back</button><div class="card manager-heading"><div><div class="section-label">Nursing leadership</div><h1 class="card-title">Fall Prevention dashboard</h1><div class="card-subtitle">Synthetic demonstration data based on the Fall Prevention Pathway. Existing CAUTI reporting remains available as a separate domain.</div></div><span class="status-badge status-blue">${records.length} observations</span></div>${managerDomainSelector()}<div class="kpi-grid"><div class="kpi"><div class="kpi-label">Prevention observations</div><div class="kpi-value">${records.length}</div></div><div class="kpi"><div class="kpi-label">Fully compliant</div><div class="kpi-value">${pct(compliant,records.length)}%</div></div><button class="kpi kpi-button" data-report="fallActions"><div class="kpi-label">Corrective actions</div><div class="kpi-value">${actions.length}</div></button><button class="kpi kpi-button" data-report="followup"><div class="kpi-label">Outstanding follow-up</div><div class="kpi-value">${open.length}</div><span class="status-badge ${open.length?'status-amber':'status-blue'}">Requires follow-up</span></button></div><div class="report-tabs"><button class="report-tab ${state.managerReport==='overview'?'active':''}" data-report="overview">Overview</button><button class="report-tab ${state.managerReport==='fallActions'?'active':''}" data-report="fallActions">Corrective actions</button><button class="report-tab ${state.managerReport==='followup'?'active':''}" data-report="followup">Outstanding corrective actions</button></div>${body}`;}
  function clabsiPathwayManagerSelector(){return `<div class="card" style="padding:14px 18px;margin-bottom:14px"><div class="section-label" style="margin-bottom:10px">CLABSI PATHWAY</div><div class="report-tabs domain-tabs" style="margin:0"><button class="report-tab ${state.managerClabsiPathway==='INSERTION'?'active':''}" data-manager-clabsi-pathway="INSERTION">CLABSI Insertion</button><button class="report-tab ${state.managerClabsiPathway==='PREVENTION'?'active':''}" data-manager-clabsi-pathway="PREVENTION">CLABSI Prevention</button></div></div>`;}
  function renderClabsiPreventionManager(){const records=window.PRAXSYS_CLABSI_PREVENTION_MANAGER_DATA||[];const actions=records.flatMap(r=>(r.correctiveActions||[]).map(a=>({...a,caseId:r.id,patientId:r.patientId})));const open=actions.filter(a=>a.status==='Requires follow-up');const completed=actions.filter(a=>a.status==='Completed during observation');const maintenance=records.filter(r=>r.reachedMaintenance);const compliant=maintenance.filter(r=>r.fullCompliance).length;let body='';if(state.managerReport==='clabsiPreventionFollowup'){body=`<div class="card"><div class="section-label">Outstanding Corrective Actions</div><h2 class="card-title" style="font-size:21px">CLABSI Prevention · Requires follow-up</h2><div class="table-wrap"><table class="summary-table manager-table"><thead><tr><th>Case</th><th>Date</th><th>Step</th><th>Corrective action</th><th>Status</th></tr></thead><tbody>${open.map(a=>`<tr><td>${a.caseId}</td><td>${a.identified}</td><td>${a.step}</td><td>${a.action}</td><td><span class="status-badge status-amber">Requires follow-up</span></td></tr>`).join('')||'<tr><td colspan="5">No outstanding corrective actions.</td></tr>'}</tbody></table></div></div>`;}else if(state.managerReport==='clabsiPreventionActions'){const byStep=window.PRAXSYS_CLABSI_PREVENTION_STEPS.slice(1).map(d=>({step:d.step,count:actions.filter(a=>a.step===d.step).length}));body=`<div class="card"><div class="section-label">Corrective actions by pathway step</div>${byStep.map(x=>`<div class="bar-row"><span class="bar-label">Step ${x.step}</span><span class="bar-track"><span class="bar-fill" style="width:${Math.min(100,x.count*12)}%"></span></span><strong>${x.count}</strong></div>`).join('')}</div>`;}else{body=`<div class="dashboard-grid"><div class="card"><div class="section-label">CLABSI Prevention Pathway</div><h2 class="card-title" style="font-size:21px">Prevention and maintenance summary</h2><div class="card-subtitle">Synthetic demonstration cases based only on the CLABSI Prevention Pathway.</div><div class="data-cell" style="margin-top:14px"><div class="data-label">Prevention reviews</div><div class="data-value">${records.length}</div></div><div class="data-cell" style="margin-top:10px"><div class="data-label">Continued maintenance reviews</div><div class="data-value">${maintenance.length}</div></div></div><div class="card"><div class="section-label">Corrective-action status</div><div class="data-cell"><div class="data-label">Completed during observation</div><div class="data-value">${completed.length}</div></div><div class="data-cell" style="margin-top:10px"><div class="data-label">Requires follow-up</div><div class="data-value">${open.length}</div></div></div></div>`;}
    return `<button class="back-link" data-back="role">← Back</button><div class="card manager-heading"><div><div class="section-label">Nursing leadership</div><h1 class="card-title">CLABSI Prevention dashboard</h1><div class="card-subtitle">Synthetic demonstration data based on the CLABSI Prevention Pathway. No real patient information is included.</div></div><span class="status-badge status-blue">${records.length} prevention reviews</span></div>${managerDomainSelector()}${clabsiPathwayManagerSelector()}<div class="kpi-grid"><div class="kpi"><div class="kpi-label">Prevention reviews</div><div class="kpi-value">${records.length}</div></div><div class="kpi"><div class="kpi-label">Continued maintenance reviews</div><div class="kpi-value">${maintenance.length}</div></div><div class="kpi"><div class="kpi-label">Fully compliant</div><div class="kpi-value">${pct(compliant,maintenance.length)}%</div></div><button class="kpi kpi-button" data-report="clabsiPreventionActions"><div class="kpi-label">Corrective actions</div><div class="kpi-value">${actions.length}</div></button><button class="kpi kpi-button" data-report="clabsiPreventionFollowup"><div class="kpi-label">Outstanding follow-up</div><div class="kpi-value">${open.length}</div><span class="status-badge ${open.length?'status-amber':'status-blue'}">Requires follow-up</span></button></div><div class="report-tabs"><button class="report-tab ${state.managerReport==='overview'?'active':''}" data-report="overview">Overview</button><button class="report-tab ${state.managerReport==='clabsiPreventionActions'?'active':''}" data-report="clabsiPreventionActions">Corrective actions</button><button class="report-tab ${state.managerReport==='clabsiPreventionFollowup'?'active':''}" data-report="clabsiPreventionFollowup">Outstanding corrective actions</button></div>${body}`;}
  function renderClabsiManager(){const records=window.PRAXSYS_CLABSI_MANAGER_DATA||[];const actions=records.flatMap(r=>(r.correctiveActions||[]).map(a=>({...a,caseId:r.id,patientId:r.patientId})));const open=actions.filter(a=>a.status==='Requires follow-up');const completed=actions.filter(a=>a.status==='Completed during observation');const observed=records.filter(r=>r.insertionObserved);const compliant=observed.filter(r=>r.fullCompliance).length;const providerReviews=records.filter(r=>r.providerReviewRequired).length;let body='';if(state.managerReport==='clabsiFollowup'){body=`<div class="card"><div class="section-label">Outstanding Corrective Actions</div><h2 class="card-title" style="font-size:21px">CLABSI Insertion · Requires follow-up</h2><div class="table-wrap"><table class="summary-table manager-table"><thead><tr><th>Case</th><th>Date</th><th>Step</th><th>Corrective action</th><th>Status</th></tr></thead><tbody>${open.map(a=>`<tr><td>${a.caseId}</td><td>${a.identified}</td><td>${a.step}</td><td>${a.action}</td><td><span class="status-badge status-amber">Requires follow-up</span></td></tr>`).join('')||'<tr><td colspan="5">No outstanding corrective actions.</td></tr>'}</tbody></table></div></div>`;}else if(state.managerReport==='clabsiActions'){const byStep=window.PRAXSYS_CLABSI_INSERTION_STEPS.slice(2).map(d=>({step:d.step,label:d.question,count:actions.filter(a=>a.step===d.step).length}));body=`<div class="card"><div class="section-label">Corrective actions by pathway step</div>${byStep.map(x=>`<div class="bar-row"><span class="bar-label">Step ${x.step}</span><span class="bar-track"><span class="bar-fill" style="width:${Math.min(100,x.count*12)}%"></span></span><strong>${x.count}</strong></div>`).join('')}</div>`;}else{body=`<div class="dashboard-grid"><div class="card"><div class="section-label">CLABSI Insertion Pathway</div><h2 class="card-title" style="font-size:21px">Insertion observation summary</h2><div class="card-subtitle">Synthetic demonstration cases based only on the CLABSI Insertion Pathway.</div><div class="data-cell" style="margin-top:14px"><div class="data-label">Provider indication reviews required</div><div class="data-value">${providerReviews}</div></div><div class="data-cell" style="margin-top:10px"><div class="data-label">Insertions observed</div><div class="data-value">${observed.length}</div></div></div><div class="card"><div class="section-label">Corrective-action status</div><div class="data-cell"><div class="data-label">Completed during observation</div><div class="data-value">${completed.length}</div></div><div class="data-cell" style="margin-top:10px"><div class="data-label">Requires follow-up</div><div class="data-value">${open.length}</div></div></div></div>`;}
    return `<button class="back-link" data-back="role">← Back</button><div class="card manager-heading"><div><div class="section-label">Nursing leadership</div><h1 class="card-title">CLABSI Insertion dashboard</h1><div class="card-subtitle">Synthetic demonstration data based on the CLABSI Insertion Pathway. CLABSI Prevention is available as a separate pathway.</div></div><span class="status-badge status-blue">${records.length} workflow cases</span></div>${managerDomainSelector()}${clabsiPathwayManagerSelector()}<div class="kpi-grid"><div class="kpi"><div class="kpi-label">Workflow cases</div><div class="kpi-value">${records.length}</div></div><div class="kpi"><div class="kpi-label">Insertion observations</div><div class="kpi-value">${observed.length}</div></div><div class="kpi"><div class="kpi-label">Fully compliant</div><div class="kpi-value">${pct(compliant,observed.length)}%</div></div><button class="kpi kpi-button" data-report="clabsiActions"><div class="kpi-label">Corrective actions</div><div class="kpi-value">${actions.length}</div></button><button class="kpi kpi-button" data-report="clabsiFollowup"><div class="kpi-label">Outstanding follow-up</div><div class="kpi-value">${open.length}</div><span class="status-badge ${open.length?'status-amber':'status-blue'}">Requires follow-up</span></button></div><div class="report-tabs"><button class="report-tab ${state.managerReport==='overview'?'active':''}" data-report="overview">Overview</button><button class="report-tab ${state.managerReport==='clabsiActions'?'active':''}" data-report="clabsiActions">Corrective actions</button><button class="report-tab ${state.managerReport==='clabsiFollowup'?'active':''}" data-report="clabsiFollowup">Outstanding corrective actions</button></div>${body}`;}

  function renderManager(){if(state.managerDomain==='FALLS')return renderFallsManager();if(state.managerDomain==='CLABSI')return state.managerClabsiPathway==='PREVENTION'?renderClabsiPreventionManager():renderClabsiManager();return state.managerCautiPathway==='PREVENTION'?renderCautiPreventionManager():renderCautiManager();}

  function renderCautiManager(){
    const records=managerRecords();
    const insertion=records.filter(r=>r.insertionObserved);
    const full=insertion.filter(r=>r.fullCompliance).length;
    const compliance=pct(full,insertion.length);
    const corrective=records.reduce((s,r)=>s+r.correctiveActions,0);
    const providerReviews=records.filter(r=>r.providerReviewRequired).length;
    const outstanding=records.reduce((n,r)=>n+(r.correctiveActionItems||[]).filter(a=>a.status==='Requires follow-up').length,0);
    let report=state.managerReport==='events'?renderEvents(records):state.managerReport==='missed'?renderMissed(records):state.managerReport==='insertionFollowup'?renderInsertionOutstanding(records):state.managerReport==='outcomes'?renderOutcomes(records):renderOverview(records);
    return `<button class="back-link" data-back="role">← Back</button><div class="card manager-heading"><div><div class="section-label">Nursing leadership</div><h1 class="card-title">CAUTI workflow dashboard</h1><div class="card-subtitle">Reports are calculated only from synthetic cases that follow the order review, current-criteria, provider-decision, and insertion-observation parameters in this demo. No real patient information is included.</div></div><span class="status-badge status-blue">${records.length} workflow cases</span></div>${managerDomainSelector()}${cautiPathwayManagerSelector()}${managerFilters()}<div class="kpi-grid"><button class="kpi kpi-button" data-kpi-report="events"><div class="kpi-label">Workflow cases</div><div class="kpi-value">${records.length}</div><span class="status-badge status-blue">Selected synthetic cases</span></button><button class="kpi kpi-button" data-kpi-report="events"><div class="kpi-label">Insertion observations</div><div class="kpi-value">${insertion.length}</div><span class="status-badge status-blue">Reached observation pathway</span></button><button class="kpi kpi-button" data-kpi-report="overview"><div class="kpi-label">Fully compliant insertions</div><div class="kpi-value">${compliance}%</div><span class="status-badge ${compliance>=95?'status-blue':'status-amber'}">${full} of ${insertion.length} cases</span></button><button class="kpi kpi-button" data-kpi-report="missed"><div class="kpi-label">Corrective actions</div><div class="kpi-value">${corrective}</div><span class="status-badge ${corrective?'status-amber':'status-blue'}">${providerReviews} provider reviews required</span></button><button class="kpi kpi-button" data-report="insertionFollowup"><div class="kpi-label">Outstanding follow-up</div><div class="kpi-value">${outstanding}</div><span class="status-badge ${outstanding?'status-amber':'status-blue'}">Requires follow-up</span></button></div>${reportTabs()}${report}${renderManagerDetail()}`;
  }


  function recordObservation(o,answer){state.results.push({id:o.id,section:o.section,question:o.question,answer,action:answer==='no'?(o.breach?'Restart sterile sequence after correcting sterility breach':o.noAction):''});}

  function bind(){
    document.querySelectorAll('[data-back]').forEach(el=>el.onclick=()=>{state.view=el.dataset.back;render();});
    document.querySelectorAll('[data-role]').forEach(el=>el.onclick=()=>{state.role=el.dataset.role;render();});
    const cr=document.getElementById('continueRole');if(cr)cr.onclick=()=>{state.view=state.role==='Manager'?'manager':'patients';render();};
    document.querySelectorAll('[data-patient]').forEach(el=>el.onclick=()=>{state.patientId=el.dataset.patient;state.clabsiPreventionStep=0;state.clabsiPreventionAnswer=null;state.clabsiPreventionAck=false;state.clabsiPreventionActionStatus=null;state.clabsiPreventionHistory=[];state.clabsiPreventionResults=[];state.clabsiPreventionCompletion=null;state.view='clabsiPreventionHome';render();});
    const veld=document.getElementById('viewEpicLdaData');if(veld)veld.onclick=e=>{e.stopPropagation();if(window.PraxSysEpicIntegration&&window.PraxSysEpicIntegration.showLdaData)window.PraxSysEpicIntegration.showLdaData();};
    document.querySelectorAll('[data-condition="CAUTI"]').forEach(el=>el.onclick=()=>{state.view='cautiPathwaySelect';render();});
    document.querySelectorAll('[data-condition="CLABSI"]').forEach(el=>el.onclick=()=>{state.clabsiStep=0;state.clabsiAnswer=null;state.clabsiAck=false;state.clabsiActionStatus=null;state.clabsiProviderOutcome=null;state.clabsiHistory=[];state.clabsiResults=[];state.clabsiCompletion=null;state.clabsiPreventionStep=0;state.clabsiPreventionAnswer=null;state.clabsiPreventionAck=false;state.clabsiPreventionActionStatus=null;state.clabsiPreventionHistory=[];state.clabsiPreventionResults=[];state.clabsiPreventionCompletion=null;state.view='clabsiPathwaySelect';render();});
    document.querySelectorAll('[data-cauti-pathway]').forEach(el=>el.onclick=()=>{if(el.dataset.cautiPathway==='insertion'){state.view='pathwayHome';}else{state.preventionStep=0;state.preventionAnswer=null;state.preventionAck=false;state.preventionConcern='';state.preventionHistory=[];state.preventionResults=[];state.preventionCompletion=null;state.view='preventionHome';}render();});
    const spp=document.getElementById('startPreventionPathway');if(spp)spp.onclick=()=>{state.preventionStep=0;state.preventionAnswer=null;state.preventionAck=false;state.preventionConcern='';state.preventionHistory=[];state.preventionResults=[];state.preventionCompletion=null;state.view='preventionObservation';render();};
    document.querySelectorAll('[data-prevention-answer]').forEach(el=>el.onclick=()=>{state.preventionAnswer=el.dataset.preventionAnswer;state.preventionAck=false;if(state.preventionAnswer!=='deferred')state.preventionConcern='';render();});
    const pcon=document.getElementById('preventionConcern');if(pcon)pcon.oninput=e=>{state.preventionConcern=e.target.value;const btn=document.getElementById('continuePreventionObservation');if(btn)btn.disabled=!state.preventionConcern.trim();};
    const pack=document.getElementById('preventionAck');if(pack)pack.onchange=e=>{state.preventionAck=e.target.checked;render();};
    const bpo=document.getElementById('backPreventionObservation');if(bpo)bpo.onclick=()=>{backPrevention();render();};
    const cpo=document.getElementById('continuePreventionObservation');if(cpo)cpo.onclick=()=>{advancePrevention();render();};
    const rpp=document.getElementById('returnPreventionPatients');if(rpp)rpp.onclick=()=>reset('patients');
    document.querySelectorAll('[data-clabsi-pathway]').forEach(el=>el.onclick=()=>{if(el.dataset.clabsiPathway==='prevention'){state.view='clabsiPreventionHome';}else{state.view='clabsiHome';}render();});
    const sc=document.getElementById('startClabsiPathway');if(sc)sc.onclick=()=>{state.clabsiStep=0;state.clabsiAnswer=null;state.clabsiAck=false;state.clabsiActionStatus=null;state.clabsiProviderOutcome=null;state.clabsiHistory=[];state.clabsiResults=[];state.clabsiCompletion=null;state.view='clabsiObservation';render();};
    document.querySelectorAll('[data-clabsi-answer]').forEach(el=>el.onclick=()=>{state.clabsiAnswer=el.dataset.clabsiAnswer;state.clabsiAck=false;state.clabsiActionStatus=null;state.clabsiProviderOutcome=null;render();});
    document.querySelectorAll('[data-clabsi-action]').forEach(el=>el.onclick=()=>{state.clabsiActionStatus=el.dataset.clabsiAction;render();});
    document.querySelectorAll('[data-clabsi-provider]').forEach(el=>el.onclick=()=>{state.clabsiProviderOutcome=el.dataset.clabsiProvider;render();});
    const cla=document.getElementById('clabsiAck');if(cla)cla.onchange=e=>{state.clabsiAck=e.target.checked;render();};
    const bcl=document.getElementById('backClabsiObservation');if(bcl)bcl.onclick=()=>{backClabsi();render();};
    const ccl=document.getElementById('continueClabsiObservation');if(ccl)ccl.onclick=()=>{advanceClabsi();render();};
    const rcl=document.getElementById('returnClabsiPatients');if(rcl)rcl.onclick=()=>reset('patients');
    const scp=document.getElementById('startClabsiPreventionPathway');if(scp)scp.onclick=()=>{state.clabsiPreventionStep=0;state.clabsiPreventionAnswer=null;state.clabsiPreventionAck=false;state.clabsiPreventionActionStatus=null;state.clabsiPreventionHistory=[];state.clabsiPreventionResults=[];state.clabsiPreventionCompletion=null;state.view='clabsiPreventionObservation';render();};
    document.querySelectorAll('[data-clabsi-prevention-answer]').forEach(el=>el.onclick=()=>{state.clabsiPreventionAnswer=el.dataset.clabsiPreventionAnswer;state.clabsiPreventionActionStatus=null;render();});
    document.querySelectorAll('[data-clabsi-prevention-action]').forEach(el=>el.onclick=()=>{state.clabsiPreventionActionStatus=el.dataset.clabsiPreventionAction;render();});
    const clpa=document.getElementById('clabsiPreventionAck');if(clpa)clpa.onchange=e=>{state.clabsiPreventionAck=e.target.checked;render();};
    const bcp=document.getElementById('backClabsiPreventionObservation');if(bcp)bcp.onclick=()=>{backClabsiPrevention();render();};
    const ccp=document.getElementById('continueClabsiPreventionObservation');if(ccp)ccp.onclick=()=>{advanceClabsiPrevention();render();};
    const rcp=document.getElementById('returnClabsiPreventionPatients');if(rcp)rcp.onclick=()=>reset('patients');

    document.querySelectorAll('[data-condition="FALLS"]').forEach(el=>el.onclick=()=>{state.fallStep=0;state.fallAnswer=null;state.fallActionStatus=null;state.fallResults=[];state.view='fallHome';render();});
    const sf=document.getElementById('startFallPathway');if(sf)sf.onclick=()=>{state.fallStep=0;state.fallAnswer=null;state.fallActionStatus=null;state.fallResults=[];state.view='fallObservation';render();};
    document.querySelectorAll('[data-fall-answer]').forEach(el=>el.onclick=()=>{state.fallAnswer=el.dataset.fallAnswer;state.fallActionStatus=null;render();});
    document.querySelectorAll('[data-fall-action]').forEach(el=>el.onclick=()=>{state.fallActionStatus=el.dataset.fallAction;render();});
    const bfo=document.getElementById('backFallObservation');if(bfo)bfo.onclick=()=>{if(state.fallStep===0){state.view='fallHome';}else{state.fallStep--;const prev=state.fallResults.pop();state.fallAnswer=prev?prev.answer:null;state.fallActionStatus=prev?prev.actionStatus:null;}render();};
    const cfo=document.getElementById('continueFallObservation');if(cfo)cfo.onclick=()=>{recordFallStep();if(state.fallStep>=window.PRAXSYS_FALL_STEPS.length-1){state.view='fallCompletion';}else{state.fallStep++;state.fallAnswer=null;state.fallActionStatus=null;}render();};
    const rfp=document.getElementById('returnFallPatients');if(rfp)rfp.onclick=()=>reset('patients');
    const start=document.getElementById('startPathway');if(start)start.onclick=()=>{state.view='reviewOrder';render();};
    document.querySelectorAll('[data-review]').forEach(el=>el.onclick=()=>{state.reviewAnswer=el.dataset.review;state.reviewAck=false;render();});
    const ra=document.getElementById('reviewAck');if(ra)ra.onchange=e=>{state.reviewAck=e.target.checked;render();};
    const rc=document.getElementById('continueReview');if(rc)rc.onclick=()=>{if(state.reviewAnswer==='yes'){state.view='clinicalAssessment';}else{state.providerOrigin='reviewOrder';state.view='providerDecision';}render();};
    document.querySelectorAll('[data-criteria]').forEach(el=>el.onclick=()=>{state.criteriaAnswer=el.dataset.criteria;state.criteriaAck=false;render();});
    const ca=document.getElementById('criteriaAck');if(ca)ca.onchange=e=>{state.criteriaAck=e.target.checked;render();};
    const cc=document.getElementById('continueCriteria');if(cc)cc.onclick=()=>{if(state.criteriaAnswer==='yes'){state.currentObservation='handHygiene';state.observationAnswer=null;state.observationAck=false;state.view='observation';}else{state.providerOrigin='clinicalAssessment';state.view='providerDecision';}render();};
    document.querySelectorAll('[data-provider]').forEach(el=>el.onclick=()=>{state.providerAnswer=el.dataset.provider;state.providerAck=false;render();});
    const pa=document.getElementById('providerAck');if(pa)pa.onchange=e=>{state.providerAck=e.target.checked;render();};
    const pc=document.getElementById('completeProvider');if(pc)pc.onclick=()=>{state.completion={status:state.providerAnswer==='proceed'?'Provider confirmed insertion':'Catheter insertion not proceeding',documentation:state.providerAnswer==='proceed'?'Document the confirmed indication in the EHR':'Document the interaction with the ordering provider in the EHR',summary:state.providerAnswer==='proceed'?'Provider review confirmed that insertion should proceed. Restart the pathway after required documentation.':'Provider review resulted in a decision not to proceed with insertion.'};state.view='completion';render();};
    document.querySelectorAll('[data-observation]').forEach(el=>el.onclick=()=>{state.observationAnswer=el.dataset.observation;state.observationAck=false;render();});
    const oa=document.getElementById('observationAck');if(oa)oa.onchange=e=>{state.observationAck=e.target.checked;render();};
    const bo=document.getElementById('backObservation');if(bo)bo.onclick=()=>{if(state.results.length){const last=state.results.pop();state.currentObservation=last.id;state.observationAnswer=last.answer;state.observationAck=last.answer==='no';}else{state.view='clinicalAssessment';}render();};
    const oc=document.getElementById('continueObservation');if(oc)oc.onclick=()=>{const o=observationMap[state.currentObservation];recordObservation(o,state.observationAnswer);const next=state.observationAnswer==='yes'?o.yesNext:o.noNext;if(next==='complete'){const missingDoc=state.results.some(r=>r.id==='documentation'&&r.answer==='no');state.completion={status:'Insertion observation complete',documentation:missingDoc?'Complete catheter insertion documentation in the EHR, including date and time':'Insertion date and time documented in the EHR',summary:'The full catheter insertion observation has been recorded.'};state.view='completion';}else{state.currentObservation=next;state.observationAnswer=null;state.observationAck=false;}render();};
    const fa=document.getElementById('finalAck'),rp=document.getElementById('returnPatients');if(fa&&rp)fa.onchange=e=>{rp.disabled=!e.target.checked;};if(rp)rp.onclick=()=>reset('patients');
    const mf={managerMonth:'month',managerOrder:'order',managerCriteria:'criteria',managerOutcome:'outcome',managerIndication:'indication'};Object.entries(mf).forEach(([id,key])=>{const el=document.getElementById(id);if(el)el.onchange=e=>{state.managerFilters[key]=e.target.value;state.managerSelected=null;render();};});
    const clear=document.getElementById('clearManagerFilters');if(clear)clear.onclick=()=>{state.managerFilters={month:'All',order:'All',criteria:'All',outcome:'All',indication:'All'};state.managerSelected=null;render();};
    document.querySelectorAll('[data-manager-domain]').forEach(el=>el.onclick=()=>{state.managerDomain=el.dataset.managerDomain;state.managerReport='overview';state.managerSelected=null;render();});
    document.querySelectorAll('[data-manager-cauti-pathway]').forEach(el=>el.onclick=()=>{state.managerCautiPathway=el.dataset.managerCautiPathway;state.managerReport='overview';state.managerSelected=null;render();});
    document.querySelectorAll('[data-manager-clabsi-pathway]').forEach(el=>el.onclick=()=>{state.managerClabsiPathway=el.dataset.managerClabsiPathway;state.managerReport='overview';state.managerSelected=null;render();});
    const pmf={preventionManagerMonth:'month',preventionManagerCriteria:'criteria',preventionManagerOutcome:'outcome',preventionManagerIndication:'indication'};Object.entries(pmf).forEach(([id,key])=>{const el=document.getElementById(id);if(el)el.onchange=e=>{state.managerPreventionFilters[key]=e.target.value;state.managerSelected=null;render();};});
    const pclear=document.getElementById('clearPreventionManagerFilters');if(pclear)pclear.onclick=()=>{state.managerPreventionFilters={month:'All',criteria:'All',outcome:'All',indication:'All'};state.managerSelected=null;render();};
    document.querySelectorAll('[data-prevention-event-id]').forEach(el=>el.onclick=()=>{state.managerSelected=el.dataset.preventionEventId;render();});
    document.querySelectorAll('[data-report]').forEach(el=>el.onclick=()=>{state.managerReport=el.dataset.report;state.managerSelected=null;render();});
    document.querySelectorAll('[data-kpi-report]').forEach(el=>el.onclick=()=>{state.managerReport=el.dataset.kpiReport;state.managerSelected=null;render();});
    document.querySelectorAll('[data-event-id]').forEach(el=>el.onclick=()=>{state.managerSelected=el.dataset.eventId;render();});
    const close=document.getElementById('closeManagerDetail');if(close)close.onclick=()=>{state.managerSelected=null;render();};
  }

  function reset(destination='patients'){Object.assign(state,{view:destination,role:'Clinician',patientId:'john',reviewAnswer:null,reviewAck:false,criteriaAnswer:null,criteriaAck:false,providerAnswer:null,providerAck:false,providerOrigin:'reviewOrder',currentObservation:'handHygiene',observationAnswer:null,observationAck:false,results:[],completion:null,managerFilters:{month:'All',order:'All',criteria:'All',outcome:'All',indication:'All'},managerPreventionFilters:{month:'All',criteria:'All',outcome:'All',indication:'All'},managerReport:'overview',managerSelected:null,managerDomain:'CAUTI',managerCautiPathway:'INSERTION',managerClabsiPathway:'INSERTION',fallStep:0,fallAnswer:null,fallActionStatus:null,fallResults:[],fallCompletion:null,preventionStep:0,preventionAnswer:null,preventionAck:false,preventionConcern:'',preventionHistory:[],preventionResults:[],preventionCompletion:null,clabsiStep:0,clabsiAnswer:null,clabsiAck:false,clabsiActionStatus:null,clabsiProviderOutcome:null,clabsiHistory:[],clabsiResults:[],clabsiCompletion:null,clabsiPreventionStep:0,clabsiPreventionAnswer:null,clabsiPreventionAck:false,clabsiPreventionActionStatus:null,clabsiPreventionHistory:[],clabsiPreventionResults:[],clabsiPreventionCompletion:null});render();}
  document.getElementById('resetDemoButton').onclick=()=>reset('patients');render();
})();;
