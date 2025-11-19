// services/oauth.service.ts
import passport from "passport";
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from "passport-google-oauth20";
import { googleConfig } from "../config/google.config";
import { User } from "../models/User";

export const initialOAuthService = (): void => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleConfig.clientId,
        clientSecret: googleConfig.clientSecret,
        callbackURL: googleConfig.callbackURL,
      },
      // chú ý type của profile & done
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: VerifyCallback
      ) => {
        try {
          const { id, emails, name, photos } = profile;
          const email = emails?.[0]?.value?.toLowerCase();

          // Ưu tiên map theo googleId; nếu không có thì thử theo email
          let user =
            (await User.findOne({ googleId: id })) ||
            (email ? await User.findOne({ email }) : null);

          if (!user) {
            user = new User({
              googleId: id,
              email,
              firstName: name?.givenName,
              lastName: name?.familyName,
              displayName:
                [name?.givenName, name?.familyName].filter(Boolean).join(" ") ||
                email,
              avatarUrl: photos?.[0]?.value,
              role: "user",
              profile: { level: "beginner", skills: [], goals: [] },
              lastLoginAt: new Date(),
            });
            await user.save();
          } else {
            user.displayName =
              user.displayName ||
              [name?.givenName, name?.familyName].filter(Boolean).join(" ") ||
              user.email;
            user.avatarUrl = user.avatarUrl || photos?.[0]?.value;
            user.lastLoginAt = new Date();
            await user.save();
          }

          // OK: đối số 2 phải là Express.User | false | undefined
          done(null, user as any);
          return;
        } catch (err) {
          // KHÔNG truyền null: dùng undefined hoặc false
          done(err as any, false);
          return;
        }
      }
    )
  );
};
