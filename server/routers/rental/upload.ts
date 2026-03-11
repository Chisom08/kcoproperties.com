import { z } from "zod";
import { publicProcedure, router } from "../../_core/trpc";
import { cloudinary } from "../../_core/cloudinary";
import { nanoid } from "nanoid";

export const uploadRouter = router({
  // Get a presigned upload URL for file uploads
  getUploadUrl: publicProcedure
    .input(
      z.object({
        fileName: z.string(),
        contentType: z.string(),
        applicationId: z.number(),
        fileType: z.enum(["dl-front", "dl-back", "income-proof", "signature"]),
      })
    )
    .mutation(async ({ input }) => {
      const ext = input.fileName.split(".").pop() || "bin";
      const key = `applications/${input.applicationId}/${input.fileType}-${nanoid(8)}.${ext}`;

      // Return the key so the client can upload directly
      return { key, uploadReady: true };
    }),

  // Upload file data (base64 encoded)
  uploadFile: publicProcedure
    .input(
      z.object({
        applicationId: z.number(),
        fileType: z.enum(["dl-front", "dl-back", "income-proof", "signature"]),
        fileName: z.string(),
        contentType: z.string(),
        base64Data: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Validate that it's an image
      if (!input.base64Data.startsWith("data:image/")) {
        throw new Error("Only image uploads are allowed");
      }

      try {
        // Upload to Cloudinary (same as main application uploads)
        const result = await cloudinary.uploader.upload(input.base64Data, {
          folder: `kco-properties/rental-applications/${input.applicationId}`,
          resource_type: "image",
          overwrite: false,
        });

        return { url: result.secure_url, key: result.public_id };
      } catch (error) {
        console.error("Cloudinary upload failed:", error);
        throw new Error("Failed to upload image");
      }
    }),
});
