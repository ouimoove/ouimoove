// Fixed content for Ouimoove Weddings: the journey steps, the checklist
// templates, budget categories, vendor categories and pick-lists.
// Every label is bilingual ({ fr, en }); `L()` in i18n.jsx picks one.

export const STEP_KINDS = ['knocking', 'dowry', 'civil', 'religious', 'reception', 'honeymoon']

export const STEPS = {
  knocking: {
    icon: '🚪', order: 1, onSite: false,
    fr: 'Toquer à la porte', en: 'Knocking',
    blurb: { fr: 'Première visite officielle à la famille de la mariée pour demander sa main.', en: "First formal visit to the bride's family to ask for her hand." },
  },
  dowry: {
    icon: '🎁', order: 2, onSite: true,
    fr: 'Dot & mariage coutumier', en: 'Dowry & traditional wedding',
    blurb: { fr: 'La famille du marié apporte la liste demandée ; les deux familles scellent l’union.', en: "The groom's family brings the requested list; both families seal the union." },
  },
  civil: {
    icon: '🏛️', order: 3, onSite: true,
    fr: 'Mariage civil', en: 'Civil wedding',
    blurb: { fr: 'À la mairie, devant l’officier d’état civil et vos témoins.', en: 'At the town hall, before the registrar and your witnesses.' },
  },
  religious: {
    icon: '⛪', order: 4, onSite: true,
    fr: 'Mariage religieux', en: 'Religious wedding',
    blurb: { fr: 'À l’église, à la mosquée ou selon votre foi.', en: 'At church, at the mosque or according to your faith.' },
  },
  reception: {
    icon: '🥂', order: 5, onSite: true,
    fr: 'Réception', en: 'Reception',
    blurb: { fr: 'La grande fête avec vos invités.', en: 'The big celebration with your guests.' },
  },
  honeymoon: {
    icon: '✈️', order: 6, onSite: false,
    fr: 'Lune de miel', en: 'Honeymoon',
    blurb: { fr: 'Votre voyage à deux après le mariage.', en: 'Your trip together after the wedding.' },
  },
  custom: {
    icon: '✨', order: 7, onSite: true,
    fr: 'Autre étape', en: 'Other event',
    blurb: { fr: 'Fiançailles, henné, send-off, enterrement de vie de célibataire…', en: 'Engagement party, henna night, send-off, bachelor parties…' },
  },
}

export const RELIGIOUS_VARIANTS = {
  church: { icon: '⛪', fr: "Mariage à l'église", en: 'Church wedding' },
  mosque: { icon: '🕌', fr: 'Mariage à la mosquée', en: 'Mosque wedding (nikah)' },
  other: { icon: '🕊️', fr: 'Autre cérémonie religieuse', en: 'Other religious ceremony' },
}

// Extra events anyone can add; cultures suggest more (cultures.js → extras).
export const COMMON_EXTRAS = [
  { id: 'engagement', fr: 'Fiançailles / demande', en: 'Engagement / proposal' },
  { id: 'bachelor', fr: 'EVG / EVJF', en: 'Bachelor & bachelorette parties' },
  { id: 'photoshoot', fr: 'Séance photo pré-mariage', en: 'Pre-wedding photo shoot' },
  { id: 'thanksgiving', fr: "Messe / culte d'action de grâce", en: 'Thanksgiving service' },
]

