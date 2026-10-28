export interface CaseStudyListItem {
  text: string;
  subItems?: string[];
  images?: {
    src: string;
    maxWidth?: string;
    caption?: string;
  }[];
}

export type CaseStudyBlock =
  | {
      type: 'paragraph';
      text: string;
    }
  | {
      type: 'heading';
      level: 'h4' | 'h5' | 'h6';
      text: string;
    }
  | {
      type: 'callout';
      title?: string;
      items: string[];
    }
  | {
      type: 'list';
      ordered?: boolean;
      items: CaseStudyListItem[];
    }
  | {
      type: 'image';
      src: string;
      alt?: string;
      maxWidth?: string;
      caption?: string;
    }
  | {
      type: 'image-grid';
      columns?: 2 | 3;
      images: {
        src: string;
        alt?: string;
        caption?: string;
      }[];
    };

export interface CaseStudySectionData {
  id: string;
  title: string;
  blocks: CaseStudyBlock[];
}

export interface ReferenceCaseStudy {
  id: string;
  stopId: string;
  title: string;
  client: string;
  year: string;
  projectType: string;
  role: string;
  category: string;
  description: string;
  heroImage: string;
  galleryImages: string[];
  externalUrl?: string;
  prototypeUrl?: string;
  externalLabel: string;
  impactMetrics: { label: string; value: string }[];
  tags: string[];
  accentColor: string;
  sections: CaseStudySectionData[];
}

