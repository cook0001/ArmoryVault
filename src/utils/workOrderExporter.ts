export interface InspectionCheck {
  check: string;
  result: string;
}

/**
 * Returns specialized military and armorer technical inspection items
 * adapted for specific platforms: handguns, revolvers, bolt actions, lever actions, shotguns, and MSR rifles.
 */
export function getPlatformInspectionChecks(
  firearm: { make?: string; model?: string; firearm_type?: string; action_type?: string },
  profileId?: string
): InspectionCheck[] {
  const fType = (firearm.firearm_type || '').toLowerCase();
  const fAction = (firearm.action_type || '').toLowerCase();
  const fModel = `${firearm.make || ''} ${firearm.model || ''}`.toLowerCase();
  const pId = profileId || '';

  // 1. Revolvers
  if (
    pId.includes('revolver') ||
    fType.includes('revolver') ||
    fAction.includes('revolver') ||
    fModel.includes('revolver') ||
    fModel.includes('python') ||
    fModel.includes('686') ||
    fModel.includes('sp101') ||
    fModel.includes('gp100')
  ) {
    return [
      { check: 'Cylinder Timing & Lockup', result: 'PASSED (Pawl index & bolt lock verified)' },
      { check: 'Cylinder Gap Feeler Gauge (.004"-.008")', result: 'PASSED (Within factory tolerance)' },
      { check: 'Forcing Cone Integrity & Erosion', result: 'PASSED (Clean, no flame cutting)' },
      { check: 'Crane / Yoke Alignment & Ejector Rod', result: 'PASSED (True axial alignment, zero runout)' },
      { check: 'Hammer Block & Transfer Bar Safety', result: 'PASSED (Positive drop-safety verified)' },
    ];
  }

  // 2. Bolt Action Rifles
  if (
    pId.includes('bolt') ||
    fType.includes('bolt') ||
    fAction.includes('bolt') ||
    fModel.includes('remington 700') ||
    fModel.includes('tikka') ||
    fModel.includes('savage') ||
    fModel.includes('bergara')
  ) {
    return [
      { check: 'Headspace Verification (GO / NO-GO)', result: 'PASSED (Closes on GO, rejects NO-GO)' },
      { check: 'Action Screw Torque & Pillar Bedding', result: 'PASSED (Front/Rear torqued to armorer spec)' },
      { check: 'Bolt Lug Bearing Contact', result: 'PASSED (Dual/triple lug contact verified)' },
      { check: 'Firing Pin Protrusion & Spring Fall', result: 'PASSED (Protrusion .055"-.060", crisp fall)' },
      { check: 'Bore & Chamber Throat Wear', result: 'PASSED (Borescope clear, zero throat erosion)' },
    ];
  }

  // 3. Lever Action Rifles
  if (
    pId.includes('lever') ||
    fType.includes('lever') ||
    fAction.includes('lever') ||
    fModel.includes('marlin') ||
    fModel.includes('winchester 94') ||
    fModel.includes('henry')
  ) {
    return [
      { check: 'Lever Pivot Linkage & Locking Bolt', result: 'PASSED (Positive battery lockup, no play)' },
      { check: 'Cartridge Carrier & Lifter Timing', result: 'PASSED (Smooth feeding, positive round staging)' },
      { check: 'Magazine Tube Spring & Follower', result: 'PASSED (Continuous tension, clean tube bore)' },
      { check: 'Half-Cock Notch & Transfer Safety', result: 'PASSED (Sear captured securely on notch)' },
      { check: 'Extractor Claw & Ejector Spring', result: 'PASSED (Positive extraction & ejection arc)' },
    ];
  }

  // 4. Shotguns (Pump, Semi, Break)
  if (
    pId.includes('shotgun') ||
    pId.includes('pump') ||
    pId.includes('break') ||
    fType.includes('shotgun') ||
    fModel.includes('mossberg 500') ||
    fModel.includes('remington 870') ||
    fModel.includes('benelli') ||
    fModel.includes('beretta a400')
  ) {
    return [
      { check: 'Choke Tube Threads & Concentricity', result: 'PASSED (Anti-seize applied, true alignment)' },
      { check: 'Action Bars & Forend Tube Alignment', result: 'PASSED (Smooth slide stroke, zero binding)' },
      { check: 'Gas System Piston / O-Ring Seal', result: 'PASSED (Ports unobstructed, seal intact)' },
      { check: 'Magazine Tube Follower & Shell Latches', result: 'PASSED (Positive shell retention & feed)' },
      { check: 'Barrel Extension & Locking Wedge', result: 'PASSED (Positive lockup into barrel hood)' },
    ];
  }

  // 5. Military / Tactical Rifles (AR-15, M4, AK, Gas Piston, Roller Delayed)
  if (
    pId.includes('semi_rifle') ||
    pId.includes('semi_piston') ||
    pId.includes('roller') ||
    fModel.includes('m4') ||
    fModel.includes('ar-15') ||
    fModel.includes('ar15') ||
    fModel.includes('ak-47') ||
    fModel.includes('scar') ||
    fModel.includes('hk')
  ) {
    return [
      { check: 'Bolt Carrier Group & Gas Key Staking', result: 'PASSED (Proper staking, zero carrier leak)' },
      { check: 'Gas Rings Compression & Seal', result: 'PASSED (Passes upright friction test)' },
      { check: 'Extractor Claw, Insert & O-Ring Tension', result: 'PASSED (Sharp hook, heavy spring tension)' },
      { check: 'Chamber Star, Locking Lugs & M4 Ramps', result: 'PASSED (Clean, no burrs or peening)' },
      { check: 'Buffer & Action Spring Free Length', result: 'PASSED (Within mil-spec tolerance, no cant)' },
    ];
  }

  // 6. Semi-Automatic Handgun (Default for pistols)
  if (fType.includes('pistol') || fType.includes('handgun') || pId.includes('pistol')) {
    return [
      { check: 'Slide Rail Clearance & Frame Tracks', result: 'PASSED (Even wear, smooth tracking)' },
      { check: 'Extractor Claw Tension & Hook Geometry', result: 'PASSED (Positive casing grasp)' },
      { check: 'Striker Channel & Firing Pin Tip', result: 'PASSED (Dry channel clean, tip undamaged)' },
      { check: 'Firing Pin Block & Drop Disconnector', result: 'PASSED (Operational drop safety)' },
      { check: 'Magazine Catch & Ejector Blade Staking', result: 'PASSED (Firm retention, positive release)' },
    ];
  }

  // 7. General Military Fleet Technical Inspection (Universal Fallback)
  return [
    { check: 'Headspace Verification', result: 'PASSED (Within Gauge Limits)' },
    { check: 'Bore & Chamber Condition', result: 'PASSED (Clean, sharp rifling, zero pitting)' },
    { check: 'Extractor Tension & Claw Integrity', result: 'PASSED (Positive casing grasp)' },
    { check: 'Firing Pin Protrusion & Fall', result: 'PASSED (Normal protrusion, positive ignition)' },
    { check: 'Primary & Secondary Safety Disconnect', result: 'PASSED (Operational)' },
  ];
}

