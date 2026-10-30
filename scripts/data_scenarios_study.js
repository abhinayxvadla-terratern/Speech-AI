// Study/University scenarios: 6 sub-branches * 3 scenarios each = 18 scenarios
// Sub-branches: University Application & Enrollment, Academic Life, Student Administration, 
// Campus & Student Life, Thesis/Academic Writing, Part-time Student Jobs

export const studyScenarios = [
  // 1. University Application & Enrollment
  {
    parent_domain: 'Study/University',
    sub_branch: 'University Application & Enrollment',
    title: 'Inquiring About Certified Documents at the International Office',
    description: 'Visit the International Office to verify required notarized translations of secondary education certificates and German proficiency proof.',
    min_level: 'B1',
    content: {
      target_phrases: [
        { german: 'Guten Tag, ich habe mich über uni-assist für den Masterstudiengang Informatik an Ihrer Universität beworben.', english: 'Good day, I applied via uni-assist for the Master\'s program in Computer Science at your university.' },
        { german: 'Reicht für die Immatrikulation eine amtlich beglaubigte Kopie des Bachelorzeugnisses oder muss das Original vorgelegt werden?', english: 'Is an officially certified copy of the Bachelor certificate sufficient for enrollment or must the original be presented?' },
        { german: 'Mein TestDaF-Zertifikat weist ein Gesamtergebnis mit vier Vierern auf; erfüllt das die sprachlichen Zulassungsvoraussetzungen?', english: 'My TestDaF certificate shows an overall score of four 4s; does that satisfy the language admission requirements?' },
        { german: 'Bis zu welcher Frist müssen die fehlenden Unterlagen im Studierendensekretariat eingereicht sein?', english: 'By what deadline must the missing documents be submitted to the student registry office?' }
      ],
      example_sentences: [
        'Hier ist meine Bewerbernummer sowie die vorläufige Prüfbestätigung von uni-assist.',
        'Sie erhalten Ihren Zulassungsbescheid innerhalb von zwei Wochen über das zentrale Bewerbungsportal.'
      ]
    }
  },
  {
    parent_domain: 'Study/University',
    sub_branch: 'University Application & Enrollment',
    title: 'Clarifying NC Cutoffs & Conditional Admission Requirements',
    description: 'Consult academic advising on numerus clausus clearing procedures (Nachrückverfahren) and fulfilling bridge module conditions.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Ich habe einen vorläufigen Zulassungsbescheid mit Auflagen für den Studiengang Molekulare Biotechnologie erhalten.', english: 'I received a conditional admission letter with requirements for the Molecular Biotechnology program.' },
        { german: 'Im Bescheid steht, dass ich dreißig ECTS-Punkte in Höherer Mathematik und Biochemie bis zum dritten Fachsemester nachholen muss.', english: 'The decision states that I must complete 30 ECTS credits in Advanced Mathematics and Biochemistry by the third semester.' },
        { german: 'Gibt es Möglichkeiten, diese Brückenkurse bereits in der vorlesungsfreien Zeit vor Semesterbeginn zu absolvieren?', english: 'Are there possibilities to complete these bridging courses during the semester break before classes begin?' },
        { german: 'Wie stehen meine Chancen im koordinierten Nachrückverfahren, falls ich auf einen zulassungsbeschränkten Studienplatz warte?', english: 'What are my chances in the coordinated clearing process if I am waiting for an admission-restricted study place?' }
      ],
      example_sentences: [
        'Die Auflagenprüfungen müssen beim zuständigen Prüfungsausschuss vor Beginn der Masterarbeit angemeldet werden.',
        'Sollten Sie die Auflagen nicht fristgerecht nachweisen, erlischt die Immatrikulation zum Folgesemester.'
      ]
    }
  },
  {
    parent_domain: 'Study/University',
    sub_branch: 'University Application & Enrollment',
    title: 'Semester Fee Payment & CampusCard Student ID Validation',
    description: 'Inquire at student service desk about semester contribution bank transfer deadlines, solidarity transit pass, and smartcard chip activation.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Ich habe den Semesterbeitrag von dreihundertfünfzig Euro vor fünf Werktagen überwiesen und möchte prüfen, ob der Betrag verbucht wurde.', english: 'I transferred the semester fee of 350 euros five business days ago and would like to check if the amount has been credited.' },
        { german: 'Der Verwendungszweck enthielt meine Matrikelnummer und mein Geburtsdatum gemäß der Zahlungsanweisung.', english: 'The payment reference included my matriculation number and date of birth in accordance with the payment instructions.' },
        { german: 'An welchem Validierungsautomaten auf dem Campus kann ich den Thermodruck auf meiner CampusCard für das neue Semester aktualisieren?', english: 'At which validation machine on campus can I update the thermal print on my CampusCard for the new semester?' },
        { german: 'Beinhaltet der Semesterbeitrag das deutschlandweite Semesterticket für den gesamten öffentlichen Nahverkehr?', english: 'Does the semester contribution include the Germany-wide semester ticket for all local public transportation?' }
      ],
      example_sentences: [
        'Sobald das Geld im Hochschulkonto eingeht, schaltet sich die Rückmeldesperre im Online-Portal automatisch frei.',
        'Mit der validierten Karte können Sie in der Mensa bargeldlos bezahlen und Bücher in der Universitätsbibliothek ausleihen.'
      ]
    }
  },

  // 2. Academic Life
  {
    parent_domain: 'Study/University',
    sub_branch: 'Academic Life',
    title: 'Consulting Professor on Term Paper Topic in Office Hours',
    description: 'Attend a professor’s weekly office hours to propose an empirical seminar research paper topic, formulating research question and literature scope.',
    min_level: 'B1',
    content: {
      target_phrases: [
        { german: 'Guten Tag Professor Schmidt, vielen Dank, dass Sie sich Zeit für meine Sprechstunde genommen haben.', english: 'Good day Professor Schmidt, thank you for taking the time for my office hours appointment.' },
        { german: 'Ich möchte im Rahmen unseres Hauptseminars eine Hausarbeit über die Auswirkungen von Remote Work auf Teamdynamiken schreiben.', english: 'In the framework of our advanced seminar, I would like to write a term paper on the effects of remote work on team dynamics.' },
        { german: 'Meine zentrale Forschungsfrage lautet: Inwiefern beeinflussen asynchrone Kommunikationstools das Vertrauen zwischen Teammitgliedern?', english: 'My central research question is: To what extent do asynchronous communication tools influence trust among team members?' },
        { german: 'Ich habe bereits ein einseitiges Exposé mit vorläufiger Gliederung und initialem Literaturverzeichnis vorbereitet.', english: 'I have already prepared a one-page exposé with a preliminary outline and initial bibliography.' }
      ],
      example_sentences: [
        'Grenzen Sie den theoretischen Rahmen stärker auf soziologische Organisationstheorien ein, um den Umfang nicht zu sprengen.',
        'Reichen Sie den überarbeiteten Entwurf bis Ende des Monats per E-Mail zur finalen Freigabe ein.'
      ]
    }
  },
  {
    parent_domain: 'Study/University',
    sub_branch: 'Academic Life',
    title: 'Coordinating Roles & Slide Flow for Group Presentation',
    description: 'Lead a seminar project group coordination meeting, divide presentation segments, manage slide design standards, and rehearse delivery timing.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Lasst uns die dreißig Minuten Vortragszeit gleichmäßig auf unsere vier Gruppenmitglieder aufteilen.', english: 'Let us divide the 30 minutes of presentation time evenly among our four group members.' },
        { german: 'Ich übernehme die theoretische Einführung und den aktuellen Forschungsstand, wer möchte den empirischen Methodenteil vorstellen?', english: 'I will take the theoretical introduction and state of the art; who would like to present the empirical methodology section?' },
        { german: 'Wir sollten einheitliche Folienlayouts verwenden und maximal sechs Aufzählungspunkte pro Folie einbinden.', english: 'We should use consistent slide layouts and include a maximum of six bullet points per slide.' },
        { german: 'Lasst uns am Donnerstag eine vollständige Generalprobe mit Stoppuhr machen, um die Fragerunde realistisch zu simulieren.', english: 'Let us do a complete dry run on Thursday with a stopwatch to simulate the Q&A session realistically.' }
      ],
      example_sentences: [
        'Bitte ladet alle eure Folienentwürfe bis Mittwochabend in den gemeinsamen Cloud-Ordner hoch.',
        'Wir bereiten am Ende zwei Diskussionsfragen vor, um eine lebhafte Debatte im Plenum anzuregen.'
      ]
    }
  },
  {
    parent_domain: 'Study/University',
    sub_branch: 'Academic Life',
    title: 'Debating Complex Problem Sets in a University Tutorial',
    description: 'Participate actively in a quantitative problem tutorial, questioning mathematical derivations and clarifying assumptions with the teaching assistant.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Könnten Sie bitte den Zwischenschritt bei der partiellen Integration an der Tafel noch einmal genauer erläutern?', english: 'Could you please explain the intermediate step in integration by parts on the blackboard once more in greater detail?' },
        { german: 'Mir ist noch nicht ganz klar, unter welcher mathematischen Annahme der Grenzwert gegen unendlich hier konvergiert.', english: 'It is not yet completely clear to me under which mathematical assumption the limit toward infinity converges here.' },
        { german: 'In der Vorlesung wurde dieser Beweis mit einem alternativen Ansatz über Taylor-Reihen hergeleitet.', english: 'In the lecture this proof was derived using an alternative approach via Taylor series.' },
        { german: 'Dürfen wir in der Klausur eine handgeschriebene Formelsammlung oder einen nichtprogrammierbaren Taschenrechner benutzen?', english: 'Are we permitted to use a handwritten formula sheet or a non-programmable calculator in the written exam?' }
      ],
      example_sentences: [
        'Wenn wir diese Randbedingung gleich null setzen, vereinfacht sich die Matrixgleichung erheblich.',
        'Der Tutor empfiehlt, die Übungsaufgaben aus den Altklausuren der letzten drei Jahre zur Klausurvorbereitung durchzurechnen.'
      ]
    }
  },

  // 3. Student Administration
  {
    parent_domain: 'Study/University',
    sub_branch: 'Student Administration',
    title: 'Submitting a Medical Sick Certificate to Examination Board',
    description: 'Notify the examination office (Prüfungsamt) of acute illness on exam day, complying with strict statutory medical certificate deadlines.',
    min_level: 'B1',
    content: {
      target_phrases: [
        { german: 'Ich bin am heutigen Prüfungstag akut erkrankt und muss mich von der Klausur in Mikroökonomie krankmelden.', english: 'I fell acutely ill on today\'s exam day and must report sick for the written exam in Microeconomics.' },
        { german: 'Ich war heute Morgen beim Arzt und habe ein qualifiziertes ärztliches Attest über die Prüfungsunfähigkeit erhalten.', english: 'I visited the doctor this morning and received a qualified medical certificate of inability to take examinations.' },
        { german: 'Laut Prüfungsordnung muss das Originalattest innerhalb von drei Werktagen im Prüfungsamt vorliegen.', english: 'According to examination regulations, the original certificate must reach the examination office within three working days.' },
        { german: 'Wird dieser Rücktritt als Fehlversuch gewertet oder werde ich automatisch für den Nachholtermin im nächsten Semester angemeldet?', english: 'Will this withdrawal be counted as a failed attempt or will I be registered automatically for the retake date next semester?' }
      ],
      example_sentences: [
        'Ich habe den Scan des Attests vorab per E-Mail gesendet und werfe das Original in den Fristenbriefkasten der Universität.',
        'Das Prüfungsamt bestätigt den ordnungsgemäßen Rücktritt im elektronischen Notensystem.'
      ]
    }
  },
  {
    parent_domain: 'Study/University',
    sub_branch: 'Student Administration',
    title: 'Applying for Credit Transfer from Prior Foreign University Studies',
    description: 'Liaise with the module coordinator and examination board to transfer credits (Anerkennung) from international university transcripts.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Ich stelle einen Antrag auf Anerkennung von Studienleistungen, die ich während meines Bachelorstudiums im Ausland erbracht habe.', english: 'I am submitting an application for the transfer of academic credits earned during my undergraduate studies abroad.' },
        { german: 'Ich habe das offizielle Transcript of Records, die Modulbeschreibungen und die Syllabus-Inhalte in deutscher Übersetzung beigefügt.', english: 'I attached the official transcript of records, module descriptions, and syllabus content translated into German.' },
        { german: 'Die erbrachten Kurse in Statistik stimmen nach Inhalt und Workload zu mehr als achtzig Prozent mit dem Pflichtmodul überein.', english: 'The completed courses in statistics align by more than 80 percent in content and workload with the mandatory module.' },
        { german: 'Werden die Noten anhand der bayerischen Formel in das deutsche Notensystem umgerechnet oder als bestanden ohne Note verbucht?', english: 'Are the grades converted into the German grading scale using the Bavarian formula or recorded as passed without grade?' }
      ],
      example_sentences: [
        'Der Fachvertreter prüft, ob wesentliche Unterschiede hinsichtlich der erworbenen Kompetenzen bestehen.',
        'Der Anerkennungsbescheid wird Ihnen schriftlich mit Rechtsbehelfsbelehrung per Post zugestellt.'
      ]
    }
  },
  {
    parent_domain: 'Study/University',
    sub_branch: 'Student Administration',
    title: 'Applying for a Leave of Absence Semester (Urlaubssemester)',
    description: 'Apply for a formal semester off due to a full-time mandatory internship abroad, navigating social security and exam eligibility restrictions.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Ich möchte für das kommende Sommersemester ein Urlaubssemester wegen eines sechsmonatigen Auslandspraktikums beantragen.', english: 'I would like to apply for a leave of absence semester for the upcoming summer semester due to a six-month internship abroad.' },
        { german: 'Als Nachweis lege ich den unterschriebenen Praktikumsvertrag und die Bestätigung über das Pflichtpraktikum aus der Studienordnung bei.', english: 'As proof I enclose the signed internship contract and confirmation of the mandatory internship requirement from the study regulations.' },
        { german: 'Darf ich während des Urlaubssemesters Wiederholungsprüfungen an der Universität mitschreiben?', english: 'Am I permitted to sit retake examinations at the university during the leave of absence semester?' },
        { german: 'Bleibt mein Studierendenstatus für die studentische Krankenversicherung und das BAföG während der Beurlaubung bestehen?', english: 'Does my student status remain intact for student health insurance and federal student aid (BAföG) during the leave?' }
      ],
      example_sentences: [
        'Ein Urlaubssemester zählt als Hochschulsemester, aber nicht als Fachsemester für die Regelstudienzeit.',
        'Der Antrag auf Beurlaubung muss vor Vorlesungsbeginn vollständig eingereicht sein.'
      ]
    }
  },

  // 4. Campus & Student Life
  {
    parent_domain: 'Study/University',
    sub_branch: 'Campus & Student Life',
    title: 'Navigating Dormitory Amenities & Resolving Quiet Hour Issues',
    description: 'Speak with the student dormitory resident caretaker (Hausmeister) regarding washing machine card top-up and noise complaints.',
    min_level: 'B1',
    content: {
      target_phrases: [
        { german: 'Guten Tag Herr Bauer, ich bin der neue Mieter aus Zimmer zweihundertzehn in der Studentensiedlung.', english: 'Good day Mr. Bauer, I am the new tenant from room 210 in the student residence complex.' },
        { german: 'Können Sie mir erklären, wie ich das Waschguthaben auf meiner Karte am Kassenautomaten im Keller auflade?', english: 'Could you explain how I top up laundry balance on my card at the pay station in the basement?' },
        { german: 'In unserer Etage gab es in den letzten Nächten nach zweiundzwanzig Uhr laute Musik trotz der geltenden Hausordnung.', english: 'On our floor there was loud music over the past few nights after 10:00 PM despite the established house rules.' },
        { german: 'Gibt es im Wohnheim einen Gemeinschaftsraum, den man für private Lerngruppen oder Geburtstage reservieren kann?', english: 'Is there a common room in the dormitory that one can reserve for private study groups or birthdays?' }
      ],
      example_sentences: [
        'Die Waschmaschinen lassen sich bequem über das digitale Buchungssystem der Wohnheim-App reservieren.',
        'Bitte achten Sie im Interesse aller Bewohner auf die gesetzliche Nachtruhe ab zweiundzwanzig Uhr.'
      ]
    }
  },
  {
    parent_domain: 'Study/University',
    sub_branch: 'Campus & Student Life',
    title: 'Consulting Student Union (AStA) on Legal & Transit Rights',
    description: 'Visit the General Students’ Committee (AStA) office to seek free student legal advice regarding tenancy contracts and semester ticket disputes.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Guten Tag, ich möchte die kostenlose Rechtsberatung des AStA für Studierende in Anspruch nehmen.', english: 'Good day, I would like to make use of the free AStA legal consultation for university students.' },
        { german: 'Mein privater Vermieter weigert sich seit vier Monaten, meine Mietkaution von zwölfhundert Euro zurückzuzahlen.', english: 'My private landlord has been refusing for four months to return my rental security deposit of 1200 euros.' },
        { german: 'Zudem wurde mir im Zug eine Fahrpreisnacherhebung ausgestellt, obwohl mein digitales Semesterticket gültig war.', english: 'In addition, I was issued a penalty fare fine on the train even though my digital semester ticket was valid.' },
        { german: 'Bietet der AStA Unterstützung bei der Formulierung eines formellen Widerspruchs gegen das Verkehrsunternehmen an?', english: 'Does the student union offer assistance in drafting a formal appeal against the transport company?' }
      ],
      example_sentences: [
        'Die AStA-Sozialberatung prüft Ihren Mietvertrag und verfasst eine schriftliche Zahlungsaufforderung mit Fristsetzung.',
        'Beim Semesterticket reicht meist die Vorlage der Immatrikulationsbescheinigung beim Kundencenter zur Stornierung der Gebühr.'
      ]
    }
  },
  {
    parent_domain: 'Study/University',
    sub_branch: 'Campus & Student Life',
    title: 'Signing Up for University Sports & Managing Waitlist Spots',
    description: 'Inquire at University Sports (Hochschulsport) center about high-demand athletic courses, registration rush, and semester subscriptions.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Wann genau wird das Online-Buchungsportal für die Hochschulsport-Kurse im kommenden Semester freigeschaltet?', english: 'When exactly will the online booking portal for university sports courses be unlocked for the upcoming semester?' },
        { german: 'Die Plätze für den Boulderkurs für Fortgeschrittene waren innerhalb von wenigen Sekunden restlos ausgebucht.', english: 'The spots for the advanced bouldering course were completely booked out within seconds.' },
        { german: 'Ich stehe aktuell auf Wartelistenplatz drei; wie hoch ist die Wahrscheinlichkeit, dass jemand vor Kursbeginn abspringt?', english: 'I am currently on waitlist spot number three; how high is the probability that someone drops out before classes begin?' },
        { german: 'Gilt die Fitnessstudio-Mitgliedschaft im Sportzentrum für den gesamten Campus oder nur für bestimmte Trainingszeiten?', english: 'Does the gym membership in the sports center apply to the entire campus or only for designated training slots?' }
      ],
      example_sentences: [
        'Sollte ein gebuchter Teilnehmer am ersten Kurstag unentschuldigt fehlen, rückt automatisch der nächste auf der Warteliste nach.',
        'Denken Sie daran, bei jedem Besuch Ihren Studierendenausweis und ein sauberes Trainingshandtuch mitzubringen.'
      ]
    }
  },

  // 5. Thesis/Academic Writing
  {
    parent_domain: 'Study/University',
    sub_branch: 'Thesis/Academic Writing',
    title: 'Defining Research Scope & Methodology with Thesis Supervisor',
    description: 'Meet with your thesis supervisor to narrow down research boundaries, choose between qualitative interviews or quantitative surveys, and set milestones.',
    min_level: 'B1',
    content: {
      target_phrases: [
        { german: 'Ich möchte mit Ihnen den methodischen Aufbau meiner Bachelorarbeit über Künstliche Intelligenz im Kundenservice besprechen.', english: 'I would like to discuss with you the methodological framework of my Bachelor\'s thesis on Artificial Intelligence in customer service.' },
        { german: 'Ich plane eine quantitative Online-Umfrage mit mindestens zweihundert Teilnehmern sowie fünf Experteninterviews mit IT-Leitern.', english: 'I plan a quantitative online survey with at least 200 participants as well as five expert interviews with IT directors.' },
        { german: 'Halten Sie diesen empirischen Methodenmix innerhalb der vorgegebenen Bearbeitungszeit von zwölf Wochen für realistisch?', english: 'Do you consider this empirical mixed-methods approach realistic within the mandated 12-week processing period?' },
        { german: 'Wie eng sollte ich den theoretischen Bezugsrahmen auf das Technology Acceptance Model eingrenzen?', english: 'How narrowly should I confine the theoretical reference framework to the Technology Acceptance Model?' }
      ],
      example_sentences: [
        'Konzentrieren Sie sich lieber auf eine saubere qualitative Inhaltsanalyse nach Mayring statt oberflächlicher Umfragedaten.',
        'Wir vereinbaren alle vier Wochen einen Meilenstein-Termin zur Besprechung des Arbeitsfortschritts.'
      ]
    }
  },
  {
    parent_domain: 'Study/University',
    sub_branch: 'Thesis/Academic Writing',
    title: 'Handling Corporate Data Confidentiality & Non-Disclosure Clauses',
    description: 'Clarify with academic advisor how to cite proprietary industry findings while complying with corporate non-disclosure agreements (Sperrvermerk).',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Da ich meine Masterarbeit in Kooperation mit einem Industrieunternehmen schreibe, fordert das Unternehmen einen Sperrvermerk.', english: 'Since I am writing my Master\'s thesis in cooperation with an industrial corporation, the company requests a non-disclosure embargo clause.' },
        { german: 'Die Arbeit darf aus Geheimhaltungsgründen für die Dauer von fünf Jahren nicht in der Universitätsbibliothek veröffentlicht werden.', english: 'For reasons of confidentiality, the thesis must not be published in the university library for a duration of five years.' },
        { german: 'Wie handhaben wir das Zitieren von internen Unternehmensberichten und vertraulichen Prozessdaten im Literaturverzeichnis?', english: 'How do we handle the citation of internal company reports and proprietary process data in the bibliography?' },
        { german: 'Beide Gutachter müssen vor Beginn der Begutachtung eine standardisierte Vertraulichkeitserklärung unterzeichnen.', english: 'Both reviewers must sign a standardized confidentiality agreement prior to commencing evaluation.' }
      ],
      example_sentences: [
        'Der offizielle Text des Sperrvermerks wird als Deckblatt unmittelbar hinter der Titelseite eingebunden.',
        'Die wissenschaftliche Nachvollziehbarkeit der Methode muss trotz Anonymisierung der Klarnamen gewährleistet bleiben.'
      ]
    }
  },
  {
    parent_domain: 'Study/University',
    sub_branch: 'Thesis/Academic Writing',
    title: 'Preparing for Thesis Oral Defense & Responding to Critical Examiners',
    description: 'Rehearse presentation strategy for thesis colloquium (Bachelorkolloquium), anticipating tough methodological challenges from faculty committee.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Im zwanzigminütigen Vortrag meines Kolloquiums fokussiere ich mich auf die zentralen Forschungsergebnisse und Limitationen.', english: 'In the 20-minute presentation of my defense I will focus on key research findings and limitations.' },
        { german: 'Auf die Frage des Zweitprüfers zur Repräsentativität meiner Stichprobe möchte ich mit einer fundierten Sensitivitätsanalyse antworten.', english: 'To the second examiner\'s question regarding sample representativeness I want to respond with a sound sensitivity analysis.' },
        { german: 'Ich gebe offen zu, dass die Datenbasis Verzerrungseffekte aufweisen könnte, was weiteren Forschungsbedarf begründet.', english: 'I openly concede that the dataset could display selection bias effects, which substantiates future research needs.' },
        { german: 'Wie wird die mündliche Verteidigung im Verhältnis zur schriftlichen Note der Abschlussarbeit gewichtet?', english: 'How is the oral defense weighted relative to the written grade of the academic thesis?' }
      ],
      example_sentences: [
        'Bereiten Sie zusätzliche Backup-Folien im Anhang für detaillierte mathematische Formeln und Rohdaten vor.',
        'Bleiben Sie bei kritischen Einwänden der Prüfungskommission sachlich und verteidigen Sie Ihre methodischen Entscheidungen souverän.'
      ]
    }
  },

  // 6. Part-time Student Jobs
  {
    parent_domain: 'Study/University',
    sub_branch: 'Part-time Student Jobs',
    title: 'Clarifying the 20-Hour Weekly Work Limit with Corporate HR',
    description: 'Discuss social security exemptions (Werkstudentenprivileg) and 20-hour maximum weekly term-time legal ceilings with human resources.',
    min_level: 'B1',
    content: {
      target_phrases: [
        { german: 'Guten Tag, ich trete zum ersten Oktober meine Stelle als Werkstudent in der Softwareentwicklung bei Ihnen an.', english: 'Good day, I am starting my position as a working student in software development with you on October 1st.' },
        { german: 'Um das Werkstudentenprivileg in der Sozialversicherung nicht zu verlieren, darf ich während der Vorlesungszeit maximal zwanzig Stunden pro Woche arbeiten.', english: 'In order not to lose working student status in social security, I may work a maximum of 20 hours per week during term time.' },
        { german: 'In der vorlesungsfreien Zeit in den Semesterferien ist eine Aufstockung auf eine Vollzeittätigkeit von vierzig Wochenstunden gesetzlich zulässig.', english: 'During the lecture-free period in the semester break, an increase to full-time employment of 40 weekly hours is legally permissible.' },
        { german: 'Ich reiche Ihnen meine aktuelle Immatrikulationsbescheinigung sowie meine Versicherungsnummer für die Gehaltsabrechnung ein.', english: 'I submit my current enrollment certificate as well as my national insurance number for payroll.' }
      ],
      example_sentences: [
        'Die wöchentliche Arbeitszeit erfassen wir über das Zeiterfassungssystem mit Gleitzeitkonto.',
        'Bitte informieren Sie uns unverzüglich, wenn Sie ein Urlaubssemester einlegen oder Ihr Studium beenden.'
      ]
    }
  },
  {
    parent_domain: 'Study/University',
    sub_branch: 'Part-time Student Jobs',
    title: 'Negotiating Flexible Hours Around University Exam Period',
    description: 'Speak with your company team lead to temporarily reduce working hours and bank overtime to study for upcoming exam week.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Ich wollte mit dir über meine Arbeitszeiten während der anstehenden Klausurenphase im Juli sprechen.', english: 'I wanted to talk to you about my working hours during the upcoming exam period in July.' },
        { german: 'Ich schreibe innerhalb von zwei Wochen vier schwere Klausuren und müsste mein wöchentliches Pensum vorübergehend auf zehn Stunden reduzieren.', english: 'I am writing four tough exams within two weeks and would need to temporarily reduce my weekly workload to ten hours.' },
        { german: 'Ich habe in den vergangenen Monaten dreißig Überstunden aufgebaut, die ich gerne zur Prüfungsvorbereitung abfeiern möchte.', english: 'I built up 30 hours of overtime over recent months that I would like to take off as compensatory time for exam preparation.' },
        { german: 'Nach den Klausuren im August stehe ich dem Team gerne wieder vollzeit zur Verfügung, um die Projektverzögerung aufzuholen.', english: 'Following exams in August, I will gladly be available to the team full-time again to catch up on project backlog.' }
      ],
      example_sentences: [
        'Ich stimme die Übergabe meiner laufenden Support-Tickets vorab mit meiner Vertretungskollegin ab.',
        'Dein Studium hat absolute Priorität; reiche den Zeitausgleich einfach im Urlaubsportal ein.'
      ]
    }
  },
  {
    parent_domain: 'Study/University',
    sub_branch: 'Part-time Student Jobs',
    title: 'Handing Over Research Data & Lab Protocols to Department Chair',
    description: 'Hand over laboratory data, literature databases, and student grading sheets as a student research assistant (HiWi) at the university chair.',
    min_level: 'B2',
    content: {
      target_phrases: [
        { german: 'Hier ist die strukturierte Übergabe der experimentellen Messreihen aus dem Chemielabor für diesen Monat.', english: 'Here is the structured handover of the experimental test series from the chemistry laboratory for this month.' },
        { german: 'Ich habe alle Zitationsquellen und Volltexte in der gemeinsamen Literaturverwaltungsdatenbank mit passenden Schlagwörtern katalogisiert.', english: 'I cataloged all citation sources and full texts in the shared reference manager database with appropriate tags.' },
        { german: 'Die Übungszettel der Erstsemester-Studierenden sind vollständig korrigiert und die Punkte in das Campus-Notenportal eingepflegt.', english: 'The freshman problem sheets have been completely graded and the scores entered into the campus grading portal.' },
        { german: 'Ich habe eine detaillierte Readme-Datei erstellt, die alle Skripte und Berechnungsformeln für meinen Nachfolger dokumentiert.', english: 'I created a detailed Readme file documenting all scripts and calculation formulas for my successor.' }
      ],
      example_sentences: [
        'Die Rohdaten wurden verschlüsselt auf dem Institutsserver gesichert und mit Prüfsummen validiert.',
        'Vielen Dank für Ihre gewissenhafte Zuarbeit bei diesem Drittmittel-Forschungsprojekt.'
      ]
    }
  }
];
