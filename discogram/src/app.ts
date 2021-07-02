import CONFIG from "config"
import Discord, { Intents, ClientOptions, MessageEmbed, Message, MessageAttachment } from "discord.js";
import Database from "quick.db";
import FileCookieStore from "tough-cookie-filestore2";
import delay from "delay";
import { default as PQueue } from "p-queue";
// @ts-ignore
import Instagram from "instagram-web-api";
let Queue: any = [];
let MutedUsers: any = new Set();
let WarnedUsers: any = new Set();
if(CONFIG.DEV === false && CONFIG.LOGGING == "PRODUCTION") require("better-logging")(console);
const LinkRegexp = /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
const Worker = new PQueue({concurrency: 1});
const CookieStore = new FileCookieStore("./cookies.json")
const IClient = new Instagram({username: CONFIG.CREDENTIALS.USERNAME, password: CONFIG.CREDENTIALS.PASSWORD, cookieStore: CookieStore}, { language: "tr-TR" });
const DClient = new Discord.Client({
    ws: {
        intents: Intents.ALL,
        properties: {
            $browser: "Discord iOS"
        }
    },
    fetchAllMembers: true,
    partials: Object.values(Discord.Constants.PartialTypes),
    messageCacheLifetime: 120,
    messageCacheMaxSize: 20,
    presence: {
        activity: {
            name: "Hacktoberfest",
            type: "COMPETING"
        }
    }
});

const sleep: any = (second: number) => { new Promise(resolve => setTimeout(resolve, second*1000)) }
DClient.on("ready", async () => {
    console.info("[DClient] Logged in as "+DClient.user?.tag);
    const Guild: any = DClient.guilds.cache.get(CONFIG.POST_GUILD_ID);
    async function pageTest(page: string) {
        console.info("[IHandle] Checking page "+page);
        const IGHandle: any = new IHandle(IClient, Database, page);
        const Handle = await IGHandle.handle();
        return Handle;
    }

    /*await IClient.login().then(async () => {
        await workerPush("steak.world");
    });*/

    async function sendPostToDiscord(Handle: any, Channel: any, page: string) {
        if(Channel) {
            if(Handle) {
                const Video = (Handle.is_video ? Handle.video_url : false);
                const Display = (Video ? Video : Handle.display_url);
                const Thumbnail = (Handle.thumbnail_src ? Handle.thumbnail_src : Display);
                const Description = Handle.description && Handle.description != false && Handle.description != null && Handle.description.length >= 3 ? Handle.description : "Discogram";
                let File = Display;
                if(Video) File = new Discord.MessageAttachment(Video);
                await Channel.send(CONFIG.LANGUAGES[CONFIG.PAGES[page].language].NewPostFromPage.replace("{{page}}", page).replace("{{description}}", Description), { files: [File] }).then(async (Message: any) => {
                    File = null;
                    await sleep(1);
                    await Message.react("👍").then(async () => {
                        await sleep(1);
                        await Message.react("💖").then(async () => {
                            await sleep(1);
                            await Message.react("👎");
                        })
                    })
                }).catch((e: any) => {
                    console.error("[DClient] An error occurred while send message")
                });
            } else {
                console.info("[IHandle] No new post from "+page);
            }
        } else {
            console.error("[DClient] Channel is not available");
        }
    }
    
    async function workerPush(page: string) {
        console.info("[IHandle] Checking page "+page);
        const IGHandle: any = new IHandle(IClient, Database, page);
        const Handle = await IGHandle.handle();
        const Channel: any = Guild.channels.cache.get(CONFIG.CATEGORIES[CONFIG.PAGES[page].language][CONFIG.PAGES[page].category]);
        if(typeof Handle == "object" && Handle.length >= 2) {
            Handle.forEach(async (k: any) => {
                await sendPostToDiscord(k, Channel, page);
            });
        } else {
            await sendPostToDiscord(Handle, Channel, page);
        }
    }

    if(Guild && Guild.available) {
        const RulesChannel: any = Guild.channels.cache.get(CONFIG.CHANNELS.RULES);
        if(CONFIG.ACTIONS.SEND_RULES) {
            if(RulesChannel) {
                RulesChannel.startTyping();
                RulesChannel.send(new MessageEmbed()
                    .setColor("#2F3136")
                    .setAuthor("Rules of the Discogram", Guild.iconURL(), "https://instagram.com/"+CONFIG.CREDENTIALS.USERNAME)
                    .setThumbnail(Guild.iconURL())
                    .setDescription("`1:` Inappropriate messages, swearing, insults, slang rhetoric, politics, and expressions of choice are strictly prohibited.\n`2:` Don't disturb anyone, to enter into arguments that may reach the size of a fight, and to share & post disturbing images / videos.\n`3:` Flood, advertising, clickbait, promotion are strictly prohibited.\n`4:` Be positive and friendly.\n`5:` Follow **Discord** [Terms](https://discord.com/terms) and [Community Guidelines](https://discord.com/guidelines).\n")
                    .setTimestamp()
                    .setFooter("Discogram")
                )
            }
        }

        if(CONFIG.IHANDLE === true) {
            await IClient.login().then(() => {
                console.info("[IHandle] Logged in as "+CONFIG.CREDENTIALS.USERNAME)
                setInterval(async () => {
                    Object.keys(CONFIG.PAGES).forEach(async (page) => {
                        //if(CONFIG.PAGES[page].language != "TR") return;
                        Worker.add(async () => await workerPush(page));
                        Worker.add(() => delay(5000));  
                    });
                }, CONFIG.COOLDOWN*1000*60);
            }).catch(() => {
                console.error("[IHandle] Checkpoint required")
            });
        }
    } else {
        console.error("[DClient] Guild is not available");
    }
});

