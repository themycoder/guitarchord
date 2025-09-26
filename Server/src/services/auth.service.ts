import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { googleConfig } from "../config/google.config";
import { User } from "../models/User";
import { hashPassword } from "../utils/password.util";

export const initialOAuthService = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleConfig.clientId,
        clientSecret: googleConfig.clientSecret,
        callbackURL: googleConfig.callbackURL,
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: Function
      ) => {
        try {
          const { id, emails, name } = profile;
          const existingUser = await User.find({ googleId: id });
          console.log(existingUser); 
          if (existingUser.length >= 1) {
            return done(null, existingUser[0]);
          }
      
          const password = "randomPassword123";
          const hashedPassword = await hashPassword(password);

          const newUser = new User({
            googleId: id,
            email: emails[0].value,
            firstName: name.givenName,
            lastName: name.familyName,
            password: hashedPassword,
          });

          await newUser.save();
          return done(null, newUser);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
};
