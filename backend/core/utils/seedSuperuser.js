import User from "../../apps/users/user.model.js";
import { ROLE } from "../enums/enums.js";

/**
 * Creates the first superuser from environment variables if one doesn't exist.
 * Called on server boot — safe to run every time.
 */
export async function seedSuperuser() {
  const { SUPERUSER_EMAIL, SUPERUSER_PASSWORD } = process.env;

  if (!SUPERUSER_EMAIL || !SUPERUSER_PASSWORD) {
    console.warn(
      "[seed] SUPERUSER_EMAIL / SUPERUSER_PASSWORD not set — skipping superuser seed"
    );
    return;
  }

  const existing = await User.findOne({ role: ROLE.SUPERUSER });
  if (existing) return;

  await User.create({
    name: "Super Admin",
    email: SUPERUSER_EMAIL.toLowerCase(),
    password: SUPERUSER_PASSWORD,
    role: ROLE.SUPERUSER,
  });

  console.log(`[seed] Superuser created: ${SUPERUSER_EMAIL}`);
}
