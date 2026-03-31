"use client"

import { Show, SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  { label: "Library", href: "/" },
  { label: "Add New", href: "/books/new" },
]

function Navbar() {
  const pathname = usePathname()
  const { user } = useUser()
  return (
    <header className='bg-(--bg-primary) fixed z-50 w-full'>
      <div className='wrapper navbar-height flex items-center justify-between gap-4 py-4'>
        <div className='flex min-w-0 flex-1 items-center justify-start gap-8 md:gap-10'>
          <Link href='/' className='flex shrink-0 items-center gap-0.5'>
            <Image src='/assets/logo.png' alt='Bookified' width={42} height={26} />
            <span className='logo-text'>Bookified</span>
          </Link>

          <nav className='flex  justify-end w-full items-center gap-7.5'>
            {navItems.map(({ label, href }) => {
              const isActive = pathname === href || (href !== "/" && pathname.startsWith(href))
              return (
                <Link key={label} href={href} className={cn("nav-link-base", isActive ? "nav-link-active" : "text-black hover:opacity-70")}>
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className='flex shrink-0 items-center gap-4'>
          <div className='flex shrink-0 items-center gap-3'>
            <Show when='signed-out'>
              <SignInButton />
              <SignUpButton />
            </Show>
          </div>
          <div className='flex gap-2'>
            <Show when='signed-in'>
              <UserButton />
            </Show>
            {user?.firstName && (
              <div className='nav-user-link'>
                <Link href='/subscriptions' className='nav-user-name'>
                  {user.firstName}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
