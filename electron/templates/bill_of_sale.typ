// Typst 0.15 Template — Professional Firearm Bill of Sale
// Single-Page Guaranteed Legal Layout

#let data = json(bytes(sys.inputs.at("data", default: "{}")))

#set page(
  paper: "us-letter",
  margin: (x: 0.45in, top: 0.4in, bottom: 0.35in),
  footer: [
    #line(length: 100%, stroke: 0.5pt + luma(180))
    #v(-2pt)
    #grid(
      columns: (1fr, 1fr),
      align: (left, right),
      text(size: 6.5pt, fill: luma(100))[
        Generated via ArmsTrader.store • Not legal advice • Retain for personal records
      ],
      text(size: 6.5pt, fill: luma(100))[
        Doc Ref: #data.at("doc_id", default: "AT-BOS-2026") • Date: #data.at("date", default: "")
      ]
    )
  ]
)

#set text(
  font: ("Helvetica Neue", "Arial"),
  size: 8.5pt,
  fill: rgb("#111827")
)

// Header Banner
#align(center)[
  #text(size: 15pt, weight: "bold", tracking: 0.05em, fill: rgb("#0f172a"))[
    FIREARM BILL OF SALE & TRANSFER RECORD
  ]
  #v(-4pt)
  #text(size: 7.5pt, fill: rgb("#475569"))[
    Private Party Intrastate Firearm Transfer Documentation • In Compliance with 18 U.S.C. § 922
  ]
]

#v(2pt)
#line(length: 100%, stroke: 1.5pt + rgb("#0f172a"))
#v(4pt)

// Section 1: Transaction Metadata
#rect(
  width: 100%,
  fill: rgb("#f8fafc"),
  stroke: 0.5pt + rgb("#cbd5e1"),
  radius: 4pt,
  inset: 7pt
)[
  #grid(
    columns: (1.2fr, 1fr, 1.2fr, 1.4fr),
    gutter: 8pt,
    [
      #text(size: 7pt, weight: "bold", fill: rgb("#64748b"))[DATE OF TRANSFER]\
      #text(weight: "bold", size: 9pt)[#data.at("date", default: "N/A")]
    ],
    [
      #text(size: 7pt, weight: "bold", fill: rgb("#64748b"))[PURCHASE PRICE]\
      #text(weight: "bold", size: 9pt, fill: rgb("#047857"))[#data.at("price", default: "$0.00")]
    ],
    [
      #text(size: 7pt, weight: "bold", fill: rgb("#64748b"))[PAYMENT METHOD]\
      #text(size: 8.5pt)[#data.at("payment_method", default: "Cash")]
    ],
    [
      #text(size: 7pt, weight: "bold", fill: rgb("#64748b"))[LOCATION OF SALE]\
      #text(size: 8.5pt)[
        #let city = data.at("city", default: "")
        #let county = data.at("county", default: "")
        #let state = data.at("state", default: "")
        #if city != "" [#city, ]
        #if county != "" [#county, ]
        #state
      ]
    ]
  )
]

#v(4pt)

// Section 2: Firearm Description
#text(size: 8pt, weight: "bold", fill: rgb("#0f172a"))[1. FIREARM IDENTIFICATION]
#v(-2pt)
#table(
  columns: (1.4fr, 1.4fr, 1.6fr, 1fr, 1.4fr),
  stroke: 0.5pt + rgb("#cbd5e1"),
  fill: (_, row) => if row == 0 { rgb("#f1f5f9") } else { none },
  inset: 5pt,
  align: horizon,
  table.header(
    [*Make / Manufacturer*],
    [*Model*],
    [*Serial Number*],
    [*Caliber / Gauge*],
    [*Action / Type*]
  ),
  data.at("make", default: "-"),
  data.at("model", default: "-"),
  text(font: "Courier", weight: "bold", size: 9pt)[#data.at("serial", default: "-")],
  data.at("caliber", default: "-"),
  data.at("action_type", default: "-")
)

