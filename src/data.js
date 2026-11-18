export const cars = [
  {
    id: "r34",
    maker: "Nissan",
    name: "Skyline GT-R",
    code: "BNR34",
    generation: "R34",
    years: "1999–2002",
    year: 1999,
    engine: "RB26DETT",
    engineType: "2.6L twin-turbo inline-six",
    power: 280,
    torque: 392,
    weight: 1560,
    layout: "AWD",
    color: "#6e9bbb",
    photo: {
      src: "./media/studio/r34-studio-1114451028c1.webp",
      credit: "AI-generated studio image",
    },
    tag: "The all-round icon",
    description:
      "Precision, boost, and four wheels working as one. The R34 brought the GT-R formula into a new era, with an RB26 heart and a cockpit built around the driver.",
    story:
      "The fifth-generation Skyline GT-R paired ATTESA E-TS all-wheel drive with Super-HICAS rear-wheel steering. Its multifunction display made engine data part of the driving experience, long before digital dashboards became commonplace.",
  },
  {
    id: "supra",
    maker: "Toyota",
    name: "Supra",
    code: "JZA80",
    generation: "A80",
    years: "1993–2002",
    year: 1993,
    engine: "2JZ-GTE",
    engineType: "3.0L twin-turbo inline-six",
    power: 280,
    torque: 431,
    weight: 1510,
    layout: "RWD",
    color: "#d1b89b",
    photo: {
      src: "./media/studio/supra-studio-a86be32245a3.webp",
      credit: "AI-generated studio image",
    },
    tag: "Built for the long run",
    description:
      "A long bonnet, a muscular stance, and one of the most celebrated engines in tuning. The fourth-generation Supra made the grand tourer an enthusiast obsession.",
    story:
      "The A80 combined sequential twin turbochargers with an unusually robust inline-six. Its flowing body and distinctive rear wing became shorthand for an entire generation of Japanese performance.",
  },
  {
    id: "rx7",
    maker: "Mazda",
    name: "RX-7",
    code: "FD3S",
    generation: "FD",
    years: "1991–2002",
    year: 1991,
    engine: "13B-REW",
    engineType: "1.3L twin-turbo rotary",
    power: 280,
    torque: 314,
    weight: 1280,
    layout: "RWD",
    color: "#a93638",
    photo: {
      src: "./media/studio/rx7-studio-530f286101c7.webp",
      credit: "AI-generated studio image",
    },
    tag: "Less weight. More feeling.",
    description:
      "Compact rotary power and a beautifully balanced chassis. The FD is a reminder that the best performance cars are measured in feeling as much as figures.",
    story:
      "Mazda placed a small twin-rotor engine behind the front axle for balanced weight distribution. Sequential turbocharging and a light chassis gave the third-generation RX-7 its distinctive response.",
  },
  {
    id: "nsx",
    maker: "Honda",
    name: "NSX",
    code: "NA1",
    generation: "NA1",
    years: "1990–2005",
    year: 1990,
    engine: "C30A",
    engineType: "3.0L naturally aspirated V6",
    power: 280,
    torque: 294,
    weight: 1350,
    layout: "RWD",
    color: "#d0553d",
    photo: {
      src: "./media/studio/nsx-studio-e13b2df594c9.webp",
      credit: "AI-generated studio image",
    },
    tag: "A different kind of supercar",
    description:
      "An aluminium body, a high-revving V6, and mid-engine balance. The original NSX made exotic engineering approachable and usable.",
    story:
      "An all-aluminium monocoque helped the NSX combine low weight with everyday refinement. Honda applied VTEC to its V6, while development feedback from Ayrton Senna helped shape its chassis.",
  },
  {
    id: "evo",
    maker: "Mitsubishi",
    name: "Lancer Evolution VI",
    code: "CP9A",
    generation: "Evo VI",
    years: "1999–2001",
    year: 1999,
    engine: "4G63T",
    engineType: "2.0L turbocharged inline-four",
    power: 280,
    torque: 373,
    weight: 1360,
    layout: "AWD",
    color: "#d4d9d5",
    photo: {
      src: "./media/studio/evo-studio-a35a23ede8f5.webp",
      credit: "AI-generated studio image",
    },
    tag: "From the rally stage",
    description:
      "Four doors, four driven wheels, and a rally-bred turbo engine. The Evolution VI translates competition thinking into a remarkably focused road car.",
    story:
      "The sixth Evolution refined cooling, aerodynamics, and chassis response. Active Yaw Control on the GSR helped distribute torque at the rear axle, building on Mitsubishi’s rally experience.",
  },
  {
    id: "sti",
    maker: "Subaru",
    name: "Impreza WRX STI",
    code: "GC8",
    generation: "Version VI",
    years: "1999–2000",
    year: 1999,
    engine: "EJ207",
    engineType: "2.0L turbocharged flat-four",
    power: 280,
    torque: 353,
    weight: 1270,
    layout: "AWD",
    color: "#416eab",
    photo: {
      src: "./media/studio/sti-studio-b20093d00961.webp",
      credit: "AI-generated studio image",
    },
    tag: "Boxer heartbeat",
    description:
      "A low-slung boxer engine, all-wheel-drive grip, and a silhouette born on the stages. The GC8 brings rally character to every ordinary road.",
    story:
      "The first-generation Impreza became closely associated with Subaru’s World Rally Championship campaigns. The Japanese-market STI Version VI combined a turbocharged boxer with a lightweight four-door body.",
  },
];

export const stories = [
  {
    id: "engineering",
    number: "01",
    category: "Engineering",
    title: "The engines that started an obsession.",
    intro: "RB26. 2JZ. 13B. More than a series of letters and numbers.",
    text: "The appeal of Japanese performance starts with different answers to the same question. Nissan and Toyota developed strong inline-sixes with twin turbochargers. Mazda pursued a compact rotary, while Honda focused on a responsive, naturally aspirated V6. Their differences are what make this era worth exploring.",
    car: "r34",
  },
  {
    id: "touge",
    number: "02",
    category: "Driving culture",
    title: "A corner. A connection. A culture.",
    intro:
      "Why balance and driver involvement became part of the JDM identity.",
    text: "Touge literally refers to a mountain pass. Its tight corners made light weight, predictable handling, and driver skill central to enthusiast conversation. Today, that spirit is best experienced at organised track days and driving schools, where the focus can stay on learning and control.",
    car: "rx7",
  },
  {
    id: "rally",
    number: "03",
    category: "Motorsport",
    title: "Born on the stages. Loved on the street.",
    intro: "The lasting influence of Japanese rally engineering.",
    text: "Mitsubishi and Subaru took their rivalry from rally stages into road-car showrooms. Turbocharged four-cylinder engines and all-wheel drive became defining ingredients. Evolution and STI models still speak to drivers who value purposeful engineering and a connection to competition.",
    car: "sti",
  },
];

export const locations = [
  {
    id: "tokyo",
    name: "Tokyo",
    area: "The meeting point",
    latitude: 35.68,
    longitude: 139.69,
    description:
      "A starting point for exploring Japan’s car museums, specialist shops, and organised enthusiast gatherings.",
  },
  {
    id: "yokohama",
    name: "Yokohama",
    area: "Port-city heritage",
    latitude: 35.44,
    longitude: 139.64,
    description:
      "Home to Nissan’s global headquarters and a long connection with Japanese automotive design and engineering.",
  },
  {
    id: "suzuka",
    name: "Suzuka",
    area: "Motorsport country",
    latitude: 34.88,
    longitude: 136.58,
    description:
      "A city synonymous with motorsport. Check conditions before visiting the circuit or attending an event.",
  },
];
