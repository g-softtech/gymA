import { z } from "zod";
import { NextResponse } from "next/server";
import { logger } from "./logger";

export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return async (req: Request): Promise<{ data?: z.infer<T>; error?: NextResponse }> => {
    try {
      const body = await req.json();
      const result = schema.safeParse(body);
      
      if (!result.success) {
        return {
          error: NextResponse.json(
            { error: "Validation Error", details: result.error.flatten().fieldErrors },
            { status: 400 }
          ),
        };
      }
      
      return { data: result.data };
    } catch (err) {
      logger.error("Failed to parse request body", { error: err });
      return { error: NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) };
    }
  };
}

export const tenantCreateSchema = z.object({
  name: z.string().min(2, "Gym name must be at least 2 characters."),
});

export const trainerCreateSchema = z.object({
  email: z.string().email("Invalid email format"),
  specialties: z.array(z.string()).optional(),
  bio: z.string().optional(),
  hourlyRate: z.coerce.number().positive().optional(),
});
