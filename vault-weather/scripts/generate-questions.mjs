import {
  defaultOutputPath,
  defaultShelfOutputPath,
  writeVaultWeatherData
} from './question-data.mjs';

const data = writeVaultWeatherData();

console.log(
  `Generated ${data.questions.count} questions at ${defaultOutputPath}`
);
console.log(
  `Generated ${data.shelf.count} shelf items at ${defaultShelfOutputPath}`
);
