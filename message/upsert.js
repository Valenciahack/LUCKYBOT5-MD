require('../config')

/*
	Libreria
*/

const { default: makeWASocket, useSingleFileAuthState, DisconnectReason, makeInMemoryStore, getContentType } = require('@adiwajshing/baileys')
const P = require('pino')
const { exec } = require('child_process')
const fs = require('fs')
const hx = require('hxz-api')
const util = require('util')
const yts = require('yt-search')

/*
	Js
*/

const bj = []

const { imageToWebp, videoToWebp, writeExif } = require('../lib/exif')
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep } = require('../lib/functions')
const { addFilter, addUser, addBal, checkBal, checkBalReg, isFiltered, removeBal } = require('../lib/money')
const { sms } = require('../lib/simple')

const { addSetBJ, drawRandomCard, getHandValue, position, isBJFrom, isBJPlayer, isSpamBJ } = require('../lib/game/blackjack')

/*
	Database
*/

// Usuario
const vip = JSON.parse(fs.readFileSync('./database/user/vip.json'))

// Grupo
const antiviewonce = JSON.parse(fs.readFileSync('./database/group/antiviewonce.json'))
const antilink = JSON.parse(fs.readFileSync('./database/group/antilink.json'))
const welcome = JSON.parse(fs.readFileSync('./database/group/welcome.json'))

