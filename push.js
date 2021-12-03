import "dotenv/config"
import showdown from "showdown"
import { JSDOM } from "jsdom"
import { readFile } from "fs/promises"
import { Webhook, MessageBuilder } from "discord-webhook-node"

const doc = await readFile("STATUT.md")

const dom = JSDOM.fragment(new showdown.Converter().makeHtml(doc.toString()))

for (const child of dom.children) {
  const hook = new Webhook(process.env.WEBHOOK)
  const embed = new MessageBuilder()

  console.log(child.tagName, child.innerHTML)
  switch (child.tagName.toLowerCase()) {
    case "h1":
      embed.setTitle(child.innerHTML)
      break
    case "h2":
      embed.setTitle("§ " + child.innerHTML)
      break
    case "ol":
      let i = 0
      child.querySelectorAll("li").forEach((li) => {
        embed.addField(++i + ".", li.innerHTML, false)
      })
      break
  }

  await hook.send(embed)
}
