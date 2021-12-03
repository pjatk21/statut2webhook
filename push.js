import "dotenv/config"
import showdown from "showdown"
import { JSDOM } from "jsdom"
import { readFile } from "fs/promises"
import { Webhook, MessageBuilder } from "discord-webhook-node"

// load file
const doc = await readFile("STATUT.md")

// change md to html which change to a DOM
const dom = JSDOM.fragment(new showdown.Converter().makeHtml(doc.toString()))

// create blocks
let titleBlock = undefined
const blocks = new Array()
let helper = {
  title: undefined,
  description: undefined,
  points: [],
}

for (const child of dom.children) {
  if (child.tagName === 'H1') {
    titleBlock = child
  } else if (child.tagName === 'H2') {
    if (helper.points.length > 0) { 
      blocks.push(helper)
      helper = {
        title: child,
        description: undefined,
        points: [],
      }
    } else {
      helper.title = child
    }
  } else if (child.tagName === 'OL') {
    for (const row of child.getElementsByTagName('li')) {
      helper.points.push(row)
    }
  } else if (child.tagName === 'P') helper.description = child
}
blocks.push(helper) // add last block

// transform raw blocks into embeds
const embeds = new Array()
embeds.push(
  new MessageBuilder()
    .setTitle(titleBlock.innerHTML)
)

for (const block of blocks) {
  const embed = new MessageBuilder()
  embed.setTitle(block.title.innerHTML)
  embed.setDescription(block.description.innerHTML)

  let counter = 0
  for (const row of block.points) {
    embed.addField(`${++counter}.`, row.innerHTML)
  }
  embeds.push(embed)
}

const hook = new Webhook(process.env.WEBHOOK)
for (const embed of embeds) {
  console.log('Pushing embed', embed)
  await hook.send(embed)
}
