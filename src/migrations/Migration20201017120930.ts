import { Migration } from '@mikro-orm/migrations';

export class Migration20201017120930 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "user" ("id" text not null, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "username" text not null, "password" text not null, "firstname" text not null, "lastname" text not null);');
    this.addSql('alter table "user" add constraint "user_pkey" primary key ("id");');
    this.addSql('alter table "user" add constraint "user_id_unique" unique ("id");');
    this.addSql('alter table "user" add constraint "user_username_unique" unique ("username");');
  }

}
