export const ausbildungInterviews = [
  // 1. Electrician
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Electrician',
    type_name: 'Behavioral',
    min_level: 'B1',
    description: 'Behavioral interview exploring craft motivation, punctuality, learning readiness, and commitment to the 3.5-year dual electrical apprenticeship.',
    content: {
      sample_questions: [
        {
          german: 'Warum haben Sie sich für eine duale Ausbildung zum Elektroniker für Energie- und Gebäudetechnik entschieden?',
          english: 'Why did you choose a dual apprenticeship as an electronics technician for energy and building systems?',
          guidance: 'Express genuine passion for electrical craft, fascination with renewable energy (photovoltaics, heat pumps), and understanding of the dual system (Berufsschule und Betrieb).'
        },
        {
          german: 'Pünktlichkeit und Zuverlässigkeit sind auf deutschen Baustellen elementar. Wie stellen Sie sicher, dass Sie morgens pünktlich um sieben Uhr abfahrbereit sind?',
          english: 'Punctuality and reliability are essential on German construction sites. How do you ensure you are ready for departure at 7:00 AM?',
          guidance: 'Affirm personal discipline, planning travel routes in advance, setting backup alarms, and recognizing how team departures depend on every member.'
        },
        {
          german: 'Erzählen Sie von einer handwerklichen Aufgabe, bei der etwas nicht auf Anhieb funktioniert hat. Wie haben Sie die Lösung gefunden?',
          english: 'Tell us about a manual craftsmanship task where something didn’t work right away. How did you find the solution?',
          guidance: 'Describe perseverance, analyzing the error systematically rather than guessing, and asking experienced mentors (Gesellen) for feedback.'
        }
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Electrician',
    type_name: 'Technical',
    min_level: 'B2',
    description: 'Technical craft assessment on DIN VDE standards, the 5 Safety Rules, circuit diagrams, and protective RCD switch operation.',
    content: {
      sample_questions: [
        {
          german: 'Nennen und erläutern Sie die fünf Sicherheitsregeln der Elektrotechnik nach DIN VDE 0105 in der exakten Reihenfolge.',
          english: 'Name and explain the five safety rules of electrical engineering according to DIN VDE 0105 in exact sequence.',
          guidance: 'Recite flawlessly: 1. Freischalten, 2. Gegen Wiedereinschalten sichern, 3. Spannungsfreiheit allpolig feststellen, 4. Erden und Kurzschließen, 5. Benachbarte unter Spannung stehende Teile abdecken.'
        },
        {
          german: 'Wie funktioniert ein Fehlerstrom-Schutzschalter (RCD/FI-Schalter) und bei welchem Bemessungsfehlerstrom löst er im Personenschutz typischerweise aus?',
          english: 'How does a residual current device (RCD) work and at what rated residual current does it typically trip for personal protection?',
          guidance: 'Explain differential sum current transformer (Summenstromwandler), balancing active conductors, and standard 30 mA tripping threshold for personal shock safety.'
        },
        {
          german: 'Wie lesen Sie einen Stromlaufplan in zusammenhängender Darstellung und welche Kennfarben haben Außenleiter, Neutralleiter und Schutzleiter?',
          english: 'How do you read a circuit schematic diagram and what are the standard wire colors for phase, neutral, and protective earth conductors?',
          guidance: 'State wire color coding per DIN EN 60446: L1/L2/L3 (brown, black, grey), N (blue), PE (green-yellow).'
        }
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Electrician',
    type_name: 'Situational',
    min_level: 'B1',
    description: 'Scenario assessment testing response to electrical hazards on construction sites, damaged cables, and customer interactions on site.',
    content: {
      sample_questions: [
        {
          german: 'Auf einer Baustelle bemerken Sie, dass die Isolierung einer Zuleitung zur Betonmischmaschine aufgescheuert ist und Kupfer freiliegt. Was tun Sie?',
          english: 'On a construction site you notice that the insulation of a feeder cable to the concrete mixer is abraded and copper is exposed. What do you do?',
          guidance: 'Stop machine operation immediately, disconnect power supply at distributor board, tag out damaged cable, and notify the site supervisor (Bauleiter).'
        },
        {
          german: 'Ein Kunde wünscht während der Rohbauinstallation zusätzliche Steckdosen, die nicht im Ausführungsplan stehen. Wie reagieren Sie?',
          english: 'A customer requests additional wall outlets during rough-in installation that are not in the construction plan. How do you react?',
          guidance: 'Politely acknowledge the wish, explain that modifications require technical recalculation and approval through the master electrician (Meister), and avoid unauthorized drilling.'
        },
        {
          german: 'Ihr Geselle weist Sie an, Messungen an einem offenen Verteilerkasten durchzuführen, aber Ihnen fehlt die entsprechende PSA. Was sagen Sie?',
          english: 'Your journeyman instructs you to take measurements on an open distribution panel, but you lack the required PPE. What do you say?',
          guidance: 'Assert safety respectfully: state that safety goggles and insulated tools are required by DGUV Vorschrift 3, and retrieve the equipment before proceeding.'
        }
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Electrician',
    type_name: 'Panel',
    min_level: 'B2',
    description: 'Formal interview with Master Craftsman (Handwerksmeister) and Chamber of Crafts (HWK) apprentice coordinator on vocational readiness.',
    content: {
      sample_questions: [
        {
          german: 'Was erwarten Sie von unserem Handwerksbetrieb als Ihrem Ausbildungsbetrieb und welche Stärken bringen Sie mit?',
          english: 'What do you expect from our craft company as your training employer and what strengths do you bring along?',
          guidance: 'Highlight willingness to learn, mechanical aptitude, physical fitness, and desire for practical mentoring across diverse customer installations.'
        },
        {
          german: 'Die Ausbildung erfordert auch mathematische und physikalische Grundlagen in der Berufsschule. Wie schätzen Sie Ihre Kenntnisse in Fachrechnen ein?',
          english: 'The apprenticeship also requires mathematical and physical foundations at vocational school. How do you assess your technical math skills?',
          guidance: 'Demonstrate confidence in Ohm’s law ($U=R \cdot I$), power calculations ($P=U \cdot I$), and readiness to attend remedial tutoring if needed.'
        },
        {
          german: 'Sind Sie bereit, auf Montage oder wechselnden Baustellen im gesamten Landkreis zu arbeiten?',
          english: 'Are you prepared to work on installation sites or changing construction projects across the entire district?',
          guidance: 'Confirm travel flexibility, early morning departure readiness, and positive attitude toward teamwork on site.'
        }
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Electrician',
    type_name: 'Phone Screen',
    min_level: 'B1',
    description: 'Preliminary phone screening checking school certificates, language readiness for German vocational school (Berufsschule), and visa paperwork.',
    content: {
      sample_questions: [
        {
          german: 'Guten Tag! Haben Sie bereits einen Schulabschluss (z.B. Mittlere Reife oder ausländisches Äquivalent) anerkennen lassen?',
          english: 'Good day! Have you already had your school leaving certificate (e.g. secondary school diploma or foreign equivalent) recognized?',
          guidance: 'Provide certificate equivalence details from the Zeugnisanerkennungsstelle with your German grade conversion.'
        },
        {
          german: 'Trauen Sie sich zu, dem deutschsprachigen Fachunterricht in der Berufsschule und den Prüfungen der Handwerkskammer zu folgen?',
          english: 'Do you feel confident following German-language technical classes at vocational school and passing Chamber of Crafts exams?',
          guidance: 'Emphasize your current B1/B2 German level, active vocabulary study of electrical terms (Fachbegriffe), and motivation.'
        },
        {
          german: 'Haben Sie bereits ein Praktikum (Schnuppertag) in einem Handwerksbetrieb absolviert?',
          english: 'Have you already completed an internship or trial workday in a craft business?',
          guidance: 'Share practical hands-on experience, tool handling, and familiarity with work safety clothing (Sicherheitsschuhe S3).'
        }
      ]
    }
  },

  // 2. Plumbing/Heating (SHK)
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Plumbing/Heating',
    type_name: 'Behavioral',
    min_level: 'B1',
    description: 'Behavioral interview covering physical resilience, teamwork in tight installation spaces, and customer courtesy in private residences.',
    content: {
      sample_questions: [
        {
          german: 'Warum möchten Sie Anlagenmechaniker für Sanitär-, Heizungs- und Klimatechnik (SHK) werden?',
          english: 'Why do you want to become a plant mechanic for sanitary, heating, and air conditioning technology (SHK)?',
          guidance: 'Emphasize enthusiasm for modern environmental technology (heat pumps, solar thermal, biomass) and pride in building tangible domestic infrastructure.'
        },
        {
          german: 'Wie gehen Sie mit Arbeiten unter beengten Verhältnissen, wie z.B. in Kriechkellern oder unter Dachschrägen, um?',
          english: 'How do you handle working in cramped spaces, such as crawlspaces or under attic eaves?',
          guidance: 'Highlight physical stamina, calm spatial awareness, focus on safety ergonomics, and maintaining quality under tough working conditions.'
        },
        {
          german: 'Erzählen Sie von einer Situation, in der Sie im Team eine schwere Last, wie einen Heizkessel oder Pufferspeicher, sicher transportiert haben.',
          english: 'Tell us about a situation where you worked in a team to safely transport a heavy load, such as a heating boiler or buffer tank.',
          guidance: 'Focus on communication, coordinated lifting, utilizing transport dollies and stair-climbers, and preventing property damage in stairwells.'
        }
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Plumbing/Heating',
    type_name: 'Technical',
    min_level: 'B2',
    description: 'Technical evaluation of heating hydraulic balancing, pipe joining methods (pressing, soldering), and gas installation safety rules (TRGI).',
    content: {
      sample_questions: [
        {
          german: 'Was versteht man unter dem hydraulischen Abgleich einer Heizungsanlage und warum ist er energetisch so wichtig?',
          english: 'What is meant by hydraulic balancing of a heating system and why is it so important for energy efficiency?',
          guidance: 'Explain adjusting flow rates through preset thermostatic valves so all radiators receive optimal hot water distribution regardless of distance from pump.'
        },
        {
          german: 'Welche Rohrverbindungstechniken (Pressverbindung, Löten, Schweißen, Schraubverbindung) setzen Sie bei Kupfer- und Verbundrohren ein?',
          english: 'Which pipe joining techniques (press fitting, soldering, welding, threaded joint) do you use for copper and multilayer composite pipes?',
          guidance: 'Describe operating radial press tools, verifying insertion depth markings on fittings, de-burring pipe ends, and choosing appropriate sealing rings (O-Ringe).'
        },
        {
          german: 'Welche elementaren Sicherheitsregeln gelten nach den Technischen Regeln für Gasinstallationen (TRGI) beim Arbeiten an Gasleitungen?',
          english: 'What fundamental safety rules apply according to the Technical Rules for Gas Installations (TRGI) when working on gas pipes?',
          guidance: 'Mention shutting main gas cock (Hauptabsperreinrichtung), verifying absence of gas with calibrated detector, conducting pressure leak test, and venting rooms.'
        }
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Plumbing/Heating',
    type_name: 'Situational',
    min_level: 'B1',
    description: 'Scenario assessment testing response to sudden water pipe bursts, boiler leakages, and protective shoe covers in customer apartments.',
    content: {
      sample_questions: [
        {
          german: 'Bei einer Demontage im bewohnten Mehrfamilienhaus schließt ein altes Absperrventil nicht vollständig und Wasser strömt aus. Was tun Sie sofort?',
          english: 'During dismantling in an occupied apartment building, an old shut-off valve doesn’t close completely and water gushes out. What do you do immediately?',
          guidance: 'Locate central main building shutoff valve in basement, shut it down immediately, deploy water vacuum and buckets, and notify the building manager.'
        },
        {
          german: 'Ein Kunde beschwert sich empört, dass Sie und Ihr Geselle schmutzige Spuren auf seinem Parkettboden hinterlassen haben. Wie deeskalieren Sie?',
          english: 'A customer complains indignantly that you and your journeyman left dirty shoe prints on their parquet floor. How do you de-escalate?',
          guidance: 'Apologize sincerely, put on clean shoe covers (Überziehschuhe), lay down protective fleece (Abdeckvlies), and clean up dirt immediately.'
        },
        {
          german: 'Während einer Heizungswartung stellen Sie fest, dass der Abgaswert eines Ölkessels den zulässigen Grenzwert überschreitet. Was ist zu tun?',
          english: 'During heating maintenance you determine that the flue gas reading of an oil boiler exceeds the legal threshold. What needs to be done?',
          guidance: 'Readjust burner air-to-fuel ratio, check nozzle for carbon buildup, inform customer of mandatory compliance, and document values in inspection report.'
        }
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Plumbing/Heating',
    type_name: 'Panel',
    min_level: 'B2',
    description: 'Interview with Heating Master (Heizungsbaumeister) and General Manager discussing energy transition goals and customer orientation.',
    content: {
      sample_questions: [
        {
          german: 'Die Wärmewende verlagert den Schwerpunkt von Öl und Gas hin zu Wärmepumpen. Wie stehen Sie zu dieser technischen Entwicklung?',
          english: 'The heating transition is shifting focus from oil and gas toward heat pumps. What is your view on this technological evolution?',
          guidance: 'Express excitement for heat pump technology, monobloc vs split systems, COP efficiency, and sustainable building engineering.'
        },
        {
          german: 'Wie gehen Sie mit Notdiensteinsätzen an eiskalten Winterwochenenden um, wenn bei Kunden die Heizung ausfällt?',
          english: 'How do you handle emergency callouts on freezing winter weekends when customers lose heating?',
          guidance: 'Show customer service commitment, understanding urgency of frozen pipe risks and vulnerable families, and willingness to participate in standby rotations.'
        },
        {
          german: 'Welche handwerklichen Werkzeuge haben Sie privat oder im Praktikum bereits sicher bedient?',
          english: 'Which craft tools have you already operated safely in private projects or during internships?',
          guidance: 'Mention pipe cutters (Rohrabschneider), pipe wrenches (Rohrzange), thread cutters (Kluppe), press tools, and cordless drills.'
        }
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Plumbing/Heating',
    type_name: 'Phone Screen',
    min_level: 'B1',
    description: 'Screening phone call verifying apprenticeship contract prerequisites, physical fitness certificate (Jugendarbeitsschutz / G25), and language level.',
    content: {
      sample_questions: [
        {
          german: 'Hallo! Können Sie mir kurz erklären, was ein Anlagenmechaniker für SHK auf der Baustelle genau macht?',
          english: 'Hello! Could you briefly explain to me what an SHK plant mechanic actually does on a construction site?',
          guidance: 'Summarize core responsibilities: installing water supply pipes, drainage, heating systems, assembling bathrooms, and servicing equipment.'
        },
        {
          german: 'Besitzen Sie die gesundheitliche Eignung für schwere handwerkliche Arbeit und das Heben von Lasten?',
          english: 'Do you possess the health fitness required for heavy manual craftsmanship and lifting loads?',
          guidance: 'Confirm physical robustness, lack of back issues or dust allergies, and readiness for medical checkup.'
        },
        {
          german: 'Haben Sie bereits einen Ausbildungsvertrag bei der Handwerkskammer registrieren lassen oder suchen Sie noch einen Ausbildungsplatz?',
          english: 'Have you already registered an apprenticeship contract with the Chamber of Crafts or are you still looking for a placement?',
          guidance: 'State your current status clearly (searching for immediate start or upcoming training year starting August/September).'
        }
      ]
    }
  },

  // 3. Carpentry (Tischler / Schreiner)
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Carpentry',
    type_name: 'Behavioral',
    min_level: 'B1',
    description: 'Behavioral interview exploring spatial imagination, respect for natural materials, wood shop safety discipline, and eye for detail.',
    content: {
      sample_questions: [
        {
          german: 'Was fasziniert Sie am Werkstoff Holz und warum möchten Sie den Beruf des Tischlers bzw. Schreiners erlernen?',
          english: 'What fascinates you about wood as a material and why do you want to learn the trade of a carpenter/joiner?',
          guidance: 'Highlight love for working with natural timber, appreciating grain patterns, creating durable bespoke furniture, and combining tradition with modern CNC tools.'
        },
        {
          german: 'Präzision im Millimeterbereich ist entscheidend. Wie gehen Sie vor, um Mess- und Anreißfehler beim Zuschneiden zu vermeiden?',
          english: 'Precision down to the millimeter is decisive. How do you avoid measuring and scribing errors when cutting lumber?',
          guidance: 'Explain the "measure twice, cut once" principle, using precision calipers and marking gauges (Streichmaß), and accounting for saw blade kerf (Schnittbreite).'
        },
        {
          german: 'Wie reagieren Sie, wenn ein Kollege an einer stationären Holzbearbeitungsmaschine eine Sicherheitseinrichtung abbaut, um schneller zu arbeiten?',
          english: 'How do you react if a colleague removes a safety guard on a stationary woodworking machine to work faster?',
          guidance: 'Intervene immediately: machine safety guards (Spaltkeil, Schutzhaube) are non-negotiable legal protections against severe hand injuries.'
        }
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Carpentry',
    type_name: 'Technical',
    min_level: 'B2',
    description: 'Technical joinery interview covering traditional wood joints (Zinken, Dübel), stationary machine safety (TSM course), and timber moisture.',
    content: {
      sample_questions: [
        {
          german: 'Welche Holzverbindungsarten kennen Sie für Vollholzrahmen und Schubkästen (z.B. Schwalbenschwanzzinkung, Schlitz und Zapfen, Flachdübel)?',
          english: 'What types of wood joints do you know for solid wood frames and drawers (e.g. dovetail joints, mortise and tenon, biscuit dowels)?',
          guidance: 'Detail mechanics of interlocking wood joints, glue surface contact, grain orientation, and resisting tensile pull forces.'
        },
        {
          german: 'Welche Sicherheitsvorschriften gelten für das Arbeiten an der Formatkreissäge und an der Abrichthobelmaschine nach den TSM-Lehrgängen?',
          english: 'What safety regulations apply to working on sliding table saws and jointer-planers per TSM machine safety courses?',
          guidance: 'Detail using push sticks (Schiebestock), adjusting blade height 10 mm above workpiece, setting jointer bridge guard (Brückenschutz), no loose clothing.'
        },
        {
          german: 'Warum muss die Holzfeuchte vor der Möbelfertigung gemessen werden und was passiert, wenn zu feuchtes Holz verbaut wird?',
          english: 'Why must timber moisture content be measured prior to furniture construction and what happens if excessively moist wood is used?',
          guidance: 'Explain fiber saturation point, equilibrium moisture content (Ausgleichsfeuchte 8-10% indoors), and dimensional shrinkage/warping/cracking risks.'
        }
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Carpentry',
    type_name: 'Situational',
    min_level: 'B1',
    description: 'Scenario assessment testing response to veneer tear-out, customer door fitting adjustments, and workshop splinter injuries.',
    content: {
      sample_questions: [
        {
          german: 'Beim Formatieren einer furnierten Spanplatte reißt das Furnier an der Unterseite aus. Was überprüfen Sie sofort an der Säge?',
          english: 'While sizing a veneered particle board, the veneer tears out on the underside. What do you immediately check on the saw?',
          guidance: 'Check scoring saw blade (Vorritzsäge) alignment and sharpness, feed speed, and use sacrificial backing board or zero-clearance insert.'
        },
        {
          german: 'Bei der Montage einer maßgefertigten Innentür beim Kunden stellt sich heraus, dass die Maueröffnung schief ist und die Zarge klemmt. Wie lösen Sie das?',
          english: 'During installation of a custom interior door at a customer home, the wall opening turns out out-of-plumb and the frame jams. How do you solve this?',
          guidance: 'Check with spirit level, use wooden shims/wedges (Hinterklotzung) to align jamb plumb, adjust hinges, and bridge wall gaps with appropriate architraves.'
        },
        {
          german: 'Sie ziehen sich beim Hobeln von Hartholz einen tiefen Holzsplitter unter den Fingernagel zu. Wie handeln Sie bezüglich Erster Hilfe?',
          english: 'While planing hardwood you get a deep wooden splinter lodged under your fingernail. How do you act regarding first aid?',
          guidance: 'Stop work, clean and disinfect wound, seek company first aider (Ersthelfer), record injury in the first aid log book (Verbandbuch) for BG insurance.'
        }
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Carpentry',
    type_name: 'Panel',
    min_level: 'B2',
    description: 'Interview with Master Carpenter (Schreinermeister) and Workshop Foreman evaluating technical drawing skills and Gesellenstück ambition.',
    content: {
      sample_questions: [
        {
          german: 'Haben Sie bereits Erfahrung im Lesen von technischen Zeichnungen und Möbelbauplänen (Dreitafelprojektion, Maßketten)?',
          english: 'Do you already have experience in reading technical drawings and furniture construction plans (orthographic projection, dimension lines)?',
          guidance: 'Express familiarity with scale representations (1:1, 1:10), section views (Schnittzeichnungen), material hatching, and tolerance markings.'
        },
        {
          german: 'Welche Ideen haben Sie für Ihr späteres Gesellenstück am Ende Ihrer dreijährigen Ausbildung?',
          english: 'What initial ideas do you have for your final journeyman’s piece (Gesellenstück) at the end of your three-year training?',
          guidance: 'Share an ambitious yet realistic vision (e.g. solid oak sideboard with hand-cut dovetail drawers and veneer inlays) showing passion for the craft.'
        },
        {
          german: 'Wie stehen Sie zu Überstunden bei dringenden Küchen- oder Ladenbaumontagen vor Feiertagen?',
          english: 'How do you feel about overtime during urgent kitchen or commercial shopfitting installations before holidays?',
          guidance: 'Affirm flexibility to complete installations on schedule, respecting apprentice legal hour regulations while demonstrating team commitment.'
        }
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Carpentry',
    type_name: 'Phone Screen',
    min_level: 'B1',
    description: 'Introductory phone screen assessing manual dexterity, color vision, German comprehension for vocational school, and trial day setup.',
    content: {
      sample_questions: [
        {
          german: 'Guten Tag! Haben Sie in Ihrer Freizeit schon einmal mit Holz gearbeitet oder eigene Möbel gebaut?',
          english: 'Good day! Have you ever worked with wood in your spare time or built your own furniture?',
          guidance: 'Describe DIY projects, restoring wooden items, model making, or working alongside family craftspeople.'
        },
        {
          german: 'Haben Sie Probleme mit Holzstaub, Lärm oder Lösungsmitteln von Lacken und Ölen?',
          english: 'Do you have issues with wood dust, noise, or solvents from lacquers and oils?',
          guidance: 'Confirm absence of asthma or respiratory allergies, and readiness to wear protective ear defenders and dust masks (FFP2).'
        },
        {
          german: 'Wann hätten Sie Zeit, für zwei Tage ein Probepraktikum in unserer Schreinerei zu absolvieren?',
          english: 'When would you have time to complete a two-day trial internship in our joinery workshop?',
          guidance: 'Express enthusiasm, offer immediate dates, and confirm bringing safety footwear.'
        }
      ]
    }
  },

  // 4. Automotive Mechatronics (Kfz-Mechatroniker)
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Automotive Mechatronics',
    type_name: 'Behavioral',
    min_level: 'B1',
    description: 'Behavioral interview exploring fascination with automotive mechanics, diagnostic patience, and workshop cleanliness.',
    content: {
      sample_questions: [
        {
          german: 'Warum möchten Sie Kfz-Mechatroniker werden und welcher Bereich (Pkw, Nutzfahrzeuge, System- und Hochvolttechnik) interessiert Sie besonders?',
          english: 'Why do you want to become an automotive mechatronics technician and which area (passenger cars, commercial vehicles, EV high-voltage) interests you most?',
          guidance: 'Express passion for automotive engineering, interest in the intersection of mechanical engines, complex CAN-bus networks, and electric mobility.'
        },
        {
          german: 'Die Fehlersuche in modernen Fahrzeugen kann Stunden dauern. Wie bewahren Sie Ruhe und Geduld bei komplexen Elektronikfehlern?',
          english: 'Troubleshooting in modern vehicles can take hours. How do you maintain calm and patience during complex electronic faults?',
          guidance: 'Detail a structured diagnostic mindset: avoiding random part-swapping, checking circuit diagrams, measuring reference voltages, and reviewing OBD-II live data.'
        },
        {
          german: 'Wie halten Sie Ihren Werkstattarbeitsplatz und Spezialwerkzeuge (Drehmomentschlüssel, Diagnosegeräte) sauber und einsatzbereit?',
          english: 'How do you keep your workshop bay and specialized tools (torque wrenches, diagnostic tablets) clean and operational?',
          guidance: 'Emphasize 5S workplace organization, wiping down tools, recalibrating torque wrenches after use, and protecting vehicle interiors with seat covers.'
        }
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Automotive Mechatronics',
    type_name: 'Technical',
    min_level: 'B2',
    description: 'Technical automotive interview covering OBD-II diagnostic readouts, high-voltage vehicle safety (DGUV 209-093), and brake pad replacement.',
    content: {
      sample_questions: [
        {
          german: 'Wie gehen Sie bei einer OBD-II-Fehlerdiagnose vor, wenn die Motorkontrollleuchte (MIL) leuchtet und ein P0300-Code hinterlegt ist?',
          english: 'How do you proceed with an OBD-II fault diagnosis when the check engine light (MIL) illuminates and code P0300 is stored?',
          guidance: 'Identify P0300 as random/multiple cylinder misfire; check spark plugs, ignition coils, fuel injectors, fuel rail pressure, and intake air leaks systematically.'
        },
        {
          german: 'Welche Sicherheitsregeln müssen beachtet werden, bevor an einem Elektro- oder Hybridfahrzeug im Hochvoltbereich (über 60V DC) gearbeitet werden darf?',
          english: 'What safety rules must be observed before working on an electric or hybrid vehicle in the high-voltage range (above 60V DC)?',
          guidance: 'Explain high-voltage qualification (Fachkundige Person Hochvolt), pulling service disconnect / manual disconnect plug, locking against reconnect, verifying zero voltage with certified multimeter.'
        },
        {
          german: 'Welche Schritte und Drehmomente beachten Sie beim fachgerechten Wechsel von Bremsscheiben und Bremsbelägen an einer Schwimmsattelbremse?',
          english: 'What steps and torque specifications do you observe when professionally replacing brake discs and pads on a floating caliper brake?',
          guidance: 'Inspect caliper guide pins, clean hub surface with wire brush to eliminate lateral runout, apply ceramic paste to pad ears, torque caliper carrier bolts with Loctite to factory spec.'
        }
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Automotive Mechatronics',
    type_name: 'Situational',
    min_level: 'B1',
    description: 'Scenario assessment testing response to oil spills, cross-threaded wheel bolts, and customer test drive observations.',
    content: {
      sample_questions: [
        {
          german: 'Beim Ablassen des Motoröls kippt die Auffangwanne um und zehn Liter Altöl laufen auf den Werkstattboden. Was tun Sie sofort?',
          english: 'While draining engine oil, the catch pan tips over and 10 liters of used oil spill onto the workshop floor. What do you do immediately?',
          guidance: 'Contain the spill with oil binding granules (Ölbindemittel), prevent oil from entering drainage grates/oil separator, alert workshop supervisor, dispose of granules as hazardous waste.'
        },
        {
          german: 'Beim Anziehen der Radschrauben bemerken Sie, dass ein Gewinde an der Radnabe beschädigt ist und die Schraube durchdreht. Was unternehmen Sie?',
          english: 'When tightening wheel bolts you notice a hub thread is stripped and the bolt spins freely. What do you do?',
          guidance: 'Do not ignore or overtighten; inform service advisor that wheel hub replacement or thread repair sleeve is legally required for roadworthiness.'
        },
        {
          german: 'Ein Kunde behauptet nach der Inspektion, die Werkstatt habe einen Kratzer in seine Fahrertür gemacht. Wie verhalten Sie sich?',
          english: 'A customer claims after service that the shop caused a scratch on their driver’s door. How do you behave?',
          guidance: 'Stay calm and polite, refer to the vehicle intake checklist (Dialogannahme-Protokoll) where pre-existing damage is documented with photos, and involve the service manager.'
        }
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Automotive Mechatronics',
    type_name: 'Panel',
    min_level: 'B2',
    description: 'Panel interview with Service Manager (Serviceleiter) and Master Mechanic (Kfz-Meister) discussing brand certifications and diagnostics.',
    content: {
      sample_questions: [
        {
          german: 'Welche Automarken und Fahrzeugmodelle kennen Sie am besten und haben Sie Interesse an herstellerspezifischen Schulungen?',
          english: 'Which car brands and models do you know best and are you interested in manufacturer-specific brand training?',
          guidance: 'Mention familiar OEM brands (e.g. VW Group, BMW, Mercedes-Benz), willingness to earn brand certifications, and fascination with proprietary diagnostic software.'
        },
        {
          german: 'Wie beurteilen Sie den Übergang von Verbrennungsmotoren zu batterieelektrischen Antrieben in den kommenden zehn Jahren?',
          english: 'How do you assess the transition from combustion engines to battery-electric powertrains over the next decade?',
          guidance: 'Express forward-looking mindset: embracing high-voltage diagnostics, battery health analysis, software flashing, while maintaining mechanical expertise.'
        },
        {
          german: 'Haben Sie bereits einen Führerschein der Klasse B, um Kundenfahrzeuge auf den Prüfstand oder zur Probefahrt zu bewegen?',
          english: 'Do you already hold a class B driver’s license to move customer vehicles onto the test bench or for test drives?',
          guidance: 'Confirm possession of driver’s license, clean driving record, and responsible vehicle handling.'
        }
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Automotive Mechatronics',
    type_name: 'Phone Screen',
    min_level: 'B1',
    description: 'Recruiter phone screen verifying German school diploma recognition, technical physics interest, and trial shift scheduling.',
    content: {
      sample_questions: [
        {
          german: 'Guten Tag! Warum bewerben Sie sich gerade bei unserem Autohaus bzw. unserer freien Werkstatt?',
          english: 'Good day! Why are you applying specifically to our car dealership or independent workshop?',
          guidance: 'Mention company reputation, modern workshop facilities, fleet specialization, and commitment to trainee development.'
        },
        {
          german: 'Wie gut kommen Sie mit physikalischen Formeln und elektrischen Schaltplänen zurecht?',
          english: 'How well do you cope with physics formulas and electrical schematics?',
          guidance: 'Highlight interest in STEM subjects, logical reasoning, and comfort calculating voltage drops and mechanical leverage.'
        },
        {
          german: 'Wären Sie bereit, nächste Woche für einen Tag bei uns zur Probearbeit vorbeizukommen?',
          english: 'Would you be ready to come by for a trial workday with us next week?',
          guidance: 'Accept promptly, ask about dress code and starting time, and thank recruiter.'
        }
      ]
    }
  },

  // 5. Hospitality & Culinary (Koch / Hotelfachmann)
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Hospitality & Culinary',
    type_name: 'Behavioral',
    min_level: 'B1',
    description: 'Behavioral interview covering stress tolerance during peak service, kitchen team coordination, and customer hospitality mindset.',
    content: {
      sample_questions: [
        {
          german: 'Während des Abendservice treffen innerhalb von zwanzig Minuten Bestellungen für sechzig Gäste ein. Wie bewahren Sie die Übersicht?',
          english: 'During evening service, orders for 60 guests arrive within 20 minutes. How do you keep an overview?',
          guidance: 'Demonstrate mise en place preparation, communicating clear "Oui Chef" order confirmations, prioritizing ticket timings, and keeping station clean.'
        },
        {
          german: 'Wie reagieren Sie auf Kritik vom Küchenchef oder von Gästen, wenn ein Gericht zurückgeschickt wird?',
          english: 'How do you react to criticism from the head chef or from guests when a dish is sent back?',
          guidance: 'Stay professional and non-defensive: taste the sauce, remake the plate immediately to satisfaction, and learn from the critique.'
        },
        {
          german: 'Gastronomie bedeutet Wochenend- und Abendarbeit bis spät in die Nacht. Wie vereinbaren Sie das mit Ihrem Privatleben?',
          english: 'Hospitality means weekend and evening shifts late into the night. How do you reconcile this with your personal life?',
          guidance: 'Show genuine commitment to the hospitality lifestyle, passion for guest satisfaction, and good sleep/energy management.'
        }
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Hospitality & Culinary',
    type_name: 'Technical',
    min_level: 'B2',
    description: 'Technical culinary interview covering HACCP food safety standards, cold-chain logs, allergen labeling, and cooking methods (Garmethoden).',
    content: {
      sample_questions: [
        {
          german: 'Welche Grundregeln des HACCP-Konzepts und der Lebensmittelhygiene beachten Sie bei der Annahme und Lagerung von frischem Geflügel und Fisch?',
          english: 'What fundamental HACCP and food hygiene rules do you observe during receiving and storage of fresh poultry and fish?',
          guidance: 'Check core temperature with calibrated probe (poultry $\le$ 4°C, fish on crushed melting ice $\le$ 2°C), separate cutting boards (red for poultry, blue for fish), log temperature.'
        },
        {
          german: 'Erläutern Sie den Unterschied zwischen Dünsten, Schmoren und Blanchieren anhand von Beispielen.',
          english: 'Explain the difference between stewing/sweating (Dünsten), braising (Schmoren), and blanching (Blanchieren) with examples.',
          guidance: 'Define precise thermal techniques: Dünsten (little liquid, tight lid, e.g. vegetables/fish), Schmoren (browning then simmering in broth, e.g. Gulasch), Blanchieren (brief boiling then ice bath shock).'
        },
        {
          german: 'Welche der 14 gesetzlichen Hauptallergene (z.B. Gluten, Sellerie, Schalenfrüchte) müssen auf der deutschen Speisekarte deklariert werden?',
          english: 'Which of the 14 statutory main allergens (e.g. gluten, celery, tree nuts) must be declared on the German menu?',
          guidance: 'List key allergens per EU regulation (Krebstiere, Eier, Fisch, Erdnüsse, Soja, Milch/Laktose, Schalenfrüchte, Sellerie, Senf, Sesamsamen, Schwefeldioxid, Lupinen, Weichtiere).'
        }
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Hospitality & Culinary',
    type_name: 'Situational',
    min_level: 'B1',
    description: 'Scenario assessment testing response to deep fryer grease fires, guest allergic reactions, and sudden buffet ingredient shortages.',
    content: {
      sample_questions: [
        {
          german: 'In der Küche gerät heißes Frittieröl in Brand. Was dürfen Sie unter keinen Umständen tun und wie löschen Sie den Brand?',
          english: 'Hot frying oil catches fire in the kitchen. What must you never do under any circumstances and how do you extinguish the fire?',
          guidance: 'Never use water (causes catastrophic steam explosion / Fettexplosion); turn off heating, smother with fire blanket (Löschdecke) or use Class F wet chemical fire extinguisher.'
        },
        {
          german: 'Ein Gast informiert Sie nach dem Essen, dass er trotz Nachfrage eine schwere allergische Reaktion zeigt. Was tun Sie sofort?',
          english: 'A guest informs you after eating that they are experiencing a severe allergic reaction despite asking in advance. What do you do immediately?',
          guidance: 'Assess breathing and consciousness, alert first responder / call 112 if anaphylaxis suspected, verify dish recipe allergens with kitchen, comfort the guest.'
        },
        {
          german: 'Mitten im Mittagsansturm geht die vorbereitete Hollandaise-Sauce für das Spargel-Menü zur Neige. Wie reagieren Sie am Pass?',
          english: 'In the middle of the lunch rush, the prepared Hollandaise sauce for the asparagus menu runs out. How do you respond at the pass?',
          guidance: 'Communicate immediately to the pass chef and service team, quickly whip a fresh batch over water bath, or offer melted butter as instant table alternative.'
        }
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Hospitality & Culinary',
    type_name: 'Panel',
    min_level: 'B2',
    description: 'Interview with Executive Chef (Küchenchef) and Food & Beverage Manager on culinary curiosity, regional cuisine, and teamwork.',
    content: {
      sample_questions: [
        {
          german: 'Welche Gerichte der regionalen deutschen oder internationalen Küche kochen Sie am liebsten und warum?',
          english: 'Which dishes from regional German or international cuisine do you enjoy cooking most and why?',
          guidance: 'Describe sensory appreciation for classic German cooking (Rinderrouladen, Sauerbraten, Spargelgerichte) or fusion flavors with seasonal produce.'
        },
        {
          german: 'Wie wichtig ist Ihnen die Vermeidung von Lebensmittelverschwendung (Food Waste) in der Profiküche?',
          english: 'How important is the prevention of food waste to you in a professional commercial kitchen?',
          guidance: 'Discuss nose-to-tail culinary philosophy, boiling vegetable trimmings and bones into stocks, portion control, and creative daily specials.'
        },
        {
          german: 'Haben Sie bereits Erfahrung im Servicebereich oder an der Hotelrezeption gesammelt?',
          english: 'Have you already gained experience in table service or at the hotel reception front desk?',
          guidance: 'Highlight versatile hospitality skills, wine pairing interest, and creating memorable guest experiences.'
        }
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Hospitality & Culinary',
    type_name: 'Phone Screen',
    min_level: 'B1',
    description: 'Initial phone screening verifying health department infection protection certificate (Belehrung nach § 43 IfSG) and culinary motivation.',
    content: {
      sample_questions: [
        {
          german: 'Guten Tag! Besitzen Sie bereits das Gesundheitszeugnis bzw. die Erstbelehrung nach Paragraf 43 Infektionsschutzgesetz vom Gesundheitsamt?',
          english: 'Good day! Do you already possess the health certificate / initial briefing under section 43 Infection Protection Act from the health office?',
          guidance: 'Confirm possession of the Rote Karte / IfSG certificate or readiness to schedule the mandatory briefing at the local Gesundheitsamt.'
        },
        {
          german: 'Können Sie den ganzen Tag auf den Beinen stehen und heißes Kochgeschirr sicher tragen?',
          english: 'Can you stand on your feet all day and safely carry hot cookware?',
          guidance: 'Affirm physical endurance, kitchen safety awareness, and heat resistance.'
        },
        {
          german: 'Sind Sie mobil oder wohnen Sie nah genug, um nach einem Spätdienst um dreiundzwanzig Uhr sicher nach Hause zu kommen?',
          english: 'Are you mobile or do you live close enough to get home safely after a late shift at 11:00 PM?',
          guidance: 'Explain public transit night routes, bicycle, or nearby apartment location.'
        }
      ]
    }
  },

  // 6. Retail/Commerce (Kaufmann im Einzelhandel)
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Retail/Commerce',
    type_name: 'Behavioral',
    min_level: 'B1',
    description: 'Behavioral interview exploring friendly customer service, handling difficult returns, active upselling, and teamwork on the sales floor.',
    content: {
      sample_questions: [
        {
          german: 'Warum möchten Sie eine Ausbildung zum Kaufmann im Einzelhandel absolvieren und welche Warengruppe interessiert Sie besonders?',
          english: 'Why do you want to complete an apprenticeship in retail commerce and which product category interests you most?',
          guidance: 'Express enthusiasm for daily customer contact, consulting expertise, product presentation, and commercial business operations.'
        },
        {
          german: 'Wie reagieren Sie, wenn ein Kunde Sie am Verkaufsregal unhöflich unterbricht, während Sie gerade Ware einräumen?',
          english: 'How do you respond when a customer rudely interrupts you on the sales floor while you are stocking shelves?',
          guidance: 'Smile, stop stocking immediately, give full visual attention, greet the customer warmly, and guide them directly to the requested item.'
        },
        {
          german: 'Erzählen Sie von einer Situation, in der Sie einem Kunden durch kompetente Beratung ein zusätzliches passendes Produkt empfohlen haben.',
          english: 'Tell us about a situation where you recommended an additional matching product to a customer through competent advice.',
          guidance: 'Illustrate cross-selling (Zusatzverkauf) tastefully: explaining tangible value to customer needs without being pushy.'
        }
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Retail/Commerce',
    type_name: 'Technical',
    min_level: 'B2',
    description: 'Technical retail assessment covering cash register settlement (Kassenabschluss), inventory discrepancies (Inventurdifferenzen), and merchandising.',
    content: {
      sample_questions: [
        {
          german: 'Wie führen Sie einen ordnungsgemäßen Kassenabschluss (Z-Bon) durch und was tun Sie bei einer Kassendifferenz?',
          english: 'How do you conduct a proper cash register closing (Z-tape) and what do you do if there is a cash discrepancy?',
          guidance: 'Count cash drawer against initial float (Wechselgeld), compare with electronic register journal, recount if discrepancy exists, and record in Kassenbericht.'
        },
        {
          german: 'Welche gesetzlichen Bestimmungen gelten für Gewährleistung, Garantie und das freiwillige Umtauschrecht im deutschen stationären Handel?',
          english: 'What legal provisions apply to statutory warranty (Gewährleistung), commercial guarantee, and voluntary return rights in German brick-and-mortar retail?',
          guidance: 'Clarify 2-year statutory warranty (Sachmängelhaftung) vs voluntary goodwill returns (Kulanz-Umtausch) for non-defective store items.'
        },
        {
          german: 'Welche Grundsätze der Warenpräsentation (Blickzone, Greifzone, Bückzone) beachten Sie zur Verkaufsförderung?',
          english: 'Which principles of product presentation (eye level, touch level, stoop level) do you observe to promote sales?',
          guidance: 'Explain shelf psychology: eye level (Sichtzone) for high-margin items, touch level (Greifzone) for impulse buys, stoop level (Bückzone) for staple/budget items.'
        }
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Retail/Commerce',
    type_name: 'Situational',
    min_level: 'B1',
    description: 'Scenario assessment testing response to suspected shoplifting, long register checkout lines, and damaged freight acceptance.',
    content: {
      sample_questions: [
        {
          german: 'Sie beobachten einen Kunden, der einen teuren Artikel in seine Jackentasche steckt und zügig in Richtung Ausgang geht. Was tun Sie?',
          english: 'You observe a customer slipping an expensive item into his jacket pocket and walking briskly toward the exit. What do you do?',
          guidance: 'Wait until the suspect crosses past the cash registers without paying, inform the store detective or supervisor calmly, and address them politely without physical restraint.'
        },
        {
          german: 'An Ihrer Kasse bildet sich eine Schlange von mehr als fünf ungeduldigen Kunden. Welche Schritte leiten Sie ein?',
          english: 'A queue of more than five impatient customers forms at your register. What steps do you initiate?',
          guidance: 'Ring store bell or announce over PA system for a second register to open ("Zweite Kasse öffnet für Sie"), scan efficiently, and thank customers for waiting.'
        },
        {
          german: 'Eine Palette mit empfindlicher Ware wird angeliefert, deren Kartonage sichtbar durchnässt und eingedrückt ist. Wie reagieren Sie bei der Annahme?',
          english: 'A pallet of sensitive merchandise is delivered with visibly soaked and crushed cartons. How do you respond upon receiving?',
          guidance: 'Do not sign delivery receipt unconditionally: photograph damage, note specific defect on consignment note (Frachtbrief) under reservation, and notify purchasing.'
        }
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Retail/Commerce',
    type_name: 'Panel',
    min_level: 'B2',
    description: 'Interview with Store Manager (Filialleiter) and HR Coordinator evaluating commercial arithmetic, stock organization, and customer orientation.',
    content: {
      sample_questions: [
        {
          german: 'Die kaufmännische Ausbildung beinhaltet Handelskalkulation (Einstandspreis, Handlungskostenzuschlag, Mehrwertsteuer). Wie sicher sind Sie in Prozentrechnen?',
          english: 'The commercial apprenticeship includes retail price calculation (cost price, operating expense markup, VAT). How confident are you in percentage math?',
          guidance: 'Show comfort with calculating net to gross prices with 7% and 19% VAT, profit margins, and discounts (Skonto/Rabatt).'
        },
        {
          german: 'Was schätzen Sie an unserer Filiale und wie hebt sich unser Sortiment vom Online-Handel ab?',
          english: 'What do you appreciate about our store and how does our product range set itself apart from online e-commerce?',
          guidance: 'Emphasize immediate product availability, personal tactile shopping experience, expert advice, and hassle-free face-to-face service.'
        },
        {
          german: 'Sind Sie bereit, an Samstagen und an verkaufsoffenen Sonntagen im Wechselschichtmodell zu arbeiten?',
          english: 'Are you prepared to work on Saturdays and shopping Sundays in a rotating shift model?',
          guidance: 'Affirm flexibility for peak weekend retail shopping hours with mid-week rest day compensation per German labor law.'
        }
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Retail/Commerce',
    type_name: 'Phone Screen',
    min_level: 'B1',
    description: 'Recruiter telephone screening assessing spoken German eloquence, friendly telephone manners, and scheduling store visit.',
    content: {
      sample_questions: [
        {
          german: 'Guten Tag! Wie würden Sie sich selbst in drei Worten beschreiben und warum passen Sie in den Einzelhandel?',
          english: 'Good day! How would you describe yourself in three words and why do you fit into retail?',
          guidance: 'Highlight communicative, reliable, and helpful traits with quick illustrative examples.'
        },
        {
          german: 'Haben Sie bereits Erfahrung im Umgang mit Kassen oder mit computergestützten Warenwirtschaftssystemen?',
          english: 'Do you already have experience handling cash registers or computer-based inventory management systems?',
          guidance: 'Mention any prior scanner cash register usage, barcode scanning, or inventory stock counting experience.'
        },
        {
          german: 'Wann könnten Sie für ein persönliches Vorstellungsgespräch in unserer Filiale vorbeikommen?',
          english: 'When could you come by for an in-person interview at our store branch?',
          guidance: 'Offer clear time slots and confirm location details.'
        }
      ]
    }
  },

  // 7. Logistics & Warehousing (Fachkraft für Lagerlogistik)
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Logistics & Warehousing',
    type_name: 'Behavioral',
    min_level: 'B1',
    description: 'Behavioral interview exploring logistical reliability, warehouse safety discipline, physical endurance, and accuracy in stock counting.',
    content: {
      sample_questions: [
        {
          german: 'Warum möchten Sie eine Ausbildung zur Fachkraft für Lagerlogistik machen und was unterscheidet diesen Beruf vom Fachlageristen?',
          english: 'Why do you want to train as a specialist in warehouse logistics and what distinguishes this profession from a warehouse operator?',
          guidance: 'Explain that the 3-year Fachkraft training includes commercial logistics planning, freight documentation, route optimization, and ERP management beyond pure physical handling.'
        },
        {
          german: 'Wie stellen Sie absolute Genauigkeit beim Kommissionieren (Pick-by-Voice / Barcode-Scanner) sicher, auch wenn der Zeitdruck hoch ist?',
          english: 'How do you ensure absolute accuracy during order picking (pick-by-voice / barcode scanner), even under high time pressure?',
          guidance: 'Emphasize checking article numbers, batch numbers (Chargennummer), quantity verification, and never skipping barcode confirmation scans.'
        },
        {
          german: 'Erzählen Sie von einer Situation, in der Sie eine Gefahrenstelle im Lager (z.B. verstellte Fluchtwege oder kippende Paletten) gemeldet haben.',
          english: 'Tell us about a situation where you reported a hazard in the warehouse (e.g. blocked escape routes or tilting pallets).',
          guidance: 'Demonstrate proactive safety vigilance: unblocking emergency fire exits immediately and alerting the warehouse foreman.'
        }
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Logistics & Warehousing',
    type_name: 'Technical',
    min_level: 'B2',
    description: 'Technical logistics interview covering forklift operation (Staplerschein), high-bay storage FIFO/LIFO rules, and hazardous goods storage (ADR).',
    content: {
      sample_questions: [
        {
          german: 'Erklären Sie den Unterschied zwischen den Lagerprinzipien FIFO (First In, First Out) und LIFO (Last In, First Out) und wann welches Prinzip angewendet wird.',
          english: 'Explain the difference between the storage principles FIFO and LIFO and when each principle is applied.',
          guidance: 'Detail FIFO for perishable food or materials with expiration dates (MHD) using flow-through racking, vs LIFO for non-perishable homogeneous bulk goods.'
        },
        {
          german: 'Welche Sicherheitsregeln müssen Sie beim Fahren eines Flurförderzeugs (Gabelstaplers) mit beladener Palette auf geneigter Fahrbahn beachten?',
          english: 'What safety rules must you observe when driving an industrial forklift with a loaded pallet on an inclined ramp?',
          guidance: 'Always travel with load uphill (bergwärts): drive forward uphill, reverse downhill, keep forks lowered near ground, and never turn on an incline.'
        },
        {
          german: 'Welche Begleitpapiere (Frachtbrief, Lieferschein, ADR-Gefahrgutdeklaration) prüfen Sie bei der Wareneingangskontrolle?',
          english: 'Which accompanying documents (waybill, delivery note, ADR dangerous goods declaration) do you inspect during incoming goods inspection?',
          guidance: 'Cross-reference purchase order number with delivery note, check package counts, inspect seal numbers, and review hazardous material hazard symbols.'
        }
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Logistics & Warehousing',
    type_name: 'Situational',
    min_level: 'B1',
    description: 'Scenario assessment testing response to tipped forklift loads, inventory count discrepancies, and urgent express shipment dispatches.',
    content: {
      sample_questions: [
        {
          german: 'Beim Einlagern in ein Hochregal reißt die Stretchfolie einer Europalette und Kartons drohen aus sechs Metern Höhe herabzustürzen. Was tun Sie?',
          english: 'While racking into a high-bay shelf, the stretch wrap on a Euro-pallet tears and boxes threaten to fall from a height of 6 meters. What do you do?',
          guidance: 'Cordon off the entire aisle immediately, warn colleagues, lower the pallet slowly and steadily under guidance, and re-wrap securely on ground.'
        },
        {
          german: 'Bei einer Stichtagsinventur weicht der physische Bestand eines hochpreisigen Bauteils um zehn Einheiten vom SAP-Bestand ab. Wie gehen Sie vor?',
          english: 'During a physical inventory count, the physical stock of an expensive component deviates by 10 units from the SAP system. How do you proceed?',
          guidance: 'Do not simply adjust numbers: recount carefully, search adjacent shelf compartments, check open goods receipts/shipment bins, and report discrepancy to inventory controller.'
        },
        {
          german: 'Eine wichtige Expresslieferung muss in zwanzig Minuten abgeholt werden, aber die Frachtpapiere fehlen noch im System. Wie handeln Sie?',
          english: 'An important express delivery must be picked up in 20 minutes, but shipping documents are still missing in the system. How do you act?',
          guidance: 'Contact shipping clerk immediately, prepare packages with pre-printed carrier labels, verify customs documents if exporting, and expedite driver handover.'
        }
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Logistics & Warehousing',
    type_name: 'Panel',
    min_level: 'B2',
    description: 'Interview with Warehouse Manager (Lagerleiter) and Logistics Operations Director evaluating ERP system proficiency, safety, and team leadership.',
    content: {
      sample_questions: [
        {
          german: 'Welche Erfahrungen haben Sie mit Lagerverwaltungssystemen (LVS wie SAP EWM, proLogistik oder Jungheinrich WMS) gesammelt?',
          english: 'What experience have you gained with warehouse management systems (WMS like SAP EWM, proLogistik, or Jungheinrich WMS)?',
          guidance: 'Discuss handling mobile handheld scanner terminals, executing bin transfers, automated picking waves, and goods receipt booking.'
        },
        {
          german: 'Besitzen Sie bereits einen Flurfördermittelschein (Gabelstaplerschein nach DGUV Grundsatz 308-001) oder sind Sie bereit, diesen zu erwerben?',
          english: 'Do you already hold a forklift license per DGUV principle 308-001 or are you ready to acquire one?',
          guidance: 'State license status or confirm eagerness to undergo internal company theoretical and practical training.'
        },
        {
          german: 'In unserem Logistikzentrum herrscht ein 2-Schicht-System zwischen sechs und zweiundzwanzig Uhr. Passt das zu Ihren Lebensumständen?',
          english: 'In our logistics hub a 2-shift system operates between 6:00 AM and 10:00 PM. Does that suit your living circumstances?',
          guidance: 'Confirm clear availability for early and late shifts with reliable transit options.'
        }
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Logistics & Warehousing',
    type_name: 'Phone Screen',
    min_level: 'B1',
    description: 'Recruiter telephone screening assessing basic German language comprehension, driver’s license status, and warehouse fitness.',
    content: {
      sample_questions: [
        {
          german: 'Guten Tag! Haben Sie bereits in einem Lager gearbeitet oder Kommissioniererfahrung gesammelt?',
          english: 'Good day! Have you already worked in a warehouse or gained order picking experience?',
          guidance: 'Briefly summarize warehouse background, pallet truck operation, order packing, and shipping prep.'
        },
        {
          german: 'Können Sie schwere Packstücke bis zwanzig Kilogramm unter Beachtung rückenschonender Hebetechniken heben?',
          english: 'Can you lift heavy packages up to 20 kilograms observing back-friendly lifting techniques?',
          guidance: 'Confirm physical capability and lifting from knees with straight back.'
        },
        {
          german: 'Ab wann könnten Sie Ihre Ausbildung bei uns antreten und wie weit ist Ihr Anfahrtsweg?',
          english: 'From when could you start your apprenticeship with us and how far is your commute?',
          guidance: 'State start readiness and realistic commute time.'
        }
      ]
    }
  },

  // 8. IT/Technical (Fachinformatiker)
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'IT/Technical',
    type_name: 'Behavioral',
    min_level: 'B1',
    description: 'Behavioral interview exploring analytical problem solving, self-taught tech curiosity, and explaining complex concepts to non-technical users.',
    content: {
      sample_questions: [
        {
          german: 'Warum möchten Sie eine Ausbildung zum Fachinformatiker (Systemintegration oder Anwendungsentwicklung) absolvieren?',
          english: 'Why do you want to complete an apprenticeship as an IT specialist (system integration or application development)?',
          guidance: 'Highlight passion for computer hardware, networking, coding languages, automation scripts, and solving technical puzzles.'
        },
        {
          german: 'Wie erklären Sie einem Kollegen aus der Buchhaltung, der wenig PC-Erfahrung hat, eine technische Störung geduldig und verständlich?',
          english: 'How do you explain a technical issue patiently and comprehensibly to a colleague in accounting who has little PC experience?',
          guidance: 'Avoid jargon, use clear relatable analogies, listen patiently without condescension, and confirm user satisfaction before closing ticket.'
        },
        {
          german: 'Erzählen Sie von einem eigenen IT-Projekt, das Sie zu Hause in Ihrer Freizeit umgesetzt haben (z.B. Linux-Server, Raspberry Pi, eigene Website).',
          english: 'Tell us about an IT project you implemented at home in your free time (e.g. Linux server, Raspberry Pi, home lab, personal website).',
          guidance: 'Show genuine technical initiative: describe architecture, operating system configuration, challenges faced, and lessons learned.'
        }
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'IT/Technical',
    type_name: 'Technical',
    min_level: 'B2',
    description: 'Technical IT assessment on network protocols (TCP/IP, DNS, DHCP), Active Directory user management, virtualization, and cybersecurity.',
    content: {
      sample_questions: [
        {
          german: 'Was geschieht im Hintergrund, wenn ein Benutzer in seinem Browser "www.google.de" eingibt (DNS-Auflösung, TCP-Handshake, HTTPS/TLS)?',
          english: 'What happens in the background when a user enters "www.google.de" in their browser (DNS resolution, TCP handshake, HTTPS/TLS)?',
          guidance: 'Walk through: browser cache check, recursive DNS query, 3-way TCP handshake (SYN, SYN-ACK, ACK), TLS cryptographic handshake, HTTP GET request.'
        },
        {
          german: 'Wie ist eine IPv4-Adresse mit Subnetzmaske (z.B. 192.168.10.0/24) aufgebaut und wie unterscheidet sie sich von IPv6?',
          english: 'How is an IPv4 address with subnet mask (e.g. 192.168.10.0/24) structured and how does it differ from IPv6?',
          guidance: 'Explain 32-bit dotted decimal vs 128-bit hexadecimal, network ID vs host ID, address exhaustion, and private RFC 1918 address ranges.'
        },
        {
          german: 'Welche Sicherheitsmaßnahmen ergreifen Sie, um Unternehmenssysteme vor Phishing und Ransomware-Angriffen zu schützen?',
          english: 'What security measures do you take to protect corporate systems from phishing and ransomware attacks?',
          guidance: 'Detail multi-factor authentication (MFA), least privilege principle, email filtering/SPF/DKIM, offline immutable backups (3-2-1 rule), and automated patch management.'
        }
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'IT/Technical',
    type_name: 'Situational',
    min_level: 'B1',
    description: 'Scenario assessment testing response to ransomware alerts, corporate network switch failures, and executive VIP support requests.',
    content: {
      sample_questions: [
        {
          german: 'Ein Mitarbeiter ruft panisch an, dass sich auf seinem Bildschirm eine Meldung öffnet und seine Dateien eine unbekannte Endung erhalten. Was tun Sie sofort?',
          english: 'An employee calls in a panic saying a ransom notice opened on their screen and files have an unknown extension. What do you do immediately?',
          guidance: 'Instruct employee to unplug Ethernet cable and disconnect Wi-Fi immediately, isolate the machine on the network, inform the CISO/IT security officer, preserve logs.'
        },
        {
          german: 'Mitten während einer wichtigen Vorstandssitzung bricht die Internetverbindung im Konferenzraum ab. Wie gehen Sie vor?',
          english: 'In the middle of an important board meeting, the Internet connection drops in the conference room. How do you proceed?',
          guidance: 'Stay calm, test local gateway ping, switch to redundant LTE/5G hotspot or backup VLAN, restore presentation connectivity swiftly, and diagnose root cause afterward.'
        },
        {
          german: 'Ein Geschäftsführer verlangt von Ihnen Administratorrechte für seinen persönlichen Laptop, was gegen die Sicherheitsrichtlinie verstößt. Was tun Sie?',
          english: 'A managing director demands administrator privileges for his personal laptop, which violates company security policy. What do you do?',
          guidance: 'Politely explain the security rationale and compliance risk, offer to install required software through ticket or approval exception workflow.'
        }
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'IT/Technical',
    type_name: 'Panel',
    min_level: 'B2',
    description: 'Interview with IT Director (IT-Leiter) and Lead Software Architect evaluating code proficiency, cloud infrastructure (Azure/AWS), and ticketing.',
    content: {
      sample_questions: [
        {
          german: 'Mit welchen Betriebssystemen (Windows Server, Linux/Debian/Ubuntu, macOS) und Skriptsprachen (PowerShell, Bash, Python) haben Sie bereits gearbeitet?',
          english: 'Which operating systems (Windows Server, Linux/Debian, macOS) and scripting languages (PowerShell, Bash, Python) have you already worked with?',
          guidance: 'Demonstrate hands-on familiarity with command-line interfaces, writing basic automation scripts, and server administration.'
        },
        {
          german: 'Wie schätzen Sie den Einsatz von Cloud-Technologien (Microsoft 365, Azure, AWS) im Vergleich zur klassischen On-Premises-Infrastruktur ein?',
          english: 'How do you evaluate the use of cloud technologies (Microsoft 365, Azure, AWS) compared to classic on-premises infrastructure?',
          guidance: 'Discuss scalability, maintenance relief, hybrid identity synchronization (Entra ID Connect), data residency considerations, and recurring cost management.'
        },
        {
          german: 'IT-Arbeit erfordert kontinuierliches lebenslanges Lernen. Wie halten Sie Ihr Wissen über neue Technologien und Schwachstellen aktuell?',
          english: 'IT work requires continuous lifelong learning. How do you keep your knowledge of new technologies and vulnerabilities up to date?',
          guidance: 'Mention tech news portals (heise online, BSI Warnungen, Reddit sysadmin), online courses, and homelab experimentation.'
        }
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'IT/Technical',
    type_name: 'Phone Screen',
    min_level: 'B1',
    description: 'Recruiter telephone screening verifying German school diploma recognition, English technical reading ability, and IT apprenticeship motivation.',
    content: {
      sample_questions: [
        {
          german: 'Guten Tag! Warum möchten Sie Ihre Ausbildung gerade in unserem Unternehmen und nicht bei einem reinen Softwarehaus machen?',
          english: 'Good day! Why do you want to do your apprenticeship specifically at our company rather than a pure software house?',
          guidance: 'Highlight appreciation for the company’s industry, modern IT environment, and diverse hardware/software challenges.'
        },
        {
          german: 'Da die meiste technische Dokumentation auf Englisch verfasst ist: Wie gut sind Ihre Englischkenntnisse im Leseverstehen?',
          english: 'Since most technical documentation is written in English: How good is your English reading comprehension?',
          guidance: 'Confirm comfort reading official technical documentation, error logs, and API references in English while conversing in German.'
        },
        {
          german: 'Haben Sie bereits erste Erfahrungen mit Helpdesk-Ticketsystemen wie Jira oder ServiceNow gesammelt?',
          english: 'Have you already gained initial experience with helpdesk ticketing systems like Jira or ServiceNow?',
          guidance: 'State any ticketing familiarity or general comfort with structured task tracking.'
        }
      ]
    }
  },

  // 9. Industrial/Manufacturing (Industriemechaniker / Zerspanungsmechaniker)
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Industrial/Manufacturing',
    type_name: 'Behavioral',
    min_level: 'B1',
    description: 'Behavioral interview exploring precision metalworking, machine safety discipline, shift teamwork, and mechanical curiosity.',
    content: {
      sample_questions: [
        {
          german: 'Warum haben Sie sich für eine Ausbildung zum Industriemechaniker oder Zerspanungsmechaniker entschieden?',
          english: 'Why did you choose an apprenticeship as an industrial mechanic or machining technician?',
          guidance: 'Express fascination with mechanical systems, automated production lines, turning/milling metals, and manufacturing components with micrometer precision.'
        },
        {
          german: 'In der Fertigung arbeitet man oft im lauten Umfeld und im Schichtbetrieb. Wie stellen Sie Konzentration und Arbeitssicherheit sicher?',
          english: 'In manufacturing one often works in noisy environments and shift rotations. How do you ensure concentration and work safety?',
          guidance: 'Wear mandatory hearing and eye protection, adhere strictly to machine guarding protocols, and maintain alert focus on workpiece tolerances.'
        },
        {
          german: 'Erzählen Sie von einer Situation, in der Sie eine Montageaufgabe gewissenhaft nach Betriebsanleitung abgeschlossen haben.',
          english: 'Tell us about a situation where you conscientiously completed an assembly task according to the operating manual.',
          guidance: 'Highlight following technical assembly blueprints, adhering to torque specs, verifying part clearances, and conducting function tests.'
        }
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Industrial/Manufacturing',
    type_name: 'Technical',
    min_level: 'B2',
    description: 'Technical manufacturing assessment covering CNC programming (G-Code), DIN ISO fits and tolerances, hydraulics, and pneumatics.',
    content: {
      sample_questions: [
        {
          german: 'Wie lesen Sie eine technische Passungsangabe wie "Ø 50 H7/g6" und was bedeutet das für die Art der Passung (Spielpassung oder Presspassung)?',
          english: 'How do you read a technical fit specification like "Ø 50 H7/g6" and what does it mean for the type of fit (clearance fit or interference fit)?',
          guidance: 'Explain ISO fit system: H7 represents basic hole with zero lower deviation, g6 is shaft with negative deviation; together they form a guaranteed clearance fit (Spielpassung).'
        },
        {
          german: 'Welche elementaren G-Befehle (z.B. G00 Eilgang, G01 Lineare Interpolation, G02/G03 Kreisbogen) nutzen Sie bei der CNC-Programmierung?',
          english: 'Which fundamental G-codes (e.g. G00 rapid traverse, G01 linear interpolation, G02/G03 circular arc) do you use in CNC programming?',
          guidance: 'Explain trajectory codes, setting feed rates (F-Wert), spindle speeds (S-Wert), tool offsets (T- und D-Korrektur), and coolant control (M08/M09).'
        },
        {
          german: 'Welche physikalischen Unterschiede bestehen zwischen hydraulischen und pneumatischen Antrieben in Bezug auf Druck und Kompressibilität?',
          english: 'What physical differences exist between hydraulic and pneumatic drives regarding pressure and compressibility?',
          guidance: 'Explain that pneumatic air is compressible and operates at lower pressure (approx. 6 bar) for fast movements; hydraulic oil is virtually incompressible, operating at high pressure (100-300 bar) for enormous forces.'
        }
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Industrial/Manufacturing',
    type_name: 'Situational',
    min_level: 'B1',
    description: 'Scenario assessment testing response to CNC tool breakage, hydraulic pressure drops, and quality batch rejections.',
    content: {
      sample_questions: [
        {
          german: 'Während eines automatischen Fräszyklus bricht ein Hartmetall-Schaftfräser mit lautem Geräusch ab. Wie reagieren Sie sofort?',
          english: 'During an automatic milling cycle, a carbide end mill snaps with a loud noise. How do you react immediately?',
          guidance: 'Hit emergency stop (Not-Halt) immediately, inspect workpiece and spindle for damage, retrieve broken fragments, report to foreman, check feed parameters before restarting.'
        },
        {
          german: 'Bei einer Serienmessung mit der Bügelmessschraube stellen Sie fest, dass die letzten zehn Werkstücke um 0,05 Millimeter über dem Toleranzmaß liegen. Was tun Sie?',
          english: 'During a serial measurement with a micrometer, you notice that the last 10 workpieces are 0.05 mm above tolerance. What do you do?',
          guidance: 'Halt production line immediately, segregate non-conforming parts into scrap/rework bin, inspect tool wear offset in machine controller, recalibrate micrometer, notify QC.'
        },
        {
          german: 'Eine hydraulische Presse verliert plötzlich Druck und ein Ölfleck bildet sich unter dem Hauptzylinder. Wie sichern Sie die Anlage?',
          english: 'A hydraulic press suddenly loses pressure and an oil pool forms under the main cylinder. How do you secure the equipment?',
          guidance: 'Shut down hydraulic pump, depressurize accumulator safely, apply mechanical safety lock bar against ram drop, lock out machine with warning tag, notify maintenance.'
        }
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Industrial/Manufacturing',
    type_name: 'Panel',
    min_level: 'B2',
    description: 'Interview with Production Plant Manager (Produktionsleiter) and Head of Apprenticeship Training (Ausbildungsleiter) on manufacturing excellence.',
    content: {
      sample_questions: [
        {
          german: 'Welche Fertigungsverfahren (Drehen, Fräsen, Bohren, Schleifen, Schweißen) haben Sie in der Schule oder in Praktika bereits praktisch erprobt?',
          english: 'Which manufacturing processes (turning, milling, drilling, grinding, welding) have you already practically tested in school or internships?',
          guidance: 'Summarize hands-on machining skills, filing raw metal blocks to dimensional squareness, drilling pilot holes, and operating conventional lathes.'
        },
        {
          german: 'In unserer Industriehalle fertigen wir Präzisionsteile für den Maschinenbau. Was bedeutet für Sie der Begriff "Qualitätsmanagement nach ISO 9001"?',
          english: 'In our industrial facility we manufacture precision components for mechanical engineering. What does "ISO 9001 quality management" mean to you?',
          guidance: 'Express dedication to standard operating procedures, traceable batch documentation, calibrated measuring instruments, and continuous process improvement (KVP).'
        },
        {
          german: 'Sind Sie bereit, nach dem ersten Ausbildungsjahr im Zwei- oder Drei-Schicht-Betrieb in der Serienfertigung mitzuarbeiten?',
          english: 'Are you prepared to participate in two- or three-shift serial production after the first training year?',
          guidance: 'Confirm willingness to work shifts, compliance with youth protection laws if applicable, and dedication to team productivity.'
        }
      ]
    }
  },
  {
    parent_domain: 'Ausbildung',
    sub_branch: 'Industrial/Manufacturing',
    type_name: 'Phone Screen',
    min_level: 'B1',
    description: 'Recruiter telephone screening assessing technical diploma equivalence, mathematical geometry fundamentals, and factory visit setup.',
    content: {
      sample_questions: [
        {
          german: 'Guten Tag! Warum möchten Sie eine technische Industrieausbildung in Deutschland absolvieren?',
          english: 'Good day! Why do you want to complete a technical industrial apprenticeship in Germany?',
          guidance: 'Express high regard for German engineering quality (Made in Germany), world-class manufacturing technology, and structured career development.'
        },
        {
          german: 'Wie sicher sind Sie in mathematischen Berechnungen wie Trigonometrie, Satz des Pythagoras und Schnittgeschwindigkeiten?',
          english: 'How confident are you in mathematical calculations like trigonometry, Pythagorean theorem, and cutting speeds?',
          guidance: 'Confirm comfort applying mathematical formulas to calculate spindle RPM ($n = \frac{v_c \cdot 1000}{\pi \cdot d}$) and feed rates.'
        },
        {
          german: 'Können Sie zu einem zweistündigen Eignungstest mit praktischer Werkstattaufgabe zu uns ins Werk kommen?',
          english: 'Could you come to our plant for a two-hour aptitude test with a practical workshop task?',
          guidance: 'Accept gladly, confirm arrival time, and ask if safety footwear is needed.'
        }
      ]
    }
  }
];
