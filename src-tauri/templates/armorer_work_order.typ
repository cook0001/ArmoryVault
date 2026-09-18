// Typst 0.15 Template — ArmoryVault Professional Armorer Work Order & Inspection Certificate
// High-Resolution Publication-Grade Vector PDF Report

#let data = json(bytes(sys.inputs.at("data", default: "{}")))

#set page(
  paper: "us-letter",
  margin: (x: 0.5in, top: 0.5in, bottom: 0.5in),
  header: [
    #grid(
      columns: (1.5fr, 1fr),
      align: (left, right),
      text(size: 7.5pt, fill: rgb("#64748b"), weight: "bold")[
        ARMORYVAULT ARMORER SUITE • OFFICIAL WORK ORDER & SERVICE RECORD
      ],
      text(size: 7.5pt, fill: rgb("#64748b"))[
        Work Order: #data.at("work_order_number", default: "WO-RECORD") • Date: #data.at("date", default: "N/A")
      ]
    )
    #v(-4pt)
    #line(length: 100%, stroke: 0.5pt + rgb("#cbd5e1"))
  ],
  footer: [
    #line(length: 100%, stroke: 0.5pt + rgb("#cbd5e1"))
    #v(-2pt)
    #grid(
      columns: (1.5fr, 1fr, 1fr),
      align: (left, center, right),
      text(size: 6.5pt, fill: rgb("#94a3b8"))[
        Certified Armorer Technical Document • Zero-Cloud ArmoryVault System
      ],
      text(size: 6.5pt, fill: rgb("#94a3b8"))[
        Armorer: #data.at("armorer_name", default: "Certified Armorer")
      ],
      text(size: 6.5pt, fill: rgb("#94a3b8"))[
        #context counter(page).display("Page 1 of 1", both: true)
      ]
    )
  ]
)

#set text(
  font: ("Helvetica Neue", "Arial"),
  size: 8.5pt,
  fill: rgb("#0f172a")
)

// ══════════════════════════════════════════════════════════════════════════
// HEADER BLOCK: ARMORER WORK ORDER & INSPECTION CERTIFICATE
// ══════════════════════════════════════════════════════════════════════════

#align(center)[
  #v(6pt)
  #rect(fill: rgb("#0f172a"), radius: 4pt, inset: (x: 14pt, y: 5pt))[
    #text(fill: white, size: 8.5pt, weight: "bold", tracking: 0.1em)[ARMORER SERVICE CERTIFICATE]
  ]
  #v(2pt)
  #text(size: 18pt, weight: "bold", fill: rgb("#0f172a"))[
    ARMORER WORK ORDER & SERVICE REPORT
  ]
  #v(-2pt)
  #text(size: 9pt, fill: rgb("#64748b"))[
    Comprehensive Firearm Maintenance, Precision Torque Verification, and Quality Inspection Record
  ]
]

#v(8pt)

// ══════════════════════════════════════════════════════════════════════════
// FIREARM & SERVICE IDENTIFICATION DOSSIER
// ══════════════════════════════════════════════════════════════════════════

#let firearm = data.at("firearm", default: (:))
#let service = data.at("service_item", default: (:))

