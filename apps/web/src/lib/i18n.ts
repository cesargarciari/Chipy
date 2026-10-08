import type { EffectChip } from '@chipy/engine';
import { useLanguage } from '../store/language.js';

interface SampleOption {
  label: string;
  blurb: string;
  effects: EffectChip[];
  /** What the call means, shown after the visitor picks it. Flavour only, never a mechanic. */
  outcome: string;
}

/** Translations for the app UI only. Content from the engine stays in English. */
export interface Dictionary {
  nav: {
    play: string;
    leaderboard: string;
    footer: string;
    languageLabel: string;
    themeLabel: string;
    homeLabel: string;
  };
  home: {
    greeting: string;
    subhead: string;
    startNew: string;
    resume: string;
    keepPlaying: string;
    startYourCareer: string;
    sampleTitle: string;
    sampleLead: string;
    sampleCall: {
      title: string;
      prompt: string;
      options: readonly SampleOption[];
    };
    promises: ReadonlyArray<{ title: string; body: string }>;
    tagline: readonly [string, string];
  };
  createPlayer: {
    title: string;
    lead: string;
    name: string;
    namePlaceholder: string;
    jersey: string;
    bornIn: string;
    shootingHand: string;
    lefty: string;
    righty: string;
    position: string;
    archetypeLabel: (position: string) => string;
    submit: string;
    previewName: string;
  };
  play: {
    lastCall: string;
    overall: string;
    fame: string;
    status: string;
    chemistry: string;
    bank: string;
    salary: string;
    value: string;
    tradeRisk: string;
    contentionWindow: string;
    clubIdolatry: string;
    nationalTeamLabel: (country: string) => string;
    season: (n: number) => string;
    age: (n: number) => string;
    years: (n: number) => string;
    prospect: string;
    phase: {
      offseason: string;
      freeAgency: string;
      midseason: string;
      lockerRoom: string;
      draftNight: string;
      recruiting: string;
      farewell: string;
      contractYear: string;
    };
    ratings: {
      finishing: string;
      midRange: string;
      threePoint: string;
      playmaking: string;
      defense: string;
      rebounding: string;
      basketballIQ: string;
      athleticism: string;
      durability: string;
    };
    gold: string;
    perksShop: {
      ariaLabel: string;
      tooltip: (active: number, bank: string) => string;
      title: string;
      subtitle: string;
      inTheBank: string;
      close: string;
      empty: string;
      owned: string;
      need: (cost: string) => string;
      perYear: string;
      once: string;
    };
  };
  errorBoundary: {
    title: string;
    body: string;
    button: string;
  };
}