// Guidance shared by every culture, per step.
export const STEP_GUIDE = {
  knocking: {
    fr: [
      'Qui y va : le marié avec ses parents (ou leurs représentants), des oncles et tantes, et un porte-parole qui parle au nom de la famille.',
      'À convenir ce jour-là : la date de la dot, la liste, et la personne à contacter dans chaque famille.',
      "Habillez-vous sobrement et arrivez à l'heure : c'est la première impression de votre famille.",
    ],
    en: [
      'Who goes: the groom with his parents (or their representatives), uncles and aunts, and a spokesperson who speaks for the family.',
      "What to agree that day: the dowry date, the list, and the contact person in each family.",
      "Dress modestly and be on time: it is your family's first impression.",
    ],
  },
  dowry: {
    fr: [
      'Faites valider la liste par écrit, ligne par ligne, avant de tout acheter.',
      "Le lieu est souvent chez la famille de la mariée : clarifiez qui prend en charge bâches, chaises, repas et boissons.",
      'Chaque famille désigne un porte-parole ; préparez le vôtre (noms, ordre de présentation des présents).',
      'Emballez et étiquetez chaque présent avec son destinataire (père, mère, frères, famille…).',
    ],
    en: [
      'Have the list confirmed in writing, line by line, before buying everything.',
      "It is often held at the bride's family home: agree on who pays for tents, chairs, food and drinks.",
      'Each family chooses a spokesperson; brief yours (names, order in which the gifts are presented).',
      'Pack and label each gift with who it is for (father, mother, brothers, family…).',
    ],
  },
  civil: {
    fr: [
      "Choisissez la mairie (souvent celle où l'un de vous habite) et réservez la date tôt.",
      "Dossier habituel : actes de naissance, pièces d'identité, justificatifs de domicile et pièces des témoins. Certaines mairies demandent un certificat médical prénuptial : demandez la liste exacte.",
      'Les bans sont publiés avant la cérémonie : renseignez-vous sur le délai.',
      "Vous déclarerez votre régime matrimonial (communauté ou séparation de biens) et, selon le pays, d'autres options : parlez-en ensemble avant.",
    ],
    en: [
      'Choose the town hall (often where one of you lives) and book the date early.',
      "Usual file: birth certificates, IDs, proof of address and the witnesses' IDs. Some town halls ask for a premarital medical certificate: ask for the exact list.",
      'The banns are published before the ceremony: ask how long that takes.',
      'You will declare your property regime (joint or separate) and, depending on the country, other options: discuss them together beforehand.',
    ],
  },
  religious: {
    church: {
      fr: ['Contactez la paroisse au moins 6 mois avant : la plupart demandent une préparation au mariage et des certificats de baptême.', 'Prévoyez chorale, lectures, quête et fleurs.'],
      en: ['Contact the parish at least 6 months ahead: most require marriage preparation and baptism certificates.', 'Plan the choir, readings, offering and flowers.'],
    },
    mosque: {
      fr: ["Le mariage religieux demande le consentement des deux époux, des témoins et une dot convenue ; dans beaucoup d'écoles, le tuteur (wali) de la mariée est présent.", "Contactez l'imam tôt pour fixer la date."],
      en: ["The religious marriage requires both spouses' consent, witnesses and an agreed mahr; in many schools the bride's guardian (wali) is present.", 'Contact the imam early to set the date.'],
    },
    other: {
      fr: ["Parlez tôt avec l'officiant de ses exigences et du calendrier."],
      en: ['Talk to your officiant early about requirements and timing.'],
    },
  },
  reception: {
    fr: [
      "Réservez d'abord la salle, puis le traiteur ; vérifiez que la capacité correspond à votre liste.",
      "Si les familles portent le même pagne (aso ebi / uniforme), choisissez-le et commandez-le 3 à 4 mois avant.",
      "Écrivez le déroulé : entrée des mariés, discours, première danse, gâteau, moment des cadeaux.",
    ],
    en: [
      'Book the venue first, then the caterer; check the capacity matches your guest list.',
      'If the families wear the same fabric (aso ebi / uniform), choose and order it 3 to 4 months ahead.',
      'Write the programme: entrance, speeches, first dance, cake, gift time.',
    ],
  },
  honeymoon: {
    fr: [
      'Vérifiez tôt passeports et visas ; certaines destinations exigent un certificat de vaccination contre la fièvre jaune.',
      'Réservez vols et hôtel 3 à 4 mois avant, et gardez quelques jours de repos après la réception.',
    ],
    en: [
      'Check passports and visas early; some destinations require a yellow fever vaccination certificate.',
      'Book flights and hotel 3 to 4 months ahead, and keep a few days to rest after the reception.',
    ],
  },
  custom: { fr: [], en: [] },
}

