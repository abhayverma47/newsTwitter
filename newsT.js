const needle = require('needle')
const axios = require('axios')

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
