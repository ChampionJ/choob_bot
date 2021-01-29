import { DocumentType, getModelForClass, mongoose, prop, modelOptions, getDiscriminatorModelForClass } from "@typegoose/typegoose";
import { ChoobLogger } from "../../../utils/ChoobLogger";


export enum ChoobRole {
  ADMIN = 'ADMIN',
  ADDCHOOB = 'Quote Creation',
  REMOVECHOOB = 'Quote Removal'
};
enum AuthType {
  TwitchUser = 'Twitch',
  DiscordUser = 'Discord'
}
@modelOptions({ schemaOptions: { discriminatorKey: 'authType', collection: 'choob_users' } })
export class User {
  _id!: mongoose.Types.ObjectId;

  @prop({ enum: AuthType, type: String, required: true })
  authType!: AuthType;
  identifier!: string;

  @prop({ enum: ChoobRole, type: [String], default: [] })
  public roles!: ChoobRole[];

  @prop({})
  private accessToken?: string;

  @prop({})
  private refreshToken?: string;

  async removeRolesAndSave(this: DocumentType<User>, rolesToRemove: ChoobRole[]):
    Promise<{
      rolesChanged: number;
      doc: undefined | mongoose.Document;
    } | undefined> {
    if (this.roles) {
      let rolesChanged = 0;
      if (this.roles.length === 0) {
        return { rolesChanged, doc: undefined };
      }
      for (var i = this.roles.length - 1; i >= 0; i--) {
        if (rolesToRemove.includes(this.roles[i])) {
          this.roles.splice(i, 1);
          rolesChanged++;
          ChoobLogger.info(`Removing role ${this.roles[i]} from ${this.identifier}`)
        }
      }
      if (rolesChanged === 0) {
        return { rolesChanged, doc: undefined };
      }
      const doc = await this.save()
      ChoobLogger.verbose(`Saved role change for ${this.identifier}`)
      return { rolesChanged, doc };
    }
  }
  async addRolesAndSave(this: DocumentType<User>, rolesToAdd: ChoobRole[]):
    Promise<{
      rolesChanged: number;
      doc: undefined | mongoose.Document;
    } | undefined> {
    if (this.roles) {
      let rolesChanged = 0;
      rolesToAdd.forEach(role => {
        if (!this.roles.includes(role)) {
          this.roles.push(role);
          ChoobLogger.info(`Adding role ${role} to ${this.identifier}`)
          rolesChanged++;
        }
      });
      if (rolesChanged === 0) {
        return { rolesChanged, doc: undefined };
      }
      const doc = await this.save()
      ChoobLogger.verbose(`Saved role change for ${this.identifier}`)
      return { rolesChanged, doc };
    }
  }
}
const UserSchema = getModelForClass(User)
//export const UserSchema = SchemaFactory.createForClass(User);

export class TwitchUser extends User {

  @prop({ required: true, unique: true })
  public identifier!: string;

  @prop({ required: true })
  public username!: string;

  @prop({ required: true })
  public displayName!: string;

}

export const TwitchUserModel = getDiscriminatorModelForClass(UserSchema, TwitchUser, AuthType.TwitchUser)
//export const TwitchUserSchema = SchemaFactory.createForClass(TwitchUser)
