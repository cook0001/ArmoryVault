// Typst 0.15 Template — ArmoryVault Comprehensive Insurance Appraisal & Armory Catalog
// Multi-Page Publication-Grade Vector PDF Layout

#let data = json(bytes(sys.inputs.at("data", default: "{}")))

#set page(
  paper: "us-letter",
  margin: (x: 0.5in, top: 0.5in, bottom: 0.5in),
  header: [
    #grid(
      columns: (1fr, 1fr),
      align: (left, right),
      text(size: 7pt, fill: rgb("#64748b"), weight: "bold")[
        ARMORYVAULT SECURE INVENTORY • CERTIFIED APPRAISAL BINDER
      ],
      text(size: 7pt, fill: rgb("#64748b"))[
        Confidential Document • Valuation Date: #data.at("date", default: "N/A")
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
        Generated via ArmoryVault • Encrypted Zero-Cloud Source of Truth
      ],
      text(size: 6.5pt, fill: rgb("#94a3b8"))[
        Owner: #data.at("owner_name", default: "Vault Holder")
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
// PAGE 1: EXECUTIVE VALUATION CERTIFICATE
// ══════════════════════════════════════════════════════════════════════════

#align(center)[
  #v(10pt)
  #rect(fill: rgb("#0f172a"), radius: 4pt, inset: (x: 14pt, y: 6pt))[
    #text(fill: white, size: 9pt, weight: "bold", tracking: 0.1em)[OFFICIAL APPRAISAL DOSSIER]
  ]
  #v(4pt)
  #text(size: 19pt, weight: "bold", fill: rgb("#0f172a"))[
    ARMORY VALUATION & INSURANCE MANIFEST
  ]
  #v(-2pt)
  #text(size: 8.5pt, fill: rgb("#475569"))[
    Itemized Firearms, NFA Class III / Form 4 Regulated Registry, Dedicated Optics, and Ammunition Reserves
  ]
  #v(8pt)
]

// Executive Summary Card
#rect(
  width: 100%,
  fill: rgb("#f8fafc"),
  stroke: 1pt + rgb("#3b82f6"),
  radius: 6pt,
  inset: 12pt
)[
  #grid(
    columns: (1.2fr, 1fr, 1fr, 1.4fr),
    gutter: 12pt,
    [
      #text(size: 7pt, weight: "bold", fill: rgb("#64748b"))[ESTIMATED TOTAL REPLACEMENT VALUE]\
      #text(size: 16pt, weight: "bold", fill: rgb("#10b981"))[\$#data.at("total_valuation", default: "0.00")]
    ],
    [
      #text(size: 7pt, weight: "bold", fill: rgb("#64748b"))[FIREARMS COUNT]\
      #text(size: 13pt, weight: "bold", fill: rgb("#0f172a"))[#data.at("firearms_count", default: "0") Items]
    ],
    [
      #text(size: 7pt, weight: "bold", fill: rgb("#64748b"))[AMMO RESERVE]\
      #text(size: 13pt, weight: "bold", fill: rgb("#0f172a"))[#data.at("ammo_rounds", default: "0") Rounds]
    ],
    [
      #text(size: 7pt, weight: "bold", fill: rgb("#64748b"))[POLICY / VAULT HOLDER]\
      #text(size: 10pt, weight: "bold", fill: rgb("#0f172a"))[#data.at("owner_name", default: "Verified Vault Record")]
    ]
  )
]

#v(10pt)
#text(size: 10pt, weight: "bold", fill: rgb("#0f172a"))[Asset Category Valuation Breakdown]
#v(2pt)

