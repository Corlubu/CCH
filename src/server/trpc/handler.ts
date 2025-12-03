// src/server/trpc/auth.ts (or wherever login is)
login: publicProcedure
  .input(z.object({ username: z.string(), password: z.string() }))
  .mutation(() => {
    console.log("✅ Login called — env loaded");
    return { success: true };
  }),
