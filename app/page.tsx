import BookCard from "@/components/BookCard"
import { LibraryHero } from "@/components/LibraryHero"
import { getAllBooks } from "@/lib/actions/book.actions"
import { sampleBooks } from "@/lib/constants"
import { auth } from "@clerk/nextjs/server"

export default async function Page() {
  await auth()

  const booksResults = await getAllBooks()

  const books = booksResults.success ? (booksResults.data ?? []) : []

  return (
    <main className='wrapper container'>
      <LibraryHero />
      <div className='library-books-grid'>
        {books.map((book) => (
          <BookCard key={book._id} book={book} />
        ))}
      </div>
    </main>
  )
}