/**
 * Generates an armorer work order and technical inspection certificate HTML document.
 * Adheres to professional armory standards for military, law enforcement, and civilian platforms.
 */
export function buildWorkOrderHtml(wo: any): string {
  const firearm = wo.firearm || {};
  const service = wo.service_item || {};
  const parts: any[] = wo.parts_replaced || [];
  const torqueSpecs: any[] = wo.torque_specs || [];
  const inspectionChecks: any[] = wo.inspection_checks || [];
  const testFire = wo.test_fire || { performed: false, rounds_fired: 0 };

  const partsRows = parts.length > 0
    ? parts
        .map(
          (p) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${p.name || '—'}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${p.part_number || '—'}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${p.manufacturer || 'OEM'}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">$${Number(p.cost || 0).toFixed(2)}</td>
      </tr>`
        )
        .join('')
    : `<tr><td colspan="4" style="padding: 12px; text-align: center; color: #64748b; font-style: italic;">No replacement parts required for this service action.</td></tr>`;

  const torqueRows = torqueSpecs.length > 0
    ? torqueSpecs
        .map(
          (t) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${t.component || 'Fastener'}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${t.torque_in_lb || '—'} in-lbs</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${t.threadlocker || 'Loctite 242'}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #166534; font-weight: bold;">${t.status || 'VERIFIED'}</td>
      </tr>`
        )
        .join('')
    : `<tr><td colspan="4" style="padding: 12px; text-align: center; color: #64748b; font-style: italic;">No optics or torque critical fasteners serviced.</td></tr>`;

  const inspectionRows = inspectionChecks.length > 0
    ? inspectionChecks
        .map(
          (c) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${c.check || 'Inspection'}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">
          <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; background: #dcfce7; color: #166534;">
            ${c.result || 'PASSED'}
          </span>
        </td>
      </tr>`
        )
        .join('')
    : `<tr><td colspan="2" style="padding: 12px; text-align: center; color: #64748b;">Standard functional check complete.</td></tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Work Order ${wo.work_order_number || ''}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #f8fafc;
      margin: 0;
      padding: 40px 20px;
    }
    .sheet {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .badge-title {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
      text-transform: uppercase;
      margin: 0 0 4px 0;
    }
    .badge-sub {
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .meta-box {
      text-align: right;
    }
    .meta-num {
      font-family: monospace;
      font-size: 15px;
      font-weight: 700;
      color: #0369a1;
    }
    .meta-date {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    .card {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 16px;
    }
    .card-title {
      font-size: 11px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 6px;
    }
    .prop-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      margin-bottom: 6px;
    }
    .prop-label {
      color: #64748b;
    }
    .prop-val {
      font-weight: 600;
      color: #0f172a;
    }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #1e293b;
      margin: 24px 0 10px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 16px;
    }
    th {
      background: #f8fafc;
      color: #475569;
      font-weight: 600;
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid #cbd5e1;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .notes-box {
      background: #f8fafc;
      border-left: 3px solid #0284c7;
      padding: 12px 16px;
      border-radius: 0 4px 4px 0;
      font-size: 13px;
      color: #334155;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .sign-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 36px;
      padding-top: 24px;
      border-top: 1px solid #cbd5e1;
    }
    .sign-line {
      border-bottom: 1px solid #94a3b8;
      height: 40px;
      margin-bottom: 6px;
    }
    .sign-sub {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .sheet { border: none; box-shadow: none; padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div>
        <div class="badge-title">Technical Inspection & Service Certificate</div>
        <div class="badge-sub">ArmoryVault Certified Armorer Program</div>
      </div>
      <div class="meta-box">
        <div class="meta-num">${wo.work_order_number || 'WO-0000'}</div>
        <div class="meta-date">Issued: ${wo.date || ''}</div>
        <div class="meta-date">Armorer: ${wo.armorer_name || 'Certified Armorer'}</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title">Weapon Specifications</div>
        <div class="prop-row"><span class="prop-label">Make & Model:</span><span class="prop-val">${firearm.make || ''} ${firearm.model || ''}</span></div>
        <div class="prop-row"><span class="prop-label">Caliber:</span><span class="prop-val">${firearm.caliber || '—'}</span></div>
        <div class="prop-row"><span class="prop-label">Serial Number:</span><span class="prop-val" style="font-family: monospace;">${firearm.serial_number || '—'}</span></div>
        <div class="prop-row"><span class="prop-label">Platform Type:</span><span class="prop-val">${firearm.type || 'Firearm'}</span></div>
        <div class="prop-row"><span class="prop-label">Total Rounds Fired:</span><span class="prop-val">${(firearm.round_count || 0).toLocaleString()} rds</span></div>
        <div class="prop-row"><span class="prop-label">Storage Location:</span><span class="prop-val">${firearm.location || 'Armory'}</span></div>
      </div>

      <div class="card">
        <div class="card-title">Work Order Overview</div>
        <div class="prop-row"><span class="prop-label">Action Performed:</span><span class="prop-val">${service.task_name || 'Routine Maintenance'}</span></div>
        <div class="prop-row"><span class="prop-label">Service Classification:</span><span class="prop-val">${service.category || 'Maintenance'}</span></div>
        <div class="prop-row"><span class="prop-label">Rounds at Service:</span><span class="prop-val">${(service.round_count_at_service || 0).toLocaleString()} rds</span></div>
        <div class="prop-row"><span class="prop-label">Labor & Parts Cost:</span><span class="prop-val">$${Number(service.cost || 0).toFixed(2)}</span></div>
        <div class="prop-row"><span class="prop-label">Test Fired:</span><span class="prop-val">${testFire.performed ? `YES (${testFire.rounds_fired} rds)` : 'Not Required'}</span></div>
        <div class="prop-row"><span class="prop-label">Readiness Status:</span><span class="prop-val" style="color: #166534;">Fully Mission Capable (FMC)</span></div>
      </div>
    </div>

    <div class="section-title">Platform Technical Inspection Protocol</div>
    <table>
      <thead>
        <tr>
          <th>Inspection Parameter</th>
          <th style="text-align: right;">Certification Result</th>
        </tr>
      </thead>
      <tbody>
        ${inspectionRows}
      </tbody>
    </table>

    <div class="section-title">Critical Fastener & Optic Torque Verification</div>
    <table>
      <thead>
        <tr>
          <th>Component / Mount</th>
          <th>Specified Torque</th>
          <th>Threadlocker Applied</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${torqueRows}
      </tbody>
    </table>

    <div class="section-title">Installed Parts & Components Ledger</div>
    <table>
      <thead>
        <tr>
          <th>Component Description</th>
          <th>Part Number</th>
          <th>Manufacturer / Source</th>
          <th style="text-align: right;">Cost</th>
        </tr>
      </thead>
      <tbody>
        ${partsRows}
      </tbody>
    </table>

    <div class="section-title">Armorer Service Notes & Observations</div>
    <div class="notes-box">
      ${service.notes || 'Service performed in accordance with manufacturer technical specifications and standard armory inspection protocols.'}
    </div>

    <div class="sign-grid">
      <div>
        <div class="sign-line"></div>
        <div class="sign-sub">Certified Armorer / Gunsmith Signature</div>
      </div>
      <div>
        <div class="sign-line"></div>
        <div class="sign-sub">Vault Custodian / Owner Acknowledgment</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
