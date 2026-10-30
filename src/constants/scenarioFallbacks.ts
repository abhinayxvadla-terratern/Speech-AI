export interface ScenarioPhrase {
  german: string;
  english: string;
}

export const getFallbackScenarioPhrases = (title: string): ScenarioPhrase[] => {
  const lower = (title || '').toLowerCase();
  if (lower.includes('café') || lower.includes('food') || lower.includes('restaurant') || lower.includes('ordering')) {
    return [
      { german: 'Ich möchte bitte einen Kaffee und ein Croissant.', english: 'I would like a coffee and a croissant, please.' },
      { german: 'Haben Sie auch Hafermilch?', english: 'Do you also have oat milk?' },
      { german: 'Was können Sie zum Frühstück empfehlen?', english: 'What can you recommend for breakfast?' },
      { german: 'Ich möchte bitte zahlen, bar oder mit Karte?', english: 'I would like to pay, please, cash or card?' },
    ];
  }
  if (lower.includes('direction') || lower.includes('weg') || lower.includes('bahnhof') || lower.includes('street') || lower.includes('asking')) {
    return [
      { german: 'Entschuldigung, wo ist der Hauptbahnhof?', english: 'Excuse me, where is the main train station?' },
      { german: 'Muss ich hier links oder rechts abbiegen?', english: 'Do I need to turn left or right here?' },
      { german: 'Wie weit ist es bis zur nächsten U-Bahn-Station?', english: 'How far is it to the next subway station?' },
      { german: 'Fährt dieser Bus direkt ins Stadtzentrum?', english: 'Does this bus go directly to the city center?' },
    ];
  }
  if (lower.includes('grocer') || lower.includes('einkauf') || lower.includes('supermarkt') || lower.includes('shopping')) {
    return [
      { german: 'Wo finde ich frisches Obst und Gemüse?', english: 'Where can I find fresh fruits and vegetables?' },
      { german: 'Wie viel kostet ein Kilo Äpfel?', english: 'How much does a kilo of apples cost?' },
      { german: 'Haben Sie noch Vollkornbrot da?', english: 'Do you still have whole-grain bread?' },
      { german: 'Ich brauche bitte noch eine Einkaufstasche.', english: 'I need a shopping bag, please.' },
    ];
  }
  if (lower.includes('neighbor') || lower.includes('nachbar') || lower.includes('small talk')) {
    return [
      { german: 'Guten Tag, wie geht es Ihnen heute?', english: 'Hello, how are you doing today?' },
      { german: 'Das Wetter ist heute wirklich schön, nicht wahr?', english: 'The weather is really nice today, isn\'t it?' },
      { german: 'Haben Sie vielleicht ein Paket für mich angenommen?', english: 'Did you perhaps accept a package for me?' },
      { german: 'Ich wünsche Ihnen noch einen schönen Nachmittag!', english: 'I wish you a wonderful afternoon!' },
    ];
  }
  if (lower.includes('doctor') || lower.includes('arzt') || lower.includes('appointment') || lower.includes('termin')) {
    return [
      { german: 'Guten Tag, ich möchte gerne einen Termin vereinbaren.', english: 'Hello, I would like to make an appointment.' },
      { german: 'Haben Sie diese Woche noch etwas frei?', english: 'Do you have any availability left this week?' },
      { german: 'Ich bin gesetzlich versichert bei der TK.', english: 'I am publicly insured with the TK.' },
      { german: 'Ich habe seit drei Tagen starke Halsschmerzen.', english: 'I have had a severe sore throat for three days.' },
    ];
  }
  return [
    { german: 'Guten Tag! Ich freue mich auf das Gespräch.', english: 'Hello! I look forward to our conversation.' },
    { german: 'Könnten Sie mir dazu bitte mehr Informationen geben?', english: 'Could you please give me more information about that?' },
    { german: 'Das verstehe ich gut. Wie gehen wir am besten vor?', english: 'I understand that well. What is the best way to proceed?' },
    { german: 'Vielen Dank für Ihre Hilfe und Unterstützung!', english: 'Thank you very much for your help and support!' },
  ];
};
