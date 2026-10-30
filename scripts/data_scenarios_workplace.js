// Workplace Integration scenarios: 5 sub-branches * 3 scenarios each = 15 scenarios
// Sub-branches: General Office/Corporate, Factory/Production Floor, Customer-facing/Service, 
// Team & Manager Communication, Workplace Safety & Compliance

export const workplaceScenarios = [
  // 1. General Office/Corporate
  {
    parent_domain: 'Workplace Integration',
    sub_branch: 'General Office/Corporate',
    title: 'Moderating a Weekly Project Status & Action Item Sync',
    description: 'Lead a cross-functional department standup meeting, review key milestone progress against sprint goals, and assign action owners.',
    min_level: 'B1',
    content: {
      target_phrases: [
        { german: 'Guten Morgen zusammen, lasst uns direkt mit unserem wöchentlichen Projekt-Jour-Fixe starten.', english: 'Good morning everyone, let us get started right away with our weekly project status meeting.' },
        { german: 'Auf der Agenda stehen heute drei Punkte: der aktuelle Zeitplan, Budgetanpassungen und offene Risiken beim Go-Live.', english: 'On the agenda today are three items: the current timeline, budget adjustments, and open risks for go-live.' },
        { german: 'Frau Bauer, wie ist der aktuelle Umsetzungsstand bei der Schnittstellenanbindung des ERP-Systems?', english: 'Mrs. Bauer, what is the current implementation status of the ERP system interface integration?' },
        { german: 'Ich halte im Protokoll fest: Bis Freitagmittag liefert das Marketing-Team die finalen Entwürfe der Pressemitteilung.', english: 'I will record in the meeting minutes: by Friday noon the marketing team will deliver the final drafts of the press release.' }
      ],
      example_sentences: [
        'Gibt es zu diesen Arbeitspaketen noch dringende Klärungsbedarfe oder Blockaden?',
        'Ich verschicke das fertige Protokoll mit der Aufgabenmatrix im Anschluss per E-Mail an den gesamten Verteiler.'
      ]
    }
  },
  {
    parent_domain: 'Workplace Integration',
    sub_branch: 'General Office/Corporate',
    title: 'Requesting Budget Variance Approval from Controlling',
    description: 'Present a business justification to the finance and controlling department for a cost overrun on a software licensing migration.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Ich wende mich an das Controlling wegen einer unvorhergesehenen Budgetüberschreitung im IT-Modernisierungsprojekt.', english: 'I am turning to Controlling regarding an unforeseen budget overrun in the IT modernization project.' },
        { german: 'Aufgrund geänderter Lizenzbestimmungen des Anbieters steigen die Implementierungskosten um etwa fünfzehn Prozent.', english: 'Due to altered licensing terms from the vendor, implementation costs are rising by approximately 15 percent.' },
        { german: 'Durch die schnellere Systemeinführung amortisiert sich diese Mehrausgabe jedoch bereits im zweiten Quartal des Folgejahres.', english: 'However, through the faster system rollout, this extra expenditure will amortize as early as Q2 of the subsequent year.' },
        { german: 'Wir bitten um formelle Freigabe des Sonderbudgets über zwölftausend Euro zur Vermeidung eines Projektstopps.', english: 'We request formal approval of the special budget of 12,000 euros to avoid a project halt.' }
      ],
      example_sentences: [
        'Die detaillierte Wirtschaftlichkeitsberechnung und der Kostenvoranschlag sind dem Freigabeantrag als Anlage beigefügt.',
        'Controlling prüft den Antrag im Rahmen des monatlichen Forecast-Reviews vor der Vorstandssitzung.'
      ]
    }
  },
  {
    parent_domain: 'Workplace Integration',
    sub_branch: 'General Office/Corporate',
    title: 'Handing Over Urgent Client Accounts Before Annual Leave',
    description: 'Conduct a comprehensive pre-vacation handover briefing with your designated colleague, reviewing active customer escalations and escalation contacts.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Da ich ab kommender Woche zwei Wochen im Jahresurlaub bin, möchte ich die Vertretung meiner Schlüsselkunden durchsprechen.', english: 'Since I will be on two weeks of annual leave starting next week, I want to review the coverage for my key accounts.' },
        { german: 'Beim Großkunden Müller GmbH wartet der Einkaufsleiter auf das überarbeitete Rahmenvertragsangebot bis Mittwoch.', english: 'At major account Müller GmbH, the procurement director is awaiting the revised framework contract offer by Wednesday.' },
        { german: 'Sollten Rückfragen zu den Zahlungsmodalitäten auftreten, wende dich bitte direkt an Frau König aus der Rechtsabteilung.', english: 'Should queries regarding payment modalities arise, please contact Ms. König in the legal department directly.' },
        { german: 'Ich habe eine automatische Abwesenheitsnotiz im E-Mail-Programm mit deinen Kontaktdaten als Ansprechpartner eingerichtet.', english: 'I configured an automated out-of-office autoreply in the email client with your contact details as primary backup.' }
      ],
      example_sentences: [
        'Alle relevanten Vertragsentwürfe und Schriftwechsel habe ich im geteilten Kundenordner abgelegt.',
        'Im Falle einer kritischen Eskalation ist auch unser Abteilungsleiter vollinhaltlich über den Sachverhalt informiert.'
      ]
    }
  },

  // 2. Factory/Production Floor
  {
    parent_domain: 'Workplace Integration',
    sub_branch: 'Factory/Production Floor',
    title: 'Reporting Machine Stoppage & Requesting Maintenance',
    description: 'Alert the maintenance department to an unexpected hydraulic failure on packaging line two, explaining error indicators and safety stoppage.',
    min_level: 'B1',
    content: {
      target_phrases: [
        { german: 'Hier ist die Verpackungslinie zwei: Wir haben einen unplanmäßigen Maschinenstillstand an der Schrumpftunnel-Anlage.', english: 'This is packaging line two: we have an unscheduled machine stoppage on the shrink-tunnel unit.' },
        { german: 'Das Bedienpanel zeigt Fehlermeldung F-zwei-acht: Hydraulikdruck unter den Mindestwert abgefallen.', english: 'The operator control panel displays error code F28: hydraulic pressure dropped below the minimum threshold.' },
        { german: 'Ich habe die Anlage sofort über den Not-Aus-Schalter stillgesetzt, um Folgeschäden an den Förderbändern zu vermeiden.', english: 'I halted the machine immediately using the emergency stop button to prevent secondary damage to conveyor belts.' },
        { german: 'Können Sie bitte umgehend einen Instandhaltungsmechaniker zur Begutachtung in Halle drei schicken?', english: 'Could you please send a maintenance mechanic over to hall three immediately for assessment?' }
      ],
      example_sentences: [
        'An der Hydraulikpumpe ist ein deutlicher Austritt von Hydrauliköl am Dichtungsflansch sichtbar.',
        'Wir leiten die nachfolgenden Paletten vorübergehend auf die Reserve-Packlinie um.'
      ]
    }
  },
  {
    parent_domain: 'Workplace Integration',
    sub_branch: 'Factory/Production Floor',
    title: 'Conducting Shift Handover on Scrap Rates & Output Quotas',
    description: 'Hand over production line metrics to incoming shift supervisor, detailing target output variances, component stock, and machine calibration.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'In der Frühschicht haben wir eine Gesamtstückzahl von zweitausendvierhundert Teilen produziert und das Soll zu achtundneunzig Prozent erfüllt.', english: 'In the morning shift we produced a total output of 2400 parts and achieved 98 percent of target quota.' },
        { german: 'Die Ausschussquote lag bei zwei Komma ein Prozent, hauptsächlich wegen Maßungenauigkeiten an der Prägestation.', english: 'The scrap rate was at 2.1 percent, primarily due to dimensional inaccuracies at the stamping station.' },
        { german: 'Die Werkzeugschleifung wurde um elf Uhr dreißig nachjustiert; seitdem laufen die Teile wieder absolut maßhaltig.', english: 'Tool grinding was readjusted at 11:30 AM; since then the parts have been running completely within spec.' },
        { german: 'Der Vorrat an Rohblechen im Pufferlager reicht noch für etwa drei Stunden; die Nachlieferung aus dem Zentrallager ist bestellt.', english: 'The buffer inventory of sheet metal blanks is sufficient for about three more hours; replenishment from central storage is ordered.' }
      ],
      example_sentences: [
        'Bitte kontrolliert um vierzehn Uhr die stündlichen Prüfprotokolle der optischen Qualitätskamera.',
        'Das Schichtbuch ist unterschrieben und liegt am Meisterpult zur Einsichtnahme bereit.'
      ]
    }
  },
  {
    parent_domain: 'Workplace Integration',
    sub_branch: 'Factory/Production Floor',
    title: 'Resolving Assembly Bottlenecks with Shift Supervisor',
    description: 'Collaborate with line supervisor to reorganize assembly stations and reassign line workers to clear a bottleneck at final testing.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'An der Endprüfstation stauen sich aktuell über sechzig Baugruppen, weil die elektrische Funktionsprüfung zu lange dauert.', english: 'At the final test station over 60 assemblies are currently piling up because electrical functional testing takes too long.' },
        { german: 'Wenn wir diesen Engpass nicht auflösen, müssen wir die Vormontagelinie in dreißig Minuten drosseln.', english: 'If we do not resolve this bottleneck, we will have to throttle the pre-assembly line in 30 minutes.' },
        { german: 'Ich schlage vor, zwei geschulte Werker von der Vormontage temporär zur Unterstützung an die Prüfplätze zu versetzen.', english: 'I propose temporarily reassigning two trained workers from pre-assembly to assist at the test benches.' },
        { german: 'Zusätzlich sollten wir den zweiten automatischen Prüfadapter aktivieren, der bisher als Standby-Gerät reserviert war.', english: 'Additionally we should activate the second automated test fixture that was previously reserved as standby unit.' }
      ],
      example_sentences: [
        'Durch die Umverteilung der Arbeitsstationen senken wir die Durchlaufzeit pro Einheit um fast zwei Minuten.',
        'Wir beobachten den Materialfluss in der nächsten halben Stunde, um zu sehen, ob der Rückstau abgebaut wird.'
      ]
    }
  },

  // 3. Customer-facing/Service
  {
    parent_domain: 'Workplace Integration',
    sub_branch: 'Customer-facing/Service',
    title: 'De-escalating an Upset Customer Over Damaged Delivery',
    description: 'Calm a furious commercial customer whose urgent order arrived damaged, taking ownership, offering expedited replacement, and goodwill credit.',
    min_level: 'B1',
    content: {
      target_phrases: [
        { german: 'Guten Tag Herr Walter, ich kann Ihren Ärger über die beschädigte Warenlieferung vollkommen nachvollziehen.', english: 'Good day Mr. Walter, I can completely understand your frustration regarding the damaged merchandise delivery.' },
        { german: 'Es tut mir aufrichtig leid, dass Ihre Produktion durch diesen Vorfall gefährdet wurde; ich übernehme diesen Fall persönlich.', english: 'I am sincerely sorry that your production was jeopardized by this incident; I am personally taking ownership of this case.' },
        { german: 'Ich veranlasse sofort eine kostenfreie Eil-Nachlieferung per Kurierdienst, die morgen früh bis neun Uhr bei Ihnen eintrifft.', english: 'I will arrange an immediate free express re-delivery via courier service arriving with you tomorrow morning by 9:00 AM.' },
        { german: 'Für die entstandenen Unannehmlichkeiten schreiben wir Ihnen eine Gutschrift in Höhe von zwanzig Prozent des Rechnungsbetrags gut.', english: 'For the inconvenience caused, we will credit your account with a courtesy discount of 20 percent of the invoice total.' }
      ],
      example_sentences: [
        'Bitte senden Sie mir ein kurzes Foto der beschädigten Verpackung für unsere Speditionsreklamation zu.',
        'Ich informiere Sie heute Nachmittag persönlich per SMS, sobald die Sendung an den Kurier übergeben wurde.'
      ]
    }
  },
  {
    parent_domain: 'Workplace Integration',
    sub_branch: 'Customer-facing/Service',
    title: 'Explaining Repair Timelines & Warranty Coverage on the Phone',
    description: 'Explain to a corporate client why certain worn parts are excluded from statutory warranty and provide a transparent repair estimate.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Vielen Dank für Ihre Geduld während der technischen Überprüfung Ihres Industriekran-Steuergeräts in unserem Werk.', english: 'Thank you for your patience during the technical diagnostic review of your industrial crane control unit in our factory.' },
        { german: 'Unsere Werkstatt hat festgestellt, dass die Hauptplatine durch Überspannung beschädigt wurde, was nicht unter die Gewährleistung fällt.', english: 'Our workshop established that the main circuit board was damaged by power surge, which does not fall under statutory warranty.' },
        { german: 'Wir können das Gerät jedoch im Rahmen unseres Pauschal-Reparaturangebots innerhalb von vier Werktagen instand setzen.', english: 'However, we can recondition the device under our fixed-rate repair package within four working days.' },
        { german: 'Der Kostenvoranschlag beläuft sich auf sechshundertfünfzig Euro netto inklusive Originalersatzteilen und Sicherheitsprüfung.', english: 'The cost estimate amounts to 650 euros net including genuine replacement parts and mandatory safety testing.' }
      ],
      example_sentences: [
        'Wenn Sie uns die Freigabe bis sechzehn Uhr erteilen, bestellen wir die Komponenten noch am selben Tag.',
        'Nach der Reparatur gewähren wir Ihnen zwölf Monate Garantie auf alle ersetzten Funktionsteile.'
      ]
    }
  },
  {
    parent_domain: 'Workplace Integration',
    sub_branch: 'Customer-facing/Service',
    title: 'Conducting Post-Resolution Follow-up & Satisfaction Review',
    description: 'Call an enterprise client following resolution of a complex technical software ticket to evaluate service satisfaction and upsell training.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Guten Tag Frau Dr. Lehmann, ich rufe an, um mich zu erkundigen, ob das letzte Software-Update bei Ihnen reibungslos funktioniert.', english: 'Good day Dr. Lehmann, I am calling to inquire whether the recent software update is functioning smoothly on your end.' },
        { german: 'Unser Support-Team hatte das Ticket zur Datenbank-Synchronisation gestern Nachmittag als gelöst geschlossen.', english: 'Our support team closed the database synchronization support ticket yesterday afternoon as resolved.' },
        { german: 'Gibt es noch offene Punkte oder Besonderheiten, die Ihre Mitarbeiter im laufenden Betrieb festgestellt haben?', english: 'Are there any remaining open points or anomalies that your staff members noticed during daily operations?' },
        { german: 'Wir bieten für Ihr Team gerne ein einstündiges Online-Webinar an, um die neuen Filterfunktionen praxisnah zu vertiefen.', english: 'We would gladly offer a one-hour online webinar for your team to deepen familiarity with the new filter features in practice.' }
      ],
      example_sentences: [
        'Ihre Rückmeldung ist uns sehr wichtig, um unsere Servicequalität kontinuierlich weiterzuentwickeln.',
        'Ich hinterlege in Ihrer Kundenakte den Vermerk, dass das System vollkommen stabil läuft.'
      ]
    }
  },

  // 4. Team & Manager Communication
  {
    parent_domain: 'Workplace Integration',
    sub_branch: 'Team & Manager Communication',
    title: 'Annual Performance Review & Professional Development Goals',
    description: 'Participate in a yearly employee performance review (Mitarbeitergespräch) with direct manager, reviewing KPI achievements and career training.',
    min_level: 'B1',
    content: {
      target_phrases: [
        { german: 'Guten Tag Herr Sommer, vielen Dank für das jährliche Mitarbeitergespräch und die offene Feedbackkultur in unserem Team.', english: 'Good day Mr. Sommer, thank you for the annual performance review and the open feedback culture in our team.' },
        { german: 'Im vergangenen Geschäftsjahr konnte ich meine Projektziele bei der Kundenakquise um zehn Prozent übertreffen.', english: 'In the past fiscal year I was able to exceed my project targets in customer acquisition by ten percent.' },
        { german: 'Für meine berufliche Weiterentwicklung möchte ich mich gerne im Bereich Agiles Projektmanagement und Scrum zertifizieren lassen.', english: 'For my professional career development I would like to obtain certification in Agile Project Management and Scrum.' },
        { german: 'Welche Möglichkeiten sehen Sie, dass das Unternehmen die Lehrgangsgebühren für diese Weiterbildung übernimmt?', english: 'What possibilities do you see for the company to sponsor the course tuition fees for this professional training?' }
      ],
      example_sentences: [
        'Wir vereinbaren konkrete Zielvorgaben für die nächsten zwölf Monate in der Zielvereinbarungsvereinbarung.',
        'Ich schätze Ihre selbstständige Arbeitsweise und Ihre Verlässlichkeit im Team sehr.'
      ]
    }
  },
  {
    parent_domain: 'Workplace Integration',
    sub_branch: 'Team & Manager Communication',
    title: 'Addressing Workload Overload & Sprint Task Reprioritization',
    description: 'Signal workload capacity exhaustion (Überlastungsanzeige) to department lead, presenting constructive reprioritization proposals.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Ich habe um dieses Gespräch gebeten, weil das Arbeitsaufkommen in den letzten Wochen ein ungesundes Maß erreicht hat.', english: 'I asked for this meeting because the workload over recent weeks has reached an unhealthy level.' },
        { german: 'Durch die Krankheitsausfälle im Team betreue ich aktuell drei Großprojekte gleichzeitig, was zu Qualitätsrisiken führt.', english: 'Due to sick leaves on the team I am currently handling three major projects simultaneously, which leads to quality risks.' },
        { german: 'Um Fristversäumnisse zu vermeiden, müssen wir die anstehenden Meilensteine gemeinsam neu priorisieren.', english: 'To avoid missing deadlines, we must reprioritize upcoming project milestones together.' },
        { german: 'Ich schlage vor, das Migrationsprojekt um vier Wochen zu verschieben und externe Unterstützung für die Datenerfassung anzufordern.', english: 'I propose postponing the migration project by four weeks and requesting external contractor support for data collection.' }
      ],
      example_sentences: [
        'Es ist mir wichtig, transparent zu kommunizieren, bevor verbindliche Kundentermine gefährdet werden.',
        'Wir nehmen zwei Arbeitspakete aus deinem aktuellen Sprint heraus und verteilen sie um.'
      ]
    }
  },
  {
    parent_domain: 'Workplace Integration',
    sub_branch: 'Team & Manager Communication',
    title: 'Delivering Constructive Peer Feedback After Project Milestone',
    description: 'Provide diplomatic, constructive peer feedback to a co-worker regarding meeting preparation and documentation habits in a retrospective.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Ich schätze deine kreativen Lösungsansätze und dein enormes Fachwissen bei technischen Problemen sehr.', english: 'I value your creative approaches to solutions and your enormous technical expertise on technical problems very much.' },
        { german: 'Mir ist jedoch aufgefallen, dass die Vorbereitung auf Kundenpräsentationen oft sehr kurzfristig und hektisch stattfand.', english: 'However, I noticed that preparation for client presentations often occurred very last-minute and hectically.' },
        { german: 'Für mich war es schwierig, meinen Teil nahtlos abzustimmen, wenn die Folien erst kurz vor dem Termin vorlagen.', english: 'It was difficult for me to align my part seamlessly when the slides were only ready shortly before the meeting.' },
        { german: 'Ich wünsche mir für künftige Projekte, dass wir verbindliche Zwischenfristen mindestens zwei Tage vor dem Präsentationstermin vereinbaren.', english: 'For future projects I would like us to agree on binding intermediate deadlines at least two days before presentation day.' }
      ],
      example_sentences: [
        'Vielen Dank für deine Offenheit; ich verstehe deine Perspektive vollkommen und werde mein Zeitmanagement anpassen.',
        'Regelmäßige Retrospektiven helfen uns, unsere Zusammenarbeit kontinuierlich zu verbessern.'
      ]
    }
  },

  // 5. Workplace Safety & Compliance
  {
    parent_domain: 'Workplace Integration',
    sub_branch: 'Workplace Safety & Compliance',
    title: 'Conducting Mandatory Annual Health & Safety Briefing',
    description: 'Facilitate the statutory annual workplace occupational safety briefing (Sicherheitsunterweisung), covering fire evacuation and PPE standards.',
    min_level: 'B1',
    content: {
      target_phrases: [
        { german: 'Wir führen heute die gesetzlich vorgeschriebene jährliche Sicherheitsunterweisung für alle Beschäftigten durch.', english: 'Today we are conducting the legally mandated annual safety briefing for all employees.' },
        { german: 'Im Brandfall ertönt ein intermittierendes Alarmsignal; verlassen Sie das Gebäude zügig über die gekennzeichneten Notausgänge.', english: 'In case of fire, an intermittent alarm signal sounds; evacuate the building promptly via marked emergency exits.' },
        { german: 'Die Nutzung von Personenaufzügen ist im Brandfall lebensgefährlich und strengstens untersagt.', english: 'The use of passenger elevators in case of fire is life-threatening and strictly prohibited.' },
        { german: 'Bitte tragen Sie in den ausgewiesenen Werkstattbereichen stets Ihre persönliche Schutzausrüstung inklusive Sicherheitsschuhen der Klasse S3.', english: 'Please always wear your personal protective equipment including S3 safety shoes in designated workshop areas.' }
      ],
      example_sentences: [
        'Der Sammelplatz für unseren Gebäudeteil befindet sich auf dem Firmenparkplatz vor Tor zwei.',
        'Bitte bestätigen Sie die Teilnahme an dieser Sicherheitsunterweisung mit Ihrer persönlichen Unterschrift auf der Anwesenheitsliste.'
      ]
    }
  },
  {
    parent_domain: 'Workplace Integration',
    sub_branch: 'Workplace Safety & Compliance',
    title: 'Reporting Workplace Accident to Safety Officer & Insurance (BG)',
    description: 'Complete formal documentation and notification for a slip-and-fall occupational injury requiring employer liability insurance notification.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Ich muss einen Arbeitsunfall melden, der sich heute Vormittag auf der Treppe im Verwaltungsgebäude ereignet hat.', english: 'I must report a workplace accident that occurred this morning on the stairs in the administration building.' },
        { german: 'Eine Mitarbeiterin ist auf nassen Stufen ausgerutscht und hat sich eine schwere Distorsion des rechten Sprunggelenks zugezogen.', english: 'An employee slipped on wet steps and sustained a severe sprain of the right ankle.' },
        { german: 'Wir haben unverzüglich Erste Hilfe geleistet und die Verunfallte zur Erstversorgung durch einen Durchgangsarzt überstellt.', english: 'We administered immediate first aid and transferred the injured worker to an authorized accident insurance physician (D-Arzt).' },
        { german: 'Da eine Arbeitsunfähigkeit von mehr als drei Tagen zu erwarten ist, erstellen wir die offizielle Unfallanzeige für die Berufsgenossenschaft.', english: 'Since incapacity for work exceeding three days is expected, we are preparing the official accident notice for the statutory accident insurance.' }
      ],
      example_sentences: [
        'Der Vorfall wurde lückenlos mit Zeugenaussagen im Verbandbuch der Abteilung dokumentiert.',
        'Die Fachkraft für Arbeitssicherheit prüft, ob zusätzliche Antirutsch-Profile auf den Stufen angebracht werden müssen.'
      ]
    }
  },
  {
    parent_domain: 'Workplace Integration',
    sub_branch: 'Workplace Safety & Compliance',
    title: 'Ergonomic Workstation Assessment & Height-Adjustable Desk Request',
    description: 'Consult the company occupational health physician (Betriebsarzt) regarding chronic neck strain and requesting an electric sit-stand desk.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Guten Tag Herr Doktor, ich habe in den letzten Monaten zunehmend mit chronischen Nackenverspannungen und Kopfschmerzen zu kämpfen.', english: 'Good day doctor, over recent months I have been struggling increasingly with chronic neck tension and headaches.' },
        { german: 'Meine tägliche Bildschirmarbeitszeit beträgt über sieben Stunden an einem starren, nicht höhenverstellbaren Standard-Schreibtisch.', english: 'My daily computer workstation time exceeds seven hours at a rigid, non-height-adjustable standard desk.' },
        { german: 'Ich bitte um eine arbeitsmedizinische Stellungnahme zur Befürwortung eines elektrisch höhenverstellbaren Sitz-Steh-Tisches.', english: 'I request an occupational health medical statement supporting an electrically height-adjustable sit-stand desk.' },
        { german: 'Der dynamische Wechsel zwischen Sitzen und Stehen entlastet die Lendenwirbelsäule und beugt Haltungsschäden wirksam vor.', english: 'Dynamic alternation between sitting and standing relieves the lumbar spine and effectively prevents postural deformities.' }
      ],
      example_sentences: [
        'Der Betriebsarzt stellt eine Empfehlung zur ergonomischen Arbeitsplatzanpassung für die Personalabteilung aus.',
        'Wir stellen auch die Höhe der Armlehnen und die Blickachse zum Monitor ergonomisch optimal ein.'
      ]
    }
  }
];
