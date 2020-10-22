import { User } from "src/entities/User";
import { EmailTemplate } from "../sendEmail";

export const changePassword = (user: User): EmailTemplate => {
  return {
    title: "Change Password",
    body: `
    <p>Dear ${user.firstname}</p>
    
    <p>I hope the email finds you well. You have requested to change your password.</p>
    <p>If this is not you, please ignore this email.</p>

    <p><a href="">Change Password</a></p>

    <p>Best regards</p>
    <p>Himpun</p>
    `,
  };
}