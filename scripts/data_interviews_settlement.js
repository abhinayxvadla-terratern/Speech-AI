export const settlementInterviews = [
  // 1. Anmeldung & Registration
  {
    parent_domain: 'Settlement',
    sub_branch: 'Anmeldung & Registration',
    type_name: 'Behavioral',
    min_level: 'B1',
    description: 'Behavioral interview covering polite persistence at German public authorities (Bürgeramt, Ausländerbehörde), organized document handling, and patience.',
    content: {
      sample_questions: [
        {
          german: 'Wie bereiten Sie sich auf einen wichtigen Termin bei der Ausländerbehörde oder beim Bürgeramt vor, um Missverständnisse zu vermeiden?',
          english: 'How do you prepare for an important appointment at the immigration office or citizens’ office to avoid misunderstandings?',
          guidance: 'Detail organizing documents in a clear folder (original + copies), checking requirements on municipal websites, bringing a bilingual checklist, and arriving punctually.'
        },
        {
          german: 'Erzählen Sie von einer Situation, in der ein Sachbearbeiter ein Dokument nicht anerkennen wollte. Wie haben Sie ruhig und sachlich reagiert?',
          english: 'Tell us about a situation where a case worker was reluctant to accept a document. How did you react calmly and factually?',
          guidance: 'Stay polite and respectful: ask for the exact statutory basis (Paragraf) or administrative regulation, clarify what supplementary proof is needed, and request written guidance.'
        },
        {
          german: 'Wie gehen Sie mit langen Wartezeiten auf einen Behördentermin (z.B. für die Verlängerung des Aufenthaltstitels) um?',
          english: 'How do you manage long waiting times for an authority appointment (e.g. for residence permit extension)?',
          guidance: 'Book appointments months in advance, check early morning cancellation slots online, submit written applications via registered mail (Einschreiben) to secure statutory continuation effects (Fiktionswirkung).'
        }
      ]
    }
  },
  {
    parent_domain: 'Settlement',
    sub_branch: 'Anmeldung & Registration',
    type_name: 'Technical',
    min_level: 'B2',
    description: 'Technical evaluation of German residence law (AufenthG), Fiktionsbescheinigung (§ 81 AufenthG), Wohnungsgeberbestätigung (§ 19 BMG), and naturalization rules (StAG).',
    content: {
      sample_questions: [
        {
          german: 'Welche rechtliche Wirkung hat eine Fiktionsbescheinigung nach Paragraf 81 Absatz 4 des Aufenthaltsgesetzes (AufenthG) bei rechtzeitigem Verlängerungsantrag?',
          english: 'What legal effect does a provisional certificate (Fiktionsbescheinigung) under Section 81 (4) of the Residence Act have upon timely extension application?',
          guidance: 'Explain that timely application extends the previous legal status and employment authorization unchanged until a final administrative decision is rendered, including international travel validity.'
        },
        {
          german: 'Welche Angaben muss eine Wohnungsgeberbestätigung nach Paragraf 19 des Bundesmeldegesetzes (BMG) zwingend enthalten?',
          english: 'What information must a landlord confirmation (Wohnungsgeberbestätigung) under Section 19 Federal Registration Act strictly contain?',
          guidance: 'List mandatory details: landlord name/address, move-in date, exact apartment address, and names of all individuals moving into the residence.'
        },
        {
          german: 'Welche Voraussetzungen (z.B. Voraufenthaltszeit, Lebensunterhaltssicherung, Sprachniveau B1, Loyalitätserklärung) müssen nach dem reformierten Staatsangehörigkeitsrecht für eine Einbürgerung erfüllt sein?',
          english: 'What requirements (e.g. residency duration, livelihood security, B1 language level, loyalty declaration) must be met for naturalization under the reformed citizenship law?',
          guidance: 'Detail 5-year general residence (or 3 years for special integration achievements), financial independence without Bürgergeld, B1 German certificate, passing the "Leben in Deutschland" test, and commitment to the free democratic constitutional order.'
        }
      ]
    }
  },
  {
    parent_domain: 'Settlement',
    sub_branch: 'Anmeldung & Registration',
    type_name: 'Situational',
    min_level: 'B1',
    description: 'Scenario assessment evaluating response to expiring residence permits, landlord refusal of registration documents, and name changes.',
    content: {
      sample_questions: [
        {
          german: 'Ihr elektronischer Aufenthaltstitel läuft in vier Wochen ab, aber Sie erhalten keinen Termin bei der Ausländerbehörde. Wie sichern Sie Ihren Aufenthaltsstatus?',
          english: 'Your electronic residence permit expires in four weeks, but you cannot get an appointment at the immigration office. How do you secure your legal status?',
          guidance: 'Submit a formal extension application via certified mail or official online portal before expiry, preserve postal receipt as legal proof of timely filing, and request an emergency Fiktionsbescheinigung.'
        },
        {
          german: 'Ihr Vermieter weigert sich, Ihnen die gesetzlich vorgeschriebene Wohnungsgeberbestätigung für die Anmeldung beim Bürgeramt auszustellen. Was tun Sie?',
          english: 'Your landlord refuses to issue the legally required landlord confirmation for registration at the citizens’ office. What do you do?',
          guidance: 'Inform the Bürgeramt at your appointment: landlords are legally obligated under § 19 BMG to issue the form within 2 weeks, and the authority can impose administrative fines on non-compliant landlords.'
        },
        {
          german: 'Sie haben geheiratet und Ihren Nachnamen geändert. Welche Behörden müssen Sie in welcher Reihenfolge über die Namensänderung informieren?',
          english: 'You got married and changed your surname. Which authorities must you inform in what sequence regarding the name change?',
          guidance: 'Update national passport first, then Bürgeramt registration registry, followed by Ausländerbehörde (new eAT card), health insurance fund, bank, and employer.'
        }
      ]
    }
  },
  {
    parent_domain: 'Settlement',
    sub_branch: 'Anmeldung & Registration',
    type_name: 'Panel',
    min_level: 'B2',
    description: 'Naturalization or settlement consultation panel simulation with Immigration Case Officer (Sachbearbeiter) and Integration Advisory Counselor.',
    content: {
      sample_questions: [
        {
          german: 'Wie beurteilen Sie Ihre bisherige persönliche und gesellschaftliche Integration in Deutschland seit Ihrer Ankunft?',
          english: 'How do you assess your personal and social integration into German society since your arrival?',
          guidance: 'Share concrete evidence: language acquisition progress, stable gainful employment, tax contributions, local club memberships (Vereinsleben), and good neighborly relations.'
        },
        {
          german: 'Welche Bedeutung hat das Grundgesetz der Bundesrepublik Deutschland und die freiheitliche demokratische Grundordnung für Sie persönlich?',
          english: 'What significance do the Basic Law of the Federal Republic of Germany and the free democratic constitutional order hold for you personally?',
          guidance: 'Affirm core constitutional values: inviolability of human dignity (Art. 1 GG), equality of men and women (Art. 3 GG), freedom of speech, freedom of religion, and the rule of law.'
        },
        {
          german: 'Wie stellen Sie die eigenständige Sicherung Ihres Lebensunterhalts und Ihrer Altersvorsorge langfristig sicher?',
          english: 'How do you ensure independent long-term securing of your livelihood and retirement provisions?',
          guidance: 'Highlight permanent employment contract, adequate income without recourse to social security benefits (SGB II/XII), and statutory pension contributions (Rentenversicherungsbeiträge).'
        }
      ]
    }
  },
  {
    parent_domain: 'Settlement',
    sub_branch: 'Anmeldung & Registration',
    type_name: 'Phone Screen',
    min_level: 'B1',
    description: 'Preliminary telephone inquiry with municipal authority service desk verifying appointment prerequisites and document completeness.',
    content: {
      sample_questions: [
        {
          german: 'Guten Tag! Rufen Sie an, um einen Erstwohnsitz nach einem Zuzug aus dem Ausland oder einen innerstädtischen Umzug anzumelden?',
          english: 'Good day! Are you calling to register your primary residence following a move from abroad or an intra-city relocation?',
          guidance: 'Clarify registration nature clearly (Erstanmeldung after arrival or Ummeldung within Germany) and state exact move-in date.'
        },
        {
          german: 'Liegen Ihnen alle Originaldokumente (Reisepass, Visum, Mietvertrag und ausgefüllte Wohnungsgeberbestätigung) bereits vor?',
          english: 'Do you already possess all original documents (passport, visa, lease agreement, and completed landlord confirmation)?',
          guidance: 'Confirm possession of all required originals and photocopies, ready for the counter appointment.'
        },
        {
          german: 'Möchten Sie den Termin für eine Einzelperson oder für die gesamte Familie mit Kindern buchen?',
          english: 'Would you like to book the appointment for an individual or for the entire family with children?',
          guidance: 'State exact number of household members being registered and confirm availability of birth/marriage certificates with apostilles.'
        }
      ]
    }
  },

  // 2. Banking & Finance
  {
    parent_domain: 'Settlement',
    sub_branch: 'Banking & Finance',
    type_name: 'Behavioral',
    min_level: 'B1',
    description: 'Behavioral interview covering financial responsibility, transparent credit discussions, understanding German banking culture, and managing contracts.',
    content: {
      sample_questions: [
        {
          german: 'Wie verschaffen Sie sich einen genauen Überblick über Ihre monatlichen Einnahmen und wiederkehrenden Fixkosten in Deutschland?',
          english: 'How do you gain a precise overview of your monthly income and recurring fixed costs in Germany?',
          guidance: 'Describe budgeting discipline: tracking salary, warm rent, insurance premiums, mobile contracts, and grocery budgets using banking apps or spreadsheets.'
        },
        {
          german: 'Erzählen Sie von einer Situation, in der Sie eine unklare Kontobewegung oder eine unberechtigte Lastschrift auf Ihrem Girokonto festgestellt haben.',
          english: 'Tell us about a situation where you noticed an unclear account transaction or unauthorized direct debit on your checking account.',
          guidance: 'Show prompt action: checking transaction details, contacting the vendor, using online banking to return the unauthorized SEPA debit (Lastschriftrückgabe within 8 weeks).'
        },
        {
          german: 'Wie gehen Sie mit langfristigen Sparzielen und dem Aufbau eines finanziellen Notfallpolsters (Notgroschen) um?',
          english: 'How do you approach long-term savings goals and building a financial emergency cushion (Notgroschen)?',
          guidance: 'Advocate setting aside 3-6 months of living expenses on an accessible overnight deposit account (Tagesgeldkonto) before long-term investments.'
        }
      ]
    }
  },
  {
    parent_domain: 'Settlement',
    sub_branch: 'Banking & Finance',
    type_name: 'Technical',
    min_level: 'B2',
    description: 'Technical banking evaluation on German Girokonto functionality, Schufa credit score mechanics, SEPA transfers, and the statutory Basiskonto (§ 31 ZKG).',
    content: {
      sample_questions: [
        {
          german: 'Was regelt das Zahlungskontengesetz (ZKG) bezüglich des Rechts jedes Verbrauchers auf ein Basiskonto (Girokonto für jedermann)?',
          english: 'What does the Payment Accounts Act (ZKG) stipulate regarding every consumer’s right to a basic bank account (Basiskonto)?',
          guidance: 'Explain that credit institutions are legally required to offer a basic checking account with core payment functions to any legal resident regardless of credit history.'
        },
        {
          german: 'Wie funktioniert das Scoringsystem der Schufa und welche Faktoren (z.B. Handyverträge, Kreditkarten, Kreditanfragen) beeinflussen den Basisscore negativ?',
          english: 'How does the Schufa credit scoring system work and which factors (e.g. mobile contracts, credit cards, credit inquiries) negatively affect the base score?',
          guidance: 'Explain positive vs negative data entries: late payments, defaults, too many simultaneous loan requests (Kreditanfrage vs Konditionenanfrage), and score percentiles.'
        },
        {
          german: 'Welche steuerlichen Angaben (Steueridentifikationsnummer, Freistellungsauftrag für Kapitalerträge) benötigt eine deutsche Bank zur Eröffnung?',
          english: 'Which tax details (tax ID number, tax exemption order for capital gains) does a German bank require for account opening?',
          guidance: 'Mention the 11-digit Steuer-ID, FATCA/CRS residency declarations, and setting a Freistellungsauftrag (Sparer-Pauschbetrag 1.000€) to prevent withholding tax.'
        }
      ]
    }
  },
  {
    parent_domain: 'Settlement',
    sub_branch: 'Banking & Finance',
    type_name: 'Situational',
    min_level: 'B1',
    description: 'Scenario assessment evaluating response to lost Girocards, unexpected overdraft fees (Dispozinsen), and cross-border bank transfer delays.',
    content: {
      sample_questions: [
        {
          german: 'Sie bemerken am Samstagabend, dass Ihre Bankkarte (Girocard / Debitkarte) gestohlen wurde. Was tun Sie in den nächsten zehn Minuten?',
          english: 'You notice on a Saturday evening that your bank card (Girocard / debit card) was stolen. What do you do in the next 10 minutes?',
          guidance: 'Dial the nationwide card emergency blocking hotline 116 116 immediately, state IBAN and bank routing code, report theft to local police, and request replacement.'
        },
        {
          german: 'Ihr Girokonto rutscht unerwartet ins Minus und es fallen hohe Dispositionszinsen an. Wie bringen Sie Ihr Konto schnell wieder ins Gleichgewicht?',
          english: 'Your checking account slips unexpectedly into negative balance and high overdraft interest charges accrue. How do you balance it quickly?',
          guidance: 'Transfer funds immediately from emergency savings (Tagesgeld), avoid expensive Dispo interest, audit upcoming monthly debits, and adjust spending.'
        },
        {
          german: 'Eine Auslandsüberweisung in Ihr Heimatland ist nach zwei Wochen noch nicht beim Empfänger eingetroffen. Wie forschen Sie nach?',
          english: 'An international wire transfer to your home country has not arrived at the recipient after two weeks. How do you investigate?',
          guidance: 'Request a formal payment tracking inquiry (Nachforschungsauftrag / SWIFT MT103 confirmation) from your bank to verify intermediary routing.'
        }
      ]
    }
  },
  {
    parent_domain: 'Settlement',
    sub_branch: 'Banking & Finance',
    type_name: 'Panel',
    min_level: 'B2',
    description: 'Bank advisory panel simulation with Bank Manager (Filialleiter) and Financial Counselor evaluating creditworthiness and mortgage readiness.',
    content: {
      sample_questions: [
        {
          german: 'Welche Unterlagen (Gehaltsabrechnungen, unbefristeter Arbeitsvertrag, Schufa-Auskunft) legen Sie bei einem Antrag auf einen Ratenkredit oder Dispokredit vor?',
          english: 'What documentation (salary slips, permanent employment contract, Schufa report) do you present when applying for an installment loan or overdraft?',
          guidance: 'Provide last 3 monthly payslips, proof of permanent residence permit, employment contract past probation, and clean credit history.'
        },
        {
          german: 'Wie beurteilen Sie das Risiko von zinsvariablen Darlehen im Vergleich zu festen Zinsbindungsfristen bei einer Baufinanzierung?',
          english: 'How do you evaluate the risk of variable-rate loans compared to fixed interest periods in residential mortgage financing?',
          guidance: 'Advocate for long fixed-rate terms (10-15 years) for planning security against interest rate fluctuations in domestic family financing.'
        },
        {
          german: 'Welche Vorsorgemaßnahmen treffen Sie bezüglich einer privaten Haftpflichtversicherung und einer Berufsunfähigkeitsversicherung (BU)?',
          english: 'What provisions do you make regarding personal liability insurance and occupational disability insurance (BU)?',
          guidance: 'Recognize private liability insurance (Privathaftpflicht) as essential protection against catastrophic liability, and BU to safeguard income against illness.'
        }
      ]
    }
  },
  {
    parent_domain: 'Settlement',
    sub_branch: 'Banking & Finance',
    type_name: 'Phone Screen',
    min_level: 'B1',
    description: 'Bank customer service phone screening verifying identity documents for account opening, video identification, and residency status.',
    content: {
      sample_questions: [
        {
          german: 'Guten Tag! Möchten Sie die Identitätsprüfung für Ihr neues Girokonto per Postident in einer Filiale oder per Videoident am Smartphone durchführen?',
          english: 'Good day! Would you like to complete the identity verification for your new checking account via Postident in a branch or via Videoident on your smartphone?',
          guidance: 'Select preferred method, confirm possession of a valid passport with holographic security features, and a stable Internet connection.'
        },
        {
          german: 'Sind Sie steuerlich ausschließlich in Deutschland ansässig oder unterliegen Sie der Steuerpflicht in einem weiteren Staat?',
          english: 'Are you exclusively tax resident in Germany or are you subject to tax liability in another country?',
          guidance: 'Confirm primary German tax residency and state your German Steuer-Identifikationsnummer clearly.'
        },
        {
          german: 'Benötigen Sie neben der digitalen Debitkarte auch eine physische Girocard für den täglichen Einkauf im deutschen Einzelhandel?',
          english: 'Do you require a physical Girocard for daily shopping in German retail in addition to your digital debit card?',
          guidance: 'Confirm request for physical Girocard / EC-Karte, recognizing that some smaller German shops and bakeries only accept Girocards.'
        }
      ]
    }
  },

  // 3. Housing & Tenancy
  {
    parent_domain: 'Settlement',
    sub_branch: 'Housing & Tenancy',
    type_name: 'Behavioral',
    min_level: 'B1',
    description: 'Behavioral interview covering apartment hunting etiquette in tight rental markets, compiling the Bewerbermappe, and neighbor relations.',
    content: {
      sample_questions: [
        {
          german: 'Wie gestalten Sie Ihre Bewerbungsunterlagen (Bewerbermappe) für eine Mietwohnung, um bei Vermietern einen seriösen Eindruck zu hinterlassen?',
          english: 'How do you compile your application dossier (Bewerbermappe) for a rental apartment to make a reputable impression on landlords?',
          guidance: 'Include: friendly cover letter, completed tenant disclosure (Mieterselbstauskunft), last 3 salary slips, current Schufa credit report, and landlord debt-free certificate (Mietschuldenfreiheitsbescheinigung).'
        },
        {
          german: 'Wie verhalten Sie sich bei einer Wohnungsbesichtigung mit vielen Mitbewerbern, um positiv in Erinnerung zu bleiben?',
          english: 'How do you behave during an apartment viewing with numerous competitors to leave a positive impression?',
          guidance: 'Dress smartly, arrive punctually, greet the landlord politely, ask thoughtful questions about heating and maintenance, and submit the complete dossier in person.'
        },
        {
          german: 'Erzählen Sie von einer Meinungsverschiedenheit mit einem Hausnachbarn bezüglich der Hausordnung oder Lärmbelästigung. Wie haben Sie das gelöst?',
          english: 'Tell us about a disagreement with a neighbor regarding house rules or noise disturbance. How did you resolve it?',
          guidance: 'Demonstrate peaceful resolution: talking directly over coffee, acknowledging perspective, respecting statutory quiet hours (Ruhezeiten), and avoiding escalating to the landlord immediately.'
        }
      ]
    }
  },
  {
    parent_domain: 'Settlement',
    sub_branch: 'Housing & Tenancy',
    type_name: 'Technical',
    min_level: 'B2',
    description: 'Technical tenancy law evaluation on German rental contracts (BGB Mietrecht), utility cost statements (Nebenkostenabrechnung), and security deposits (Mietkaution).',
    content: {
      sample_questions: [
        {
          german: 'Welche gesetzlichen Vorschriften gelten nach Paragraf 551 BGB für die Höhe, Anlage und Rückzahlung der Mietkaution durch den Vermieter?',
          english: 'What legal provisions apply under Section 551 BGB regarding the amount, investment, and repayment of the rental deposit by the landlord?',
          guidance: 'State: maximum 3 net cold months rent (Nettokaltmieten), payable in 3 equal monthly installments, held in separate insolvency-safe escrow account at interest, repaid within 3-6 months after handover.'
        },
        {
          german: 'Nach welchen Grundsätzen der Betriebskostenverordnung (BetrKV) prüfen Sie eine jährliche Nebenkostenabrechnung auf unzulässige Positionen?',
          english: 'According to which principles of the Operating Costs Ordinance (BetrKV) do you inspect an annual utility bill for impermissible charges?',
          guidance: 'Differentiate apportionable operating costs (heating, water, waste, elevator) from non-apportionable costs: property management fees (Verwaltungskosten) and capital repairs (Instandhaltung) are landlord-borne.'
        },
        {
          german: 'Welche Rolle spielt das Wohnungsübergabeprotokoll beim Ein- und Auszug für die Beweislast bei vorhandenen Mängeln und Schönheitsreparaturen?',
          english: 'What role does the apartment handover protocol play during move-in and move-out for the burden of proof regarding defects and cosmetic repairs?',
          guidance: 'Explain that the signed protocol legally documents pre-existing scratches, meter readings (water, heat, electricity), preventing unjust deductions from the deposit.'
        }
      ]
    }
  },
  {
    parent_domain: 'Settlement',
    sub_branch: 'Housing & Tenancy',
    type_name: 'Situational',
    min_level: 'B1',
    description: 'Scenario assessment evaluating response to sudden heating failures in winter, mold discovery, and rent increase notifications.',
    content: {
      sample_questions: [
        {
          german: 'Im Dezember bei Minustemperaturen fällt die Zentralheizung in Ihrer Mietwohnung komplett aus. Welche Schritte leiten Sie gegenüber dem Vermieter ein?',
          english: 'In December during sub-zero temperatures, the central heating in your rented flat fails completely. What steps do you initiate toward the landlord?',
          guidance: 'Notify the landlord immediately in writing with proof (Mängelanzeige), set a short 24-48h deadline for remedy, and reserve the statutory right to rent reduction (Mietminderung).'
        },
        {
          german: 'In einer Zimmerecke bildet sich dunkler Schimmelpilz an der Außenwand. Wie gehen Sie vor und wie dokumentieren Sie Ihr Lüftungsverhalten?',
          english: 'Dark mold forms on the exterior wall in a room corner. How do you proceed and how do you document your ventilation habits?',
          guidance: 'Report defect immediately to landlord, maintain a ventilation log (Stoßlüften 3-4 times daily for 5-10 minutes with windows wide open), photograph moisture, and request inspection.'
        },
        {
          german: 'Ihr Vermieter kündigt eine Mieterhöhung unter Berufung auf den örtlichen Mietspiegel an. Wie überprüfen Sie die Rechtmäßigkeit?',
          english: 'Your landlord announces a rent increase citing the local rent index (Mietspiegel). How do you verify its legality?',
          guidance: 'Check adherence to the statutory capping limit (Kappungsgrenze 15-20% within 3 years), verify apartment classification in the Mietspiegel, or seek advice from Mieterverein.'
        }
      ]
    }
  },
  {
    parent_domain: 'Settlement',
    sub_branch: 'Housing & Tenancy',
    type_name: 'Panel',
    min_level: 'B2',
    description: 'Landlord interview simulation with Property Management Director (Hausverwaltung) and Property Owner evaluating long-term tenancy reliability.',
    content: {
      sample_questions: [
        {
          german: 'Warum möchten Sie genau in diese Wohnung und dieses Wohnviertel einziehen und wie lange planen Sie zu bleiben?',
          english: 'Why do you want to move specifically into this apartment and neighborhood, and how long do you plan to stay?',
          guidance: 'Express genuine appreciation for the neighborhood, proximity to work or transit, and commitment to a stable, quiet, long-term tenancy.'
        },
        {
          german: 'Halten Sie Haustiere oder spielen Sie Musikinstrumente, die besondere Rücksichtnahme im Mehrfamilienhaus erfordern?',
          english: 'Do you keep pets or play musical instruments that require special consideration in an apartment building?',
          guidance: 'Answer transparently: small cage pets are generally permitted, dogs/cats subject to agreement; practice hours for instruments must respect statutory quiet periods.'
        },
        {
          german: 'Wie stehen Sie zur Kehrwoche bzw. der Verpflichtung zur Treppenhausreinigung und dem Winterdienst (Schneeräumpflicht)?',
          english: 'What is your stance on the stairwell cleaning schedule (Kehrwoche) and winter service (snow clearing duty)?',
          guidance: 'Confirm thorough adherence to the roster, clearing ice and snow promptly in front of property, or contributing to building maintenance fees.'
        }
      ]
    }
  },
  {
    parent_domain: 'Settlement',
    sub_branch: 'Housing & Tenancy',
    type_name: 'Phone Screen',
    min_level: 'B1',
    description: 'Real estate agent telephone screening verifying net household income, earliest move-in date, and applicant profile completeness.',
    content: {
      sample_questions: [
        {
          german: 'Guten Tag! Wie viele Personen möchten in die Wohnung einziehen und wie hoch ist Ihr monatliches Haushaltsnettoeinkommen?',
          english: 'Good day! How many people would move into the apartment and what is your monthly net household income?',
          guidance: 'State household size accurately and confirm net income is at least 3x the warm rent per German landlord underwriting standards.'
        },
        {
          german: 'Liegt Ihnen eine positive Schufa-Auskunft ohne negative Einträge und eine Mietschuldenfreiheitsbescheinigung vor?',
          english: 'Do you hold a positive Schufa credit certificate with no negative entries and a certificate of debt-free tenancy?',
          guidance: 'Confirm that current Schufa documentation is ready to send via email immediately.'
        },
        {
          german: 'Könnten Sie die Wohnung bereits zum Monatsersten anmieten oder müssen Sie eine Kündigungsfrist einhalten?',
          english: 'Could you rent the apartment starting on the first of the month or do you have to observe an existing notice period?',
          guidance: 'State move-in availability date clearly and ability to take over the tenancy smoothly.'
        }
      ]
    }
  },

  // 4. Healthcare System Access
  {
    parent_domain: 'Settlement',
    sub_branch: 'Healthcare System Access',
    type_name: 'Behavioral',
    min_level: 'B1',
    description: 'Behavioral interview covering navigating German outpatient medicine, developing a trustful Hausarzt relationship, and health prevention.',
    content: {
      sample_questions: [
        {
          german: 'Wie finden Sie einen festen Hausarzt (Allgemeinmediziner) an Ihrem Wohnort und warum ist das Hausarztmodell in Deutschland so wichtig?',
          english: 'How do you find a permanent general practitioner (Hausarzt) in your locality and why is the GP model so important in Germany?',
          guidance: 'Explain searching through regional associations of statutory physicians (KV), registering before becoming sick, and relying on GPs as primary coordinators for specialist referrals.'
        },
        {
          german: 'Erzählen Sie von einer Situation, in der Sie sich im deutschen Gesundheitssystem krankgemeldet haben (elektronische Arbeitsunfähigkeitsbescheinigung eAU).',
          english: 'Tell us about a situation where you reported sick in the German healthcare system (electronic sickness certificate eAU).',
          guidance: 'Describe notifying employer before work begins, visiting the GP on day 1-3, having the electronic eAU transmitted directly to the health insurance fund, and confirming employer notification.'
        },
        {
          german: 'Wie gehen Sie mit präventiven Gesundheitsuntersuchungen (Check-up 35, Zahnvorsorge, Krebsfrüherkennung) um?',
          english: 'How do you approach preventative health check-ups (Check-up 35, dental check-ups, cancer screening)?',
          guidance: 'Value regular checkups: annual dental check for the bonus booklet (Bonusheft), cardiovascular checkups, and maintaining vaccination records (Impfpass).'
        }
      ]
    }
  },
  {
    parent_domain: 'Settlement',
    sub_branch: 'Healthcare System Access',
    type_name: 'Technical',
    min_level: 'B2',
    description: 'Technical health system evaluation on GKV vs. PKV differences, emergency phone numbers (112 vs 116 117), prescription types, and sick pay (Krankengeld).',
    content: {
      sample_questions: [
        {
          german: 'Was unterscheidet den ärztlichen Bereitschaftsdienst der Kassenärztlichen Vereinigung (Telefon 116 117) vom Notruf der Rettungsdienste (Telefon 112)?',
          english: 'What distinguishes the on-call medical service of the statutory physicians (phone 116 117) from the emergency rescue call (phone 112)?',
          guidance: 'Clarify 112 for acute life-threatening emergencies (chest pain, unconsciousness, severe accidents), vs 116 117 for non-life-threatening conditions outside regular clinic hours (weekends, nights).'
        },
        {
          german: 'Wie unterscheiden sich die Rezeptarten (rosa Kassenrezept / E-Rezept, grünes Empfehlungsrezept, blaues Privatrezept) bezüglich der Kostenübernahme?',
          english: 'How do prescription types (pink statutory/E-prescription, green recommendation, blue private) differ regarding cost reimbursement?',
          guidance: 'Explain: E-Rezept/pink covered by statutory insurance minus statutory 5-10€ co-payment (Zuzahlung); green paid full out-of-pocket for non-prescription remedies; blue paid out-of-pocket for private reimbursement.'
        },
        {
          german: 'Welche gesetzlichen Regelungen gelten für die sechswöchige Entgeltfortzahlung durch den Arbeitgeber und das anschließende Krankengeld der Krankenkasse?',
          english: 'What statutory rules govern the 6-week continued wage payment by the employer and subsequent sickness benefit (Krankengeld) from the health fund?',
          guidance: 'State: 100% employer wage continuation for up to 6 weeks for the same illness; after 6 weeks, statutory health insurance pays Krankengeld (approx. 70% of gross, max 90% of net) for up to 78 weeks.'
        }
      ]
    }
  },
  {
    parent_domain: 'Settlement',
    sub_branch: 'Healthcare System Access',
    type_name: 'Situational',
    min_level: 'B1',
    description: 'Scenario assessment evaluating response to urgent specialist appointment bottlenecks, missing eGK cards, and out-of-hours pharmacy needs.',
    content: {
      sample_questions: [
        {
          german: 'Ihr Hausarzt überweist Sie dringend an einen Kardiologen, aber alle Praxen nennen Ihnen Wartezeiten von sechs Monaten. Wie nutzen Sie den Vermittlungsservice?',
          english: 'Your GP refers you urgently to a cardiologist, but all practices quote 6-month waits. How do you use the appointment service?',
          guidance: 'Obtain an urgent referral code (Dringlichkeitscode) on your Überweisungsschein from the GP, contact the 116 117 appointment service online/phone, and receive an appointment within 4 weeks.'
        },
        {
          german: 'Sie haben starke Zahnschmerzen an einem Feiertag. Wie finden Sie die diensthabende Notdienst-Zahnarztpraxis?',
          english: 'You have severe toothache on a public holiday. How do you find the dental emergency practice on duty?',
          guidance: 'Check the regional dental association portal (Zahnärztlicher Notdienst), dial 116 117 or local emergency duty phone line, and bring electronic health card (eGK).'
        },
        {
          german: 'Sie benötigen am Sonntag dringend ein verschriebenes Antibiotikum. Wie finden Sie die nächste geöffnete Notdienst-Apotheke?',
          english: 'You urgently need a prescribed antibiotic on Sunday. How do you find the nearest open emergency pharmacy?',
          guidance: 'Check the digital pharmacy emergency search (Apothekennotdienst der Bundesvereinigung Deutscher Apothekerverbände), or look at the posted schedule on the entrance of any local pharmacy.'
        }
      ]
    }
  },
  {
    parent_domain: 'Settlement',
    sub_branch: 'Healthcare System Access',
    type_name: 'Panel',
    min_level: 'B2',
    description: 'Health Insurance Advisory Panel simulation with Krankenkasse Customer Advisor and Patient Advocate evaluating long-term health literacy.',
    content: {
      sample_questions: [
        {
          german: 'Welche Kriterien (Zusatzbeitrag, Bonusprogramme, Kostenübernahme für Reiseschutzimpfungen) sind Ihnen bei der Wahl Ihrer gesetzlichen Krankenkasse wichtig?',
          english: 'Which criteria (supplementary contribution, bonus schemes, travel vaccine coverage) are important to you when choosing your statutory health fund?',
          guidance: 'Discuss comparing Zusatzbeitrag percentage rates, customer service responsiveness, digital app features, and reimbursements for dental cleaning or sports.'
        },
        {
          german: 'Wie stehen Sie zur elektronischen Patientenakte (ePA) und der digitalen Vernetzung zwischen Ärzten, Kliniken und Apotheken?',
          english: 'What is your stance on the electronic patient file (ePA) and digital networking between doctors, clinics, and pharmacies?',
          guidance: 'Appreciate benefits of cross-specialty transparency, preventing adverse drug interactions, eliminating duplicate X-rays, while respecting patient data control.'
        },
        {
          german: 'Unter welchen Voraussetzungen kann ein Arbeitnehmer von der gesetzlichen in die private Krankenversicherung (PKV) wechseln?',
          english: 'Under what conditions can an employee switch from statutory to private health insurance (PKV)?',
          guidance: 'Explain the annual income threshold (Versicherungspflichtgrenze / Jahresarbeitsentgeltgrenze JAEG), self-employment status, or civil servant status.'
        }
      ]
    }
  },
  {
    parent_domain: 'Settlement',
    sub_branch: 'Healthcare System Access',
    type_name: 'Phone Screen',
    min_level: 'B1',
    description: 'Medical practice receptionist telephone screen scheduling a first-time appointment, checking insurance details, and acute symptom intake.',
    content: {
      sample_questions: [
        {
          german: 'Guten Tag, Praxis Dr. Weber. Sind Sie bereits Patient bei uns oder handelt es sich um Ihren ersten Besuch in unserer Praxis?',
          english: 'Good day, Dr. Weber’s practice. Are you already a patient with us or is this your first visit to our practice?',
          guidance: 'State clearly that you are a new patient seeking to register with the practice, and provide your address.'
        },
        {
          german: 'Sind Sie gesetzlich oder privat versichert und bei welcher Krankenkasse?',
          english: 'Are you statutorily or privately insured and with which health insurance company?',
          guidance: 'State your insurance type and fund name (e.g. Techniker Krankenkasse, AOK, Barmer).'
        },
        {
          german: 'Handelt es sich um eine akute Erkrankung für unsere offene Sprechstunde oder möchten Sie einen regulären Vorsorgetermin vereinbaren?',
          english: 'Is this an acute illness for our walk-in clinic hours or would you like to arrange a regular preventative appointment?',
          guidance: 'Explain acute symptoms concisely if urgent, or accept a scheduled routine appointment date.'
        }
      ]
    }
  },

  // 5. Social Integration
  {
    parent_domain: 'Settlement',
    sub_branch: 'Social Integration',
    type_name: 'Behavioral',
    min_level: 'B1',
    description: 'Behavioral interview covering social integration into German communities, volunteering in local clubs (Vereine), and intercultural openness.',
    content: {
      sample_questions: [
        {
          german: 'Wie knüpfen Sie aktiv Kontakte zu deutschen Einheimischen in Ihrer Nachbarschaft oder an Ihrem Wohnort?',
          english: 'How do you actively establish contacts with German locals in your neighborhood or town?',
          guidance: 'Highlight joining local community clubs (Sportverein, Freiwillige Feuerwehr, Chor), attending neighborhood street festivals, and regular friendly interactions.'
        },
        {
          german: 'Erzählen Sie von einer ehrenamtlichen Tätigkeit oder einem gemeinnützigen Projekt, an dem Sie mitgewirkt haben.',
          english: 'Tell us about a volunteer activity or community project in which you participated.',
          guidance: 'Share engagement in community gardens, language exchange mentoring, animal shelters, or organizing cultural festivals.'
        },
        {
          german: 'Wie gehen Sie mit Vorurteilen oder kulturellen Missverständnissen im Alltag um?',
          english: 'How do you handle prejudices or cultural misunderstandings in daily life?',
          guidance: 'Respond with patience, open dialog, demystifying assumptions through personal warmth, and demonstrating shared democratic values.'
        }
      ]
    }
  },
  {
    parent_domain: 'Settlement',
    sub_branch: 'Social Integration',
    type_name: 'Technical',
    min_level: 'B2',
    description: 'Technical civic assessment on German municipal club law (Vereinsrecht), BAMF integration course regulations, and political participation.',
    content: {
      sample_questions: [
        {
          german: 'Welche rechtliche Bedeutung hat das Vereinswesen (eingetragener Verein - e.V.) für den gesellschaftlichen Zusammenhalt in Deutschland?',
          english: 'What legal and social significance does the club system (registered association - e.V.) have for social cohesion in Germany?',
          guidance: 'Explain non-profit civic engagement, democratic governance through member assemblies (Mitgliederversammlung), bylaws (Satzung), and community volunteering.'
        },
        {
          german: 'Wie ist der Integrationskurs des Bundesamtes für Migration und Flüchtlinge (BAMF) aufgebaut (Sprachkurs und Orientierungskurs)?',
          english: 'How is the BAMF integration course structured (language course and orientation course)?',
          guidance: 'Detail 600 hours of language instruction up to B1 (Deutsch-Test für Zuwanderer - DTZ), followed by 100 hours of orientation course covering German history, legal order, and culture ("Leben in Deutschland" test).'
        },
        {
          german: 'Welche Möglichkeiten der politischen Partizipation haben ausländische Mitbürger (z.B. Integrationsrat, EU-Kommunalwahlrecht)?',
          english: 'What opportunities for political participation do foreign residents have (e.g. municipal integration council, EU local voting rights)?',
          guidance: 'Explain EU citizens’ right to vote in municipal elections, and non-EU citizens’ participation in municipal integration councils (Integrationsrat) and public petitions.'
        }
      ]
    }
  },
  {
    parent_domain: 'Settlement',
    sub_branch: 'Social Integration',
    type_name: 'Situational',
    min_level: 'B1',
    description: 'Scenario assessment evaluating response to neighborhood conflicts, organizing community initiatives, and participating in public hearings.',
    content: {
      sample_questions: [
        {
          german: 'Ihre Nachbarschaft plant ein Sommer-Straßenfest und sucht Freiwillige für Organisation und Essensstände. Wie bringen Sie sich ein?',
          english: 'Your neighborhood is planning a summer street festival and seeking volunteers for organization and food stalls. How do you get involved?',
          guidance: 'Offer to set up benches, contribute homemade specialties from your cultural cuisine, and engage in friendly conversations with long-time residents.'
        },
        {
          german: 'Ein älterer Nachbar benötigt Unterstützung beim wöchentlichen Einkaufen oder bei Gartenarbeiten. Wie bieten Sie Ihre Hilfe an?',
          english: 'An elderly neighbor needs assistance with weekly grocery shopping or gardening. How do you offer your help?',
          guidance: 'Approach respectfully and warmly, ask whether carrying heavy shopping bags or clearing pathways would be helpful, and build regular contact.'
        },
        {
          german: 'In Ihrer Gemeinde findet eine Bürgerversammlung zur Neugestaltung des örtlichen Parks statt. Wie bringen Sie Ihre Ideen ein?',
          english: 'A town hall citizen meeting takes place in your municipality regarding the redesign of the local park. How do you contribute your ideas?',
          guidance: 'Attend the public hearing, listen to municipal planning presentations, step up to the microphone politely, and advocate for inclusive green spaces and playgrounds.'
        }
      ]
    }
  },
  {
    parent_domain: 'Settlement',
    sub_branch: 'Social Integration',
    type_name: 'Panel',
    min_level: 'B2',
    description: 'Integration Committee Panel simulation with Municipal Integration Officer (Integrationsbeauftragter) and NGO Community Leader.',
    content: {
      sample_questions: [
        {
          german: 'Was bedeutet für Sie gelungene Integration im Unterschied zu bloßer Anpassung oder Assimilation?',
          english: 'What does successful integration mean to you as opposed to mere conformity or assimilation?',
          guidance: 'Define integration as a two-way process: actively participating in German society and embracing constitutional values while preserving personal cultural heritage as enrichment.'
        },
        {
          german: 'Welche Rolle spielt die deutsche Sprache als Schlüssel zur gesellschaftlichen Teilhabe und beruflichen Verwirklichung?',
          english: 'What role does the German language play as a key to social participation and professional realization?',
          guidance: 'Highlight language as the foundational prerequisite for building friendships, understanding cultural nuances, and unlocking equal career progression.'
        },
        {
          german: 'Wie können etablierte Vereine und Organisationen neue Zuwanderer noch besser in ihre Vereinsstrukturen einbinden?',
          english: 'How can established clubs and organizations integrate newcomers even better into their club structures?',
          guidance: 'Suggest open trial training days (Schnuppertage), low-threshold bilingual welcome flyers, and appointing integration buddies in sports and cultural clubs.'
        }
      ]
    }
  },
  {
    parent_domain: 'Settlement',
    sub_branch: 'Social Integration',
    type_name: 'Phone Screen',
    min_level: 'B1',
    description: 'Community volunteer coordinator telephone screening assessing interest in local mentoring projects and community involvement.',
    content: {
      sample_questions: [
        {
          german: 'Guten Tag! Warum möchten Sie sich ehrenamtlich in unserer Nachbarschaftsinitiative oder im Sportverein engagieren?',
          english: 'Good day! Why would you like to volunteer in our neighborhood initiative or sports club?',
          guidance: 'Share genuine motivation to give back to the local community, meet new people, and contribute practical skills.'
        },
        {
          german: 'Welche Hobbys oder besonderen Fähigkeiten (z.B. Sportarten, Kochen, Handwerk, Musik) möchten Sie einbringen?',
          english: 'Which hobbies or special skills (e.g. sports, cooking, craftsmanship, music) would you like to bring in?',
          guidance: 'Describe your personal passions and how you can share them with youth, seniors, or peers in club activities.'
        },
        {
          german: 'Wie viele Stunden pro Woche oder Monat könnten Sie für ehrenamtliche Treffen und Aktivitäten aufwenden?',
          english: 'How many hours per week or month could you dedicate to volunteer meetings and activities?',
          guidance: 'Provide a realistic, reliable time commitment (e.g. 2-3 hours on weekends or one evening per week).'
        }
      ]
    }
  }
];