export const REFERENCE_CASE_STUDIES: Record<string, ReferenceCaseStudy> = {
  'cfos-ai-workspace': {
    id: 'cfos-ai-workspace',
    stopId: 'mandapa-origin',
    title: "Designing an AI workspace for the CFO and CFO's office",
    client: 'Hyperbots Inc.',
    year: '2025',
    projectType: 'B2C',
    role: 'Lead Product Designer',
    category: 'AI & Workflows',
    description:
      'Vera is an AI-powered intelligent workspace designed to transform how finance leaders manage their daily tasks, acting as an intelligent finance-specific companion for daily emails, calendar, external signals, and financial document assistance.',
    heroImage: 'https://framerusercontent.com/images/LveWVoRgDEr92TiQFiwkHIO0s.png',
    galleryImages: [
      'https://framerusercontent.com/images/cZEeBCNSv09Ra4nqsOuaYHuWeFc.png',
      'https://framerusercontent.com/images/4Mxhgt93lXYu8UIjgzQLmqIVU.png',
      'https://framerusercontent.com/images/7wWPjquU62Q0qC7DDdatTeYaPcM.png',
      'https://framerusercontent.com/images/UlMYZl8bRiBITGUvcAPtKU9v4.png',
      'https://framerusercontent.com/images/gyYGO6lPXUbG34nbvtEHIxwa2w.png',
      'https://framerusercontent.com/images/gDNY0pEescASuy0hzhuHOydwWI.png',
      'https://framerusercontent.com/images/Bjum2CUaQrc9FqknaMyPDNcw0.png',
      'https://framerusercontent.com/images/lBte7lwDaImBX7KJDQLTcD0e424.png',
      'https://framerusercontent.com/images/jofXV2Var70vGu2LDOwvufwXTzA.png',
      'https://framerusercontent.com/images/7JY1j1YYL5q5lfetczqY1F9j6Ls.png',
      'https://framerusercontent.com/images/UlVhVKz9e3Is12zobEvRY8xWtA.png',
      'https://framerusercontent.com/images/uKRmt02dEgaviQOo0z3DeOz4Cs.png',
    ],
    externalUrl: 'https://vera-signup.hyperbots.com/',
    externalLabel: 'HyperLM Vera',
    impactMetrics: [
      { label: 'FATE NYC Booth Signups', value: '90%+' },
      { label: 'Data Sources Unified', value: '15+ Tools' },
      { label: 'Product Launch', value: 'Jan 2026' },
    ],
    tags: [
      'AI Workspace',
      'CFO Co-Pilot',
      'Enterprise FinTech',
      'Conversational AI',
      'FATE NYC 2025',
    ],
    accentColor: '#f59e0b',
    sections: [
      {
        id: 'background',
        title: 'Background',
        blocks: [
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/cZEeBCNSv09Ra4nqsOuaYHuWeFc.png',
            alt: 'HyperLM Vera Brand Mark',
            maxWidth: '180px',
          },
          {
            type: 'paragraph',
            text: 'Vera is an AI-powered intelligent workspace designed to transform how finance leaders manage their daily tasks. Vera acts like an intelligent finance specific companion helping with what the user does everyday (including emails and calendar), news and external signals, and finance document assistance. Users can analyze data, forecast scenarios, and generate real-time reports - all through simple, conversational prompts. Vera helps you move from manual reporting to AI-assisted insight.',
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/4Mxhgt93lXYu8UIjgzQLmqIVU.png',
            alt: 'Vera Overview Screen',
          },
        ],
      },
      {
        id: 'core-problem',
        title: 'Core problem',
        blocks: [
          {
            type: 'paragraph',
            text: 'Current finance CFO faces these primary challenges common to them:',
          },
          {
            type: 'list',
            items: [
              {
                text: 'Information Fragmentation: Financial data scattered across 15+ tools on average. Bringing in information from all the sources starting with documents, which can be further used for Q&A and insights',
              },
              {
                text: 'Relying on different people within the organisation for data and information for upcoming key tasks',
              },
              {
                text: 'Prompt Email reply and to ensure that they do not miss replying to the emails received. One of the screen always open is an email screen',
              },
              {
                text: 'Keeping up to date with financial news and external events that affect their business and taking up key decisions on the same',
              },
            ],
          },
          {
            type: 'callout',
            title: 'Market Opportunity',
            items: [
              'Market Size: $12B+ finance automation market growing at 23% CAGR',
              'Target Addressable Market: 50,000+ mid-market companies with dedicated finance teams',
            ],
          },
          {
            type: 'heading',
            level: 'h5',
            text: 'Product vision & Strategy',
          },
          {
            type: 'paragraph',
            text: 'Vision: Become the central nervous system for finance leaders, enabling data-driven decision making at the speed of business.',
          },
          {
            type: 'list',
            items: [
              { text: 'Finance & accounting intelligence' },
              {
                text: 'Context Intelligence - internal and external: Surface relevant insights when and where decisions are made',
              },
            ],
          },
        ],
      },
      {
        id: 'approach-process',
        title: 'Approach & Process',
        blocks: [
          {
            type: 'paragraph',
            text: 'Making a new AI tool for a very niche user base was challenging. 2025 was the year where there was a release of multiple AI tools and agents so designing a workspace which was unique and distinct was a big problem to overcome. Before jumping into the brief given by the AI/ML team, I had to use a bunch of other AI tools available which acted as a workspace for the users. This included tools like Notion, Genspark, Grok, Perplexity, ChatGPT etc, just to get a gist of what I had to work around with and how the information could be laid out for the user (exemplar screens used for primary study shown below).',
          },
          {
            type: 'image-grid',
            columns: 2,
            images: [
              {
                src: 'https://framerusercontent.com/images/7wWPjquU62Q0qC7DDdatTeYaPcM.png',
                alt: 'Exemplar Workspace Study 1',
              },
              {
                src: 'https://framerusercontent.com/images/UlMYZl8bRiBITGUvcAPtKU9v4.png',
                alt: 'Exemplar Workspace Study 2',
              },
            ],
          },
          {
            type: 'heading',
            level: 'h5',
            text: 'Aim',
          },
          {
            type: 'paragraph',
            text: "A 'digital twin' of sorts who acts the same way as the user except proceeding forward with decisions (human-in-loop). Not just a note taker and task management application SaaS.",
          },
          {
            type: 'heading',
            level: 'h5',
            text: 'Design and Development',
          },
          {
            type: 'paragraph',
            text: 'We focused on building an interface that delivered both functionality with a sleek, minimalistic look. Since the target group is finance based, focus was bringing out numbers and statistics which make the necessary argument of moving forward with any kind of financial document. After talking with the CFO partners (partnered with the organization as consultants), following decisions were taken while designing:',
          },
          {
            type: 'list',
            items: [
              {
                text: 'Streamlined Navigation: We structured the navigation to allow users to easily access product features. The elements of the navigation were decided upon discussing what would make their daily work efficient.',
              },
              {
                text: 'Visual Hierarchy: By introducing a clear typography system, we ensured that complex data was presented in a digestible manner.',
              },
              {
                text: "Consistent Brand Aesthetic: We integrated Hyperbots' branding into the design, using a cohesive color palette, brand icons and a new logo to show the complexity and thinking of HyperLM.",
              },
            ],
          },
          {
            type: 'heading',
            level: 'h5',
            text: 'User Personas and their pain points',
          },
          {
            type: 'list',
            items: [
              {
                text: 'Primary Persona: Chief Financial Officer',
                subItems: [
                  'Spending half of time on operational tasks vs. strategic planning',
                  'Delayed decision-making due to information gathering overhead (mentioned by CFOs as well in expert calls)',
                  'Risk of errors in manual processes affecting compliance',
                  'Updates on tasks for today as well as emails',
                  'Prompt response to emails that come in',
                  'Templatised reporting and report creation',
                  'Cash flow forecasting',
                ],
              },
              {
                text: 'Secondary Personas: VP Finance, Finance Director, etc.',
                subItems: [
                  'Operational efficiency focus, process optimization, team coordination, workflow management',
                ],
              },
            ],
          },
          {
            type: 'heading',
            level: 'h5',
            text: 'Visual Direction',
          },
          {
            type: 'list',
            items: [
              {
                text: 'After talking with the CFO partners, the following tools were revealed as most used by them and their team, so the visual experience needed to be familiar:',
                subItems: [
                  'Google Workspace (Gmail, Sheets, Slides, Docs and Calendar)',
                  'Notion',
                  'ChatGPT / Perplexity (about 80% of them use ChatGPT and the rest 20% use Perplexity because of document parsing and research mode)',
                  'LinkedIn (For community, financial news, etc.)',
                  'ERP tools (SAP, Oracle NetSuite, etc.)',
                ],
              },
              {
                text: 'Not straying away from the design system of Hyperbots Inc. The elements were not vastly different from the design system set up for the procure-to-pay tools, which proved the reusability of the design system to be powerful and efficient. Instead, a lighter variant of the Hyperbots blue was introduced for differentiating between the two product offerings from the organization.',
              },
              {
                text: 'A clean layout which is easier to use.',
              },
            ],
          },
          {
            type: 'heading',
            level: 'h5',
            text: 'User flow',
          },
          {
            type: 'paragraph',
            text: 'Since it was going to be a conversation based tool, the architecture was to be made very simple and not complex. The user flow is pretty simple: User logs into Vera → Onboarding of the user with few questions regarding their role → Connecting Google/Microsoft suite → Landing page where the user can directly converse with the assistant.',
          },
          {
            type: 'heading',
            level: 'h5',
            text: 'Key Features',
          },
          {
            type: 'list',
            items: [
              {
                text: 'Finance Q&A — ask anything to the chatbot and an answer is generated in the context of F&A tasks; non-F&A queries are gracefully declined.',
              },
              { text: 'Financial Document Assistance Q&A' },
              { text: 'Email Assistance' },
              { text: 'Calendar Assistance' },
              { text: 'News and External Intelligence' },
              {
                text: 'Tasks for Today Section based on documents available, external news, email insights and calendar data',
              },
            ],
          },
          {
            type: 'heading',
            level: 'h5',
            text: 'Initial ideas',
          },
          {
            type: 'paragraph',
            text: 'The following pictures show the initial ideas which were ideated upon. These were scrapped because few were not sitting right with our partners while others had a lot of cognitive load.',
          },
          {
            type: 'image-grid',
            columns: 3,
            images: [
              {
                src: 'https://framerusercontent.com/images/gyYGO6lPXUbG34nbvtEHIxwa2w.png',
                alt: 'Initial Idea Exploration 1',
              },
              {
                src: 'https://framerusercontent.com/images/gDNY0pEescASuy0hzhuHOydwWI.png',
                alt: 'Initial Idea Exploration 2',
              },
              {
                src: 'https://framerusercontent.com/images/Bjum2CUaQrc9FqknaMyPDNcw0.png',
                alt: 'Initial Idea Exploration 3',
              },
            ],
          },
          {
            type: 'heading',
            level: 'h5',
            text: 'Screens / Key Views',
          },
          {
            type: 'paragraph',
            text: 'Following few pictures depict the various uses of Vera. For Beta launch, Document ingestion, Conversational AI and Email read were made.',
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/lBte7lwDaImBX7KJDQLTcD0e424.png',
            alt: 'Vera Key Screen 1',
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/jofXV2Var70vGu2LDOwvufwXTzA.png',
            alt: 'Vera Key Screen 2',
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/7JY1j1YYL5q5lfetczqY1F9j6Ls.png',
            alt: 'Vera Key Screen 3',
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/UlVhVKz9e3Is12zobEvRY8xWtA.png',
            alt: 'Vera Key Screen 4',
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/uKRmt02dEgaviQOo0z3DeOz4Cs.png',
            alt: 'Vera Key Screen 5',
          },
        ],
      },
      {
        id: 'results-impact',
        title: 'Results and Impact',
        blocks: [
          {
            type: 'paragraph',
            text: "Vera was first shown to the primary users at an Event held in NYC in October 2025; FATE (Finance and Accounting Technology Expo), an event where FinTech orgs all around the world showcase their services and products. Vera received a very nice response with over 90% of people who came to Hyperbots' booth signing up for the Beta launch use. Vera, powered by HyperLM, was then launched as a separate product in the early weeks of January 2026.",
          },
        ],
      },
    ],
  },

  'nexatech-bridge': {
    id: 'nexatech-bridge',
    stopId: 'jantar-observatory',
    title: 'Building a super handoff tool to increase productivity and deployment times',
    client: 'SourceCode Tech',
    year: '2025',
    projectType: 'B2B',
    role: 'Product Designer & Prototyper',
    category: '0→1 Product',
    description:
      'Bridge is an internal collaboration tool built in a 24-hour sprint to streamline design-to-development handoffs across agile PODs, eliminating forgotten Slack handoffs and accelerating deployment velocity.',
    heroImage: 'https://framerusercontent.com/images/brzrNcMQOjpdEAlsFwJXcDNkeY.png',
    galleryImages: [
      'https://framerusercontent.com/images/12LHfSksRkkbksO2R1JhDcNlxg.png',
      'https://framerusercontent.com/images/SOPwJ4NeDASXOmQwtM8D1BTt1K8.png',
      'https://framerusercontent.com/images/ElVl7BZl9HiQM4YP3JVYIdys.png',
      'https://framerusercontent.com/images/q6wsmM2Pjdtj0Eg6ldMYS5VK0.png',
      'https://framerusercontent.com/images/DxACXiVGzfe6TGeiacVOdG6NDY.png',
      'https://framerusercontent.com/images/hdo6pzJe7cojjItKtCpQcNtbCc.png',
    ],
    prototypeUrl: 'https://dot-flip-62258982.figma.site/',
    externalLabel: 'dot-flip-62258982.figma.site',
    impactMetrics: [
      { label: 'Sprint Duration', value: '24-Hr MVP' },
      { label: 'Friday Townhall Time', value: 'Saved' },
      { label: 'POD Handoff Tracking', value: '100% Clear' },
    ],
    tags: [
      'Internal Tooling',
      'POD Architecture',
      'Productivity',
      'Figma Prototype',
      'Dev Handoff',
    ],
    accentColor: '#f97316',
    sections: [
      {
        id: 'background',
        title: 'Background',
        blocks: [
          {
            type: 'paragraph',
            text: 'SourceCode Tech is a small team which focuses on building internal tools & products that benefit organizations by increasing their productivity and making workflows more efficient within the teams.',
          },
          {
            type: 'paragraph',
            text: '(The project link present on this page is a prototype which shows how the product experience is.)',
          },
        ],
      },
      {
        id: 'core-problem',
        title: 'Core problem',
        blocks: [
          {
            type: 'paragraph',
            text: 'Handing off documents/designs on Slack chat which gets forgotten when employee’s bandwidth is already on the brim.',
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/12LHfSksRkkbksO2R1JhDcNlxg.png',
            alt: 'Slack Handoff Problem Flow',
          },
        ],
      },
      {
        id: 'approach-process',
        title: 'Approach & Process',
        blocks: [
          {
            type: 'paragraph',
            text: "Research and Discovery: This was made in a 24 hr sprint where the team identified the problem and decided to work on the solution making a product where handoff is much easier and deployment times are much faster. Hyperbots Inc. was chosen as an example where the teams function in PODs. PODs are groups containing engineers and developers working on a product or feature requests from the client. Because the organization was fast paced, the amount of handoffs in a day were 'n'. This led to the team making Bridge, a super-handoff tool, which allowed managers to create PODs and assign team members to it.",
          },
          {
            type: 'heading',
            level: 'h4',
            text: 'Design and Development',
          },
          {
            type: 'paragraph',
            text: 'We focused on building an interface that delivered both functionality and a sleek, modern look.',
          },
          {
            type: 'list',
            items: [
              {
                text: 'Streamlined Navigation: We restructured the navigation to allow users to easily access product features and case studies.',
              },
              {
                text: 'Visual Hierarchy: By introducing a clear typography system, we ensured that complex data was presented in a digestible manner.',
              },
              {
                text: 'Responsive Design: A desktop-first approach was implemented, ensuring seamless user experience across all devices.',
              },
            ],
          },
          {
            type: 'heading',
            level: 'h4',
            text: 'Key Features',
          },
          {
            type: 'list',
            items: [
              { text: 'One place where all the PODs can be created' },
              { text: 'The manager/owner can create PODs and assign employees to it' },
              {
                text: 'Faster handoffs, even faster deployment as the employee gets a set amount of time to finish it',
              },
              {
                text: 'Slack notification to the next person in line as soon as the task is handed off',
              },
              { text: 'Task tracking if the POD is on time or overdue' },
              { text: 'Make a workflow according to you' },
              {
                text: 'An employee can allocate their work to anyone if they are on a leave or something',
              },
            ],
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/SOPwJ4NeDASXOmQwtM8D1BTt1K8.png',
            alt: 'Bridge Screen 1',
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/ElVl7BZl9HiQM4YP3JVYIdys.png',
            alt: 'Bridge Screen 2',
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/q6wsmM2Pjdtj0Eg6ldMYS5VK0.png',
            alt: 'Bridge Screen 3',
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/DxACXiVGzfe6TGeiacVOdG6NDY.png',
            alt: 'Bridge Screen 4',
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/hdo6pzJe7cojjItKtCpQcNtbCc.png',
            alt: 'Bridge Screen 5',
          },
        ],
      },
      {
        id: 'results-impact',
        title: 'Results and Impact',
        blocks: [
          {
            type: 'paragraph',
            text: 'After deploying this internal tool, handoffs were much clearer and the POD-wise updates which took more time every Friday during a townhall were streamlined. The saved up time was used for wellness or finishing extra work, allowing employees to think of more ideas for the product.',
          },
        ],
      },
    ],
  },

  'oasis-arcade': {
    id: 'oasis-arcade',
    stopId: 'oasis-pavilion',
    title: 'Oasis - Gaming arcade',
    client: 'Self initiated',
    year: '2025',
    projectType: 'B2C',
    role: 'Creator & Interaction Designer',
    category: '0→1 Product',
    description:
      'An experimental arcade-type game that served as a testing ground for AI-integrated design-to-development workflows, combining a complete Figma retro style guide, AI prompt engineering, and a Supabase backend.',
    heroImage: 'https://framerusercontent.com/images/RCkj2HpxS3EudicGuMH1mQoWFXY.png',
    galleryImages: [
      'https://framerusercontent.com/images/XzpJdRoUXzTvi54LFcKBkzSHw.png',
      'https://framerusercontent.com/images/KLXym6YrG2KhKJk4XaIObFYA8ew.png',
      'https://framerusercontent.com/images/aAJ0jZD4Oi8rUQIUgY2ElE0flCc.png',
      'https://framerusercontent.com/images/A9YNT46IOhQgk6oiol8XOThhZCE.png',
      'https://framerusercontent.com/images/hRjjC0tgUjaHQJnoQDPiyHsPto.png',
      'https://framerusercontent.com/images/56hy9Nk8ZNe16S6iLnpdwZ14T0.png',
      'https://framerusercontent.com/images/0dygunnR8J7x1ElH4EcnwMBsB8.png',
      'https://framerusercontent.com/images/JzD1pKpff157xtAZKrXworSjXq8.png',
      'https://framerusercontent.com/images/gOkefE8m2YbLTGdnHT3Z7TFjO0.png',
      'https://framerusercontent.com/images/46BRSOmh8gDNQ6xZnacfboF2Cv8.png',
      'https://framerusercontent.com/images/TZr2OcxCzWlBj6G69adaWE3RUI.png',
      'https://framerusercontent.com/images/xjCIQrje5PHEQHdNlJDyDqzNc.png',
      'https://framerusercontent.com/images/e43IwMjMIP1H9CM2HasaFloWmdo.png',
      'https://framerusercontent.com/images/tp22d3KXcKtUPA1RCWYEJShilOM.png',
      'https://framerusercontent.com/images/yPfZJ3iE9tTsZTHCcIMs26Fblc.png',
      'https://framerusercontent.com/images/i8h9P4B7Q6ATPsyluAyKDQlzbEs.png',
      'https://framerusercontent.com/images/FbtWt36MZY0YGgWwBheHmy7Olg.png',
    ],
    prototypeUrl: 'https://oasisgames.figma.site/',
    externalLabel: 'oasisgames.figma.site',
    impactMetrics: [
      { label: 'Week 1 Players', value: '100+ Active' },
      { label: 'Zen Stack Boost', value: '+10 Mins' },
      { label: 'Architecture', value: 'Figma + AI + Supabase' },
    ],
    tags: ['Retro Arcade', 'AI Code Generation', 'Game Design', 'Supabase', 'Figma Make'],
    accentColor: '#10b981',
    sections: [
      {
        id: 'background',
        title: 'Background',
        blocks: [
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/XzpJdRoUXzTvi54LFcKBkzSHw.png',
            alt: 'Oasis Logo',
            maxWidth: '240px',
          },
          {
            type: 'paragraph',
            text: 'During the exploration phase of AI capabilities and workflow automation, there was a need to bridge the gap between traditional design processes and AI-assisted development. The challenge was to create a complete, playable arcade game while discovering and refining AI-enhanced design-to-development workflows that could be applied to future projects.',
          },
          {
            type: 'paragraph',
            text: 'I developed Oasis as an experimental arcade-type game that served as a testing ground for AI-integrated design workflows. The project began with comprehensive design work in Figma, where all main game elements, visual assets, and a complete design style guide were meticulously crafted. These design specifications were then strategically fed into AI systems to generate game code and bring the interactive elements to life. This hybrid approach allowed for rapid iteration between design and development, with AI handling much of the technical implementation while maintaining design fidelity. The workflow enabled quick prototyping of game mechanics, visual effects, and user interactions, significantly accelerating the development process from concept to playable game.',
          },
        ],
      },
      {
        id: 'core-problem',
        title: 'Core problem',
        blocks: [
          {
            type: 'paragraph',
            text: 'While on a break at work, I was completely reminded of my handheld MITASHI console or the cheap knockoffs you get in the local bazaar which used to have pixel type arcade games. I wanted to recreate that feeling of nostalgia that we used to have when we played these games and made our high scores.',
          },
        ],
      },
      {
        id: 'process',
        title: 'Process',
        blocks: [
          {
            type: 'paragraph',
            text: 'Aim: OASIS — Just like a place in desert where water is available; similarly a place where I can take a break from work and relax for a bit (before the design sprint haunts me).',
          },
          {
            type: 'heading',
            level: 'h5',
            text: 'Moodboard',
          },
          {
            type: 'paragraph',
            text: 'Collected ideas from existing games across the world to establish the visual mood and aesthetic direction for the arcade experience.',
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/KLXym6YrG2KhKJk4XaIObFYA8ew.png',
            alt: 'Oasis Moodboard',
          },
          {
            type: 'heading',
            level: 'h5',
            text: 'Low fidelity design',
          },
          {
            type: 'paragraph',
            text: 'Decided on the visual language for the games and arcade experience, creating quick sketches and converting them into low fidelity wireframes.',
          },
          {
            type: 'image-grid',
            columns: 3,
            images: [
              {
                src: 'https://framerusercontent.com/images/aAJ0jZD4Oi8rUQIUgY2ElE0flCc.png',
                alt: 'Low Fidelity Wireframe 1',
              },
              {
                src: 'https://framerusercontent.com/images/A9YNT46IOhQgk6oiol8XOThhZCE.png',
                alt: 'Low Fidelity Wireframe 2',
              },
              {
                src: 'https://framerusercontent.com/images/hRjjC0tgUjaHQJnoQDPiyHsPto.png',
                alt: 'Low Fidelity Wireframe 3',
              },
            ],
          },
          {
            type: 'heading',
            level: 'h5',
            text: 'Style Guide creation',
          },
          {
            type: 'paragraph',
            text: "Made a quick color palette and typography to build a comprehensive style guide that would define the arcade's visual identity. Very similar to retro gaming arcade and consoles.",
          },
          {
            type: 'image-grid',
            columns: 2,
            images: [
              {
                src: 'https://framerusercontent.com/images/56hy9Nk8ZNe16S6iLnpdwZ14T0.png',
                alt: 'Style Guide 1',
              },
              {
                src: 'https://framerusercontent.com/images/0dygunnR8J7x1ElH4EcnwMBsB8.png',
                alt: 'Style Guide 2',
              },
            ],
          },
          {
            type: 'heading',
            level: 'h5',
            text: 'High Fidelity',
          },
          {
            type: 'paragraph',
            text: 'The low fidelity wireframes were then implemented along with the style guide selected and the first initial screens were made which decided the design direction for the whole game. The first 2 games I thought of were Block Jump and Snake! (Pictures below)',
          },
          {
            type: 'heading',
            level: 'h5',
            text: 'AI Integration & Gameplay refinement',
          },
          {
            type: 'paragraph',
            text: 'PRDs for the game were created with the help of AI tools such as ChatGPT and Perplexity AI. Deep gameplay mechanics and level difficulty were thought of, refined with the help of AI, and fed into Figma Make for making the final gameplay.',
          },
          {
            type: 'list',
            items: [
              {
                text: 'Product Requirement Document (PRD) - Block Jump generated in ChatGPT:',
                images: [
                  {
                    src: 'https://framerusercontent.com/images/JzD1pKpff157xtAZKrXworSjXq8.png',
                    caption: 'Block Jump PRD generated with ChatGPT',
                  },
                ],
              },
              {
                text: 'Prompt engineering in Figma Make:',
                images: [
                  {
                    src: 'https://framerusercontent.com/images/gOkefE8m2YbLTGdnHT3Z7TFjO0.png',
                    caption: 'Prompt engineering workflow in Figma Make',
                  },
                ],
              },
            ],
          },
          {
            type: 'paragraph',
            text: 'Backend Development: Integrated Supabase to build the backend infrastructure for player account creation and score tracking. Created dedicated buckets for sound effects and music to enhance the gamified experience.',
          },
          {
            type: 'list',
            items: [
              { text: 'Edge Functions - Server logic for game mechanics' },
              { text: 'Database Tables - Player scores and leaderboard' },
              { text: 'Storage Buckets - Retro audio and music files' },
            ],
          },
          {
            type: 'image-grid',
            columns: 3,
            images: [
              {
                src: 'https://framerusercontent.com/images/46BRSOmh8gDNQ6xZnacfboF2Cv8.png',
                alt: 'Supabase Backend 1',
              },
              {
                src: 'https://framerusercontent.com/images/TZr2OcxCzWlBj6G69adaWE3RUI.png',
                alt: 'Supabase Backend 2',
              },
              {
                src: 'https://framerusercontent.com/images/xjCIQrje5PHEQHdNlJDyDqzNc.png',
                alt: 'Supabase Backend 3',
              },
            ],
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/e43IwMjMIP1H9CM2HasaFloWmdo.png',
            alt: 'Oasis Gameplay Screen 1',
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/tp22d3KXcKtUPA1RCWYEJShilOM.png',
            alt: 'Oasis Gameplay Screen 2',
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/yPfZJ3iE9tTsZTHCcIMs26Fblc.png',
            alt: 'Oasis Gameplay Screen 3',
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/i8h9P4B7Q6ATPsyluAyKDQlzbEs.png',
            alt: 'Oasis Gameplay Screen 4',
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/FbtWt36MZY0YGgWwBheHmy7Olg.png',
            alt: 'Oasis Gameplay Screen 5',
          },
        ],
      },
      {
        id: 'results-impact',
        title: 'Results and Impact',
        blocks: [
          {
            type: 'paragraph',
            text: 'Published the game to production and gathered initial user feedback, monitoring engagement and iterating based on player reactions. After user feedback, another game was added called Zen Stack which increased the user play time by 10 more minutes!',
          },
          {
            type: 'list',
            items: [
              { text: '100+ active users within the first week of release' },
              { text: 'Successfully validated AI-enhanced design-to-development workflow' },
              {
                text: 'Demonstrated effective integration of Figma designs with AI code generation',
              },
            ],
          },
        ],
      },
    ],
  },

  'payments-copilot': {
    id: 'payments-copilot',
    stopId: 'ashoka-stambha',
    title: 'Designing Payments Co-pilot for mid sized organizations to boost cash outflow by 10%',
    client: 'Hyperbots Inc',
    year: '2024',
    projectType: 'B2B',
    role: 'Associate Product Designer',
    category: 'Design Systems',
    description:
      'Hyperbots Payments Co-Pilot is an AI-native platform designed to automate and optimize the entire financial payment lifecycle, eliminating manual errors, capturing early payment discounts, and increasing cash outflow efficiency by 10%.',
    heroImage: 'https://framerusercontent.com/images/Lb06115YJUx517P1dbeAWQWY6aI.png',
    galleryImages: [
      'https://framerusercontent.com/images/Zf2gJPz0bdh2p7iAbIye0ov4i6Y.svg',
      'https://framerusercontent.com/images/snBQJ7Ya0U9GoBWUb1C6rBs8.png',
      'https://framerusercontent.com/images/awiij1AFuZhUpFNdnQmE6BLpYk.png',
      'https://framerusercontent.com/images/rkyqJ8C0GRokBaDOHMRwYe6pn8.png',
      'https://framerusercontent.com/images/1d3awtFKrKgL4mPaEztiwCEs.png',
      'https://framerusercontent.com/images/5FVs5S5e3m6qMtKnlTDrdBIoV4s.png',
      'https://framerusercontent.com/images/0yLmYW5DDT0t8uXy2qpl2dipA.png',
      'https://framerusercontent.com/images/TXMFnOn6mOInZ82EF0On1Yue4cE.png',
      'https://framerusercontent.com/images/wyNczgY7v3DmPiPYX0jtcxRg.png',
      'https://framerusercontent.com/images/72NjxLcPgLoTDRHgFIwUjx4xEcA.png',
      'https://framerusercontent.com/images/yCBbg4pcX0P6oRNejzI8ghQC6w.png',
    ],
    externalUrl: 'https://www.hyperbots.com/copilots/payments',
    externalLabel: 'Hyperbots Payments Co-Pilot',
    impactMetrics: [
      { label: 'Design System', value: '0 → 1' },
      { label: 'Cash Outflow Boost', value: '10%' },
      { label: 'ARR to Date', value: '$3M' },
    ],
    tags: [
      'Design Systems',
      'FinTech Payments',
      'Procure-to-Pay',
      'B2B SaaS',
      'Audit Trail',
    ],
    accentColor: '#eab308',
    sections: [
      {
        id: 'background',
        title: 'Background',
        blocks: [
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/Zf2gJPz0bdh2p7iAbIye0ov4i6Y.svg',
            alt: 'Hyperbots Inc. Logo',
            maxWidth: '280px',
          },
          {
            type: 'paragraph',
            text: 'Hyperbots Inc. is an organization with a vision to free up humans from mundane and repetitive tasks in finance. Their proprietary Agentic AI Platform for Finance and Accounting powers their state-of-the-art AI-native co-pilots, designed to significantly automate F&A processes, reducing the administrative burden on finance teams and enabling faster, more accurate decision-making.',
          },
          {
            type: 'callout',
            title: 'Key achievements',
            items: [
              '0 -> 1',
              'Crafted foundational design system',
              'ARR to date: $3M',
              'Successfully Launched MVP',
            ],
          },
        ],
      },
      {
        id: 'core-problem',
        title: 'Core problem',
        blocks: [
          {
            type: 'paragraph',
            text: 'Manual and inefficient payment processes lead to delayed payments, poor tracking, and strained vendor relationships. Missed early payment discounts, late payment penalties, and costly human errors quietly chip away at cash flow and operational efficiency, leaving finance teams overwhelmed and vendors frustrated.',
          },
        ],
      },
      {
        id: 'approach-process',
        title: 'Approach & Process',
        blocks: [
          {
            type: 'heading',
            level: 'h5',
            text: 'What is a Copilot and what is a payment copilot in accounts payable process?',
          },
          {
            type: 'paragraph',
            text: 'Hyperbots Payments Co-Pilot is an AI-native platform designed to automate and optimize the entire financial payment lifecycle. Developed in collaboration with experienced financial executives, the software addresses common inefficiencies such as manual errors, late fees, and poor cash flow visibility. By leveraging specialized machine learning models, the system provides intelligent recommendations for payment timing, supports various transaction methods, and ensures seamless reconciliation with existing ERP systems. Key functional benefits include fraud prevention, automated audit trails, and a dedicated portal for improving vendor relationships.',
          },
          {
            type: 'heading',
            level: 'h5',
            text: 'Aim',
          },
          {
            type: 'paragraph',
            text: 'The platform aims to deliver significant cost savings and operational precision for finance teams across various industries.',
          },
          {
            type: 'heading',
            level: 'h5',
            text: 'Design and Development',
          },
          {
            type: 'paragraph',
            text: 'We focused on building an interface that delivered both functionality with a sleek, minimalistic look. Since the target group is finance based, focus was bringing out numbers and statistics which make the necessary argument of moving forward with approving invoice payments. After talking with the CFO partners (partnered with the organization as consultants), following decisions were taken while designing:',
          },
          {
            type: 'list',
            items: [
              {
                text: 'Streamlined Navigation: We structured the navigation to allow users to easily access different procure-to-pay features.',
              },
              {
                text: 'Data segregation: Clear differentiation between the invoices that are:',
                subItems: [
                  'Ready to pay',
                  'Need review from the user to move forward',
                  'Processed invoices which are already paid',
                ],
              },
              {
                text: 'Mini dashboard: A short data illustration on the main payments view that gives the user an insight about the segregation for the total number of invoices processed for payments.',
              },
              {
                text: 'Visual Hierarchy: By introducing a clear typography system, we ensured that complex data was presented in a digestible manner.',
              },
            ],
          },
          {
            type: 'heading',
            level: 'h5',
            text: 'User Persona and their pain points',
          },
          {
            type: 'heading',
            level: 'h6',
            text: 'Primary Persona: CFO, Finance controller, AP member',
          },
          {
            type: 'list',
            items: [
              { text: 'Vendor relationship challenges' },
              { text: 'Poor payments tracking' },
              { text: 'Delayed payments' },
              { text: 'Late payment penalties' },
              { text: 'Missed early payment discounts' },
              { text: 'Over payments and Human errors' },
            ],
          },
          {
            type: 'heading',
            level: 'h5',
            text: 'Visual Direction',
          },
          {
            type: 'list',
            items: [
              {
                text: 'While designing the whole of procure-to-pay suite of Hyperbots, the designs were constantly being reviewed by the partners that helped shape the vision of the product.',
              },
              { text: 'Using the Hyperbots Design system as the foundation' },
              {
                text: 'Tabular representation of data which the users are the most used to (almost all of the users involved in invoice processing use excel sheets as their primary tool)',
              },
              {
                text: 'Proper data representation using infographics and data visualization charts to show in the dashboard',
              },
              {
                text: 'A clean layout which is easier to use and understandable to the user',
              },
            ],
          },
          {
            type: 'heading',
            level: 'h5',
            text: 'Key Features',
          },
          {
            type: 'list',
            ordered: true,
            items: [
              {
                text: 'Segregated views of Ready to process payments, Payments pending reviews & Processed payments with the mode of payment specified in the table (here, for MVP purposes, the whole payment run was not designed; instead posting the paid invoices to update in ERP along with their GL code was made).',
                images: [
                  {
                    src: 'https://framerusercontent.com/images/snBQJ7Ya0U9GoBWUb1C6rBs8.png',
                    maxWidth: '560px',
                  },
                ],
              },
              {
                text: 'Clear tags representing the status of the payments:',
                subItems: [
                  'a) Ready to process tab: Approved for payment · Partially approved for payment · Rejected for Payment',
                  'b) Pending review tab: Pending review · On hold · Rejected',
                  'c) Paid invoices tab: Paid invoice · Partially paid invoice',
                ],
                images: [
                  {
                    src: 'https://framerusercontent.com/images/awiij1AFuZhUpFNdnQmE6BLpYk.png',
                    maxWidth: '680px',
                  },
                ],
              },
              {
                text: 'A proper detailed click-through / drill-down view of the invoices when the user clicks on it which shows the related invoice attached and the payment details of the invoice. These detailed views change according to the status of the invoice payment. (Amongst the key screens below, img 2)',
              },
              {
                text: 'Vendor payments and guest payments tab on the top. Guest payments are basically the invoices raised by individual entities which are not on contract basis like the vendors. (This feature was added after a client request, not a feature that was thought of at first)',
                images: [
                  {
                    src: 'https://framerusercontent.com/images/rkyqJ8C0GRokBaDOHMRwYe6pn8.png',
                    maxWidth: '640px',
                  },
                ],
              },
              {
                text: 'Showing the user about their previous payments regarding the same invoice. For example, if the user has paid some amount for the invoice, denying the user to overpay for an invoice.',
                images: [
                  {
                    src: 'https://framerusercontent.com/images/1d3awtFKrKgL4mPaEztiwCEs.png',
                    maxWidth: '340px',
                  },
                ],
              },
              {
                text: 'Clear text showing the user about early payment discounts so that the organization can reduce the number on cash outflow.',
              },
              {
                text: 'Proper messaging and error notifications for when the user is processing the invoices (for actions like Approving, Rejecting, Reviewing, etc.)',
                images: [
                  {
                    src: 'https://framerusercontent.com/images/5FVs5S5e3m6qMtKnlTDrdBIoV4s.png',
                    maxWidth: '300px',
                  },
                ],
              },
              {
                text: 'Audit trail for external auditors and compliance — a trail showing the stages where the invoice has been.',
                images: [
                  {
                    src: 'https://framerusercontent.com/images/0yLmYW5DDT0t8uXy2qpl2dipA.png',
                    maxWidth: '340px',
                  },
                ],
              },
            ],
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/TXMFnOn6mOInZ82EF0On1Yue4cE.png',
            alt: 'Payments Co-Pilot Key Screen 1',
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/wyNczgY7v3DmPiPYX0jtcxRg.png',
            alt: 'Payments Co-Pilot Key Screen 2',
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/72NjxLcPgLoTDRHgFIwUjx4xEcA.png',
            alt: 'Payments Co-Pilot Key Screen 3',
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/yCBbg4pcX0P6oRNejzI8ghQC6w.png',
            alt: 'Payments Co-Pilot Key Screen 4',
          },
        ],
      },
      {
        id: 'results-impact',
        title: 'Results and Impact',
        blocks: [
          {
            type: 'paragraph',
            text: "Businesses using Hyperbots' Co-pilot were able to automate payments, optimize timing, and eliminate manual errors while processing invoice payments and increase cash outflow efficiency by 10%.",
          },
          {
            type: 'paragraph',
            text: 'Vendor satisfaction: Vendors showed higher satisfaction as they knew real-time status of invoice processing and payments.',
          },
        ],
      },
    ],
  },

  'hypo-mascot': {
    id: 'hypo-mascot',
    stopId: 'gopuram-sanctum',
    title: "Designing a mascot to convey bot's message humanly",
    client: 'Hyperbots Inc.',
    year: '2024',
    projectType: 'Communication',
    role: 'Character & Communication Designer',
    category: 'Design Systems',
    description:
      'Re-imagined Hyperbots’ mascot "Hypo" from a cold, blocky robot into a warm, approachable AI companion aligned with the company logo, helping grow LinkedIn community engagement from 10k to 28k.',
    heroImage: 'https://framerusercontent.com/images/M7p112XUdnwoZCjxY6wB3imiI.png',
    galleryImages: [
      'https://framerusercontent.com/images/w2yfAE8Hi2lvhDnTJsVoSw33RA.png',
      'https://framerusercontent.com/images/7dYv3bBFouYDvq4dSixSLhVmPvk.png',
      'https://framerusercontent.com/images/eWsZiFZJH4LQe6B3RUmdoSsmlI.png',
      'https://framerusercontent.com/images/4xL6DoLMHzkVs8ojVmvdOa1OVOU.png',
      'https://framerusercontent.com/images/BtFZp3rPj9wAhCVLvgnvj8y0.png',
      'https://framerusercontent.com/images/V9Zf9yaLtYWQYFysCHpKO9aqs.png',
      'https://framerusercontent.com/images/PVRpQNBA73cbQNCk7dsDpzrOXE.png',
      'https://framerusercontent.com/images/CkNi9leSje7FXByvO5PAG47tO0.png',
      'https://framerusercontent.com/images/oZiJLjN4sn6HI02THtKrZnqJ10.png',
      'https://framerusercontent.com/images/JFBBeFzmiuCy6u3bMlqp9aSGkpg.png',
      'https://framerusercontent.com/images/AOG7ptJofzkPbh6qcwa7e4TID8U.png',
      'https://framerusercontent.com/images/riGEVkIEnydYPY4YxzmwOkqNzlc.png',
      'https://framerusercontent.com/images/YILCHG7shVfTqzFSM72UTrucsYo.png',
      'https://framerusercontent.com/images/nazNRSdqgteI44ciL8DO1txAWY.png',
      'https://framerusercontent.com/images/NaZUIfZklBI7XTCNyyQXnOXB8w.png',
      'https://framerusercontent.com/images/idYZdbR9CHiy8OLD9Rqm9hnvCQc.png',
      'https://framerusercontent.com/images/vuZtW2TusyuqcTmkP8mUiGM2hGY.png',
      'https://framerusercontent.com/images/YAvU5DSw2aRmeQjOWYJ8ezULUo.png',
      'https://framerusercontent.com/images/L64dCJcPj6xpsdR0oGW5Nv1UBak.png',
      'https://framerusercontent.com/images/obnWlCON9crTzDQGtiUIIE4iNk.png',
    ],
    externalUrl: 'https://www.hyperbots.com/',
    externalLabel: 'hyperbots.com',
    impactMetrics: [
      { label: 'LinkedIn Following', value: '10k → 28k' },
      { label: 'Brand Tone', value: 'Warm & Human' },
      { label: 'Adoption', value: 'Product & Social' },
    ],
    tags: [
      'Mascot Design',
      'Character Design',
      'Brand Identity',
      'Human-Centered AI',
      '3D Modeling',
    ],
    accentColor: '#ec4899',
    sections: [
      {
        id: 'background',
        title: 'Background',
        blocks: [
          {
            type: 'paragraph',
            text: 'Hyperbots Inc. is an organization with a vision to free up humans from mundane and repetitive tasks in finance. Their proprietary Agentic AI Platform for Finance and Accounting powers their state-of-the-art AI-native co-pilots, designed to significantly automate F&A processes, reducing the administrative burden on finance teams and enabling faster, more accurate decision-making.',
          },
        ],
      },
      {
        id: 'core-problem',
        title: 'Core problem',
        blocks: [
          {
            type: 'paragraph',
            text: 'Hyperbots Inc. needed a mascot to give their AI a friendly face for product messaging and social media content. The existing mascot "Hypo" looked too robotic and mechanical, which reinforced the concern that AI was taking full control of users\' work. The company needed a character that could convey warmth and collaboration, showing that AI is a helpful assistant rather than a controlling force.',
          },
          {
            type: 'paragraph',
            text: 'The initial mascot "Hypo" had a robotic appearance that failed to communicate the company\'s message of AI-human collaboration. It looked cold and mechanical, which contradicted the brand\'s goal of presenting AI as a warm, supportive tool that enhances rather than replaces human work.',
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/w2yfAE8Hi2lvhDnTJsVoSw33RA.png',
            alt: 'Original mechanical Hypo mascot',
            maxWidth: '200px',
            caption: 'Original blocky, mechanical mascot design',
          },
        ],
      },
      {
        id: 'process',
        title: 'Process',
        blocks: [
          {
            type: 'paragraph',
            text: 'The original mascot had a blocky, robotic design with hard edges and mechanical features. While it clearly communicated "technology," it failed to evoke the warmth and partnership that Hyperbots wanted to convey (as shown above).',
          },
          {
            type: 'heading',
            level: 'h5',
            text: 'Aim',
          },
          {
            type: 'paragraph',
            text: 'Create a mascot character that embodies warmth, friendliness, and collaboration while maintaining a connection to AI technology. The mascot needed to work effectively across product interfaces and social media platforms, conveying messages in a more approachable and human-centric way.',
          },
          {
            type: 'heading',
            level: 'h5',
            text: "Aligning with Brand's Vision and Mission",
          },
          {
            type: 'callout',
            title: 'Vision & Mission',
            items: [
              'Vision: The best AI for Finance.',
              'Mission: To free up humans from mundane and repetitive finance tasks for 2,000 companies in 6 years.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Initial sketches: Creating a basic outline of mascots to get an idea, making friendlier and expressive characters which would be suitable as a bot for product and content marketing.',
          },
          {
            type: 'image-grid',
            columns: 2,
            images: [
              {
                src: 'https://framerusercontent.com/images/7dYv3bBFouYDvq4dSixSLhVmPvk.png',
                alt: 'Initial Mascot Sketch Sheet 1',
              },
              {
                src: 'https://framerusercontent.com/images/eWsZiFZJH4LQe6B3RUmdoSsmlI.png',
                alt: 'Initial Mascot Sketch Sheet 2',
              },
            ],
          },
          {
            type: 'paragraph',
            text: "The company's visual designer then decided to go forward with 3 logo directions for which the mascot had to be created. The ask was that the mascot should not differ much from the company's logo.",
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/4xL6DoLMHzkVs8ojVmvdOa1OVOU.png',
            alt: '3 Logo Directions',
            maxWidth: '640px',
          },
          {
            type: 'paragraph',
            text: "The first logo was selected after a company-wide vote for the organization's logo and the task then changed to make a mascot which had more resemblance to the logo. Following are some sketches that show the making of the mascot:",
          },
          {
            type: 'image-grid',
            columns: 2,
            images: [
              {
                src: 'https://framerusercontent.com/images/BtFZp3rPj9wAhCVLvgnvj8y0.png',
                alt: 'Mascot Iteration Sketch 1',
              },
              {
                src: 'https://framerusercontent.com/images/V9Zf9yaLtYWQYFysCHpKO9aqs.png',
                alt: 'Mascot Iteration Sketch 2',
              },
              {
                src: 'https://framerusercontent.com/images/PVRpQNBA73cbQNCk7dsDpzrOXE.png',
                alt: 'Mascot Iteration Sketch 3',
              },
              {
                src: 'https://framerusercontent.com/images/CkNi9leSje7FXByvO5PAG47tO0.png',
                alt: 'Mascot Iteration Sketch 4',
              },
              {
                src: 'https://framerusercontent.com/images/oZiJLjN4sn6HI02THtKrZnqJ10.png',
                alt: 'Mascot Iteration Sketch 5',
              },
              {
                src: 'https://framerusercontent.com/images/JFBBeFzmiuCy6u3bMlqp9aSGkpg.png',
                alt: 'Mascot Iteration Sketch 6',
              },
            ],
          },
          {
            type: 'heading',
            level: 'h5',
            text: 'Digitising the ideas for better clarity',
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/AOG7ptJofzkPbh6qcwa7e4TID8U.png',
            alt: 'Digitised Mascot Concept 1',
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/riGEVkIEnydYPY4YxzmwOkqNzlc.png',
            alt: 'Digitised Mascot Concept 2',
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/YILCHG7shVfTqzFSM72UTrucsYo.png',
            alt: 'Digitised Mascot Concept 3',
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/nazNRSdqgteI44ciL8DO1txAWY.png',
            alt: 'Digitised Mascot Concept 4',
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/NaZUIfZklBI7XTCNyyQXnOXB8w.png',
            alt: 'Digitised Mascot Concept 5',
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/idYZdbR9CHiy8OLD9Rqm9hnvCQc.png',
            alt: 'Digitised Mascot Concept 6',
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/vuZtW2TusyuqcTmkP8mUiGM2hGY.png',
            alt: 'Digitised Mascot Concept 7',
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/YAvU5DSw2aRmeQjOWYJ8ezULUo.png',
            alt: 'Digitised Mascot Concept 8',
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/L64dCJcPj6xpsdR0oGW5Nv1UBak.png',
            alt: 'Digitised Mascot Concept 9',
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/obnWlCON9crTzDQGtiUIIE4iNk.png',
            alt: 'Digitised Mascot Concept 10',
          },
        ],
      },
      {
        id: 'results-impact',
        title: 'Results and Impact',
        blocks: [
          {
            type: 'paragraph',
            text: 'Introducing a mascot to product and content brought an emotion which helped the organization convey the technical language in a more human way. It also allowed us to make the content more engaging which resulted in social media (LinkedIn) following growing from 10k to 28k.',
          },
        ],
      },
    ],
  },

  'invoice-copilot': {
    id: 'invoice-copilot',
    stopId: 'chand-stepwell',
    title:
      'Designing invoice processing to achieve 80% straight through processing without a human touch',
    client: 'Hyperbots Inc.',
    year: '2023',
    projectType: 'B2B',
    role: 'Associate Product Designer (0 to 1)',
    category: 'Fintech',
    description:
      'Hyperbots Invoice Processing Co-pilot automates the entire invoice lifecycle with 80% straight-through processing (STP), reducing invoice processing time from an industry average of 11 days to less than one minute.',
    heroImage: 'https://framerusercontent.com/images/qAVRXiGamKhMVbYUjsxdgd7EoZM.png',
    galleryImages: [
      'https://framerusercontent.com/images/Zf2gJPz0bdh2p7iAbIye0ov4i6Y.svg',
      'https://framerusercontent.com/images/vNVxkgJ9CzImv37zt6dRjV18Q8.png',
      'https://framerusercontent.com/images/A4Coxrs8WZk7w1jZnv3FhAmFGA.png',
      'https://framerusercontent.com/images/DuuIA75nPv1sQEqLotTnp6aAfLw.png',
      'https://framerusercontent.com/images/bPwFHWqpuO7hfStBCF1qkvibM.png',
      'https://framerusercontent.com/images/At6qQBKPrCYd4hd3e4XImJHY.png',
      'https://framerusercontent.com/images/sw2Jjd1g30nerFtAo9o1fkAkEU.png',
      'https://framerusercontent.com/images/x8529JrnZuYpFtahVjvrlSNCNKA.png',
      'https://framerusercontent.com/images/lIkENC8XOokP1sTQHnKk6yWk9w.png',
      'https://framerusercontent.com/images/JMEwKldrl6IgtBpEcjIZ1hmI.png',
      'https://framerusercontent.com/images/Oz6vglyy1a5HzKBSrW0ljPW3H8.png',
      'https://framerusercontent.com/images/yCBbg4pcX0P6oRNejzI8ghQC6w.png',
      'https://framerusercontent.com/images/AXdfQ0EmRAeFKS7FTS1VvH9pfQ8.png',
    ],
    externalUrl: 'https://www.hyperbots.com/copilots/invoice-processing',
    externalLabel: 'Hyperbots Invoice Processing Co-Pilot',
    impactMetrics: [
      { label: 'ARR to Date', value: '$3M' },
      { label: 'Processing Speed', value: '11 Days → <1 Min' },
      { label: 'Straight-Through Rate', value: '80% STP' },
    ],
    tags: [
      '0→1 Launch',
      'AI Agents',
      'Accounts Payable',
      'Invoice Automation',
      'ERP Integration',
    ],
    accentColor: '#14b8a6',
    sections: [
      {
        id: 'background',
        title: 'Background',
        blocks: [
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/Zf2gJPz0bdh2p7iAbIye0ov4i6Y.svg',
            alt: 'Hyperbots Inc. Logo',
            maxWidth: '280px',
          },
          {
            type: 'paragraph',
            text: 'Hyperbots Inc. is an organization with a vision to free up humans from mundane and repetitive tasks in finance. Their proprietary Agentic AI Platform for Finance and Accounting powers their state-of-the-art AI-native co-pilots, designed to significantly automate F&A processes, reducing the administrative burden on finance teams and enabling faster, more accurate decision-making.',
          },
        ],
      },
      {
        id: 'core-problem',
        title: 'Core problem',
        blocks: [
          {
            type: 'paragraph',
            text: 'Processing invoices manually is frustrating. Data entry, matching errors, wrong GL codes, slow approvals, and OCR mistakes pile up fast. It’s not just slow—it costs money. For finance teams, it feels like busywork that never ends.',
          },
          {
            type: 'callout',
            title: 'Key achievements',
            items: [
              '0 -> 1',
              'Crafted foundational design system',
              'ARR to date: $3M',
              'Successfully Launched MVP',
            ],
          },
        ],
      },
      {
        id: 'approach-process',
        title: 'Approach & Process',
        blocks: [
          {
            type: 'heading',
            level: 'h5',
            text: 'What is a Copilot and what is an Invoice processing co-pilot in accounts payable process?',
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/vNVxkgJ9CzImv37zt6dRjV18Q8.png',
            alt: 'Invoice Processing Lifecycle Diagram',
            maxWidth: '640px',
          },
          {
            type: 'paragraph',
            text: 'Hyperbots Invoice Processing Co-pilot automates the entire invoice lifecycle with 80% straight-through processing (STP). It uses foundational AI agents for tasks like invoice discovery, fields extraction, validation, matching, GL coding and GL posting — significantly reducing manual effort and enhancing accuracy.',
          },
          {
            type: 'heading',
            level: 'h5',
            text: 'Aim',
          },
          {
            type: 'paragraph',
            text: 'Invoice Processing Co-pilot aims to reduce invoice processing time from an industry average of 11 days to less than one minute due to STP achieved through AI.',
          },
          {
            type: 'heading',
            level: 'h5',
            text: 'Design and Development',
          },
          {
            type: 'paragraph',
            text: 'We focused on building an interface that delivered both functionality with a sleek, minimalistic look. Since the target group is finance based, focus was bringing out numbers and statistics which make the necessary argument of moving forward with approving invoice payments. After talking with the CFO partners (partnered with the organization as consultants), following decisions were taken while designing:',
          },
          {
            type: 'list',
            items: [
              {
                text: 'Streamlined Navigation: We structured the navigation to allow users to easily access different procure-to-pay features.',
              },
              {
                text: 'Data segregation: Clear differentiation between the invoices that are:',
                subItems: [
                  'Ready to process (AI automated invoices that are already 2-way/3-way matched)',
                  'Need review from the user to move forward',
                  'Processed invoices which are already processed',
                ],
              },
              {
                text: 'Mini dashboard: A short data illustration on the main payments view that gives the user an insight about the segregation for the total number of invoices processed for payments.',
              },
              {
                text: 'Visual Hierarchy: By introducing a clear typography system, we ensured that complex data was presented in a digestible manner.',
              },
            ],
          },
          {
            type: 'heading',
            level: 'h5',
            text: 'User Persona and their pain points',
          },
          {
            type: 'heading',
            level: 'h6',
            text: 'Primary Persona: CFO, Finance controller, AP member',
          },
          {
            type: 'list',
            items: [
              { text: 'Labor intensive and error prone' },
              { text: 'Duplicate invoices' },
              { text: 'Wrong GL coding' },
              { text: 'High OCR errors' },
              { text: 'Delays in approvals' },
              { text: 'High invoice processing cost' },
            ],
          },
          {
            type: 'heading',
            level: 'h5',
            text: 'Visual Direction',
          },
          {
            type: 'list',
            items: [
              {
                text: 'While designing the whole of procure-to-pay suite of Hyperbots, the designs were constantly being reviewed by the partners that helped shape the vision of the product.',
              },
              { text: 'Using the Hyperbots Design system as the foundation' },
              {
                text: 'Tabular representation of data which the users are the most used to (almost all of the users involved in invoice processing use excel sheets as their primary tool)',
              },
              {
                text: 'Proper data representation using infographics and data visualization charts to show in the dashboard',
              },
              {
                text: 'A clean layout which is easier to use and understandable to the user',
              },
            ],
          },
          {
            type: 'heading',
            level: 'h5',
            text: 'Key Features',
          },
          {
            type: 'list',
            ordered: true,
            items: [
              {
                text: 'Segregated views of Ready to process invoices, Invoices pending reviews & Processed Invoices specified in the table (here, for MVP purposes, the whole payment run was not designed; instead posting the paid invoices to update in ERP along with their GL code was made).',
                images: [
                  {
                    src: 'https://framerusercontent.com/images/A4Coxrs8WZk7w1jZnv3FhAmFGA.png',
                  },
                  {
                    src: 'https://framerusercontent.com/images/DuuIA75nPv1sQEqLotTnp6aAfLw.png',
                    maxWidth: '540px',
                  },
                ],
              },
              {
                text: 'Clear tags representing the status of the invoice matching:',
                subItems: [
                  'a) Ready to process tab: Auto approved (2-way match / 3-way match success) · Manually approved (2-way match / 3-way match failed or No match) · Written to ERP · Failed to write to ERP',
                  'b) Pending review tab: Pending review · Unassigned',
                  'c) Processed invoices tab: Posted to GL · Partially paid invoice',
                ],
                images: [
                  {
                    src: 'https://framerusercontent.com/images/bPwFHWqpuO7hfStBCF1qkvibM.png',
                    maxWidth: '540px',
                  },
                ],
              },
              {
                text: 'A proper detailed click-through / drill-down view of the invoices when the user clicks on it which shows the related invoice attached and the details of the invoice (Sender details, Payment terms, Item lines, Vendor details, etc.). These detailed views change according to the status of the invoice. (Amongst the key screens below, img 3)',
              },
              {
                text: 'Handling duplicate invoices: Sometimes there are multiple uploads of the same invoice which the AI flags as duplicate. A defined tag was designed which indicated that the uploaded invoice is a duplicate.',
                images: [
                  {
                    src: 'https://framerusercontent.com/images/At6qQBKPrCYd4hd3e4XImJHY.png',
                  },
                ],
              },
              {
                text: 'Creating invoices from PO numbers / references (shown below, img 5).',
              },
              {
                text: 'AI recommended GL tags for each invoice so that the user knows which GL code has been assigned and can later change it at their convenience (Shown in table in pt. 2).',
              },
              {
                text: 'Audit trail for external auditors and compliance — a trail showing the stages where the invoice has been during approval.',
                images: [
                  {
                    src: 'https://framerusercontent.com/images/sw2Jjd1g30nerFtAo9o1fkAkEU.png',
                    maxWidth: '580px',
                  },
                ],
              },
              {
                text: 'User workflows configurations for organizations. Features include: Work allocation & Approver levels.',
                images: [
                  {
                    src: 'https://framerusercontent.com/images/x8529JrnZuYpFtahVjvrlSNCNKA.png',
                    maxWidth: '640px',
                  },
                ],
              },
            ],
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/lIkENC8XOokP1sTQHnKk6yWk9w.png',
            alt: 'Invoice Processing Screen 1',
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/JMEwKldrl6IgtBpEcjIZ1hmI.png',
            alt: 'Invoice Processing Screen 2',
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/Oz6vglyy1a5HzKBSrW0ljPW3H8.png',
            alt: 'Invoice Processing Screen 3',
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/yCBbg4pcX0P6oRNejzI8ghQC6w.png',
            alt: 'Invoice Processing Screen 4',
          },
          {
            type: 'image',
            src: 'https://framerusercontent.com/images/AXdfQ0EmRAeFKS7FTS1VvH9pfQ8.png',
            alt: 'Invoice Processing Screen 5',
          },
        ],
      },
      {
        id: 'results-impact',
        title: 'Results and Impact',
        blocks: [
          {
            type: 'paragraph',
            text: 'Organizations achieved faster invoice processing times with the agents working 24/7. With proper UX, they were able to post multiple invoices to ERP in just one click, reducing manual matching times.',
          },
        ],
      },
    ],
  },
};

