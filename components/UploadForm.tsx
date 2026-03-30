"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ImageIcon, Upload, X } from "lucide-react"
import { useRef, useState } from "react"
import { useForm, useFormState } from "react-hook-form"
import { RadioGroup } from "radix-ui"
import { z } from "zod"
import { toast } from "sonner"
import { LoadingOverlay } from "@/components/LoadingOverlay"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { cn, parsePDFFile } from "@/lib/utils"
import { useAuth } from "@clerk/nextjs"
import { checkBookExists, createBook, saveBookSegments } from "@/lib/actions/book.actions"
import { useRouter } from "next/navigation"
import { upload } from "@vercel/blob/client"

const MAX_PDF_BYTES = 50 * 1024 * 1024

const voiceIds = ["dave", "daniel", "chris", "rachel", "sarah"] as const
type VoiceId = (typeof voiceIds)[number]

const formSchema = z.object({
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
      if (val.size > MAX_PDF_BYTES) {
        ctx.addIssue("PDF file (max 50MB)")
      }
    }),
  coverImage: z.custom<File | undefined>((v) => v === undefined || v instanceof File).optional(),
  title: z.string().trim().min(1, "Title is required"),
  author: z.string().trim().min(1, "Author name is required"),
  voice: z.enum(voiceIds),
})

type FormInput = z.input<typeof formSchema>
type FormOutput = z.output<typeof formSchema>

const VOICES: {
  male: { id: VoiceId; name: string; description: string }[]
  female: { id: VoiceId; name: string; description: string }[]
} = {
  male: [
    {
      id: "dave",
      name: "Dave",
      description: "Young male, British-Essex, casual & conversational",
    },
    {
      id: "daniel",
      name: "Daniel",
      description: "Middle-aged male, British, authoritative but warm",
    },
    {
      id: "chris",
      name: "Chris",
      description: "Male, casual & easy-going",
    },
  ],
  female: [
    {
      id: "rachel",
      name: "Rachel",
      description: "Young female, American, calm & clear",
    },
    {
      id: "sarah",
      name: "Sarah",
      description: "Young female, American, soft & approachable",
    },
  ],
}