// Checklist templates. `kind` ties a task to a step; 'main' = the main
// wedding day (reception, else religious, else civil). `days` is relative to
// that date (negative = before).
export const TASK_TEMPLATES = [
  { id: 'budget_set', kind: 'main', days: -365, who: 'both', fr: 'Fixer le budget global avec vos familles', en: 'Agree on the overall budget with your families' },
  { id: 'guests_draft', kind: 'main', days: -330, who: 'both', fr: "Dresser la première liste d'invités (lui / elle)", en: 'Draft the first guest list (his / hers)' },
  { id: 'style_choose', kind: 'main', days: -330, who: 'both', fr: 'Choisir le style, les couleurs et le thème', en: 'Choose your style, colours and theme' },
  { id: 'planner_hire', kind: 'main', days: -300, who: 'both', fr: 'Choisir un·e wedding planner (facultatif)', en: 'Hire a wedding planner (optional)' },
  { id: 'website_create', kind: 'main', days: -270, who: 'both', fr: 'Créer votre site de mariage', en: 'Create your wedding website' },
  { id: 'hashtag_pick', kind: 'main', days: -270, who: 'both', fr: 'Choisir votre hashtag et votre slogan', en: 'Pick your hashtag and slogan' },

  { id: 'knock_tell_parents', kind: 'knocking', days: -42, who: 'groom', fr: 'Informer vos parents et choisir la délégation', en: 'Tell your parents and choose the delegation' },
  { id: 'knock_spokesperson', kind: 'knocking', days: -35, who: 'family', fr: 'Choisir le porte-parole de la famille', en: "Choose the family's spokesperson" },
  { id: 'knock_date', kind: 'knocking', days: -28, who: 'family', fr: 'Convenir de la date avec la famille de la mariée', en: "Agree on the date with the bride's family" },
  { id: 'knock_buy', kind: 'knocking', days: -14, who: 'groom', fr: "Acheter les boissons et préparer l'enveloppe", en: 'Buy the drinks and prepare the envelope' },
  { id: 'knock_confirm', kind: 'knocking', days: -3, who: 'groom', fr: 'Confirmer les participants et le transport', en: 'Confirm who is coming and transport' },
  { id: 'knock_list', kind: 'knocking', days: 1, who: 'both', fr: 'Noter la liste de la dot reçue dans Ouimoove', en: 'Enter the dowry list you received in Ouimoove' },

  { id: 'dowry_review', kind: 'dowry', days: -90, who: 'groom', fr: 'Relire la liste avec votre famille et la budgéter', en: 'Review the list with your family and budget it' },
  { id: 'dowry_cloth', kind: 'dowry', days: -60, who: 'groom', fr: 'Acheter pagnes, bijoux et articles de la valise', en: 'Buy the fabrics, jewellery and suitcase items' },
  { id: 'dowry_venue', kind: 'dowry', days: -45, who: 'family', fr: 'Organiser le lieu (bâches, chaises, sono) avec la famille hôte', en: 'Arrange the venue (tents, chairs, sound) with the host family' },
  { id: 'dowry_catering', kind: 'dowry', days: -30, who: 'family', fr: 'Prévoir le repas et les boissons de la cérémonie', en: 'Plan food and drinks for the ceremony' },
  { id: 'dowry_outfits', kind: 'dowry', days: -30, who: 'both', fr: 'Préparer les tenues traditionnelles du couple', en: "Prepare the couple's traditional outfits" },
  { id: 'dowry_drinks', kind: 'dowry', days: -14, who: 'groom', fr: 'Acheter les boissons de la dot', en: 'Buy the dowry drinks' },
  { id: 'dowry_pack', kind: 'dowry', days: -3, who: 'groom', fr: 'Emballer et étiqueter tous les présents', en: 'Pack and label every gift' },
  { id: 'dowry_envelopes', kind: 'dowry', days: -2, who: 'groom', fr: 'Préparer les enveloppes (père, mère, famille…)', en: 'Prepare the envelopes (father, mother, family…)' },

  { id: 'civil_book', kind: 'civil', days: -90, who: 'both', fr: 'Choisir la mairie et réserver la date', en: 'Choose the town hall and book the date' },
  { id: 'civil_docs', kind: 'civil', days: -75, who: 'both', fr: 'Rassembler les pièces du dossier de mariage', en: 'Gather the documents for the marriage file' },
  { id: 'civil_witness', kind: 'civil', days: -60, who: 'both', fr: 'Choisir vos témoins', en: 'Choose your witnesses' },
  { id: 'civil_banns', kind: 'civil', days: -45, who: 'both', fr: 'Déposer le dossier et faire publier les bans', en: 'Submit the file and have the banns published' },
  { id: 'civil_regime', kind: 'civil', days: -30, who: 'both', fr: 'Choisir votre régime matrimonial', en: 'Choose your property regime' },
  { id: 'civil_rings', kind: 'civil', days: -30, who: 'both', fr: 'Acheter les alliances', en: 'Buy the wedding rings' },

  { id: 'relig_book', kind: 'religious', days: -240, who: 'both', fr: "Réserver l'église / la mosquée et l'officiant", en: 'Book the church / mosque and officiant' },
  { id: 'relig_prep', kind: 'religious', days: -180, who: 'both', fr: 'Suivre la préparation au mariage', en: 'Attend marriage preparation' },
  { id: 'relig_music', kind: 'religious', days: -60, who: 'both', fr: 'Choisir chants, chorale et lectures', en: 'Choose songs, choir and readings' },
  { id: 'relig_rehearsal', kind: 'religious', days: -3, who: 'both', fr: 'Faire la répétition', en: 'Hold the rehearsal' },

  { id: 'venue_book', kind: 'reception', days: -300, who: 'both', fr: 'Réserver la salle de réception', en: 'Book the reception venue' },
  { id: 'caterer_book', kind: 'reception', days: -270, who: 'both', fr: 'Réserver le traiteur et prévoir les boissons', en: 'Book the caterer and plan the drinks' },
  { id: 'photo_book', kind: 'reception', days: -240, who: 'both', fr: 'Réserver photographe et vidéaste', en: 'Book the photographer and videographer' },
  { id: 'decor_book', kind: 'reception', days: -210, who: 'bride', fr: 'Réserver le décorateur et le fleuriste', en: 'Book the decorator and florist' },
  { id: 'music_book', kind: 'reception', days: -210, who: 'groom', fr: 'Réserver DJ / orchestre et MC', en: 'Book the DJ / band and MC' },
  { id: 'attire_order', kind: 'reception', days: -180, who: 'both', fr: 'Commander robe, costume et tenues', en: 'Order the dress, suit and outfits' },
  { id: 'fabric_choose', kind: 'reception', days: -150, who: 'both', fr: 'Choisir et commander le pagne des familles (aso ebi / uniforme)', en: 'Choose and order the family fabric (aso ebi / uniform)' },
  { id: 'savethedate', kind: 'reception', days: -150, who: 'both', fr: 'Envoyer les save-the-date (WhatsApp, site)', en: 'Send save-the-dates (WhatsApp, website)' },
  { id: 'makeup_book', kind: 'reception', days: -120, who: 'bride', fr: 'Réserver coiffure et maquillage', en: 'Book hair and make-up' },
  { id: 'cake_book', kind: 'reception', days: -120, who: 'both', fr: 'Commander le gâteau', en: 'Order the cake' },
  { id: 'cars_book', kind: 'reception', days: -90, who: 'groom', fr: 'Réserver les voitures', en: 'Book the wedding cars' },
  { id: 'invites_send', kind: 'reception', days: -60, who: 'both', fr: 'Envoyer les invitations', en: 'Send the invitations' },
  { id: 'seating_plan', kind: 'reception', days: -30, who: 'both', fr: 'Finaliser le plan de table', en: 'Finalise the seating plan' },
  { id: 'rsvp_chase', kind: 'reception', days: -21, who: 'both', fr: "Relancer les invités qui n'ont pas répondu", en: "Follow up guests who haven't replied" },
  { id: 'vendors_confirm', kind: 'reception', days: -7, who: 'both', fr: 'Confirmer horaires et soldes avec tous les prestataires', en: 'Confirm timings and balances with every vendor' },
  { id: 'program_final', kind: 'reception', days: -7, who: 'both', fr: 'Finaliser le déroulé de la soirée', en: "Finalise the evening's programme" },
  { id: 'thanks_send', kind: 'reception', days: 14, who: 'both', fr: 'Envoyer les remerciements', en: 'Send thank-you messages' },
  { id: 'memoir_make', kind: 'reception', days: 30, who: 'both', fr: 'Créer votre mémoire de mariage', en: 'Create your wedding memoir' },

  { id: 'honey_choose', kind: 'honeymoon', days: -180, who: 'both', fr: 'Choisir la destination', en: 'Choose the destination' },
  { id: 'honey_passport', kind: 'honeymoon', days: -150, who: 'both', fr: 'Vérifier passeports, visas et vaccins', en: 'Check passports, visas and vaccinations' },
  { id: 'honey_book', kind: 'honeymoon', days: -120, who: 'both', fr: 'Réserver vols et hôtel', en: 'Book flights and hotel' },
  { id: 'honey_insurance', kind: 'honeymoon', days: -30, who: 'both', fr: 'Prendre une assurance voyage', en: 'Get travel insurance' },
  { id: 'honey_pack', kind: 'honeymoon', days: -3, who: 'both', fr: 'Faire les valises', en: 'Pack' },
]
export const TASK_BY_ID = Object.fromEntries(TASK_TEMPLATES.map((t) => [t.id, t]))

