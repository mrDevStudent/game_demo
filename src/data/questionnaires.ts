import {
  CounselingAreaId,
  PreSimulationQuestion,
  RoomConfig,
  RoomId,
  SimulationStage,
} from '../types';

export const NPC_MODEL_FILES = [
  'female1.glb',
  'female2.glb',
  'female3.glb',
  'female4.glb',
  'female5.glb',
  'male1.glb',
  'male2.glb',
  'male3.glb',
  'male4.glb',
] as const;

export const PRE_SIMULATION_QUESTIONS: PreSimulationQuestion[] = [
  // AREA 1: CONFIDENTIALITY (Items 1–5)
  {
    id: 'pre_q1',
    itemNumber: 1,
    areaId: 'area1',
    areaTitle: 'Area 1: Confidentiality',
    prompt:
      'A Grade 11 student asks the school counselor to promise that their conversation about failing grades and anxiety about college will never be shared with anyone. What is the MOST appropriate response?',
    options: {
      A: 'Assure the student that all information shared during counseling will remain private under every circumstance.',
      B: 'Explain that information is generally confidential, but certain situations may require limited disclosure for safety or legal reasons.',
      C: 'Inform the student that their concerns may be shared with teachers whenever academic assistance becomes necessary.',
      D: 'Explain that information will remain private as long as the student does not discuss concerns involving other individuals.',
    },
  },
  {
    id: 'pre_q2',
    itemNumber: 2,
    areaId: 'area1',
    areaTitle: 'Area 1: Confidentiality',
    prompt:
      "A teacher asks the counselor for details about a student's private session after noticing repeated absences. The teacher wants to help the student catch up academically. What should the counselor do?",
    options: {
      A: "Share the student's concerns with the teacher because the information may help address the academic difficulties.",
      B: "Provide a brief summary of the session while avoiding sensitive details that may affect the student's privacy.",
      C: "Explain the confidentiality obligation and seek the student's permission before disclosing relevant information.",
      D: "Allow the teacher to review the session notes because the request concerns the student's academic performance.",
    },
  },
  {
    id: 'pre_q3',
    itemNumber: 3,
    areaId: 'area1',
    areaTitle: 'Area 1: Confidentiality',
    prompt:
      "A parent requests all notes from an adolescent student's session about career uncertainty and family stress. The student has asked that the conversation remain private. What is the MOST appropriate action?",
    options: {
      A: "Provide the parent with the complete notes because parents are responsible for their child's educational decisions.",
      B: 'Refuse the request immediately because adolescent students have complete control over all counseling records.',
      C: 'Review applicable confidentiality rules and consent requirements before determining what information may be disclosed.',
      D: 'Share the career-related information but withhold the family concerns because only personal matters require confidentiality.',
    },
  },
  {
    id: 'pre_q4',
    itemNumber: 4,
    areaId: 'area1',
    areaTitle: 'Area 1: Confidentiality',
    prompt:
      'A student says they are emotionally overwhelmed but are not ready to discuss the concern with their family. They report no immediate safety concern. What should the counselor do?',
    options: {
      A: "Respect the student's preference while exploring their concerns and discussing appropriate support options.",
      B: "Inform the student's family immediately because emotional difficulties should always involve parental support.",
      C: 'Encourage the student to disclose everything to their family before continuing with counseling sessions.',
      D: 'Avoid discussing the concern further until the student agrees to involve a family member.',
    },
  },
  {
    id: 'pre_q5',
    itemNumber: 5,
    areaId: 'area1',
    areaTitle: 'Area 1: Confidentiality',
    prompt:
      'A student shares personal information about family conflict during a counseling session. Later, a classmate asks the counselor whether the student has been attending counseling because they are concerned. What is the MOST appropriate response?',
    options: {
      A: "Confirm the student's attendance but avoid discussing the personal concerns shared during the session.",
      B: 'Explain that counseling participation and session details are private unless disclosure is appropriately authorized.',
      C: "Share general information about the student's situation to help the classmate understand their behavior.",
      D: 'Ask the classmate to speak with the student before providing any information about the counseling session.',
    },
  },

  // AREA 2: ACADEMIC, CAREER AND SOCIAL/EMOTIONAL PLANNING (Items 6–10)
  {
    id: 'pre_q6',
    itemNumber: 6,
    areaId: 'area2',
    areaTitle: 'Area 2: Academic, Career and Social/Emotional Planning',
    prompt:
      'A third-year college student wants to pursue a career in guidance counseling after graduation. However, their parents insist that they take a corporate job because it offers a higher salary. The student approaches the guidance office, feeling confused about whose expectations to follow.',
    options: {
      A: "Encourage the student to follow their parents' preference to maintain family support.",
      B: 'Help the student explore personal interests while considering family expectations.',
      C: 'Recommend the corporate career because it offers better financial opportunities.',
      D: 'Ask the parents to determine which career would benefit the student most.',
    },
  },
  {
    id: 'pre_q7',
    itemNumber: 7,
    areaId: 'area2',
    areaTitle: 'Area 2: Academic, Career and Social/Emotional Planning',
    prompt:
      'A student has been frequently absent and submitting incomplete requirements. During a guidance session, the student reveals that ongoing family conflicts have affected their concentration and emotional well-being. They request that the counselor keep the matter private.',
    options: {
      A: "Respect the request and avoid discussing the student's situation with others.",
      B: "Inform the class adviser immediately about the student's family circumstances.",
      C: "Explore the student's concerns and discuss appropriate support and privacy limits.",
      D: "Contact the student's parents directly to verify the disclosed family problems.",
    },
  },
  {
    id: 'pre_q8',
    itemNumber: 8,
    areaId: 'area2',
    areaTitle: 'Area 2: Academic, Career and Social/Emotional Planning',
    prompt:
      'A graduating student visits the guidance office because they feel overwhelmed by academic requirements and pressure to finish on time. They admit that they are no longer interested in their chosen degree program and are considering shifting courses.',
    options: {
      A: 'Recommend shifting programs before the student experiences further academic difficulties.',
      B: 'Encourage continuing the program because graduation is already approaching.',
      C: "Explore the student's concerns and identify appropriate academic and emotional support.",
      D: 'Advise taking a leave of absence until the student regains motivation.',
    },
  },
  {
    id: 'pre_q9',
    itemNumber: 9,
    areaId: 'area2',
    areaTitle: 'Area 2: Academic, Career and Social/Emotional Planning',
    prompt:
      "A subject teacher approaches the guidance counselor to ask about a student's preferred college course. The teacher explains that the information would help in assigning students to career-related activities. However, the student has not given permission to share their counseling information.",
    options: {
      A: 'Share the information because it may help the teacher improve classroom activities.',
      B: 'Provide the information if the teacher agrees to maintain its confidentiality.',
      C: "Seek the student's permission before sharing relevant career-related information.",
      D: "Give the teacher the student's counseling records for a clearer understanding.",
    },
  },
  {
    id: 'pre_q10',
    itemNumber: 10,
    areaId: 'area2',
    areaTitle: 'Area 2: Academic, Career and Social/Emotional Planning',
    prompt:
      'A student receives an opportunity to study in another city but hesitates because their family depends on their financial and emotional support. During a counseling session, the student asks whether pursuing personal goals would be selfish.',
    options: {
      A: 'Encourage staying home because family responsibilities should come before education.',
      B: 'Recommend studying away because educational opportunities should remain the priority.',
      C: 'Help the student examine personal goals, family responsibilities, and available options.',
      D: "Ask the family to decide because their circumstances affect the student's future.",
    },
  },

  // AREA 3: SUSTAINING HEALTHY RELATIONSHIPS, BOUNDARIES & SERIOUS HARM (Items 11–15)
  {
    id: 'pre_q11',
    itemNumber: 11,
    areaId: 'area3',
    areaTitle: 'Area 3: Relationships, Boundaries & Harm Prevention',
    prompt:
      'A student tells the counselor they have romantic feelings and asks to meet privately after school without anyone knowing. What should the counselor do?',
    options: {
      A: "Acknowledge the student's feelings while maintaining professional boundaries and declining the private invitation.",
      B: 'Agree to meet briefly in public while reminding the student that their relationship remains professional.',
      C: "Avoid discussing the student's feelings and continue providing counseling during regular school hours.",
      D: 'Allow occasional private meetings while reminding the student that personal relationships are not permitted.',
    },
  },
  {
    id: 'pre_q12',
    itemNumber: 12,
    areaId: 'area3',
    areaTitle: 'Area 3: Relationships, Boundaries & Harm Prevention',
    prompt:
      'A student sends the counselor repeated personal messages late at night, including requests for conversations unrelated to school counseling. What is the MOST appropriate response?',
    options: {
      A: 'Respond occasionally to maintain rapport while gradually limiting conversations outside working hours.',
      B: 'Establish clear communication boundaries and redirect the student to approved professional contact channels.',
      C: 'Continue responding when available while reminding the student that counseling remains the primary concern.',
      D: 'Stop responding to all messages without explanation to prevent further personal communication.',
    },
  },
  {
    id: 'pre_q13',
    itemNumber: 13,
    areaId: 'area3',
    areaTitle: 'Area 3: Relationships, Boundaries & Harm Prevention',
    prompt:
      'During a session, a student says they intend to end their life tonight and asks the counselor to keep it secret. What should the counselor do?',
    options: {
      A: "Respect the student's privacy while encouraging them to seek emotional support from trusted individuals.",
      B: "Schedule another counseling session to explore the student's feelings before deciding on further action.",
      C: "Immediately assess the risk, ensure the student's safety, and involve appropriate emergency support personnel.",
      D: 'Encourage the student to reconsider the plan while maintaining confidentiality until further details are provided.',
    },
  },
  {
    id: 'pre_q14',
    itemNumber: 14,
    areaId: 'area3',
    areaTitle: 'Area 3: Relationships, Boundaries & Harm Prevention',
    prompt:
      'After an argument, a student tells the counselor they plan to bring a knife tomorrow to hurt a named classmate. The student insists the conversation is confidential. What should the counselor do?',
    options: {
      A: 'Encourage the student to reconsider the plan and schedule another session before taking further action.',
      B: 'Assess the threat, take immediate protective measures, and notify appropriate authorities or school personnel.',
      C: 'Arrange a meeting between the students to resolve the disagreement before considering further intervention.',
      D: 'Maintain confidentiality while advising the student to avoid further contact with the classmate involved.',
    },
  },
  {
    id: 'pre_q15',
    itemNumber: 15,
    areaId: 'area3',
    areaTitle: 'Area 3: Relationships, Boundaries & Harm Prevention',
    prompt:
      'A student says they sometimes think about hurting another person but is afraid to explain further. The counselor is unsure whether there is a serious risk. What should the counselor do?',
    options: {
      A: 'Reassure the student that the conversation is confidential while allowing them time to disclose more information.',
      B: 'Immediately report the student because any statement about harming others indicates an imminent threat.',
      C: 'Conduct an appropriate risk assessment, consult relevant professionals, and determine necessary safety measures.',
      D: 'Advise the student to avoid the person involved while waiting for additional information about the situation.',
    },
  },

  // AREA 4: BULLYING, HARASSMENT, DISCRIMINATION, BIAS AND HATE INCIDENTS (Items 16–20)
  {
    id: 'pre_q16',
    itemNumber: 16,
    areaId: 'area4',
    areaTitle: 'Area 4: Bullying, Harassment, Discrimination, Bias & Hate Incidents',
    prompt:
      'A student reports that classmates repeatedly post humiliating comments about them in a group chat. The student says this has affected attendance and asks the counselor not to tell anyone. What should the counselor do?',
    options: {
      A: "Respect the student's request and recommend blocking the classmates to prevent further online interactions.",
      B: "Assess the student's well-being, explain confidentiality limits, and follow appropriate reporting and intervention procedures.",
      C: 'Contact the classmates privately and request removal of the comments before informing school personnel.',
      D: 'Encourage the student to ignore the messages and continue attending classes while monitoring the situation.',
    },
  },
  {
    id: 'pre_q17',
    itemNumber: 17,
    areaId: 'area4',
    areaTitle: 'Area 4: Bullying, Harassment, Discrimination, Bias & Hate Incidents',
    prompt:
      "A student reports that classmates repeatedly mock another student's religious practices. A teacher dismisses the behavior as joking. What is the MOST appropriate response?",
    options: {
      A: 'Advise the affected student to avoid reacting because the remarks may not reflect intentional discrimination.',
      B: 'Encourage the students to discuss their differences and resolve the situation without further involvement.',
      C: 'Recognize the behavior as possible religious discrimination, document the concern, and follow appropriate school procedures.',
      D: 'Ask the teacher to address the behavior informally before considering whether further intervention is necessary.',
    },
  },
  {
    id: 'pre_q18',
    itemNumber: 18,
    areaId: 'area4',
    areaTitle: 'Area 4: Bullying, Harassment, Discrimination, Bias & Hate Incidents',
    prompt:
      'A student says they are repeatedly targeted because of their sexual orientation and fears further harassment if their identity is disclosed. What should the counselor do?',
    options: {
      A: "Inform the student's family immediately so they can provide support and prevent further emotional distress.",
      B: "Avoid documenting the concern to protect the student's identity and prevent possible disclosure to others.",
      C: "Assess the student's safety, protect confidential information, and follow appropriate procedures to address the harassment.",
      D: 'Encourage the student to disclose their identity publicly so classmates can better understand their experiences.',
    },
  },
  {
    id: 'pre_q19',
    itemNumber: 19,
    areaId: 'area4',
    areaTitle: 'Area 4: Bullying, Harassment, Discrimination, Bias & Hate Incidents',
    prompt:
      "During a school activity, students distribute offensive images targeting a classmate's ethnicity and call it a joke. What is the MOST appropriate action?",
    options: {
      A: 'Ask the students to remove the images and apologize before determining whether further action is necessary.',
      B: 'Recognize the incident as potentially discriminatory, document relevant information, and follow established reporting procedures.',
      C: 'Explain the importance of cultural sensitivity and allow the students to resolve the misunderstanding independently.',
      D: "Advise the targeted student to avoid the activity while waiting for the school to determine the students' intentions.",
    },
  },
  {
    id: 'pre_q20',
    itemNumber: 20,
    areaId: 'area4',
    areaTitle: 'Area 4: Bullying, Harassment, Discrimination, Bias & Hate Incidents',
    prompt:
      'A student reports that a teacher repeatedly makes degrading comments about students with disabilities and fears retaliation if they report it. What should the counselor do?',
    options: {
      A: 'Encourage the student to confront the teacher directly and explain how the comments affect them.',
      B: "Promise complete confidentiality while privately discussing the teacher's behavior with other students.",
      C: 'Listen to the concern, assess possible risks, explain confidentiality limits, and follow appropriate reporting procedures.',
      D: 'Advise the student to transfer classes while waiting for additional complaints before taking formal action.',
    },
  },
];

