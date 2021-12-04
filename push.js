import "dotenv/config"
import showdown from "showdown"
import { JSDOM } from "jsdom"
import { readFile } from "fs/promises"
import { Webhook, MessageBuilder } from "discord-webhook-node"

// ### Loading STATUT and preparing for parsing ###

// Load `STATUT.md` from this GitHub repo
const doc = await readFile("STATUT.md")

// Convert Markdown to HTML, then create an DOM tree out of it
const dom = JSDOM.fragment(new showdown.Converter().makeHtml(doc.toString()))

/*

  ### Initiate helper objects and variables ###

  - `titleBlock`
  - `blocks`: array of `helper` Objects
  - `helper`: Object holding:
    + title of the section
    + description of the section
    + section points

*/

let titleBlock = undefined
const blocks = new Array()
let helper = {
  title: undefined,
  description: undefined,
  points: [],
}

// ### Parsing previously prepared document ###

// For each child in DOM tree
for (const child of dom.children) {
  // For main title... (we treat headline level 1 as it)
  if (child.tagName === 'H1') {
    // assign it to helper variable
    titleBlock = child
    // For each section title... (we treat headline level 2 as it)
  } else if (child.tagName === 'H2') {
    // when we have already assigned section points to `helper` Object...
    if (helper.points.length > 0) {
      // push ready section to our helper array `blocks`
      blocks.push(helper)
      // initiate new `helper` Object for next section
      helper = {
        title: child,
        description: undefined,
        points: [],
      }
      // otherwise...
    } else {
      // assign section title to `helper` Object
      helper.title = child
    }
    // For each list of points...
  } else if (child.tagName === 'OL') {
    // collect them all...
    for (const row of child.getElementsByTagName('li')) {
      // ... and push them to `helper` Object
      helper.points.push(row)
    }
    // For each section description...
  } else if (child.tagName === 'P')
    // assign it to `helper` Object
    helper.description = child
}
// Add last block to `helper` array: `blocks`
blocks.push(helper)

// ### Transform raw blocks into Discord webhook embeds ###

// Initiaze array of embeds
const embeds = new Array()
// Create an introduction message embed
embeds.push(
  new MessageBuilder()
    // with intial title
    .setTitle(titleBlock.innerHTML)
    // with author
    .setFooter(`Administracja serwera`)
    // with red-ish color
    .setColor(0x991d12)
    // with timestamp
    .setTimestamp()
)
// Create an section embed for each one of them
let sectionCounter = 0;
for (const block of blocks) {
  const embed = new MessageBuilder()
  // with auto-incrementing section title
  embed.setTitle(`§${++sectionCounter} ${block.title.innerHTML}`)
  // with section desctiption in *italics*
  embed.setDescription(`*${block.description.innerHTML}*`)
  // with red-ish color
  embed.setColor(0x991d12)

  let counter = 0
  // with all section points auto-incrementing
  for (const row of block.points) {
    embed.addField(`${++counter}.`, row.innerHTML)
  }
  // push each section embed to our array
  embeds.push(embed)
}

/*

  ### Push all embeds one-by-one into Discord server ###

  It creates an representation of our
  Markdown-written STATUT in Discord webhook embeds,
  making an more native look to `PJATK 21` server.

*/

// create an Webhook using secret env
const hook = new Webhook(process.env.WEBHOOK)
// send embeds one-by-one to our server
for (const embed of embeds) {
  console.log('Pushing embed', embed)
  await hook.send(embed)
}
