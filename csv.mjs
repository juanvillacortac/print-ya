// @ts-check

import { readFile, writeFile } from 'node:fs/promises'
import convert from 'csvtojson'
import sade from 'sade'

const prog = sade('csvtojson')

/**
 * @param {string} csv
 * @return {Promise<Record<string, any>[]>}
 */
async function csvtojson(csv) {
  // const lines = csv.split('\n')
  // const cols = lines.shift().split(',')
  // const rows = lines.map((l) => l.split(',').slice(0, cols.length))
  // return rows.map((row) =>
  //   row.reduce((a, b, idx) => ({ ...a, [cols[idx]]: b }), {})
  // )
  return convert().fromString(csv)
}

prog
  .command('parse')
  .option('--path', 'csv path')
  .option('--output', 'output path')
  .action(
    /** @param {{ path: string, output: string }} arg0 */
    async ({ path, output }) => {
      const buffer = await readFile(path)
      const json = await csvtojson(buffer.toString())
      await writeFile(output, JSON.stringify(json, undefined, '  '))
    }
  )

prog.parse(process.argv, { unknown: (arg) => `Unknown option: ${arg}` })
