import { Migration } from '@mikro-orm/migrations';

export class Migration20201017154929 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "user" drop constraint if exists "user_firstname_check";');
    this.addSql('alter table "user" alter column "firstname" type text using ("firstname"::text);');
    this.addSql('alter table "user" alter column "firstname" drop not null;');
    this.addSql('alter table "user" drop constraint if exists "user_lastname_check";');
    this.addSql('alter table "user" alter column "lastname" type text using ("lastname"::text);');
    this.addSql('alter table "user" alter column "lastname" drop not null;');
  }

}
