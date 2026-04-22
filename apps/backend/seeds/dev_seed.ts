import { type Knex } from "knex";
import * as fs from "fs";
import { logger } from "../src/utils/app-logger";

export async function seed(knex: Knex): Promise<void> {
  const file = fs.readFileSync("./seeds/dev/kana_dev_test_seed.sql", "utf8");

  const delimitedBlocks: string[] = [];
  const strippedFile = file.replace(
    /DELIMITER\s+\$\$([\s\S]*?)\$\$|DELIMITER\s+\$\$([\s\S]*?)DELIMITER\s+;/g,
    (_, p1, p2) => {
      const block = (p1 || p2 || "").trim();
      const placeholder = `__DELIM_BLOCK_${delimitedBlocks.length}__`;
      delimitedBlocks.push(block); // no DELIMITER, no $$
      return placeholder;
    }
  );

  const transformed = strippedFile
    .replaceAll(/\);\n/g, ");#!#")
    .replaceAll(/\s;\n/g, " ;#!#")
    .replaceAll(/ci;/g, "ci;#!#")
    .replaceAll(/\/;/g, "/;#!#")
    .replaceAll('";', '";#!#')
    .replace(/(\S\d);\n/g, (match, p1) => `${p1};#!#`)
    .replace(/(\w{4,});/g, (match, p1) => `${p1};#!#`);

  const withTriggers = transformed.replace(
    /__DELIM_BLOCK_(\d+)__/g,
    (_, i) => delimitedBlocks[+i]
  );

  const splittableLines = withTriggers
    .replaceAll(/END\n/g, "END;#!#")
    // Only replace NOW() when it's at the end of a statement (followed by semicolon or end of line)
    // Don't replace NOW() inside expressions like NOW() - INTERVAL
    .replaceAll(/NOW\(\)(?=\s*;)/g, "NOW();#!#")
    .replaceAll(/DELIMITER ;/g, "");

  const statements = splittableLines.split("#!#");
  for (const statement of statements) {
    const trimmedSql = statement.trim();
    if (trimmedSql) {
      try {
        await knex.raw(trimmedSql);
      } catch (error) {
        logger.error("ERROR", error, trimmedSql);
      }
    }
  }
}
