import bcrypt from "bcrypt";

export const hashPassword = async (password: string) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (plain: string, hashed: string) => {
  return await bcrypt.compare(plain, hashed);
};
