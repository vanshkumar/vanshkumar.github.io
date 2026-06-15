import { defaultOutputPath, writeQuestionData } from './question-data.mjs';

const data = writeQuestionData();

console.log(
  `Generated ${data.count} questions at ${defaultOutputPath}`
);
