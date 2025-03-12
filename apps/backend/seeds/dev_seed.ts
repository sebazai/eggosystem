import { Knex } from "knex";
import * as fs from "fs";

export async function seed(knex: Knex): Promise<void> {
  const file = fs.readFileSync("./seeds/dev/kana_dev_seed.sql", "utf8");
  const splittableLines = file
    .replaceAll(/DELIMITER \$\$/g, "")
    .replaceAll(/DELIMITER ;/g, "")
    .replaceAll(/\$\$/g, "")
    .replaceAll(/\);\n/g, ");#!#")
    .replaceAll(/\s;\n/g, " ;#!#")
    .replaceAll(/ci;/g, "ci;#!#")
    .replaceAll(/\/;/g, "/;#!#")
    .replaceAll('";', '";#!#')
    .replaceAll(/END\n/g, "END;#!#")
    .replace(/(\d);\n/g, (match, p1) => `${p1};#!#`)
    .replace(/(\w{4,});/g, (match, p1) => `${p1};#!#`);

  const statements = splittableLines.split("#!#");
  for (const statement of statements) {
    const trimmedSql = statement.trim();
    if (trimmedSql) {
      await knex.raw(trimmedSql);
    }
  }
}
