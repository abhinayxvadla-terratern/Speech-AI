// Healthcare domain variants for A1 modules (1-24)
// domain_weight_pct: 20 -> Light flavoring (1 healthcare phrase swapped in, rest general/adapted)

export const healthcareA1 = {
  1: {
    target_phrases: [
      { german: "Guten Morgen, ich bin Ihre Pflegekraft für heute.", english: "Good morning, I am your nurse/caregiver for today." },
      { german: "Guten Tag!", english: "Good day! / Hello!" },
      { german: "Auf Wiedersehen und einen schönen Tag!", english: "Goodbye and have a nice day!" },
      { german: "Tschüss, bis morgen!", english: "Bye, until tomorrow!" }
    ],
    example_sentences: [
      "Guten Morgen, Herr Weber! Wie geht es Ihnen heute?",
      "Auf Wiedersehen, Frau Müller, bis zur nächsten Schicht!"
    ]
  },
  2: {
    target_phrases: [
      { german: "Ich arbeite als Pflegeassistent hier im Krankenhaus.", english: "I work as a care assistant here at the hospital." },
      { german: "Mein Name ist Thomas Wagner.", english: "My name is Thomas Wagner." },
      { german: "Ich komme aus Spanien.", english: "I come from Spain." },
      { german: "Ich wohne jetzt in Frankfurt.", english: "I live in Frankfurt now." }
    ],
    example_sentences: [
      "Guten Tag, ich heiße Maria und unterstütze heute das Pflegeteam.",
      "Ich komme aus Italien und arbeite seit einem Monat in dieser Klinik."
    ]
  },
  3: {
    target_phrases: [
      { german: "Der Patient liegt in Zimmer vierzehn.", english: "The patient is in room fourteen." },
      { german: "Ich habe zwei Schwestern und einen Bruder.", english: "I have two sisters and one brother." },
      { german: "Meine Telefonnummer ist null-eins-sieben-eins.", english: "My phone number is 0171..." },
      { german: "Hier sind zwanzig Euro.", english: "Here are twenty euros." }
    ],
    example_sentences: [
      "Herr Schmidt liegt auf Station 3 in Zimmer 12.",
      "Die Patientin benötigt bitte zwei Becher Wasser."
    ]
  },
  4: {
    target_phrases: [
      { german: "Haben Sie an dieser Stelle Schmerzen?", english: "Do you have pain at this spot?" },
      { german: "Wie heißen Sie?", english: "What is your name?" },
      { german: "Woher kommen Sie?", english: "Where do you come from?" },
      { german: "Was machen Sie beruflich?", english: "What do you do for a living?" }
    ],
    example_sentences: [
      "Guten Tag, wie heißen Sie und wo haben Sie Schmerzen?",
      "Wo ist bitte das Dienstzimmer der Stationsschwester?"
    ]
  },
  5: {
    target_phrases: [
      { german: "Guten Tag, ich bin heute Ihre Betreuungsperson auf Station 4.", english: "Good day, I am your caregiver on ward 4 today." },
      { german: "Ich komme aus Polen und lebe in Hamburg.", english: "I come from Poland and live in Hamburg." },
      { german: "Wo tut es Ihnen weh?", english: "Where does it hurt?" },
      { german: "Meine Zimmernummer ist sieben.", english: "My room number is seven." }
    ],
    example_sentences: [
      "Guten Morgen, mein Name ist Anna und ich begleite Sie heute zur Untersuchung.",
      "Haben Sie Fragen zu Ihrem Zimmer oder zu den Essenszeiten?"
    ]
  },
  6: {
    target_phrases: [
      { german: "Die Patientin ist groß und hat graue Haare.", english: "The patient is tall and has gray hair." },
      { german: "Er ist mittelgroß und schlank.", english: "He is medium height and slim." },
      { german: "Sie hat kurze blonde Haare.", english: "She has short blonde hair." },
      { german: "Er trägt eine dunkle Brille.", english: "He wears dark glasses." }
    ],
    example_sentences: [
      "Die neue Patientin in Zimmer 8 ist klein und trägt ein Hörgerät.",
      "Der Besucher von Herrn Becker ist groß und hat dunkle Haare."
    ]
  },
  7: {
    target_phrases: [
      { german: "Der Patient wirkt heute sehr ruhig und zufrieden.", english: "The patient seems very calm and content today." },
      { german: "Wie fühlen Sie sich?", english: "How do you feel?" },
      { german: "Ich bin heute etwas müde.", english: "I am a bit tired today." },
      { german: "Sie ist immer sehr freundlich und geduldig.", english: "She is always very friendly and patient." }
    ],
    example_sentences: [
      "Frau Krause wirkt heute nervös vor dem Arztgespräch.",
      "Herr Sommer ist nach dem Mittagsschlaf wieder gut gelaunt."
    ]
  },
  8: {
    target_phrases: [
      { german: "Möchten Sie zum Mittagessen stilles Wasser oder Kamillentee?", english: "Would you like still water or chamomile tea for lunch?" },
      { german: "Ich möchte bitte einen Kaffee mit Milch.", english: "I would like a coffee with milk, please." },
      { german: "Bringen Sie mir bitte ein Glas Wasser.", english: "Please bring me a glass of water." },
      { german: "Die Rechnung, bitte.", english: "The bill, please." }
    ],
    example_sentences: [
      "Möchten Sie heute zum Frühstück lieber Kräutertee oder warmen Kakao?",
      "Ich bringe Ihnen gleich ein frisches Glas Mineralwasser ans Bett."
    ]
  },
  9: {
    target_phrases: [
      { german: "Die Patientin verträgt keine Laktose und wünscht Schonkost.", english: "The patient is lactose intolerant and requests bland food." },
      { german: "Ich esse gern frisches Gemüse.", english: "I like eating fresh vegetables." },
      { german: "Fisch schmeckt mir überhaupt nicht.", english: "I do not like fish at all." },
      { german: "Trinken Sie lieber Tee oder Kaffee?", english: "Do you prefer drinking tea or coffee?" }
    ],
    example_sentences: [
      "Der Patient in Zimmer 5 isst gern Haferbrei und mag kein fettiges Fleisch.",
      "Frau Wagner trinkt nachmittags am liebsten ungesüßten Früchtetee."
    ]
  },
  10: {
    target_phrases: [
      { german: "Der Patient ist freundlich und trinkt morgens gerne warmen Tee.", english: "The patient is friendly and likes to drink warm tea in the morning." },
      { german: "Er hat dunkle Haare und eine Brille.", english: "He has dark hair and glasses." },
      { german: "Ich fühle mich heute gut und fit.", english: "I feel good and fit today." },
      { german: "Ich möchte bitte eine Suppe bestellen.", english: "I would like to order a soup, please." }
    ],
    example_sentences: [
      "Frau Berg ist heute sehr aufmerksam und hat ihr gesamtes Frühstück gegessen.",
      "Der neue Bewohner im Wohnbereich ist ruhig und hört gerne klassische Musik."
    ]
  },
  11: {
    target_phrases: [
      { german: "Wo befindet sich die Station für Physiotherapie?", english: "Where is the physiotherapy ward located?" },
      { german: "Entschuldigung, wo ist der Bahnhof?", english: "Excuse me, where is the train station?" },
      { german: "Gehen Sie geradeaus und dann nach rechts.", english: "Go straight ahead and then to the right." },
      { german: "Die Apotheke ist direkt an der Ecke.", english: "The pharmacy is right on the corner." }
    ],
    example_sentences: [
      "Entschuldigung, wie komme ich zum Röntgenbereich im Erdgeschoss?",
      "Das Labor liegt am Ende des Flurs auf der linken Seite."
    ]
  },
  12: {
    target_phrases: [
      { german: "Könnten Sie bitte kurz den Arm anheben?", english: "Could you please lift your arm briefly?" },
      { german: "Können Sie mir bitte helfen?", english: "Can you please help me?" },
      { german: "Einen Moment Geduld, bitte.", english: "One moment of patience, please." },
      { german: "Entschuldigen Sie bitte die Störung.", english: "Excuse the disturbance, please." }
    ],
    example_sentences: [
      "Könnten Sie sich bitte kurz auf die Bettkante setzen?",
      "Entschuldigung, ich bringe Ihnen sofort eine warme Decke."
    ]
  },
  13: {
    target_phrases: [
      { german: "Die ärztliche Visite beginnt um neun Uhr morgens.", english: "The medical round starts at nine o'clock in the morning." },
      { german: "Wie spät ist es jetzt?", english: "What time is it now?" },
      { german: "Es ist genau vierzehn Uhr dreißig.", english: "It is exactly 2:30 PM." },
      { german: "Heute ist Dienstag und morgen ist Mittwoch.", english: "Today is Tuesday and tomorrow is Wednesday." }
    ],
    example_sentences: [
      "Die Blutabnahme findet morgen früh um sieben Uhr statt.",
      "Am Freitagnachmittag kommt der Facharzt zur Abschlussuntersuchung."
    ]
  },
  14: {
    target_phrases: [
      { german: "Die Frühschicht übergibt um vierzehn Uhr an die Spätschicht.", english: "The morning shift hands over to the late shift at 2:00 PM." },
      { german: "Ich stehe jeden Morgen um sechs Uhr auf.", english: "I get up every morning at six o'clock." },
      { german: "Um zwölf Uhr esse ich zu Mittag.", english: "At twelve o'clock I eat lunch." },
      { german: "Ich gehe um zweiundzwanzig Uhr schlafen.", english: "I go to sleep at 10:00 PM." }
    ],
    example_sentences: [
      "Die Übergabe dauert etwa zwanzig Minuten im Stationszimmer.",
      "Der Patient wacht meistens gegen sieben Uhr auf und frühstückt um halb acht."
    ]
  },
  15: {
    target_phrases: [
      { german: "Die Physiotherapie findet jeden Mittwoch um zehn Uhr statt.", english: "Physiotherapy takes place every Wednesday at ten o'clock." },
      { german: "Biegen Sie nach dem Aufzug links ab.", english: "Turn left after the elevator." },
      { german: "Können Sie das bitte langsamer wiederholen?", english: "Could you please repeat that more slowly?" },
      { german: "Mein Arbeitstag beginnt um sechs Uhr morgens.", english: "My workday begins at six in the morning." }
    ],
    example_sentences: [
      "Das Schwesternzimmer befindet sich direkt gegenüber von Zimmer 6.",
      "Um 13 Uhr bringen wir den Patienten im Rollstuhl zur Untersuchung."
    ]
  },
  16: {
    target_phrases: [
      { german: "Darf ich die Telefonnummer Ihres Sohnes als Notfallkontakt notieren?", english: "May I note down your son's phone number as an emergency contact?" },
      { german: "Das ist meine Mutter und das ist mein Vater.", english: "This is my mother and this is my father." },
      { german: "Haben Sie Kinder oder Geschwister?", english: "Do you have children or siblings?" },
      { german: "Ich bin verheiratet und habe zwei Töchter.", english: "I am married and have two daughters." }
    ],
    example_sentences: [
      "Die Ehefrau von Herrn Klein kommt heute um 15 Uhr zu Besuch.",
      "Darf die Tochter von Frau Hoffmann telefonisch Auskunft erhalten?"
    ]
  },
  17: {
    target_phrases: [
      { german: "Gestern hatte die Patientin leichtes Fieber, aber heute ist sie fieberfrei.", english: "Yesterday the patient had a mild fever, but today she is fever-free." },
      { german: "Ich war gestern den ganzen Tag zu Hause.", english: "I was at home all day yesterday." },
      { german: "Wir hatten am Wochenende viel Zeit.", english: "We had a lot of time on the weekend." },
      { german: "Wo warst du am Sonntag?", english: "Where were you on Sunday?" }
    ],
    example_sentences: [
      "Herr Meyer hatte in der Nacht Schmerzen, aber jetzt geht es ihm besser.",
      "Die Patientin war gestern Nachmittag noch sehr schwach nach der Narkose."
    ]
  },
  18: {
    target_phrases: [
      { german: "Das linke Knie ist geschwollen und tut beim Gehen weh.", english: "The left knee is swollen and hurts while walking." },
      { german: "Mein Kopf tut seit gestern weh.", english: "My head has been hurting since yesterday." },
      { german: "Ich habe starke Halsschmerzen und Husten.", english: "I have a bad sore throat and cough." },
      { german: "Der Rücken schmerzt im Sitzen.", english: "The back aches while sitting." }
    ],
    example_sentences: [
      "Frau Braun klagt über ein Ziehen in der rechten Schulter.",
      "Zeigen Sie mir bitte genau mit dem Finger, wo der Schmerz am stärksten ist."
    ]
  },
  19: {
    target_phrases: [
      { german: "Das Pflegebett lässt sich mit dieser Fernbedienung höher stellen.", english: "The hospital bed can be raised using this remote control." },
      { german: "Das Wohnzimmer ist hell und geräumig.", english: "The living room is bright and spacious." },
      { german: "Im Schlafzimmer steht ein großer Schrank.", english: "In the bedroom there is a large wardrobe." },
      { german: "Die Lampe steht auf dem Nachttisch.", english: "The lamp is on the bedside table." }
    ],
    example_sentences: [
      "Der Rollstuhl steht direkt neben dem Bett für den Transfer bereit.",
      "Die rote Notrufklingel hängt immer griffbereit an Ihrem Bettrahmen."
    ]
  },
  20: {
    target_phrases: [
      { german: "Die Patientin hatte Knieschmerzen, aber im Pflegebett liegt sie nun bequem.", english: "The patient had knee pain, but in the hospital bed she is now resting comfortably." },
      { german: "Mein Bruder besucht mich am Nachmittag.", english: "My brother is visiting me in the afternoon." },
      { german: "Der Bauch tut nach dem Essen weh.", english: "The stomach hurts after eating." },
      { german: "Das Patientenzimmer ist sauber und ruhig.", english: "The patient room is clean and quiet." }
    ],
    example_sentences: [
      "Der Sohn von Herrn Wagner hat sich nach dem Verbandswechsel erkundigt.",
      "Die Schmerztablette hat gut gewirkt und der Patient schläft ruhig."
    ]
  },
  21: {
    target_phrases: [
      { german: "Im Klinikdienst tragen wir weiße Hosen und bequeme Kasacks.", english: "On clinical duty we wear white trousers and comfortable scrubs." },
      { german: "Die Jacke ist warm und blau.", english: "The jacket is warm and blue." },
      { german: "Ich ziehe ein sauberes T-Shirt an.", english: "I put on a clean T-shirt." },
      { german: "Die Schuhe sind schwarz und bequem.", english: "The shoes are black and comfortable." }
    ],
    example_sentences: [
      "Bitte ziehen Sie für die Untersuchung das Klinikhemd an.",
      "Der Patient benötigt feste Hausschuhe mit rutschfesten Sohlen für den Gang."
    ]
  },
  22: {
    target_phrases: [
      { german: "Dieser Gehstock ist leichter und handlicher als der Rollator.", english: "This walking stick is lighter and handier than the rollator." },
      { german: "Das neue Zimmer ist größer als das alte.", english: "The new room is bigger than the old one." },
      { german: "Dieses Kissen ist weicher und bequemer.", english: "This pillow is softer and more comfortable." },
      { german: "Der rote Pullover ist billiger als die Jacke.", english: "The red sweater is cheaper than the jacket." }
    ],
    example_sentences: [
      "Die neue Blutdruckmanschette ist breiter und misst deutlich genauer.",
      "Der Schlafsessel im Ruheraum ist bequemer als der Standardstuhl."
    ]
  },
  23: {
    target_phrases: [
      { german: "Der Krankentransport holt die Patientin um zehn Uhr zur Dialyse ab.", english: "The medical transport will pick up the patient at ten o'clock for dialysis." },
      { german: "Eine Fahrkarte nach München, bitte.", english: "One ticket to Munich, please." },
      { german: "Wann fährt der nächste Bus zum Hauptbahnhof?", english: "When does the next bus to the central station leave?" },
      { german: "Von welchem Gleis fährt der Zug ab?", english: "From which platform does the train depart?" }
    ],
    example_sentences: [
      "Der Patiententransportwagen wartet bereits vor dem Haupteingang.",
      "Ich nehme morgens um halb sechs die U-Bahn zur Frühschicht im Klinikum."
    ]
  },
  24: {
    target_phrases: [
      { german: "Guten Tag, ich messe jetzt kurz Ihren Puls und Ihren Blutdruck.", english: "Good day, I will now measure your pulse and blood pressure briefly." },
      { german: "Mein Name ist Lisa und ich helfe Ihnen heute.", english: "My name is Lisa and I will help you today." },
      { german: "Können Sie die Hand bitte öffnen und schließen?", english: "Can you please open and close your hand?" },
      { german: "Um wie viel Uhr beginnt der Spätdienst?", english: "At what time does the late shift start?" }
    ],
    example_sentences: [
      "Guten Morgen, Herr Schulz, haben Sie heute Nacht gut schlafen können?",
      "Ich bringe Ihnen frisches Wasser und die angeordneten Medikamente."
    ]
  }
};