DClient.on("guildMemberAdd", async (member) => {
    if(member.user.bot) member.ban({ days: 0, reason: "Banned by System. Reason: Unauthorized bot joined" }).catch();
    if(CONFIG.DEV === true) return;
    if(MutedUsers.has(member.user.id)) {
        console.info("[DClient] A muted user joined the server")
        const Guild: any = DClient.guilds.cache.get(CONFIG.POST_GUILD_ID);
        const Member = Guild.members.cache.get(member.user.id);
        if(Guild && Guild.available) {
            Member.roles.add(CONFIG.ROLES.MUTED).catch(() => {
                console.error("[DClient] An error occurred while remove MUTED role on user, trying again in 5 seconds")
                setTimeout(() => {
                    Member.roles.add(CONFIG.ROLES.MUTED).catch();
                }, 5*1000);
            })
        } else {
            console.error("[DClient] Guild is not available");
        }
    }
})

DClient.on("message", async(message) => {
    if(message.channel.type == "dm" || message.author.bot) return;
    const User = message.guild.members.cache.get(message.author.id);
    if(User && CONFIG.DEV === false) {
        // @ts-ignore
        if(arrayKeyInArray(message.guild.members.cache.get(message.author.id)._roles, CONFIG.AUTHORIZED_ROLES) || CONFIG.OWNERS.includes(message.author.id)) return;
        if(LinkRegexp.test(message.content.toLowerCase().replace(/\s+/g, '')) || message.content.toLowerCase().length > 256 || isTooMuchUpperCase(message.content.toLowerCase())) {
            await message.delete();
            if(WarnedUsers.has(message.author.id)) {
                User.roles.add(CONFIG.ROLES.MUTED).then(async () => {
                    await message.channel.send(new MessageEmbed()
                        .setColor("#2F3136")
                        // @ts-ignore
                        .setDescription(CONFIG.LANGUAGES[(CONFIG.PARENT_LANGUAGES[message.channel.parentID] ? CONFIG.PARENT_LANGUAGES[message.channel.parentID] : "EN")].HasBeenMuted.replace("{{author}}", "<@"+message.author.id+">"))
                    ).then(async (msg) => {
                        WarnedUsers.delete(message.author.id);
                        MutedUsers.add(message.author.id);
                        setTimeout(() => {
                            User.roles.remove(CONFIG.ROLES.MUTED).catch(() => {
                                console.error("[DClient] An error occurred while remove MUTED role on user, trying again in 5 seconds")
                                setTimeout(() => {
                                    User.roles.remove(CONFIG.ROLES.MUTED).catch();
                                }, 5*1000);
                            });
                        }, CONFIG.AUTOMUTE_TIME*60*1000);
                        await msg.delete({ timeout: 30*1000, reason: "Done" });
                    }).catch(() => {
                        console.error("[DClient] An error occurred while send MUTED message to channel")
                    });
                }).catch(() => {
                    console.error("[DClient] An error occurred while give MUTED role to user")
                })
            } else {
                await message.channel.send(new MessageEmbed()
                    .setColor("#2F3136")
                    // @ts-ignore
                    .setDescription(CONFIG.LANGUAGES[(CONFIG.PARENT_LANGUAGES[message.channel.parentID] ? CONFIG.PARENT_LANGUAGES[message.channel.parentID] : "EN")].HasBeenWarned.replace("{{author}}", "<@"+message.author.id+">"))
                ).then(async (msg) => {
                    WarnedUsers.add(message.author.id);
                    setTimeout(() => {
                        WarnedUsers.delete(message.author.id);
                    }, 5*60*1000);
                    await msg.delete({ timeout: 15*1000, reason: "Done" });
                })
                
            }
            
        }
        
    }
})

