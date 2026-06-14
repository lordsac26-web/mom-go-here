/**
 * A broad set of common English words (3+ letters) used to validate
 * "bonus" submissions in Buzz Word — words that are real but aren't
 * in the puzzle's curated target list.
 *
 * This set is intentionally large but excludes very obscure/archaic words
 * to keep the experience fair and fun.
 */

const COMMON_WORDS = new Set([
  // 3-letter words
  "ace","act","add","age","ago","aid","aim","air","ale","all","and","ant","ape","arc","are","ark","arm","art","ash","ate","awe","axe","aye",
  "bad","bag","ban","bar","bat","bay","bed","bet","bid","big","bit","bog","bow","box","boy","bud","bug","bun","bus","but","buy",
  "cab","can","cap","car","cat","cob","cod","cog","cop","cot","cow","cry","cub","cup","cur","cut",
  "dab","dad","dam","den","dew","did","dig","dim","dip","dog","dot","dry","dub","dug","dun","duo",
  "ear","eat","eel","egg","ego","elf","elk","elm","end","era","eve","ewe","eye",
  "fad","fan","far","fat","fee","few","fig","fin","fit","fix","fly","fog","for","fox","fry","fun","fur",
  "gag","gap","gas","gel","gem","get","gig","gin","gnu","god","got","gum","gun","gut","guy",
  "had","ham","has","hat","hay","hen","her","hew","hid","him","hip","his","hit","hob","hoe","hog","hop","hot","how","hub","hue","hug","hum","hun",
  "ice","ill","imp","ink","ion","ire","ivy",
  "jab","jag","jam","jar","jaw","jet","jig","job","jog","joy","jug","jut",
  "keg","kin","kit",
  "lab","lag","lap","law","lay","led","leg","let","lid","lip","lit","log","lot","low",
  "mad","man","map","mat","maw","met","mid","mix","mob","mod","mop","mud","mug","mum","nag","nap","net","nip","nod","nor","not","now","nun","nut",
  "oak","oaf","oar","oat","odd","off","oil","old","one","opt","orb","ore","our","out","owe","owl","own",
  "pad","pal","pan","pap","par","pat","paw","pay","pea","peg","pen","pet","pie","pig","pin","pit","ply","pod","pop","pot","pun","pup","put",
  "rag","ram","ran","rap","rat","raw","ray","red","ref","rep","rid","rig","rim","rip","rob","rod","rot","row","rub","rug","rum","run","rut","rye",
  "sad","sag","sap","sat","saw","say","sea","set","sew","shy","sin","sip","sir","sit","six","ski","sky","sly","sob","sod","son","sow","spa","spy","sty","sub","sum","sun",
  "tab","tag","tan","tap","tar","tax","tea","ten","the","tie","tin","tip","toe","top","tow","toy","try","tub","tug","two",
  "urn","use",
  "van","vat","vet","vex","via","vie",
  "wad","war","was","wax","wed","wet","who","wig","win","wit","woe","wok","won","woo",
  "yak","yam","yap","yaw","yen","yet","yew","you",
  "zap","zen","zig","zip","zoo",
  // 4-letter words
  "able","ache","acre","acts","aged","ages","aide","aims","airs","airy","also","alto","amen","ammo","amps","amok","apes","arch","area","arms","army","arcs","arts","ashy","asks","atom","atop","auto","avid","avow","away","awed","awry","axes",
  "babe","back","bade","bake","bale","balk","ball","balm","band","bane","bang","bank","bare","bark","barn","base","bash","bask","bate","bath","bats","bawl","bead","beak","beam","bean","bear","beat","beef","been","beer","bees","beet","bell","belt","bend","best","bile","bill","bind","bite","bled","blew","blob","bloc","blog","blot","blow","blue","blur","boar","boat","body","bold","bolt","bond","bone","book","boom","boon","boot","bore","born","both","bout","brag","bred","brew","brim","brow","buck","buff","bulk","bull","bump","bunk","burn","burp","burr","bush","bust","buzz",
  "cafe","cage","cake","calf","call","calm","came","camp","cane","care","carp","cart","case","cash","cast","cave","cell","chap","char","chef","chin","chip","chop","chow","cite","clad","clam","clap","clay","clef","clip","clog","clot","club","clue","coal","coat","coil","coin","cold","colt","come","cone","cook","cool","cope","copy","cord","core","cork","corn","cost","cozy","crab","crew","crop","crow","cube","cuff","cult",
  "daft","damp","dare","dark","darn","dart","dash","data","date","dawn","days","daze","dead","deaf","deal","dean","debt","deck","deep","deer","deft","deli","demo","deny","desk","dial","dice","died","diet","dill","dine","dirt","dish","disk","dive","dock","dole","dome","done","doom","door","dose","dove","down","drab","drag","draw","drew","drip","drop","drum","dual","duel","dull","dumb","dump","dune","dusk","dust","duty",
  "each","earl","earn","ease","east","easy","edge","emit","epic","even","ever","evil","exam",
  "face","fact","fade","fail","fair","fake","fall","fame","farm","fast","fate","fawn","faze","fear","feat","feed","feel","feet","fell","felt","fend","fern","fill","film","find","fine","fire","firm","fish","fist","five","flag","flap","flat","flaw","flea","fled","flew","flex","flit","flop","flow","foam","fold","fond","font","food","fool","foot","fore","fork","form","fort","foul","four","free","fret","from","fuel","full","fume","fund","fuse","fuzz",
  "gale","gall","game","gang","gape","gash","gasp","gaze","gear","germ","gild","gill","gist","give","glee","glib","glob","glow","glue","gnaw","goal","goat","goes","gold","golf","gone","goof","gown","grab","grad","gram","gray","grew","grin","grip","grit","grow","grub","gulp","guru","gust","guts",
  "hack","hail","hair","hale","half","hall","halt","hand","hang","hard","hark","harm","harp","hash","hate","haul","have","hawk","haze","hazy","head","heal","heap","heed","heel","held","helm","help","herb","herd","here","hewn","hide","high","hike","hill","hint","hire","hoar","hoax","hold","hole","holm","home","hone","honk","hood","hook","hope","horn","hose","host","hour","howl","hulk","hull","hump","hung","hunt","hurl","hurt","hymn",
  "idle","into","iron",
  "jeer","jest","jilt","join","joke","jolt","junk",
  "keen","keep","kelp","kick","kill","kind","king","knit","knob","knot","know",
  "lack","lake","lamb","lame","lamp","land","lane","last","late","laud","lava","lawn","lazy","lead","leaf","leak","lean","leap","lend","lens","liar","lick","life","lift","like","lime","limp","line","link","lion","list","live","load","loam","loan","lock","loft","lone","long","look","loom","loon","loop","lore","lore","lose","lost","loud","lout","love","lull","lump","lung","lure","lurk","lush","lust",
  "mace","made","main","make","male","mall","malt","mane","many","mare","mark","mars","mash","mask","mast","mate","math","maul","maze","mead","meal","mean","meet","meld","melt","memo","mend","mere","mesh","mild","mile","mill","mime","mind","mine","mint","mire","miss","mist","moan","mode","mole","molt","monk","mood","moon","moor","more","moil","molt","much","mule","mull","murk","must","mute","myth",
  "nail","name","nape","nark","navy","near","neat","neck","need","nerd","news","next","nice","nick","nine","node","nome","none","noon","nope","norm","nose","note","numb",
  "oath","obey","once","only","open","orca","orbs","ores","oval","over","owed","owes",
  "pace","pack","page","paid","pail","pair","pale","palm","pane","pang","park","part","pass","past","path","pave","pawn","peak","peal","pear","peel","peer","pelt","perk","pest","pike","pile","pill","pine","pint","pipe","play","plea","plod","plot","plow","plug","plum","plus","poem","poet","poke","pole","poll","pond","pool","poor","pore","port","post","posy","pour","prey","prod","prop","prow","pull","pure","push",
  "quay","quit",
  "race","rack","raid","rail","rain","rake","ramp","rang","rank","rant","rasp","rate","rave","read","real","reap","reel","rein","rely","rend","rent","reek","rest","rice","rich","ride","rife","rile","ring","riot","ripe","rise","risk","rite","road","roam","roar","robe","role","roll","roof","rook","room","root","rope","rose","rosy","rout","rove","rule","rump","rune","ruse","rush","rust",
  "safe","sage","sail","sake","sale","salt","same","sand","sane","sang","sank","sash","save","scan","scar","seal","seam","sear","seat","seed","seek","seem","seep","self","sell","semi","send","sent","shed","shin","ship","shop","show","shun","shut","sick","side","sift","sigh","silk","sill","silo","sing","sink","sire","size","skid","skim","skip","slab","slag","slam","slap","slat","slaw","sled","slew","slim","slip","slot","slow","slug","slum","slur","smug","snag","snap","snip","snow","snub","soak","soap","soar","sock","soft","soil","sold","sole","some","sore","sort","soul","soup","sour","spin","spit","spot","stab","stag","star","stay","stem","step","stew","stir","stop","stub","stun","such","suit","sulk","sung","sunk","sure","surf","swam","swat","swim","swum","swung",
  "tail","tale","tall","tame","tamp","tank","taut","teak","teal","teem","tell","tend","term","test","text","than","that","them","then","they","thin","this","thorn","thou","tick","tide","tilt","time","tiny","tire","toll","tomb","tome","tong","took","toot","torn","tort","toss","tour","town","tray","tree","trek","trim","trio","trip","trod","true","tube","tuck","tuna","tune","turf","turn","tusk","tutu","twin","type",
  "ugly","unit","upon","used",
  "vale","vane","vase","veil","vein","very","vile","vine","void","vole","volt","vote","vow",
  "wade","wage","wail","wait","wake","walk","wall","wane","want","ward","warm","warn","warp","wart","wash","wasp","wave","weak","weal","wean","weed","week","well","welt","went","were","west","when","whim","whip","whir","whiz","wick","wide","wife","wild","will","wilt","wind","wine","wing","wink","wire","wise","wish","wisp","with","woke","wolf","wood","wool","word","wore","worm","worn","wove","wrap","wren","writ",
  "yard","yarn","year","yell","yoga","yoke","yolk","your","yowl",
  "zeal","zero","zinc","zone","zoom",
  // 5-letter words (broad common set)
  "abbey","abide","abode","about","above","abuse","acted","acute","admit","adobe","after","again","agile","aging","agree","ahead","aimed","alike","alive","alley","allow","alone","along","aloof","aloud","angel","anger","angle","angry","anime","ankle","annex","anvil","aorta","apart","apple","apply","aptly","arise","array","aside","asked","asset","atone","attic","audio","audit","augur","aunts","avail","avoid","awake","awful",
  "baker","balls","bands","banjo","basic","basil","basis","batch","beach","began","begin","being","below","bench","berry","bible","birds","blade","blame","bland","blank","blare","blast","blaze","bleak","blend","bless","blind","blink","block","blood","bloom","blown","board","bonus","booze","bored","brake","brand","brave","break","breed","brick","bride","brine","brisk","broke","brook","broom","brows","brown","brush","build","built","burnt","burst","buyer",
  "cadge","camel","cards","carry","cause","cease","chain","chair","chalk","chant","chaos","charm","chase","cheap","check","cheek","cheer","chess","chest","chick","chief","child","choir","chord","chore","chose","chunk","civic","civil","claim","clang","clash","class","clean","clear","clerk","click","cliff","cling","clock","clone","close","cloud","clown","clubs","clump","coast","comet","comma","comic","coral","cords","costs","count","cover","covet","craft","crave","crawl","creak","creek","creep","crest","crime","crisp","croak","cross","crowd","crown","crush","crust","curve",
  "daisy","dance","darts","datum","decoy","delve","depot","depth","derby","detox","devil","digit","diode","dirty","disco","ditch","diver","dizzy","dodge","doing","dolly","doubt","dough","donut","dowry","draft","drain","drape","drawl","dread","dream","dried","drink","drive","drove","drown","drove","dryer","dunce","dummy","dusky","duvet","dwarf","dwell","dying",
  "eager","eagle","early","earth","eight","elect","elite","email","ember","emoji","empty","ended","enjoy","enter","entry","epoch","equal","error","essay","event","every","exact","exist","extra","exult",
  "fable","faded","faint","fairy","faith","falls","false","fancy","fatal","favor","feast","feels","fence","fever","fiber","field","fiery","fight","filth","final","finch","first","flair","flame","flesh","flies","flock","flood","floss","found","frail","frame","franc","frank","fraud","freak","fresh","frill","frisk","front","frost","froze","frown","fruit","fudge","fungi","funky","funny","fuzzy",
  "gains","gaudy","gauge","gauze","gecko","geese","genie","genre","ghost","giant","girls","given","gizmo","gland","glare","glass","gleam","glean","glide","gloom","gloss","glove","glyph","going","gorge","goose","grace","grade","grail","grain","grand","granny","grape","grasp","grass","graze","greed","greet","grief","grill","grind","groan","groin","groom","gross","grout","gruel","gruff","grump","guess","guile","guise","gusto",
  "happy","harsh","haste","haunt","haven","havoc","heart","heavy","hedge","helix","helps","herbs","hinge","hippo","hobby","holly","honor","horns","hound","husky","hover","human","humid","humor",
  "icily","ideal","ident","image","imply","inane","index","indie","infer","ingot","inner","input","inter","intro","ionic","irate","itchy",
  "jelly","jewel","jimmy","joker","jolly","judge","juice","jumbo","jumpy","juror",
  "kayak","kebab","kitty","knack","kneel","knife","knock","known",
  "laden","ladle","lance","large","larva","laser","latch","layer","leach","learn","legal","lemon","level","light","liner","lives","llama","loathe","lobby","local","lodge","logic","lusty",
  "magic","manor","maple","marsh","match","maxim","media","medic","melee","mercy","merge","merit","merry","metal","micro","might","mimic","mirth","model","modem","mogul","moist","moldy","money","monks","month","moose","moult","mourn","muddy","muddle","music","murky","musty",
  "nadir","naive","newly","niece","night","noble","noise","north","nymph","noted","novel","nymph",
  "ocean","often","olive","omega","orbit","order","organ","other","outer","ovate","overt",
  "paint","pasta","patch","pause","paved","payee","peace","pedal","petty","phase","phone","photo","pilot","pixel","pizza","place","plaid","plain","plan","plank","plant","plate","plaza","plead","plumb","plume","point","polar","polka","poppy","porch","pound","prank","press","price","pride","prime","print","probe","prune","psalm","pulse","puppy","purge",
  "queen","quest","queue","quick","quiet","quilt","quota","quote",
  "radar","radio","raise","rally","raven","reach","rebel","refer","reign","relax","repay","repel","repot","rerun","reset","reuse","revel","rider","risky","rival","river","robin","rocky","rouge","rough","round","route","royal","rugby","ruler",
  "sadly","saint","salad","salvo","satin","satyr","sauce","sauna","savor","scald","scale","scalp","scam","scamp","scant","scary","scene","scone","scoop","scope","score","scout","screw","scrub","seedy","serve","seven","shape","share","shark","sharp","shift","shine","shirt","shore","short","shout","sight","siren","sixth","sixty","sized","skill","skimp","skirt","skull","slain","slope","slosh","slump","slunk","smart","smash","smear","smell","smile","smock","smoke","smolt","snack","snare","sneak","sniff","snore","snort","softy","solar","solid","south","space","spare","spark","spawn","speak","spear","spell","spend","spice","spill","spine","spire","spite","split","spoke","spoon","spray","spree","sprig","spunk","spurn","squad","squat","squid","stack","staff","stain","stale","stall","stamp","stand","stark","start","state","steal","steam","steel","steep","steer","stern","sting","stock","stoic","stone","stood","store","stork","storm","story","stout","stove","strap","straw","stray","strip","strum","strut","stuck","study","stung","stunt","style","sugar","suite","sunny","super","swamp","swear","sweat","sweep","sweet","swept","swift","swoon","swoop","sword",
  "table","tabby","taffy","tangy","taunt","tease","teeth","tempo","tense","tepid","terms","these","thick","thing","third","thorn","those","three","threw","throw","tiger","tight","tithe","title","toadstool","today","token","tonic","topic","topaz","torch","total","touch","tough","towel","tower","toxic","trace","track","tramp","trash","trawl","tread","trend","trial","tribe","tried","troll","trout","trove","truck","truly","trump","trunk","trust","truth","tying",
  "ulcer","ultra","uncle","uncut","under","undue","unify","unite","unity","unzip","upper","upset","usher","usual",
  "valid","value","vapor","vault","vicar","video","vigil","vigor","viral","vivid","visor","vivid","vocal","vodka","voice","vomit","voter","vouch",
  "wager","waltz","waned","wares","waste","watch","water","weary","weave","weird","whelp","where","which","while","whine","white","whole","whose","wider","width","wield","witty","woman","women","world","wordy","worse","worst","worth","would","wound","wrath","write","wrote","wrung",
  "yacht","yearn","yield","young","youth","yucky","yummy",
  "zesty","zonal",
  // 6-letter words (common)
  "abroad","accent","access","aching","active","actual","afford","afraid","agenda","agreed","albeit","allege","allure","almost","always","ambush","amount","animal","annual","answer","appeal","appear","arctic","arrive","around","aspire","assert","assort","attend","autumn","avenue","awkward",
  "banter","battle","beacon","beauty","before","behind","belief","belong","beside","better","bicker","blight","blossom","bounce","breath","bright","broken","browse","budget","bundle","burden",
  "cactus","candle","candor","canvas","career","castle","cement","center","change","charge","cherry","circle","closet","clever","coffee","commit","common","corner","course","credit","crisis","crystal","custom",
  "damage","danger","deadly","debate","decide","defend","define","degree","demand","desert","detail","devour","dinner","direct","dinner","dismal","divide","double","driver","duster",
  "eaglet","easily","edible","either","eleven","empire","endure","engage","engine","ensure","entire","escape","ethnic","except","excite","expanse","expert","export","extend","extent",
  "fabric","factor","fallen","family","famous","father","figure","finger","fiscal","flower","fluent","formal","former","foster","frenzy","frozen","future",
  "garden","garlic","gather","gentle","global","goblin","govern","gravel","greedy","grouse","growth","guitar",
  "hammer","handle","happen","hardly","height","herald","hermit","hidden","higher","holler","honest","horror","hunter",
  "income","infant","insect","insist","intent","invent","ironic",
  "jigsaw","jungle","joyful","jumble","junior","justify",
  "kettle","kimono","kindly","kitten","knight","knobby",
  "labyrinth","ladder","latest","launch","league","lessen","lesson","letter","limits","listen","lively","longer","looked","lovely","lumber","luxury",
  "madman","manner","marble","market","matter","meadow","medium","member","memory","mental","method","middle","mirror","missed","mitten","monkey","months","mortal","mother","murder","muscle","mutual","mystic",
  "narrow","nature","nearly","needle","nether","neural","nobody","noodle","normal","notice","novice","number",
  "object","office","officer","online","ornate","orphan","output","oyster",
  "palace","parent","partly","passion","pastel","patent","patter","payoff","pencil","people","period","permit","person","phrase","planet","please","plenty","pocket","police","potter","pretty","priest","prison","profit","proper","public","purple",
  "rabbit","random","rather","reason","recent","recipe","record","reduce","rescue","repeat","report","result","return","reveal","review","revive","rhythm","riddle","robust","rocket",
  "saddle","sample","school","search","season","secret","severe","should","signal","simple","single","sister","sketch","smooth","soccer","social","solemn","source","speech","spider","spirit","spoken","spread","spring","stable","statue","steady","sticky","stolen","stream","street","strict","strike","string","strong","sudden","suffer","summer","switch","symbol",
  "talent","target","temple","tender","tighten","timely","tissue","title","tongue","travel","twelve","tangle","tablet","triple","trophy",
  "unlike","update","useful","utmost","utter",
  "valley","varied","veiled","vendor","victim","vision","visual","violet","virtue",
  "wallet","wander","wealth","weekly","weight","whisper","wicker","window","wisdom","within","wonder","wooden","worker","worthy","wither",
  "yearly","yellow",
  "zombie","zoning",
]);

/**
 * Check if a word exists in the common English dictionary.
 * @param {string} word - lowercase word to check
 * @returns {boolean}
 */
export function isCommonWord(word) {
  return COMMON_WORDS.has(word.toLowerCase());
}

export default COMMON_WORDS;