import url from "url";
import { User } from "../../entities/User";
import { HimpunContext } from "../../types";
import { EmailTemplate } from "../sendEmail";
import { generateToken, TokenType } from "../token";

export const resetPasswordEmail = (ctx: HimpunContext, user: User): EmailTemplate => {
  const token = generateToken(TokenType.PASSWORD_TOKEN, ctx.redis, user.id);
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