DClient.login((CONFIG.DEV ? CONFIG.DEV_TOKEN : CONFIG.CREDENTIALS.TOKEN));

class IHandle {
    private IClient: any;
    private Database: any;
    private Username: string;

    constructor(IClient: any, Database: any, Username: string) {
        this.IClient = IClient;
        this.Username = Username;
        this.Database = Database;
    }

    async getLastMedia() {
        try {
            const data = await this.IClient.getPhotosByUsername({ username: this.Username });
            let Description = false;
            if(data.user.edge_owner_to_timeline_media.edges[0].node.comments_disabled) return false;
            if(data.user.edge_owner_to_timeline_media.edges[0]) {
                if(data.user.edge_owner_to_timeline_media.edges[0].node) {
                    if(data.user.edge_owner_to_timeline_media.edges[0].node.edge_media_to_caption.edges[0]) {
                        if(data.user.edge_owner_to_timeline_media.edges[0].node.edge_media_to_caption.edges[0].node) {
                            if(data.user.edge_owner_to_timeline_media.edges[0].node.edge_media_to_caption.edges[0].node.text) {
                                if(arrayKeyInArray(data.user.edge_owner_to_timeline_media.edges[0].node.edge_media_to_caption.edges[0].node.text.toString().toLowerCase().split(" "), CONFIG.POST_BAD_WORDS)) return false;
                                Description = data.user.edge_owner_to_timeline_media.edges[0].node.edge_media_to_caption.edges[0].node.text.toString().toLowerCase().replace("\n", "").replace(". .", "").replace("—", "");
                            }
                        }
                    }
                }
            }
            let medias: any = [];
            if(data.user.edge_owner_to_timeline_media.edges[0].node.edge_sidecar_to_children) {
                if(typeof data.user.edge_owner_to_timeline_media.edges[0].node.edge_sidecar_to_children.edges == "object" && data.user.edge_owner_to_timeline_media.edges[0].node.edge_sidecar_to_children.edges.length >= 2) {
                    data.user.edge_owner_to_timeline_media.edges[0].node.edge_sidecar_to_children.edges.forEach(async (k: any) => {
                        medias.push({
                            id: k.node.id,
                            description: (Description ? Description : null),
                            shortcode: data.user.edge_owner_to_timeline_media.edges[0].node.shortcode,
                            page: this.Username,
                            display_url: k.node.display_url,
                            video_url: (k.node.video_url ? k.node.video_url : k.node.display_url),
                            is_video: k.node.is_video,
                            media_preview: k.node.display_url,
                            thumbnail_src: k.node.display_url
                        });
                    });
                    return medias;
                } else {
                    return {
                        id: data.user.edge_owner_to_timeline_media.edges[0].node.id,
                        description: (Description ? Description : null),
                        shortcode: data.user.edge_owner_to_timeline_media.edges[0].node.shortcode,
                        page: this.Username,
                        display_url: data.user.edge_owner_to_timeline_media.edges[0].node.display_url,
                        video_url: (data.user.edge_owner_to_timeline_media.edges[0].node.video_url ? data.user.edge_owner_to_timeline_media.edges[0].node.video_url : null),
                        is_video: data.user.edge_owner_to_timeline_media.edges[0].node.is_video,
                        media_preview: data.user.edge_owner_to_timeline_media.edges[0].node.media_preview,
                        thumbnail_src: data.user.edge_owner_to_timeline_media.edges[0].node.thumbnail_src
                    }
                }
            } else {
                return {
                    id: data.user.edge_owner_to_timeline_media.edges[0].node.id,
                    description: (Description ? Description : null),
                    shortcode: data.user.edge_owner_to_timeline_media.edges[0].node.shortcode,
                    page: this.Username,
                    display_url: data.user.edge_owner_to_timeline_media.edges[0].node.display_url,
                    video_url: (data.user.edge_owner_to_timeline_media.edges[0].node.video_url ? data.user.edge_owner_to_timeline_media.edges[0].node.video_url : null),
                    is_video: data.user.edge_owner_to_timeline_media.edges[0].node.is_video,
                    media_preview: data.user.edge_owner_to_timeline_media.edges[0].node.media_preview,
                    thumbnail_src: data.user.edge_owner_to_timeline_media.edges[0].node.thumbnail_src
                }
            }
            
        } catch(e) {
            console.error("[Catch] An error occurred");
            console.error(e);
            return false;
        }
    }