export const ASSIGNEES = {
  groom: { fr: 'Marié', en: 'Groom' },
  bride: { fr: 'Mariée', en: 'Bride' },
  both: { fr: 'Les deux', en: 'Both' },
  planner: { fr: 'Organisateur', en: 'Planner' },
  family: { fr: 'Famille', en: 'Family' },
}

// Budget envelopes. `weight` is the default share (sums to 100); `needs`
// drops a category when none of those steps is planned.
export const BUDGET_CATEGORIES = [
  { id: 'tradition', icon: '🎁', weight: 12, needs: ['knocking', 'dowry'], fr: 'Cérémonies traditionnelles & dot', en: 'Traditional ceremonies & dowry' },
  { id: 'venue', icon: '🏛️', weight: 15, fr: 'Lieux & salles', en: 'Venues' },
  { id: 'catering', icon: '🍽️', weight: 24, fr: 'Traiteur & boissons', en: 'Food & drinks' },
  { id: 'decor', icon: '💐', weight: 10, fr: 'Décoration & fleurs', en: 'Decor & flowers' },
  { id: 'attire', icon: '👗', weight: 10, fr: 'Tenues, pagnes & alliances', en: 'Outfits, fabrics & rings' },
  { id: 'photo', icon: '📸', weight: 6, fr: 'Photo & vidéo', en: 'Photo & video' },
  { id: 'music', icon: '🎶', weight: 4, fr: 'Musique, DJ & MC', en: 'Music, DJ & MC' },
  { id: 'beauty', icon: '💄', weight: 2, fr: 'Coiffure & maquillage', en: 'Hair & make-up' },
  { id: 'transport', icon: '🚗', weight: 3, fr: 'Transport', en: 'Transport' },
  { id: 'cake', icon: '🎂', weight: 2, fr: 'Gâteau', en: 'Cake' },
  { id: 'stationery', icon: '✉️', weight: 1, fr: 'Faire-part & site', en: 'Invitations & website' },
  { id: 'admin', icon: '📄', weight: 1, needs: ['civil', 'religious'], fr: 'Formalités (mairie, église…)', en: 'Formalities (fees)' },
  { id: 'honeymoon', icon: '✈️', weight: 7, needs: ['honeymoon'], fr: 'Lune de miel', en: 'Honeymoon' },
  { id: 'other', icon: '🧾', weight: 3, fr: 'Imprévus', en: 'Contingency' },
]
export const BUDGET_CAT_BY_ID = Object.fromEntries(BUDGET_CATEGORIES.map((c) => [c.id, c]))