function UploadForm() {
  const [submitting, setSubmitting] = useState(false)
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const errorSummaryRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { userId } = useAuth()
  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      pdfFile: undefined,
      coverImage: undefined,
      title: "",
      author: "",
      voice: "rachel",
    },
  })

  const { errors, isSubmitted } = useFormState({ control: form.control })
  const hasErrors = isSubmitted && Object.keys(errors).length > 0

  async function onSubmit(data: FormOutput) {
    const pdf = data.pdfFile
    if (!pdf) return

    if (!userId) {
      return toast.error("Please login to upload a book")
    }

    setSubmitting(true)
    try {
      const existsCheck = await checkBookExists(data.title)

      if (existsCheck.exists && existsCheck.book) {
        toast.info("Book with this title already exists.")
        form.reset()
        router.push(`/books/${existsCheck.book.slug}`)
        return
      }

      const fileTitle = data.title.replace(/\s+/g, "-").toLowerCase()

      const parsedPdf = await parsePDFFile(pdf)

      if (parsedPdf.content.length === 0) {
        toast.error("No content found in the PDF file")
        return
      }

      const uploadedPdfBlob = await upload(fileTitle, pdf, {
        access: "public",
        handleUploadUrl: "/api/upload",
        contentType: "application/pdf",
      })

      let coverUrl: string

      if (data.coverImage) {
        const coverFile = data.coverImage
        const uploadedCoverBlob = await upload(`${fileTitle}_cover.png`, coverFile, {
          access: "public",
          handleUploadUrl: "/api/upload",
          contentType: coverFile.type,
        })

        coverUrl = uploadedCoverBlob.url
      } else {
        const response = await fetch(parsedPdf.cover)
        const blob = await response.blob()
        const uploadedCoverBlob = await upload(`${fileTitle}_cover.png`, blob, {
          access: "public",
          handleUploadUrl: "/api/upload",
          contentType: "image/png",
        })
        coverUrl = uploadedCoverBlob.url
      }

      const book = await createBook({
        clerkId: userId,
        title: data.title,
        author: data.author,
        fileURL: uploadedPdfBlob.url,
        persona: data.voice,
        fileBlobKey: uploadedPdfBlob.pathname,
        coverURL: coverUrl,
        fileSize: pdf.size,
      })

      if (!book.success) throw new Error("Failed to create book")

      if (book.alreadyExists) {
        toast.info("Book with this title already exists.")
        form.reset()
        router.push(`/books/${book.data.slug}`)
        return
      }

      const segments = await saveBookSegments(book.data._id, userId, parsedPdf.content)

      if (!segments.success) throw new Error("Failed to save book segments")

      form.reset()
      router.push("/")
    } catch (error) {
      console.error("Error uploading book", error)
      toast.error("Something went wrong while uploading the book")
    } finally {
      setSubmitting(false)
    }
  }

  function scrollToErrorSummary() {
    setTimeout(() => {
      errorSummaryRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }, 0)
  }

  return (
    <div className='new-book-wrapper'>
      {submitting ? <LoadingOverlay title='Beginning synthesis…' /> : null}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, scrollToErrorSummary)} className='space-y-8' noValidate>
          {hasErrors ? (
            <div ref={errorSummaryRef} className='error-banner' role='alert' aria-live='polite'>
              <div className='error-banner-content'>
                <p className='text-sm font-medium text-red-800'>Please fix the errors below: upload a PDF, and enter both title and author. Invalid fields are highlighted.</p>
              </div>
            </div>
          ) : null}

          <FormField
            control={form.control}
            name='pdfFile'
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className='form-label'>Book PDF File</FormLabel>
                <FormControl>
                  <div>
                    <input
                      ref={pdfInputRef}
                      type='file'
                      accept='.pdf,application/pdf'
                      className='sr-only'
                      tabIndex={-1}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        field.onChange(file ?? undefined)
                      }}
                    />
                    {field.value ? (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const file = e.dataTransfer.files?.[0]
                          if (file) field.onChange(file)
                        }}
                        className={cn("upload-dropzone w-full border-2 border-dashed border-[var(--border-medium)]", "upload-dropzone-uploaded", fieldState.error && "border-destructive ring-2 ring-destructive/25")}
                      >
                        <div className='flex w-full items-center justify-between gap-3 px-4'>
                          <button type='button' className='upload-dropzone-text min-w-0 flex-1 truncate text-left' onClick={() => pdfInputRef.current?.click()}>
                            {field.value.name}
                          </button>
                          <button
                            type='button'
                            className='upload-dropzone-remove shrink-0'
                            aria-label='Remove PDF'
                            onClick={() => {
                              field.onChange(undefined)
                              if (pdfInputRef.current) pdfInputRef.current.value = ""
                            }}
                          >
                            <X className='size-5' />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        role='button'
                        tabIndex={0}
                        onClick={() => pdfInputRef.current?.click()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            pdfInputRef.current?.click()
                          }
                        }}
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const file = e.dataTransfer.files?.[0]
                          if (file) field.onChange(file)
                        }}
                        className={cn("upload-dropzone w-full border-2 border-dashed border-[var(--border-medium)]", fieldState.error && "border-destructive ring-2 ring-destructive/25")}
                      >
                        <Upload className='upload-dropzone-icon' aria-hidden />
                        <span className='upload-dropzone-text'>Click to upload PDF</span>
                        <span className='upload-dropzone-hint'>PDF file (max 50MB)</span>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='coverImage'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='form-label'>Cover Image (Optional)</FormLabel>
                <FormControl>
                  <div>
                    <input
                      ref={coverInputRef}
                      type='file'
                      accept='image/*'
                      className='sr-only'
                      tabIndex={-1}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        field.onChange(file ?? undefined)
                      }}
                    />
                    {field.value ? (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const file = e.dataTransfer.files?.[0]
                          if (file?.type.startsWith("image/")) field.onChange(file)
                        }}
                        className={cn("upload-dropzone w-full border-2 border-dashed border-[var(--border-medium)]", "upload-dropzone-uploaded")}
                      >
                        <div className='flex w-full items-center justify-between gap-3 px-4'>
                          <button type='button' className='upload-dropzone-text min-w-0 flex-1 truncate text-left' onClick={() => coverInputRef.current?.click()}>
                            {field.value.name}
                          </button>
                          <button
                            type='button'
                            className='upload-dropzone-remove shrink-0'
                            aria-label='Remove cover image'
                            onClick={() => {
                              field.onChange(undefined)
                              if (coverInputRef.current) coverInputRef.current.value = ""
                            }}
                          >
                            <X className='size-5' />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        role='button'
                        tabIndex={0}
                        onClick={() => coverInputRef.current?.click()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            coverInputRef.current?.click()
                          }
                        }}
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const file = e.dataTransfer.files?.[0]
                          if (file?.type.startsWith("image/")) field.onChange(file)
                        }}
                        className={cn("upload-dropzone w-full border-2 border-dashed border-[var(--border-medium)]")}
                      >
                        <ImageIcon className='upload-dropzone-icon' aria-hidden />
                        <span className='upload-dropzone-text'>Click to upload cover image</span>
                        <span className='upload-dropzone-hint'>Leave empty to auto-generate from PDF</span>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='title'
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className='form-label'>Title</FormLabel>
                <FormControl>
                  <input {...field} className={cn("form-input border border-[var(--border-subtle)] shadow-soft-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-warm)]/30", fieldState.error && "border-destructive ring-2 ring-destructive/20")} placeholder='ex: Rich Dad Poor Dad' autoComplete='off' />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='author'
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className='form-label'>Author Name</FormLabel>
                <FormControl>
                  <input {...field} className={cn("form-input border border-[var(--border-subtle)] shadow-soft-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-warm)]/30", fieldState.error && "border-destructive ring-2 ring-destructive/20")} placeholder='ex: Robert Kiyosaki' autoComplete='off' />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='voice'
            render={({ field, fieldState }) => (
              <FormItem className='space-y-4'>
                <FormLabel className='form-label'>Choose Assistant Voice</FormLabel>
                <FormControl>
                  <RadioGroup.Root value={field.value} onValueChange={field.onChange} className={cn("space-y-6 rounded-lg", fieldState.error && "ring-2 ring-destructive/25 ring-offset-2 ring-offset-[var(--bg-primary)]")}>
                    <div>
                      <p className='mb-3 text-sm font-medium text-[var(--text-secondary)]'>Male Voices</p>
                      <div className='voice-selector-options flex-wrap'>
                        {VOICES.male.map((v) => (
                          <RadioGroup.Item key={v.id} value={v.id} className={cn("voice-selector-option voice-selector-option-default !h-auto min-h-[100px] !items-start !justify-start", field.value === v.id && "voice-selector-option-selected")}>
                            <span className='flex w-full shrink-0 items-start gap-3'>
                              <span className='mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 border-[var(--accent-warm)]'>
                                <RadioGroup.Indicator className='flex items-center justify-center'>
                                  <span className='block size-2 rounded-full bg-[var(--color-brand)]' />
                                </RadioGroup.Indicator>
                              </span>
                              <span className='min-w-0 flex-1 text-left'>
                                <span className='block font-bold text-[var(--text-primary)]'>{v.name}</span>
                                <span className='mt-1 block text-sm leading-snug text-[var(--text-secondary)]'>{v.description}</span>
                              </span>
                            </span>
                          </RadioGroup.Item>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className='mb-3 text-sm font-medium text-[var(--text-secondary)]'>Female Voices</p>
                      <div className='voice-selector-options flex-wrap'>
                        {VOICES.female.map((v) => (
                          <RadioGroup.Item key={v.id} value={v.id} className={cn("voice-selector-option voice-selector-option-default !h-auto min-h-[100px] !items-start !justify-start", field.value === v.id && "voice-selector-option-selected")}>
                            <span className='flex w-full shrink-0 items-start gap-3'>
                              <span className='mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 border-[var(--accent-warm)]'>
                                <RadioGroup.Indicator className='flex items-center justify-center'>
                                  <span className='block size-2 rounded-full bg-[var(--color-brand)]' />
                                </RadioGroup.Indicator>
                              </span>
                              <span className='min-w-0 flex-1 text-left'>
                                <span className='block font-bold text-[var(--text-primary)]'>{v.name}</span>
                                <span className='mt-1 block text-sm leading-snug text-[var(--text-secondary)]'>{v.description}</span>
                              </span>
                            </span>
                          </RadioGroup.Item>
                        ))}
                      </div>
                    </div>
                  </RadioGroup.Root>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <button type='submit' className='form-btn' disabled={submitting}>
            Begin Synthesis
          </button>
        </form>
      </Form>
    </div>
  )
}

export default UploadForm