const en: Dictionary = {
  nav: {
    play: 'Play',
    leaderboard: 'Leaderboard',
    footer: 'Chipy is a portfolio project. Not affiliated with the NBA.',
    languageLabel: 'Language',
    themeLabel: 'Dark mode',
    homeLabel: 'Chipy home',
  },
  home: {
    greeting: 'Your call.',
    subhead:
      'Build an NBA prospect, get drafted, and steer a whole career from the summer circuit to a jersey in the rafters.',
    startNew: 'Start a new career',
    resume: 'Resume your career',
    keepPlaying: 'Keep playing',
    startYourCareer: 'Start your career',
    sampleTitle: 'Every summer comes down to one call.',
    sampleLead: 'Pick one. The card shows exactly what it costs before you commit.',
    sampleCall: {
      title: 'Two offers, one summer',
      prompt: 'A rebuilding team offers the max. The champs offer a ring and a pay cut.',
      options: [
        {
          label: 'Chase the bag',
          blurb: 'Different city, four more years guaranteed.',
          effects: [
            { key: 'money', label: 'MONEY', short: '$', delta: 96 },
            { key: 'hype', label: 'FAME', short: 'FAME', delta: -3 },
          ],
          outcome: 'Four years guaranteed in a new city. The money is real, and so is the losing.',
        },
        {
          label: 'Chase the ring',
          blurb: 'Half the money, one shot at history.',
          effects: [
            { key: 'money', label: 'MONEY', short: '$', delta: -22 },
            { key: 'basketballIQ', label: 'BASKETBALL IQ', short: 'IQ', delta: 3 },
            { key: 'hype', label: 'FAME', short: 'FAME', delta: 4 },
          ],
          outcome: 'A smaller check and a real shot at June. Some careers turn on exactly this.',
        },
        {
          label: 'Bet on yourself',
          blurb: 'One more prove-it year in the jersey you know.',
          effects: [
            { key: 'finishing', label: 'FINISHING', short: 'FIN', delta: 2 },
            { key: 'hype', label: 'FAME', short: 'FAME', delta: 2 },
          ],
          outcome: 'One more year in the jersey you know, with the whole market watching.',
        },
      ],
    },
    promises: [
      {
        title: 'Build a prospect.',
        body: 'Position, archetype, jersey number, hometown. Thirty archetypes, each with its own shape of career.',
      },
      {
        title: 'Make one call every offseason.',
        body: 'Training, money, the locker room, the cameras. Every option names its exact cost before you commit.',
      },
      {
        title: 'Earn a jersey in the rafters, or a quiet exit.',
        body: 'Most careers plateau and a few become legends. The legacy screen keeps the score.',
      },
    ],
    tagline: ['Every offer has a catch.', 'Every year narrows who you can still become.'],
  },
  createPlayer: {
    title: 'Create your prospect.',
    lead: 'Name them, number them, pick a game. Everything after this is your calls.',
    name: 'Name',
    namePlaceholder: 'e.g. LeGoat',
    jersey: 'Jersey #',
    bornIn: 'Born in',
    shootingHand: 'Shooting hand',
    lefty: 'Lefty',
    righty: 'Righty',
    position: 'Position',
    archetypeLabel: (position) => `Archetype (${position})`,
    submit: 'Enter the summer circuit',
    previewName: 'Your name',
  },
  play: {
    lastCall: 'Last call',
    overall: 'Overall',
    fame: 'Fame',
    status: 'Status',
    chemistry: 'Chemistry',
    bank: 'Bank',
    salary: 'Salary',
    value: 'Value',
    tradeRisk: 'Trade risk',
    contentionWindow: 'Title window',
    clubIdolatry: 'Club idolatry',
    nationalTeamLabel: (country) => `${country} NT`,
    season: (n) => `Season ${n}`,
    age: (n) => `Age ${n}`,
    years: (n) => `${n} ${n === 1 ? 'year' : 'years'}`,
    prospect: 'Prospect',
    phase: {
      offseason: 'Offseason',
      freeAgency: 'Free agency',
      midseason: 'Mid-season',
      lockerRoom: 'Locker room',
      draftNight: 'Draft night',
      recruiting: 'Recruiting',
      farewell: 'The end of the road',
      contractYear: 'Contract year',
    },
    ratings: {
      finishing: 'FINISHING',
      midRange: 'MID-RANGE',
      threePoint: 'THREE-POINT',
      playmaking: 'PLAYMAKING',
      defense: 'DEFENSE',
      rebounding: 'REBOUNDING',
      basketballIQ: 'BASKETBALL IQ',
      athleticism: 'ATHLETICISM',
      durability: 'DURABILITY',
    },
    gold: 'Gold',
    perksShop: {
      ariaLabel: 'Perks shop',
      tooltip: (active, bank) => `Perks shop: ${active} active, ${bank} in the bank`,
      title: 'Perks shop',
      subtitle: 'Spend from the bank. Yearly perks re-bill every offseason.',
      inTheBank: 'In the bank',
      close: 'Close',
      empty: 'Nothing on the shelves yet. Check back next season.',
      owned: 'Owned',
      need: (cost) => `Need ${cost}`,
      perYear: '/yr',
      once: 'once',
    },
  },
  errorBoundary: {
    title: 'Something broke.',
    body: "The app hit an error it couldn't recover from, most likely a saved career from an older version. Starting over will clear it.",
    button: 'Start over',
  },
};