// Vendor lines created with a new plan, so the bookings list starts useful.
export const STARTER_BOOKINGS = [
  { kind: 'reception', category: 'venue', fr: 'Salle de réception', en: 'Reception venue' },
  { kind: 'reception', category: 'catering', fr: 'Traiteur', en: 'Caterer' },
  { kind: 'reception', category: 'catering', fr: 'Boissons', en: 'Drinks' },
  { kind: 'reception', category: 'decor', fr: 'Décoration & fleurs', en: 'Decor & flowers' },
  { kind: 'reception', category: 'music', fr: 'DJ / orchestre', en: 'DJ / band' },
  { kind: 'reception', category: 'music', fr: 'MC / animateur', en: 'MC / host' },
  { kind: 'reception', category: 'photo', fr: 'Photographe', en: 'Photographer' },
  { kind: 'reception', category: 'photo', fr: 'Vidéaste', en: 'Videographer' },
  { kind: 'reception', category: 'cake', fr: 'Gâteau', en: 'Cake' },
  { kind: 'reception', category: 'transport', fr: 'Voitures', en: 'Wedding cars' },
  { kind: 'reception', category: 'beauty', fr: 'Coiffure & maquillage', en: 'Hair & make-up' },
  { kind: 'reception', category: 'attire', fr: 'Robe de la mariée', en: "Bride's dress" },
  { kind: 'reception', category: 'attire', fr: 'Costume du marié', en: "Groom's suit" },
  { kind: 'reception', category: 'stationery', fr: 'Faire-part', en: 'Invitations' },
  { kind: 'religious', category: 'admin', fr: 'Église / mosquée (frais)', en: 'Church / mosque (fees)' },
  { kind: 'civil', category: 'admin', fr: 'Frais de mairie', en: 'Town hall fees' },
  { kind: 'civil', category: 'attire', fr: 'Alliances', en: 'Wedding rings' },
  { kind: 'dowry', category: 'tradition', fr: 'Bâches, chaises & sono', en: 'Tents, chairs & sound' },
  { kind: 'dowry', category: 'tradition', fr: 'Repas & boissons de la dot', en: 'Food & drinks for the dowry' },
  { kind: 'dowry', category: 'attire', fr: 'Pagne des familles (uniforme)', en: 'Family fabric (uniform)' },
  { kind: 'honeymoon', category: 'honeymoon', fr: 'Vols', en: 'Flights' },
  { kind: 'honeymoon', category: 'honeymoon', fr: 'Hôtel', en: 'Hotel' },
]

export const BOOKING_STATUSES = {
  planned: { fr: 'À trouver', en: 'To find', tone: 'muted' },
  contacted: { fr: 'Contacté', en: 'Contacted', tone: 'info' },
  quoted: { fr: 'Devis reçu', en: 'Quote received', tone: 'info' },
  booked: { fr: 'Réservé', en: 'Booked', tone: 'good' },
  paid: { fr: 'Payé', en: 'Paid', tone: 'good' },
  cancelled: { fr: 'Annulé', en: 'Cancelled', tone: 'bad' },
}

