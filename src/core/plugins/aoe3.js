const axios = require('axios');
const fs = require('fs');
const path = require('path');
const got = require('got')
const jsdom = require('jsdom');
const { userFolder } = require('../utils/configuration');
const { JSDOM } = jsdom

module.exports = {
	name: "aoe3",
	uiName: "Age Of Empires",
	async init()
	{
		if (this.settings.enabled)
		{
			this.scrapePlayerStats();
			this.scrapeGameStats();
		}
	},
	methods: {
		async scrapePlayerStats()
		{
			// let now = new Date();
			// if ((now.getTime() - cache.time.getTime()) / 1000 > (60 * 30))
			let result = [];
			for (let i = 1; i < 15; i++)
			{
				try
				{
					let response = await axios.get("https://api.ageofempires.com/api/AgeIII/GetRLLeaderboard?board=1&page=" + i);
					result.push(response.data.items);
					// cache.time = new Date();
					// return cache.url;
				}
				catch (err)
				{
					console.error(err)
					throw new Error('Error fetching official AOE player stats page: ' + i);
				}
			}

			const aoeJSON = JSON.stringify(result.flatMap(_ => _));
			// write result to json
			fs.writeFileSync(path.join(userFolder, "data/officialPlayerStats.json"), aoeJSON);
		},

		lastUpdatedDate(file)
		{
			const { mtime } = fs.statSync(file);
			return mtime;
		},

		shouldUpdate()
		{
			if (!fs.existsSync(path.join(userFolder, "/data/aoe3GameStats.json")))
			{
				return true;
			}

			let msSinceUpdate = (Math.abs(new Date().getTime() - this.lastUpdatedDate(path.join(userFolder, "/data/aoe3GameStats.json"))));
			if (msSinceUpdate > 6.048e+8)
			{
				return true;
			}
		},

		async scrapeGameStats()
		{
			if (this.shouldUpdate())
			{
				const vgmUrl = 'https://ageofempires.fandom.com/wiki/Units_(Age_of_Empires_III)'
				const response = await got(vgmUrl, {
					headers: {
						'user-agent':
							'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:83.0) Gecko/20100101 Firefox/83.0',
					},
				})
				const dom = new JSDOM(response.body)

				// Create an Array out of the HTML Elements for filtering using spread syntax.
				const nodeList = [
					...dom.window.document.querySelectorAll('.mw-parser-output li a'),
				]

				const isWikiLink = (link) =>
				{
					if (typeof link.href === 'undefined')
					{
						return false
					}

					return link.href.startsWith('/wiki')
				}

				let unitLinks = nodeList.filter(isWikiLink).map((link) => link.href)

				let data = {};

				for (let unitLink of unitLinks)
				{
					const unitResp = await got(
						`https://ageofempires.fandom.com${unitLink}`,
						{
							headers: {
								'user-agent':
									'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:83.0) Gecko/20100101 Firefox/83.0',
							},
						},
					)
					const unitDom = new JSDOM(unitResp.body)

					const asides = [
						...unitDom.window.document.querySelectorAll(
							'aside.portable-infobox',
						),
					]

					for (let aside of asides)
					{
						//Extract data here.

						const unitNameEl = aside.querySelector('.pi-title');

						if (!unitNameEl)
							continue;

						const unitName = unitNameEl.textContent;

						let unitData = {};

						const piGroups = [
							...aside.querySelectorAll(
								'.pi-item.pi-group',
							),
						]

						for (let piGroup of piGroups)
						{
							const headerEl = piGroup.querySelector('h2.pi-header')

							if (!headerEl)
								continue;

							const header = headerEl.textContent;

							const sectionData = {};

							const piItems = piGroup.querySelectorAll('.pi-item.pi-data')

							for (let piItem of piItems)
							{
								const labelEl = piItem.querySelector('.pi-data-label')
								const valueEl = piItem.querySelector('.pi-data-value')

								if (!labelEl || !valueEl)
									continue;

								const label = labelEl.textContent;
								const value = valueEl.textContent;

								sectionData[label] = value;
							}

							unitData[header] = sectionData
						}

						data[unitName] = unitData;
						console.log(`Scraped ${unitName}`);
					}

				}
				// console.log(JSON.stringify(data, null, 2));

				fs.writeFileSync(path.join(userFolder, 'data/aoe3GameStats.json'), JSON.stringify(data, null, 2))
			} else
			{
				return;
			}
		},

		toTitleCase(str)
		{
			return str.replace(/\w\S*/g, function (txt)
			{
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
			})
		}

	},
	templateFunctions: {
		getAoe3PlayerStat(playerName)
		{
			let stats = JSON.parse(fs.readFileSync(path.join(userFolder, "data/officialPlayerStats.json"), "utf-8"));
			try
			{
				let result = (stats.find((_) => _.userName.toLowerCase() == playerName))
				if (result)
				{
					let formattedResult = {}
					formattedResult.playerName = result.userName;
					formattedResult.avatarUrl = result.avatarUrl;
					formattedResult.rank = result.rank;
					formattedResult.wins = result.wins;
					formattedResult.losses = result.losses;
					formattedResult.winPercent = result.winPercent;
					formattedResult.winStreak = result.winStreak;
					return JSON.stringify(formattedResult);
				}
				return `${playerName} is not in the top 200, or you suck at spelling.`;
			} catch (err)
			{
				return "Problem retrieving player aoe3 player stat.";
			}
		},
		getAoe3GameStat(unit)
		{
			let sectionBlacklist = [""];
			let statBlackList = ["Introduced in"];
			let gameStats = JSON.parse(fs.readFileSync(path.join(userFolder, "data/aoe3GameStats.json"), "utf-8"));

			let result = []
			let unitName = this.toTitleCase(unit)

			for (let sectionKey in gameStats[unitName])
			{
				if (sectionBlacklist.includes(sectionKey))
					continue;
				let formattedString = ''
				formattedString += `${sectionKey} | `;

				const statKeys = Object.keys(gameStats[unitName][sectionKey]);
				for (let i = 0; i < statKeys.length; ++i)
				{
					const stat = statKeys[i];

					if (statBlackList.includes(stat))
						continue;
					formattedString += `${stat}:\xa0${gameStats[unitName][sectionKey][stat]}`

					if (i != statKeys.length - 1)
					{
						formattedString += ' - ';
					}
				}
				// TODO: If a single key is more than 509 chars, the message won't send :(. Example: Cow.
				result.push(formattedString);
			}
			return result;
		}
	},
	settings: {
		enabled: { type: Boolean }
	}
}