#table(
  columns: (2.5fr, 1.2fr, 1.2fr, 1.8fr),
  fill: (col, row) => if row == 0 { rgb("#0f172a") } else if calc.odd(row) { rgb("#f8fafc") } else { white },
  stroke: 0.5pt + rgb("#e2e8f0"),
  inset: 6pt,
  [#text(fill: white, weight: "bold", size: 8pt)[Inventory Category]],
  [#text(fill: white, weight: "bold", size: 8pt)[Item Count]],
  [#text(fill: white, weight: "bold", size: 8pt)[Appraised Value]],
  [#text(fill: white, weight: "bold", size: 8pt)[Coverage Classification]],

  [Firearms (Rifles, Handguns, Shotguns, Actions)],
  [#data.at("firearms_count", default: "0")],
  [\$#data.at("firearms_val", default: "0.00")],
  [Scheduled Personal Property],

  [Optics & Precision Aiming Devices],
  [#data.at("optics_count", default: "0")],
  [\$#data.at("optics_val", default: "0.00")],
  [Firearm Accessory Endorsement],

  [Ammunition Depot Reserves],
  [#data.at("ammo_rounds", default: "0") rds],
  [\$#data.at("ammo_val", default: "0.00")],
  [Consumable Armory Reserves],

  [NFA / Suppressors / Tax Stamp Assets],
  [#data.at("nfa_count", default: "0")],
  [\$#data.at("nfa_val", default: "0.00")],
  [ATF Registered Items],

  [Tactical Gear, Cases, Belts, Components],
  [#data.at("accessories_count", default: "0")],
  [\$#data.at("accessories_val", default: "0.00")],
  [Standard Vault Equipment]
)

#v(10pt)

// Legal Compliance & Insurance Declaration
#rect(
  width: 100%,
  stroke: 0.5pt + rgb("#cbd5e1"),
  radius: 4pt,
  inset: 9pt,
  fill: rgb("#ffffff")
)[
  #text(weight: "bold", size: 8pt)[Underwriter & Appraiser Attestation]\
  #v(2pt)
  #text(size: 7pt, fill: rgb("#475569"))[
    This document serves as an itemized, cryptographic record of personal firearm assets and valuations stored in the ArmoryVault encrypted local database. Serial numbers, make/model identifiers, condition ratings, and high-resolution multi-angle photographic evidence are indexed to satisfy proof-of-ownership and replacement-cost claim standards for commercial firearm insurance policies, estate planning ledgers, and ATF Curio & Relic compliance.
  ]
]

#v(14pt)
#grid(
  columns: (1fr, 1fr),
  gutter: 30pt,
  [
    #line(length: 100%, stroke: 0.5pt + rgb("#0f172a"))
    #text(size: 7pt, fill: rgb("#64748b"))[Appraiser / Policyholder Signature & Date]
  ],
  [
    #line(length: 100%, stroke: 0.5pt + rgb("#0f172a"))
    #text(size: 7pt, fill: rgb("#64748b"))[Insurance Agent / Carrier Acceptance Seal]
  ]
)

#pagebreak()

// ══════════════════════════════════════════════════════════════════════════
// PAGE 2+: ITEMIZED FIREARM ASSET LEDGER
// ══════════════════════════════════════════════════════════════════════════

#align(center)[
  #text(size: 13pt, weight: "bold", fill: rgb("#0f172a"))[ITEMIZED FIREARMS SCHEDULE & DETAIL SHEETS]
  #v(-3pt)
  #text(size: 7.5pt, fill: rgb("#64748b"))[Comprehensive Technical Specifications, Serialization, Condition Grading, and Replacement Valuations]
  #v(6pt)
]

#for item in data.at("firearms", default: ()) [
  #rect(
    width: 100%,
    stroke: 0.5pt + rgb("#cbd5e1"),
    radius: 4pt,
    inset: 8pt,
    fill: white
  )[
    #grid(
      columns: (1fr, auto),
      [
        #text(size: 11pt, weight: "bold", fill: rgb("#0f172a"))[
          #item.at("make", default: "") #item.at("model", default: "")
        ]
        #text(size: 8pt, fill: rgb("#64748b"))[
          • #item.at("caliber", default: "N/A") • Action: #item.at("action_type", default: "N/A")
        ]
      ],
      [
        #rect(fill: rgb("#ecfdf5"), stroke: 0.5pt + rgb("#10b981"), radius: 3pt, inset: (x: 6pt, y: 3pt))[
          #text(size: 9pt, weight: "bold", fill: rgb("#047857"))[
            Valuation: \$#item.at("replacement_price", default: "0.00")
          ]
        ]
      ]
    )

    #v(3pt)
    #line(length: 100%, stroke: 0.5pt + rgb("#f1f5f9"))
    #v(3pt)

    #grid(
      columns: (1.5fr, 1.2fr, 1.2fr, 1fr),
      gutter: 6pt,
      [
        #text(size: 6.5pt, fill: rgb("#64748b"), weight: "bold")[SERIAL NUMBER]\
        #text(size: 8.5pt, weight: "bold", font: "Courier")[#item.at("serial_number", default: "N/A")]
      ],
      [
        #text(size: 6.5pt, fill: rgb("#64748b"), weight: "bold")[CONDITION / FINISH]\
        #text(size: 8pt)[#item.at("condition", default: "Good") / #item.at("finish", default: "Standard")]
      ],
      [
        #text(size: 6.5pt, fill: rgb("#64748b"), weight: "bold")[PURCHASE DATE / COST]\
        #text(size: 8pt)[#item.at("purchase_date", default: "N/A") (\#\$#item.at("purchase_price", default: "0.00"))]
      ],
      [
        #text(size: 6.5pt, fill: rgb("#64748b"), weight: "bold")[ROUND COUNT]\
        #text(size: 8pt)[#item.at("round_count", default: "0") Rounds]
      ]
    )

    #if item.at("notes", default: "") != "" [
      #v(3pt)
      #text(size: 7pt, fill: rgb("#475569"))[*Notes / Mounted Equipment:* #item.at("notes")]
    ]
  ]
  #v(4pt)
]

#if data.at("nfa_items", default: ()).len() > 0 [
  #v(8pt)
  #text(size: 11pt, weight: "bold", fill: rgb("#0f172a"))[NFA / Class III ATF Regulated Equipment]
  #v(2pt)
  #table(
    columns: (2fr, 1.5fr, 1.5fr, 1fr, 1.5fr),
    fill: (col, row) => if row == 0 { rgb("#0f172a") } else if calc.odd(row) { rgb("#f8fafc") } else { white },
    stroke: 0.5pt + rgb("#e2e8f0"),
    inset: 5pt,
    [#text(fill: white, weight: "bold", size: 7.5pt)[Item Make & Model]],
    [#text(fill: white, weight: "bold", size: 7.5pt)[Serial Number]],
    [#text(fill: white, weight: "bold", size: 7.5pt)[Classification]],
    [#text(fill: white, weight: "bold", size: 7.5pt)[Tax Stamp]],
    [#text(fill: white, weight: "bold", size: 7.5pt)[Estimated Value]],
    ..data.at("nfa_items").map(n => (
      [#n.at("name", default: "")],
      [#text(font: "Courier", size: 7.5pt)[#n.at("serial", default: "N/A")]],
      [#n.at("type", default: "Suppressor / SBR")],
      [\$200 Paid],
      [\$#n.at("value", default: "0.00")]
    )).flatten()
  )
]