export const RECIPIENTS = {
  bride: { fr: 'Mariée', en: 'Bride' },
  father: { fr: 'Père', en: 'Father' },
  mother: { fr: 'Mère', en: 'Mother' },
  family: { fr: 'Famille', en: 'Family' },
  brothers: { fr: 'Frères', en: 'Brothers' },
  sisters: { fr: 'Sœurs', en: 'Sisters' },
  uncles: { fr: 'Oncles', en: 'Uncles' },
  aunts: { fr: 'Tantes', en: 'Aunts' },
  elders: { fr: 'Aînés', en: 'Elders' },
  other: { fr: 'Autre', en: 'Other' },
}

export const DOWRY_CATEGORIES = {
  drinks: { icon: '🍾', fr: 'Boissons', en: 'Drinks' },
  cloth: { icon: '🧵', fr: 'Pagnes & tenues', en: 'Fabrics & clothing' },
  jewelry: { icon: '💍', fr: 'Bijoux', en: 'Jewellery' },
  cash: { icon: '✉️', fr: 'Enveloppes', en: 'Envelopes' },
  food: { icon: '🧺', fr: 'Vivres', en: 'Food' },
  household: { icon: '🧳', fr: 'Maison & valise', en: 'Home & suitcase' },
  beauty: { icon: '🌸', fr: 'Beauté', en: 'Beauty' },
  livestock: { icon: '🐐', fr: 'Bétail', en: 'Livestock' },
  symbolic: { icon: '🪶', fr: 'Symbolique', en: 'Symbolic' },
  other: { icon: '🎀', fr: 'Autre', en: 'Other' },
}

export const DOWRY_STATUSES = {
  todo: { fr: 'À acheter', en: 'To buy' },
  bought: { fr: 'Acheté', en: 'Bought' },
  ready: { fr: 'Emballé', en: 'Packed' },
}

export const UNITS = {
  bottle: { fr: 'bouteille', frPl: 'bouteilles', en: 'bottle', enPl: 'bottles' },
  piece: { fr: 'pièce', frPl: 'pièces', en: 'piece', enPl: 'pieces' },
  pair: { fr: 'paire', frPl: 'paires', en: 'pair', enPl: 'pairs' },
  crate: { fr: 'casier', frPl: 'casiers', en: 'crate', enPl: 'crates' },
  carton: { fr: 'carton', frPl: 'cartons', en: 'carton', enPl: 'cartons' },
  set: { fr: 'lot', frPl: 'lots', en: 'set', enPl: 'sets' },
  envelope: { fr: 'enveloppe', frPl: 'enveloppes', en: 'envelope', enPl: 'envelopes' },
  bag: { fr: 'sac', frPl: 'sacs', en: 'bag', enPl: 'bags' },
  head: { fr: 'tête', frPl: 'têtes', en: 'head', enPl: 'head' },
  calabash: { fr: 'calebasse', frPl: 'calebasses', en: 'calabash', enPl: 'calabashes' },
  litre: { fr: 'litre', frPl: 'litres', en: 'litre', enPl: 'litres' },
}

// "2 bouteilles", "1 lot", "×3" (no unit)
export function qtyLabel(qty, unit, lang = 'fr') {
  const n = Number(qty) || 0
  const u = UNITS[unit]
  if (!u) return n === 1 ? '' : `×${n}`
  const word = lang === 'en' ? (n > 1 ? u.enPl : u.en) : (n > 1 ? u.frPl : u.fr)
  return `${n} ${word}`
}

export const GUEST_GROUPS = {
  family: { fr: 'Famille', en: 'Family' },
  friends: { fr: 'Amis', en: 'Friends' },
  work: { fr: 'Travail', en: 'Work' },
  faith: { fr: 'Église / mosquée', en: 'Church / mosque' },
  community: { fr: 'Quartier / association', en: 'Community' },
  other: { fr: 'Autre', en: 'Other' },
}

export const PRIORITIES = {
  1: { fr: 'Incontournable', en: 'Must have' },
  2: { fr: 'Souhaité', en: 'Want' },
  3: { fr: "S'il reste de la place", en: 'If there is room' },
}

export const RSVP_LABELS = {
  pending: { fr: 'En attente', en: 'Pending' },
  yes: { fr: 'Présent', en: 'Coming' },
  no: { fr: 'Absent', en: 'Not coming' },
  maybe: { fr: 'Peut-être', en: 'Maybe' },
}

