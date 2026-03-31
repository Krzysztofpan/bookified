import z from "zod"
import { MAX_FILE_SIZE, voiceIds } from "./constants"

export const UploadSchema = z.object({
  pdfFile: z
    .custom<File | undefined>((v) => v === undefined || v instanceof File)
    .superRefine((val, ctx) => {
      if (val === undefined || !(val instanceof File)) {
        ctx.addIssue("Please upload a PDF file")
        return
      }
      if (val.type !== "application/pdf" && !val.name.toLowerCase().endsWith(".pdf")) {
        ctx.addIssue("Please upload a valid PDF file")
        return
      }
      if (val.size > MAX_FILE_SIZE) {
        ctx.addIssue("PDF file (max 50MB)")
      }
    }),
  coverImage: z.custom<File | undefined>((v) => v === undefined || v instanceof File).optional(),
  title: z.string().trim().min(1, "Title is required"),
  author: z.string().trim().min(1, "Author name is required"),
  voice: z.enum(voiceIds),
})
