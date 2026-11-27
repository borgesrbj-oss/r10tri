import type { WorkoutStructure } from './training-types';

const licenses = {
  'CC BY 3.0': 'https://creativecommons.org/licenses/by/3.0/',
  'CC BY-SA 4.0': 'https://creativecommons.org/licenses/by-sa/4.0/',
} as const;

export interface SwimMediaReference {
  id: string;
  title: string;
  topic: 'crawlAlignment' | 'flipTurn' | 'sprintCrawl';
  fileTitle: string;
  pageUrl: string;
  mediaUrl: string;
  credit: string;
  license: keyof typeof licenses;
  observation: string;
}

/** Data da conferência HTTP, de autoria/licença e dos quadros dos vídeos abaixo. */
export const SWIM_MEDIA_CHECKED_ON = '2026-11-27';

export const SWIM_MEDIA: readonly SwimMediaReference[] = [
  {
    id: "crawl-por-cima",
    title: "Crawl visto de cima",
    topic: "crawlAlignment",
    fileTitle: "Front Crawl Above Water.webm",
    pageUrl: "https://commons.wikimedia.org/wiki/File:Front_Crawl_Above_Water.webm",
    mediaUrl: "https://upload.wikimedia.org/wikipedia/commons/2/29/Front_Crawl_Above_Water.webm",
    credit: "It is a wonderful world",
    license: "CC BY-SA 4.0",
    observation: "Observe a rotação do tronco e a saída do braço da água, com a cabeça voltada para a linha da raia entre as respirações."
  },
  {
    id: "crawl-vista-lateral",
    title: "Crawl visto de lado, sob a água",
    topic: "crawlAlignment",
    fileTitle: "Front Crawl Underwater.webm",
    pageUrl: "https://commons.wikimedia.org/wiki/File:Front_Crawl_Underwater.webm",
    mediaUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9b/Front_Crawl_Underwater.webm",
    credit: "It is a wonderful world",
    license: "CC BY-SA 4.0",
    observation: "Compare a posição da cabeça, a extensão à frente e a alternância dos braços durante a braçada."
  },
  {
    id: "crawl-ceci",
    title: "Braçada de crawl em vista subaquática — Ceci",
    topic: "crawlAlignment",
    fileTitle: "Mary's Swim Boot Camp - Ceci's underwater freestyle video.webm",
    pageUrl: "https://commons.wikimedia.org/wiki/File:Mary%27s_Swim_Boot_Camp_-_Ceci%27s_underwater_freestyle_video.webm",
    mediaUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Mary%27s_Swim_Boot_Camp_-_Ceci%27s_underwater_freestyle_video.webm",
    credit: "koolkatkari",
    license: "CC BY 3.0",
    observation: "Observe a chegada ao campo da câmera e a extensão de um braço à frente enquanto o outro inicia a recuperação."
  },
  {
    id: "crawl-debbie",
    title: "Alinhamento no crawl — Debbie",
    topic: "crawlAlignment",
    fileTitle: "Mary's Swim Boot Camp - Debbie's underwater freestyle.webm",
    pageUrl: "https://commons.wikimedia.org/wiki/File:Mary%27s_Swim_Boot_Camp_-_Debbie%27s_underwater_freestyle.webm",
    mediaUrl: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Mary%27s_Swim_Boot_Camp_-_Debbie%27s_underwater_freestyle.webm",
    credit: "koolkatkari",
    license: "CC BY 3.0",
    observation: "Observe a passagem sob a câmera e o alinhamento do tronco em relação à raia."
  },
  {
    id: "virada-kari",
    title: "Virada de crawl — Kari",
    topic: "flipTurn",
    fileTitle: "Mary's Swim Boot Camp - Kari's flip turn.webm",
    pageUrl: "https://commons.wikimedia.org/wiki/File:Mary%27s_Swim_Boot_Camp_-_Kari%27s_flip_turn.webm",
    mediaUrl: "https://upload.wikimedia.org/wikipedia/commons/1/10/Mary%27s_Swim_Boot_Camp_-_Kari%27s_flip_turn.webm",
    credit: "koolkatkari",
    license: "CC BY 3.0",
    observation: "Observe a aproximação da parede, a rotação do corpo e a extensão após a virada."
  },
  {
    id: "crawl-kari",
    title: "Crawl em aproximação frontal — Kari",
    topic: "crawlAlignment",
    fileTitle: "Mary's Swim Boot Camp - Kari's underwater freestyle.webm",
    pageUrl: "https://commons.wikimedia.org/wiki/File:Mary%27s_Swim_Boot_Camp_-_Kari%27s_underwater_freestyle.webm",
    mediaUrl: "https://upload.wikimedia.org/wikipedia/commons/e/ed/Mary%27s_Swim_Boot_Camp_-_Kari%27s_underwater_freestyle.webm",
    credit: "koolkatkari",
    license: "CC BY 3.0",
    observation: "Observe a aproximação na raia e a alternância de braços e pernas na passagem subaquática."
  },
  {
    id: "virada-kirsten",
    title: "Saída de virada de crawl — Kirsten",
    topic: "flipTurn",
    fileTitle: "Mary's Swim Boot Camp - Kirsten's awesome flip turn.webm",
    pageUrl: "https://commons.wikimedia.org/wiki/File:Mary%27s_Swim_Boot_Camp_-_Kirsten%27s_awesome_flip_turn.webm",
    mediaUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b0/Mary%27s_Swim_Boot_Camp_-_Kirsten%27s_awesome_flip_turn.webm",
    credit: "koolkatkari",
    license: "CC BY 3.0",
    observation: "Observe a posição dos pés na parede e os braços estendidos na saída."
  },
  {
    id: "crawl-mary",
    title: "Crawl em sequência subaquática — Mary",
    topic: "crawlAlignment",
    fileTitle: "Mary's Swim Boot Camp - Mary's textbook-style freestyle; underwater view.webm",
    pageUrl: "https://commons.wikimedia.org/wiki/File:Mary%27s_Swim_Boot_Camp_-_Mary%27s_textbook-style_freestyle;_underwater_view.webm",
    mediaUrl: "https://upload.wikimedia.org/wikipedia/commons/6/6c/Mary%27s_Swim_Boot_Camp_-_Mary%27s_textbook-style_freestyle%3B_underwater_view.webm",
    credit: "koolkatkari",
    license: "CC BY 3.0",
    observation: "Observe a passagem da nadadora pela raia e a continuidade da alternância de braços durante a aproximação."
  },
  {
    id: "virada-mary",
    title: "Virada de crawl vista de lado — Mary",
    topic: "flipTurn",
    fileTitle: "Mary's Swim Boot Camp -Mary's flip turn (nice).webm",
    pageUrl: "https://commons.wikimedia.org/wiki/File:Mary%27s_Swim_Boot_Camp_-Mary%27s_flip_turn_(nice).webm",
    mediaUrl: "https://upload.wikimedia.org/wikipedia/commons/c/cd/Mary%27s_Swim_Boot_Camp_-Mary%27s_flip_turn_%28nice%29.webm",
    credit: "koolkatkari",
    license: "CC BY 3.0",
    observation: "Observe o agrupamento do corpo junto à parede e o alinhamento após o impulso."
  },
  {
    id: "crawl-sprint",
    title: "Crawl rápido visto de lado",
    topic: "sprintCrawl",
    fileTitle: "Sprint Front Crawl Underwater.webm",
    pageUrl: "https://commons.wikimedia.org/wiki/File:Sprint_Front_Crawl_Underwater.webm",
    mediaUrl: "https://upload.wikimedia.org/wikipedia/commons/c/c7/Sprint_Front_Crawl_Underwater.webm",
    credit: "It is a wonderful world",
    license: "CC BY-SA 4.0",
    observation: "Observe como a alternância dos braços e a pernada aparecem em um trecho de sprint."
  }
];

export function swimMediaLicenseUrl(reference: SwimMediaReference): string {
  return licenses[reference.license];
}

export function swimMediaForWorkout(structure: WorkoutStructure): readonly SwimMediaReference[] {
  if (structure.modality !== 'natacao') return [];
  const legacyAlignment = structure.steps.some(step => step.kind === 'principal' && step.label.includes('respiração e alinhamento'));
  if (structure.swimTechnique !== 'crawlAlignment' && !legacyAlignment) return [];
  return SWIM_MEDIA.filter(reference => reference.topic === 'crawlAlignment').slice(0, 2);
}