export const VENDOR_CATEGORIES = [
  { id: 'planner', icon: '🗂️', fr: 'Wedding planners', en: 'Wedding planners' },
  { id: 'venue', icon: '🏛️', fr: 'Salles & lieux', en: 'Venues' },
  { id: 'catering', icon: '🍽️', fr: 'Traiteurs', en: 'Caterers' },
  { id: 'decor', icon: '💐', fr: 'Décoration & fleurs', en: 'Decor & flowers' },
  { id: 'photo', icon: '📸', fr: 'Photographes', en: 'Photographers' },
  { id: 'video', icon: '🎥', fr: 'Vidéastes', en: 'Videographers' },
  { id: 'music', icon: '🎶', fr: 'DJ & orchestres', en: 'DJs & bands' },
  { id: 'mc', icon: '🎤', fr: 'MC & animateurs', en: 'MCs & hosts' },
  { id: 'makeup', icon: '💄', fr: 'Coiffure & maquillage', en: 'Hair & make-up' },
  { id: 'attire', icon: '👗', fr: 'Tenues & couture', en: 'Outfits & tailoring' },
  { id: 'cake', icon: '🎂', fr: 'Gâteaux', en: 'Cakes' },
  { id: 'transport', icon: '🚗', fr: 'Voitures & transport', en: 'Cars & transport' },
  { id: 'jewelry', icon: '💍', fr: 'Alliances & bijoux', en: 'Rings & jewellery' },
  { id: 'stationery', icon: '✉️', fr: 'Faire-part & impression', en: 'Invitations & printing' },
  { id: 'rentals', icon: '🪑', fr: 'Location (bâches, chaises, sono)', en: 'Rentals (tents, chairs, sound)' },
  { id: 'dowry', icon: '🎁', fr: 'Articles de dot', en: 'Dowry items' },
  { id: 'honeymoon', icon: '✈️', fr: 'Voyages & lune de miel', en: 'Travel & honeymoon' },
  { id: 'other', icon: '✨', fr: 'Autres', en: 'Other' },
]
export const VENDOR_CAT_BY_ID = Object.fromEntries(VENDOR_CATEGORIES.map((c) => [c.id, c]))

// Which budget category a vendor category books into.
export const VENDOR_TO_BUDGET = {
  planner: 'other', venue: 'venue', catering: 'catering', decor: 'decor', photo: 'photo', video: 'photo',
  music: 'music', mc: 'music', makeup: 'beauty', attire: 'attire', cake: 'cake', transport: 'transport',
  jewelry: 'attire', stationery: 'stationery', rentals: 'tradition', dowry: 'tradition', honeymoon: 'honeymoon', other: 'other',
}

export const COUNTRIES = [
  { code: 'TG', fr: 'Togo', en: 'Togo', currency: 'XOF' },
  { code: 'BJ', fr: 'Bénin', en: 'Benin', currency: 'XOF' },
  { code: 'CI', fr: "Côte d'Ivoire", en: "Côte d'Ivoire", currency: 'XOF' },
  { code: 'SN', fr: 'Sénégal', en: 'Senegal', currency: 'XOF' },
  { code: 'BF', fr: 'Burkina Faso', en: 'Burkina Faso', currency: 'XOF' },
  { code: 'ML', fr: 'Mali', en: 'Mali', currency: 'XOF' },
  { code: 'NE', fr: 'Niger', en: 'Niger', currency: 'XOF' },
  { code: 'GH', fr: 'Ghana', en: 'Ghana', currency: 'GHS' },
  { code: 'NG', fr: 'Nigeria', en: 'Nigeria', currency: 'NGN' },
  { code: 'CM', fr: 'Cameroun', en: 'Cameroon', currency: 'XAF' },
  { code: 'GA', fr: 'Gabon', en: 'Gabon', currency: 'XAF' },
  { code: 'CG', fr: 'Congo', en: 'Congo', currency: 'XAF' },
  { code: 'CD', fr: 'RD Congo', en: 'DR Congo', currency: 'CDF' },
  { code: 'KE', fr: 'Kenya', en: 'Kenya', currency: 'KES' },
  { code: 'UG', fr: 'Ouganda', en: 'Uganda', currency: 'UGX' },
  { code: 'TZ', fr: 'Tanzanie', en: 'Tanzania', currency: 'TZS' },
  { code: 'RW', fr: 'Rwanda', en: 'Rwanda', currency: 'RWF' },
  { code: 'ET', fr: 'Éthiopie', en: 'Ethiopia', currency: 'ETB' },
  { code: 'ZA', fr: 'Afrique du Sud', en: 'South Africa', currency: 'ZAR' },
  { code: 'ZW', fr: 'Zimbabwe', en: 'Zimbabwe', currency: 'USD' },
  { code: 'MA', fr: 'Maroc', en: 'Morocco', currency: 'MAD' },
  { code: 'DZ', fr: 'Algérie', en: 'Algeria', currency: 'DZD' },
  { code: 'TN', fr: 'Tunisie', en: 'Tunisia', currency: 'TND' },
  { code: 'FR', fr: 'France', en: 'France', currency: 'EUR' },
  { code: 'BE', fr: 'Belgique', en: 'Belgium', currency: 'EUR' },
  { code: 'CH', fr: 'Suisse', en: 'Switzerland', currency: 'CHF' },
  { code: 'GB', fr: 'Royaume-Uni', en: 'United Kingdom', currency: 'GBP' },
  { code: 'CA', fr: 'Canada', en: 'Canada', currency: 'CAD' },
  { code: 'US', fr: 'États-Unis', en: 'United States', currency: 'USD' },
]
export const COUNTRY_BY_CODE = Object.fromEntries(COUNTRIES.map((c) => [c.code, c]))

