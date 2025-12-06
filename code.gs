// [Authors] Place all other functions in this or other separate files
// - Ideally prefix functions that access the API with "api_" to quickly see which ones
//   access the API and to be able to budget your 30 requests per minute limit well

function processWebhookInstant(type, data) {
  // [Authors] This function gets called immediately,
  //   whenever a webhook of your script is activated.
  // - Place immediate reactions here.
  // - Make sure, that the processing time does not exceed 30 seconds.
  //   Otherwise you risk the deactivation of your webhook.

  if (type == "questInvited") {
    scriptProperties.setProperty("lastQuestInvite", new Date().toISOString());
    logInfo("Received questInvited webhook");

    return false;
  }

  if (type == "questStarted") {
    scriptProperties.setProperty("lastQuestStart", new Date().toISOString());
    logInfo("Received questStarted webhook");
  }
}

function processWebhookDelayed(type, data) {
  // [Authors] This function gets called asynchronously,
  //   whenever a webhook of your script is activated.
  // - Here you can take care of heavy work, that may take longer.
  // - It may take up to 30 - 60 seconds for this function to activate
  //   after the webhook was triggered.

  let lastQuestInvite = new Date(scriptProperties.getProperty("lastQuestInvite"));
  let lastQuestStart = new Date(scriptProperties.getProperty("lastQuestStart"));

  let delayInSeconds = (lastQuestStart.getTime() - lastQuestInvite.getTime()) / 1000;

  let party = api_getParty();
  let partyLeader = party.leader;
  let questKey = party.quest.key;
  let questMembers = party.quest.members;

  let partyMembers = api_getPartyMembers();

  let questName = getQuestName(questKey);
  let questString = (questName == null ? "`" + questKey + "`" : "**" + questName + "**");

  let leaderMessage = "The quest " + questString;
  let discordMessage = "The quest " + questString;

  if (NAME_QUEST_OWNER) {
    let questOwner = partyMembers.find((member) => member._id == party.quest.leader);

    leaderMessage += " by " + questOwner.profile.name + " (@" + questOwner.auth.local.username + ")"
    discordMessage += " by " + questOwner.profile.name + " ([@" + questOwner.auth.local.username + "](https://habitica.com/profile/" + questOwner._id + "))"
  }

  leaderMessage += " was started " + delayInSeconds.toFixed(0) + " seconds after the invitation.\n\n";
  discordMessage += " was started " + delayInSeconds.toFixed(0) + " seconds after the invitation.\n";

  let latecomers = [];
  let latecomerMessage = leaderMessage;
  latecomerMessage += "Your Auto Accept script failed to accept the quest invite within this time frame.  \nPlease check, whether it is working correctly!";

  if (Object.keys(questMembers).length != partyMembers.length) {
    for (let member of partyMembers) {
      if (!(member._id in questMembers)) {
        latecomers.push(member);
      }
    }

    let sadMessage = "The following party members don't participate in the quest, because their Auto Accept script didn't respond in time:\n";
    leaderMessage += sadMessage;
    discordMessage += sadMessage;

    for (let member of latecomers) {
      leaderMessage += "* " + member.profile.name + " (@" + member.auth.local.username + ")\n";
      discordMessage += "* " + member.profile.name + " ([@" + member.auth.local.username + "](https://habitica.com/profile/" + member._id + "))\n";
    }
  }
  else {
    let happyMessage = "All party members participate in the quest";
    leaderMessage += happyMessage + " &#127881;";
    discordMessage += happyMessage + " :tada:";
  }

  if (MESSAGE_TO_PARTY) {
    api_sendPartyMessage(leaderMessage);
  }

  if (PM_TO_PARTY_LEADER_IF_LATECOMERS && latecomers.length > 0) {
    api_sendPM(leaderMessage, partyLeader.id);
  }

  if (PM_TO_PARTY_LEADER_IF_NO_LATECOMERS && latecomers.length == 0) {
    api_sendPM(leaderMessage, partyLeader.id);
  }

  if (PM_TO_LATECOMERS) {
    for (let member of latecomers) {
      api_sendPM(latecomerMessage, member.id);
    }
  }

  if (MESSAGE_TO_DISCORD) {
    try {
      sendDiscordMessage(discordMessage);
    }
    catch (e) {
      throw new Error("Failed to send Discord message", { cause: e });
    }
  }
}

function processTrigger() {
  // [Authors] This function gets called by the example trigger.
  // - This is the place for recurrent tasks.
}

function sendDiscordMessage(message) {
  let payload = {
    "content": message,
    "flags": 4,
  };

  let params = {
    "method": "POST",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": false,
  }

  return UrlFetchApp.fetch(DISCORD_WEBHOOK_URL, params);
}

function getQuestName(key, defaultValue = null) {
  let content = api_getContent();

  if (key in content.quests) {
    return content.quests[key].text;
  }
  else {
    return defaultValue;
  }
}
