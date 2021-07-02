export default {
    DEV: false,
    IHANDLE: true,
    LOGGING: "PRODUCTION",
    DEV_TOKEN: "REDACTED",
    AUTHORIZED_ROLES: ["796121716828930098", "796089037458767914", "796148938993565736"],
    OWNERS: ["750094498163589321", "498220584501641216"],
    POST_BAD_WORDS: ["kargo", "ürün", "sipariş", "detaylı", "ulaşabilirsiniz", "ödeme", "www", "iletişim", "indirim", "fırsatı", "fırsat", "indirimli", "detayli", "siparis", "iade", "bioda", "link", "bioya", "linkini", "ürünü", "ürüne", "₺", "linkten", "biyografideki", "biyografi", "linki", "bio'da", "storyde", "story", "hikaye"],
    ROLES: {
        MUTED: "796347186178424842",
        CATEGORIES: {
            FOOD: "796385712005709834",
            GAME: "796385741172506676",
            MEME: "796385800505524264",
            FILM: "796385819094548510",
            CARTOON: "796385861390041088",
        },
        LANGUAGES: {
            TR: "796179071968870400",
            EN: "796179095406641173"
        }
    },
    POST_GUILD_ID: "796088356516790312",
    POST_CHANNEL_ID: "796091740247162880",
    PAGES: {
        "aygunestendahaguzel": {language: "TR",category: "MEME", share: false},
        "9gag": {language: "EN",category: "MEME", share: false},
        "funny": {language: "EN",category: "MEME", share: false},
        "sarcasm_only": {language: "EN",category: "MEME", share: false},
        "barbioloji": {language: "TR",category: "MEME", share: false},
        "kobranecded": {language: "TR",category: "MEME", share: false},
        "remixadam": {language: "TR",category: "MEME", share: false},
        "meatycity": {language: "IE",category: "FOOD", share: false}
    },
    CHANNELS: {
        RULES: "796149610527719424",
        ANNOUNCEMENTS: "",
        LOG: ""
    },
    COOLDOWN: 20,
    AUTOMUTE_TIME: 3,
    CREDENTIALS: {
        USERNAME: "REDACTED",
        PASSWORD: "REDACTED",
        TOKEN: "REDACTED"
    },
    PARENT_LANGUAGES: {
        "796088356516790313": "TR",
        "796177916538519575": "EN",
        "796377580998623262": "EN",
        "796389118657036349": "EN"
    },
    CATEGORIES: {
        TR: {
            MEME: "796128301076578304",
            GAME: "796177847228170272",
            FILM: "796180151439196200",
            CARTOON: "796177811496763492"
        },
        EN: {
            MEME: "796389169714036768",
            GAME: "",
            FILM: "796389373821190194",
            CARTOON: "796389284201365594"
        },
        IE: {
            FOOD: "796377631037194240",
            GAME: "796377982746492968"
        }
    },
    ACTIONS: {
        SEND_RULES: false
    },
    LANGUAGES: {
        TR: {
            NewPostFromPage: "```@{{page}} - {{description}}```",
            HasBeenMuted: "{{author}} **3 dakika** boyunca **çok fazla uyarı** sebebiyle **susturuldu**.",
            HasBeenWarned: "{{author}} **uygunsuz kelime** sebebiyle uyarıldı."
        },
        EN: {
            NewPostFromPage: "```@{{page}} - {{description}}```",
            HasBeenMuted: "{{author}} has been **muted** for **3 minutes** being **too many complaints**.",
            HasBeenWarned: "{{author}} has been **warned** for being send **bad words**."
        },
        IE: {
            NewPostFromPage: "```@{{page}} - {{description}}```",
            HasBeenMuted: "{{author}} has been **muted** for **3 minutes** being **too many complaints**.",
            HasBeenWarned: "{{author}} has been **warned** for being send **bad words**."
        }
    }
};