import { readFileSync } from 'fs';
import { resolve } from 'path';
import { ParseOutput, Parser } from '@asyncapi/parser';

const parser = new Parser();

let cached: ParseOutput;

export const init = async () => {
  if (cached) return;

  let content;

  try {
    content = readFileSync(resolve(__dirname, '../../config/asyncapi.yaml'), { encoding: 'utf8' });
  } catch (e) {
    try {
      content = readFileSync(resolve(__dirname, '../../config/asyncapi.json'), { encoding: 'utf8' });
    } catch (err) {
      throw new Error('Coud not find asyncapi.yaml or asyncapi.json file in the root directory of the project.');
    }
  }

  try {
    cached = await parser.parse(content);
  } catch (e) {
    throw e;
  }

  return cached;
}

export function get() { return cached; }
