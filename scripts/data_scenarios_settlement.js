// Settlement scenarios: 5 sub-branches * 3 scenarios each = 15 scenarios
// Sub-branches: Anmeldung & Registration, Banking & Finance, Healthcare System Access, 
// Housing & Tenancy, Social Integration
// (Focus on long-term settlement, permanent residency, civic rights, and institutional independence)

export const settlementScenarios = [
  // 1. Anmeldung & Registration
  {
    parent_domain: 'Settlement',
    sub_branch: 'Anmeldung & Registration',
    title: 'Applying for Permanent Settlement Permit (Niederlassungserlaubnis)',
    description: 'Submit an application for an unlimited permanent settlement permit at the immigration office (Ausländerbehörde) after fulfilling required residence and pension contributions.',
    min_level: 'B1',
    content: {
      target_phrases: [
        { german: 'Guten Tag, ich erfülle die gesetzlichen Voraussetzungen und möchte die Niederlassungserlaubnis beantragen.', english: 'Good day, I meet the legal prerequisites and would like to apply for the permanent settlement permit.' },
        { german: 'Ich habe den Nachweis der Deutschen Rentenversicherung über mindestens sechzig Monate geleistete Pflichtbeiträge mitgebracht.', english: 'I brought along the proof from the German Statutory Pension Insurance showing at least 60 months of paid compulsory contributions.' },
        { german: 'Hier sind meine letzten sechs Gehaltsabrechnungen, die aktuelle Arbeitgeberbestätigung und der unbefristete Arbeitsvertrag.', english: 'Here are my last six payslips, the current employer confirmation, and the permanent employment contract.' },
        { german: 'Mein B1-Sprachzertifikat sowie die Bescheinigung über den bestandenen Test Leben in Deutschland liegen in beglaubigter Kopie vor.', english: 'My B1 language certificate and certificate of passing the \'Life in Germany\' test are available in certified copies.' }
      ],
      example_sentences: [
        'Die Sachbearbeiterin prüft die ausreichende Wohnraumgröße anhand des Mietvertrags und der Mietzahlungsnachweise.',
        'Nach positiver Prüfung wird Ihnen die elektronische Aufenthaltstitelkarte (eAT) innerhalb von fünf Wochen ausgestellt.'
      ]
    }
  },
  {
    parent_domain: 'Settlement',
    sub_branch: 'Anmeldung & Registration',
    title: 'Submitting Documentation for German Naturalization (Einbürgerung)',
    description: 'Attend a consultation at the citizenship authority (Einbürgerungsbehörde) to review eligibility for naturalization, dual citizenship rules, and civic oaths.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Ich möchte meinen förmlichen Antrag auf Einbürgerung in den deutschen Staatsverband einreichen.', english: 'I would like to submit my formal application for naturalization into the German state citizenship.' },
        { german: 'Ich lebe seit über fünf Jahren rechtmäßig in Deutschland und bestreite meinen Lebensunterhalt vollständig ohne staatliche Sozialleistungen.', english: 'I have been living lawfully in Germany for over five years and support my livelihood entirely without state social benefits.' },
        { german: 'Nach der Reform des Staatsangehörigkeitsrechts ist die Beibehaltung meiner bisherigen Staatsbürgerschaft grundsätzlich möglich.', english: 'Following the reform of nationality law, retention of my previous citizenship is generally possible.' },
        { german: 'Ich bekenne mich feierlich zur freiheitlichen demokratischen Grundordnung des Grundgesetzes der Bundesrepublik Deutschland.', english: 'I solemnly declare my allegiance to the free democratic basic order of the Basic Law of the Federal Republic of Germany.' }
      ],
      example_sentences: [
        'Die Behörde holt im Rahmen der Sicherheitsüberprüfung Auskünfte beim Bundeszentralregister und Verfassungsschutz ein.',
        'Zur feierlichen Aushändigung der Einbürgerungsurkunde lädt die Stadtverwaltung zu einem offiziellen Festakt ein.'
      ]
    }
  },
  {
    parent_domain: 'Settlement',
    sub_branch: 'Anmeldung & Registration',
    title: 'Registering Child Birth & Notarizing Paternity at Standesamt',
    description: 'Coordinate birth registration, official birth certificate issuance, and voluntary paternity acknowledgment at the civil registry office.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Guten Tag, wir möchten die Geburt unseres Kindes beurkunden lassen und die Geburtsurkunden beantragen.', english: 'Good day, we would like to register the birth of our child and apply for the official birth certificates.' },
        { german: 'Hier ist die offizielle Geburtsanzeige der Entbindungsklinik sowie unsere übersetzten und apostillierten Heiratsurkunden.', english: 'Here is the official notification of birth from the maternity hospital as well as our translated and apostilled marriage certificates.' },
        { german: 'Wir benötigen jeweils mehrfache beglaubigte Ausfertigungen für den Antrag auf Elterngeld, Kindergeld und die Krankenkasse.', english: 'We need several certified copies each for the application for parental allowance, child benefit, and the health insurance fund.' },
        { german: 'Da wir nicht verheiratet sind, möchten wir heute auch die Vaterschaftsanerkennung und die gemeinsame Sorgeerklärung beurkunden.', english: 'Since we are not married, we would also like to notarize the acknowledgment of paternity and joint custody declaration today.' }
      ],
      example_sentences: [
        'Das Standesamt leitet die Geburtsdaten automatisch an das Einwohnermeldeamt zur Zuteilung der Steuer-Identifikationsnummer weiter.',
        'Die Namensführung des Kindes richtet sich nach den Bestimmungen des deutschen Bürgerlichen Gesetzbuches.'
      ]
    }
  },

  // 2. Banking & Finance
  {
    parent_domain: 'Settlement',
    sub_branch: 'Banking & Finance',
    title: 'Clarifying Tax Return Deductions with Tax Office or Advisor',
    description: 'Clarify allowable professional work expenses (Werbungskosten), commuting allowances (Pendlerpauschale), and home office deductions in the annual tax filing.',
    min_level: 'B1',
    content: {
      target_phrases: [
        { german: 'Ich bereite meine Einkommensteuererklärung vor und habe Fragen zur steuerlichen Geltendmachung von Werbungskosten.', english: 'I am preparing my income tax return and have questions regarding claiming income-related work expenses.' },
        { german: 'Kann ich die Entfernungspauschale von dreißig Cent pro Kilometer für die einfache Wegstrecke zur Arbeitsstätte anrechnen?', english: 'Can I claim the commuting allowance of 30 cents per kilometer for the one-way distance to my regular workplace?' },
        { german: 'Für die Homeoffice-Pauschale habe ich an einhundertzwanzig Tagen ausschließlich in der häuslichen Wohnung gearbeitet.', english: 'For the home-office flat-rate deduction, I worked exclusively in my home residence on 120 days.' },
        { german: 'Hier sind die Rechnungsbelege für Fachliteratur, Berufsbekleidung und den beruflich genutzten Laptop.', english: 'Here are the invoice receipts for specialized literature, professional attire, and the work-related laptop.' }
      ],
      example_sentences: [
        'Sonderausgaben wie Kinderbetreuungskosten und Vorsorgeaufwendungen mindern das zu versteuernde Jahreseinkommen.',
        'Nach elektronischer Übermittlung über ELSTER erteilt das Finanzamt den verbindlichen Steuerbescheid meist binnen acht Wochen.'
      ]
    }
  },
  {
    parent_domain: 'Settlement',
    sub_branch: 'Banking & Finance',
    title: 'Negotiating Real Estate Financing & Fixed-Interest Mortgage Terms',
    description: 'Consult a banking mortgage specialist regarding purchasing an apartment, reviewing equity ratios, fixed-interest periods, and KfW subsidies.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Wir planen den Kauf einer Eigentumswohnung und möchten ein maßgeschneidertes Baufinanzierungsangebot anfordern.', english: 'We are planning the purchase of an owner-occupied apartment and would like to request a tailored mortgage financing offer.' },
        { german: 'Wir bringen zwanzig Prozent des Kaufpreises als Eigenkapital ein, um die Erwerbsnebenkosten wie Notar und Grunderwerbsteuer abzudecken.', english: 'We provide 20 percent of the purchase price as equity to cover ancillary purchase costs such as notary and property transfer tax.' },
        { german: 'Wir bevorzugen eine langfristige Zinsbindung von mindestens fünfzehn Jahren mit einem anfänglichen Tilgungssatz von zwei Prozent.', english: 'We prefer a long-term fixed-interest period of at least 15 years with an initial principal repayment rate of two percent.' },
        { german: 'Besteht die Möglichkeit, zinsgünstige Förderdarlehen der staatlichen KfW-Bank für energieeffizientes Bauen einzubinden?', english: 'Is there an opportunity to integrate low-interest subsidized loans from the state KfW bank for energy-efficient building?' }
      ],
      example_sentences: [
        'Wir vereinbaren im Kreditvertrag ein jährliches Sondertilgungsrecht von fünf Prozent der ursprünglichen Darlehenssumme.',
        'Die Bank verlangt zur Kreditsicherung die Eintragung einer Grundschuld im ersten Rang des Grundbuchs.'
      ]
    }
  },
  {
    parent_domain: 'Settlement',
    sub_branch: 'Banking & Finance',
    title: 'Disputing an Inaccurate Credit Bureau Score with SCHUFA',
    description: 'Formulate a legal objection and demand immediate deletion of an unjustified negative credit score record falsely impeding contract closings.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'In meiner aktuellen SCHUFA-Selbstauskunft nach der Datenschutz-Grundverordnung ist ein fehlerhafter Negativeintrag aufgeführt.', english: 'In my current SCHUFA self-disclosure under the General Data Protection Regulation, an erroneous negative entry is listed.' },
        { german: 'Die angebliche Zahlungsforderung des Telekommunikationsanbieters wurde von mir vor zwei Jahren fristgerecht widerrufen und beglichen.', english: 'The alleged claim from the telecommunications provider was revoked in due time and settled by me two years ago.' },
        { german: 'Ich fordere Sie hiermit auf, diesen ungerechtfertigten Eintrag unverzüglich zu löschen und meinen Basisscore neu zu berechnen.', english: 'I hereby request that you immediately delete this unjustified record and recalculate my baseline score.' },
        { german: 'Als Beleg füge ich die schriftliche Erledigungsbestätigung des Gläubigers und den Zahlungsbeleg meiner Bank bei.', english: 'As proof I attach the written confirmation of settlement from the creditor and the payment receipt from my bank.' }
      ],
      example_sentences: [
        'Ein unberechtigter Negativeintrag führt zu gravierenden Nachteilen beim Abschluss von Mietverträgen oder Mobilfunkverträgen.',
        'Sollte die Löschung nicht innerhalb von vierzehn Tagen erfolgen, schalte ich den Landesdatenschutzbeauftragten ein.'
      ]
    }
  },

  // 3. Healthcare System Access
  {
    parent_domain: 'Settlement',
    sub_branch: 'Healthcare System Access',
    title: 'Applying for Inpatient Medical Rehabilitation (Reha-Antrag)',
    description: 'Coordinate with your attending physician to submit an application for stationary orthopedic rehabilitation to the statutory pension insurer.',
    min_level: 'B1',
    content: {
      target_phrases: [
        { german: 'Mein Hausarzt und ich haben einen Antrag auf stationäre medizinische Rehabilitation bei der Rentenversicherung gestellt.', english: 'My family physician and I submitted an application for stationary medical rehabilitation to the statutory pension insurance.' },
        { german: 'Ziel der Rehabilitationsmaßnahme ist es, meine durch chronische Beschwerden gefährdete Erwerbsfähigkeit dauerhaft zu sichern.', english: 'The objective of the rehabilitation measure is to permanently safeguard my earning capacity threatened by chronic complaints.' },
        { german: 'Hier ist der ausführliche ärztliche Befundbericht sowie mein persönlicher Selbstauskunftsbogen zu den Alltagseinschränkungen.', english: 'Here is the comprehensive medical findings report as well as my personal self-disclosure form on daily restrictions.' },
        { german: 'Ich mache von meinem gesetzlichen Wunsch- und Wahlrecht Gebrauch und schlage eine spezialisierte orthopädische Fachklinik vor.', english: 'I make use of my statutory right to choose and suggest a specialized orthopedic clinic.' }
      ],
      example_sentences: [
        'Der Grundsatz der Rentenversicherung lautet: Rehabilitation geht vor Rente.',
        'Wird der Antrag abgelehnt, haben Sie das Recht, innerhalb eines Monats schriftlich Widerspruch einzulegen.'
      ]
    }
  },
  {
    parent_domain: 'Settlement',
    sub_branch: 'Healthcare System Access',
    title: 'Preparing for the Medical Service (MD) Care Grade Assessment',
    description: 'Prepare documentation and guide an assessor from the Medical Service through a home assessment to establish a care grade for an aging family member.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Guten Tag, wir bereiten heute den Begutachtungstermin des Medizinischen Dienstes zur Feststellung des Pflegegrades vor.', english: 'Good day, today we are preparing for the assessment visit of the Medical Service to determine the care grade.' },
        { german: 'Wir haben über zwei Wochen ein lückenloses Pflegetagebuch geführt, das den täglichen Unterstützungsbedarf im Detail dokumentiert.', english: 'We kept a comprehensive care diary over two weeks that documents daily support needs in detail.' },
        { german: 'Die Gutachterin bewertet die Selbstständigkeit in sechs Modulen: von der Mobilität über kognitive Fähigkeiten bis zur Haushaltsführung.', english: 'The assessor evaluates independence across six modules: from mobility and cognitive abilities to household management.' },
        { german: 'Hier liegen alle aktuellen Arztberichte, die Medikamentenpläne und die Berichte des ambulanten Pflegedienstes bereit.', english: 'All current doctor reports, medication schedules, and reports from the outpatient nursing service are ready here.' }
      ],
      example_sentences: [
        'Es ist wichtig, den tatsächlichen Hilfebedarf ungeschönt darzustellen und keine falschen Beschönigungen aus Scham zu machen.',
        'Nach der Begutachtung entscheidet die Pflegekasse anhand des Gutachtens über die Einstufung in Pflegegrad zwei oder drei.'
      ]
    }
  },
  {
    parent_domain: 'Settlement',
    sub_branch: 'Healthcare System Access',
    title: 'Applying for Statutory Co-Payment Exemption (Zuzahlungsbefreiung)',
    description: 'Submit an application to your statutory health insurance for exemption from prescription and hospital co-payments after reaching the 2% income cap.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Ich beantrage die Befreiung von den gesetzlichen Zuzahlungen für das laufende Kalenderjahr bei meiner Krankenkasse.', english: 'I am applying for exemption from statutory co-payments for the current calendar year with my health insurance company.' },
        { german: 'Die gesetzliche Belastungsgrenze liegt bei zwei Prozent des jährlichen Bruttofamilieneinkommens beziehungsweise ein Prozent bei chronischer Erkrankung.', english: 'The statutory co-payment ceiling lies at two percent of annual gross family income or one percent in case of chronic illness.' },
        { german: 'Ich habe alle Originalbelege der Apotheke, Praxisgebührenquittungen und Krankenhauszuzahlungsbelege gesammelt eingereicht.', english: 'I submitted all original pharmacy receipts, practice fee vouchers, and hospital co-payment slips together.' },
        { german: 'Sobald der Befreiungsausweis vorliegt, bin ich für den Rest des Jahres von Rezeptgebühren und Heilmittelzuzahlungen befreit.', english: 'As soon as the exemption card is issued, I am exempt from prescription charges and therapy co-pays for the rest of the year.' }
      ],
      example_sentences: [
        'Für chronisch Kranke muss der behandelnde Facharzt die kontinuierliche Behandlung auf dem amtlichen Vordruck bescheinigen.',
        'Zu viel gezahlte Beträge über der Belastungsgrenze werden von der Krankenkasse auf Ihr Bankkonto erstattet.'
      ]
    }
  },

  // 4. Housing & Tenancy
  {
    parent_domain: 'Settlement',
    sub_branch: 'Housing & Tenancy',
    title: 'Challenging an Inflated Heating & Utility Statement (Nebenkosten)',
    description: 'Review an annual operating costs statement, identify non-allocable administrative costs or heating calculation errors, and lodge a formal objection.',
    min_level: 'B1',
    content: {
      target_phrases: [
        { german: 'Ich wende mich an Sie bezüglich der jährlichen Nebenkostenabrechnung für das vergangene Kalenderjahr.', english: 'I am contacting you regarding the annual operating costs statement for the past calendar year.' },
        { german: 'Die Nachforderung in Höhe von achthundert Euro erscheint mir im Vergleich zum Vorjahr unverhältnismäßig hoch.', english: 'The additional payment demand of 800 euros appears disproportionately high to me compared to the previous year.' },
        { german: 'In der Abrechnung wurden Verwaltungskosten und Instandhaltungsrücklagen umgelegt, die laut Mietrecht nicht umlagefähig sind.', english: 'In the statement, administrative costs and maintenance reserves were allocated, which are not apportionable under tenancy law.' },
        { german: 'Ich mache von meinem Recht auf Belegeinsicht Gebrauch und bitte um einen Termin zur Einsichtnahme in die Originalrechnungen.', english: 'I exercise my right to inspect billing receipts and request an appointment to inspect the original invoices.' }
      ],
      example_sentences: [
        'Der formelle Widerspruch gegen die Betriebskostenabrechnung muss innerhalb von zwölf Monaten nach Zugang erfolgen.',
        'Bis zur Klärung der strittigen Rechnungspositionen halte ich die Zahlung des Nachforderungsbetrags unter Vorbehalt.'
      ]
    }
  },
  {
    parent_domain: 'Settlement',
    sub_branch: 'Housing & Tenancy',
    title: 'Responding to Landlord Rent Increase to Local Rent Index (Mietspiegel)',
    description: 'Assess a formal rent increase demand against local comparative rent indices (Mietspiegel) and qualified energy-efficiency features.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Ich habe Ihr Mieterhöhungsverlangen erhalten und anhand des qualifizierten Mietspiegels unserer Stadt sorgfältig überprüft.', english: 'I received your demand for rent increase and carefully checked it against our city\'s qualified rent index.' },
        { german: 'Die von Ihnen geforderte Kaltmiete übersteigt die ortsübliche Vergleichsmiete für unsere Wohnlage und Baualtersklasse deutlich.', english: 'The base rent demanded by you significantly exceeds the local comparative rent for our residential area and building age class.' },
        { german: 'Zudem greift in unserem Stadtteil die gesetzliche Kappungsgrenze von fünfzehn Prozent innerhalb von drei Jahren.', english: 'Additionally, the statutory cap limit of 15 percent within three years applies in our city district.' },
        { german: 'Ich stimme der Erhöhung daher nur teilweise bis zur maximal zulässigen Obergrenze von neunhundert Euro zu.', english: 'I therefore consent to the increase only partially up to the maximum permissible upper limit of 900 euros.' }
      ],
      example_sentences: [
        'Merkmale wie ein fensterloses Bad oder eine veraltete Heizungsanlage wirken sich mietmindernd in der Mietspiegel-Spanne aus.',
        'Der Vermieter kann auf Zustimmung klagen, wenn die verlangte Miete innerhalb des rechtlichen Rahmens liegt.'
      ]
    }
  },
  {
    parent_domain: 'Settlement',
    sub_branch: 'Housing & Tenancy',
    title: 'Requesting Landlord Consent for Subletting or Accessibility Upgrades',
    description: 'Draft a formal request to your landlord requesting permission for partial subletting to a roommate or installing a barrier-free shower stall.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Ich beantrage Ihre schriftliche Zustimmung zur teilweisen Untervermietung eines Zimmers in meiner Mietwohnung.', english: 'I apply for your written consent to the partial subletting of one room in my rental apartment.' },
        { german: 'Gemäß Bürgerlichem Gesetzbuch liegt ein berechtigtes wirtschaftliches und persönliches Interesse nach Auszug meines Partners vor.', english: 'Under the Civil Code, a legitimate financial and personal interest exists following the departure of my partner.' },
        { german: 'Ich teile Ihnen die Personalien des potenziellen Untermieters sowie Angaben zu dessen beruflicher Tätigkeit mit.', english: 'I am providing you with the personal details of the prospective subtenant as well as information on their professional occupation.' },
        { german: 'Die Kosten für den fachgerechten altersgerechten Umbau des Duschbereichs übernehme ich selbstverständlich vollständig.', english: 'I will naturally cover the costs for the professional age-appropriate renovation of the shower area entirely.' }
      ],
      example_sentences: [
        'Der Vermieter darf die Erlaubnis zur Untervermietung nur bei wichtigem Grund in der Person des Untermieters verweigern.',
        'Wir vereinbaren eine angemessene zusätzliche Sicherheitskaution für eventuelle Rückbauverpflichtungen bei Auszug.'
      ]
    }
  },

  // 5. Social Integration
  {
    parent_domain: 'Settlement',
    sub_branch: 'Social Integration',
    title: 'Participating in School Parents’ Council (Elternbeirat)',
    description: 'Engage actively in a primary school general parents’ assembly, running for classroom parent representative and planning school fairs.',
    min_level: 'B1',
    content: {
      target_phrases: [
        { german: 'Guten Abend, ich kandidiere heute gerne als stellvertretende Elternklassensprecherin für die Klasse drei B.', english: 'Good evening, I would gladly run today as deputy class parent representative for class 3B.' },
        { german: 'Mir ist eine transparente und vertrauensvolle Kommunikation zwischen den Lehrkräften und der Elternschaft besonders wichtig.', english: 'Transparent and trustful communication between teachers and parents is especially important to me.' },
        { german: 'Für das bevorstehende Schulsommerfest organisiere ich gerne den internationalen Verpflegungsstand und das Rahmenprogramm.', english: 'For the upcoming school summer festival I would gladly organize the international food booth and activities program.' },
        { german: 'Wir sollten im Elternbeirat über sichere Schulwege und die Einrichtung einer Lotsenstation an der Hauptstraße beraten.', english: 'We should deliberate in the parents\' council on safe school routes and establishing a crossing-guard post on the main road.' }
      ],
      example_sentences: [
        'Die Klassenelternsprecher werden jeweils für ein Schuljahr von den anwesenden Erziehungsberechtigten gewählt.',
        'Der Elternbeirat vertritt die Interessen der Schülerinnen und Schüler gegenüber der Schulleitung und Schulaufsicht.'
      ]
    }
  },
  {
    parent_domain: 'Settlement',
    sub_branch: 'Social Integration',
    title: 'Founding a Registered Non-Profit Association (e.V.) & Bylaws',
    description: 'Work with fellow civic organizers to draft non-profit association bylaws, hold a founding assembly, and register with the local court register.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Wir haben heute die Gründungsversammlung für unseren gemeinnützigen Kultur- und Bildungsverein abgehalten.', english: 'Today we held the founding assembly for our non-profit cultural and educational association.' },
        { german: 'Zur Vereinsgründung haben mindestens sieben Gründungsmitglieder die ausgearbeitete Vereinssatzung eigenhändig unterzeichnet.', english: 'For the association establishment, at least seven founding members personally signed the drafted association bylaws.' },
        { german: 'In der Satzung ist der gemeinnützige Zweck der interkulturellen Verständigung und Sprachförderung rechtssicher verankert.', english: 'In the bylaws the non-profit purpose of intercultural understanding and language advancement is legally anchored.' },
        { german: 'Wir lassen die Unterschriften des gewählten Vorstands beim Notar beglaubigen und beantragen die Eintragung ins Vereinsregister beim Amtsgericht.', english: 'We will have the elected board signatures notarized by a notary public and apply for entry into the registry of associations at the local court.' }
      ],
      example_sentences: [
        'Das zuständige Finanzamt prüft die Satzung vorab auf die steuerrechtliche Anerkennung der Gemeinnützigkeit.',
        'Mit dem Zusatz e.V. erlangt der Verein volle Rechtsfähigkeit als juristische Person.'
      ]
    }
  },
  {
    parent_domain: 'Settlement',
    sub_branch: 'Social Integration',
    title: 'Engaging in District Advisory Council & Civic Budgeting Proposals',
    description: 'Participate in a municipal neighbourhood council (Quartiersrat), presenting a community garden proposal for municipal civic funding.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Ich stelle dem Quartiersrat heute unseren Projektvorschlag für einen interkulturellen Gemeinschaftsgarten im Stadtteil vor.', english: 'I am presenting our project proposal for an intercultural community garden in the neighborhood to the district council today.' },
        { german: 'Das Projekt fördert den generationenübergreifenden Austausch und schafft einen grünen Begegnungsort für alteingesessene und neu zugezogene Bürger.', english: 'The project promotes intergenerational exchange and creates a green meeting space for long-time and newly arrived citizens.' },
        { german: 'Wir beantragen Fördermittel in Höhe von viertausend Euro aus dem kommunalen Bürgerbudget für Hochbeete und Gartengeräte.', english: 'We are applying for funding in the amount of 4000 euros from the municipal civic budget for raised garden beds and gardening tools.' },
        { german: 'Die Pflege der Gartenanlage wird durch eine ehrenamtliche Nachbarschaftsinitiative eigenverantwortlich sichergestellt.', english: 'Maintenance of the garden grounds is ensured independently by a voluntary neighborhood initiative.' }
      ],
      example_sentences: [
        'Die Mitglieder des Quartiersrates stimmen mit einfacher Mehrheit für die Befürwortung unseres Förderantrags.',
        'Bürgerschaftliches Engagement in lokalen Gremien stärkt den gesellschaftlichen Zusammenhalt und die demokratische Mitgestaltung vor Ort.'
      ]
    }
  }
];
