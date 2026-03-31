import Image from "next/image"
import Link from "next/link"

const steps = [
  { n: 1, title: "Upload PDF", desc: "Add your book file" },
  { n: 2, title: "AI Processing", desc: "We analyze the content" },
  { n: 3, title: "Voice Chat", desc: "Discuss with AI" },
] as const

export function LibraryHero() {
  return (
    <section className='w-full max-w-7xl mb-10 md:mb-16 py-5 mx-auto flex justify-center items-center'>
      <div className='rounded-[28px] bg-[#EEDCC3] px-6 py-12 shadow-[0_4px_24px_rgba(60,48,36,0.08)] sm:px-10 sm:py-14 md:px-12 md:py-16 lg:px-12 lg:py-16 xl:px-14'>
        {/* 1fr | auto | 1fr — równe marginesy wizualne, ilustracja na środku, wszystko w pionie wyśrodkowane */}
        <div className='grid grid-cols-1 items-center gap-10 sm:gap-12 lg:grid-cols-[1fr_auto_1fr] lg:gap-x-8 lg:gap-y-0 xl:gap-x-10'>
          {/* Left — copy + CTA */}
          <div className='flex min-w-0 flex-col gap-5 text-center lg:text-left'>
            <h1 className='font-serif text-4xl font-semibold leading-tight tracking-[-0.02em] text-[#2c2419] md:text-[2.75rem] md:leading-[1.12]'>Your Library</h1>
            <p className='mx-auto max-w-xl font-sans text-base leading-relaxed text-[#3d485e] md:text-lg lg:mx-0'>Convert your books into interactive AI conversations. Listen, learn, and discuss your favorite reads.</p>
            <div className='flex justify-center lg:justify-start'>
              <Link href='/books/new' className='library-cta-primary'>
                + Add new book
              </Link>
            </div>
          </div>

          {/* Center — illustration */}
          <div className='flex min-h-[160px] items-center justify-center lg:min-h-0 lg:px-2'>
            <Image src='/assets/hero-vintage.svg' alt='' width={380} height={290} className='h-auto w-full max-w-[min(100%,300px)] opacity-[0.97] sm:max-w-[min(100%,340px)] lg:max-w-[min(100%,360px)]' priority />
          </div>

          {/* Right — steps card (wyśrodkowana w swojej kolumnie 1fr, nie przyklejona do krawędzi) */}
          <div className='flex justify-center'>
            <div className='w-full max-w-[320px] rounded-2xl border border-[#2c2419]/10 bg-white/95 p-6 shadow-[0_4px_24px_rgba(44,36,25,0.07)] backdrop-blur-[2px] sm:p-7'>
              <p className='mb-5 font-serif text-sm font-semibold uppercase tracking-[0.12em] text-[#5c6578]'>How it works</p>
              <ol className='flex flex-col gap-5'>
                {steps.map(({ n, title, desc }) => (
                  <li key={n} className='flex gap-4'>
                    <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#2c2419] bg-[#fffaf5] font-sans text-sm font-semibold text-[#2c2419]' aria-hidden>
                      {n}
                    </span>
                    <div className='min-w-0 pt-0.5'>
                      <p className='font-sans text-base font-semibold text-[#2c2419]'>{title}</p>
                      <p className='mt-1 font-sans text-sm leading-snug text-[#5c6578]'>{desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
