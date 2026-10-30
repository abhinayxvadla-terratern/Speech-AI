import { InterviewSampleQuestion } from '../lib/database.types';

export const getFallbackInterviewQuestions = (typeName?: string): InterviewSampleQuestion[] => {
  const lower = (typeName || '').toLowerCase();

  if (lower.includes('pflege') || lower.includes('health') || lower.includes('nurse') || lower.includes('arzt') || lower.includes('medical') || lower.includes('hospital')) {
    return [
      {
        german: 'Guten Tag. Bitte stellen Sie sich kurz vor und beschreiben Sie Ihre bisherige klinische oder pflegerische Erfahrung.',
        english: 'Good day. Please introduce yourself briefly and describe your previous clinical or nursing experience.',
        guidance: 'Mention your qualifications, clinical ward experience, and your core motivation in patient care.'
      },
      {
        german: 'Wie reagieren Sie in einem akuten medizinischen Notfall auf der Station?',
        english: 'How do you react during an acute medical emergency on the ward?',
        guidance: 'Explain emergency protocol, vital sign checks, calling the doctor, and clear team communication.'
      },
      {
        german: 'Wie gehen Sie mit besorgten oder ungeduldigen Angehörigen von Patienten um?',
        english: 'How do you deal with anxious or impatient relatives of patients?',
        guidance: 'Demonstrate empathy, active listening, calm explanations, and respectful German professional register.'
      },
      {
        german: 'Warum haben Sie sich entschieden, im deutschen Gesundheitssystem zu arbeiten?',
        english: 'Why did you decide to work in the German healthcare system?',
        guidance: 'Highlight modern standards, professional growth opportunities, and your commitment to long-term integration.'
      }
    ];
  }

  if (lower.includes('tech') || lower.includes('software') || lower.includes('engineer') || lower.includes('it') || lower.includes('developer')) {
    return [
      {
        german: 'Bitte stellen Sie sich kurz vor und erläutern Sie Ihren technischen Werdegang.',
        english: 'Please introduce yourself briefly and explain your technical career journey.',
        guidance: 'Summarize your core technologies, key projects, and your role within technical teams.'
      },
      {
        german: 'Können Sie ein anspruchsvolles technisches Problem beschreiben, das Sie gelöst haben?',
        english: 'Can you describe a challenging technical problem that you solved?',
        guidance: 'Use the STAR structure (Situation, Task, Action, Result) to explain the solution clearly in German.'
      },
      {
        german: 'Wie arbeiten Sie in agilen Teams und wie gehen Sie mit Code-Reviews oder Feedback um?',
        english: 'How do you work in agile teams and how do you handle code reviews or feedback?',
        guidance: 'Emphasize constructive collaboration, clear documentation, and continuous improvement.'
      },
      {
        german: 'Warum möchten Sie bei unserem Unternehmen in Deutschland arbeiten?',
        english: 'Why would you like to work at our company in Germany?',
        guidance: 'Connect your technical ambitions to the company’s product, engineering quality, and German innovation.'
      }
    ];
  }

  // Standard Workplace / General Job Interview Fallback
  return [
    {
      german: 'Können Sie sich bitte kurz vorstellen und Ihren beruflichen Werdegang zusammenfassen?',
      english: 'Could you please introduce yourself briefly and summarize your professional background?',
      guidance: 'Introduce yourself confidently, stating your key education, recent roles, and strengths.'
    },
    {
      german: 'Warum bewerben Sie sich gerade für diese Stelle in unserem Unternehmen?',
      english: 'Why are you applying for this position at our company?',
      guidance: 'Demonstrate that you researched the company and explain why your skills make you the ideal fit.'
    },
    {
      german: 'Was sind Ihre größten Stärken und wo sehen Sie noch Entwicklungsbedarf?',
      english: 'What are your greatest strengths and where do you see room for further development?',
      guidance: 'Give two concrete workplace strengths with examples, and one positive area you are actively developing.'
    },
    {
      german: 'Wie gehen Sie mit stressigen Situationen oder engen Deadlines um?',
      english: 'How do you manage stressful situations or tight deadlines?',
      guidance: 'Show calm prioritization, team communication, and systematic problem-solving.'
    }
  ];
};
