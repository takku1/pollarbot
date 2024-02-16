require('dotenv').config();

const tmi = require('tmi.js');

const commands = {
    website: {
        response: 'https://pollarbot.dev'
    },
}

const client = new tmi.Client({
    connection: {
        reconnect: true
    },
	channels: [ 'pollarbot' ],
    options: { debug: true },
    identity: {
		username: process.env.TWITCH_BOT_USERNAME,
		password: process.env.TWITCH_OAUTH_TOKEN
	},
});

client.connect();

let isPollActive = false;
let pollOptions = [];
let votes = {};
let userVotes = {};

client.on('message', (channel, tags, message, self) => {
    if (self) return; // Ignore messages from the bot

    const username = tags.username;
    const commandParts = message.trim().split(' ');
    const command = commandParts[0].toLowerCase();

    // Start poll
    if (command === '!startpoll' && commandParts.length > 1) {
        isPollActive = true;
        pollOptions = commandParts.slice(1);
        votes = pollOptions.reduce((acc, option) => ({ ...acc, [option]: 0 }), {});
        userVotes = {};
        client.say(channel, `Poll has started! Options are: ${pollOptions.join(', ')}.`);
    }
    // Stop poll
    else if ((command === '!stoppoll' || command === '!endpoll') && isPollActive) {
        isPollActive = false;
        const results = pollOptions.map(option => `${option}: ${votes[option]}`).join(', ');
        client.say(channel, `Poll has ended! Results: ${results}`);
        pollOptions = [];
        votes = {};
        userVotes = {};
    }
    // Collect votes
    else if (isPollActive && pollOptions.includes(command)) {
        if (!userVotes[username]) { // Check if the user has already voted
            votes[command]++;
            userVotes[username] = true; // Mark user as having voted
            // Provide real-time updates on vote counts
            const currentResults = pollOptions.map(option => `${option}: ${votes[option]}`).join(', ');
            client.say(channel, `Current votes are: ${currentResults}`);
        }
    }

    console.log(`${tags['display-name']}: ${message}`);
});