export interface ReferenceToolStackItem {
  tool: string;
  category: string;
  remoteLogo: string;
  url: string;
}

export const REFERENCE_TOOL_STACK: ReferenceToolStackItem[] = [
  {
    tool: 'Adobe suite',
    category: 'Graphic design',
    remoteLogo: 'https://framerusercontent.com/images/ki86UfQ2Aq5EyHr6K0sI2XkfhmM.png',
    url: 'https://www.adobe.com',
  },
  {
    tool: 'Figma',
    category: 'Product design',
    remoteLogo: 'https://framerusercontent.com/images/28MqpJbyHqFCKT2Qy0ebG9247E.png',
    url: 'https://www.figma.com',
  },
  {
    tool: 'Cursor',
    category: 'Development',
    remoteLogo: 'https://framerusercontent.com/images/ZvJfB470RgfNF6cMDo5IRCJhbE.png',
    url: 'https://www.cursor.com',
  },
  {
    tool: 'Antigravity',
    category: 'Prototyping and testing',
    remoteLogo: 'https://framerusercontent.com/images/EUOkVxECYE2YvPlNke2s9eJQAos.png',
    url: 'https://antigravity.google',
  },
  {
    tool: 'Mobbin',
    category: 'Inspiration',
    remoteLogo: 'https://framerusercontent.com/images/iAIgnT1o7tkcs50XCCBwdEmKFE.png',
    url: 'https://mobbin.com',
  },
  {
    tool: 'Jitter',
    category: 'Motion design',
    remoteLogo: 'https://framerusercontent.com/images/TP2ExUZBwG9yqxiMuaGqU5cQCUs.png',
    url: 'https://jitter.video',
  },
  {
    tool: 'Supabase',
    category: 'Backend (Intermediate level)',
    remoteLogo: 'https://framerusercontent.com/images/REdzMBE5zJD3zDvvpSbQ2SZoA.webp',
    url: 'https://supabase.com',
  },
  {
    tool: 'Blender',
    category: '3D modelling/ Animatics',
    remoteLogo: 'https://framerusercontent.com/images/9aFsVRmGNdUwN94GHVOlOp0d8.webp',
    url: 'https://www.blender.org',
  },
  {
    tool: 'Google Labs experiments',
    category: 'AI upskilling',
    remoteLogo: 'https://framerusercontent.com/images/iXw3jT4orhGgFALeYEoohfpCCCY.png',
    url: 'https://labs.google',
  },
];

export const REFERENCE_ENDORSEMENTS = [
  {
    quote:
      'Ayush brings boundless creativity and disciplined execution to every problem. Whether architecting autonomous AI workspaces or designing engaging brand identities, his work elevates the standard of the entire team.',
    author: 'Hyperbots Leadership',
    role: 'Product & Engineering Lead',
    company: 'Hyperbots Inc.',
    avatarText: 'HB',
  },
  {
    quote:
      'Working with Ayush on 0-to-1 initiatives is an absolute pleasure. He turns complex business briefs into intuitive, clean interfaces at unbelievable velocity.',
    author: 'SourceCode Tech',
    role: 'Tech Lead & Founder',
    company: 'SourceCode Tech',
    avatarText: 'SC',
  },
];

export function getReferenceCaseStudy(projectId: string): ReferenceCaseStudy {
  return (
    REFERENCE_CASE_STUDIES[projectId] ??
    REFERENCE_CASE_STUDIES['cfos-ai-workspace']
  );
}