export const CURRENCIES = ['XOF', 'XAF', 'GHS', 'NGN', 'CDF', 'KES', 'UGX', 'TZS', 'RWF', 'ETB', 'ZAR', 'MAD', 'DZD', 'TND', 'EUR', 'CHF', 'GBP', 'CAD', 'USD']

export const HONEYMOON_IDEAS = [
  { place: 'Assinie', country: { fr: "Côte d'Ivoire", en: "Côte d'Ivoire" }, tags: { fr: 'Plage & lagune', en: 'Beach & lagoon' } },
  { place: 'Grand-Popo & Ouidah', country: { fr: 'Bénin', en: 'Benin' }, tags: { fr: 'Plage & histoire', en: 'Beach & history' } },
  { place: 'Kribi', country: { fr: 'Cameroun', en: 'Cameroon' }, tags: { fr: 'Plage & chutes de la Lobé', en: 'Beach & Lobé falls' } },
  { place: 'Saly & Sine-Saloum', country: { fr: 'Sénégal', en: 'Senegal' }, tags: { fr: 'Plage & delta', en: 'Beach & delta' } },
  { place: 'Cap-Vert', country: { fr: 'Cap-Vert', en: 'Cabo Verde' }, tags: { fr: 'Îles & plages', en: 'Islands & beaches' } },
  { place: 'Zanzibar', country: { fr: 'Tanzanie', en: 'Tanzania' }, tags: { fr: 'Plages & Stone Town', en: 'Beaches & Stone Town' } },
  { place: 'Île Maurice', country: { fr: 'Maurice', en: 'Mauritius' }, tags: { fr: 'Lagons', en: 'Lagoons' } },
  { place: 'Seychelles', country: { fr: 'Seychelles', en: 'Seychelles' }, tags: { fr: 'Îles', en: 'Islands' } },
  { place: 'Marrakech', country: { fr: 'Maroc', en: 'Morocco' }, tags: { fr: 'Riads & désert', en: 'Riads & desert' } },
  { place: 'Le Cap', country: { fr: 'Afrique du Sud', en: 'South Africa' }, tags: { fr: 'Ville & vignobles', en: 'City & vineyards' } },
  { place: 'Bahamas', country: { fr: 'Bahamas', en: 'The Bahamas' }, tags: { fr: 'Plages & îles', en: 'Beaches & islands' } },
  { place: 'Dubaï', country: { fr: 'Émirats arabes unis', en: 'United Arab Emirates' }, tags: { fr: 'Ville & désert', en: 'City & desert' } },
]

// Public website colour themes.
export const SITE_THEMES = {
  plum: { fr: 'Prune & or', en: 'Plum & gold', bg: '#fbf7f3', ink: '#2a1730', accent: '#8b2276', soft: '#f1e3ee', gold: '#c49a3c' },
  emerald: { fr: 'Émeraude & bleu', en: 'Emerald & blue', bg: '#f5f8f6', ink: '#13261f', accent: '#1f5c4a', soft: '#e1ede8', gold: '#2b4f86' },
  terracotta: { fr: 'Terracotta', en: 'Terracotta', bg: '#fbf5ef', ink: '#2e1a12', accent: '#a9472a', soft: '#f3e2d7', gold: '#c08a3e' },
  midnight: { fr: 'Nuit & rose', en: 'Midnight & blush', bg: '#f7f5f8', ink: '#1a1f38', accent: '#23305e', soft: '#f1e1e6', gold: '#c97f93' },
}