// Part III: Post-Simulation (20 items across the 4 Counseling Areas mapped to Room 1 – Room 4)
export const CAMPUS_ROOMS: RoomConfig[] = [
  {
    id: 'classroom',
    name: 'Room 1',
    subtitle: 'Area 1: Confidentiality',
    x: -14,
    z: -14,
    facingSign: 1,
    doorX: -14,
    doorZ: -8.6,
    wallColor: 0xe8c47d,
    roofColor: 0x6c584c,
    trimColor: 0x475569,
    questions: [
      {
        id: 'cls_q1',
        roomId: 'classroom',
        patientIndex: 1,
        patientName: 'Client 01 · Leo',
        patientRole: 'Grade 12 Student',
        modelFile: 'male3.glb',
        scale: 1.62,
        prompt:
          'A Grade 12 student discusses pressure about university applications and family expectations. They ask the counselor to guarantee that nothing they say could ever be shared. What is the MOST appropriate response?',
        options: {
          A: 'Assure the student that their information will remain private throughout the entire counseling process.',
          B: 'Explain that confidentiality is protected, although certain circumstances may require limited disclosure.',
          C: 'Inform the student that their concerns may be shared with school personnel for academic assistance.',
          D: 'Explain that information will only be disclosed when the student personally requests additional support.',
        },
      },
      {
        id: 'cls_q2',
        roomId: 'classroom',
        patientIndex: 2,
        patientName: 'Client 02 · Maya',
        patientRole: 'School Administrator Case',
        modelFile: 'female2.glb',
        scale: 1.73,
        prompt:
          "A school administrator asks for details from a student's private counseling session after the student reports difficulty completing assignments. What should the counselor do?",
        options: {
          A: "Provide the administrator with a summary because the information may help improve the student's academic standing.",
          B: "Share only the student's academic concerns while withholding the personal details discussed during the session.",
          C: "Explain the confidentiality obligation and obtain the student's permission before sharing relevant information.",
          D: "Allow the administrator to access the counseling notes because the request concerns the student's school performance.",
        },
      },
      {
        id: 'cls_q3',
        roomId: 'classroom',
        patientIndex: 3,
        patientName: 'Client 03 · Liam',
        patientRole: 'Anxious Student',
        modelFile: 'male2.glb',
        scale: 1.75,
        prompt:
          'A student experiencing school-related anxiety is reluctant to involve their family, and no immediate safety risk has been identified. What is the MOST appropriate response?',
        options: {
          A: "Respect the student's concerns while exploring their emotional needs and identifying suitable support strategies.",
          B: "Contact the student's family immediately because emotional concerns should always involve parental participation.",
          C: 'Require the student to discuss the concern with their family before providing additional counseling assistance.',
          D: 'Postpone further discussion until the student becomes comfortable sharing the concern with a family member.',
        },
      },
      {
        id: 'cls_q4',
        roomId: 'classroom',
        patientIndex: 4,
        patientName: 'Client 04 · Chloe',
        patientRole: 'Records Privacy Case',
        modelFile: 'female4.glb',
        scale: 1.73,
        prompt:
          'A counselor discovers that a file containing student career-planning notes has been saved to a shared computer accessible to other students. What should the counselor do?',
        options: {
          A: 'Leave the file in place but rename it to prevent other students from recognizing its contents.',
          B: 'Delete the file immediately without documenting the incident to prevent further unauthorized access.',
          C: 'Secure the file, restrict unauthorized access, and follow appropriate procedures for reporting the privacy incident.',
          D: 'Transfer the file to another shared folder where only students from the same academic section can access it.',
        },
      },
      {
        id: 'cls_q5',
        roomId: 'classroom',
        patientIndex: 5,
        patientName: 'Client 05 · Noah',
        patientRole: 'Family Inquiry Case',
        modelFile: 'male1.glb',
        scale: 1.76,
        prompt:
          "A student's older sibling contacts the counselor and requests information about the student's recent counseling sessions. The sibling explains that the family wants to understand the student's career uncertainty and provide guidance. What is the MOST appropriate action?",
        options: {
          A: "Share the student's concerns because family members may provide valuable support during career planning.",
          B: 'Provide general details about the sessions while withholding information considered personally sensitive.',
          C: 'Maintain confidentiality and determine whether disclosure is permitted through appropriate consent or applicable exceptions.',
          D: "Refer the sibling to the student's teachers because they may provide information about the student's academic progress.",
        },
      },
    ],
  },
  {
    id: 'library',
    name: 'Room 2',
    subtitle: 'Area 2: Academic, Career & Social/Emotional Planning',
    x: 14,
    z: -14,
    facingSign: 1,
    doorX: 14,
    doorZ: -8.6,
    wallColor: 0xcf8e88,
    roofColor: 0x5c403c,
    trimColor: 0x334155,
    questions: [
      {
        id: 'lib_q1',
        roomId: 'library',
        patientIndex: 1,
        patientName: 'Client 01 · Arthur',
        patientRole: 'Scholarship Applicant',
        modelFile: 'male4.glb',
        scale: 1.78,
        prompt:
          'A student receives a scholarship for Engineering after performing well in an entrance examination. However, the student has always been interested in Psychology and feels pressured by their family to accept the scholarship. They ask the counselor how to make a decision.',
        options: {
          A: 'Encourage accepting the scholarship because financial opportunities are difficult to obtain.',
          B: 'Help the student weigh personal interests, career goals, and scholarship conditions.',
          C: 'Recommend declining the scholarship to prevent future dissatisfaction with the course.',
          D: "Ask the family to determine whether the scholarship supports the student's future.",
        },
      },
      {
        id: 'lib_q2',
        roomId: 'library',
        patientIndex: 2,
        patientName: 'Client 02 · Dr. Vance',
        patientRole: 'College Student Case',
        modelFile: 'male1.glb',
        scale: 1.76,
        prompt:
          'A college student reports that classmates repeatedly exclude them from group activities and make insulting comments about their contributions. The student has started avoiding classes and performing poorly on group assignments because of the situation.',
        options: {
          A: 'Advise the student to ignore the behavior and focus on improving academic performance.',
          B: "Immediately confront the classmates without first exploring the student's concerns.",
          C: "Assess the student's needs and discuss appropriate support and reporting procedures.",
          D: 'Recommend transferring sections to prevent further academic and social difficulties.',
        },
      },
      {
        id: 'lib_q3',
        roomId: 'library',
        patientIndex: 3,
        patientName: 'Client 03 · Hannah',
        patientRole: 'Graduating Student',
        modelFile: 'female3.glb',
        scale: 1.72,
        prompt:
          'A graduating student visits the guidance office because they are afraid of applying for jobs. They believe their academic achievements are insufficient and compare themselves negatively with their classmates who already have employment offers.',
        options: {
          A: 'Recommend a career with fewer qualifications to avoid additional pressure.',
          B: 'Assure the student that any degree will eventually lead to stable employment.',
          C: "Explore the student's concerns and identify suitable career preparation resources.",
          D: 'Advise postponing job applications until the student becomes more confident.',
        },
      },
      {
        id: 'lib_q4',
        roomId: 'library',
        patientIndex: 4,
        patientName: 'Client 04 · Marcus',
        patientRole: 'Parent Consultation',
        modelFile: 'male2.glb',
        scale: 1.75,
        prompt:
          "A parent visits the guidance office after noticing changes in their child's behavior and academic performance. The parent requests details about the child's recent counseling session, but the student has not authorized the counselor to disclose the information.",
        options: {
          A: "Disclose the information because parents are responsible for their child's welfare.",
          B: 'Share selected details if the parent promises to use them constructively.',
          C: 'Explain confidentiality limits and seek appropriate consent before disclosure.',
          D: "Provide the complete counseling record to support the parent's decisions.",
        },
      },
      {
        id: 'lib_q5',
        roomId: 'library',
        patientIndex: 5,
        patientName: 'Client 05 · Claire',
        patientRole: 'Withdrawn Student',
        modelFile: 'female5.glb',
        scale: 1.72,
        prompt:
          'A student who previously performed well academically has recently become withdrawn and stopped participating in classroom activities. During a guidance session, the student mentions difficulty maintaining friendships, managing school responsibilities, and deciding whether to continue college.',
        options: {
          A: 'Focus on improving academic performance before addressing personal concerns.',
          B: "Recommend changing degree programs based on the student's recent difficulties.",
          C: "Explore the student's academic and social/emotional needs and identify suitable support.",
          D: "Inform the student's teachers immediately so they can monitor classroom behavior.",
        },
      },
    ],
  },
  {
    id: 'canteen',
    name: 'Room 3',
    subtitle: 'Area 3: Relationships, Boundaries & Foreseeable Harm',
    x: -14,
    z: 14,
    facingSign: -1,
    doorX: -14,
    doorZ: 8.6,
    wallColor: 0x8db6ca,
    roofColor: 0x475569,
    trimColor: 0x1e293b,
    questions: [
      {
        id: 'can_q1',
        roomId: 'canteen',
        patientIndex: 1,
        patientName: 'Client 01 · Marco',
        patientRole: 'Boundary Concern',
        modelFile: 'male4.glb',
        scale: 1.76,
        prompt:
          'A student who regularly visits the guidance office begins sending the counselor personal photographs and messages expressing affection. The student eventually asks the counselor to keep their conversations secret and meet at a nearby café after school. What is the MOST appropriate response?',
        options: {
          A: "Accept the invitation but explain that conversations should remain focused on the student's academic concerns.",
          B: 'Politely decline the invitation, establish professional boundaries, and inform the supervising guidance counselor.',
          C: 'Agree to meet briefly in a public place while reminding the student about the professional relationship.',
          D: "Ignore the messages and continue providing guidance without addressing the student's personal behavior.",
        },
      },
      {
        id: 'can_q2',
        roomId: 'canteen',
        patientIndex: 2,
        patientName: 'Client 02 · Aria',
        patientRole: 'After-Hours Contact',
        modelFile: 'female1.glb',
        scale: 1.74,
        prompt:
          'A student contacts the guidance office through a personal messaging account during the weekend. The student repeatedly asks the counselor for immediate emotional support and becomes upset when no response is received. What should the counselor do?',
        options: {
          A: 'Continue answering the messages when available while gradually reducing conversations outside working hours.',
          B: 'Stop responding to all messages and wait until the student personally visits the guidance office.',
          C: 'Explain appropriate communication boundaries and direct the student to approved support and emergency channels.',
          D: 'Respond through the personal account but remind the student that immediate replies cannot always be guaranteed.',
        },
      },
      {
        id: 'can_q3',
        roomId: 'canteen',
        patientIndex: 3,
        patientName: 'Client 03 · Owen',
        patientRole: 'Crisis Intervention',
        modelFile: 'male1.glb',
        scale: 1.76,
        prompt:
          "A student tells the counselor that they have been experiencing severe emotional distress and have decided to jump from the school's upper floor after classes. The student asks the counselor not to inform anyone because they fear being judged. What is the MOST appropriate action?",
        options: {
          A: 'Encourage the student to reconsider and arrange another counseling session before informing other individuals.',
          B: "Respect the student's request while suggesting that they contact a trusted person for emotional support.",
          C: 'Immediately activate safety procedures, maintain supervision, and involve appropriate emergency support personnel.',
          D: 'Ask the student to explain their feelings further before deciding whether the situation requires intervention.',
        },
      },
      {
        id: 'can_q4',
        roomId: 'canteen',
        patientIndex: 4,
        patientName: 'Client 04 · Toby',
        patientRole: 'Threat Assessment',
        modelFile: 'male3.glb',
        scale: 1.62,
        prompt:
          'A student reports that another classmate has been spreading humiliating rumors about them. During the conversation, the student reveals that they intend to wait outside the classroom with a metal object to seriously injure the classmate. What should the counselor do?',
        options: {
          A: 'Encourage the student to avoid the classmate and arrange a mediation session to resolve the disagreement.',
          B: 'Ask the student to surrender the object voluntarily before deciding whether further action is necessary.',
          C: 'Immediately assess the threat, alert appropriate school personnel, and implement measures to protect those involved.',
          D: 'Allow the student to explain the conflict completely before notifying anyone about the possible threat.',
        },
      },
      {
        id: 'can_q5',
        roomId: 'canteen',
        patientIndex: 5,
        patientName: 'Client 05 · Daniel',
        patientRole: 'Risk Screening',
        modelFile: 'male2.glb',
        scale: 1.75,
        prompt:
          'A student tells the counselor that they have recently imagined pushing a classmate down the stairs after repeated arguments. The student says they have not made a plan but admits that they sometimes struggle to control their anger. What is the MOST appropriate response?',
        options: {
          A: 'Reassure the student that their thoughts are confidential and recommend avoiding the classmate temporarily.',
          B: 'Immediately report the student as a serious threat because violent thoughts always indicate an intention to act.',
          C: "Explore the student's statements through appropriate risk assessment and consult the supervising counselor about safety measures.",
          D: 'Recommend relaxation activities and schedule another session before considering additional protective measures.',
        },
      },
    ],
  },
  {
    id: 'principal',
    name: 'Room 4',
    subtitle: 'Area 4: Bullying, Harassment, Discrimination & Bias',
    x: 14,
    z: 14,
    facingSign: -1,
    doorX: 14,
    doorZ: 8.6,
    wallColor: 0x9dc78f,
    roofColor: 0x4a5d46,
    trimColor: 0x334155,
    questions: [
      {
        id: 'pri_q1',
        roomId: 'principal',
        patientIndex: 1,
        patientName: 'Client 01 · Dr. Reyes',
        patientRole: 'Cyberbullying Report',
        modelFile: 'female4.glb',
        scale: 1.74,
        prompt:
          'A student reports that an anonymous account has posted humiliating messages about them and that they are afraid to attend class. They ask the counselor to keep it secret. What should the counselor do?',
        options: {
          A: "Respect the student's request and recommend blocking the account to prevent further online interactions.",
          B: "Assess the student's well-being, explain confidentiality limits, and follow appropriate reporting and intervention procedures.",
          C: 'Contact the account owner privately and request removal of the messages before informing school personnel.',
          D: 'Encourage the student to ignore the posts and continue attending classes while monitoring the situation.',
        },
      },
      {
        id: 'pri_q2',
        roomId: 'principal',
        patientIndex: 2,
        patientName: 'Client 02 · Mr. Santos',
        patientRole: 'Religious Bias Report',
        modelFile: 'male4.glb',
        scale: 1.78,
        prompt:
          "A student reports that peers repeatedly ridicule a classmate's religious clothing. A staff member says it is not a serious matter. What should the counselor do?",
        options: {
          A: 'Advise the affected student to avoid reacting because the remarks may not reflect intentional discrimination.',
          B: 'Encourage the students to discuss their differences and resolve the situation without further involvement.',
          C: 'Recognize the behavior as possible religious discrimination, document the concern, and follow appropriate school procedures.',
          D: 'Ask the staff member to address the behavior informally before considering whether further intervention is necessary.',
        },
      },
      {
        id: 'pri_q3',
        roomId: 'principal',
        patientIndex: 3,
        patientName: 'Client 03 · Victor',
        patientRole: 'Harassment Protection',
        modelFile: 'male3.glb',
        scale: 1.68,
        prompt:
          'A student reports discriminatory comments about their sexual orientation and worries that reporting them may reveal private information. What is the MOST appropriate action?',
        options: {
          A: "Inform the student's family immediately so they can provide support and prevent further emotional distress.",
          B: "Avoid documenting the incident to protect the student's identity and prevent possible disclosure to others.",
          C: "Assess the student's safety, protect confidential information, and follow appropriate procedures to address the harassment.",
          D: 'Encourage the student to disclose their identity publicly so classmates can better understand their experiences.',
        },
      },
      {
        id: 'pri_q4',
        roomId: 'principal',
        patientIndex: 4,
        patientName: 'Client 04 · Elena',
        patientRole: 'Ethnic Bias Incident',
        modelFile: 'female5.glb',
        scale: 1.73,
        prompt:
          "Students circulate a meme mocking a classmate's ethnic background and say it is only humor. What should the counselor do?",
        options: {
          A: 'Ask the students to remove the meme and apologize before determining whether further action is necessary.',
          B: 'Recognize the incident as potentially discriminatory, document relevant information, and follow established reporting procedures.',
          C: 'Explain the importance of cultural sensitivity and allow the students to resolve the misunderstanding independently.',
          D: "Advise the targeted student to avoid the group while waiting for the school to determine the students' intentions.",
        },
      },
      {
        id: 'pri_q5',
        roomId: 'principal',
        patientIndex: 5,
        patientName: 'Client 05 · Camille',
        patientRole: 'Disability Respect Case',
        modelFile: 'female3.glb',
        scale: 1.73,
        prompt:
          'A student reports repeated degrading remarks by a staff member about students with disabilities and fears retaliation. What should the counselor do?',
        options: {
          A: 'Encourage the student to confront the staff member directly and explain how the comments affect them.',
          B: "Promise complete confidentiality while privately discussing the staff member's behavior with other students.",
          C: 'Listen to the concern, assess possible risks, explain confidentiality limits, and follow appropriate reporting procedures.',
          D: 'Advise the student to transfer classes while waiting for additional complaints before taking formal action.',
        },
      },
    ],
  },
];