#rect(
  width: 100%,
  stroke: 1pt + rgb("#0284c7"),
  fill: rgb("#f0f9ff"),
  radius: 6pt,
  inset: 10pt
)[
  #grid(
    columns: (1fr, 1fr, 1fr),
    gutter: 10pt,
    [
      #text(weight: "bold", size: 8pt, fill: rgb("#0369a1"))[FIREARM IDENTIFICATION] \
      #v(2pt)
      #text(size: 11pt, weight: "bold", fill: rgb("#0f172a"))[
        #firearm.at("make", default: "Unknown") #firearm.at("model", default: "")
      ] \
      #text(size: 8pt, fill: rgb("#475569"))[
        Caliber: *#firearm.at("caliber", default: "N/A")* \
        Serial Number: *#firearm.at("serial_number", default: "N/A")* \
        Platform / Type: #firearm.at("type", default: "Firearm")
      ]
    ],
    [
      #text(weight: "bold", size: 8pt, fill: rgb("#0369a1"))[LIFETIME TELEMETRY] \
      #v(2pt)
      #text(size: 11pt, weight: "bold", fill: rgb("#0284c7"))[
        #str(firearm.at("round_count", default: 0)) Rounds Fired
      ] \
      #text(size: 8pt, fill: rgb("#475569"))[
        Storage Location: #firearm.at("location", default: "Vault") \
        Condition Grade: #firearm.at("condition", default: "Excellent") \
        Service Baseline: #str(service.at("round_count_at_service", default: 0)) rds
      ]
    ],
    [
      #text(weight: "bold", size: 8pt, fill: rgb("#0369a1"))[SERVICE DETAILS] \
      #v(2pt)
      #text(size: 10pt, weight: "bold", fill: rgb("#0f172a"))[
        #service.at("task_name", default: "Maintenance Service")
      ] \
      #text(size: 8pt, fill: rgb("#475569"))[
        Service Category: #service.at("category", default: "Routine Maintenance") \
        Completed: *#service.at("completed_date", default: data.at("date", default: "N/A"))* \
        Armorer / Tech: *#data.at("armorer_name", default: "Staff Armorer")*
      ]
    ]
  )
]

#v(8pt)

// ══════════════════════════════════════════════════════════════════════════
// SERVICE LOG & WORK PERFORMED DETAILS
// ══════════════════════════════════════════════════════════════════════════

#text(weight: "bold", size: 10pt, fill: rgb("#0f172a"))[WORK COMPLETED & ARMORER NOTES]
#v(3pt)

#rect(
  width: 100%,
  stroke: 0.5pt + rgb("#cbd5e1"),
  fill: rgb("#f8fafc"),
  radius: 4pt,
  inset: 8pt
)[
  #text(size: 8.5pt, fill: rgb("#1e293b"))[
    #service.at("notes", default: "Standard maintenance protocol executed according to armorer factory specifications.")
  ]
]

#v(8pt)

// ══════════════════════════════════════════════════════════════════════════
// PARTS REPLACED & BILL OF MATERIALS (BOM)
// ══════════════════════════════════════════════════════════════════════════

