// Wedding traditions by culture, used by the setup questions, the step
// guides and the starting dowry list. Every family has its own customs and
// the bride's family gives the official list, so the app always presents
// this as a starting point to adapt, never as a rule.
//
// Items: [labelFr, labelEn, qty, unit, recipient, category]
//   unit       → UNITS in templates.js (null = none)
//   recipient  → bride | father | mother | family | brothers | sisters | uncles | aunts | elders | other
//   category   → drinks | cloth | jewelry | cash | food | household | beauty | livestock | symbolic | other

const SRC = {
  eweList:     { title: 'Ewe engagement list — YEN.com.gh', url: 'https://yen.com.gh/116903-ghanaian-engagement-list-ewes.html' },
  akanList:    { title: 'Akan engagement list — YEN.com.gh', url: 'https://yen.com.gh/117482-ghanaian-engagement-list-akans.html' },
  gaList:      { title: 'Ga-Adangbe engagement list — YEN.com.gh', url: 'https://yen.com.gh/117391-ghanaian-engagement-list-ga-adangbe.html' },
  togo:        { title: 'Traditions de mariage au Togo — ABC Salles', url: 'https://www.abcsalles.com/guide/mariage/savoir-traditions-mariage-togo' },
  togoLaw:     { title: 'Togo : la dot ne doit pas dépasser 10 000 FCFA — L-Frii', url: 'https://yop.l-frii.com/togo-la-dot-ne-doit-pas-depasser-cette-somme-selon-la-loi/' },
  akpema:      { title: "L'akpéma en pays kabyè — ATOP", url: 'https://atop.tg/les-rites-initiatiques-traditionnels-de-la-jeune-fille-ou-akpema-en-pays-kabye/' },
  fon:         { title: 'Benin: the Fon marriage — Comboni Missionaries', url: 'https://combonimissionaries.ie/2017/11/22/benin-the-fon-marriage/' },
  beninDot:    { title: 'La dot dans le mariage au Bénin — La Nouvelle Tribune', url: 'https://lanouvelletribune.info/2024/11/la-dot-dans-le-mariage-au-benin-un-carrefour-entre-tradition-symbolisme-spiritualite-et-modernite/' },
  yoruba:      { title: 'Yoruba traditional wedding — Wikipedia', url: 'https://en.wikipedia.org/wiki/Yoruba_traditional_wedding' },
  nigeria:     { title: 'Traditional marriage rites in Nigeria — The Guardian Nigeria', url: 'https://guardian.ng/life/traditional-marriage-rites-in-nigeria/' },
  igbo:        { title: 'The economics of Igbo marriage — Nairametrics', url: 'https://nairametrics.com/the-economics-of-igbo-marriage-explained' },
  hausa:       { title: 'Traditional marriage in Hausa culture — Wikipedia', url: 'https://en.wikipedia.org/wiki/Traditional_marriage_in_Hausa_culture' },
  agni:        { title: 'Les étapes du mariage traditionnel chez les Agni — Voie de femme', url: 'https://voiedefemme.net/2022/08/22/us-et-coutumes-les-differentes-etapes-du-mariage-traditionnel-chez-les-agnis/' },
  agniDot:     { title: 'Dot en milieu agni — Vikidia', url: 'https://fr.vikidia.org/wiki/Dot_en_milieu_agni' },
  ci:          { title: "Traditions de mariage en Côte d'Ivoire — ABC Salles", url: 'https://www.abcsalles.com/guide/mariage/traditions-mariage-cote-ivoire' },
  senegal:     { title: 'Mariage au Sénégal : dot, âge, chiffres — Au Sénégal', url: 'https://au-senegal.com/mariage-au-senegal-age-polygamie-dot-mariages-precoces-ce-que-revelent-vraiment-les-chiffres,18155.html' },
  cameroon:    { title: 'Dot au Cameroun — Vikidia', url: 'https://fr.vikidia.org/wiki/Dot_au_Cameroun' },
  douala:      { title: 'Le mariage chez les Dwala — IRD', url: 'https://horizon.documentation.ird.fr/exl-doc/pleins_textes/pleins_textes_7/b_fdi_03_05/23847.pdf' },
  kongo:       { title: 'Mariage chez les Kongo — Vikidia', url: 'https://fr.vikidia.org/wiki/Mariage_chez_les_Kongo' },
  kikuyu:      { title: 'Ruracio steps: Kikuyu dowry process — Kenyans.co.ke', url: 'https://www.kenyans.co.ke/news/68388-ruracio-steps-complete-guide-kikuyu-dowry-processes' },
  luo:         { title: 'Ayie — Wikipedia', url: 'https://en.wikipedia.org/wiki/Ayie' },
  baganda:     { title: 'Marriage as a clan affair among the Baganda — Comboni Missionaries', url: 'https://combonimissionaries.ie/2017/11/01/uganda-marriage-as-a-clan-affair-among-the-buganda/' },
  tanzania:    { title: 'Tanzanian weddings — Tanzania Specialist', url: 'https://tanzania-specialist.com/blog/tanzanian-weddings/' },
  kitchen:     { title: 'Kitchen parties in Tanzania — Five College Center', url: 'https://www.langmedia.fivecolleges.edu/resources/tanzania/religion-traditions/kitchen-parties' },
  ethiopia:    { title: 'Ethiopian wedding traditions — The Knot', url: 'https://www.theknot.com/content/ethiopian-wedding-traditions' },
  lobola:      { title: 'Is it time to cancel lobola? — Cape Argus', url: 'https://capeargus.co.za/lifestyle/style-beauty/weddings/2024-12-01-is-it-time-to-cancel-lobola-exploring-how-the-process-works-and-does-it-still-matters-in-a-modern-south-africa' },
  lobolaWiki:  { title: 'Lobolo — Wikipedia', url: 'https://en.wikipedia.org/wiki/Lobolo' },
  umembeso:    { title: 'Understanding lobola and umembeso — Sunday Tribune', url: 'https://sundaytribune.co.za/news/south-africa/2025-01-08-understanding-lobola-and-umembeso-in-zulu-culture-king-misuzulu-and-queen-nomzamo-myeni' },
  roora:       { title: 'Zimbabwe: the wedding before the wedding — African Arguments', url: 'https://africanarguments.org/2022/04/zimbabwe-the-rise-and-rise-of-the-wedding-before-the-wedding/' },
  morocco:     { title: 'Traditional Moroccan weddings — Villanovo', url: 'https://www.villanovo.com/magazine/morocco/article-all-you-need-to-know-about-traditional-moroccan-weddings' },
}

export const REGIONS = [
  { id: 'west',    fr: "Afrique de l'Ouest", en: 'West Africa' },
  { id: 'central', fr: 'Afrique centrale',   en: 'Central Africa' },
  { id: 'east',    fr: "Afrique de l'Est",   en: 'East Africa' },
  { id: 'south',   fr: 'Afrique australe',   en: 'Southern Africa' },
  { id: 'north',   fr: 'Afrique du Nord',    en: 'North Africa' },
  { id: 'other',   fr: 'Autre',              en: 'Other' },
]