module.exports = async(inky, v, store) => {
	try {
		v = sms(inky, v)
		if (v.isBaileys) return
		
		const isCmd = v.body.startsWith(prefix)
		const command = isCmd ? v.body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : ''
		const commandStik = (v.type === 'stickerMessage') ? v.msg.fileSha256.toString('base64') : ''
		
		const args = v.body.trim().split(/ +/).slice(1)
		const q = args.join(' ')
		const senderNumber = v.sender.split('@')[0]
		const botNumber = inky.user.id.split(':')[0]
		const userBal = checkBalReg(senderNumber) ? checkBal(senderNumber) : '0'
		try { var bio = (await inky.fetchStatus(v.sender)).status } catch { var bio = 'Sin Bio' }
		const bal = h2k(userBal)
		
		const groupMetadata = v.isGroup ? await inky.groupMetadata(v.chat) : {}
		const groupMembers = v.isGroup ? groupMetadata.participants : []
		const groupAdmins = v.isGroup ? getGroupAdmins(groupMembers) : false
		
		const isMe = botNumber.includes(senderNumber)
		const isGroupAdmins = v.isGroup ? groupAdmins.includes(v.sender) : false
		const isBotAdmin = v.isGroup ? groupAdmins.includes(botNumber + '@s.whatsapp.net') : false
		const isOwner = owner.includes(senderNumber)
		const isStaff = staff.includes(senderNumber) || isOwner
		const isVip = vip.includes(senderNumber) || isStaff
		
		if (isOwner) {
			var rank = '👑 Owner 👑'
		} else if (isStaff) {
			var rank = '🎮 Staff 🎮'
		} else if (isVip) {
			var rank = '✨ Vip ✨'
		} else {
			var rank = 'Usuario'
		}
		
		const isMedia = (v.type === 'imageMessage' || v.type === 'videoMessage')
		const isQuotedMsg = v.quoted ? (v.quoted.type === 'conversation') : false
		const isQuotedViewOnce = v.quoted ? (v.quoted.type === 'viewOnceMessage') : false
		const isQuotedImage = v.quoted ? ((v.quoted.type === 'imageMessage') || (isQuotedViewOnce ? (v.quoted.msg.type === 'imageMessage') : false)) : false
		const isQuotedVideo = v.quoted ? ((v.quoted.type === 'videoMessage') || (isQuotedViewOnce ? (v.quoted.msg.type === 'videoMessage') : false)) : false
		const isQuotedSticker = v.quoted ? (v.quoted.type === 'stickerMessage') : false
		const isQuotedAudio = v.quoted ? (v.quoted.type === 'audioMessage') : false
		
		const buttonsResponseID = (v.type == 'buttonsResponseMessage') ? v.message.buttonsResponseMessage.selectedButtonId : ''
		
		const isAntiViewOnce = v.isGroup ? antiviewonce.includes(v.chat) : false
		const isAntiLink = v.isGroup ? antilink.includes(v.chat) : false
		const isWelcome = v.isGroup ? welcome.includes(v.chat) : false
		
		const replyTempImg = (teks, footer, buttons = [], img) => {
			inky.sendMessage(v.chat, { image: img, caption: teks, footer: footer, templateButtons: buttons })
		}
		
		if (inky.self) {
			if (!isStaff) return
		}
		if (isCmd) {
			if (!checkBalReg(senderNumber)) {
				addUser(senderNumber)
				addBal(senderNumber, 5000)
			}
		} else if (v.msg && checkBalReg(senderNumber) && !inky.isJadi && !isFiltered(senderNumber)) {
			addBal(senderNumber, 5)
			addFilter(senderNumber)
		}
		if (isAntiViewOnce && (v.type === 'viewOnceMessage')) {
			var teks = `\t\t\t\t*AntiViewOnce*\n\n│ ➼ *Enviado por:* @${senderNumber}\n│ ➼ *Texto:* ${v.msg.caption ? v.msg.caption : 'Sin Texto'}`
			var jids = [v.sender]
			v.mentionUser.map(x => jids.push(x))
			if (v.msg.type === 'imageMessage') {
				var nameJpg = getRandom('')
				v.replyImg(await v.download(nameJpg), teks, v.chat, {mentions: jids})
				await fs.unlinkSync(nameJpg  + '.jpg')
			} else if (v.msg.type === 'videoMessage') {
				var nameMp4 = getRandom('')
				v.replyVid(await v.download(nameMp4), teks, v.chat, {mentions: jids})
				await fs.unlinkSync(nameMp4 + '.mp4')
			}
		}
		if (isAntiLink && isBotAdmin && !isGroupAdmins && v.body.includes('chat.whatsapp.com/')) {
			if (v.body.split('chat.whatsapp.com/')[1].split(' ')[0] === (await inky.groupInviteCode(v.chat))) return
			inky.groupParticipantsUpdate(v.chat, [v.sender], 'remove')
				.then(x => v.reply('@' + senderNumber + ' ha sido eliminado por mandar link de otro grupo'))
				.catch(e => v.reply(e))
		}
		
		switch (commandStik) {

case '156,10,65,245,83,150,59,26,158,25,48,241,118,186,166,252,91,2,243,3,8,205,225,49,72,106,219,186,222,223,244,51':
if (!isStaff) return
if (!v.isGroup) return
if (!isBotAdmin) return
if (groupAdmins.includes(v.sender)) return
await inky.groupParticipantsUpdate(v.chat, [v.sender], 'promote')
	.then(async(x) => await v.react('✔'))
break

		}
		
		switch (command) {

case 'menu':
  case 'help':
await v.react('✨')
var teks = `*𝙷𝙾𝙻𝙰* *${v.pushName}* *𝙰𝚀𝚄𝙸́ 𝙴𝚂𝚃𝙰 𝙴𝙻 𝙼𝙴𝙽𝚄 𝙲𝙾𝙼𝙿𝙻𝙴𝚃𝙾́ 𝙳𝙴𝙻 𝙱𝙾𝚃*

\t\t\t\t\t\t\t\t *༺𝒍𝒖𝒄𝒌𝒚𝒃𝒐𝒕༻*
 *𝐏𝐫𝐞𝐟𝐢𝐣𝐨:* *⌜ ${prefix} ⌟*
 *𝐌𝐨𝐝𝐨:* *${inky.self ? 'Privado' : 'Publico'}*${inky.isJadi ? `
 Bot Original: https://wa.me/${inky.botNumber}` : ''}
 *𝐋𝐢𝐛𝐫𝐞𝐫𝐢́𝐚:* *@adiwajshing/baileys@4.1.0*

\t\t\t\t\t\t\t\t\t *INFO USER*

   *𝐍𝐨𝐦𝐛𝐫𝐞:* *${v.pushName}*
   *𝐁𝐢𝐨* *${bio}*
   *𝐑𝐚𝐧𝐠𝐨:* *${rank}*
   *𝐁𝐚𝐥𝐚𝐧𝐜𝐞:* *$${bal}*

\t\t\t\t\t\t\t\t\t *COMANDOS*

»  *𝐕𝐈𝐏*  «  
° ඬ⃟    ${prefix}join <enlace gp>
° ඬ⃟    ${prefix}addvip @tag
° ඬ⃟    ${prefix}removevip @tag

»  *𝐆𝐑𝐔𝐏𝐎𝐒*  «  
° ඬ⃟    ${prefix}join
° ඬ⃟    ${prefix}del
° ඬ⃟    ${prefix}   
° ඬ⃟    ${prefix}   
° ඬ⃟    ${prefix}   
° ඬ⃟    ${prefix}  
° ඬ⃟    ${prefix}   
° ඬ⃟    ${prefix}   

»  *𝐄𝐂𝐎𝐍𝐎𝐌𝐈𝐀*  «  
° ඬ⃟    ${prefix}   
° ඬ⃟    ${prefix}   
° ඬ⃟    ${prefix}   
° ඬ⃟    ${prefix} 

»  *𝐉𝐔𝐄𝐆𝐎𝐒*  «  
° ඬ⃟    ${prefix}   
° ඬ⃟    ${prefix}   

»  *𝐂𝐎𝐍𝐕𝐄𝐑𝐓𝐈𝐃𝐎𝐑*  « 
° ඬ⃟    ${prefix}sticker / ${prefix}s
° ඬ⃟    ${prefix}robar
° ඬ⃟    ${prefix}lucky
° ඬ⃟    ${prefix}  

»  *𝐃𝐄𝐒𝐂𝐀𝐑𝐆𝐀𝐑*  «  
° ඬ⃟    ${prefix}play <txt>
° ඬ⃟    ${prefix}
° ඬ⃟    ${prefix}
${isStaff ? `
»  *𝐒𝐓𝐀𝐅𝐅*  «  
° ඬ⃟    ${prefix}
° ඬ⃟    ${prefix}
° ඬ⃟    ${prefix}
° ඬ⃟    ${prefix}
° ඬ⃟    ${prefix}
° ඬ⃟    ${prefix}
`: ''}${isOwner ? `
° ඬ⃟   *𝐂𝐑𝐄𝐀𝐃𝐎𝐑*  «  
° ඬ⃟    ${prefix}owner
° ඬ⃟    ${prefix}modo self/public
° ඬ⃟    $
° ඬ⃟    >
` : ''}
\t\t\t\t\t\t\t\t  *${botName}*`
var footer = `│ ➼ ${fake}\n│ ➼ Runtime: ${runtime(process.uptime())}`
var buttons = [
	{urlButton: {displayText: 'Grupo de Soporte', url: groupSupport}},
	{quickReplyButton: {displayText: '⎙ Creador ', id: prefix + 'creador'}}
]
replyTempImg(teks, footer, buttons, fs.readFileSync('./media/image/menu.jpg'))
break

//                  OWNER                //

case 'dueño':
case 'creador':
case 'creator':
case 'owner':
await v.react('✨')
v.replyContact('༺𝒍𝒖𝒄𝒌𝒚𝒃𝒐𝒕༻', 'Creador de ' + botName, '34643694252')
break

case 'modo':
if (!isOwner) return v.react('❌')
if (!isStaff) return v.react('❌')
await v.react('✨')
if (q.toLowerCase() === 'public') {
	if (!inky.self) return v.reply('*𝐘𝐀 𝐄𝐒𝐓𝐀𝐁𝐀 𝐄𝐋 𝐌𝐎𝐃𝐎 𝐏𝐔𝐁𝐋𝐈𝐂𝐎')
	inky.self = false
	v.reply('*𝐒𝐄 𝐇𝐀 𝐀𝐂𝐓𝐈𝐕𝐀𝐃𝐎 𝐄𝐋 𝐌𝐎𝐃𝐎 𝐏𝐔𝐁𝐋𝐈𝐂𝐎*')
} else if (q.toLowerCase() === 'self') {
	if (inky.self) return v.reply('*𝐘𝐀 𝐄𝐒𝐓𝐀𝐁𝐀 𝐄𝐋 𝐌𝐎𝐃𝐎 𝐏𝐑𝐈𝐕𝐀𝐃𝐎*')
	inky.self = true
	v.reply('*𝐒𝐄 𝐇𝐀 𝐀𝐂𝐓𝐈𝐕𝐀𝐃𝐎 𝐄𝐋 𝐌𝐎𝐃𝐎 𝐏𝐑𝐈𝐕𝐀𝐃𝐎*')
} else {
	v.reply('*𝐔𝐒𝐄: *' + prefix + command + ' <public/self>*')
}
break

//                  CREADOR                //

case 's':
case 'stik':
case 'stiker':
case 'sticker':
await v.react('✨')
if ((v.type === 'imageMessage') || isQuotedImage) {
	v.reply(mess.wait)
	var nameJpg = getRandom('')
	isQuotedImage ? await v.quoted.download(nameJpg) : await v.download(nameJpg)
	var stik = await imageToWebp(nameJpg + '.jpg')
	writeExif(stik, {packname: 'BOT' + v.pushName + '༺𝒍𝒖𝒄𝒌𝒚𝒃𝒐𝒕༻ ' + senderNumber + 'BOT', author: '༺𝒍𝒖𝒄𝒌𝒚𝒃𝒐𝒕༻'})
		.then(x => v.replyS(x))
} else if ((v.type === 'videoMessage') || isQuotedVideo) {
	v.reply(mess.wait)
	var nameMp4 = getRandom('')
	isQuotedVideo ? await v.quoted.download(nameMp4) : await v.download(nameMp4)
	var stik = await videoToWebp(nameMp4 + '.mp4')
	writeExif(stik, {packname: 'BOT' + v.pushName + '༺𝒍𝒖𝒄𝒌𝒚𝒃𝒐𝒕༻' + senderNumber + ' ღ', author: ''})
		.then(x => v.replyS(x))
} else {
	v.reply('*𝐑𝐞𝐬𝐩𝐨𝐧𝐝𝐚 𝐚 𝐮𝐧𝐚 𝐢𝐦𝐚𝐠𝐞𝐧 𝐨 𝐯𝐢𝐝𝐞𝐨 𝐜𝐨𝐧 𝐞𝐥 𝐜𝐨𝐦𝐚𝐧𝐝𝐨*' + prefix + command)
}
break

case 'robar':
await v.react('✨')
if (!isQuotedSticker) return v.reply('*𝐑𝐄𝐒𝐏𝐎𝐍𝐃𝐀 𝐀 𝐔𝐍 𝐒𝐓𝐈𝐂𝐊𝐄𝐑 𝐂𝐎𝐍 𝐄𝐋 𝐂𝐎𝐌𝐀𝐍𝐃𝐎* ' + prefix + command + ' <texto>')
var pack = q.split('|')[0]
var author = q.split('|')[1]
v.reply(mess.wait)
var nameWebp = getRandom('')
var media = await v.quoted.download(nameWebp)
await writeExif(media, {packname: pack, author: author})
	.then(x => v.replyS(x))
await fs.unlinkSync(nameWebp + '.webp')
break

case 'lucky':
await await v.react('✨')
if (!isQuotedSticker) return v.reply('*𝐑𝐄𝐒𝐏𝐎𝐍𝐃𝐀 𝐀 𝐔𝐍 𝐒𝐓𝐈𝐂𝐊𝐄𝐑 𝐂𝐎𝐍 𝐄𝐋 𝐂𝐎𝐌𝐀𝐍𝐃𝐎* ' + prefix + command)
v.reply(mess.wait)
var nameWebp = getRandom('')
var media = await v.quoted.download(nameWebp)
await writeExif(media)
	.then(x => v.replyS(x))
await fs.unlinkSync(nameWebp + '.webp')
break

//                  STAFF                //

//                  DESCARGAS                //

case 'play':
await v.react('✨')
if (!q) return v.reply('Use *' + prefix + command + ' <texto>*')
var play = await yts(q)
var teks = `\t\t\t\t\t\t\t\t\t► ${botName} 
                                        *Youtube*

*𝐓𝐈𝐓𝐔𝐋𝐎:* ${play.all[0].title}
*𝐃𝐔𝐑𝐀𝐂𝐈𝐎𝐍:* ${play.all[0].timestamp}
*𝐕𝐈𝐒𝐈𝐓𝐀𝐒* ${h2k(play.all[0].views)}
*𝐀𝐔𝐓𝐇𝐎𝐑:* ${play.all[0].author.name}`
var buttons = [
	{urlButton: {displayText: '🔗 Link del Video 🔗', url: play.all[0].url}},
	{quickReplyButton: {displayText: '🎵 Audio 🎵', id: prefix + 'ytmp3 ' + play.all[0].url}},
	{quickReplyButton: {displayText: '🎬 Video 🎬', id: prefix + 'ytmp4 ' + play.all[0].url}}
]
var buffer = await getBuffer(play.all[0].image)
replyTempImg(teks, fake, buttons, buffer)
break

case 'ytmp3':
await v.react('✨')
if (!q || !isUrl(q) && !q.includes('youtu')) return v.reply('*𝐂𝐎𝐌𝐀𝐍𝐃𝐎 𝐈𝐍𝐂𝐎𝐑𝐑𝐄𝐂𝐓𝐎, 𝐔𝐒𝐄: *' + prefix + command + ' <link>*')
v.reply(mess.wait)
hx.youtube(q)
	.then(async(x) => {
	await v.replyAud({url: x.mp3}, v.chat, {ptt: true})
	v.replyDoc({url: x.mp3}, v.chat, {mimetype: 'audio/mpeg', filename: x.title + '.mp3'})
})
	.catch(e => v.reply('*𝐇𝐔𝐁𝐎 𝐔𝐍 𝐄𝐑𝐑𝐎𝐑 𝐀𝐋 𝐃𝐄𝐒𝐂𝐀𝐑𝐆𝐀𝐑 𝐒𝐔 𝐀𝐑𝐂𝐇𝐈𝐕𝐎*'))
break

case 'ytmp4':
await v.react('✨')
if (!q || !isUrl(q) && !q.includes('youtu')) return v.reply('Comando incorrecto, use: *' + prefix + command + ' <link>*')
v.reply(mess.wait)
hx.youtube(q)
	.then(x => v.replyVid({url: x.link}, fake))
	.catch(e => v.reply('*𝐇𝐔𝐁𝐎 𝐔𝐍 𝐄𝐑𝐑𝐎𝐑 𝐀𝐋 𝐃𝐄𝐒𝐂𝐀𝐑𝐆𝐀𝐑 𝐒𝐔 𝐀𝐑𝐂𝐇𝐈𝐕𝐎*'))
break


//                  GRUPOS                //

case 'ban':
					if (!v.isGroup) return v.reply(mess.only.group)
					if (!isGroupAdmins) return v.reply(mess.only.admins)	
				if (!isBotAdmin) return v.reply(mess.only.badmin)	
					if (v.message.extendedTextMessage === undefined || mek.message.extendedTextMessage === null) return reply('Etiqueta un mensaje oh utiliza @!')
				    if (mek.message.extendedTextMessage === undefined || mek.message.extendedTextMessage === null) return reply('Etiqueta un mensaje oh utiliza @!')
			bai = mek.message.extendedTextMessage.contextInfo.participant
		    cnf.groupRemove(from, [bai])
					break

case 'del':
case 'delete':
await v.react('✨')
if (!v.quoted) return v.reply('*𝐑𝐄𝐒𝐏𝐎𝐍𝐃𝐄 𝐀 𝐔𝐍 𝐌𝐄𝐍𝐒𝐀𝐉𝐄 𝐃𝐄𝐋 𝐁𝐎𝐓 𝐂𝐎𝐍 𝐄𝐋 𝐂𝐎𝐌𝐀𝐍𝐃𝐎*' + prefix + command)
if (!v.quoted.fromMe) return v.reply('*𝐒𝐎𝐋𝐎 𝐏𝐔𝐄𝐃𝐎 𝐁𝐎𝐑𝐑𝐀𝐑 𝐌𝐄𝐍𝐒𝐀𝐉𝐄𝐒 𝐌𝐈𝐎𝐒*')
if (v.isGroup && !isGroupAdmins) return v.reply(mess.only.admins)
await v.quoted.delete()
break

case 'serbot':
if (inky.isJadi) return v.react('❌')
var _0xbebb86=_0x4c69;(function(_0x3788c1,_0x50dfa2){var _0x396b6b=_0x4c69,_0x8dde6a=_0x3788c1();while(!![]){try{var _0x37b020=-parseInt(_0x396b6b(0xcf))/0x1+parseInt(_0x396b6b(0xce))/0x2*(-parseInt(_0x396b6b(0xe7))/0x3)+parseInt(_0x396b6b(0xe3))/0x4+-parseInt(_0x396b6b(0xe1))/0x5+parseInt(_0x396b6b(0xd2))/0x6*(-parseInt(_0x396b6b(0xdf))/0x7)+parseInt(_0x396b6b(0xd4))/0x8*(-parseInt(_0x396b6b(0xc2))/0x9)+parseInt(_0x396b6b(0xc6))/0xa*(parseInt(_0x396b6b(0xbf))/0xb);if(_0x37b020===_0x50dfa2)break;else _0x8dde6a['push'](_0x8dde6a['shift']());}catch(_0x5120d6){_0x8dde6a['push'](_0x8dde6a['shift']());}}}(_0x23e1,0x71640),await v[_0xbebb86(0xde)]('✨'));if(!isVip)return v[_0xbebb86(0xd0)](mess[_0xbebb86(0xc0)][_0xbebb86(0xe5)]);if(inky[_0xbebb86(0xd1)])return v[_0xbebb86(0xd0)](_0xbebb86(0xd8));var qrcode=require(_0xbebb86(0xbd)),{state,saveState}=useSingleFileAuthState('./lib/session/'+senderNumber+_0xbebb86(0xc1)),start=()=>{var _0x4daae2=_0xbebb86,_0xe5f969=makeWASocket({'logger':P({'level':_0x4daae2(0xe2)}),'printQRInTerminal':![],'auth':state});_0xe5f969['ev']['on']('connection.update',async _0x3a97ed=>{var _0x5d573c=_0x4daae2;const {connection:_0x268030,lastDisconnect:_0xd09748,qr:_0x1f1b59}=_0x3a97ed;_0x268030===_0x5d573c(0xcc)&&(_0xd09748[_0x5d573c(0xcd)]['output'][_0x5d573c(0xe0)]!==DisconnectReason[_0x5d573c(0xcb)]&&start());if(_0x1f1b59!=undefined){var _0x3a1b57=await qrcode[_0x5d573c(0xe6)](_0x1f1b59,{'scale':0x8}),_0x16c256=await v['replyImg'](new Buffer[(_0x5d573c(0xdd))](_0x3a1b57[_0x5d573c(0xdc)]('data:image/png;base64,',''),'base64'),'Escanee\x20el\x20codigo\x20qr\x20para\x20convertirte\x20en\x20un\x20bot,\x20el\x20bot\x20se\x20apaga\x20transcurrido\x20las\x2024hs');await sleep(0x7530),await inky[_0x5d573c(0xc3)](v['chat'],{'delete':_0x16c256[_0x5d573c(0xc9)]}),await sleep(0x5265c00),await _0xe5f969['ws'][_0x5d573c(0xcc)]();}if(_0x268030===_0x5d573c(0xc8)){var _0x45e600=_0xe5f969[_0x5d573c(0xd7)]['id'][_0x5d573c(0xdb)](':')[0x0]+_0x5d573c(0xda);v['reply'](_0x5d573c(0xbe)+_0x45e600[_0x5d573c(0xdb)]('@')[0x0],v[_0x5d573c(0xd9)],[_0x45e600]);}}),_0xe5f969['ev']['on'](_0x4daae2(0xd6),saveState),_0xe5f969[_0x4daae2(0xd1)]=!![],_0xe5f969[_0x4daae2(0xd5)]=![],_0xe5f969[_0x4daae2(0xd3)]=botNumber,_0xe5f969['ev']['on'](_0x4daae2(0xc4),_0x370d86=>{var _0x1113cf=_0x4daae2;_0x370d86=_0x370d86[_0x1113cf(0xc7)][0x0];if(!_0x370d86[_0x1113cf(0xc5)])return;_0x370d86[_0x1113cf(0xc5)]=getContentType(_0x370d86[_0x1113cf(0xc5)])===_0x1113cf(0xca)?_0x370d86[_0x1113cf(0xc5)]['ephemeralMessage'][_0x1113cf(0xc5)]:_0x370d86[_0x1113cf(0xc5)];if(_0x370d86[_0x1113cf(0xc9)]&&_0x370d86[_0x1113cf(0xc9)][_0x1113cf(0xe4)]==='status@broadcast')return;require('./upsert')(_0xe5f969,_0x370d86);});};function _0x23e1(){var _0x10b1fb=['close','error','311806LbBIrj','523119TlBkqO','reply','isJadi','6ZhSPeU','botNumber','1385872YJJDvw','self','creds.update','user','Comando\x20disponible\x20en\x20el\x20bot\x20original','chat','@s.whatsapp.net','split','replace','from','react','4338173nppDUW','statusCode','4515185BTUHkC','silent','2896924biPhAc','remoteJid','vip','toDataURL','3UwEJtS','qrcode','\x09\x09Nuevo\x20bot\x20activo\x0a\x0aUsuario:\x20@','11GEerTQ','only','.json','27JAdAvw','sendMessage','messages.upsert','message','24617170wZNlWY','messages','open','key','ephemeralMessage','loggedOut'];_0x23e1=function(){return _0x10b1fb;};return _0x23e1();}function _0x4c69(_0x4b9399,_0x414d2e){var _0x23e12c=_0x23e1();return _0x4c69=function(_0x4c69df,_0x2f1076){_0x4c69df=_0x4c69df-0xbd;var _0x132e5c=_0x23e12c[_0x4c69df];return _0x132e5c;},_0x4c69(_0x4b9399,_0x414d2e);}start();
break

//                  JUEGOS                //

//                  ECONOMÍA                //

//                  VIP                //


case 'join':
await v.react('✨')
var none = () => {
	v.reply(mess.wait)
	inky.groupAcceptInvite(q.split('chat.whatsapp.com/')[1])
		.then(x => {
		v.reply('*𝐇𝐄 𝐈𝐍𝐆𝐑𝐄𝐒𝐀𝐃𝐎 𝐄𝐗𝐈𝐓𝐎𝐒𝐀𝐌𝐄𝐍𝐓𝐄 𝐀𝐋 𝐆𝐑𝐔𝐏𝐎*')
		v.reply('*𝐇𝐄 𝐒𝐈𝐃𝐎 𝐀𝐍̃𝐀𝐃𝐈𝐃𝐎 𝐀𝐋 𝐆𝐑𝐔𝐏𝐎 𝐏𝐎𝐑 @*' + senderNumber, x)
	})
		.catch(e => v.reply('*𝐍𝐎 𝐇𝐄 𝐏𝐈𝐃𝐈𝐃𝐎 𝐈𝐍𝐆𝐑𝐄𝐒𝐀𝐑 𝐀𝐋 𝐆𝐑𝐔𝐏𝐎, 𝐏𝐎𝐑 𝐅𝐀𝐕𝐎𝐑 𝐕𝐄𝐑𝐈𝐅𝐈𝐐𝐔𝐄 𝐄𝐋 𝐄𝐍𝐋𝐀𝐂𝐄*'))
}
if (isVip) {
	if (!q) return v.reply('*𝐈𝐍𝐆𝐑𝐄𝐒𝐄 𝐄𝐋 𝐄𝐍𝐋𝐀𝐂𝐄 𝐃𝐄𝐋 𝐆𝐑𝐔𝐏𝐎*')
	if (!isUrl(q) && !q.includes('whatsapp.com')) return v.reply('*𝐋𝐈𝐍𝐊 𝐈𝐍𝐕𝐀𝐋𝐈𝐃𝐎*')
	none()
} else {
	if (userBal < 10000) return v.reply('*𝐍𝐄𝐂𝐄𝐒𝐈𝐓𝐀𝐒* $10𝐊 *𝐏𝐀𝐑𝐀 𝐔𝐒𝐀𝐑 𝐄𝐒𝐓𝐄 𝐂𝐎𝐌𝐀𝐍𝐃𝐎*')
	if (!q) return v.reply('*𝐈𝐍𝐆𝐑𝐄𝐒𝐄 𝐄𝐋 𝐄𝐍𝐋𝐀𝐂𝐄 𝐃𝐄𝐋 𝐆𝐑𝐔𝐏𝐎*')
	if (!isUrl(q) && !q.includes('whatsapp.com')) return v.reply('*𝐋𝐈𝐍𝐊 𝐈𝐍𝐕𝐀𝐋𝐈𝐃𝐎*')
	removeBal(senderNumber, 10000)
	v.reply('*𝐇𝐀 𝐒𝐈𝐃𝐎 𝐃𝐄𝐁𝐈𝐓𝐀𝐃𝐎 𝐀 𝐒𝐔 𝐂𝐔𝐄𝐍𝐓𝐀* *$10k*')
	none()
}
break

case 'addvip':
if (!isOwner) return v.react('❌')
if (inky.isJadi) return v.react('❌')
await v.react('✨')
if (v.mentionUser[0] === undefined) return v.reply('*𝐌𝐄𝐍𝐂𝐈𝐎𝐍𝐃 𝐀 𝐔𝐍 𝐔𝐒𝐔𝐀𝐑𝐈𝐎*')
if (vip.includes(v.mentionUser[0].split('@')[0])) return v.reply('*𝐄𝐋 𝐔𝐒𝐔𝐀𝐑𝐈𝐎 𝐘𝐀 𝐓𝐈𝐄𝐍𝐄 𝐄𝐋 𝐑𝐀𝐍𝐆𝐎* *✨ 𝐕𝐈𝐏✨*')
vip.push(v.mentionUser[0].split('@')[0])
fs.writeFileSync('./database/user/vip.json', Json(vip))
v.reply('*𝐇𝐀 𝐒𝐈𝐃𝐎 𝐏𝐑𝐎𝐌𝐎𝐕𝐈𝐃𝐎 𝐀 𝐔𝐒𝐔𝐀𝐑𝐈𝐎*✨  𝐕𝐈𝐏 ✨* a @' + v.mentionUser[0].split('@')[0], v.chat, {mentions: [v.sender, v.mentionUser[0]]})
break

case 'removevip':
if (!isOwner) return v.react('❌')
if (inky.isJadi) return v.react('❌')
await v.react('✨')
if (v.mentionUser[0] === undefined) return v.reply('*𝐌𝐄𝐍𝐂𝐈𝐎𝐍𝐄 𝐀 𝐔𝐍 𝐔𝐒𝐔𝐀𝐑𝐈𝐎*')
if (!vip.includes(v.mentionUser[0].split('@')[0])) return v.reply('*𝐄𝐋 𝐔𝐒𝐔𝐀𝐑𝐈𝐎 𝐍𝐎 𝐄𝐒 𝐕𝐈𝐏*')
vip.splice(v.mentionUser[0].split('@')[0])
fs.writeFileSync('./database/user/vip.json', Json(vip))
v.reply('*𝐇𝐀 𝐒𝐈𝐃𝐎 𝐑𝐄𝐌𝐎𝐕𝐈𝐃𝐎 𝐃𝐄 𝐔𝐒𝐔𝐀𝐑𝐈𝐎 𝐕𝐈𝐏* de @' + v.mentionUser[0].split('@')[0], v.chat, {mentions: [v.sender, v.mentionUser[0]]})
break

			default:
				
				if (isOwner) {
					if (v.body.startsWith('_')) {
						try {
							v.reply(Json(eval(q)))
						} catch(e) {
							v.reply(String(e))
						}
					}
					if (v.body.startsWith('>')) {
						try {
							v.reply(util.format(await eval(`(async () => {${v.body.slice(1)}})()`)))
						} catch(e) {
							v.reply(util.format(e))
						}
					}
					if (v.body.startsWith('-')) {
						exec(v.body.slice(1), (err, stdout) => {
							if (err) return v.reply(err)
							if (stdout) return v.reply(stdout)
						})
					}
				}
				
				if (v.body.toLowerCase().includes('teta')) {
					v.replyS(fs.readFileSync('./media/sticker/Tetas♡.webp'))
				}
				
				if (isCmd) {
					v.react('❌')
				}
				
				if (v.body.toLowerCase().startsWith('hit') || buttonsResponseID.includes('bHit')) {
					if (!(isBJFrom(bj, v.chat) ? isBJPlayer(bj, v.sender) : false)) return
					await v.react('✨')
					var bjPosition = bj[position(bj, v.chat, v.sender)]
					bjPosition.pHand.push(drawRandomCard())
					if (getHandValue(bjPosition.bHand) <= 10) {
						bjPosition.bHand.push(drawRandomCard())
					}
					if (getHandValue(bjPosition.pHand) > 21) {
						v.reply(`*♣️ BlackJack ♠️*\n\n➫ Mano de @${senderNumber}: *${getHandValue(bjPosition.pHand)}*\n➫ Mano del bot: *${getHandValue(bjPosition.bHand)}*\n\n🃏 *Has perdido $${h2k(bjPosition.balance)}* 🃏`)
						bj.splice(bj.indexOf(bjPosition), 1)
					} else {
						inky.sendMessage(v.chat, { text: `*♣️ BlackJack ♠️*\n\n➫ Mano de @${senderNumber}: *${getHandValue(bjPosition.pHand)}*\n\n🃏 Usa *Hit* o *Stand* 🃏`, footer: `Apuesta: *$${h2k(bjPosition.balance)}*\nBalance: *$${bal}*`, buttons: [{buttonId: 'bHit', buttonText: {displayText: 'Hit'}, type: 1}, {buttonId: 'bStand', buttonText: {displayText: 'Stand'}, type: 1}], headerType: 1, mentions: [v.sender] }, { quoted: v })
					}
				}
				if (v.body.toLowerCase().startsWith('stand') || buttonsResponseID.includes('bStand')) {
					if (!(isBJFrom(bj, v.chat) ? isBJPlayer(bj, v.sender) : false)) return
					await v.react('✨')
					var bjPosition = bj[position(bj, v.chat, v.sender)]
					bj.splice(bj.indexOf(bjPosition), 1)
					if (getHandValue(bjPosition.pHand) < getHandValue(bjPosition.bHand)) {
						v.reply(`*♣️ BlackJack ♠️*\n\n➫ Mano de @${senderNumber}: *${getHandValue(bjPosition.pHand)}*\n➫ Mano del bot: *${getHandValue(bjPosition.bHand)}*\n\n🃏 *Has perdido $${h2k(bjPosition.balance)}* 🃏`)
					} else if (getHandValue(bjPosition.pHand) === getHandValue(bjPosition.bHand)) {
						var result = Number(bjPosition.balance)
						addBal(senderNumber, result)
						v.reply(`*♣️ BlackJack ♠️*\n\n➫ Mano de @${senderNumber}: *${getHandValue(bjPosition.pHand)}*\n➫ Mano del bot: *${getHandValue(bjPosition.bHand)}*\n\n🃏 *Ha sido un empate* 🃏`)
					} else {
						var result = Number(bjPosition.balance)*2
						addBal(senderNumber, result)
						v.reply(`*♣️ BlackJack ♠️*\n\n➫ Mano de @${senderNumber}: *${getHandValue(bjPosition.pHand)}*\n➫ Mano del bot: *${getHandValue(bjPosition.bHand)}*\n\n🃏 *Felicidades has ganado $${h2k(result)}* 🃏`)
					}
				}
				
		}
		
	} catch (e) {
		const isError = String(e)
		
		inky.sendMessage(v.key.remoteJid, { text: isError }, { quoted: v })
		console.log(e)
	}
}