#let parts = data.at("parts_replaced", default: ())
#if parts.len() > 0 [
  #text(weight: "bold", size: 10pt, fill: rgb("#0f172a"))[PARTS REPLACED & BILL OF MATERIALS]
  #v(3pt)

  #table(
    columns: (2.5fr, 1.5fr, 1.2fr, 1fr),
    fill: (_, row) => if row == 0 { rgb("#0f172a") } else if calc.even(row) { rgb("#f8fafc") } else { white },
    stroke: (x, y) => if y == 0 { none } else { 0.5pt + rgb("#e2e8f0") },
    inset: (x: 8pt, y: 5pt),
    align: (col, _) => if col == 3 { right } else { left },

    table.header(
      text(fill: white, weight: "bold", size: 8pt)[Part Description],
      text(fill: white, weight: "bold", size: 8pt)[Part Number / SKU],
      text(fill: white, weight: "bold", size: 8pt)[Manufacturer],
      text(fill: white, weight: "bold", size: 8pt)[Cost]
    ),

    ..parts.map(p => (
      text(weight: "bold", size: 8pt)[#p.at("name", default: "Component")],
      text(fill: rgb("#475569"), size: 8pt)[#p.at("part_number", default: "—")],
      text(fill: rgb("#475569"), size: 8pt)[#p.at("manufacturer", default: "OEM")],
      text(weight: "bold", size: 8pt)[
        #if type(p.at("cost", default: 0)) == float or type(p.at("cost", default: 0)) == int {
          [\$#str(p.at("cost", default: 0))]
        } else {
          [\$#p.at("cost", default: "0.00")]
        }
      ]
    )).flatten()
  )
  #v(4pt)
]

// ══════════════════════════════════════════════════════════════════════════
// PRECISION TORQUE & OPTIC SPECIFICATIONS (IF PRESENT)
// ══════════════════════════════════════════════════════════════════════════

#let torques = data.at("torque_specs", default: ())
#if torques.len() > 0 [
  #text(weight: "bold", size: 10pt, fill: rgb("#0f172a"))[PRECISION TORQUE & MOUNTING SPECIFICATIONS]
  #v(3pt)

  #table(
    columns: (2.2fr, 1.2fr, 1.5fr, 1fr),
    fill: (_, row) => if row == 0 { rgb("#1e293b") } else if calc.even(row) { rgb("#f8fafc") } else { white },
    stroke: (x, y) => if y == 0 { none } else { 0.5pt + rgb("#e2e8f0") },
    inset: (x: 8pt, y: 5pt),
    align: (col, _) => if col == 1 or col == 3 { center } else { left },

    table.header(
      text(fill: white, weight: "bold", size: 8pt)[Fastener / Mounting Component],
      text(fill: white, weight: "bold", size: 8pt)[Torque Spec],
      text(fill: white, weight: "bold", size: 8pt)[Threadlocker Applied],
      text(fill: white, weight: "bold", size: 8pt)[Status]
    ),

    ..torques.map(t => (
      text(weight: "bold", size: 8pt)[#t.at("component", default: "Mount Fasteners")],
      text(fill: rgb("#0284c7"), weight: "bold", size: 8pt)[#str(t.at("torque_in_lb", default: "—")) in-lb],
      text(fill: rgb("#475569"), size: 8pt)[#t.at("threadlocker", default: "Loctite 242 (Blue)")],
      text(fill: rgb("#16a34a"), weight: "bold", size: 8pt)[#t.at("status", default: "VERIFIED")]
    )).flatten()
  )
  #v(4pt)
]

// ══════════════════════════════════════════════════════════════════════════
// TEST FIRE & DIAGNOSTIC TELEMETRY (IF RECORDED)
// ══════════════════════════════════════════════════════════════════════════

#let testFire = data.at("test_fire", default: (:))
#if testFire.at("performed", default: false) or testFire.at("rounds_fired", default: 0) > 0 [
  #text(weight: "bold", size: 10pt, fill: rgb("#0f172a"))[TEST FIRE & FUNCTION VERIFICATION]
  #v(3pt)

  #rect(
    width: 100%,
    stroke: 1pt + rgb("#16a34a"),
    fill: rgb("#f0fdf4"),
    radius: 4pt,
    inset: 8pt
  )[
    #grid(
      columns: (1fr, 1fr, 1fr, 1fr),
      gutter: 8pt,
      [
        #text(size: 7.5pt, fill: rgb("#15803d"), weight: "bold")[ROUNDS FIRED] \
        #text(size: 11pt, weight: "bold", fill: rgb("#0f172a"))[
          #str(testFire.at("rounds_fired", default: 0)) rds
        ] \
        #text(size: 7pt, fill: rgb("#64748b"))[
          Ammo: #testFire.at("ammo_used", default: "Factory 124gr")
        ]
      ],
      [
        #text(size: 7.5pt, fill: rgb("#15803d"), weight: "bold")[CHRONO VELOCITY] \
        #text(size: 11pt, weight: "bold", fill: rgb("#0f172a"))[
          #str(testFire.at("avg_velocity", default: "N/A")) fps
        ] \
        #text(size: 7pt, fill: rgb("#64748b"))[
          SD: #str(testFire.at("std_deviation", default: "—")) • ES: #str(testFire.at("extreme_spread", default: "—"))
        ]
      ],
      [
        #text(size: 7.5pt, fill: rgb("#15803d"), weight: "bold")[TARGET ACCURACY] \
        #text(size: 11pt, weight: "bold", fill: rgb("#0f172a"))[
          #str(testFire.at("group_size_moa", default: "—")) MOA
        ] \
        #text(size: 7pt, fill: rgb("#64748b"))[
          Spread: #str(testFire.at("extreme_spread_in", default: "—")) in
        ]
      ],
      [
        #text(size: 7.5pt, fill: rgb("#15803d"), weight: "bold")[FUNCTION STATUS] \
        #text(size: 11pt, weight: "bold", fill: rgb("#16a34a"))[
          #testFire.at("pass_status", default: "FUNCTIONAL")
        ] \
        #text(size: 7pt, fill: rgb("#64748b"))[
          #str(testFire.at("malfunctions", default: 0)) Malfunctions
        ]
      ]
    )
  ]
  #v(4pt)
]

