const { Select } = require("enquirer");
const { AutoComplete } = require("enquirer");
const { NumberPrompt } = require("enquirer");
const tablesData = require("./table.json");
const RNGData = require("./RNGMap.json");

async function main() {
  let spellOrder = 1;
  const spellList = [];

  let responses;
  while (true) {
    const spellResponse = await askSpell(spellOrder);
    spellList.push(spellResponse);
    responses = findInfos(spellList);
    if (responses.length === 1) break;
    if (
      responses.every((response) => {
        return (
          response.table === responses[0].table &&
          response.entry === responses[0].entry
        );
      })
    ) {
      break;
    }
    console.dir({ responses }, { depth: null });
    spellOrder++;
  }
  console.dir({ responses, "Seen Spells": spellOrder }, { depth: null });

  const startTable = responses[0].table;
  const startEntry = responses[0].entry;

  const startRng = RNGData.find(({ rng, table, entry }) => {
    return table === startTable && entry === startEntry;
  });
  console.log({ startRng });

  const currentRng = RNGData.find(
    ({ rng, table, entry }) => rng === (startRng.rng + spellOrder * 4) % 256
  );
  console.log({ currentRng });
  const rng = currentRng.rng;
  const blackDot =
    blackDots.find((blackDot) => {
      return blackDot >= rng;
    }) || blackDots[0];
  let TheEnd =
    (179 - blackDot) / 4 < 0
      ? (179 - blackDot + 256) / 4
      : (179 - blackDot) / 4;
  console.log({ blackDot });
  const delta = blackDot - rng < 0 ? blackDot - rng + 256 : blackDot - rng;
  let doOver = Math.floor(delta / 4);
  let skipTurn = delta % 4;
  if (blackDots.includes(startRng.rng)) {
    doOver = 0;
    skipTurn = 0;
    TheEnd =
      (179 - currentRng.rng) / 4 + 1 < 0
        ? (179 - currentRng.rng) / 4 + 65
        : (179 - currentRng.rng) / 4 + 1;
  }
  console.log(
    `Do Over : ${doOver}, Skip Turn : ${skipTurn}, Do Over : ${TheEnd}`
  );
}

function findInfos(spellList) {
  const responses = [];
  tablesData.forEach((table, tableIndex) => {
    table.forEach((crisis, crisisIndex) => {
      const matches = spellsMatchCrisis(spellList, crisis);
      if (matches !== false) {
        matches.forEach((match) => {
          responses.push({
            table: tableIndex + 1,
            crisis: crisisIndex + 1,
            entry: match + 1,
          });
        });
      }
    });
  });
  return responses;
  // console.dir({ responses }, { depth: null });
  // if (responses.length === 1) process.kill();
}

function spellsMatchCrisis(spellList, crisis) {
  const spell1Exists = crisis.find((spell) => spell === spellList[0]);
  if (!spell1Exists) return false;
  // const startIndex = crisis.findIndex(spell => spell === spellList[0])
  // find all start indexes
  const startIndexesCandidates = crisis.reduce((indexes, spell, spellIndex) => {
    if (spellList[0] === spell) {
      indexes.push(spellIndex);
    }
    return indexes;
  }, []);
  if (spellList.length === 1) return startIndexesCandidates;

  const startIndexes = [...startIndexesCandidates];
  startIndexesCandidates.forEach((startIndex, x) => {
    for (var i = 1; i < spellList.length; i++) {
      const spell = spellList[i];
      const index = startIndex + i > 63 ? startIndex + i - 64 : startIndex + i;
      if (spell !== crisis[index]) {
        startIndexes[x] = null;
        continue;
      }
    }
  });
  return startIndexes.filter((v) => v !== null);
}

function createAutocompleteSpellList(tablesData) {
  const spellList = [];
  tablesData.forEach((table) => {
    table.forEach((crisis) => {
      crisis.forEach((spell) => {
        const spellExists = spellList.find(
          (spellFromList) => spell === spellFromList
        );
        if (!spellExists) {
          spellList.push(spell);
        }
      });
    });
  });
  return spellList;
}

async function askSpell(spellOrder) {
  const spellPrompt = new AutoComplete({
    message: `What is your #${spellOrder} slot spell ?`,
    limit: 10,
    initial: 2,
    choices: createAutocompleteSpellList(tablesData),
  });

  const spellResponse = await spellPrompt.run();
  return spellResponse;
}

const blackDots = [43, 79, 91, 175, 179, 187, 207, 231, 251].sort(
  (a, b) => a > b
);
main();
