// Herp-keeping terms by topic; the /glossary page lists them A–Z.
export const GLOSSARY: { group: string; terms: { term: string; aka?: string; def: string }[] }[] = [
  {
    group: "Genetics & morphs",
    terms: [
      { term: "Morph", def: "A colour or pattern variety produced by one or more genes, such as Pastel or Clown in ball pythons." },
      { term: "Normal", aka: "Wild type", def: "An animal with no known morph genes; it looks like the species does in the wild." },
      { term: "Visual", def: "An animal that shows a trait, as opposed to one that only carries it." },
      { term: "Het", aka: "Heterozygous", def: "Carries one copy of a recessive gene without showing it. A \"het Clown\" looks normal but passes Clown on to about half its babies." },
      { term: "Possible het", aka: "Poss het, 50% / 66% het", def: "An animal that might be het. \"66% poss het\" means there's a two-in-three chance it carries the gene, typically a normal-looking baby from two hets." },
      { term: "Recessive", def: "A gene that only shows with two copies. Breed two hets and about 25% of babies are visual." },
      { term: "Co-dominant", aka: "Incomplete dominant", def: "A gene that shows with one copy and looks different with two (the super form). Pastel is co-dominant; Super Pastel has two copies." },
      { term: "Dominant", def: "A gene that shows with one copy, where two copies look the same as one." },
      { term: "Super", def: "The two-copy form of a co-dominant gene, such as Super Pastel or Ivory (super Yellow Belly). Some supers are lethal or have health issues." },
      { term: "Allelic", aka: "Complex", def: "Genes that are different versions of the same gene spot, so an animal can carry at most two of them. Mojave, Lesser and Butter form the BEL complex in ball pythons." },
      { term: "Line-bred", aka: "Polygenic", def: "A trait shaped by many genes and selective breeding, like Tangerine leopard geckos. Its odds can't be calculated." },
      { term: "Wobble", def: "A neurological head-tracking problem linked to some genes, such as Spider in ball pythons." },
      { term: "Locality", def: "Animals descended from a specific wild population, kept pure rather than mixed with other populations." },
    ],
  },
  {
    group: "Breeding",
    terms: [
      { term: "Pairing", def: "Putting a male and female together to breed." },
      { term: "Lock", def: "When two snakes are mating; a lock can last from minutes to many hours." },
      { term: "Clutch", def: "A set of eggs laid together by one female." },
      { term: "Slug", def: "An infertile egg; usually small, yellowish and soft." },
      { term: "Pip", def: "When a hatchling first cuts through its eggshell. Babies often stay in the egg for a day or two after pipping." },
      { term: "TSD", aka: "Temperature-dependent sex determination", def: "In many lizards and turtles, incubation temperature decides whether babies are male or female." },
      { term: "Parthenogenesis", def: "Reproduction without a male; documented in several snakes and lizards." },
      { term: "Holdback", def: "An animal a breeder keeps from a clutch instead of selling it, usually for future breeding." },
      { term: "CB / CH / WC", def: "Captive bred, captive hatched (eggs collected from the wild) and wild caught. CB animals are generally healthier and better adjusted." },
    ],
  },
  {
    group: "Husbandry",
    terms: [
      { term: "Thermal gradient", def: "A warm end and a cool end in one enclosure so the animal can regulate its own body temperature." },
      { term: "Basking spot", def: "The hottest area under a heat lamp where diurnal reptiles warm up." },
      { term: "UVB", def: "Ultraviolet light that lets many reptiles make vitamin D3 and use calcium. Essential for most diurnal lizards and turtles." },
      { term: "Brumation", def: "A winter slowdown in reptiles, similar to hibernation: less eating and activity for weeks or months." },
      { term: "Bioactive", def: "An enclosure with live plants and clean-up crew insects (isopods, springtails) that break down waste." },
      { term: "Substrate", def: "The bedding on the enclosure floor, such as soil, bark, paper or sand." },
      { term: "Gut-loading", def: "Feeding insects a nutritious diet before they are fed to a reptile." },
      { term: "Dusting", def: "Coating feeder insects with calcium or vitamin powder." },
      { term: "F/T", aka: "Frozen-thawed", def: "Frozen rodents thawed before feeding; safer than live prey." },
      { term: "Pinky, fuzzy, hopper", def: "Feeder rodent sizes, from newborn (pinky) to just-furred (fuzzy) to young and active (hopper)." },
    ],
  },
  {
    group: "Health",
    terms: [
      { term: "Ecdysis", aka: "Shedding", def: "Shedding of the skin. Snakes usually shed in one piece; lizards in patches." },
      { term: "Dysecdysis", aka: "Stuck shed", def: "An incomplete or difficult shed, often from low humidity." },
      { term: "Retained eye caps", def: "Eye scales left behind after a snake's shed." },
      { term: "MBD", aka: "Metabolic bone disease", def: "Weak, deformed bones from lack of calcium, vitamin D3 or UVB. Preventable with proper lighting and supplements." },
      { term: "Impaction", def: "A blockage of the gut, often from swallowed substrate or oversized food." },
      { term: "Regurgitation", def: "Bringing up a meal, often due to handling too soon, wrong temperatures, stress or illness." },
      { term: "RI", aka: "Respiratory infection", def: "A lung infection, often linked to temperatures or humidity being wrong; signs include wheezing and mouth breathing." },
    ],
  },
];

export const termAnchor = (term: string) =>
  term.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
