import type { SupportedLocale } from '../utils/i18nHelpers';
import type { ChapterTranslationEntry } from './chaptersIndicTranslations';

export type ExtraWorldLocale = Extract<
  SupportedLocale,
  'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'zh' | 'ja'
>;

export const CHAPTER_WORLD_TRANSLATIONS: Record<
  ExtraWorldLocale,
  Record<number, ChapterTranslationEntry>
> = {
  es: {
    1: {
      title: 'Arjuna Vishada Yoga — El Yoga del Abatimiento de Arjuna',
      essence: 'En el umbral de Kurukshetra, la angustia moral de Arjuna abre el diálogo sagrado entre la duda humana y la sabiduría eterna.',
    },
    2: {
      title: 'Sankhya Yoga — Sabiduría Analítica y Ecuanimidad',
      essence: 'Distingue el Ser imperecedero del cuerpo pasajero y establece la serenidad mental en el deber y la acción (sthitaprajna).',
    },
    3: {
      title: 'Karma Yoga — El Yoga de la Acción Desinteresada',
      essence: 'Demuestra cómo la acción dedicada y desinteresada realizada por el bienestar colectivo (lokasangraha) conduce a la libertad interior.',
    },
    4: {
      title: 'Jnana Karma Sanyasa Yoga — Sabiduría y Sacrificio en la Acción',
      essence: 'Revela la transmisión perenne de la sabiduría a través de las eras y cómo el verdadero conocimiento santifica la acción cotidiana.',
    },
    5: {
      title: 'Karma Sanyasa Yoga — Armonía entre Renuncia y Acción',
      essence: 'Armoniza el compromiso activo en la sociedad con el desapego interior, como la hoja de loto que el agua no moja.',
    },
    6: {
      title: 'Dhyana Yoga — El Yoga de la Meditación y el Autodominio',
      essence: 'Presenta la meditación disciplinada, la firmeza de la mente y el llamado a elevarse a sí mismo con compasión hacia todos los seres.',
    },
    7: {
      title: 'Jnana Vijnana Yoga — Conocimiento y Sabiduría Realizada',
      essence: 'Une la comprensión intelectual de los principios de la naturaleza con la realización directa de la unidad subyacente.',
    },
    8: {
      title: 'Akshara Brahma Yoga — El Absoluto Imperecedero',
      essence: 'Explora la continuidad cósmica, el recuerdo constante en cada transición de la vida y la contemplación del Absoluto eterno.',
    },
    9: {
      title: 'Raja Vidya Raja Guhya Yoga — Conocimiento Soberano y Devoción',
      essence: 'Expone la ciencia soberana y accesible que une la devoción pura con la inclusión universal para todo buscador sincero.',
    },
    10: {
      title: 'Vibhuti Yoga — El Yoga del Esplendor Divino',
      essence: 'Reconoce la excelencia, la belleza, la armonía y la vitalidad noble en la naturaleza y la cultura como reflejos de una única fuente.',
    },
    11: {
      title: 'Vishwarupa Darshana Yoga — Visión de la Forma Cósmica',
      essence: 'Desvela la asombrosa interconexión del cosmos, el tiempo y la creación antes de volver a la serena cercanía personal.',
    },
    12: {
      title: 'Bhakti Yoga — El Yoga de la Devoción y el Corazón Compasivo',
      essence: 'Celebra la devoción amorosa y enumera virtudes eternas: ausencia de enemistad, amistad, compasión, perdón y paz.',
    },
    13: {
      title: 'Kshetra Kshetrajna Vibhaga Yoga — El Campo y Quien lo Conoce',
      essence: 'Examina la distinción entre la experiencia mente-cuerpo (el Campo) y la conciencia testigo luminosa (el Conocedor).',
    },
    14: {
      title: 'Gunatraya Vibhaga Yoga — Las Tres Modalidades de la Naturaleza',
      essence: 'Muestra cómo Sattva (claridad), Rajas (dinamismo) y Tamas (inercia) moldean el temperamento humano y cómo alcanzar el equilibrio.',
    },
    15: {
      title: 'Purushottama Yoga — El Yoga del Espíritu Supremo',
      essence: 'Emplea la metáfora del árbol cósmico invertido para mostrar que toda existencia tiene sus raíces en la Conciencia Eterna.',
    },
    16: {
      title: 'Daivasura Sampad Vibhaga Yoga — Tendencias Nobles y Atadoras',
      essence: 'Contrasta la intrepidez, veracidad, mansedumbre y caridad frente al egoísmo y la ira como brújula del carácter ético.',
    },
    17: {
      title: 'Shraddhatraya Vibhaga Yoga — Tres Dimensiones de la Fe',
      essence: 'Examina cómo la fe profunda moldea el habla, la alimentación, la generosidad y la autodisciplina, concluyendo con Om Tat Sat.',
    },
    18: {
      title: 'Moksha Sanyasa Yoga — Síntesis de Liberación y Deber Recto',
      essence: 'Reúne Karma, Bhakti y Jnana en una síntesis luminosa que culmina donde la sabiduría se une a la acción justa en paz.',
    },
  },
  fr: {
    1: {
      title: 'Arjuna Vishada Yoga — Le Yoga du Découragement d’Arjuna',
      essence: 'Au seuil de Kurukshetra, l’angoisse morale d’Arjuna ouvre le dialogue sacré entre l’incertitude humaine et la sagesse éternelle.',
    },
    2: {
      title: 'Sankhya Yoga — Sagesse Analytique et Équanimité',
      essence: 'Distingue le Soi impérissable du corps éphémère et établit l’équanimité dans le devoir et l’action juste (sthitaprajna).',
    },
    3: {
      title: 'Karma Yoga — Le Yoga de l’Action Désintéressée',
      essence: 'Montre comment l’action dédiée et désintéressée accomplie pour le bien collectif (lokasangraha) mène à la liberté intérieure.',
    },
    4: {
      title: 'Jnana Karma Sanyasa Yoga — Sagesse et Sacrifice dans l’Action',
      essence: 'Révèle la transmission pérenne de la sagesse à travers les âges et la manière dont la vraie connaissance sanctifie l’action quotidienne.',
    },
    5: {
      title: 'Karma Sanyasa Yoga — Harmonie du Renoncement et de l’Action',
      essence: 'Harmonise l’engagement actif dans la société avec le détachement intérieur, telle une feuille de lotus que l’eau n’effleure pas.',
    },
    6: {
      title: 'Dhyana Yoga — Le Yoga de la Méditation et de la Maîtrise de Soi',
      essence: 'Présente la méditation disciplinée, la stabilité de l’esprit et l’appel à s’élever soi-même avec compassion envers tous les êtres.',
    },
    7: {
      title: 'Jnana Vijnana Yoga — Connaissance et Sagesse Réalisée',
      essence: 'Unit la compréhension intellectuelle des principes de la nature à la réalisation directe de l’unité sous-jacente.',
    },
    8: {
      title: 'Akshara Brahma Yoga — L’Absolu Impérissable',
      essence: 'Explore la continuité cosmique, le souvenir constant à travers les transitions de la vie et la contemplation de l’Absolu éternel.',
    },
    9: {
      title: 'Raja Vidya Raja Guhya Yoga — Connaissance Souveraine et Dévotion',
      essence: 'Expose la science souveraine et accessible unissant la dévotion pure à l’inclusion universelle pour tout chercheur sincère.',
    },
    10: {
      title: 'Vibhuti Yoga — Le Yoga de la Splendeur Divine',
      essence: 'Reconnaît l’excellence, la beauté, l’harmonie et la noblesse dans la nature et la culture comme reflets d’une source unique.',
    },
    11: {
      title: 'Vishwarupa Darshana Yoga — Vision de la Forme Cosmique',
      essence: 'Dévoile l’interconnexion grandiose du cosmos, du temps et de la création avant de revenir à une douce proximité bienveillante.',
    },
    12: {
      title: 'Bhakti Yoga — Le Yoga de la Dévotion et du Cœur Compatissant',
      essence: 'Célèbre la dévotion aimante et énumère les vertus intemporelles : non-hostilité, amitié, compassion, pardon et paix.',
    },
    13: {
      title: 'Kshetra Kshetrajna Vibhaga Yoga — Le Champ et Son Connaisseur',
      essence: 'Examine la distinction entre l’expérience corps-esprit (le Champ) et la conscience témoin lumineuse (le Connaisseur).',
    },
    14: {
      title: 'Gunatraya Vibhaga Yoga — Les Trois Modalités de la Nature',
      essence: 'Cartographie comment Sattva (clarté), Rajas (dynamisme) et Tamas (inertie) façonnent le tempérament humain et comment atteindre l’équilibre.',
    },
    15: {
      title: 'Purushottama Yoga — Le Yoga de l’Esprit Suprême',
      essence: 'Utilise la métaphore du banian cosmique inversé pour montrer que toute vie prend racine dans la Conscience Éternelle.',
    },
    16: {
      title: 'Daivasura Sampad Vibhaga Yoga — Tendances Nobles et Aliénantes',
      essence: 'Oppose intrépidité, véracité, douceur et charité à l’égoïsme et la colère comme boussole du caractère éthique.',
    },
    17: {
      title: 'Shraddhatraya Vibhaga Yoga — Trois Dimensions de la Foi',
      essence: 'Analyse comment la foi profonde façonne la parole, la nourriture, la générosité et la discipline, concluant sur Om Tat Sat.',
    },
    18: {
      title: 'Moksha Sanyasa Yoga — Synthèse de Libération et Juste Devoir',
      essence: 'Rassemble Karma, Bhakti et Jnana en une synthèse lumineuse où la sagesse rencontre l’action juste dans la paix.',
    },
  },
  de: {
    1: {
      title: 'Arjuna Vishada Yoga — Der Yoga von Arjunas Verzagtheit',
      essence: 'An der Schwelle von Kurukshetra öffnet Arjunas moralische Not den heiligen Dialog zwischen menschlichem Zweifel und zeitloser Weisheit.',
    },
    2: {
      title: 'Sankhya Yoga — Weg der Erkenntnis und des Gleichmuts',
      essence: 'Unterscheidet das unvergängliche Selbst vom vergänglichen Körper und begründet Gelassenheit in Pflicht und Handeln (Sthitaprajna).',
    },
    3: {
      title: 'Karma Yoga — Der Yoga des selbstlosen Handelns',
      essence: 'Zeigt, wie hingegebenes, selbstloses Handeln zum Wohl aller (Lokasangraha) zu innerer Freiheit führt.',
    },
    4: {
      title: 'Jnana Karma Sanyasa Yoga — Weisheit und Hingabe im Tun',
      essence: 'Offenbart die zeitlose Überlieferung der Weisheit durch die Zeitalter und wie wahre Erkenntnis das alltägliche Handeln heiligt.',
    },
    5: {
      title: 'Karma Sanyasa Yoga — Harmonie von Entsagung und Tat',
      essence: 'Vereint aktives Wirken in der Gesellschaft mit innerer Gelöstheit, gleich einem Lotusblatt, das vom Wasser unberührt bleibt.',
    },
    6: {
      title: 'Dhyana Yoga — Der Yoga der Meditation und Selbstbeherrschung',
      essence: 'Lehrt disziplinierte Meditation, Festigkeit des Geistes und den Ruf, sich selbst mit Mitgefühl für alle Wesen zu erheben.',
    },
    7: {
      title: 'Jnana Vijnana Yoga — Wissen und verwirklichte Weisheit',
      essence: 'Verbindet das geistige Verstehen der Naturprinzipien mit der unmittelbaren Erfahrung der zugrunde liegenden Einheit.',
    },
    8: {
      title: 'Akshara Brahma Yoga — Das unvergängliche Absolute',
      essence: 'Ergründet die kosmische Kontinuität, beständiges Erinnern durch alle Lebensübergänge und die Betrachtung des unvergänglichen Absoluten.',
    },
    9: {
      title: 'Raja Vidya Raja Guhya Yoga — Königliches Wissen und Hingabe',
      essence: 'Entfaltet die erhabene, zugängliche Wissenschaft, die reine Hingabe mit universeller Offenheit für jeden aufrichtigen Sucher verbindet.',
    },
    10: {
      title: 'Vibhuti Yoga — Der Yoga der göttlichen Herrlichkeit',
      essence: 'Erkennt Vollkommenheit, Schönheit, Harmonie und edle Lebenskraft in Natur und Kultur als Spiegelungen einer einzigen Quelle.',
    },
    11: {
      title: 'Vishwarupa Darshana Yoga — Schau der kosmischen Gestalt',
      essence: 'Enthüllt die ehrfurchtgebietende Verbundenheit von Kosmos, Zeit und Schöpfung, bevor er zur sanften persönlichen Nähe zurückkehrt.',
    },
    12: {
      title: 'Bhakti Yoga — Der Yoga der liebenden Hingabe',
      essence: 'Preist liebende Hingabe und nennt zeitlose Tugenden: Feindschaftslosigkeit, Freundlichkeit, Mitgefühl, Vergebung und Frieden.',
    },
    13: {
      title: 'Kshetra Kshetrajna Vibhaga Yoga — Das Feld und sein Kenner',
      essence: 'Untersucht den Unterschied zwischen Körper-Geist-Erfahrung (das Feld) und dem leuchtenden Zeugenbewusstsein (dem Kenner).',
    },
    14: {
      title: 'Gunatraya Vibhaga Yoga — Die drei Eigenschaften der Natur',
      essence: 'Zeigt, wie Sattva (Klarheit), Rajas (Dynamik) und Tamas (Trägheit) das Wesen prägen und wie man ins Gleichgewicht aufsteigt.',
    },
    15: {
      title: 'Purushottama Yoga — Der Yoga des höchsten Geistes',
      essence: 'Nutzt das Gleichnis des umgekehrten Weltenbaums, um Wurzeln im Ewigen Bewusstsein und Harmonie in allen Welten zu zeigen.',
    },
    16: {
      title: 'Daivasura Sampad Vibhaga Yoga — Edle und bindende Neigungen',
      essence: 'Stellt Furchtlosigkeit, Wahrhaftigkeit, Sanftmut und Großzügigkeit gegen Egoismus und Zorn als Kompass ethischen Charakters.',
    },
    17: {
      title: 'Shraddhatraya Vibhaga Yoga — Drei Dimensionen des Glaubens',
      essence: 'Prüft, wie tiefster Glaube Sprache, Nahrung, Geben und Selbstdisziplin formt – und schließt mit Om Tat Sat.',
    },
    18: {
      title: 'Moksha Sanyasa Yoga — Synthese von Befreiung und Pflicht',
      essence: 'Führt Karma, Bhakti und Jnana in eine leuchtende Synthese zusammen, wo Weisheit und sinnvolles Handeln in Frieden münden.',
    },
  },
  it: {
    1: {
      title: 'Arjuna Vishada Yoga — Lo Yoga dello Sconforto di Arjuna',
      essence: 'Sulla soglia di Kurukshetra, l’angoscia morale di Arjuna apre il dialogo sacro tra il dubbio umano e la saggezza perenne.',
    },
    2: {
      title: 'Sankhya Yoga — Saggezza Analitica ed Equanimità',
      essence: 'Distingue il Sé imperituro dal corpo mutevole e fonda l’equanimità nel dovere e nell’azione retta (sthitaprajna).',
    },
    3: {
      title: 'Karma Yoga — Lo Yoga dell’Azione Disinteressata',
      essence: 'Mostra come l’azione dedicata e priva di egoismo compiuta per il bene comune (lokasangraha) conduca alla libertà interiore.',
    },
    4: {
      title: 'Jnana Karma Sanyasa Yoga — Saggezza e Sacrificio nell’Azione',
      essence: 'Rivela la trasmissione perenne della saggezza attraverso le ere e come la vera conoscenza santifichi l’azione quotidiana.',
    },
    5: {
      title: 'Karma Sanyasa Yoga — Armonia di Rinuncia e Azione',
      essence: 'Armonizza l’impegno attivo nella società con il distacco interiore, come la foglia di loto non toccata dall’acqua.',
    },
    6: {
      title: 'Dhyana Yoga — Lo Yoga della Meditazione e Padronanza di Sé',
      essence: 'Presenta la meditazione disciplinata, la fermezza della mente e l’invito a elevare se stessi con compassione verso tutti gli esseri.',
    },
    7: {
      title: 'Jnana Vijnana Yoga — Conoscenza e Saggezza Realizzata',
      essence: 'Unisce la comprensione intellettuale dei principi della natura alla realizzazione diretta dell’unità sottostante.',
    },
    8: {
      title: 'Akshara Brahma Yoga — L’Assoluto Imperituro',
      essence: 'Esplora la continuità cosmica, il ricordo costante nelle transizioni della vita e la contemplazione dell’Assoluto eterno.',
    },
    9: {
      title: 'Raja Vidya Raja Guhya Yoga — Conoscenza Sovrana e Devozione',
      essence: 'Espone la scienza sovrana e accessibile che unisce pura devozione e inclusione universale per ogni ricercatore sincero.',
    },
    10: {
      title: 'Vibhuti Yoga — Lo Yoga dello Splendore Divino',
      essence: 'Riconosce l’eccellenza, la bellezza, l’armonia e la nobile vitalità nella natura e nella cultura come riflessi di un’unica fonte.',
    },
    11: {
      title: 'Vishwarupa Darshana Yoga — Visione della Forma Cosmica',
      essence: 'Svela la maestosa interconnessione di cosmo, tempo e creazione prima di tornare alla mite vicinanza personale.',
    },
    12: {
      title: 'Bhakti Yoga — Lo Yoga della Devozione e del Cuore Compassionevole',
      essence: 'Celebra la devozione amorevole ed enumera virtù eterne: assenza di ostilità, amicizia, compassione, perdono e pace.',
    },
    13: {
      title: 'Kshetra Kshetrajna Vibhaga Yoga — Il Campo e il Suo Conoscitore',
      essence: 'Esamina la distinzione tra l’esperienza corpo-mente (il Campo) e la luminosa consapevolezza testimone (il Conoscitore).',
    },
    14: {
      title: 'Gunatraya Vibhaga Yoga — Le Tre Modalità della Natura',
      essence: 'Mostra come Sattva (chiarezza), Rajas (dinamismo) e Tamas (inerzia) plasmino il temperamento umano e come raggiungere l’equilibrio.',
    },
    15: {
      title: 'Purushottama Yoga — Lo Yoga dello Spirito Supremo',
      essence: 'Usa la metafora del baniano cosmico capovolto per mostrare le radici nella Coscienza Eterna e l’armonia nei mondi viventi.',
    },
    16: {
      title: 'Daivasura Sampad Vibhaga Yoga — Tendenze Nobili e Vincolanti',
      essence: 'Contrappone coraggio, veracità, mitezza e carità a egoismo e ira come bussola per il carattere etico.',
    },
    17: {
      title: 'Shraddhatraya Vibhaga Yoga — Tre Dimensioni della Fede',
      essence: 'Esamina come la fede profonda plasmi parola, nutrimento, generosità e autodisciplina, concludendo con Om Tat Sat.',
    },
    18: {
      title: 'Moksha Sanyasa Yoga — Sintesi di Liberazione e Retto Dovere',
      essence: 'Raccoglie Karma, Bhakti e Jnana in una sintesi luminosa dove la saggezza incontra l’azione consapevole nella pace.',
    },
  },
  pt: {
    1: {
      title: 'Arjuna Vishada Yoga — O Yoga do Desalento de Arjuna',
      essence: 'No limiar de Kurukshetra, a angústia moral de Arjuna abre o diálogo sagrado entre a incerteza humana e a sabedoria eterna.',
    },
    2: {
      title: 'Sankhya Yoga — Sabedoria Analítica e Equanimidade',
      essence: 'Distingue o Ser imperecível do corpo passageiro e estabelece o equilíbrio mental no dever e na ação (sthitaprajna).',
    },
    3: {
      title: 'Karma Yoga — O Yoga da Ação Altruísta',
      essence: 'Demonstra como a ação dedicada e desinteressada realizada pelo bem coletivo (lokasangraha) conduz à liberdade interior.',
    },
    4: {
      title: 'Jnana Karma Sanyasa Yoga — Sabedoria e Sacrifício na Ação',
      essence: 'Revela a transmissão perene da sabedoria através das eras e como o verdadeiro conhecimento santifica o agir cotidiano.',
    },
    5: {
      title: 'Karma Sanyasa Yoga — Harmonia entre Renúncia e Ação',
      essence: 'Harmoniza o engajamento ativo na sociedade com o desapego interior, como a folha de lótus intocada pela água.',
    },
    6: {
      title: 'Dhyana Yoga — O Yoga da Meditação e Autodomínio',
      essence: 'Apresenta a meditação disciplinada, a firmeza da mente e o chamado a elevar-se com compaixão por todos os seres.',
    },
    7: {
      title: 'Jnana Vijnana Yoga — Conhecimento e Sabedoria Realizada',
      essence: 'Une a compreensão intelectual dos princípios da natureza à realização experiencial direta da unidade subjacente.',
    },
    8: {
      title: 'Akshara Brahma Yoga — O Absoluto Imperecível',
      essence: 'Explora a continuidade cósmica, a lembrança firme nas transições da vida e a contemplação do Absoluto imperecível.',
    },
    9: {
      title: 'Raja Vidya Raja Guhya Yoga — Conhecimento Soberano e Devoção',
      essence: 'Expõe a ciência soberana e acessível que une devoção pura e inclusão universal para todo buscador sincero.',
    },
    10: {
      title: 'Vibhuti Yoga — O Yoga do Esplendor Divino',
      essence: 'Reconhece a excelência, a beleza, a harmonia e a vitalidade nobre na natureza e na cultura como reflexos de uma única fonte.',
    },
    11: {
      title: 'Vishwarupa Darshana Yoga — Visão da Forma Cósmica',
      essence: 'Desvenda a interconexão grandiosa do cosmos, do tempo e da criação antes de retornar à serena amizade pessoal.',
    },
    12: {
      title: 'Bhakti Yoga — O Yoga da Devoção e Coração Compassivo',
      essence: 'Celebra a devoção amorosa e enumera virtudes atemporais: ausência de inimizade, amizade, compaixão, perdão e paz.',
    },
    13: {
      title: 'Kshetra Kshetrajna Vibhaga Yoga — O Campo e Seu Conhecedor',
      essence: 'Examina a distinção entre a experiência corpo-mente (o Campo) e a luminosa consciência testemunha (o Conhecedor).',
    },
    14: {
      title: 'Gunatraya Vibhaga Yoga — Os Três Modos da Natureza',
      essence: 'Mapeia como Sattva (clareza), Rajas (dinamismo) e Tamas (inércia) moldam o temperamento humano e como alcançar equilíbrio.',
    },
    15: {
      title: 'Purushottama Yoga — O Yoga do Espírito Supremo',
      essence: 'Usa a metáfora da figueira cósmica invertida para ilustrar raízes na Consciência Eterna e harmonia entre os mundos.',
    },
    16: {
      title: 'Daivasura Sampad Vibhaga Yoga — Tendências Nobres e Limitantes',
      essence: 'Contrasta destemor, veracidade, mansidão e caridade contra egoísmo e ira como bússola para o caráter ético.',
    },
    17: {
      title: 'Shraddhatraya Vibhaga Yoga — Três Dimensões da Fé',
      essence: 'Examina como a fé profunda molda a fala, o alimento, a generosidade e a autodisciplina, concluindo com Om Tat Sat.',
    },
    18: {
      title: 'Moksha Sanyasa Yoga — Síntese de Libertação e Dever Justo',
      essence: 'Reúne Karma, Bhakti e Jnana em síntese luminosa, culminando onde a sabedoria encontra a ação serena em paz.',
    },
  },
  ru: {
    1: {
      title: 'Арджуна-вишада-йога — Йога отчаяния Арджуны',
      essence: 'На пороге Курукшетры нравственная скорбь Арджуны открывает священный диалог между человеческим сомнением и вечной мудростью.',
    },
    2: {
      title: 'Санкхья-йога — Путь аналитической мудрости и равновесия',
      essence: 'Отличает нетленное «Я» от преходящего тела и утверждает невозмутимость духа в долге и действии (стхитапраджня).',
    },
    3: {
      title: 'Карма-йога — Йога бескорыстного действия',
      essence: 'Показывает, как преданное и бескорыстное служение общему благу (локасанграха) ведет к внутренней свободе.',
    },
    4: {
      title: 'Джняна-карма-санньяса-йога — Мудрость и жертвенность в действии',
      essence: 'Раскрывает непрерывную передачу мудрости сквозь века и то, как истинное знание освящает повседневный труд.',
    },
    5: {
      title: 'Карма-санньяса-йога — Гармония отречения и действия',
      essence: 'Соединяет деятельное участие в жизни общества с внутренней непривязанностью, подобно листу лотоса, не смоченному водой.',
    },
    6: {
      title: 'Дхьяна-йога — Йога медитации и самообладания',
      essence: 'Представляет дисциплину созерцания, устойчивость ума и призыв возвысить себя собственным усилием с состраданием ко всем существам.',
    },
    7: {
      title: 'Джняна-виджняна-йога — Знание и реализованная мудрость',
      essence: 'Объединяет интеллектуальное постижение законов природы с живым опытом единства всего сущего.',
    },
    8: {
      title: 'Акшара-брахма-йога — Непреходящий Абсолют',
      essence: 'Исследует космическую непрерывность, устойчивую память на всех переходах жизни и созерцание вечного Абсолюта.',
    },
    9: {
      title: 'Раджа-видья раджа-гухья-йога — Царственное знание и преданность',
      essence: 'Излагает доступную каждому искреннему искателю науку, соединяющую чистую преданность со всеобщим принятием.',
    },
    10: {
      title: 'Вибхути-йога — Йога божественного великолепия',
      essence: 'Видит совершенство, красоту, гармонию и благородную силу в природе и культуре как отражения единого Источника.',
    },
    11: {
      title: 'Вишварупа-даршана-йога — Видение Вселенской формы',
      essence: 'Открывает величественную взаимосвязь космоса, времени и творения, прежде чем вернуться к мягкому дружескому облику.',
    },
    12: {
      title: 'Бхакти-йога — Йога преданности и сострадательного сердца',
      essence: 'Прославляет любящую преданность и называет вечные добродетели: невраждебность, дружелюбие, сострадание, прощение и покой.',
    },
    13: {
      title: 'Кшетра-кшетраджня-вибхага-йога — Поле и Знающий поле',
      essence: 'Рассматривает различие между опытом тела-ума (Полем) и сияющим свидетельствующим сознанием (Знающим).',
    },
    14: {
      title: 'Гунатрая-вибхага-йога — Три гуны природы',
      essence: 'Показывает, как саттва (ясность), раджас (активность) и тамас (инерция) формируют характер человека и как обрести равновесие.',
    },
    15: {
      title: 'Пурушоттама-йога — Йога Высшего Духа',
      essence: 'Через образ перевернутого космического дерева показывает, что корни всего сущего уходят в Вечное Сознание.',
    },
    16: {
      title: 'Дайвасура-сампат-вибхага-йога — Благородные и связывающие качества',
      essence: 'Противопоставляет бесстрашие, правдивость, мягкость и щедрость эгоизму и гневу как ориентир нравственного характера.',
    },
    17: {
      title: 'Шраддхатрая-вибхага-йога — Три измерения веры',
      essence: 'Показывает, как глубинная вера формирует речь, пищу, дарение и самодисциплину, завершаясь формулой «Ом Тат Сат».',
    },
    18: {
      title: 'Мокша-санньяса-йога — Синтез освобождения и праведного долга',
      essence: 'Объединяет Карму, Бхакти и Джняну в светлый синтез, где мудрость соединяется с осмысленным действием в мире.',
    },
  },
  zh: {
    1: {
      title: '阿周那忧悲瑜伽 — 道德困境与心灵觉察',
      essence: '在俱卢之野的战场边缘，阿周那的道德苦恼开启了人类困惑与永恒智慧之间的神圣对话。',
    },
    2: {
      title: '数论瑜伽 — 智慧辨析与平等心境',
      essence: '明辨不朽真我与无常色身之别，确立在职责与行动中保持内心平静（定慧者）之道。',
    },
    3: {
      title: '业瑜伽 — 无私行动之道',
      essence: '阐明为了大众福祉（护持世间）而不执着果报的奉献行动，如何引领人走向内在自由。',
    },
    4: {
      title: '智慧与弃业瑜伽 — 行动中的觉悟与奉献',
      essence: '揭示历代相传的永恒智慧，以及真知如何使日常行动变得神圣而清净。',
    },
    5: {
      title: '弃业与行瑜伽 — 出世静心与入世实践的和谐',
      essence: '将积极参与社会事务与内在超脱相协调，犹如莲叶不受水滴沾染。',
    },
    6: {
      title: '禅定瑜伽 — 静心冥想与自我掌控',
      essence: '阐释律己禅修、心意坚定，以及怀着对众生的慈悲自我提升之道。',
    },
    7: {
      title: '智识瑜伽 — 理论真知与亲证智慧',
      essence: '将对自然法则的理性认知与万物一体意识的直接体悟融为一体。',
    },
    8: {
      title: '不朽至上瑜伽 — 宇宙连续与永恒真理',
      essence: '探讨宇宙的连续性、生命各阶段中恒常的忆念，以及对不朽绝对真理的沉思。',
    },
    9: {
      title: '王道秘智瑜伽 — 至上智慧与虔敬之心',
      essence: '阐明人人皆可修习的崇高正道，将纯净虔诚与普世包容融汇于真诚求道者心中。',
    },
    10: {
      title: '神圣显现瑜伽 — 万象中的至美与光辉',
      essence: '认识到自然与人类文化中展现的卓越、美善与和谐，皆是同一本源的映照。',
    },
    11: {
      title: '宇宙法身显现瑜伽 — 万有合一的壮丽景象',
      essence: '展现宇宙、时间与万象交织的壮阔图景，随后复归温和亲切的伴侣之姿。',
    },
    12: {
      title: '虔爱瑜伽 — 慈悲与无怨之爱的修行',
      essence: '赞颂挚爱奉献并列举永恒美德：无怨恨、友善、慈悲、宽恕与安宁。',
    },
    13: {
      title: '田与知田者辨析瑜伽 — 身心境域与觉照真我',
      essence: '辨析身心经验之“田”与明澈观照之“知田者”之间的精微差异。',
    },
    14: {
      title: '三德辨析瑜伽 — 自然界的三重属性',
      essence: '剖析纯质（清明）、激质（活力）与惰质（沉滞）如何塑造人性，并指明超越而归于平衡之道。',
    },
    15: {
      title: '至上精神瑜伽 — 宇宙倒悬之树的隐喻',
      essence: '以根在上方、枝叶向下的宇宙菩提树为喻，说明万物皆扎根于永恒意识。',
    },
    16: {
      title: '神圣与魔性特质辨析瑜伽 — 德行与执念之别',
      essence: '将无畏、诚实、柔和与布施等高尚品德与傲慢、愤怒相对照，树立伦理人格的指南。',
    },
    17: {
      title: '三重信念辨析瑜伽 — 信仰在言行中的展现',
      essence: '审视深层信念如何塑造言语、饮食、布施与自律，并以“唵·达特·萨特”作结。',
    },
    18: {
      title: '解脱与弃绝瑜伽 — 智慧、行动与和平的圆融',
      essence: '将业、虔爱与智慧三大瑜伽融会贯通，揭示智慧与正行合一之处即是和平与吉祥所在。',
    },
  },
  ja: {
    1: {
      title: 'アルジュナの憂愁のヨーガ — 戦場における倫理的葛藤',
      essence: 'クルクシェートラの戦場の入り口で、アルジュナの道徳的苦悩が人間の迷いと永遠の叡智を結ぶ聖なる対話を開きます。',
    },
    2: {
      title: 'サーンキヤのヨーガ — 分析的叡智と不動の平静',
      essence: '不滅の真我と移ろいゆく肉体を識別し、義務と行為における平等心（スティタプラジュニャ）を確立します。',
    },
    3: {
      title: 'カルマ・ヨーガ — 無私の行為のヨーガ',
      essence: '世の安寧（ローカサングラハ）のために執着なく捧げる行為が、いかにして内なる自由へ導くかを示します。',
    },
    4: {
      title: 'ジュニャーナ・カルマ・サンニャーサのヨーガ — 叡智と捧げられた行為',
      essence: '時代を超えて受け継がれる永遠の叡智の系譜と、真の知が日々の行いを清める道理を明かします。',
    },
    5: {
      title: 'カルマ・サンニャーサのヨーガ — 放棄と行為の調和',
      essence: '社会における積極的な関わりと内面の無執着を調和させ、水に濡れぬ蓮の葉のような生き方を説きます。',
    },
    6: {
      title: 'ディヤーナ・ヨーガ — 瞑想と自己統御の道',
      essence: '規律ある瞑想、心の静定、そしてすべての生き物への慈悲をもって自らを高める実践を示します。',
    },
    7: {
      title: 'ジュニャーナ・ヴィジュニャーナのヨーガ — 知識と体得された叡智',
      essence: '自然の諸原理に対する知的理解と、根底にある一元性の直接的な体悟を結びつけます。',
    },
    8: {
      title: 'アクシャラ・ブラフマのヨーガ — 不滅の絶対真理',
      essence: '宇宙の連続性、人生のあらゆる節目における絶え間ない想起、そして不滅の絶対者への瞑想を探究します。',
    },
    9: {
      title: 'ラージャ・ヴィディヤーのヨーガ — 至高の知と信愛',
      essence: '純粋な献身と普遍的な包摂性を結びつけ、誠実な求道者すべてに開かれた王道の叡智を説きます。',
    },
    10: {
      title: 'ヴィブーティのヨーガ — 神聖なる荘厳の顕現',
      essence: '自然と人間文化に表れる卓越性、美、調和、高貴な生命力のすべてが単一の源泉の反映であると見抜きます。',
    },
    11: {
      title: 'ヴィシュヴァルーパ・ダルシャナのヨーガ — 宇宙的姿の顕現',
      essence: '宇宙・時間・創造の壮大な結びつきを啓示したのち、穏やかな親愛の姿へと立ち返ります。',
    },
    12: {
      title: 'バクティ・ヨーガ — 信愛と慈悲の心の道',
      essence: '愛に満ちた献身を讃え、無敵意、友愛、慈悲、寛容、平安といった時代を超えた徳目を説きます。',
    },
    13: {
      title: 'クシェートラ・クシェートラジュニャのヨーガ — 場とそれを知る者',
      essence: '心身の経験の場（クシェートラ）と、それを照らし観る純粋な証人意識（クシェートラジュニャ）の違いを見極めます。',
    },
    14: {
      title: 'グナトラヤ・ヴィバーガのヨーガ — 自然界の三性質',
      essence: 'サットヴァ（明澄）、ラジャス（活動）、タマス（惰性）がいかに人間の気質を形作り、調和へ至るかを示します。',
    },
    15: {
      title: 'プルショッタマのヨーガ — 至高の精神',
      essence: '根を天に張り枝を下へ伸ばす宇宙の菩提樹の比喩により、万有の根源が永遠の意識にあることを示します。',
    },
    16: {
      title: 'ダイヴァースラ・サンパットのヨーガ — 神聖なる徳と束縛する傾向',
      essence: '無畏、誠実、柔和、布施などの高貴な資質を傲慢や怒りと対比し、倫理的品性の羅針盤とします。',
    },
    17: {
      title: 'シュラッダートラヤ・ヴィバーガのヨーガ — 信念の三つの次元',
      essence: '深い信念が言葉、食事、施し、自己鍛錬をいかに形作るかを考察し、「オーム・タット・サット」で結びます。',
    },
    18: {
      title: 'モークシャ・サンニャーサのヨーガ — 解脱と正しき務めの統合',
      essence: 'カルマ・バクティ・ジュニャーナを光り輝く統合へと導き、叡智と正しき行為が出会う所に平安と福祉があると結びます。',
    },
  },
};
