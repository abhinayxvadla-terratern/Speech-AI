// Healthcare scenarios: 8 sub-branches * 3 scenarios each = 24 scenarios
// Sub-branches: Nursing, Elderly Care, Nursing/Care Assistant, Physiotherapy, 
// Medical Technician/Lab Assistant, Radiology Technician, Dental Assistant, Hospital Administration/Ward Clerk

export const healthcareScenarios = [
  // 1. Nursing
  {
    parent_domain: 'Healthcare',
    sub_branch: 'Nursing',
    title: 'Giving a Shift Handover Report',
    description: 'Provide a structured verbal handover of a newly admitted postoperative patient to the incoming night shift nurse, detailing vitals, IV lines, and drain output.',
    min_level: 'B1',
    content: {
      target_phrases: [
        { german: 'Herr Meyer wurde heute Mittag nach einer laparoskopischen Appendektomie von der Aufwachstation übernommen.', english: 'Mr. Meyer was transferred from the recovery room at noon today after a laparoscopic appendectomy.' },
        { german: 'Die Vitalzeichen sind stabil: Blutdruck einhundertzwanzig zu achtzig, Puls zweiundsiebzig, Temperatur unauffällig.', english: 'Vital signs are stable: blood pressure 120 over 80, pulse 72, temperature normal.' },
        { german: 'Über den peripheren Venenkatheter links läuft noch eine Vollelektrolytlösung mit fünfzig Millilitern pro Stunde.', english: 'A full electrolyte solution is still running via the left peripheral venous catheter at 50 milliliters per hour.' },
        { german: 'Die Redon-Drainage förderte bisher dreißig Milliliter seröse Flüssigkeit; der Verband ist trocken.', english: 'The Redon drain has yielded 30 milliliters of serous fluid so far; the dressing is dry.' }
      ],
      example_sentences: [
        'Für die Nacht ist bei Schmerzspitzen Novaminsulfon ein Gramm als Kurzinfusion ärztlich angeordnet.',
        'Bitte kontrollieren Sie um zweiundzwanzig Uhr nochmals die Einstichstelle und die Urinausscheidung.'
      ]
    }
  },
  {
    parent_domain: 'Healthcare',
    sub_branch: 'Nursing',
    title: 'Explaining a Medication Schedule to a Patient',
    description: 'Walk an anxious inpatient through their updated cardiac medication regimen, explaining dosages, timing, and what side effects to watch out for.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Frau Schmidt, der Stationsarzt hat Ihre Blutdruckmedikation heute Morgen angepasst und die Dosis leicht erhöht.', english: 'Mrs. Schmidt, the ward physician adjusted your blood pressure medication this morning and slightly increased the dose.' },
        { german: 'Sie nehmen bitte diese Tablette immer morgens direkt nach dem Frühstück unzerkaut mit einem Glas Wasser ein.', english: 'Please take this tablet every morning immediately after breakfast unchewed with a glass of water.' },
        { german: 'Sollten Sie Schwindel oder leichte Übelkeit bemerken, betätigen Sie bitte sofort die Klingel am Nachttisch.', english: 'Should you notice dizziness or slight nausea, please ring the call bell on your bedside table immediately.' },
        { german: 'Wir messen Ihren Blutdruck in regelmäßigen Abständen, um die Wirkung der neuen Dosis genau zu überprüfen.', english: 'We measure your blood pressure at regular intervals to accurately monitor the effect of the new dose.' }
      ],
      example_sentences: [
        'Bitte stehen Sie nach der Einnahme nicht zu hastig aus dem Bett auf, um einen Kreislaufabsacker zu vermeiden.',
        'Haben Sie zu diesem Medikament oder der Einnahmezeit noch irgendwelche Fragen?'
      ]
    }
  },
  {
    parent_domain: 'Healthcare',
    sub_branch: 'Nursing',
    title: 'Managing Acute Postoperative Pain Escalation',
    description: 'Respond urgently to a patient experiencing sharp sudden surgical site pain, assess pain scale score, and coordinate on-call doctor intervention.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Auf einer Schmerzskala von eins bis zehn, wie stark schätzen Sie den Schmerz im Wundbereich momentan ein?', english: 'On a pain scale from 1 to 10, how severe would you rate the pain in the wound area right now?' },
        { german: 'Können Sie den Schmerz genauer beschreiben: Ist er eher stechend, pochend oder dumpf?', english: 'Can you describe the pain more precisely: is it rather sharp, throbbing, or dull?' },
        { german: 'Ich untersuche kurz vorsichtig die Bauchdecke und prüfe, ob eine Verhärtung oder Nachblutung vorliegt.', english: 'I will briefly and carefully examine the abdominal wall to check whether there is hardening or secondary bleeding.' },
        { german: 'Ich informiere umgehend den diensthabenden Stationsarzt, damit wir Ihnen eine stärkere Bedarfsmedikation verabreichen können.', english: 'I will notify the on-call ward doctor immediately so that we can administer a stronger as-needed pain medication.' }
      ],
      example_sentences: [
        'Versuchen Sie, ruhig und gleichmäßig in den Bauch zu atmen, während ich die Infusion vorbereite.',
        'Der Arzt ordnet eine zusätzliche Dosis Piritramid an; ich schließe den Monitor zur Sauerstoffsättigung an.'
      ]
    }
  },

  // 2. Elderly Care
  {
    parent_domain: 'Healthcare',
    sub_branch: 'Elderly Care',
    title: 'Conducting a Fall Risk Assessment & Prevention Plan',
    description: 'Evaluate an elderly nursing home resident who experienced near-falls, discussing mobility aids and room adaptations with the resident.',
    min_level: 'B1',
    content: {
      target_phrases: [
        { german: 'Frau Weber, wir möchten gemeinsam schauen, wie Sie im Zimmer und auf dem Flur noch sicherer zu Fuß unterwegs sind.', english: 'Mrs. Weber, we would like to look together at how you can walk even more safely in your room and in the hallway.' },
        { german: 'Ich empfehle Ihnen, beim Aufstehen vom Sessel immer zuerst die Bremse des Rollators zu arretieren.', english: 'I recommend that you always lock the brakes of your walker first when standing up from the armchair.' },
        { german: 'Tragen Sie bitte stets feste Schuhe mit rutschfester Gummisohle statt loser Pantoffeln.', english: 'Please always wear sturdy shoes with non-slip rubber soles instead of loose slippers.' },
        { german: 'Wir bringen neben Ihrem Pflegebett eine zusätzliche Nachtleuchte mit Bewegungsmelder an.', english: 'We will install an additional night light with motion sensor next to your nursing bed.' }
      ],
      example_sentences: [
        'Wenn Sie nachts zur Toilette müssen, rufen Sie uns bitte immer kurz über den Notrufknopf am Armband.',
        'Ich trage die Maßnahmen direkt in Ihren individuellen Pflege- und Bewegungsplan ein.'
      ]
    }
  },
  {
    parent_domain: 'Healthcare',
    sub_branch: 'Elderly Care',
    title: 'De-escalating Agitation in a Resident with Dementia',
    description: 'Calm an agitated resident who believes they need to leave to catch a train to work, using validation techniques and empathetic redirection.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Herr Bauer, ich sehe, dass Sie Ihren Mantel schon anziehen und sich Sorgen um Ihren Arbeitsbeginn machen.', english: 'Mr. Bauer, I see that you are already putting on your coat and worrying about starting work.' },
        { german: 'Sie haben viele Jahre lang als Ingenieur Großartiges geleistet; heute haben Sie sich Ihren Feierabend wohlverdient.', english: 'You accomplished great things as an engineer for many years; today you have well deserved your evening off.' },
        { german: 'Kommen Sie, setzen wir uns kurz in den gemütlichen Aufenthaltsraum und trinken eine Tasse warmen Kamillentee.', english: 'Come, let us sit down for a moment in the cozy common room and drink a warm cup of chamomile tea.' },
        { german: 'Schauen Sie mal, draußen regnet es; wir warten hier gemeinsam in Ruhe, bis der nächste Bus fährt.', english: 'Look, it is raining outside; we will wait here calmly together until the next bus arrives.' }
      ],
      example_sentences: [
        'Ich bleibe gerne ein paar Minuten bei Ihnen sitzen und höre Ihnen zu.',
        'Durch beruhigende Worte und geduldige Validierung entspannt sich die Situation spürbar.'
      ]
    }
  },
  {
    parent_domain: 'Healthcare',
    sub_branch: 'Elderly Care',
    title: 'Consulting Family Members on Care Grade & Palliative Needs',
    description: 'Host an empathetic conference with the adult children of a resident whose health is declining, discussing care grade upgrade and palliative comfort measures.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Guten Tag Familie Becker, wir haben Sie eingeladen, um über die veränderte Pflegesituation Ihrer Mutter zu sprechen.', english: 'Good day Becker family, we invited you to talk about the changed care situation of your mother.' },
        { german: 'Aufgrund der zunehmenden Immobilität empfehlen wir einen Antrag auf Höherstufung des Pflegegrades beim Medizinischen Dienst.', english: 'Due to the increasing immobility, we recommend an application for a care grade upgrade to the Medical Service.' },
        { german: 'Im Vordergrund steht für unser Pflegeteam jetzt vor allem Schmerzfreiheit, Atemkomfort und Würde.', english: 'The priority for our care team now is above all freedom from pain, breathing comfort, and dignity.' },
        { german: 'Möchten Sie mit uns über eine Vorsorgevollmacht oder Wünsche bezüglich einer Patientenverfügung sprechen?', english: 'Would you like to speak with us about a healthcare proxy or wishes regarding a living will?' }
      ],
      example_sentences: [
        'Wir arbeiten eng mit dem ambulanten Hospizdienst zusammen, um auch psychosoziale Begleitung anzubieten.',
        'Sie dürfen Ihre Mutter selbstverständlich rund um die Uhr besuchen, ohne feste Besuchszeiten.'
      ]
    }
  },

  // 3. Nursing/Care Assistant
  {
    parent_domain: 'Healthcare',
    sub_branch: 'Nursing/Care Assistant',
    title: 'Assisting with Morning Hygiene & Skin Inspection',
    description: 'Assist a semi-dependent patient with morning wash at the sink while inspecting pressure points and reporting skin redness.',
    min_level: 'B1',
    content: {
      target_phrases: [
        { german: 'Guten Morgen Frau Klein, ich helfe Ihnen heute bei der morgendlichen Körperpflege am Waschbecken.', english: 'Good morning Mrs. Klein, I am assisting you today with morning personal hygiene at the washbasin.' },
        { german: 'Ist die Wassertemperatur im Waschbecken so angenehm für Sie oder soll ich etwas wärmeres Wasser nachlaufen lassen?', english: 'Is the water temperature in the sink pleasant for you or should I run some warmer water?' },
        { german: 'Ich sehe am linken Steißbein eine leichte Rötung; ich dokumentiere das sofort für die examinierte Pflegefachkraft.', english: 'I see slight redness on the left sacrum; I will document that immediately for the registered nurse.' },
        { german: 'Bitte greifen Sie sich gut am Haltegriff fest, während ich Ihnen beim Wechseln des Nachthemds helfe.', english: 'Please hold firmly onto the grab bar while I assist you in changing your nightgown.' }
      ],
      example_sentences: [
        'Ich trage nach dem Waschen eine pflegende Feuchtigkeitscreme auf Ihre trockene Haut an den Unterschenkeln auf.',
        'Ich melde der Schichtleitung, dass wir eine druckentlastende Schaumstoffmatratze benötigen.'
      ]
    }
  },
  {
    parent_domain: 'Healthcare',
    sub_branch: 'Nursing/Care Assistant',
    title: 'Assisting a Dysphagic Resident with Meals & Fluid Log',
    description: 'Support a stroke patient with swallowing difficulties during lunchtime, adhering to thickened liquid protocols and logging intake.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Herr Sommer, vor dem Essen bringen wir Ihren Oberkörper in eine ganz aufrechte Sitzposition.', english: 'Mr. Sommer, before eating we bring your upper body into a completely upright seated position.' },
        { german: 'Ich habe das Getränk mit Andickungspulver auf Stufe zwei zubereitet, damit Sie sich nicht verschlucken.', english: 'I prepared the beverage with thickening powder to level two so that you do not choke.' },
        { german: 'Nehmen Sie bitte nur kleine Bissen und senken Sie beim Schlucken das Kinn leicht in Richtung Brust.', english: 'Please take only small bites and lower your chin slightly toward your chest when swallowing.' },
        { german: 'Ich trage genau einhundertfünfzig Milliliter Suppe und zweihundert Milliliter Tee in das Flüssigkeitsprotokoll ein.', english: 'I am logging exactly 150 milliliters of soup and 200 milliliters of tea into the fluid chart.' }
      ],
      example_sentences: [
        'Bitte bleiben Sie nach der Mahlzeit noch etwa zwanzig Minuten aufrecht sitzen, um eine Aspiration zu vermeiden.',
        'Husten Sie kräftig ab, wenn Sie merken, dass etwas im Hals stecken geblieben ist.'
      ]
    }
  },
  {
    parent_domain: 'Healthcare',
    sub_branch: 'Nursing/Care Assistant',
    title: 'Safe Patient Transfer Using a Mechanical Hoist',
    description: 'Coordinate a bed-to-wheelchair transfer using a patient lift sling, ensuring patient reassurance and ergonomic safety.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Frau Vogel, wir heben Sie jetzt mit dem Lifter vorsichtig vom Bett in den Rollstuhl hinüber.', english: 'Mrs. Vogel, we are now lifting you carefully from the bed over into the wheelchair using the hoist.' },
        { german: 'Ich lege das Hebegurttuch glatt unter Ihren Rücken und führe die Beinschlaufen sorgfältig unter Ihren Oberschenkeln durch.', english: 'I will place the hoist sling smoothly under your back and carefully feed the leg straps under your thighs.' },
        { german: 'Die Aufhängung ist sicher eingerastet; lehnen Sie sich einfach ganz entspannt in das Tuch zurück.', english: 'The suspension is securely locked in; just lean back completely relaxed into the sling.' },
        { german: 'Ich fahre den Lifter langsam hoch; sagen Sie mir sofort Bescheid, falls etwas drückt oder zwickt.', english: 'I am driving the lift up slowly; let me know immediately if anything pinches or pulls.' }
      ],
      example_sentences: [
        'Der Rollstuhl ist mit beiden Feststellbremsen blockiert, bevor wir Sie sanft hineingleiten lassen.',
        'Wir positionieren Ihre Füße bequem auf den Fußrasten und richten Ihr Rückenkissen auf.'
      ]
    }
  },

  // 4. Physiotherapy
  {
    parent_domain: 'Healthcare',
    sub_branch: 'Physiotherapy',
    title: 'Gait Training & Crutch Instruction Post-Knee Replacement',
    description: 'Instruct an orthopedic patient after total knee arthroplasty on correct three-point gait technique and stair climbing with forearm crutches.',
    min_level: 'B1',
    content: {
      target_phrases: [
        { german: 'Wir üben heute den Dreipunktegang mit den Unterarmgehstützen auf dem Flur.', english: 'Today we will practice the three-point gait with forearm crutches in the hallway.' },
        { german: 'Setzen Sie zuerst beide Stützen vor, dann das operierte Bein und stützen Sie sich mit den Armen kräftig ab.', english: 'First advance both crutches, then the operated leg, and support yourself firmly with your arms.' },
        { german: 'Beim Treppensteigen gilt die Faustregel: Gesundes Bein zuerst nach oben, operiertes Bein zuerst nach unten.', english: 'When climbing stairs the rule of thumb is: healthy leg goes up first, operated leg goes down first.' },
        { german: 'Achten Sie darauf, Ihren Blick nach vorne zu richten und nicht ständig auf Ihre Füße zu schauen.', english: 'Make sure to direct your gaze forward and not stare constantly down at your feet.' }
      ],
      example_sentences: [
        'Belasten Sie das Knie vorerst nur mit der ärztlich vorgegebenen Teilbelastung von zwanzig Kilogramm.',
        'Wir messen die Beugung und Streckung des Kniegelenks vor und nach jeder Trainingseinheit.'
      ]
    }
  },
  {
    parent_domain: 'Healthcare',
    sub_branch: 'Physiotherapy',
    title: 'Respiratory Therapy & Secretion Clearance',
    description: 'Guide a postoperative patient through diaphragmatic breathing exercises and PEP device training to prevent atelectasis and pneumonia.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Legen Sie Ihre Hände auf den Bauch und atmen Sie tief durch die Nase ein, sodass sich die Bauchdecke hebt.', english: 'Place your hands on your stomach and breathe deeply through your nose so that the abdominal wall rises.' },
        { german: 'Atmen Sie langsam durch die leicht geöffneten Lippen mit der Lippenbremse gegen einen leichten Widerstand aus.', english: 'Exhale slowly through slightly parted lips using the pursed-lip technique against a gentle resistance.' },
        { german: 'Beim Ausatmen in dieses Atemtherapiegerät lockert die Vibration zähen Schleim in den Bronchien.', english: 'When exhaling into this respiratory device, the vibration loosens stubborn mucus in the bronchial tubes.' },
        { german: 'Versuchen Sie nun, mit leicht geöffnetem Mund zweimal tief zu hauchen statt schmerzhaft zu husten.', english: 'Now try to huff deeply twice with mouth slightly open instead of coughing painfully.' }
      ],
      example_sentences: [
        'Halten Sie während des Hauchens ein Kissen gegen Ihre OP-Narbe, um den Wundbereich zu stabilisieren.',
        'Wir wiederholen diesen Zyklus fünfmal, um die Belüftung der unteren Lungenabschnitte zu verbessern.'
      ]
    }
  },
  {
    parent_domain: 'Healthcare',
    sub_branch: 'Physiotherapy',
    title: 'Functional Assessment & Prescribing Home Exercise Regimen',
    description: 'Assess lumbar spine range of motion, muscle imbalances, and instruct a patient on ergonomic core stability exercises for home adherence.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Ich teste zunächst die Beweglichkeit Ihrer Lendenwirbelsäule und prüfe den Finger-Boden-Abstand.', english: 'First I will test the mobility of your lumbar spine and check the fingertip-to-floor distance.' },
        { german: 'Spüren Sie bei der Rückneigung einen stechenden Schmerz oder strahlt etwas in das Gesäß oder Bein aus?', english: 'Do you feel a sharp pain when bending backward or does anything radiate into your glutes or leg?' },
        { german: 'Wir aktivieren die tiefe Rumpfmuskulatur: Ziehen Sie den Bauchnabel sanft nach innen oben, ohne den Atem anzuhalten.', english: 'We activate the deep core muscles: gently draw your belly button in and upward without holding your breath.' },
        { german: 'Führen Sie dieses Übungsprogramm bitte dreimal wöchentlich für jeweils fünfzehn Minuten zu Hause durch.', english: 'Please perform this exercise program three times a week for 15 minutes each at home.' }
      ],
      example_sentences: [
        'Konstanz ist wichtiger als maximale Anstrengung; stoppen Sie sofort, falls ein akuter stechender Schmerz auftritt.',
        'Ich gebe Ihnen einen bebilderten Trainingsplan für die Übungen mit nach Hause.'
      ]
    }
  },

  // 5. Medical Technician/Lab Assistant
  {
    parent_domain: 'Healthcare',
    sub_branch: 'Medical Technician/Lab Assistant',
    title: 'Reporting Critical Panic Values to Intensive Care',
    description: 'Call the intensive care unit immediately to report extreme life-threatening potassium and troponin lab values per safety protocol.',
    min_level: 'B1',
    content: {
      target_phrases: [
        { german: 'Hier ist das Zentrallabor; ich muss einen lebensbedrohlichen Panikwert für einen Patienten auf Ihrer Station durchgeben.', english: 'This is the central laboratory; I must transmit a life-threatening panic value for a patient on your ward.' },
        { german: 'Patient Hans Meier, Geburtsdatum vierter März neunzehnvierundfünfzig, Blutentnahme von elf Uhr dreißig.', english: 'Patient Hans Meier, date of birth March 4, 1954, blood draw from 11:30 AM.' },
        { german: 'Der Kaliumwert liegt bei sieben Komma zwei Millimol pro Liter; die Messung wurde durch Doppelbestimmung verifiziert.', english: 'The potassium level is at 7.2 millimoles per liter; the measurement was verified by duplicate analysis.' },
        { german: 'Bitte wiederholen Sie den Namen und den Laborwert zur Bestätigung für mein Meldeprotokoll.', english: 'Please read back the patient name and lab value for confirmation in my notification log.' }
      ],
      example_sentences: [
        'Das Röhrchen wies keine Hämolyse auf; die Probe war analytisch einwandfrei.',
        'Ich habe die telefonische Alarmierung mit Uhrzeit und Dienstkürzel im Laborinformationssystem vermerkt.'
      ]
    }
  },
  {
    parent_domain: 'Healthcare',
    sub_branch: 'Medical Technician/Lab Assistant',
    title: 'Handling Specimen Rejection & Pre-analytical Errors',
    description: 'Contact an outpatient surgical ward to explain why a blood coagulation specimen cannot be analyzed due to clotting and incorrect filling volume.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Ich rufe bezüglich des Citrat-Röhrchens für die Gerinnungsdiagnostik von Zimmer zwölf an.', english: 'I am calling regarding the citrate tube for coagulation diagnostics from room 12.' },
        { german: 'Das Röhrchen ist leider stark unterfüllt und erreicht nicht die vorgeschriebene Füllstandsmarkierung.', english: 'Unfortunately, the tube is severely underfilled and does not reach the mandatory fill-line marking.' },
        { german: 'Durch das falsche Mischungsverhältnis von Blut zu Antikoagulanz wären Quick-Wert und PTT völlig verfälscht.', english: 'Due to the incorrect mixing ratio of blood to anticoagulant, the Quick value and PTT would be completely skewed.' },
        { german: 'Wir müssen die Probe verwerfen; bitte veranlassen Sie umgehend eine erneute venöse Blutentnahme.', english: 'We have to reject the specimen; please arrange a prompt re-draw of venous blood.' }
      ],
      example_sentences: [
        'Achten Sie beim Abnehmen bitte darauf, das Röhrchen unmittelbar nach der Entnahme viermal vorsichtig zu schwenken.',
        'Ich storniere den Erstauftrag im System und halte den Barcode für die Nachforderung bereit.'
      ]
    }
  },
  {
    parent_domain: 'Healthcare',
    sub_branch: 'Medical Technician/Lab Assistant',
    title: 'Analyzer Quality Control & Calibration Troubleshooting',
    description: 'Investigate a standard deviation outlier on the automated hematology analyzer, run control sera, and document corrective actions.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Bei der morgendlichen internen Qualitätskontrolle am Hämatologie-Automaten liegt der Thrombozyten-Wert außerhalb der Zwei-SD-Grenze.', english: 'During the morning internal quality control on the hematology analyzer, the platelet count fell outside the 2-SD limit.' },
        { german: 'Ich prüfe zunächst das Verfallsdatum des Kontrollbluts und kontrolliere die Reagenzienfüllstände im Vorratstank.', english: 'First I check the expiration date of the control blood and check the reagent levels in the reservoir tank.' },
        { german: 'Ich führe einen automatischen Spülzyklus der Zählkammer durch und kalibriere die optische Messeinheit neu.', english: 'I will perform an automated rinse cycle of the counting chamber and recalibrate the optical measurement unit.' },
        { german: 'Nach der Rekalibrierung liegen alle drei Kontrollstufen wieder exakt innerhalb des zulässigen Toleranzbereichs.', english: 'Following recalibration, all three control levels are once again exactly within the permissible tolerance range.' }
      ],
      example_sentences: [
        'Die Freigabe der Routineproben wird erst nach erfolgreicher Validierung der Kontrollmessung erteilt.',
        'Ich trage die Abweichung und die durchgeführte Fehlerbehebung in das elektronische Qualitätshandbuch ein.'
      ]
    }
  },

  // 6. Radiology Technician
  {
    parent_domain: 'Healthcare',
    sub_branch: 'Radiology Technician',
    title: 'Pre-MRI Safety Screening & Implant Verification',
    description: 'Screen a patient before entering the MRI scanner room, checking for pacemakers, metallic foreign bodies, and claustrophobia.',
    min_level: 'B1',
    content: {
      target_phrases: [
        { german: 'Bevor wir in den MRT-Untersuchungsraum gehen, müssen wir den Sicherheitsfragebogen sorgfältig durchgehen.', english: 'Before we enter the MRI exam room, we must carefully review the safety questionnaire.' },
        { german: 'Tragen Sie einen Herzschrittmacher, Defibrillator, Insulinpumpen oder metallische Gefäßclips im Körper?', english: 'Do you have a cardiac pacemaker, defibrillator, insulin pump, or metallic vascular clips in your body?' },
        { german: 'Haben Sie jemals als Schlosser gearbeitet oder hatten Sie Metallsplitter in den Augen?', english: 'Have you ever worked as a metalworker or had metallic splinters in your eyes?' },
        { german: 'Bitte legen Sie alle metallischen Gegenstände wie Uhren, Schmuck, Brillen und Münzen in die Umkleidekabine.', english: 'Please deposit all metallic objects such as watches, jewelry, glasses, and coins in the changing booth.' }
      ],
      example_sentences: [
        'Während der Messung hören Sie laute Klopfgeräusche; Sie erhalten von uns einen schalldämpfenden Kopfhörer.',
        'Sie bekommen einen Notfallball in die Hand, mit dem Sie die Messung jederzeit sofort unterbrechen können.'
      ]
    }
  },
  {
    parent_domain: 'Healthcare',
    sub_branch: 'Radiology Technician',
    title: 'Instructing Breath-Hold Protocols for Thoracic CT',
    description: 'Position a trauma patient on the CT gantry, adjust laser alignment markers, and coach synchronized breathing commands.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Legen Sie sich bitte flach auf den Rücken und lagern Sie beide Arme nach hinten über den Kopf.', english: 'Please lie flat on your back and place both arms backward above your head.' },
        { german: 'Ich schalte jetzt das rote Laserlicht ein, um die Schnittebene für Ihren Brustkorb exakt zu zentrieren.', english: 'I am now turning on the red laser light to center the cross-sectional plane for your chest precisely.' },
        { german: 'Über den Lautsprecher hören Sie gleich automatische Anweisungen: Einatmen, Ausatmen und die Luft anhalten.', english: 'Over the loudspeaker you will hear automated instructions shortly: breathe in, breathe out, and hold your breath.' },
        { german: 'Es ist entscheidend, dass Sie sich während des Scans absolut nicht bewegen, um Bewegungsartefakte zu vermeiden.', english: 'It is critical that you do not move at all during the scan to avoid motion artifacts.' }
      ],
      example_sentences: [
        'Die eigentliche Spiralaufnahme dauert nur wenige Sekunden; danach dürfen Sie sofort wieder normal atmen.',
        'Der Tisch bewegt sich nun langsam durch die Gantry; erschrecken Sie bitte nicht bei der Fahrt.'
      ]
    }
  },
  {
    parent_domain: 'Healthcare',
    sub_branch: 'Radiology Technician',
    title: 'Administering IV Contrast & Monitoring Adverse Reactions',
    description: 'Explain intravenous iodinated contrast injection, warm sensation expectation, and monitor for allergic urticaria or dyspnea.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Wir verabreichen Ihnen jetzt über die Venenverweilkanüle ein jodhaltiges Kontrastmittel.', english: 'We will now administer an iodinated contrast medium via your intravenous cannula.' },
        { german: 'Dabei breitet sich oft ein warmes Gefühl im Körper aus und Sie spüren vielleicht einen metallischen Geschmack auf der Zunge.', english: 'During this, a warm sensation often spreads through the body and you might notice a metallic taste on your tongue.' },
        { german: 'Das ist eine völlig normale und harmlose Reaktion, die nach ein bis zwei Minuten wieder abklingt.', english: 'That is a completely normal and harmless reaction that subsides after one to two minutes.' },
        { german: 'Sollten Sie jedoch Juckreiz, Atembeschwerden oder Hautquaddeln verspüren, drücken Sie sofort die Notfallklingel.', english: 'However, should you notice itching, breathing difficulties, or hives, press the emergency bell immediately.' }
      ],
      example_sentences: [
        'Ihre Nieren- und Schilddrüsenwerte wurden vorab geprüft und sind für das Kontrastmittel geeignet.',
        'Trinken Sie nach der Untersuchung heute mindestens anderthalb Liter Wasser, um das Kontrastmittel zügig auszuscheiden.'
      ]
    }
  },

  // 7. Dental Assistant
  {
    parent_domain: 'Healthcare',
    sub_branch: 'Dental Assistant',
    title: 'Chairside Assisting During Composite Filling',
    description: 'Assist the dentist during caries excavation and multi-layer composite restoration, managing suction and UV curing light.',
    min_level: 'B1',
    content: {
      target_phrases: [
        { german: 'Ich lege Ihnen die Schutzbrille auf und platziere den Watterollenhalter zur relativen Trockenlegung.', english: 'I will put the protective glasses on you and place the cotton roll holder for relative moisture isolation.' },
        { german: 'Ich führe den großen Speichelsauger ruhig im Mundwinkel, um Abschliff und Spülwasser kontinuierlich abzusaugen.', english: 'I guide the large saliva ejector smoothly in the corner of your mouth to continuously suction debris and rinse water.' },
        { german: 'Ich reiche der Zahnärztin den Ätzgel-Applikator und danach das Adhäsiv für die Schmelzätzung.', english: 'I pass the etching gel applicator and then the adhesive for enamel etching to the dentist.' },
        { german: 'Jetzt polymerisiere ich die Kunststoffschicht für zwanzig Sekunden mit der UV-Polymerisationslampe.', english: 'Now I polymerize the composite layer for 20 seconds using the UV curing light.' }
      ],
      example_sentences: [
        'Bitte halten Sie den Mund noch einen Moment weit geöffnet, während wir die Füllung mit Okklusionsfolie einschleifen.',
        'Spülen Sie Ihren Mund nun einmal gründlich am Mundspülbecken aus.'
      ]
    }
  },
  {
    parent_domain: 'Healthcare',
    sub_branch: 'Dental Assistant',
    title: 'Conducting Oral Hygiene Instruction & Plaque Index Review',
    description: 'Educate a periodontal patient on interdental brushing technique, plaque disclosure results, and tartar prevention.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Mit der Färbelösung haben wir Zahnbelag sichtbar gemacht; die violetten Stellen zeigen bakterielle Plaque.', english: 'Using the disclosing solution we made plaque visible; the purple areas show bacterial plaque.' },
        { german: 'Für Ihre engen Zahnzwischenräume empfehle ich Interdentalbürsten mit null Komma vier Millimeter Drahtstärke.', english: 'For your narrow interdental spaces I recommend interdental brushes with 0.4 millimeter wire thickness.' },
        { german: 'Führen Sie das Bürstchen vorsichtig waagerecht ohne übermäßigen Druck in den Zahnzwischenraum ein.', english: 'Insert the small brush carefully horizontally without excessive pressure into the interdental space.' },
        { german: 'Eine professionelle Zahnreinigung zweimal jährlich verhindert die Neubildung hartnäckigen subgingivalen Zahnsteins.', english: 'Professional teeth cleaning twice a year prevents the reformation of stubborn subgingival calculus.' }
      ],
      example_sentences: [
        'Putzen Sie die Zahnoberflächen immer von Rot nach Weiß, also vom Zahnfleisch zur Zahnkrone hin.',
        'Ich gebe Ihnen ein Musterset passender Bürstengrößen für die tägliche Zahnpflege mit.'
      ]
    }
  },
  {
    parent_domain: 'Healthcare',
    sub_branch: 'Dental Assistant',
    title: 'Triaging an Emergency Walk-in Toothache & X-ray Prep',
    description: 'Assess an unscheduled patient with acute throbbing molar pain, take preliminary history, and position for digital bitewing radiography.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Guten Tag, wir schieben Sie gerne als Schmerzfall ein; bitte nehmen Sie kurz im Behandlungszimmer Platz.', english: 'Good day, we are glad to squeeze you in as an emergency case; please take a seat in the treatment room.' },
        { german: 'Reagiert der schmerzende Zahn empfindlich auf heiße oder kalte Getränke und tut er beim Zubeißen weh?', english: 'Does the aching tooth react sensitively to hot or cold drinks and does it hurt when biting down?' },
        { german: 'Ich lege Ihnen die Bleischürze um den Nacken und platziere den Sensorhalter für eine digitale Röntgenaufnahme.', english: 'I will drape the lead apron around your neck and position the sensor holder for a digital radiograph.' },
        { german: 'Beißen Sie bitte vorsichtig auf den Kunststoffbissblock und halten Sie den Kopf absolut ruhig.', english: 'Please bite gently onto the plastic bite block and keep your head completely still.' }
      ],
      example_sentences: [
        'Die Röntgenaufnahme ist sofort auf dem Bildschirm sichtbar; die Ärztin sieht eine Entzündung an der Wurzelspitze.',
        'Wir führen vor der Anästhesie noch einen Kältetest zur Vitalitätsprüfung durch.'
      ]
    }
  },

  // 8. Hospital Administration/Ward Clerk
  {
    parent_domain: 'Healthcare',
    sub_branch: 'Hospital Administration/Ward Clerk',
    title: 'Coordinating Elective Inpatient Admission & Co-pay Agreement',
    description: 'Process an elective patient arrival at ward admission desk, verify health insurance card, and explain Wahlleistung private room contracts.',
    min_level: 'B1',
    content: {
      target_phrases: [
        { german: 'Guten Morgen, herzlich willkommen auf Station Vier; darf ich bitte Ihre elektronische Gesundheitskarte und Einweisung sehen?', english: 'Good morning, welcome to ward four; may I please see your electronic health card and hospital admission slip?' },
        { german: 'Sie wurden für eine geplante orthopädische Operation aufgenommen; Ihr Bett im Zimmer dreihundertelf ist bereits bezugsbereit.', english: 'You were admitted for planned orthopedic surgery; your bed in room 311 is already prepared.' },
        { german: 'Haben Sie eine private Zusatzversicherung oder möchten Sie Wahlleistungen wie ein Einzelzimmer in Anspruch nehmen?', english: 'Do you have private supplemental insurance or would you like to take advantage of optional services such as a single room?' },
        { german: 'Hier ist der Behandlungsvertrag und die gesetzliche Zuzahlungserklärung von zehn Euro pro Kalendertag.', english: 'Here is the treatment contract and the statutory co-payment declaration of ten euros per calendar day.' }
      ],
      example_sentences: [
        'Bitte unterschreiben Sie hier unten rechts die Datenschutzerklärung gemäß Krankenhausverordnung.',
        'Ich händige Ihnen Ihr Identifikationsarmband aus; bitte tragen Sie es während des gesamten Aufenthalts.'
      ]
    }
  },
  {
    parent_domain: 'Healthcare',
    sub_branch: 'Hospital Administration/Ward Clerk',
    title: 'Scheduling Diagnostic Transport & Inter-Clinic Ambulance Transfer',
    description: 'Coordinate with the patient transport service and external ambulance dispatch to transfer a patient for specialized neuro-imaging.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Ich benötige für morgen Vormittag einen qualifizierten Krankentransport für einen liegenden Patienten zum Uni-Klinikum.', english: 'I require a qualified patient transport for tomorrow morning for a recumbent patient to the University Clinic.' },
        { german: 'Der Patient benötigt während der Fahrt eine kontinuierliche Sauerstoffgabe von zwei Litern pro Minute.', english: 'The patient requires continuous oxygen administration of two liters per minute during the ride.' },
        { german: 'Der Transportschein Muster vier ist vom Stationsarzt unterschrieben und mit dem Vermerk Nicht gehfähig versehen.', english: 'The model 4 transport certificate is signed by the ward physician and marked as non-ambulatory.' },
        { german: 'Bitte planen Sie die Abholung so, dass der Patient pünktlich um zehn Uhr dreißig im dortigen MRT-Zentrum eintrifft.', english: 'Please schedule the pickup so that the patient arrives punctually at 10:30 AM at the MRI center there.' }
      ],
      example_sentences: [
        'Ich gebe den Begleitunterlagen die vollständige Patientenkurve und aktuelle Laborausdrucke in einem versiegelten Umschlag bei.',
        'Der Rücktransport wird von der Zielklinik angemeldet, sobald die Untersuchung abgeschlossen ist.'
      ]
    }
  },
  {
    parent_domain: 'Healthcare',
    sub_branch: 'Hospital Administration/Ward Clerk',
    title: 'Requesting Prior Medical Records & External Discharge Letters',
    description: 'Contact an external municipal hospital medical records department to retrieve previous surgical reports and histology findings under urgent deadline.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Ich rufe aus dem Stationssekretariat der Chirurgie an; wir behandeln aktuell einen Patienten, der vor zwei Wochen bei Ihnen lag.', english: 'I am calling from the surgical ward office; we are currently treating a patient who was hospitalized with you two weeks ago.' },
        { german: 'Könnten Sie uns freundlicherweise den Operationsbericht und den histologischen Befund per sicherem Behördenfax übermitteln?', english: 'Could you kindly transmit the surgical report and histology findings to us via secure hospital fax?' },
        { german: 'Die schriftliche Schweigepflichtentbindung und Einwilligungserklärung des Patienten liegt mir unterschrieben vor.', english: 'I have the patient\'s signed release of confidentiality and consent declaration on file.' },
        { german: 'Die Befunde sind für die heutige interdisziplinäre Tumorkonferenz von entscheidender Dringlichkeit.', english: 'The findings are of decisive urgency for today\'s interdisciplinary tumor board conference.' }
      ],
      example_sentences: [
        'Ich habe die Entbindungserklärung soeben an Ihre gesicherte Faxnummer vorab durchgesendet.',
        'Vielen Dank für die zügige Bearbeitung; der Operateur benötigt die Daten bis spätestens vierzehn Uhr.'
      ]
    }
  }
];
