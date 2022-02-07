const needle = require('needle')
const axios = require('axios')
const discord = require('discord.js') //Define the discord.js module
const client = new discord.Client()

// Get the prefix
const prefix = '?'

// ready event
client.on('ready', () => {
  console.log(`I am online. I am ${client.user.tag}`)
})

const rulesURL = 'https://api.twitter.com/2/tweets/search/stream/rules'
const streamURL =
  'https://api.twitter.com/2/tweets/search/stream?tweet.fields=public_metrics&expansions=author_id'

const rules = [
  {
    value:
      '(from:abhayvv) OR (from:MarketCurrents) OR (from:TheEconomist) OR (from:SeekingAlpha) OR (from:WallStJesus) OR (from:Fxhedgers) OR (from:spectatorindex) OR (from:zerohedge) OR (from:CNNBusiness) OR (from:eWhispers) OR (from:IPOBoutique)',
  },
]

const TOKEN =
  'AAAAAAAAAAAAAAAAAAAAAI3kYAEAAAAAkuDyaE5JBDGXQcQfED0l%2B8T0AVE%3DQUXYt4vDhN3YvqazWSqBOxtt3xsxpO0nWLbYfFtCy2tk6RfUB7'

// Get stream rules
async function getRules() {
  const response = await needle('get', rulesURL, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
  })
  console.log(response.body)
  return response.body
}

// Set stream rules
async function setRules() {
  const data = {
    add: rules,
  }

  const response = await needle('post', rulesURL, data, {
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
  })

  return response.body
}

// Delete stream rules
async function deleteRules(rules) {
  if (!Array.isArray(rules.data)) {
    return null
  }

  const ids = rules.data.map((rule) => rule.id)

  const data = {
    delete: {
      ids: ids,
    },
  }

  const response = await needle('post', rulesURL, data, {
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
  })

  return response.body
}

function streamTweets() {
  const stream = needle.get(streamURL, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
  })

  stream.on('data', async (data) => {
    try {
      const json = JSON.parse(data)
      console.log(json)
      discordSend(json)
      const params = {
        data: json,
      }
      try {
        const res = await axios.post(
          'https://us-central1-wallstflow.cloudfunctions.net/api/twitterData',
          params
        )
        console.log(res.data)
      } catch (err) {
        console.log(err)
      }
    } catch (error) {}
  })

  return stream
}

const channels = {
  Fxhedgers: '767952991906037780',
  spectatorindex: '767952991906037780',
  TheEconomist: '767953095245168680',
  WallStJesus: '767953095245168680',
  zerohedge: '762394938666254366',
  MarketCurrents: '767953691633778708',
  SeekingAlpha: '767953691633778708',
  eWhispers: '762377815680090193',
  IPOBoutique: '772245318870892544',
  CNNBusiness: '707040857487835227',
}

const discordSend = async (data) => {
  const checkChannel = channels[data.includes.users[0].username]
  console.log(checkChannel)
  const guild = await client.guilds.cache.get('682259216861626378')
  const channel = await guild.channels.cache.get(checkChannel)
  channel.send(data.data.text)
}

;(async () => {
  let currentRules
  try {
    currentRules = await getRules()

    await deleteRules(currentRules)

    await setRules()
  } catch (err) {
    console.error(err)
    process.exit(1)
  }

  streamTweets()
})()

// Log in with the API KEY
client.login('OTQwMzExNjU1NDAzOTEzMjI2.YgFjeA.I6to9NqiCL1wpeigB7u1-VL0jjs')