export const CULTURES = [
  {
    id: 'ewe',
    name: { fr: 'Éwé & Mina', en: 'Ewe & Mina' },
    region: 'west',
    countries: ['TG', 'GH', 'BJ'],
    religious: 'church',
    terms: {},
    knocking: {
      fr: [
        "Des proches du prétendant (souvent ses tantes ou ses oncles) vont d'abord annoncer son intention au père de la jeune femme, parfois avec du vin de palme.",
        "La famille de la jeune femme prend une ou deux semaines pour se renseigner sur lui et sa famille avant de répondre.",
        "Le jour du « toquer à la porte », le prétendant se présente avec sa délégation, demande officiellement la main et offre les boissons et l'enveloppe de la visite.",
        "La famille de la mariée remet ensuite la liste de la dot et l'on fixe une date.",
      ],
      en: [
        "Relatives of the suitor (often his aunts or uncles) first tell the young woman's father about his intention, sometimes bringing palm wine.",
        'Her family takes a week or two to learn about him and his family before answering.',
        'On the knocking day, the suitor comes with his delegation, formally asks for her hand and presents the drinks and the envelope for the visit.',
        "The bride's family then hands over the dowry list and a date is agreed.",
      ],
    },
    dowry: {
      fr: [
        'La dot est présentée chez le père de la mariée, devant les deux familles ; chaque famille a son porte-parole.',
        'Les parents conseillent le couple, on prie et on verse une libation aux ancêtres, puis la mariée confirme son accord.',
        'La mariée est ensuite confiée à la famille du marié, accompagnée de ses tantes.',
        "La liste comprend souvent : pagnes wax, foulards, chaussures et sacs, bijoux et montres, une valise, la bague et une Bible, des boissons et des enveloppes pour le père, la mère, les frères et la famille.",
      ],
      en: [
        "The dowry is presented at the bride's father's house before both families; each side has a spokesperson.",
        "The parents counsel the couple, prayers and a libation are offered to the ancestors, then the bride confirms her consent.",
        "The bride is then handed over to the groom's family, accompanied by her aunts.",
        "The list often includes wax prints, headscarves, shoes and bags, jewellery and watches, a suitcase, the ring and a Bible, drinks, and envelopes for the father, mother, brothers and family.",
      ],
    },
    tips: {
      fr: ["Chaque famille a sa propre liste : demandez-la par écrit et faites valider chaque ligne avant d'acheter.", 'Les quantités (6 pagnes, 2 schnapps…) sont des repères : adaptez-les à ce que la famille demande.'],
      en: ['Every family has its own list: ask for it in writing and confirm each line before buying.', 'Quantities (6 wax prints, 2 schnapps…) are only a guide: follow what the family asks for.'],
    },
    knockingItems: [
      ['Schnapps', 'Schnapps', 2, 'bottle', 'family', 'drinks'],
      ['Gin', 'Gin', 1, 'bottle', 'family', 'drinks'],
      ['Casier de sucreries', 'Crate of soft drinks', 1, 'crate', 'family', 'drinks'],
      ['Enveloppe de la visite', 'Envelope for the visit', 1, 'envelope', 'family', 'cash'],
    ],
    dowryItems: [
      ['Bague de fiançailles', 'Engagement ring', 1, null, 'bride', 'jewelry'],
      ['Bible', 'Bible', 1, null, 'bride', 'symbolic'],
      ['Pagnes wax (demi-pièces)', 'Wax prints (half pieces)', 6, 'piece', 'bride', 'cloth'],
      ['Foulards assortis', 'Matching headscarves', 6, 'piece', 'bride', 'cloth'],
      ['Chaussures et sacs assortis', 'Shoes with matching bags', 2, 'pair', 'bride', 'cloth'],
      ['Sandales', 'Sandals', 2, 'pair', 'bride', 'cloth'],
      ['Parures de bijoux', 'Jewellery sets', 2, 'set', 'bride', 'jewelry'],
      ['Montres', 'Wristwatches', 2, null, 'bride', 'jewelry'],
      ['Sous-vêtements', 'Underwear', 12, null, 'bride', 'cloth'],
      ['Chemises de nuit', 'Nightwear', 6, null, 'bride', 'cloth'],
      ['Perles de hanches', 'Waist beads', 1, 'set', 'bride', 'jewelry'],
      ['Valise', 'Suitcase', 1, null, 'bride', 'household'],
      ['Enveloppe de la mariée', 'Envelope for the bride', 1, 'envelope', 'bride', 'cash'],
      ['Pagne (pièce complète) et sandales', 'Full piece of cloth and sandals', 1, 'set', 'father', 'cloth'],
      ['Enveloppe du père', "Father's envelope", 1, 'envelope', 'father', 'cash'],
      ['Demi-pièce, foulard et sandales', 'Half piece, headscarf and sandals', 1, 'set', 'mother', 'cloth'],
      ['Enveloppe de la mère', "Mother's envelope", 1, 'envelope', 'mother', 'cash'],
      ['Enveloppe des frères', "Brothers' envelope", 1, 'envelope', 'brothers', 'cash'],
      ['Enveloppe de la famille', 'Family envelope', 1, 'envelope', 'family', 'cash'],
      ['Schnapps', 'Schnapps', 2, 'bottle', 'family', 'drinks'],
      ['Gin', 'Dry gin', 1, 'bottle', 'family', 'drinks'],
      ['Whisky', 'Whisky', 1, 'bottle', 'family', 'drinks'],
      ['Dubonnet', 'Dubonnet', 1, 'bottle', 'family', 'drinks'],
      ['Sodabi / akpeteshie', 'Sodabi / akpeteshie', 1, 'bottle', 'family', 'drinks'],
      ['Vin de palme', 'Palm wine', 1, 'calabash', 'family', 'drinks'],
      ['Bières', 'Beer', 2, 'carton', 'family', 'drinks'],
      ['Sucreries', 'Soft drinks', 2, 'crate', 'family', 'drinks'],
      ['Malt', 'Malt drinks', 2, 'crate', 'family', 'drinks'],
      ['Enveloppe de remerciement', 'Thank-you envelope', 1, 'envelope', 'family', 'cash'],
    ],
    sources: [SRC.eweList, SRC.togo],
  },
  {
    id: 'kabye',
    name: { fr: 'Kabyè & Nord-Togo', en: 'Kabye & Northern Togo' },
    region: 'west',
    countries: ['TG'],
    religious: 'church',
    terms: {},
    knocking: {
      fr: [
        "Traditionnellement, les deux familles s'engageaient tôt et s'entraidaient : travaux des champs et dons de vivres jusqu'au mariage.",
        "L'akpéma, le rite d'initiation des jeunes filles (en juillet, juste après les Evala), marque l'entrée dans l'âge adulte et ouvre la voie au mariage.",
        "Aujourd'hui, beaucoup de familles suivent aussi les étapes courantes au Togo : présentation officielle du prétendant, remise de la liste, puis la dot.",
      ],
      en: [
        'Traditionally the two families committed early and helped each other, with farm work and gifts of food until the marriage.',
        'Akpema, the coming-of-age rite for young women (in July, right after Evala), marks entry into adulthood and opens the way to marriage.',
        "Today many families also follow the usual steps in Togo: the suitor's formal introduction, the list, then the dowry.",
      ],
    },
    dowry: {
      fr: [
        'La boisson locale, le tchoukoutou (bière de sorgho), accompagne les grandes étapes et la fête.',
        "Les familles du Nord-Togo combinent souvent ces repères avec une liste proche de celle du Sud : pagnes, valise, boissons et enveloppes pour les parents.",
        'Faites confirmer chaque élément par les aînés de la famille de la mariée.',
      ],
      en: [
        'The local drink, tchoukoutou (sorghum beer), accompanies the main steps and the celebration.',
        "Families in Northern Togo often combine these customs with a list close to the South's: wax prints, a suitcase, drinks and envelopes for the parents.",
        "Have the elders of the bride's family confirm every item.",
      ],
    },
    tips: {
      fr: ['Demandez aux aînés quelles étapes la famille tient à respecter, et dans quel ordre.'],
      en: ['Ask the elders which steps the family wants to keep, and in what order.'],
    },
    knockingItems: [
      ['Tchoukoutou ou boissons', 'Tchoukoutou or drinks', 1, 'calabash', 'family', 'drinks'],
      ['Liqueur', 'Liquor', 2, 'bottle', 'family', 'drinks'],
      ['Enveloppe de la visite', 'Envelope for the visit', 1, 'envelope', 'family', 'cash'],
    ],
    dowryItems: [
      ['Pagnes wax', 'Wax prints', 6, 'piece', 'bride', 'cloth'],
      ['Valise garnie', 'Packed suitcase', 1, null, 'bride', 'household'],
      ['Bijoux', 'Jewellery', 1, 'set', 'bride', 'jewelry'],
      ['Pagne et enveloppe du père', "Father's cloth and envelope", 1, 'set', 'father', 'cash'],
      ['Pagne et enveloppe de la mère', "Mother's cloth and envelope", 1, 'set', 'mother', 'cash'],
      ['Tchoukoutou', 'Tchoukoutou', 2, 'calabash', 'family', 'drinks'],
      ['Liqueurs', 'Liquor', 4, 'bottle', 'family', 'drinks'],
      ['Sucreries', 'Soft drinks', 2, 'crate', 'family', 'drinks'],
      ['Enveloppe de la famille', 'Family envelope', 1, 'envelope', 'family', 'cash'],
    ],
    sources: [SRC.akpema, SRC.togo],
  },
  {
    id: 'fon',
    name: { fr: 'Fon, Goun & Adja', en: 'Fon, Gun & Aja' },
    region: 'west',
    countries: ['BJ', 'TG'],
    religious: 'church',
    terms: { knocking: { fr: 'Vinandononu', en: 'Vinandononu' } },
    knocking: {
      fr: [
        "Vinandononu : le père du jeune homme envoie un émissaire annoncer son intention au père de la jeune femme, qui consulte son épouse avant de répondre.",
        'Certaines familles consultent le Fa (divination) avant de donner leur accord.',
        "Le lanu, petit présent de la famille du jeune homme, comprend traditionnellement six mètres de tissu et deux bouteilles de sodabi.",
      ],
      en: [
        "Vinandononu: the young man's father sends an emissary to tell the young woman's father of the intention; he consults his wife before answering.",
        'Some families consult Fa (divination) before agreeing.',
        "The lanu, a small gift from the young man's family, traditionally includes six metres of fabric and two bottles of sodabi.",
      ],
    },
    dowry: {
      fr: [
        'La dot se compose de présents pour chaque membre de la famille : parents, frères et sœurs, oncles, tantes, jeunes du quartier.',
        "Pagnes, noix de cola, sel, liqueurs, vin de palme pour les libations ; le Dubonnet (« assédékon ») symbolise le sceau entre les époux et leurs familles.",
        "Avant de partir chez son mari, la famille du marié demande la permission d'emmener la mariée ; volailles, maïs, haricots et huile rouge accompagnent souvent cette demande.",
      ],
      en: [
        'The dowry is made of gifts for each member of the family: parents, siblings, uncles, aunts and the young people of the neighbourhood.',
        'Wax prints, kola nuts, salt, liquor and palm wine for libations; Dubonnet ("assedekon") symbolises the seal between the spouses and their families.',
        "Before the bride leaves for her husband's home, his family asks permission to take her; poultry, maize, beans and palm oil often go with this request.",
      ],
    },
    tips: {
      fr: ["Demandez quels membres de la famille reçoivent un présent : c'est souvent plus large que les parents."],
      en: ['Ask which relatives receive a gift: it often goes well beyond the parents.'],
    },
    knockingItems: [
      ['Tissu (6 mètres)', 'Fabric (6 metres)', 1, 'piece', 'family', 'cloth'],
      ['Sodabi', 'Sodabi', 2, 'bottle', 'family', 'drinks'],
      ['Enveloppe de la visite', 'Envelope for the visit', 1, 'envelope', 'family', 'cash'],
    ],
    dowryItems: [
      ['Pagnes', 'Wax prints', 6, 'piece', 'bride', 'cloth'],
      ['Valise garnie', 'Packed suitcase', 1, null, 'bride', 'household'],
      ['Bijoux', 'Jewellery', 1, 'set', 'bride', 'jewelry'],
      ['Dubonnet (assédékon)', 'Dubonnet (assedekon)', 1, 'bottle', 'family', 'symbolic'],
      ['Noix de cola', 'Kola nuts', 1, 'bag', 'family', 'symbolic'],
      ['Sel', 'Salt', 1, 'bag', 'family', 'food'],
      ['Liqueurs', 'Liquor', 4, 'bottle', 'family', 'drinks'],
      ['Vin de palme', 'Palm wine', 1, 'calabash', 'family', 'drinks'],
      ['Présent du père', "Father's gift", 1, 'envelope', 'father', 'cash'],
      ['Présent de la mère', "Mother's gift", 1, 'envelope', 'mother', 'cash'],
      ['Présents des frères et sœurs', "Siblings' gifts", 1, 'envelope', 'brothers', 'cash'],
      ['Présents des oncles et tantes', "Uncles' and aunts' gifts", 1, 'envelope', 'uncles', 'cash'],
      ['Volailles, maïs, haricots, huile rouge', 'Poultry, maize, beans, palm oil', 1, 'set', 'family', 'food'],
    ],
    sources: [SRC.fon, SRC.beninDot],
  },
  {
    id: 'yoruba',
    name: { fr: 'Yoruba & Nago', en: 'Yoruba & Nago' },
    region: 'west',
    countries: ['NG', 'BJ', 'TG'],
    religious: 'church',
    terms: { knocking: { fr: 'Mo mi i mo e', en: 'Mo mi i mo e' }, dowry: { fr: 'Igbeyawo', en: 'Igbeyawo' } },
    knocking: {
      fr: [
        "Un intermédiaire, l'alarina, peut faciliter les premiers contacts.",
        "Présentation (« Mo mi i mo e ») : les parents du marié rendent visite à ceux de la mariée pour demander sa main, fixer la date et convenir de la dot.",
        "La famille de la mariée remet la liste (Eru Iyawo), préparée par l'aîné de la famille.",
      ],
      en: [
        'A go-between, the alarina, may help with the first contacts.',
        'Introduction ("Mo mi i mo e"): the groom\'s parents visit the bride\'s parents to ask for her hand, set the date and agree on the bride price.',
        "The bride's family hands over the list (Eru Iyawo), drawn up by the family's eldest member.",
      ],
    },
    dowry: {
      fr: [
        "Le jour de l'Igbeyawo, deux maîtres de cérémonie, l'Alaga Iduro (côté marié) et l'Alaga Ijoko (côté mariée), animent la cérémonie.",
        "Le marié et ses amis se prosternent (dobale) devant la famille de la mariée ; la mariée entre en dansant et salue les parents à genoux.",
        "La mariée pose le fila (bonnet) sur la tête du marié pour montrer qu'elle l'accepte ; on échange les bagues et on « arrose » le couple de billets.",
      ],
      en: [
        "On the Igbeyawo day, two hosts, the Alaga Iduro (groom's side) and the Alaga Ijoko (bride's side), lead the ceremony.",
        "The groom and his friends prostrate (dobale) before the bride's family; the bride dances in and kneels to greet the parents.",
        "The bride places the fila (cap) on the groom's head to show she accepts him; rings are exchanged and guests spray money on the couple.",
      ],
    },
    tips: {
      fr: ["Réservez tôt vos deux Alaga : ce sont eux qui donnent le rythme de la journée.", 'Prévoyez des liasses de petites coupures pour le « money spraying ».'],
      en: ['Book both Alagas early: they set the pace of the day.', 'Plan stacks of small notes for money spraying.'],
    },
    knockingItems: [
      ['Boissons pour la visite', 'Drinks for the visit', 2, 'bottle', 'family', 'drinks'],
      ['Noix de cola', 'Kola nuts', 1, 'bag', 'family', 'symbolic'],
    ],
    dowryItems: [
      ['Bague de fiançailles', 'Engagement ring', 1, null, 'bride', 'jewelry'],
      ['Bible ou Coran', 'Bible or Quran', 1, null, 'bride', 'symbolic'],
      ['Miel', 'Honey', 1, 'bottle', 'family', 'food'],
      ['Ignames', 'Yams', 20, null, 'family', 'food'],
      ['Fruits', 'Fruit', 1, 'set', 'family', 'food'],
      ['Noix de cola et cola amère', 'Kola nuts and bitter kola', 1, 'bag', 'family', 'symbolic'],
      ['Poivre de Guinée', 'Alligator pepper', 1, 'bag', 'family', 'symbolic'],
      ['Sel et sucre', 'Salt and sugar', 1, 'bag', 'family', 'food'],
      ['Isa asun (marmite) et amu (jarre)', 'Isa asun (pot) and amu (water pot)', 1, 'set', 'bride', 'household'],
      ['Bijoux', 'Jewellery', 1, 'set', 'bride', 'jewelry'],
      ['Valise et tenues', 'Suitcase and outfits', 1, null, 'bride', 'household'],
      ['Boissons', 'Drinks', 2, 'crate', 'family', 'drinks'],
      ['Dot (enveloppe)', 'Bride price (envelope)', 1, 'envelope', 'family', 'cash'],
    ],
    extras: [{ id: 'owambe', fr: 'Owambe (after-party)', en: 'Owambe (after-party)' }],
    sources: [SRC.yoruba, SRC.nigeria],
  },
  {
    id: 'igbo',
    name: { fr: 'Igbo', en: 'Igbo' },
    region: 'west',
    countries: ['NG'],
    religious: 'church',
    terms: { knocking: { fr: 'Iku aka', en: 'Iku aka' }, dowry: { fr: 'Igba nkwu', en: 'Igba nkwu' } },
    knocking: {
      fr: [
        "Iku aka (frapper à la porte) : le prétendant vient avec son père ou un aîné et au moins deux proches, avec du vin de palme (ou des boissons).",
        'La famille de la jeune femme lui demande si elle connaît le prétendant et veut l\'épouser, puis enquête sur la famille du jeune homme.',
        "Lors d'une seconde visite devant l'umunna (la famille élargie), la date est fixée et la liste est remise.",
      ],
      en: [
        'Iku aka (knocking): the suitor comes with his father or an elder and at least two relatives, bringing palm wine (or drinks).',
        "The young woman's family asks whether she knows the suitor and wants to marry him, then looks into his family.",
        "At a second visit before the umunna (extended family), the date is set and the list is handed over.",
      ],
    },
    dowry: {
      fr: [
        "Des listes distinctes existent souvent pour le père, la mère, l'umunna (les hommes) et les umuada (les femmes de la famille).",
        "La dot (ime ego) se règle en privé avec le père ; le montant est souvent symbolique, c'est la liste qui coûte le plus.",
        "Igba nkwu (porter le vin) : bénie par son père, la mariée cherche le marié dans la foule et lui offre une calebasse de vin de palme ; s'il boit, il est accepté.",
      ],
      en: [
        'There are often separate lists for the father, the mother, the umunna (the men) and the umuada (the women of the family).',
        "The bride price (ime ego) is settled privately with the father; the amount is often symbolic and the list is what costs most.",
        'Igba nkwu (wine carrying): blessed by her father, the bride finds the groom in the crowd and offers him a cup of palm wine; if he drinks, he is accepted.',
      ],
    },
    tips: {
      fr: ["Demandez les quatre listes (père, mère, umunna, umuada) d'un coup pour budgéter.", 'Certains articles peuvent être remplacés par de l\'argent si la cérémonie est loin.'],
      en: ['Ask for all four lists (father, mother, umunna, umuada) at once so you can budget.', 'Some items can be replaced with cash if the ceremony is far away.'],
    },
    knockingItems: [
      ['Vin de palme', 'Palm wine', 2, 'calabash', 'family', 'drinks'],
      ['Bières et boissons', 'Beer and soft drinks', 2, 'crate', 'family', 'drinks'],
      ['Noix de cola', 'Kola nuts', 1, 'bag', 'family', 'symbolic'],
    ],
    dowryItems: [
      ['Canne, bonnet, tenue et chaussures', 'Walking stick, cap, outfit and shoes', 1, 'set', 'father', 'cloth'],
      ['Enveloppe du père', "Father's envelope", 1, 'envelope', 'father', 'cash'],
      ['Wrapper George et deux wrappers Abada', 'George wrapper and two Abada wrappers', 1, 'set', 'mother', 'cloth'],
      ['Blouses et foulards de tête', 'Blouses and head ties', 3, 'piece', 'mother', 'cloth'],
      ['Bassines', 'Large basins', 2, null, 'mother', 'household'],
      ['Ignames', 'Yam tubers', 20, null, 'mother', 'food'],
      ['Poisson séché (stockfish)', 'Stockfish', 2, null, 'mother', 'food'],
      ['Riz, sel, tomates, huile', 'Rice, salt, tomatoes, oil', 1, 'set', 'mother', 'food'],
      ['Enveloppe de la mère', "Mother's envelope", 1, 'envelope', 'mother', 'cash'],
      ['Vin de palme', 'Palm wine', 20, 'litre', 'elders', 'drinks'],
      ['Bières et malts', 'Beer and malt', 4, 'carton', 'elders', 'drinks'],
      ['Alcools forts', 'Hot drinks', 6, 'bottle', 'elders', 'drinks'],
      ['Chèvre', 'Goat', 1, 'head', 'elders', 'livestock'],
      ['Enveloppe de l\'umunna', 'Umunna envelope', 1, 'envelope', 'elders', 'cash'],
      ['Ignames, savon, talc, sel (umuada)', 'Yams, soap, talc, salt (umuada)', 1, 'set', 'aunts', 'food'],
      ['Enveloppe des umuada', 'Umuada envelope', 1, 'envelope', 'aunts', 'cash'],
      ['Dot (ime ego)', 'Bride price (ime ego)', 1, 'envelope', 'father', 'cash'],
    ],
    sources: [SRC.nigeria, SRC.igbo],
  },
  {
    id: 'hausa',
    name: { fr: 'Haoussa & traditions musulmanes', en: 'Hausa & Muslim traditions' },
    region: 'west',
    countries: ['NG', 'NE', 'GH'],
    religious: 'mosque',
    terms: { knocking: { fr: 'Na gani ina so', en: 'Na gani ina so' }, dowry: { fr: 'Sadaki', en: 'Sadaki' } },
    knocking: {
      fr: [
        "Na gani ina so (« j'ai vu ce que j'aime ») : avec l'accord de ses parents, le jeune homme et sa famille rendent visite aux parents de la jeune femme avec noix de cola, sel, bonbons et chocolats.",
        "Gaisuwa : la famille de la jeune femme fait savoir qu'elle accepte.",
        'Sa rana : les deux familles fixent ensemble la date.',
      ],
      en: [
        'Na gani ina so ("I have seen what I like"): with his parents\' blessing, the young man and his family visit her parents with kola nuts, salt, sweets and chocolates.',
        "Gaisuwa: the young woman's family lets them know they accept.",
        'Sa rana: both families set the date together.',
      ],
    },
    dowry: {
      fr: [
        'Sadaki : la dot islamique, annoncée publiquement, à partir d\'un minimum (rubu dinar) ; un montant modeste est vu comme une bénédiction.',
        'Lefe : le marié offre à la mariée des tenues, chaussures et cosmétiques.',
        'Sa lalle : soirée du henné pour la mariée et ses amies ; daurin aure : le mariage religieux, souvent à la mosquée après la prière du vendredi.',
        'Kai amarya : la mariée est conduite chez son mari ; la famille de la mariée meuble la maison.',
      ],
      en: [
        'Sadaki: the Islamic bride price, announced publicly, starting from a minimum (rubu dinar); a modest amount is seen as a blessing.',
        'Lefe: the groom gives the bride outfits, shoes and cosmetics.',
        "Sa lalle: henna night for the bride and her friends; daurin aure: the religious marriage, often at the mosque after Friday prayers.",
        "Kai amarya: the bride is escorted to her husband's home; her family furnishes the house.",
      ],
    },
    tips: {
      fr: ["Contactez l'imam tôt pour la date du daurin aure.", 'Le marié loue souvent le logement, la famille de la mariée le meuble : répartissez ces dépenses dans le budget.'],
      en: ['Contact the imam early for the daurin aure date.', "The groom often rents the home and the bride's family furnishes it: split those costs in the budget."],
    },
    knockingItems: [
      ['Noix de cola', 'Kola nuts', 1, 'bag', 'family', 'symbolic'],
      ['Sel', 'Salt', 1, 'bag', 'family', 'food'],
      ['Bonbons et chocolats', 'Sweets and chocolates', 1, 'set', 'family', 'food'],
    ],
    dowryItems: [
      ['Sadaki (dot)', 'Sadaki (bride price)', 1, 'envelope', 'bride', 'cash'],
      ['Lefe : tenues', 'Lefe: outfits', 6, 'piece', 'bride', 'cloth'],
      ['Lefe : chaussures et sacs', 'Lefe: shoes and bags', 2, 'pair', 'bride', 'cloth'],
      ['Lefe : cosmétiques et parfums', 'Lefe: cosmetics and perfume', 1, 'set', 'bride', 'beauty'],
      ['Henné et articles du Sa lalle', 'Henna and Sa lalle items', 1, 'set', 'bride', 'beauty'],
      ['Noix de cola', 'Kola nuts', 1, 'bag', 'family', 'symbolic'],
    ],
    extras: [{ id: 'henna', fr: 'Soirée du henné (Sa lalle)', en: 'Henna night (Sa lalle)' }],
    sources: [SRC.hausa, SRC.nigeria],
  },
  {
    id: 'akan',
    name: { fr: 'Akan (Ashanti, Fanti…)', en: 'Akan (Ashanti, Fante…)' },
    region: 'west',
    countries: ['GH', 'CI'],
    religious: 'church',
    terms: { knocking: { fr: 'Kɔkɔɔ kɔ', en: 'Kɔkɔɔ kɔ' }, dowry: { fr: 'Awareɛ', en: 'Awareɛ' } },
    knocking: {
      fr: [
        "Le prétendant prévient sa famille, qui envoie un messager ; la famille de la jeune femme se renseigne puis fixe la date du kɔkɔɔ kɔ.",
        "Kɔkɔɔ kɔ (toquer) : ses parents ou ses oncles l'accompagnent avec deux bouteilles, de l'argent, des noix de cola et le tiri nsa (la boisson de tête).",
        'Accepter ces présents vaut consentement ; la date du mariage est fixée et la liste est remise le jour même.',
      ],
      en: [
        "The suitor tells his family, who send a messenger; her family looks into his background and sets a date for the kɔkɔɔ kɔ.",
        'Kɔkɔɔ kɔ (knocking): his parents or senior uncles go with him, bringing two bottles, money, kola nuts and the tiri nsa (head drink).',
        'Accepting these gifts means consent; the wedding date is set and the list is handed over the same day.',
      ],
    },
    dowry: {
      fr: [
        "Le jour de l'awareɛ, la famille du marié présente la dot et les articles de la liste.",
        "On tend un verre à la mariée : elle doit retrouver son futur époux, assis parmi sa famille, et le lui offrir.",
        'Les aînés prient pour le couple, puis les familles festoient.',
      ],
      en: [
        "On the awareɛ day, the groom's family presents the bride price and the list items.",
        'The bride is handed a glass and must find her husband-to-be, seated among his family, and offer it to him.',
        'Elders pray for the couple, then the families celebrate.',
      ],
    },
    tips: {
      fr: ["Si la mariée est fille unique, prévoyez l'akontasekan pour ses frères ou cousins.", 'La mariée peut demander à ses parents de limiter la liste à ce que le marié peut offrir.'],
      en: ['If the bride is an only daughter, plan the akontasekan for her brothers or cousins.', 'The bride can ask her parents to keep the list to what the groom can afford.'],
    },
    knockingItems: [
      ['Tiri nsa (boisson de tête)', 'Tiri nsa (head drink)', 2, 'bottle', 'family', 'drinks'],
      ['Noix de cola', 'Kola nuts', 1, 'bag', 'family', 'symbolic'],
      ['Frais de toquer', 'Knocking fee', 1, 'envelope', 'family', 'cash'],
    ],
    dowryItems: [
      ["Frais d'acceptation", 'Acceptance fee', 1, 'envelope', 'family', 'cash'],
      ['Dot', 'Bride price', 1, 'envelope', 'family', 'cash'],
      ['Bague de fiançailles', 'Engagement ring', 1, null, 'bride', 'jewelry'],
      ['Bible', 'Bible', 1, null, 'bride', 'symbolic'],
      ['Parure de bijoux', 'Jewellery set', 1, 'set', 'bride', 'jewelry'],
      ['Pagnes wax / kente', 'Wax prints / kente', 6, 'piece', 'bride', 'cloth'],
      ['Sous-vêtements et nuisettes', 'Undergarments and nightgowns', 1, 'set', 'bride', 'cloth'],
      ['Chaussures', 'Shoes', 4, 'pair', 'bride', 'cloth'],
      ['Sacs à main', 'Handbags', 2, null, 'bride', 'cloth'],
      ['Valise', 'Suitcase', 1, null, 'bride', 'household'],
      ['Ustensiles de cuisine', 'Cooking utensils', 1, 'set', 'bride', 'household'],
      ['Argent pour démarrer une activité', 'Money to start a business', 1, 'envelope', 'bride', 'cash'],
      ['Tissu (pièce complète) et enveloppe', 'Full piece of cloth and envelope', 1, 'set', 'father', 'cloth'],
      ['Demi-pièce de tissu et enveloppe', 'Half piece of cloth and envelope', 1, 'set', 'mother', 'cloth'],
      ['Enveloppe des frères (akontasekan)', "Brothers' envelope (akontasekan)", 1, 'envelope', 'brothers', 'cash'],
      ['Schnapps', 'Schnapps', 2, 'bottle', 'family', 'drinks'],
      ['Whisky', 'Whisky', 2, 'bottle', 'family', 'drinks'],
      ['Champagne', 'Champagne', 4, 'bottle', 'family', 'drinks'],
      ['Bières', 'Beer', 3, 'crate', 'family', 'drinks'],
      ['Eau minérale / sucreries', 'Mineral water / soft drinks', 5, 'crate', 'family', 'drinks'],
    ],
    sources: [SRC.akanList],
  },
  {
    id: 'ga',
    name: { fr: 'Ga-Adangbe', en: 'Ga-Adangbe' },
    region: 'west',
    countries: ['GH'],
    religious: 'church',
    terms: { knocking: { fr: 'Agboshimo', en: 'Agboshimo' }, dowry: { fr: 'Nihamo', en: 'Nihamo' } },
    knocking: {
      fr: [
        "Agboshimo (toquer) : la famille du marié n'est admise qu'une fois ce rite accompli.",
        'On remet les frais de notification (shiwo) aux parents de la mariée et une bouteille ; le kplemo (frais d\'acceptation) montre que la liste a bien été reçue.',
      ],
      en: [
        "Agboshimo (knocking): the groom's family is admitted only once this rite is done.",
        "The notification fee (shiwo) goes to the bride's parents with a bottle; the kplemo (acceptance fee) shows the list was received.",
      ],
    },
    dowry: {
      fr: [
        'Yoo tuumo (fiançailles) : les articles profitent surtout à la mariée : bague, Bible, boissons, argent pour la tenue et argent pour son activité.',
        'Nihamo (dot) : argent et présents pour les parents et la famille ; les cadeaux de la mariée sont rangés dans une valise.',
        "Le jour J, la mariée est remise à sa nouvelle famille et le marié repart avec elle après la fête.",
      ],
      en: [
        'Yoo tuumo (engagement): the items mainly benefit the bride: ring, Bible, drinks, money for her outfit and money for her business.',
        "Nihamo (bride price): money and gifts for the parents and family; the bride's gifts are packed into a suitcase.",
        'On the day, the bride is handed over to her new family and the groom leaves with her after the celebration.',
      ],
    },
    tips: {
      fr: ['La liste est souvent longue : demandez-la tôt et étalez les achats.'],
      en: ['The list is often long: ask for it early and spread out the purchases.'],
    },
    knockingItems: [
      ['Frais de notification (shiwo)', 'Notification fee (shiwo)', 1, 'envelope', 'family', 'cash'],
      ['Vin', 'Wine', 1, 'bottle', 'family', 'drinks'],
      ["Frais d'acceptation (kplemo)", 'Acceptance fee (kplemo)', 1, 'envelope', 'family', 'cash'],
    ],
    dowryItems: [
      ['Bague de fiançailles', 'Engagement ring', 1, null, 'bride', 'jewelry'],
      ['Bible et recueil de chants', 'Bible and hymn book', 1, 'set', 'bride', 'symbolic'],
      ['Argent de la tenue (shika)', 'Wedding outfit money (shika)', 1, 'envelope', 'bride', 'cash'],
      ['Argent pour son activité', 'Business / career money', 1, 'envelope', 'bride', 'cash'],
      ['Tissus avec foulards et bijoux', 'Fabrics with headgear and jewellery', 6, 'piece', 'bride', 'cloth'],
      ['Pagnes (pièces complètes)', 'Full lappa pieces', 12, 'piece', 'bride', 'cloth'],
      ['Kente', 'Kente', 1, 'piece', 'bride', 'cloth'],
      ['Perles (cou, taille, poignets)', 'Neck, waist and wrist beads', 1, 'set', 'bride', 'jewelry'],
      ['Montres', 'Wristwatches', 2, null, 'bride', 'jewelry'],
      ['Chaussures et sacs', 'Shoes and bags', 2, 'pair', 'bride', 'cloth'],
      ['Valise', 'Suitcase', 1, null, 'bride', 'household'],
      ['Vin, whisky, gin', 'Wine, whisky, gin', 6, 'bottle', 'family', 'drinks'],
      ['Bières', 'Beer', 2, 'carton', 'family', 'drinks'],
      ['Dot (nihamo)', 'Bride price (nihamo)', 1, 'envelope', 'family', 'cash'],
      ['Tissu homme et enveloppe', "Men's cloth and envelope", 1, 'set', 'father', 'cloth'],
      ['Demi-pièce et enveloppe', 'Half piece and envelope', 1, 'set', 'mother', 'cloth'],
      ['Enveloppe des frères', "Brothers' envelope", 1, 'envelope', 'brothers', 'cash'],
      ['Enveloppe ou boissons des témoins', 'Witnesses: cash or drinks', 1, 'envelope', 'family', 'cash'],
    ],
    sources: [SRC.gaList],
  },
  {
    id: 'agni',
    name: { fr: 'Agni, Baoulé & Akan de Côte d\'Ivoire', en: "Agni, Baoule & Ivorian Akan" },
    region: 'west',
    countries: ['CI', 'GH'],
    religious: 'church',
    terms: { knocking: { fr: 'Kôkô', en: 'Kôkô' }, dowry: { fr: 'Adja', en: 'Adja' } },
    knocking: {
      fr: [
        "Kôkô (le nom imite les coups frappés à la porte) : le prétendant, représenté par un proche, demande la permission de fréquenter la jeune femme.",
        'Il offre une bouteille de liqueur, généralement du gin. Il peut ensuite participer à la vie de la famille, sans être encore marié.',
      ],
      en: [
        'Kôkô (the name imitates knocking on a door): the suitor, represented by a relative, asks permission to court the young woman.',
        'He offers a bottle of liquor, usually gin. He can then take part in family life, without being married yet.',
      ],
    },
    dowry: {
      fr: [
        "Le mariage coutumier a lieu tôt le matin dans la cour du père de la mariée : une délégation du marié avec un porte-parole, et un oncle de la mariée qui la donne en mariage.",
        'Épreuves : les sœurs de la fiancée défilent, la fiancée arrive couverte d\'un pagne — le marié doit la reconnaître.',
        'On vérifie les présents, la mariée donne son consentement, puis la libation scelle l\'union ; le marié remet ensuite « l\'argent de l\'accolade » à son épouse.',
      ],
      en: [
        "The customary wedding takes place early in the morning in the bride's father's courtyard: the groom's delegation with a spokesperson, and an uncle of the bride who gives her away.",
        "Tests: the bride's sisters parade and the bride arrives covered with a cloth — the groom must recognise her.",
        'The gifts are checked, the bride gives her consent, then a libation seals the union; the groom then gives his wife "the embrace money".',
      ],
    },
    tips: {
      fr: ['Les marques et le nombre de bouteilles varient selon les familles : faites confirmer la liste par le porte-parole.'],
      en: ["Brands and the number of bottles vary by family: have the spokesperson confirm the list."],
    },
    knockingItems: [['Gin', 'Gin', 1, 'bottle', 'family', 'drinks']],
    dowryItems: [
      ['Gin', 'Gin', 2, 'bottle', 'father', 'drinks'],
      ['Rhum (pour la mère)', 'Rum (for the mother)', 1, 'bottle', 'mother', 'drinks'],
      ['Martini', 'Martini', 1, 'bottle', 'father', 'drinks'],
      ['Whisky', 'Whisky', 1, 'bottle', 'father', 'drinks'],
      ['Campari', 'Campari', 1, 'bottle', 'family', 'drinks'],
      ['Dot (ex. 6 060 FCFA)', 'Bride price (e.g. 6,060 FCFA)', 1, 'envelope', 'father', 'cash'],
      ['Sac de sel pour les tantes', 'Bag of salt for the aunts', 1, 'bag', 'aunts', 'food'],
      ["Allumettes pour l'assemblée", 'Matches for the gathering', 1, 'set', 'family', 'symbolic'],
      ['Argent du couteau (frères)', 'Knife money (brothers)', 1, 'envelope', 'brothers', 'cash'],
      ['Pagnes et foulards', 'Wax prints and headscarves', 7, 'set', 'bride', 'cloth'],
      ['Peigne, poudre, parfum, pommade, miroir', 'Comb, powder, perfume, pomade, mirror', 1, 'set', 'bride', 'beauty'],
      ['Valise', 'Suitcase', 1, null, 'bride', 'household'],
      ["Argent de l'accolade", 'Embrace money', 1, 'envelope', 'bride', 'cash'],
    ],
    sources: [SRC.agni, SRC.agniDot, SRC.ci],
  },
  {
    id: 'wolof',
    name: { fr: 'Wolof & Sénégambie', en: 'Wolof & Senegambia' },
    region: 'west',
    countries: ['SN', 'GM', 'MR'],
    religious: 'mosque',
    terms: {},
    knocking: {
      fr: [
        'La demande se fait entre familles, souvent par des proches ou des aînés.',
        'Les noix de cola, traditionnellement offertes, accompagnent la demande et la conclusion du mariage.',
      ],
      en: [
        'The proposal is made between families, often through relatives or elders.',
        'Kola nuts, traditionally offered, accompany the proposal and the marriage.',
      ],
    },
    dowry: {
      fr: [
        "La dot (le « meher » de la tradition islamique) est un don du mari à son épouse ; certaines confréries recommandent un montant symbolique.",
        "Le takk, mariage religieux, est souvent célébré à la mosquée en présence des familles ; suivent les fêtes familiales et l'installation de la mariée chez son mari.",
        'Repas, cadeaux et trousseau de la mariée font partie des dépenses à prévoir.',
      ],
      en: [
        'The bride price (the "meher" of Islamic tradition) is a gift from the husband to his wife; some brotherhoods recommend a symbolic amount.',
        "The takk, the religious marriage, is often held at the mosque with the families present; family celebrations and the bride moving to her husband's home follow.",
        "Meals, gifts and the bride's trousseau are part of the costs to plan for.",
      ],
    },
    tips: {
      fr: ["Pensez à déclarer le mariage à l'état civil : beaucoup d'unions religieuses ne sont pas enregistrées."],
      en: ['Remember to register the marriage with the civil registry: many religious unions are never registered.'],
    },
    knockingItems: [['Noix de cola', 'Kola nuts', 1, 'bag', 'family', 'symbolic']],
    dowryItems: [
      ['Dot (meher)', 'Bride price (meher)', 1, 'envelope', 'bride', 'cash'],
      ['Noix de cola', 'Kola nuts', 1, 'bag', 'family', 'symbolic'],
      ['Trousseau de la mariée', "Bride's trousseau", 1, 'set', 'bride', 'cloth'],
      ['Cadeaux pour la famille', 'Gifts for the family', 1, 'set', 'family', 'other'],
    ],
    sources: [SRC.senegal],
  },
  {
    id: 'cameroon',
    name: { fr: 'Cameroun (Beti, Bassa, Bamiléké, Douala…)', en: 'Cameroon (Beti, Bassa, Bamileke, Duala…)' },
    region: 'central',
    countries: ['CM'],
    religious: 'church',
    terms: {},
    knocking: {
      fr: [
        'Toquer à la porte : le futur gendre se présente officiellement à la belle-famille et apporte un whisky au chef de famille.',
        "Demande de la main : il reçoit la liste des présents ; il laisse une bouteille de whisky, une petite enveloppe et des boissons pour la séance.",
        "Chez les Douala, la « bouteille pour ouvrir la porte » n'est ouverte que si la jeune femme y consent.",
      ],
      en: [
        'Knocking on the door: the future son-in-law formally introduces himself to the family and brings whisky for the head of the family.',
        'Asking for her hand: he receives the gift list and leaves a bottle of whisky, a small envelope and drinks for the meeting.',
        'Among the Duala, the "bottle that opens the door" is only opened if the young woman agrees.',
      ],
    },
    dowry: {
      fr: [
        'Le jour de la dot, le gendre apporte ce qu\'il a pu réunir de la liste ; le mariage est scellé par le partage du vin de palme et de la cola entre les familles.',
        'Kaba pour la belle-mère (foulard, camisole, chaussures), costume trois pièces et chaussures pour le beau-père, vivres et boissons, enveloppe pour la famille.',
        "Selon la région : morue séchée (Bassa), gros porcs (Beti), cola, vin de raphia et huile rouge (Ouest), moutons, bœufs et tissus (Nord).",
        'Après la cérémonie, la famille de la mariée lui offre souvent un lit et l\'équipement de son foyer.',
      ],
      en: [
        "On the dowry day the son-in-law brings what he could gather from the list; the marriage is sealed by sharing palm wine and kola between the families.",
        "A kaba for the mother-in-law (headscarf, blouse, shoes), a three-piece suit and shoes for the father-in-law, food and drinks, and an envelope for the family.",
        'Depending on the region: dried cod (Bassa), large pigs (Beti), kola, raffia wine and palm oil (West), sheep, cattle and fine cloth (North).',
        "After the ceremony, the bride's family often gives her a bed and equipment for her new home.",
      ],
    },
    tips: {
      fr: ['Les dots peuvent devenir très coûteuses : négociez la liste avec respect, par le porte-parole.'],
      en: ['Dowries can become very costly: negotiate the list respectfully, through the spokesperson.'],
    },
    knockingItems: [
      ['Whisky pour le chef de famille', 'Whisky for the head of the family', 1, 'bottle', 'father', 'drinks'],
      ['Petite enveloppe', 'Small envelope', 1, 'envelope', 'family', 'cash'],
      ['Boissons pour la séance', 'Drinks for the meeting', 2, 'crate', 'family', 'drinks'],
    ],
    dowryItems: [
      ['Kaba, foulard, camisole et chaussures', 'Kaba, headscarf, blouse and shoes', 1, 'set', 'mother', 'cloth'],
      ['Costume trois pièces et chaussures', 'Three-piece suit and shoes', 1, 'set', 'father', 'cloth'],
      ['Sardines, tomates, cubes, huile', 'Sardines, tomatoes, stock cubes, oil', 1, 'set', 'family', 'food'],
      ["Filets d'oignons", 'Bags of onions', 2, 'bag', 'family', 'food'],
      ['Sacs de riz', 'Bags of rice', 2, 'bag', 'family', 'food'],
      ['Savons', 'Soap', 1, 'carton', 'family', 'household'],
      ['Dame-jeannes de vin rouge', 'Demijohns of red wine', 2, null, 'family', 'drinks'],
      ['Casiers de bière', 'Crates of beer', 4, 'crate', 'family', 'drinks'],
      ['Vin de palme / vin de raphia', 'Palm wine / raffia wine', 1, 'calabash', 'family', 'drinks'],
      ['Noix de cola', 'Kola nuts', 1, 'bag', 'family', 'symbolic'],
      ['Enveloppe de la famille', 'Family envelope', 1, 'envelope', 'family', 'cash'],
    ],
    sources: [SRC.cameroon, SRC.douala],
  },
  {
    id: 'kongo',
    name: { fr: 'Congo & RDC (Kongo…)', en: 'Congo & DRC (Kongo…)' },
    region: 'central',
    countries: ['CD', 'CG', 'AO'],
    religious: 'church',
    terms: { knocking: { fr: 'Pré-dot', en: 'Pre-dowry' } },
    knocking: {
      fr: [
        "Pré-dot : la famille du jeune homme offre un objet symbolique (en nature ou en argent) pour exprimer son souhait d'épouser la jeune femme ; on sert du vin de palme.",
        "La future épouse remet un plat à son père ; elle attend ensuite le jour du mariage.",
      ],
      en: [
        "Pre-dowry: the young man's family offers a symbolic object (in kind or in cash) to express the wish to marry her; palm wine is served.",
        'The bride-to-be hands a dish to her father, then waits for the wedding day.',
      ],
    },
    dowry: {
      fr: [
        'La famille du marié remet la dot : selon les familles, chèvres, machette, houe, noix de cola (makasu), petites perles blanches, parfois un terrain à cultiver.',
        "La famille de la mariée reçoit les invités et prépare le repas ; le vin de palme ne doit pas manquer.",
        "Les biens reçus sont répartis entre les parents de la mariée pour éviter les conflits.",
      ],
      en: [
        "The groom's family presents the dowry: depending on the family, goats, a machete, a hoe, kola nuts (makasu), small white beads, sometimes land to farm.",
        "The bride's family welcomes the guests and prepares the meal; there must be plenty of palm wine.",
        "What is received is shared among the bride's relatives to avoid disputes.",
      ],
    },
    tips: {
      fr: ['En ville, beaucoup de listes ajoutent argent, pagnes et boissons : demandez la liste complète par écrit.'],
      en: ['In cities many lists add money, wax prints and drinks: ask for the full list in writing.'],
    },
    knockingItems: [
      ['Objet ou somme symbolique', 'Symbolic object or sum', 1, null, 'family', 'symbolic'],
      ['Vin de palme', 'Palm wine', 1, 'calabash', 'family', 'drinks'],
    ],
    dowryItems: [
      ['Chèvres', 'Goats', 2, 'head', 'family', 'livestock'],
      ['Machette', 'Machete', 1, null, 'father', 'symbolic'],
      ['Houe', 'Hoe', 1, null, 'father', 'symbolic'],
      ['Noix de cola (makasu)', 'Kola nuts (makasu)', 1, 'bag', 'family', 'symbolic'],
      ['Petites perles blanches', 'Small white beads', 1, 'set', 'family', 'symbolic'],
      ['Vin de palme', 'Palm wine', 2, 'calabash', 'family', 'drinks'],
      ['Enveloppe de la famille', 'Family envelope', 1, 'envelope', 'family', 'cash'],
    ],
    sources: [SRC.kongo],
  },
  {
    id: 'kikuyu',
    name: { fr: 'Kikuyu', en: 'Kikuyu' },
    region: 'east',
    countries: ['KE'],
    religious: 'church',
    terms: { knocking: { fr: 'Kumenya mucii', en: 'Kumenya mucii' }, dowry: { fr: 'Ruracio', en: 'Ruracio' } },
    knocking: {
      fr: [
        "Chaque famille forme un comité d'aînés (athuri) et choisit un porte-parole.",
        "Kumenya mucii (connaître la maison) : le clan du marié rend visite avec la njohi ya njurio (bière de la demande) ; les aînés parlent en termes imagés.",
        'Kuhanda ithigi : on « réserve » la mariée avec une jeune brebis et une jeune chèvre, et l\'on plante une branche devant la maison.',
      ],
      en: [
        'Each family forms a committee of elders (athuri) and chooses a spokesperson.',
        "Kumenya mucii (getting to know the home): the groom's clan visits with njohi ya njurio (the asking beer); the elders speak in coded terms.",
        'Kuhanda ithigi: the bride is "booked" with a young ewe and a young goat, and a branch is planted at the home.',
      ],
    },
    dowry: {
      fr: [
        'Ruracio : le clan de la mariée détaille la dot (traditionnellement du bétail, souvent de l\'argent aujourd\'hui), on s\'accorde sur un montant, payable en plusieurs fois.',
        'On demande à la mariée si elle accepte les présents.',
        'Itara : la famille de la mariée visite le foyer du marié ; ngurario, la cérémonie finale, marque la fin du processus de dot.',
      ],
      en: [
        "Ruracio: the bride's clan itemises the dowry (traditionally livestock, often cash today) and an amount is agreed, payable in instalments.",
        'The bride is asked whether she accepts the gifts.',
        "Itara: the bride's family visits the groom's home; ngurario, the final ceremony, completes the dowry process.",
      ],
    },
    tips: {
      fr: ['Prévoyez plusieurs visites : la dot se règle souvent en plusieurs étapes.'],
      en: ['Plan for several visits: the dowry is often settled in stages.'],
    },
    knockingItems: [
      ['Njohi ya njurio (bière de la demande)', 'Njohi ya njurio (asking beer)', 1, 'set', 'elders', 'drinks'],
      ['Jeune brebis et jeune chèvre (kuhanda ithigi)', 'Young ewe and young goat (kuhanda ithigi)', 2, 'head', 'family', 'livestock'],
    ],
    dowryItems: [
      ['Chèvres', 'Goats', 10, 'head', 'family', 'livestock'],
      ['Vaches', 'Cows', 2, 'head', 'family', 'livestock'],
      ['Dot en argent (ruracio)', 'Dowry in cash (ruracio)', 1, 'envelope', 'family', 'cash'],
    ],
    extras: [{ id: 'ngurario', fr: 'Ngurario (cérémonie finale)', en: 'Ngurario (final ceremony)' }],
    sources: [SRC.kikuyu],
  },
  {
    id: 'luo',
    name: { fr: 'Luo', en: 'Luo' },
    region: 'east',
    countries: ['KE', 'TZ', 'UG'],
    religious: 'church',
    terms: { dowry: { fr: 'Ayie', en: 'Ayie' } },
    knocking: {
      fr: [
        "L'ayie est la première rencontre officielle du marié avec les parents de la mariée ; venir sans intention de payer l'ayie est mal vu.",
        "Y assistent les épouses du père et ses frères avec leurs épouses ; les oncles maternels n'y sont pas conviés.",
      ],
      en: [
        "The ayie is the groom's first official meeting with the bride's parents; visiting without intending to pay the ayie is frowned upon.",
        "The father's wives and his brothers with their wives attend; maternal uncles are not invited.",
      ],
    },
    dowry: {
      fr: [
        "Ayie (« j'accepte ») : le marié verse une première dot à la mère de la mariée, qui l'accepte.",
        "La mariée prépare un repas et nourrit le marié devant tous, signe qu'elle l'accepte ; le couple est alors considéré comme marié.",
        'Plus tard, une seconde dot en bétail (keny) est remise au père pour compléter l\'union.',
      ],
      en: [
        'Ayie ("I agree"): the groom pays a first bride price to the bride\'s mother, who accepts it.',
        'The bride prepares a meal and feeds the groom in front of everyone to show she accepts him; the couple is then considered married.',
        "Later, a second bride price in cattle (keny) is given to the father to complete the union.",
      ],
    },
    tips: {
      fr: ['Le montant suit une fourchette coutumière qui évolue : négociez-le en famille.'],
      en: ['The amount follows a customary range that changes over time: negotiate it as a family.'],
    },
    knockingItems: [],
    dowryItems: [
      ['Ayie (pour la mère)', 'Ayie (for the mother)', 1, 'envelope', 'mother', 'cash'],
      ['Keny : bétail pour le père', 'Keny: cattle for the father', 2, 'head', 'father', 'livestock'],
    ],
    sources: [SRC.luo],
  },
  {
    id: 'baganda',
    name: { fr: 'Baganda', en: 'Baganda' },
    region: 'east',
    countries: ['UG'],
    religious: 'church',
    terms: { knocking: { fr: 'Okukyala', en: 'Okukyala' }, dowry: { fr: 'Kwanjula', en: 'Kwanjula' } },
    knocking: {
      fr: [
        "Okukyala : le prétendant, avec un frère et une sœur, rend visite à la tante paternelle de la jeune femme (Ssenga) avec une lettre exposant ses intentions.",
        'On partage clan, totem et arbre généalogique pour écarter tout lien de parenté ; la Ssenga transmet la lettre au père, qui propose une date.',
      ],
      en: [
        "Okukyala: the suitor, with a brother and a sister, visits the young woman's paternal aunt (Ssenga) with a letter stating his intentions.",
        'Clan, totem and family tree are shared to rule out kinship; the Ssenga passes the letter to the father, who suggests a date.',
      ],
    },
    dowry: {
      fr: [
        "Kwanjula : la délégation du marié arrive avec le mwenge muganda (bière locale) et un porte-parole ; la Ssenga présente les visiteurs.",
        "On échange des grains de café et de l'eau en signe d'alliance ; la mère salue le marié, puis le père accorde la main de sa fille.",
        "Cadeaux : omutwalo pour le père, kanzu pour le père et les oncles, gomesi pour la mère et la Ssenga, kanzu et un poulet pour le frère de la mariée.",
      ],
      en: [
        "Kwanjula: the groom's delegation arrives with mwenge muganda (local brew) and a spokesperson; the Ssenga introduces the visitors.",
        'Coffee beans and water are exchanged as a covenant; the mother greets the groom, then the father gives his daughter\'s hand.',
        "Gifts: omutwalo for the father, kanzu for the father and uncles, gomesi for the mother and the Ssenga, a kanzu and a chicken for the bride's brother.",
      ],
    },
    tips: {
      fr: ['Le poulet du frère de la mariée doit être remis par le marié en personne.'],
      en: ["The chicken for the bride's brother must be handed over by the groom personally."],
    },
    knockingItems: [['Lettre de demande', 'Letter of intent', 1, null, 'aunts', 'symbolic']],
    dowryItems: [
      ['Mwenge muganda (bière locale)', 'Mwenge muganda (local brew)', 4, 'calabash', 'family', 'drinks'],
      ['Omutwalo', 'Omutwalo', 1, 'envelope', 'father', 'cash'],
      ['Kanzu pour le père et les oncles', 'Kanzu for the father and uncles', 3, 'piece', 'uncles', 'cloth'],
      ['Gomesi pour la mère et la Ssenga', 'Gomesi for the mother and Ssenga', 2, 'piece', 'mother', 'cloth'],
      ['Kanzu et poulet pour le frère', "Kanzu and chicken for the bride's brother", 1, 'set', 'brothers', 'livestock'],
      ['Enveloppes pour les parents', 'Envelopes for the parents', 2, 'envelope', 'family', 'cash'],
      ['Valise de la mariée', "Bride's suitcase", 1, null, 'bride', 'household'],
      ['Bouquet et fruits pour la mariée', 'Flowers and fruit for the bride', 1, 'set', 'bride', 'symbolic'],
    ],
    sources: [SRC.baganda],
  },
  {
    id: 'swahili',
    name: { fr: 'Tanzanie & côte swahilie', en: 'Tanzania & Swahili coast' },
    region: 'east',
    countries: ['TZ', 'KE'],
    religious: 'mosque',
    terms: { dowry: { fr: 'Mahari', en: 'Mahari' } },
    knocking: {
      fr: [
        "Traditionnellement, l'homme demande la permission au père avant la demande en mariage ; les deux familles prennent part aux fiançailles.",
        'La famille du marié offre des présents de bonne volonté : ustensiles, pagnes, bijoux.',
      ],
      en: [
        "Traditionally the man asks the father's permission before proposing; both families take part in the engagement.",
        "The groom's family offers goodwill gifts: household items, cloth, jewellery.",
      ],
    },
    dowry: {
      fr: [
        "Mahari : la famille du marié rend visite à celle de la mariée avec des présents et l'on convient du montant (argent, parfois bétail).",
        "Le kitchen party réunit les femmes autour de la mariée pour la conseiller ; le send-off est la fête d'au revoir organisée par sa famille.",
        "Le jour du mariage, les invités offrent souvent de l'argent, annoncé par le MC.",
      ],
      en: [
        "Mahari: the groom's family visits the bride's with gifts and the amount is agreed (money, sometimes cattle).",
        "The kitchen party gathers women around the bride to advise her; the send-off is the farewell party hosted by her family.",
        'On the wedding day, guests often give cash gifts, announced by the MC.',
      ],
    },
    tips: {
      fr: ['Beaucoup de couples réunissent un comité de proches qui collecte les contributions (michango).'],
      en: ['Many couples set up a committee of relatives who collect contributions (michango).'],
    },
    knockingItems: [['Présents de bonne volonté', 'Goodwill gifts', 1, 'set', 'family', 'other']],
    dowryItems: [
      ['Mahari', 'Mahari', 1, 'envelope', 'family', 'cash'],
      ['Khanga et kitenge', 'Khanga and kitenge', 4, 'piece', 'bride', 'cloth'],
      ['Ustensiles de cuisine', 'Cooking pots and utensils', 1, 'set', 'bride', 'household'],
    ],
    extras: [
      { id: 'kitchen_party', fr: 'Kitchen party', en: 'Kitchen party' },
      { id: 'send_off', fr: 'Send-off', en: 'Send-off' },
    ],
    sources: [SRC.tanzania, SRC.kitchen],
  },
  {
    id: 'habesha',
    name: { fr: 'Habesha (Éthiopie, Érythrée)', en: 'Habesha (Ethiopia, Eritrea)' },
    region: 'east',
    countries: ['ET', 'ER'],
    religious: 'church',
    terms: { knocking: { fr: 'Shimagile', en: 'Shimagile' } },
    knocking: {
      fr: [
        'Les familles organisent la rencontre ; le couple a besoin de la bénédiction des parents.',
        "Shimagile : le marié envoie des aînés respectés chez la famille de la mariée pour demander sa main ; le matin du mariage, la famille fait mine de résister à la porte avant de laisser entrer le marié.",
      ],
      en: [
        "Families arrange the meeting; the couple needs their parents' blessing.",
        "Shimagile: the groom sends respected elders to the bride's family to ask for her hand; on the wedding morning her family playfully resists at the door before letting the groom in.",
      ],
    },
    dowry: {
      fr: [
        "Après la cérémonie à l'église ou à la mosquée, la réception fait place aux danses régionales (eskista…).",
        'Melse : le lendemain, la famille de la mariée reçoit les proches ; le couple porte la tenue habesha et la kaba, une cape brodée.',
      ],
      en: [
        'After the church or mosque ceremony, the reception moves to regional dances (eskista…).',
        "Melse: the next day the bride's family hosts close relatives; the couple wears habesha dress and the kaba, an embroidered cape.",
      ],
    },
    tips: {
      fr: ['Prévoyez la cérémonie du café et le petit-déjeuner du matin pour les aînés.'],
      en: ['Plan the coffee and breakfast for the elders on the morning of the wedding.'],
    },
    knockingItems: [['Cadeau pour la famille', 'Gift for the family', 1, null, 'family', 'other']],
    dowryItems: [
      ['Tenues habesha et kaba', 'Habesha dress and kaba', 2, 'set', 'bride', 'cloth'],
      ['Présents pour les aînés', 'Gifts for the elders', 1, 'set', 'elders', 'other'],
    ],
    extras: [{ id: 'melse', fr: 'Melse (le lendemain)', en: 'Melse (the next day)' }],
    sources: [SRC.ethiopia],
  },
  {
    id: 'nguni',
    name: { fr: 'Zoulou, Xhosa, Swazi, Ndebele', en: 'Zulu, Xhosa, Swazi, Ndebele' },
    region: 'south',
    countries: ['ZA', 'SZ', 'ZW', 'LS'],
    religious: 'church',
    terms: { knocking: { fr: 'Lettre & imvulamlomo', en: 'Letter & imvulamlomo' }, dowry: { fr: 'Lobola', en: 'Lobola' } },
    knocking: {
      fr: [
        "Le marié et son père écrivent une lettre à la main (noms de clan, nom de famille, objet de la visite), apportée par un messager masculin — jamais par le marié.",
        "Chaque famille forme son équipe de négociateurs (abakhongi) ; le père de la mariée ne négocie pas lui-même.",
        "À l'arrivée, l'imvulamlomo (« ce qui ouvre la bouche » : argent ou alcool) est remis avant toute discussion.",
      ],
      en: [
        "The groom and his father write a handwritten letter (clan names, surname, purpose of the visit), delivered by a male messenger — never the groom.",
        "Each family forms its negotiating team (abakhongi); the bride's father does not negotiate himself.",
        'On arrival, the imvulamlomo ("mouth opener": cash or alcohol) is presented before any discussion.',
      ],
    },
    dowry: {
      fr: [
        'Négociation du lobola, souvent exprimé en vaches (11 en tradition zouloue, les deux premières pour le père et la mère), payé en bétail ou en argent, souvent en plusieurs fois.',
        'Les secrétaires des deux familles consignent l\'accord, signé par les délégations.',
        "Umembeso : la famille du marié offre des cadeaux (couvertures…) à celle de la mariée ; umbondo : la semaine du mariage, la famille de la mariée apporte des provisions ; umabo : la cérémonie traditionnelle finale.",
      ],
      en: [
        'The lobola negotiation, often expressed in cows (11 in Zulu tradition, the first two for the father and mother), paid in cattle or cash, often in instalments.',
        "Secretaries from both families record the agreement, which the delegations sign.",
        "Umembeso: the groom's family gives gifts (blankets…) to the bride's family; umbondo: in the wedding week the bride's family brings groceries; umabo: the final traditional ceremony.",
      ],
    },
    tips: {
      fr: ["Le marié n'assiste pas aux négociations : préparez bien vos négociateurs.", 'Des amendes (en argent) peuvent être fixées pendant la négociation : prévoyez une marge.'],
      en: ['The groom does not attend the negotiations: brief your negotiators well.', 'Fines (in cash) can be set during the negotiation: keep a margin.'],
    },
    knockingItems: [
      ['Lettre de demande', 'Letter requesting a meeting', 1, null, 'family', 'symbolic'],
      ['Imvulamlomo (argent ou brandy)', 'Imvulamlomo (cash or brandy)', 1, null, 'family', 'cash'],
    ],
    dowryItems: [
      ['Lobola : vaches ou leur équivalent', 'Lobola: cows or their cash equivalent', 11, 'head', 'family', 'livestock'],
      ['Umembeso : couvertures et cadeaux', 'Umembeso: blankets and gifts', 1, 'set', 'family', 'cloth'],
      ['Mouton ou chèvre pour le négociateur', 'Sheep or goat for the lead negotiator', 1, 'head', 'other', 'livestock'],
    ],
    extras: [
      { id: 'umembeso', fr: 'Umembeso', en: 'Umembeso' },
      { id: 'umabo', fr: 'Umabo', en: 'Umabo' },
    ],
    sources: [SRC.lobola, SRC.lobolaWiki, SRC.umembeso],
  },
  {
    id: 'shona',
    name: { fr: 'Shona', en: 'Shona' },
    region: 'south',
    countries: ['ZW', 'MZ'],
    religious: 'church',
    terms: { dowry: { fr: 'Roora', en: 'Roora' } },
    knocking: {
      fr: [
        "Un intermédiaire (munyai) porte les messages entre les familles et accompagne la délégation du marié.",
        'Le marié ne mène pas lui-même la discussion : ce sont ses aînés.',
      ],
      en: [
        "A go-between (munyai) carries messages between the families and goes with the groom's delegation.",
        'The groom does not lead the talks himself: his elders do.',
      ],
    },
    dowry: {
      fr: [
        "Roora : les familles négocient le prix de la mariée (aujourd'hui surtout en argent) ; une fois l'accord trouvé, la journée devient une fête.",
        "Après le roora, le couple est considéré comme marié ; un mariage « blanc » suit souvent.",
      ],
      en: [
        'Roora: the families negotiate the bride price (mostly in cash today); once agreed, the day turns into a celebration.',
        'After the roora the couple is considered married; a "white wedding" often follows.',
      ],
    },
    tips: {
      fr: ['Le roora peut coûter cher en décoration et traiteur : fixez un budget à part.'],
      en: ['The roora day can get expensive with decor and catering: set a separate budget.'],
    },
    knockingItems: [],
    dowryItems: [
      ['Roora (argent)', 'Roora (cash)', 1, 'envelope', 'family', 'cash'],
      ['Bétail ou équivalent', 'Cattle or equivalent', 2, 'head', 'family', 'livestock'],
    ],
    sources: [SRC.roora, SRC.lobolaWiki],
  },
  {
    id: 'maghreb',
    name: { fr: 'Maroc & Maghreb', en: 'Morocco & the Maghreb' },
    region: 'north',
    countries: ['MA', 'DZ', 'TN'],
    religious: 'mosque',
    terms: { dowry: { fr: 'Sadaq', en: 'Sadaq' } },
    knocking: {
      fr: [
        'Les parents du marié, ou le marié lui-même, rendent visite à la famille de la mariée pour demander sa main.',
        "Les familles discutent de la dot versée par la famille du marié et de ce que la famille de la mariée consacrera à l'installation du couple.",
      ],
      en: [
        "The groom's parents, or the groom himself, visit the bride's family to ask for her hand.",
        "The families discuss the mahr paid by the groom's family and what the bride's family will spend on setting up the couple's home.",
      ],
    },
    dowry: {
      fr: [
        "Fiançailles : l'acte de mariage est signé chez la famille de la mariée devant les proches, suivi d'un repas.",
        "Quelques jours avant : hammam avec les femmes de la famille ; la soirée du henné (avec la nekacha) ; les invités apportent sucre et œufs.",
        "Le jour J, la neggafa habille la mariée, qui change plusieurs fois de tenue ; le couple trône au centre et la fête dure jusqu'à l'aube.",
      ],
      en: [
        "Engagement: the marriage agreement is signed at the bride's family home before close relatives, followed by a meal.",
        'A few days before: hammam with the women of the family; the henna night (with the nekacha); guests bring sugar and eggs.',
        'On the day, the neggafa dresses the bride, who changes outfits several times; the couple sits on thrones and the party lasts until dawn.',
      ],
    },
    tips: {
      fr: ['Réservez tôt la neggafa : elle fournit souvent les tenues et accessoires.'],
      en: ['Book the neggafa early: she often supplies the outfits and accessories.'],
    },
    knockingItems: [['Cadeaux de la demande', 'Proposal gifts', 1, 'set', 'family', 'other']],
    dowryItems: [
      ['Sadaq (dot)', 'Mahr (sadaq)', 1, 'envelope', 'bride', 'cash'],
      ['Bijoux', 'Jewellery', 1, 'set', 'bride', 'jewelry'],
      ['Tenues et caftans', 'Outfits and kaftans', 1, 'set', 'bride', 'cloth'],
      ['Henné', 'Henna', 1, 'set', 'bride', 'beauty'],
      ['Sucre et œufs', 'Sugar and eggs', 1, 'set', 'family', 'food'],
    ],
    extras: [
      { id: 'hammam', fr: 'Hammam', en: 'Hammam' },
      { id: 'henna', fr: 'Soirée du henné', en: 'Henna night' },
    ],
    sources: [SRC.morocco],
  },
  {
    id: 'other',
    name: { fr: 'Autre / je ne sais pas', en: "Other / I'm not sure" },
    region: 'other',
    countries: [],
    religious: 'church',
    terms: {},
    knocking: {
      fr: [
        'Présentez-vous officiellement à la famille de la mariée avec une petite délégation (parents ou aînés, un porte-parole).',
        'Apportez des boissons et un présent, écoutez les attentes de la famille et convenez des prochaines étapes.',
      ],
      en: [
        "Formally introduce yourselves to the bride's family with a small delegation (parents or elders, a spokesperson).",
        "Bring drinks and a gift, listen to the family's expectations and agree on the next steps.",
      ],
    },
    dowry: {
      fr: [
        'Beaucoup de familles échangent des présents ou une dot symbolique : décidez ensemble de ce qui vous ressemble.',
        "Demandez aux aînés quelles coutumes comptent pour eux : c'est le meilleur point de départ.",
      ],
      en: [
        'Many families exchange gifts or a symbolic bride price: decide together what feels right for you.',
        'Ask the elders which customs matter to them: it is the best place to start.',
      ],
    },
    tips: { fr: [], en: [] },
    knockingItems: [
      ['Boissons', 'Drinks', 2, 'bottle', 'family', 'drinks'],
      ['Présent pour la famille', 'Gift for the family', 1, null, 'family', 'other'],
    ],
    dowryItems: [
      ['Présents pour la mariée', 'Gifts for the bride', 1, 'set', 'bride', 'other'],
      ['Présents pour les parents', 'Gifts for the parents', 1, 'set', 'family', 'other'],
    ],
    sources: [],
  },
]