#if data.at("accessories", default: "") != "" [
  #v(-2pt)
  #rect(width: 100%, fill: rgb("#f8fafc"), stroke: 0.5pt + rgb("#e2e8f0"), radius: 2pt, inset: 4pt)[
    #text(size: 7pt, weight: "bold", fill: rgb("#64748b"))[INCLUDED ACCESSORIES / OPTICS: ]
    #text(size: 8pt)[#data.at("accessories")]
  ]
]

#v(4pt)

// Section 3: Buyer and Seller Side-by-Side
#text(size: 8pt, weight: "bold", fill: rgb("#0f172a"))[2. PARTIES TO TRANSACTION]
#v(-2pt)
#grid(
  columns: (1fr, 1fr),
  gutter: 10pt,
  // Seller Column
  rect(width: 100%, stroke: 0.75pt + rgb("#94a3b8"), radius: 4pt, inset: 7pt)[
    #text(size: 8pt, weight: "bold", fill: rgb("#1e293b"))[SELLER (TRANSFEROR)]
    #v(3pt)
    #grid(
      columns: (1fr),
      gutter: 3pt,
      [#text(size: 6.5pt, fill: rgb("#64748b"))[LEGAL NAME:] #strong(data.at("seller_name", default: "-"))],
      [#text(size: 6.5pt, fill: rgb("#64748b"))[ADDRESS:] #data.at("seller_address", default: "-")],
      [#text(size: 6.5pt, fill: rgb("#64748b"))[CITY, ST, ZIP:] #data.at("seller_city_state_zip", default: "-")],
      [#text(size: 6.5pt, fill: rgb("#64748b"))[PHONE:] #data.at("seller_phone", default: "-")],
      [#text(size: 6.5pt, fill: rgb("#64748b"))[GOV ID / CCW \#:] #data.at("seller_id", default: "-") (#text(size: 6.5pt)[Exp:] #data.at("seller_id_exp", default: "-"))],
    )
  ],
  // Buyer Column
  rect(width: 100%, stroke: 0.75pt + rgb("#94a3b8"), radius: 4pt, inset: 7pt)[
    #text(size: 8pt, weight: "bold", fill: rgb("#1e293b"))[BUYER (TRANSFEREE)]
    #v(3pt)
    #grid(
      columns: (1fr),
      gutter: 3pt,
      [#text(size: 6.5pt, fill: rgb("#64748b"))[LEGAL NAME:] #strong(data.at("buyer_name", default: "-"))],
      [#text(size: 6.5pt, fill: rgb("#64748b"))[ADDRESS:] #data.at("buyer_address", default: "-")],
      [#text(size: 6.5pt, fill: rgb("#64748b"))[CITY, ST, ZIP:] #data.at("buyer_city_state_zip", default: "-")],
      [#text(size: 6.5pt, fill: rgb("#64748b"))[PHONE:] #data.at("buyer_phone", default: "-")],
      [#text(size: 6.5pt, fill: rgb("#64748b"))[GOV ID / CCW \#:] #data.at("buyer_id", default: "-") (#text(size: 6.5pt)[Exp:] #data.at("buyer_id_exp", default: "-"))],
    )
  ]
)

#if data.at("state_notice", default: "") != "" [
  #v(2pt)
  #rect(
    width: 100%,
    fill: if data.at("ffl_required", default: false) { rgb("#fef2f2") } else { rgb("#f0fdf4") },
    stroke: 0.5pt + if data.at("ffl_required", default: false) { rgb("#f87171") } else { rgb("#86efac") },
    radius: 3pt,
    inset: 4.5pt
  )[
    #text(size: 6.5pt, weight: "bold", fill: if data.at("ffl_required", default: false) { rgb("#991b1b") } else { rgb("#166534") })[
      STATE LAW COMPLIANCE NOTICE (#data.at("state", default: "")):
    ]
    #text(size: 6.5pt, fill: rgb("#334155"))[#data.at("state_notice")]
  ]
]

#v(4pt)

// Section 4: Legal Representations & Warranties
#text(size: 8pt, weight: "bold", fill: rgb("#0f172a"))[3. LEGAL DECLARATIONS & WARRANTIES (18 U.S.C. § 922)]
#v(-2pt)
#rect(width: 100%, stroke: 0.5pt + rgb("#cbd5e1"), fill: rgb("#fafafa"), radius: 4pt, inset: 6pt)[
  #set text(size: 6.8pt, fill: rgb("#334155"))
  #set par(leading: 0.55em)
  #grid(
    columns: (1fr),
    gutter: 3pt,
    [
      *A. SELLER'S WARRANTY:* Seller certifies under penalty of law that they are the lawful and sole owner of the firearm described herein; that the firearm is free and clear of all liens, mortgages, and encumbrances; and to Seller's best knowledge, has never been lost, stolen, or used in any unlawful activity.
    ],
    [
      *B. BUYER'S CERTIFICATION (FEDERAL NON-PROHIBITED PERSON STATUS):* Buyer certifies under penalty of perjury that: (1) Buyer is of lawful age (at least 21 for handguns / 18 for long guns) and a bona fide resident of the state where this transfer takes place; (2) Buyer is NOT a prohibited person under 18 U.S.C. § 922(g), including having never been convicted of a felony or misdemeanor crime of domestic violence; is not under indictment; is not an unlawful user of or addicted to any controlled substance; has not been adjudicated mentally defective; and has never been dishonorably discharged; and (3) Buyer is purchasing this firearm for lawful sporting, defense, or collection purposes.
    ],
    [
      *C. AS-IS CONDITION:* The firearm is sold in "as-is" condition with all faults. Seller makes no express or implied warranties of merchantability or fitness for a particular purpose beyond ownership.
    ]
  )
]

#v(4pt)

// Section 5: Signatures
#text(size: 8pt, weight: "bold", fill: rgb("#0f172a"))[4. SIGNATURES & ACKNOWLEDGMENT]
#v(-2pt)
#grid(
  columns: (1fr, 1fr),
  gutter: 10pt,
  // Seller Signature Box
  rect(width: 100%, stroke: 0.75pt + rgb("#94a3b8"), radius: 4pt, inset: 6pt)[
    #text(size: 7pt, weight: "bold", fill: rgb("#64748b"))[SELLER SIGNATURE:]\
    #v(2pt)
    #align(center + horizon)[
      #let seller-sig = data.at("seller_sig_file", default: "")
      #if seller-sig != "" [
        #image(seller-sig, height: 32pt)
      ] else [
        #v(32pt)
      ]
    ]
    #line(length: 100%, stroke: 0.5pt + rgb("#94a3b8"))
    #v(-2pt)
    #grid(
      columns: (1fr, 1fr),
      text(size: 6.5pt)[Printed: #data.at("seller_name", default: "")],
      align(right, text(size: 6.5pt)[Date: #data.at("date", default: "")])
    )
  ],
  // Buyer Signature Box
  rect(width: 100%, stroke: 0.75pt + rgb("#94a3b8"), radius: 4pt, inset: 6pt)[
    #text(size: 7pt, weight: "bold", fill: rgb("#64748b"))[BUYER SIGNATURE:]\
    #v(2pt)
    #align(center + horizon)[
      #let buyer-sig = data.at("buyer_sig_file", default: "")
      #if buyer-sig != "" [
        #image(buyer-sig, height: 32pt)
      ] else [
        #v(32pt)
      ]
    ]
    #line(length: 100%, stroke: 0.5pt + rgb("#94a3b8"))
    #v(-2pt)
    #grid(
      columns: (1fr, 1fr),
      text(size: 6.5pt)[Printed: #data.at("buyer_name", default: "")],
      align(right, text(size: 6.5pt)[Date: #data.at("date", default: "")])
    )
  ]
)