// ══════════════════════════════════════════════════════════════════════════
// SAFETY & QUALITY INSPECTION CHECKLIST
// ══════════════════════════════════════════════════════════════════════════

#let checks = data.at("inspection_checks", default: (
  (check: "Headspace Verification", result: "PASSED (Within Go/No-Go Gauge Limits)"),
  (check: "Bore, Chamber & Crown Condition", result: "PASSED (Clean, sharp rifling, zero erosion)"),
  (check: "Extractor Tension & Ejector Alignment", result: "PASSED (Positive casing extraction & ejection)"),
  (check: "Firing Pin Integrity & Protrusion", result: "PASSED (Tip smooth, channel free of fouling)"),
  (check: "Drop Safety & Disconnector Function", result: "PASSED (All mechanical safeties operational)")
))

#text(weight: "bold", size: 10pt, fill: rgb("#0f172a"))[MULTI-POINT SAFETY & INTEGRITY INSPECTION]
#v(3pt)

#grid(
  columns: (1fr, 1fr),
  gutter: 6pt,
  ..checks.map(c => [
    #rect(
      width: 100%,
      stroke: 0.5pt + rgb("#cbd5e1"),
      fill: rgb("#f8fafc"),
      radius: 4pt,
      inset: (x: 8pt, y: 5pt)
    )[
      #grid(
        columns: (1fr, auto),
        align: (left, right),
        text(size: 8pt, weight: "bold", fill: rgb("#1e293b"))[#c.at("check", default: "Check")],
        text(size: 7.5pt, weight: "bold", fill: rgb("#16a34a"))[#c.at("result", default: "PASSED")]
      )
    ]
  ])
)

#v(10pt)

// ══════════════════════════════════════════════════════════════════════════
// ARMORER CERTIFICATION & SIGN-OFF BLOCK
// ══════════════════════════════════════════════════════════════════════════

#rect(
  width: 100%,
  stroke: 1pt + rgb("#334155"),
  fill: white,
  radius: 6pt,
  inset: 10pt
)[
  #text(size: 7.5pt, fill: rgb("#475569"))[
    *CERTIFICATION STATEMENT:* I hereby certify that the firearm listed above has been inspected, serviced, and tested in accordance with factory armorer specifications. All replacement components installed are factory-spec or certified aftermarket upgrades, and all fasteners were torqued to specified inch-pound ratings. The firearm is deemed safe and fully operational for duty or field service.
  ]
  #v(14pt)
  #grid(
    columns: (1.5fr, 1fr, 1fr),
    gutter: 14pt,
    [
      #line(length: 100%, stroke: 0.5pt + rgb("#0f172a"))
      #v(-3pt)
      #text(size: 7.5pt, weight: "bold", fill: rgb("#0f172a"))[Certified Armorer Signature] \
      #text(size: 7pt, fill: rgb("#64748b"))[#data.at("armorer_name", default: "Staff Armorer")]
    ],
    [
      #line(length: 100%, stroke: 0.5pt + rgb("#0f172a"))
      #v(-3pt)
      #text(size: 7.5pt, weight: "bold", fill: rgb("#0f172a"))[Certification / Badge / FFL No.] \
      #text(size: 7pt, fill: rgb("#64748b"))[#data.at("cert_number", default: "AV-ARMORER-CERT")]
    ],
    [
      #line(length: 100%, stroke: 0.5pt + rgb("#0f172a"))
      #v(-3pt)
      #text(size: 7.5pt, weight: "bold", fill: rgb("#0f172a"))[Date of Inspection] \
      #text(size: 7pt, fill: rgb("#64748b"))[#data.at("date", default: "N/A")]
    ]
  )
]