    async handle() {
        const LastMedia: any = await this.getLastMedia();
        if(!LastMedia) return false;
        let ShortCode = false;
        if(LastMedia.shortcode) {
            ShortCode = LastMedia.shortcode;
        } else if(LastMedia[0].shortcode) {
            ShortCode = LastMedia[0].shortcode;
        }
        if(ShortCode) {
            if(typeof LastMedia == "object" && LastMedia.length >= 2) {
                if(this.Database.get("posts").includes(ShortCode)) return false;
                Database.push("posts", ShortCode);
                console.info("[IHandle] New post(s)("+LastMedia.length+") available from "+LastMedia[0].page)
            } else {
                if(this.Database.get("posts").includes(ShortCode)) return false;
                Database.push("posts", ShortCode);
                console.info("[IHandle] New post available from "+LastMedia.page)
            }
            return LastMedia;
        } else {
            return false;
        }  
    }
}
const arrayKeyInArray = (array1: any, array2: any) => {
    for (let i = 0; i < array1.length; i++) {
        if(array2.indexOf(array1[i]) != -1) {
            return true;
        }
    }
}
const countUpperCaseChars = (str: string) => {
    let count=0, len= str.length;
    for(let i = 0; i< len; i++) {
      if(/[A-Z]/.test(str.charAt(i))) count++;
    }
    return count;
}
const isTooMuchUpperCase = (str: string) => {
    return (((countUpperCaseChars(str) / str.length) * 100) >= 60 && str.length >= 15 ? true : false);
}

//UNUSED

//const Embed = new MessageEmbed()
//    .setColor("#2F3136")
//    .setDescription("A new post from ["+page+"](https://instagram.com/"+page+")!")
//    .setThumbnail(Thumbnail)
//    .setImage(Display)