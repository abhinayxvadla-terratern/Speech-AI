// Ausbildung scenarios: 9 sub-branches * 3 scenarios each = 27 scenarios
// Sub-branches: Electrician, Plumbing/Heating, Carpentry, Automotive Mechatronics, 
// Hospitality & Culinary, Retail/Commerce, Logistics & Warehousing, IT/Technical, Industrial/Manufacturing

export const ausbildungScenarios = [
  // 1. Electrician
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Electrician',
    title: 'Applying the Five Safety Rules on a Distribution Board',
    description: 'Explain and verify the mandatory five electrical safety rules (Fünf Sicherheitsregeln) with an apprentice before commencing maintenance on a sub-distribution panel.',
    min_level: 'B1',
    content: {
      target_phrases: [
        { german: 'Bevor wir an der Unterverteilung arbeiten, müssen wir zwingend die fünf Sicherheitsregeln einhalten.', english: 'Before we work on the sub-distribution board, we must strictly observe the five safety rules.' },
        { german: 'Zuerst schalten wir den Hauptschalter allpolig frei und sichern den Leistungsschalter gegen Wiedereinschalten mit einem Vorhängeschloss.', english: 'First we disconnect all poles of the main switch and secure the circuit breaker against reclosing with a padlock.' },
        { german: 'Ich prüfe mit dem zweipoligen Spannungsprüfer an allen Phasen und gegen Neutralleiter die tatsächliche Spannungsfreiheit.', english: 'I verify the actual absence of voltage across all phases and against neutral using the two-pole voltage tester.' },
        { german: 'Als Nächstes erden und kurzschließen wir die Leiter und decken benachbarte unter Spannung stehende Teile ab.', english: 'Next we earth and short-circuit the conductors and cover adjacent live parts.' }
      ],
      example_sentences: [
        'Prüfe den Spannungsprüfer immer unmittelbar vor und nach der Messung an einer bekannten Spannungsquelle auf Funktion.',
        'Erst wenn alle fünf Schritte fehlerfrei abgearbeitet sind, dürfen wir die Gehäuseabdeckung gefahrlos abnehmen.'
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Electrician',
    title: 'Troubleshooting a Tripping Residual Current Device (RCD)',
    description: 'Diagnose intermittent tripping of an RCD (FI-Schutzschalter) in a commercial kitchen using insulation resistance measurements and circuit isolation.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Der dreißig-Milliampere-FI-Schutzschalter löst unregelmäßig aus, sobald mehrere Küchengeräte gleichzeitig eingeschaltet werden.', english: 'The 30-milliampere RCD trips intermittently as soon as several kitchen appliances are switched on simultaneously.' },
        { german: 'Wir schalten zunächst alle nachgeschalteten Leitungsschutzschalter ab und trennen die Verbraucher vom Stromnetz.', english: 'We first switch off all downstream miniature circuit breakers and disconnect the loads from the mains.' },
        { german: 'Mit dem Isolationstester messe ich den Isolationswiderstand zwischen Leiter und Schutzleiter bei einer Prüfspannung von fünfhundert Volt.', english: 'Using the insulation tester I measure the insulation resistance between line and protective conductor at a test voltage of 500 volts.' },
        { german: 'Der gemessene Isolationswiderstand am Stromkreis des Kombidämpfers liegt unter null Komma fünf Megaohm; dort liegt ein Erdschluss vor.', english: 'The measured insulation resistance on the combi-steamer circuit is below 0.5 megohms; an earth fault is present there.' }
      ],
      example_sentences: [
        'Die feuchte Dichtung am Heizelement hat vermutlich den Kriechstrom gegen das geerdete Gehäuse verursacht.',
        'Nach Austausch des Heizelements und erfolgreicher Wiederholungsmessung nehmen wir den Stromkreis wieder in Betrieb.'
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Electrician',
    title: 'Pulling Cables Through Conduits & Documenting Circuit Tags',
    description: 'Coordinate cable pulling through empty conduits on a construction site, verifying bend radii and labeling conductors according to DIN standards.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Wir ziehen jetzt die feuerfesten Mantelleitungen durch das flexible Installationsrohr in der Zwischendecke ein.', english: 'We are now pulling the flame-retardant sheathed cables through the flexible conduit in the false ceiling.' },
        { german: 'Verwende ausreichend Gleitmittel an der Einzugspirale, damit der Kabelmantel an engen 90-Grad-Bögen nicht beschädigt wird.', english: 'Use plenty of cable lubricant on the pulling wire so that the cable jacket is not damaged on tight 90-degree bends.' },
        { german: 'Achte darauf, den zulässigen Mindestbiegeradius von vierfachem Außendurchmesser keinesfalls zu unterschreiten.', english: 'Make sure not to fall below the permissible minimum bend radius of four times outer diameter under any circumstances.' },
        { german: 'Wir versehen jedes Kabelende an beiden Abzweigdosen sofort mit dauerhaften Bedruckungsetiketten gemäß Stromlaufplan.', english: 'We will immediately tag each cable end at both junction boxes with permanent printed labels according to the circuit diagram.' }
      ],
      example_sentences: [
        'Lass an beiden Enden mindestens zwanzig Zentimeter Reserve zum Abisolieren und Klemmen in den Dosen stehen.',
        'Wir haken die fertig eingezogenen Leitungen im Revisionsplan ab und dokumentieren die verlegten Meter.'
      ]
    }
  },

  // 2. Plumbing/Heating
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Plumbing/Heating',
    title: 'Commissioning & Bleeding a Heat Pump Hydronic Circuit',
    description: 'Commission a newly installed air-to-water heat pump heating circuit, check system operating pressure, and bleed underfloor heating manifolds.',
    min_level: 'B1',
    content: {
      target_phrases: [
        { german: 'Wir befüllen den geschlossenen Heizkreislauf der Wärmepumpe mit demineralisiertem Füllwasser nach VDI-Richtlinie.', english: 'We fill the closed hydronic circuit of the heat pump with demineralized fill water according to VDI guidelines.' },
        { german: 'Der Anlagendruck am Manometer muss im kalten Zustand auf eins Komma acht Bar eingestellt werden.', english: 'The system pressure on the pressure gauge must be adjusted to 1.8 bar in cold condition.' },
        { german: 'Wir öffnen nacheinander die Durchflussanzeiger an den Heizkreisverteilern der Fußbodenheizung und entlüften jeden Strang einzeln.', english: 'We open the flow indicators on the underfloor heating manifold one after another and bleed each branch individually.' },
        { german: 'Stellen Sie sicher, dass keine Lufteinschlüsse mehr im Schlammabscheider und im Plattenwärmetauscher zirkulieren.', english: 'Ensure that no more air pockets circulate in the dirt separator and plate heat exchanger.' }
      ],
      example_sentences: [
        'Nach zwanzig Minuten Zirkulation prüfen wir die Spreizung zwischen Vorlauf- und Rücklauftemperatur.',
        'Ich trage den Anlagendruck und die Wasserhärte in das Inbetriebnahmeprotokoll der Heizungsanlage ein.'
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Plumbing/Heating',
    title: 'Locating a Concealed Wastewater Pipe Leak & Replacing Gaskets',
    description: 'Inspect damp masonry using thermal imaging and endoscope camera to pinpoint an acoustic and structural leak in HT drainage piping.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Der Hausbesitzer meldet Feuchtigkeitsflecken an der Kellerdecke direkt unter dem Fallstrang des Badezimmers.', english: 'The homeowner reports damp patches on the basement ceiling directly underneath the bathroom vertical soil stack.' },
        { german: 'Wir führen die Inspektionskamera durch die Reinigungsöffnung des HT-Abwasserrohrs ein, um Haarrisse oder Versatz zu lokalisieren.', english: 'We feed the inspection camera through the cleanout opening of the HT drainage pipe to locate hairline cracks or joint misalignment.' },
        { german: 'An der Muffenverbindung im ersten Stock ist der Lippendichtring spröde geworden und verrutscht.', english: 'At the socket connection on the first floor the lip seal ring has become brittle and slipped out of place.' },
        { german: 'Wir schneiden den beschädigten Rohrabschnitt mit der Rohrabschneiderzange heraus und setzen eine Überschiebemuffe mit Gleitmittel ein.', english: 'We cut out the damaged pipe section with pipe cutters and fit a slip coupling using pipe lubricant.' }
      ],
      example_sentences: [
        'Führe nach der Montage einen Spültest mit zwanzig Litern Wasser durch, um die absolute Dichtheit der Muffe zu überprüfen.',
        'Wir dokumentieren den Schadensverlauf mit Fotos für die Gebäudeversicherung des Eigentümers.'
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Plumbing/Heating',
    title: 'Instructing a Homeowner on Digital Thermostats & Maintenance',
    description: 'Walk a customer through programmable room thermostat curves, seasonal legionella purge cycles, and statutory chimney sweep inspection intervals.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Ich erkläre Ihnen die Bedienung des digitalen Raumthermostats und die Einstellung der Heizkurve für den Winter.', english: 'I will explain the operation of the digital room thermostat and how to set the heating curve for the winter.' },
        { german: 'Über das Wochenprogramm können Sie für die Nachtstunden eine Absenktemperatur von achtzehn Grad programmieren.', english: 'Using the weekly schedule you can program a setback temperature of 18 degrees for night hours.' },
        { german: 'Einmal wöchentlich heizt der Trinkwasserspeicher automatisch auf sechzig Grad auf, um Legionellenbildung sicher zu verhindern.', english: 'Once a week the domestic hot water cylinder automatically heats up to 60 degrees to reliably prevent legionella growth.' },
        { german: 'Laut Gesetzgeber ist eine jährliche fachmännische Inspektion des Brenners und der Opferanode im Warmwasserspeicher vorgeschrieben.', english: 'By law, an annual professional inspection of the burner and the sacrificial anode in the hot water tank is mandatory.' }
      ],
      example_sentences: [
        'Hier übergebe ich Ihnen die vollständigen Herstellerunterlagen und unsere Kundendienst-Notfallnummer.',
        'Sollte auf dem Display ein Fehlercode wie E-null-vier erscheinen, rufen Sie uns bitte direkt an.'
      ]
    }
  },

  // 3. Carpentry
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Carpentry',
    title: 'Taking Laser Measurements for Custom Built-In Cabinets',
    description: 'Measure an attic alcove with sloping roof ceilings using a digital laser rangefinder and level to prepare custom cabinetry shop drawings.',
    min_level: 'B1',
    content: {
      target_phrases: [
        { german: 'Wir nehmen heute das exakte Aufmaß für den maßgefertigten Einbauschrank unter der Dachschräge.', english: 'Today we are taking the exact site dimensions for the custom built-in wardrobe under the sloped attic ceiling.' },
        { german: 'Wir messen die Wandbreite an drei verschiedenen Höhenpunkten: am Sockel, auf Bauchhöhe und unter dem Kniestock.', english: 'We measure the wall width at three different height points: at the baseboard, at waist level, and under the knee wall.' },
        { german: 'Die Wasserwaage zeigt, dass der Estrichboden um sieben Millimeter nach links abfällt; wir müssen Ausgleichsfüße einplanen.', english: 'The spirit level shows that the screed floor drops seven millimeters to the left; we must plan leveling feet.' },
        { german: 'Ich messe den genauen Dachneigungswinkel mit dem digitalen Winkelmesser, um die Wangenschräge im Zuschnitt zu programmieren.', english: 'I measure the exact roof pitch angle using the digital angle finder to program the gable taper in the cutting list.' }
      ],
      example_sentences: [
        'Trage alle Maße mit zwei Millimetern Schattenfuge in die Aufmaßskizze für die Werkstattfertigung ein.',
        'Wir prüfen vor Ort auch die Position der Steckdosen und Heizkörperanschlüsse.'
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Carpentry',
    title: 'Operating the Jointer-Planer Safely & Timber Joining',
    description: 'Select appropriate traditional wood joints (mortise and tenon) and adhere to safety guard procedures on the jointer/thickness planer machine.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Für den Rahmen dieser Massivholztür wählen wir eine Schlitz-und-Zapfen-Verbindung mit Holznagel-Verdübelung.', english: 'For the frame of this solid wood door we select a mortise-and-tenon joint with wooden dowel pinning.' },
        { german: 'Bevor wir die Eichenbohlen über die Abrichthobelmaschine führen, stellen wir die Schutzbrücke dicht über das Werkstück ein.', english: 'Before we feed the oak planks over the jointer planer, we adjust the bridge guard closely over the workpiece.' },
        { german: 'Benutze bei schmalen Werkstücken unbedingt das Schiebeholz, um deine Finger außerhalb des Messerwellenbereichs zu halten.', english: 'Always use the push stick on narrow workpieces to keep your fingers outside the cutterhead hazard zone.' },
        { german: 'Wir hobeln zuerst die hohle Seite ab, bis eine vollkommen plane Bezugsfläche und eine winkelige Kante entstehen.', english: 'We first plane the concave face until a completely flat reference surface and a square reference edge are formed.' }
      ],
      example_sentences: [
        'Achte auf die Faserrichtung des Holzes, um Ausrisse an den Hirnholzkanten zu vermeiden.',
        'Nach dem Abrichten schicken wir die Kanteln zur Maßkalibrierung durch die Dickenhobelmaschine.'
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Carpentry',
    title: 'Installing Interior Door Jambs & Adjusting Concealed Hinges',
    description: 'Erect an interior timber door frame into a drywall opening, foam plumb with low-expansion PU foam, and align 3D hinges.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Wir setzen die vormontierte Holztürzarge in die Rohbauöffnung ein und richten sie mit Wasserwaage und Holzkeilen lotrecht aus.', english: 'We place the pre-assembled timber door frame into the rough opening and plumb it with a spirit level and wooden wedges.' },
        { german: 'Wir spreizen das Futter an drei Punkten mit Zargenspannern ab, um das Durchbiegen beim Ausschäumen zu verhindern.', english: 'We brace the jamb at three points with door frame clamps to prevent bowing during expanding foam application.' },
        { german: 'Ich verwende zweikomponentigen Zargenschaum, der druckfest aushärtet und keine unkontrollierte Nachdehnung verursacht.', english: 'I use two-component door jamb foam, which cures pressure-resistant and does not cause uncontrolled post-expansion.' },
        { german: 'Mit dem Inbusschlüssel justieren wir die verdeckt liegenden 3D-Bänder in Höhe, Tiefe und Andruck, bis das Türblatt geräuschlos schließt.', english: 'Using the Allen key we adjust the concealed 3D hinges in height, depth, and compression until the door leaf closes silently.' }
      ],
      example_sentences: [
        'Das Spaltmaß zwischen Türblatt und Zarge muss umlaufend gleichmäßige drei Millimeter betragen.',
        'Nach Aushärtung des Schaums schneiden wir Überstände bündig ab und befestigen die Bekleidung mit Montagekleber.'
      ]
    }
  },

  // 4. Automotive Mechatronics
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Automotive Mechatronics',
    title: 'Reading OBD-II Diagnostic Fault Codes with Workshop Foreman',
    description: 'Connect diagnostic scanner to an engine control unit, analyze live CAN-bus sensor data, and explain fault memory findings to the foreman.',
    min_level: 'B1',
    content: {
      target_phrases: [
        { german: 'Ich habe das Diagnosegerät über die OBD-Schnittstelle angeschlossen und den Fehlerspeicher des Motorsteuergeräts ausgelesen.', english: 'I connected the diagnostic scan tool via the OBD interface and retrieved the fault memory of the engine control unit.' },
        { german: 'Der Fehlercode P-null-drei-null-eins zeigt wiederholte Verbrennungsaussetzer am ersten Zylinder unter Teillast an.', english: 'Fault code P0301 indicates recurrent combustion misfires on cylinder one under partial load.' },
        { german: 'In den Live-Messwerten weicht die Kraftstoff-Korrektur um plus fünfzehn Prozent ab, was auf Falschluft im Ansaugtrakt hindeutet.', english: 'In the live sensor parameters the fuel trim deviates by plus 15 percent, which indicates unmetered air in the intake tract.' },
        { german: 'Ich überprüfe als Nächstes das Zündkerzenbild und messe den Primärwiderstand der Stabzündspule durch.', english: 'Next I will inspect the spark plug condition and measure the primary resistance of the pencil ignition coil.' }
      ],
      example_sentences: [
        'Die Lambdasonden-Regelung arbeitet im Leerlauf normal, schlägt aber bei zweitausend Umdrehungen aus.',
        'Ich drucke das Fehlerprotokoll aus und lege es der Reparaturmappe für den Meister bei.'
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Automotive Mechatronics',
    title: 'Inspecting Brake Discs & Calipers to Wear Limit Specs',
    description: 'Measure brake disc thickness with a micrometer, check runout gauge on hub, and explain needed replacement of pads and guide pins.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Wir prüfen die vorderen belüfteten Bremsscheiben auf Verschleiß, Riefenbildung und Hitzerisse.', english: 'We inspect the front ventilated brake discs for wear, scoring, and thermal cracking.' },
        { german: 'Mit der Bügelmessschraube messe ich an vier Punkten eine Restdicke von einundzwanzig Komma zwei Millimetern.', english: 'Using the outside micrometer I measure at four points a remaining thickness of 21.2 millimeters.' },
        { german: 'Das vorgeschriebene Mindestmaß des Herstellers liegt bei zweiundzwanzig Millimetern; die Scheibe hat die Verschleißgrenze unterschritten.', english: 'The manufacturer\'s specified minimum thickness is 22 millimeters; the disc has fallen below the wear limit.' },
        { german: 'Die Führungsbolzen des Schwimmsattels sind schwergängig; wir müssen sie reinigen, neu mit Bremsenfett schmieren und die Manschetten ersetzen.', english: 'The floating caliper guide pins are stiff; we must clean them, re-lubricate with brake grease, and replace the dust boots.' }
      ],
      example_sentences: [
        'Wir ziehen die Radschrauben nach der Montage mit dem Drehmomentschlüssel über Kreuz auf einhundertzwanzig Newtonmeter an.',
        'Vergiss nicht, das Bremspedal mehrmals im Stand durchzutreten, bevor du den Wagen von der Hebebühne fährst.'
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Automotive Mechatronics',
    title: 'Safely De-Energizing a High-Voltage Hybrid Vehicle Battery',
    description: 'Carry out certified high-voltage isolation protocol on an electric vehicle before body repair, following safety lockouts.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Vor Beginn der Karosseriearbeiten am Hybridfahrzeug müssen wir das Hochvoltsystem fachgerecht freischalten.', english: 'Before starting body repairs on the hybrid vehicle, we must professionally de-energize the high-voltage system.' },
        { german: 'Ich ziehe isolierende Hochvolthandschuhe der Schutzklasse null an und stelle das Absperrband um den Arbeitsbereich auf.', english: 'I put on insulating class 0 high-voltage gloves and set up the safety barrier tape around the work area.' },
        { german: 'Ich ziehe den Service-Disconnect-Stecker im Kofferraum und verriegele ihn im Vorhängeschloss-Safe gegen unbefugten Zugriff.', english: 'I pull the service disconnect plug in the trunk and lock it in the lockout-tagout safe against unauthorized access.' },
        { german: 'Nach Ablauf der Entladezeit von zehn Minuten messen wir die Hochvolt-Leitungen auf Spannungsfreiheit zwischen Plus, Minus und Masse.', english: 'Following the 10-minute discharge waiting time, we test the high-voltage cables for absence of voltage between positive, negative, and ground.' }
      ],
      example_sentences: [
        'Das Fahrzeug wird gut sichtbar mit dem Warnschild Hochvolt-Gefahr — Freigeschaltet gekennzeichnet.',
        'Erst nach unterschriebenem Freischaltprotokoll darf das Werkstatt-Team an der Karosserie schweißen.'
      ]
    }
  },

  // 5. Hospitality & Culinary
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Hospitality & Culinary',
    title: 'Allergen-Conscious Dinner Order & Wine Pairing Suggestion',
    description: 'Take table orders from guests with severe celiac and nut allergies, liaise with kitchen chef, and recommend suitable regional wines.',
    min_level: 'B1',
    content: {
      target_phrases: [
        { german: 'Guten Abend! Haben Sie oder Ihre Begleitung Nahrungsmittelunverträglichkeiten oder Allergien, die wir beachten dürfen?', english: 'Good evening! Do you or your companion have food intolerances or allergies that we should take into account?' },
        { german: 'Für unsere Gäste mit Zöliakie bereitet unsere Küche das Rumpsteak komplett ohne glutenhaltige Bindemittel und mit separatem Grillbesteck zu.', english: 'For our guests with celiac disease our kitchen prepares the rump steak completely without gluten-containing binders and using separate grill utensils.' },
        { german: 'Zu dem geschmorten Hirschkalbbraten empfehle ich Ihnen einen kräftigen badischen Spätburgunder aus dem Barrique.', english: 'To accompany the braised venison roast I recommend a robust Baden Pinot Noir aged in oak barrels.' },
        { german: 'Ich vermerke die Nussallergie mit höchster Priorität auf dem elektronischen Küchenbon für den Chefkoch.', english: 'I will note the nut allergy with top priority on the electronic kitchen ticket for the head chef.' }
      ],
      example_sentences: [
        'Möchten Sie vorab etwas stilles Mineralwasser oder einen erfrischenden alkoholfreien Aperitif genießen?',
        'Ich frage in der Patisserie nach, ob das heutige Sorbet garantiert frei von Spuren von Schalenfrüchten ist.'
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Hospitality & Culinary',
    title: 'Managing Kitchen Pass Timing During Evening Rush',
    description: 'Expedite and call out tickets at the kitchen pass during peak dinner service, ensuring synchronized plating between hot line and pastry.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Achtung Küche! Bon Nummer siebenundvierzig: Drei Menüs mit Zwischengang, Tisch acht schickt die Vorspeise ab!', english: 'Attention kitchen! Ticket number 47: three multi-course menus, table eight is clearing appetizers!' },
        { german: 'Entremetier, wie lange brauchst du noch für die Selleriemousseline und das glasierte Wurzelgemüse?', english: 'Sides station, how much longer do you need for the celery mousseline and glazed root vegetables?' },
        { german: 'Saucier, wir brauchen noch zwei Minuten für das Filet Wellington; halte die Trüffeljus warm bereit.', english: 'Sauce station, we need two more minutes for the Beef Wellington; keep the truffle jus warm and ready.' },
        { german: 'Wische den Tellerrand vor dem Anrichten sauber ab; das Gesamtbild muss tadellos aussehen.', english: 'Wipe the rim of the plate clean before serving; the overall presentation must look impeccable.' }
      ],
      example_sentences: [
        'Alle vier Hauptgänge für Tisch zwölf müssen synchron auf die Passwärmebrücke; Service steht bereit.',
        'Zwei Portionen Risotto bitte sofort nachfeuern, Gast reklamiert zu lange Wartezeit.'
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Hospitality & Culinary',
    title: 'Resolving a Hotel Guest Room Complaint at Front Desk',
    description: 'Handle a distraught hotel guest at front desk whose air conditioning failed and room was not cleaned, offering an immediate upgrade and courtesy voucher.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Guten Abend Herr Hoffmann, ich entschuldige mich aufrichtig für die Unannehmlichkeiten mit der defekten Klimaanlage in Zimmer zweihundertvier.', english: 'Good evening Mr. Hoffmann, I sincerely apologize for the inconvenience with the broken air conditioning in room 204.' },
        { german: 'Ich verstehe vollkommen, dass Sie nach Ihrer langen Geschäftsreise erholsamen Schlaf bei angenehmer Zimmertemperatur erwarten.', english: 'I completely understand that after your long business trip you expect restful sleep at a comfortable room temperature.' },
        { german: 'Ich buche Sie unverzüglich und kostenfrei in eine ruhige Junior Suite im vierten Stock mit Blick auf den Park um.', english: 'I will rebook you immediately and free of charge into a quiet Junior Suite on the fourth floor overlooking the park.' },
        { german: 'Unser Gepäckträger bringt Ihre Koffer sofort hinauf, und wir laden Sie heute Abend herzlich auf ein Glas Wein an unserer Bar ein.', english: 'Our porter will bring your luggage up right away, and we warmly invite you to a complimentary glass of wine at our bar tonight.' }
      ],
      example_sentences: [
        'Hier ist Ihre neue Zimmerkarte; die Minibar in der Suite steht Ihnen heute kostenfrei zur Verfügung.',
        'Ich habe die Störung im Zimmer zweihundertvier sofort im Wartungssystem für den Haustechniker hinterlegt.'
      ]
    }
  },

  // 6. Retail/Commerce
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Retail/Commerce',
    title: 'Advising a Customer on Consumer Warranties & Return Rights',
    description: 'Explain the legal difference between statutory warranty (Gewährleistung) and manufacturer guarantee (Garantie) to a customer with a defective appliance.',
    min_level: 'B1',
    content: {
      target_phrases: [
        { german: 'Guten Tag! Haben Sie den Kassenbeleg oder den elektronischen Kaufnachweis für die Kaffeemaschine dabei?', english: 'Good day! Do you have the cash register receipt or electronic proof of purchase for the coffee machine with you?' },
        { german: 'In Deutschland gilt eine gesetzliche Gewährleistungsfrist von zwei Jahren ab Übergabe der Kaufsache.', english: 'In Germany, a statutory warranty period of two years from the handover of the purchased item applies.' },
        { german: 'Innerhalb der ersten zwölf Monate greift die Beweislastumkehr zugunsten des Verbrauchers.', english: 'Within the first 12 months, the reversal of the burden of proof applies in favor of the consumer.' },
        { german: 'Wir bieten Ihnen wahlweise eine kostenfreie Reparatur im Herstellerwerk oder den direkten Austausch gegen ein Neugerät an.', english: 'We offer you the choice of a free repair at the manufacturer facility or an immediate exchange for a new unit.' }
      ],
      example_sentences: [
        'Ich erstelle Ihnen einen Warenrücknahmeschein und gebe das defekte Gerät an unsere Reklamationsabteilung weiter.',
        'Sollte die Reparatur länger als zehn Werktage dauern, stellen wir Ihnen gerne ein Leihgerät zur Verfügung.'
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Retail/Commerce',
    title: 'Conducting Stock Inventory Count & Discrepancy Recording',
    description: 'Perform year-end physical inventory counting in consumer electronics department, investigate shrinkage, and log variances in ERP system.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Wir führen heute die jährliche Stichtagsinventur in der Unterhaltungselektronik-Abteilung durch.', english: 'Today we are conducting the annual balance-sheet inventory count in the consumer electronics department.' },
        { german: 'Erfassen Sie alle Bestände im Hochregal und auf der Verkaufsfläche systematisch per Barcode-Handscanner.', english: 'Record all stock in high racking and on the sales floor systematically using the barcode handheld scanner.' },
        { german: 'Im Warengruppenbericht zeigt sich eine Differenz von vier Tablet-Computern zwischen Soll- und Ist-Bestand.', english: 'The product group report indicates a discrepancy of four tablet computers between book stock and physical count.' },
        { german: 'Wir müssen prüfen, ob es sich um ungebuchte Retouren, Umlagerungsfehler oder Ladendiebstahl handelt.', english: 'We must investigate whether this involves unposted returns, transfer posting errors, or shoplifting.' }
      ],
      example_sentences: [
        'Wir führen im betroffenen Regalabschnitt eine Kontrollzählung durch zwei unabhängige Mitarbeiter durch.',
        'Der Inventurbogen wird nach Klärung der Abweichungen von der Filialleitung gegengezeichnet.'
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Retail/Commerce',
    title: 'Negotiating Bulk Supplier Discounts & Delivery Lead Times',
    description: 'Negotiate order terms with a wholesale distributor representative for seasonal inventory, discussing volume rebates and freight terms.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Vielen Dank für die Zusendung der aktuellen Herbst-Preisliste für Ihr Sortiment an Haushaltswaren.', english: 'Thank you for sending over the current autumn price list for your product line of household goods.' },
        { german: 'Bei einer Abnahme von fünfhundert Einheiten erwarten wir einen Mengenstaffelrabatt von mindestens acht Prozent auf den Einkaufspreis.', english: 'With an order volume of 500 units we expect a tiered volume discount of at least eight percent off the purchase price.' },
        { german: 'Welche Lieferfristen können Sie uns für die Vorweihnachtszeit vertraglich garantieren?', english: 'What delivery lead times can you contractually guarantee us for the pre-Christmas period?' },
        { german: 'Wir bestehen auf einer Lieferung frei Haus inklusive Entsorgung der Einweg-Transportverpackungen.', english: 'We insist on delivered duty paid terms including disposal of single-use transport packaging.' }
      ],
      example_sentences: [
        'Bitte senden Sie uns ein modifiziertes Rahmenangebot mit Skontofrist von vierzehn Tagen zu.',
        'Wenn die Konditionen passen, schließen wir einen Jahreskontrakt für alle fünf Filialen unserer Region ab.'
      ]
    }
  },

  // 7. Logistics & Warehousing
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Logistics & Warehousing',
    title: 'Receiving Inbound Freight & Inspecting Damage on CMR',
    description: 'Inspect incoming palletized freight from a heavy goods vehicle, inspect seal integrity, and endorse damages on the consignment note.',
    min_level: 'B1',
    content: {
      target_phrases: [
        { german: 'Guten Tag, bitte legen Sie mir den CMR-Frachtbrief und die Lieferscheine zur Prüfung vor.', english: 'Good day, please present the CMR consignment note and the delivery slips for inspection.' },
        { german: 'Ich kontrolliere vor dem Entladen die Unversehrtheit der Plombennummer am Lkw-Auflieger.', english: 'Before unloading, I check the integrity of the seal number on the truck semi-trailer.' },
        { german: 'Zwei Europaletten weisen eingedrückte Kartonagen und aufgerissene Schrumpffolie mit sichtbarem Transportschaden auf.', english: 'Two Euro-pallets exhibit crushed cardboard boxes and torn shrink wrap with visible transit damage.' },
        { german: 'Ich dokumentiere den Schaden mit Digitalfotos und trage einen detaillierten Schadensvermerk auf dem Frachtbrief ein.', english: 'I document the damage with digital photos and record a detailed damage endorsement on the consignment note.' }
      ],
      example_sentences: [
        'Der Fahrer muss den Schadensvermerk mit Datum und Unterschrift bestätigen, bevor wir den Wareneingang quittieren.',
        'Wir lagern die beschädigten Paletten im Sperrlager ein, bis die Begutachtung durch die Spedition erfolgt ist.'
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Logistics & Warehousing',
    title: 'Operating a Reach Truck in High-Bay Racking Safely',
    description: 'Operate a reach forklift truck to stow heavy pallet loads at heights above eight meters, adhering to load center and safety clearances.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Vor Fahrtantritt führe ich die tägliche Sicht- und Funktionsprüfung am Schubmaststapler durch.', english: 'Before starting operation I conduct the daily visual and operational check on the reach truck.' },
        { german: 'Prüfen Sie anhand des Traglastdiagramms, ob das Palettengewicht von achthundert Kilogramm für Regalfachebene sechs zulässig ist.', english: 'Check against the load capacity chart whether the pallet weight of 800 kilograms is permissible for shelf level six.' },
        { german: 'Ich fahre den Hubmast langsam aus und neige die Gabelzinken leicht nach hinten, um die Last beim Heben zu stabilisieren.', english: 'I extend the lifting mast slowly and tilt the fork tines slightly backwards to stabilize the load during hoisting.' },
        { german: 'Achten Sie darauf, dass der Sicherheitsabstand von mindestens fünfzig Zentimetern zu den Sprinklerköpfen unter der Hallendecke gewahrt bleibt.', english: 'Make sure that the safety clearance of at least 50 centimeters from sprinkler heads under the ceiling is maintained.' }
      ],
      example_sentences: [
        'Bremse bei Kurvenfahrten im Schmalgang rechtzeitig ab, da der Schwerpunkt in großer Höhe extrem labil ist.',
        'Ich buche den Lagerplatzwechsel per Funkscanner in Echtzeit in unser Lagerverwaltungssystem.'
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Logistics & Warehousing',
    title: 'Order Picking & Packing Hazardous Goods (ADR)',
    description: 'Pick an order containing chemical cleaning agents, apply correct ADR hazard placards, and prepare hazardous goods declaration.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Dieser Kommissionierauftrag enthält ätzende Flüssigkeiten der Gefahrgutklasse acht.', english: 'This picking order contains corrosive liquids of dangerous goods hazard class eight.' },
        { german: 'Wir müssen bauartgeprüfte UN-Gefahrgutkartons verwenden und den flüssigen Inhalt mit Bindevlies auskleiden.', english: 'We must use type-approved UN dangerous goods cartons and line the liquid contents with absorbent padding.' },
        { german: 'Befestigen Sie den Gefahrzettel für ätzende Stoffe sowie die Ausrichtungspfeile oben sichtbar auf der Verpackung.', english: 'Attach the hazard diamond label for corrosive substances and the orientation arrows visibly on top of the packaging.' },
        { german: 'Ich erstelle die Gefahrguterklärung mit Angabe der UN-Nummer und der offiziellen Transportbezeichnung für den Gefahrgutfahrer.', english: 'I generate the dangerous goods declaration specifying the UN number and official transport designation for the ADR driver.' }
      ],
      example_sentences: [
        'Die Begrenzte-Menge-Regelung (Limited Quantity) kann hier angewendet werden, da die Einzelgebinde unter einem Liter liegen.',
        'Kontrolliere vor dem Verschluss des Versandstücks, dass alle Flaschenverschlüsse kindersicher verriegelt sind.'
      ]
    }
  },

  // 8. IT/Technical
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'IT/Technical',
    title: 'Resolving a Critical Priority-1 Server Outage Ticket',
    description: 'Diagnose an unexpected database server cluster outage, analyze system log files, and provide incident status updates to management.',
    min_level: 'B1',
    content: {
      target_phrases: [
        { german: 'Im Ticketsystem ist ein Priority-Eins-Ticket eingegangen: Die zentrale Kundendatenbank reagiert seit zehn Minuten nicht mehr.', english: 'A Priority-1 ticket came in on the ticketing system: the central customer database has stopped responding for ten minutes.' },
        { german: 'Ich logge mich über die Notfallkonsole auf dem Host-Server ein und analysiere die System-Logdateien.', english: 'I log in via the emergency out-of-band console on the host server and analyze the system log files.' },
        { german: 'Die Festplattenpartition des Transaktionsprotokolls ist zu einhundert Prozent vollgelaufen, weshalb der Dienst gestoppt wurde.', english: 'The transaction log disk partition is 100 percent full, which is why the database service was halted.' },
        { german: 'Ich gebe dem IT-Leiter Bescheid, dass wir die alten Log-Dateien archivieren und den Dienst in fünf Minuten neu starten.', english: 'I will inform the IT director that we are archiving the legacy logs and restarting the service in five minutes.' }
      ],
      example_sentences: [
        'Wir müssen die automatische Speicherüberwachung anpassen, damit zukünftig bereits bei achtzig Prozent Füllstand eine Warnung ausgelöst wird.',
        'Nach dem Dienstneustart führen wir einen Konsistenzcheck der Datenbanktabellen durch.'
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'IT/Technical',
    title: 'Configuring Secure VPN Access & Two-Factor Authentication',
    description: 'Assist a remote employee with setting up an encrypted VPN tunnel, MFA authenticator app tokens, and endpoint compliance check.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Guten Tag, ich unterstütze Sie bei der Einrichtung Ihres sicheren Homeoffice-Zugangs zum Firmennetzwerk.', english: 'Good day, I am assisting you in configuring your secure home-office access to the company corporate network.' },
        { german: 'Laden Sie bitte die offizielle Authenticator-App auf Ihr Diensthandy herunter und scannen Sie diesen QR-Code.', english: 'Please download the official authenticator app onto your corporate phone and scan this QR code.' },
        { german: 'Geben Sie beim Verbindungsaufbau im VPN-Client zuerst Ihr Domänenpasswort und danach den sechsstelligen Einmalcode ein.', english: 'When establishing the connection in the VPN client, enter your domain password first and then the six-digit one-time passcode.' },
        { german: 'Die Sicherheitsrichtlinie erfordert, dass die Festplattenverschlüsselung und das Antivirenprogramm auf Ihrem Laptop aktiv sind.', english: 'The security policy mandates that hard drive encryption and antivirus software are active on your laptop.' }
      ],
      example_sentences: [
        'Sollten Sie sich von einem fremden WLAN-Netz einwählen, wird der Datenverkehr automatisch durch den IPSec-Tunnel verschlüsselt.',
        'Ich habe Ihr Benutzerzertifikat für zwölf Monate auf dem VPN-Gateway freigeschaltet.'
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'IT/Technical',
    title: 'Conducting Code Review & Resolving Git Merge Conflicts',
    description: 'Participate in a peer pull request code review with senior developers, discussing refactoring, unit test coverage, and branch rebase.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Ich habe deinen Pull Request für das neue Abrechnungsmodul im Repository geprüft.', english: 'I reviewed your pull request for the new billing module in the repository.' },
        { german: 'Die Unit-Tests decken die Kernfunktionalität gut ab, aber die Fehlerbehandlung bei Netzwerk-Timeouts fehlt noch.', english: 'The unit tests cover core functionality well, but error handling for network timeouts is still missing.' },
        { german: 'Durch parallele Commits auf dem Hauptzweig ist ein Merge-Konflikt in der Konfigurationsdatei aufgetreten.', english: 'Due to parallel commits on the main branch, a merge conflict has occurred in the configuration file.' },
        { german: 'Bitte führe einen interaktiven Rebase auf den aktuellen Entwicklungszweig durch und löse die Konflikte manuell auf.', english: 'Please perform an interactive rebase onto the current development branch and resolve the conflicts manually.' }
      ],
      example_sentences: [
        'Achte darauf, keine sensiblen API-Schlüssel oder Zugangsdaten in den Versionsverlauf einzuchecken.',
        'Sobald die CI-Pipeline grün durchläuft, gebe ich mein Approval für den Merge in die Produktionslinie.'
      ]
    }
  },

  // 9. Industrial/Manufacturing
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Industrial/Manufacturing',
    title: 'Setting Up a 5-Axis CNC Milling Center & Origin Offsets',
    description: 'Set up a 5-axis CNC machining center for aluminum aerospace parts, set tool geometry offsets, and clamp raw billet stock.',
    min_level: 'B1',
    content: {
      target_phrases: [
        { german: 'Wir rüsten das Fünf-Achs-Bearbeitungszentrum für die Kleinserienfertigung von Gehäuseteilen um.', english: 'We are retooling the 5-axis machining center for small-batch manufacturing of housing components.' },
        { german: 'Spannen Sie das Rohmaterial im hydraulischen Maschinenschraubstock mit einem Drehmoment von achtzig Newtonmetern ein.', english: 'Clamp the raw material in the hydraulic machine vise with a torque of 80 Newton meters.' },
        { german: 'Mit dem 3D-Messtaster ermittle ich die Werkstück-Nullpunkte in der X-, Y- und Z-Achse und übertrage sie in die Steuerung.', english: 'Using the 3D probe I determine the workpiece origin zero points in the X, Y, and Z axes and transfer them into the controller.' },
        { german: 'Prüfen Sie vor dem Programmstart im Werkzeugmagazin die Werkzeugstandzeiten der Hartmetallfräser.', english: 'Before starting the program, verify the tool life remaining on the carbide end mills in the tool magazine.' }
      ],
      example_sentences: [
        'Lass das NC-Programm beim ersten Durchlauf im Einzelschritt-Modus mit gedrosseltem Eilgang ablaufen.',
        'Schalte die Hochdruck-Kühlschmierstoffzufuhr ein, um Spanbildung und Werkzeugüberhitzung zu verhindern.'
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Industrial/Manufacturing',
    title: 'Quality Inspection with Digital Caliper & Coordinate Metrology',
    description: 'Measure precision milled components against engineering drawing tolerances, record deviations on statistical process control sheets.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Wir führen die Erststückprüfung des neu gefertigten Flansches anhand der technischen Zeichnung durch.', english: 'We are conducting the first-piece inspection of the newly manufactured flange against the engineering drawing.' },
        { german: 'Ich messe die Passbohrung mit dem Innenfeinmessgerät und vergleiche das Maß mit der H7-Toleranzvorgabe.', english: 'I measure the precision bore with the internal micrometer and compare the dimension to the H7 tolerance specification.' },
        { german: 'Der gemessene Außendurchmesser liegt mit zwei Hundertstel Millimetern knapp über dem zulässigen Größtmaß.', english: 'The measured outer diameter lies at two hundredths of a millimeter just above the upper permissible limit.' },
        { german: 'Wir müssen eine Werkzeugkorrektur am CNC-Drehwerkzeug vornehmen, um den Maßversatz auszugleichen.', english: 'We must apply a tool offset compensation on the CNC turning tool to eliminate the dimensional variance.' }
      ],
      example_sentences: [
        'Trage alle Messwerte lückenlos in das digitale Erstmusterprüfprotokoll ein.',
        'Für komplexe Freiformflächen spannen wir das Werkstück auf der 3D-Koordinatenmessmaschine ein.'
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Industrial/Manufacturing',
    title: 'Preventative Maintenance & Drive Belt Replacement on Assembly Line',
    description: 'Shut down and lock out a production line section to inspect pneumatic actuators, lubricate linear guides, and replace worn drive belts.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Heute steht die geplante vorbeugende Instandhaltung an der automatischen Montagelinie an.', english: 'Today scheduled preventative maintenance is due on the automated assembly line.' },
        { german: 'Vor Beginn der mechanischen Arbeiten schalten wir die Hauptdruckluftzufuhr ab und entlüften das Leitungssystem.', english: 'Before starting mechanical work, we shut off the main pneumatic air supply and bleed the piping system.' },
        { german: 'Der Zahnriemen des Hauptantriebs zeigt deutliche Verschleißspuren und Haarrisse an den Zahnflanken.', english: 'The timing belt of the main drive displays noticeable wear signs and hairline cracks on the tooth flanks.' },
        { german: 'Wir montieren einen neuen Riemen und spannen ihn exakt auf die vom Hersteller vorgeschriebene Eigenfrequenz von fünfundfünfzig Hertz.', english: 'We fit a new belt and tension it precisely to the manufacturer-specified natural frequency of 55 Hertz.' }
      ],
      example_sentences: [
        'Wir schmieren alle Linearführungen mit der Fettpresse unter Verwendung des spezifizierten Hochleistungsschmierstoffs.',
        'Nach Beendigung der Arbeiten führen wir einen zweiminütigen Probelauf ohne Werkstücke durch.'
      ]
    }
  }
];
