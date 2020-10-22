import url from "url";
import { v4 } from "uuid";
import { FORGOT_PASSWORD_PREFIX } from "../../constant";
import { User } from "../../entities/User";
import { HimpunContext } from "../../types";
import { EmailTemplate } from "../sendEmail";

const generatePasswordToken = ({redis}: HimpunContext, {id}: User) => {
  const token = v4();
  redis.set(FORGOT_PASSWORD_PREFIX + token, id, "EX", 1000 * 60 * 60 * 24); // 1 day
  return token;
}

export const resetPasswordEmail = (ctx: HimpunContext, user: User): EmailTemplate => {
  const token = generatePasswordToken(ctx, user);
  const href = url.resolve(ctx.config.webURL, `reset-password/${token}`);
  return {
    title: "Change Password",
    body: `
    <p>Dear ${user.firstname}</p>
    
    <p>I hope the email finds you well. You have requested to reset your password.</p>
    <p>If this is not you, please ignore this email.</p>

    <p><a href="${href}">Reset Password</a></p>

    <p>Best regards</p>
    <p>Himpun</p>
    `,
  };
}