export const TOTAL_PRE_QUESTIONS = PRE_SIMULATION_QUESTIONS.length;

export const TOTAL_QUESTIONNAIRES = CAMPUS_ROOMS.reduce(
  (sum, room) => sum + room.questions.length,
  0
);

const AREA_TO_ROOM: Record<CounselingAreaId, RoomId> = {
  area1: 'classroom',
  area2: 'library',
  area3: 'canteen',
  area4: 'principal',
};

const PRE_CLIENT_CAST: Record<
  RoomId,
  { name: string; role: string; modelFile: string; scale: number }[]
> = {
  classroom: [
    { name: 'Client 01 · Alex', role: 'Grade 11 Student', modelFile: 'male2.glb', scale: 1.75 },
    { name: 'Client 02 · Ms. Garcia', role: 'Faculty Inquiry', modelFile: 'female1.glb', scale: 1.73 },
    { name: 'Client 03 · Mrs. Lim', role: 'Parent Request', modelFile: 'female3.glb', scale: 1.72 },
    { name: 'Client 04 · Sam', role: 'Overwhelmed Student', modelFile: 'male1.glb', scale: 1.76 },
    { name: 'Client 05 · Pia', role: 'Concerned Classmate', modelFile: 'female4.glb', scale: 1.73 },
  ],
  library: [
    { name: 'Client 01 · Ethan', role: '3rd-Year Student', modelFile: 'male3.glb', scale: 1.66 },
    { name: 'Client 02 · Kara', role: 'Attendance Concern', modelFile: 'female2.glb', scale: 1.73 },
    { name: 'Client 03 · Miguel', role: 'Graduating Student', modelFile: 'male4.glb', scale: 1.77 },
    { name: 'Client 04 · Mr. Cruz', role: 'Subject Teacher', modelFile: 'male1.glb', scale: 1.76 },
    { name: 'Client 05 · Nina', role: 'Scholarship Decision', modelFile: 'female5.glb', scale: 1.72 },
  ],
  canteen: [
    { name: 'Client 01 · Ryan', role: 'Boundary Concern', modelFile: 'male2.glb', scale: 1.75 },
    { name: 'Client 02 · Bea', role: 'After-Hours Contact', modelFile: 'female4.glb', scale: 1.73 },
    { name: 'Client 03 · Lance', role: 'Crisis Disclosure', modelFile: 'male4.glb', scale: 1.78 },
    { name: 'Client 04 · Paolo', role: 'Safety Threat Case', modelFile: 'male3.glb', scale: 1.64 },
    { name: 'Client 05 · Sofia', role: 'Harm Risk Screening', modelFile: 'female1.glb', scale: 1.74 },
  ],
  principal: [
    { name: 'Client 01 · Zoe', role: 'Group Chat Harassment', modelFile: 'female5.glb', scale: 1.73 },
    { name: 'Client 02 · Omar', role: 'Religious Mockery', modelFile: 'male1.glb', scale: 1.76 },
    { name: 'Client 03 · Jamie', role: 'Identity Protection', modelFile: 'female2.glb', scale: 1.73 },
    { name: 'Client 04 · Carlo', role: 'Ethnic Bias Incident', modelFile: 'male2.glb', scale: 1.75 },
    { name: 'Client 05 · Dana', role: 'Disability Respect Case', modelFile: 'female3.glb', scale: 1.72 },
  ],
};

export const PRE_CAMPUS_ROOMS: RoomConfig[] = CAMPUS_ROOMS.map((room) => {
  const preItems = PRE_SIMULATION_QUESTIONS.filter((q) => AREA_TO_ROOM[q.areaId] === room.id);
  const cast = PRE_CLIENT_CAST[room.id];
  return {
    ...room,
    questions: preItems.map((q, idx) => {
      const npc = cast[idx % cast.length];
      return {
        id: q.id,
        roomId: room.id,
        patientIndex: idx + 1,
        itemNumber: q.itemNumber,
        areaTitle: q.areaTitle,
        patientName: npc.name,
        patientRole: npc.role,
        modelFile: npc.modelFile,
        scale: npc.scale,
        prompt: q.prompt,
        options: q.options,
      };
    }),
  };
});

export function getRoomsForStage(stage: SimulationStage): RoomConfig[] {
  return stage === 'pre' ? PRE_CAMPUS_ROOMS : CAMPUS_ROOMS;
}