const es: Dictionary = {
  nav: {
    play: 'Jugar',
    leaderboard: 'Clasificación',
    footer: 'Chipy es un proyecto personal. Sin afiliación con la NBA.',
    languageLabel: 'Idioma',
    themeLabel: 'Modo oscuro',
    homeLabel: 'Inicio de Chipy',
  },
  home: {
    greeting: 'Tu decisión.',
    subhead:
      'Crea un prospecto de la NBA, sé drafteado y dirige una carrera completa desde el circuito de verano hasta una camiseta retirada.',
    startNew: 'Comenzar una carrera',
    resume: 'Reanudar tu carrera',
    keepPlaying: 'Seguir jugando',
    startYourCareer: 'Comienza tu carrera',
    sampleTitle: 'Cada verano se reduce a una decisión.',
    sampleLead: 'Elige una. La carta muestra exactamente lo que cuesta antes de decidir.',
    sampleCall: {
      title: 'Dos ofertas, un verano',
      prompt:
        'Un equipo en reconstrucción ofrece el máximo. Los campeones ofrecen un anillo y un recorte salarial.',
      options: [
        {
          label: 'Ir por el dinero',
          blurb: 'Otra ciudad, cuatro años más garantizados.',
          effects: [
            { key: 'money', label: 'DINERO', short: '$', delta: 96 },
            { key: 'hype', label: 'FAMA', short: 'FAMA', delta: -3 },
          ],
          outcome:
            'Cuatro años garantizados en otra ciudad. El dinero es real, y las derrotas también.',
        },
        {
          label: 'Ir por el anillo',
          blurb: 'La mitad del dinero, una sola oportunidad de hacer historia.',
          effects: [
            { key: 'money', label: 'DINERO', short: '$', delta: -22 },
            { key: 'basketballIQ', label: 'IQ DE BALONCESTO', short: 'IQ', delta: 3 },
            { key: 'hype', label: 'FAMA', short: 'FAMA', delta: 4 },
          ],
          outcome:
            'Un cheque más pequeño y una oportunidad real en junio. Algunas carreras cambian justo aquí.',
        },
        {
          label: 'Apostar por ti mismo',
          blurb: 'Un año más para demostrarlo con la camiseta que conoces.',
          effects: [
            { key: 'finishing', label: 'FINALIZACIÓN', short: 'FIN', delta: 2 },
            { key: 'hype', label: 'FAMA', short: 'FAMA', delta: 2 },
          ],
          outcome: 'Un año más con la camiseta que conoces, con todo el mercado mirando.',
        },
      ],
    },
    promises: [
      {
        title: 'Crea un prospecto.',
        body: 'Posición, arquetipo, número, ciudad natal. Treinta arquetipos, cada uno con su propia forma de carrera.',
      },
      {
        title: 'Toma una decisión cada verano.',
        body: 'Entrenamiento, dinero, el vestuario, las cámaras. Cada opción muestra su costo exacto antes de decidir.',
      },
      {
        title: 'Gana una camiseta retirada, o una salida discreta.',
        body: 'La mayoría de las carreras se estancan y unas pocas se vuelven leyenda. La pantalla de legado lleva la cuenta.',
      },
    ],
    tagline: [
      'Cada oferta tiene una trampa.',
      'Cada año reduce en quién todavía puedes convertirte.',
    ],
  },
  createPlayer: {
    title: 'Crea tu prospecto.',
    lead: 'Ponle nombre, número y un estilo de juego. Todo lo demás depende de tus decisiones.',
    name: 'Nombre',
    namePlaceholder: 'ej. LeGoat',
    jersey: 'Número',
    bornIn: 'Nacido en',
    shootingHand: 'Mano hábil',
    lefty: 'Zurdo',
    righty: 'Diestro',
    position: 'Posición',
    archetypeLabel: (position) => `Arquetipo (${position})`,
    submit: 'Entrar al circuito de verano',
    previewName: 'Tu nombre',
  },
  play: {
    lastCall: 'Última decisión',
    overall: 'General',
    fame: 'Fama',
    status: 'Estatus',
    chemistry: 'Química',
    bank: 'Banco',
    salary: 'Salario',
    value: 'Valor',
    tradeRisk: 'Riesgo de traspaso',
    contentionWindow: 'Ventana de título',
    clubIdolatry: 'Idolatría del club',
    nationalTeamLabel: (country) => `Selección de ${country}`,
    season: (n) => `Temporada ${n}`,
    age: (n) => `${n} años`,
    years: (n) => `${n} ${n === 1 ? 'año' : 'años'}`,
    prospect: 'Prospecto',
    phase: {
      offseason: 'Temporada baja',
      freeAgency: 'Agencia libre',
      midseason: 'Mitad de temporada',
      lockerRoom: 'Vestuario',
      draftNight: 'Noche del draft',
      recruiting: 'Reclutamiento',
      farewell: 'El final del camino',
      contractYear: 'Año de contrato',
    },
    ratings: {
      finishing: 'FINALIZACIÓN',
      midRange: 'MEDIA DISTANCIA',
      threePoint: 'TRIPLE',
      playmaking: 'CREACIÓN',
      defense: 'DEFENSA',
      rebounding: 'REBOTE',
      basketballIQ: 'IQ DE BALONCESTO',
      athleticism: 'ATLETISMO',
      durability: 'DURABILIDAD',
    },
    gold: 'Oro',
    perksShop: {
      ariaLabel: 'Tienda de mejoras',
      tooltip: (active, bank) => `Tienda de mejoras: ${active} activas, ${bank} en el banco`,
      title: 'Tienda de mejoras',
      subtitle: 'Gasta desde el banco. Las mejoras anuales se cobran cada temporada baja.',
      inTheBank: 'En el banco',
      close: 'Cerrar',
      empty: 'Todavía no hay nada en la tienda. Vuelve la próxima temporada.',
      owned: 'Adquirida',
      need: (cost) => `Faltan ${cost}`,
      perYear: '/año',
      once: 'pago único',
    },
  },
  errorBoundary: {
    title: 'Algo se rompió.',
    body: 'La app tuvo un error del que no pudo recuperarse, probablemente una carrera guardada de una versión anterior. Empezar de nuevo la borrará.',
    button: 'Empezar de nuevo',
  },
};

const dictionaries = { en, es };

/** Translation lookup for function components. */
export function useT(): Dictionary {
  const lang = useLanguage((s) => s.lang);
  return dictionaries[lang];
}

/** Translation lookup for class components. */
export function getT(): Dictionary {
  return dictionaries[useLanguage.getState().lang];
}
