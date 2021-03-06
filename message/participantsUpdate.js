require('../config')

const welcome = JSON.parse(fs.readFileSync('./database/group/welcome.json'))

const { getBuffer } = require('../lib/functions')

module.exports = async(inky, v) => {
	try {
		if (!welcome.includes(v.id)) return
		const groupMetadata = await inky.groupMetadata(v.id)
		const participants = v.participants
		for (let num of participants) {
			if (v.action == 'add') {
				var teks = `\t\t\t\t*Bienvenido @${num.split('@')[0]}*\n\nā¼ *Grupo:* ${groupMetadata.subject}\n\nā¼ *Descripcion:*\n${groupMetadata.desc}`
				try {
					ppimg = await inky.profilePictureUrl(num, 'image')
				} catch {
					ppimg = 'https://images4.alphacoders.com/921/921653.png'
				}
				var buffer = await getBuffer(ppimg)
				var buttonMessage = {
					location: {
						jpegThumbnail: buffer
					},
					caption: teks,
					footerText: fake,
					buttons: [
						{ buttonId: prefix + 'menu', buttonText: { displayText: 'š Menu š' }, type: 1 },
						{ buttonId: prefix + 'creador', buttonText: { displayText: 'š Creador š' }, type: 1 }
					],
					headerType: 6,
					mentions: [num]
				}
				inky.sendMessage(v.id, buttonMessage)
			}
		}
	} catch(e) {
		console.log(e)
	}
}