export const CULTURE_BY_ID = Object.fromEntries(CULTURES.map((c) => [c.id, c]))
export const cultureOf = (id) => CULTURE_BY_ID[id] || CULTURE_BY_ID.other

// Country-specific legal notes shown in the civil-wedding and dowry guides.
export const COUNTRY_NOTES = {
  TG: {
    fr: "Au Togo, le Code des personnes et de la famille (art. 56) donne à la dot un caractère symbolique : elle ne peut dépasser 10 000 FCFA et peut être versée en nature ou en espèces. Dans la pratique, beaucoup de familles demandent davantage : à discuter en famille.",
    en: "In Togo, the Code of Persons and the Family (art. 56) makes the dowry symbolic: it may not exceed 10,000 FCFA and can be paid in kind or in cash. In practice many families ask for more, so discuss it together.",
    source: SRC.togoLaw,
  },
  ZA: {
    fr: "En Afrique du Sud, le Recognition of Customary Marriages Act (1998) reconnaît le mariage coutumier : les deux époux doivent avoir au moins 18 ans et y consentir. L'accord sur le lobola suffit, même s'il n'est pas encore payé. Pensez à enregistrer votre mariage.",
    en: 'In South Africa, the Recognition of Customary Marriages Act (1998) recognises customary marriages: both spouses must be at least 18 and consent. Agreeing on lobola is enough, even before it is paid. Remember to register your marriage.',
    source: SRC.lobolaWiki,
  },
}

// Cultures shown first for a country, in the culture picker.
export function culturesForCountry(country) {
  return CULTURES.filter((c) => c.countries.includes(country))
}
