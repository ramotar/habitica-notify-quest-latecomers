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

    return false;
  }

  if (type == "questStarted") {
    scriptProperties.setProperty("lastQuestStart", new Date().toISOString());
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

  let questName = HabiticaQuestKeys.getQuestName(questKey);
  let questString = (questName == null ? "`" + questKey + "`" : "**" + questName + "**");
  let questInfo = "The quest " + questString + " was started " + delayInSeconds.toFixed(0) + " seconds after the invitation.";

  let latecomers = [];
  let latecomerMessage = questInfo + "\n\n";
  latecomerMessage += "Your Auto Accept script failed to accept the quest invite within this time frame.  \nPlease check, whether it is working correctly!";

  let leaderMessage = questInfo + "\n\n";

  if (Object.keys(questMembers).length != partyMembers.length) {
    for (let member of partyMembers) {
      if (!(member._id in questMembers)) {
        latecomers.push(member);
      }
    }

    leaderMessage += "The following party members don't participate in the quest, because their Auto Accept script didn't respond in time:\n";
    for (let member of latecomers) {
      leaderMessage += "* " + member.profile.name + " (@" + member.auth.local.username + ")\n";
    }
  }
  else {
    partyMessage += "All party members participate in the quest &#127881;";
  }

  if (PM_TO_LATECOMERS) {
    for (let member of latecomers) {
      api_sendPM(latecomerMessage, member.id);
    }
  }

  if (PM_TO_PARTY_LEADER) {
    api_sendPM(leaderMessage, partyLeader.id);
  }

  if (MESSAGE_TO_PARTY) {
    api_sendPartyMessage(leaderMessage);
  }
}

function processTrigger() {
  // [Authors] This function gets called by the example trigger.
  // - This is the place for recurrent tasks.
}
